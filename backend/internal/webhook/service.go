package webhook

/*
================================================================================
WEBHOOK SERVICE — NOTIFICAÇÕES PARA APPS EXTERNOS
================================================================================

Permite que apps recebam notificações em tempo real sobre eventos:
- Eventos de usuário (login, registro, etc.)
- Eventos de billing (pagamento, cancelamento)
- Eventos de sistema (alertas, incidentes)

"O Kernel avisa, o app decide o que fazer"

================================================================================
*/

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WebhookEventType tipos de eventos
type WebhookEventType string

const (
	// User events
	EventUserCreated       WebhookEventType = "user.created"
	EventUserUpdated       WebhookEventType = "user.updated"
	EventUserDeleted       WebhookEventType = "user.deleted"
	EventUserLogin         WebhookEventType = "user.login"
	EventUserLogout        WebhookEventType = "user.logout"

	// Billing events
	EventSubscriptionCreated  WebhookEventType = "subscription.created"
	EventSubscriptionUpdated  WebhookEventType = "subscription.updated"
	EventSubscriptionCanceled WebhookEventType = "subscription.canceled"
	EventPaymentSucceeded     WebhookEventType = "payment.succeeded"
	EventPaymentFailed        WebhookEventType = "payment.failed"

	// App events
	EventAppMembershipCreated WebhookEventType = "app.membership.created"
	EventAppMembershipRemoved WebhookEventType = "app.membership.removed"

	// System events
	EventAlertTriggered WebhookEventType = "alert.triggered"
	EventIncidentCreated WebhookEventType = "incident.created"
)

// WebhookEndpoint representa um endpoint de webhook configurado
type WebhookEndpoint struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	AppID       uuid.UUID `gorm:"type:uuid;index;not null" json:"app_id"`
	URL         string    `gorm:"size:500;not null" json:"url"`
	Secret      string    `gorm:"size:64;not null" json:"-"` // Nunca expor
	Events      string    `gorm:"type:text" json:"events"`   // JSON array
	Description string    `gorm:"size:255" json:"description"`
	Status      string    `gorm:"size:20;default:active" json:"status"` // active, disabled, failed
	FailCount   int       `gorm:"default:0" json:"fail_count"`
	LastSuccess *time.Time `json:"last_success,omitempty"`
	LastFailure *time.Time `json:"last_failure,omitempty"`
	LastError   string    `gorm:"size:500" json:"last_error,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// WebhookDelivery representa uma tentativa de entrega
type WebhookDelivery struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	EndpointID   uuid.UUID `gorm:"type:uuid;index;not null" json:"endpoint_id"`
	EventType    string    `gorm:"size:100;index" json:"event_type"`
	Payload      string    `gorm:"type:text" json:"payload"`
	ResponseCode int       `json:"response_code"`
	ResponseBody string    `gorm:"type:text" json:"response_body,omitempty"`
	Duration     int64     `json:"duration_ms"`
	Success      bool      `json:"success"`
	Attempt      int       `json:"attempt"`
	Error        string    `gorm:"size:500" json:"error,omitempty"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

// WebhookService serviço de webhooks
type WebhookService struct {
	db         *gorm.DB
	httpClient *http.Client
}

// NewWebhookService cria novo serviço
func NewWebhookService(db *gorm.DB) *WebhookService {
	db.AutoMigrate(&WebhookEndpoint{}, &WebhookDelivery{})
	
	return &WebhookService{
		db: db,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// CreateEndpoint cria um novo endpoint de webhook
func (s *WebhookService) CreateEndpoint(appID uuid.UUID, url string, events []WebhookEventType, description string) (*WebhookEndpoint, string, error) {
	// Gerar secret
	secret := generateWebhookSecret()
	
	eventsJSON, _ := json.Marshal(events)
	
	endpoint := &WebhookEndpoint{
		ID:          uuid.New(),
		AppID:       appID,
		URL:         url,
		Secret:      hashWebhookSecret(secret),
		Events:      string(eventsJSON),
		Description: description,
		Status:      "active",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	
	if err := s.db.Create(endpoint).Error; err != nil {
		return nil, "", fmt.Errorf("erro ao criar endpoint: %w", err)
	}
	
	// Retorna o secret apenas uma vez
	return endpoint, secret, nil
}

// GetEndpoint busca endpoint por ID
func (s *WebhookService) GetEndpoint(id uuid.UUID) (*WebhookEndpoint, error) {
	var endpoint WebhookEndpoint
	if err := s.db.Where("id = ?", id).First(&endpoint).Error; err != nil {
		return nil, err
	}
	return &endpoint, nil
}

// ListEndpoints lista endpoints de um app
func (s *WebhookService) ListEndpoints(appID uuid.UUID) ([]WebhookEndpoint, error) {
	var endpoints []WebhookEndpoint
	err := s.db.Where("app_id = ?", appID).Order("created_at DESC").Find(&endpoints).Error
	return endpoints, err
}

// UpdateEndpoint atualiza um endpoint
func (s *WebhookService) UpdateEndpoint(id uuid.UUID, url string, events []WebhookEventType, description string) (*WebhookEndpoint, error) {
	eventsJSON, _ := json.Marshal(events)
	
	updates := map[string]interface{}{
		"url":         url,
		"events":      string(eventsJSON),
		"description": description,
		"updated_at":  time.Now(),
	}
	
	if err := s.db.Model(&WebhookEndpoint{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	
	return s.GetEndpoint(id)
}

// DeleteEndpoint remove um endpoint
func (s *WebhookService) DeleteEndpoint(id uuid.UUID) error {
	return s.db.Delete(&WebhookEndpoint{}, "id = ?", id).Error
}

// DisableEndpoint desabilita um endpoint
func (s *WebhookService) DisableEndpoint(id uuid.UUID) error {
	return s.db.Model(&WebhookEndpoint{}).Where("id = ?", id).Update("status", "disabled").Error
}

// EnableEndpoint habilita um endpoint
func (s *WebhookService) EnableEndpoint(id uuid.UUID) error {
	return s.db.Model(&WebhookEndpoint{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":     "active",
		"fail_count": 0,
	}).Error
}

// RotateSecret gera um novo secret para o endpoint
func (s *WebhookService) RotateSecret(id uuid.UUID) (string, error) {
	newSecret := generateWebhookSecret()
	
	err := s.db.Model(&WebhookEndpoint{}).Where("id = ?", id).Updates(map[string]interface{}{
		"secret":     hashWebhookSecret(newSecret),
		"updated_at": time.Now(),
	}).Error
	
	if err != nil {
		return "", err
	}
	
	return newSecret, nil
}

// SendWebhook envia um webhook para todos os endpoints que escutam o evento
func (s *WebhookService) SendWebhook(appID uuid.UUID, eventType WebhookEventType, payload map[string]interface{}) error {
	// Buscar endpoints ativos que escutam este evento
	var endpoints []WebhookEndpoint
	err := s.db.Where("app_id = ? AND status = ?", appID, "active").Find(&endpoints).Error
	if err != nil {
		return err
	}
	
	for _, endpoint := range endpoints {
		// Verificar se o endpoint escuta este evento
		var events []string
		json.Unmarshal([]byte(endpoint.Events), &events)
		
		if !containsEvent(events, string(eventType)) {
			continue
		}
		
		// Enviar webhook em goroutine
		go s.deliverWebhook(endpoint, eventType, payload)
	}
	
	return nil
}

// deliverWebhook entrega um webhook com retry
func (s *WebhookService) deliverWebhook(endpoint WebhookEndpoint, eventType WebhookEventType, payload map[string]interface{}) {
	// Preparar payload
	webhookPayload := map[string]interface{}{
		"id":         uuid.New().String(),
		"type":       eventType,
		"created_at": time.Now().UTC().Format(time.RFC3339),
		"data":       payload,
	}
	
	payloadBytes, _ := json.Marshal(webhookPayload)
	
	// Tentar até 3 vezes
	maxAttempts := 3
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		delivery := s.attemptDelivery(endpoint, eventType, payloadBytes, attempt)
		
		// Salvar delivery
		s.db.Create(&delivery)
		
		if delivery.Success {
			// Atualizar endpoint com sucesso
			now := time.Now()
			s.db.Model(&endpoint).Updates(map[string]interface{}{
				"last_success": now,
				"fail_count":   0,
				"status":       "active",
			})
			return
		}
		
		// Esperar antes de retry (exponential backoff)
		if attempt < maxAttempts {
			time.Sleep(time.Duration(attempt*attempt) * time.Second)
		}
	}
	
	// Todas as tentativas falharam
	now := time.Now()
	newFailCount := endpoint.FailCount + 1
	status := "active"
	if newFailCount >= 5 {
		status = "failed" // Desabilitar após 5 falhas consecutivas
	}
	
	s.db.Model(&endpoint).Updates(map[string]interface{}{
		"last_failure": now,
		"fail_count":   newFailCount,
		"status":       status,
	})
}

// attemptDelivery tenta entregar o webhook
func (s *WebhookService) attemptDelivery(endpoint WebhookEndpoint, eventType WebhookEventType, payload []byte, attempt int) WebhookDelivery {
	delivery := WebhookDelivery{
		ID:         uuid.New(),
		EndpointID: endpoint.ID,
		EventType:  string(eventType),
		Payload:    string(payload),
		Attempt:    attempt,
		CreatedAt:  time.Now(),
	}
	
	// Criar request
	req, err := http.NewRequest("POST", endpoint.URL, bytes.NewBuffer(payload))
	if err != nil {
		delivery.Error = err.Error()
		return delivery
	}
	
	// Headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-ID", delivery.ID.String())
	req.Header.Set("X-Webhook-Event", string(eventType))
	req.Header.Set("X-Webhook-Timestamp", fmt.Sprintf("%d", time.Now().Unix()))
	
	// Assinatura HMAC
	signature := computeSignature(payload, endpoint.Secret)
	req.Header.Set("X-Webhook-Signature", signature)
	
	// Enviar
	start := time.Now()
	resp, err := s.httpClient.Do(req)
	delivery.Duration = time.Since(start).Milliseconds()
	
	if err != nil {
		delivery.Error = err.Error()
		return delivery
	}
	defer resp.Body.Close()
	
	delivery.ResponseCode = resp.StatusCode
	
	// Ler resposta (limitado a 1KB)
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
	delivery.ResponseBody = string(body)
	
	// Sucesso se 2xx
	delivery.Success = resp.StatusCode >= 200 && resp.StatusCode < 300
	
	if !delivery.Success {
		delivery.Error = fmt.Sprintf("HTTP %d", resp.StatusCode)
	}
	
	return delivery
}

// GetDeliveries retorna histórico de entregas de um endpoint
func (s *WebhookService) GetDeliveries(endpointID uuid.UUID, limit int) ([]WebhookDelivery, error) {
	var deliveries []WebhookDelivery
	err := s.db.Where("endpoint_id = ?", endpointID).
		Order("created_at DESC").
		Limit(limit).
		Find(&deliveries).Error
	return deliveries, err
}

// GetEndpointStats retorna estatísticas de um endpoint
func (s *WebhookService) GetEndpointStats(endpointID uuid.UUID) (*EndpointStats, error) {
	stats := &EndpointStats{EndpointID: endpointID}
	
	// Total de entregas
	s.db.Model(&WebhookDelivery{}).Where("endpoint_id = ?", endpointID).Count(&stats.TotalDeliveries)
	
	// Entregas com sucesso
	s.db.Model(&WebhookDelivery{}).Where("endpoint_id = ? AND success = ?", endpointID, true).Count(&stats.SuccessfulDeliveries)
	
	// Entregas falhadas
	stats.FailedDeliveries = stats.TotalDeliveries - stats.SuccessfulDeliveries
	
	// Taxa de sucesso
	if stats.TotalDeliveries > 0 {
		stats.SuccessRate = float64(stats.SuccessfulDeliveries) / float64(stats.TotalDeliveries) * 100
	}
	
	// Latência média
	var avgDuration float64
	s.db.Model(&WebhookDelivery{}).
		Where("endpoint_id = ? AND success = ?", endpointID, true).
		Select("AVG(duration)").
		Scan(&avgDuration)
	stats.AvgLatencyMs = avgDuration
	
	return stats, nil
}

// EndpointStats estatísticas de endpoint
type EndpointStats struct {
	EndpointID           uuid.UUID `json:"endpoint_id"`
	TotalDeliveries      int64     `json:"total_deliveries"`
	SuccessfulDeliveries int64     `json:"successful_deliveries"`
	FailedDeliveries     int64     `json:"failed_deliveries"`
	SuccessRate          float64   `json:"success_rate"`
	AvgLatencyMs         float64   `json:"avg_latency_ms"`
}

// TestEndpoint envia um webhook de teste
func (s *WebhookService) TestEndpoint(id uuid.UUID) (*WebhookDelivery, error) {
	endpoint, err := s.GetEndpoint(id)
	if err != nil {
		return nil, err
	}
	
	testPayload := map[string]interface{}{
		"message": "This is a test webhook",
		"test":    true,
	}
	
	payloadBytes, _ := json.Marshal(map[string]interface{}{
		"id":         uuid.New().String(),
		"type":       "test",
		"created_at": time.Now().UTC().Format(time.RFC3339),
		"data":       testPayload,
	})
	
	delivery := s.attemptDelivery(*endpoint, "test", payloadBytes, 1)
	s.db.Create(&delivery)
	
	return &delivery, nil
}

// Helpers

func generateWebhookSecret() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func hashWebhookSecret(secret string) string {
	hash := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(hash[:])
}

func computeSignature(payload []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	return hex.EncodeToString(mac.Sum(nil))
}

func containsEvent(events []string, event string) bool {
	for _, e := range events {
		if e == event || e == "*" {
			return true
		}
	}
	return false
}
