package kernel_billing

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// FEATURE FLAGS - Fase 28.2-D
// "Rollout gradual: 1 app → 10% → 50% → 100%"
// ========================================

// BillingFeatureFlag controla rollout do billing real
type BillingFeatureFlag struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"uniqueIndex" json:"name"`
	Description string    `json:"description"`
	Enabled     bool      `gorm:"default:false" json:"enabled"`
	Percentage  int       `gorm:"default:0" json:"percentage"` // 0-100 para rollout gradual
	AllowedApps string    `gorm:"type:text" json:"-"`          // JSON array de app_ids
	BlockedApps string    `gorm:"type:text" json:"-"`          // JSON array de app_ids bloqueados
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (BillingFeatureFlag) TableName() string {
	return "billing_feature_flags"
}

// GetAllowedApps retorna lista de apps permitidos
func (f *BillingFeatureFlag) GetAllowedApps() []string {
	if f.AllowedApps == "" {
		return []string{}
	}
	var apps []string
	json.Unmarshal([]byte(f.AllowedApps), &apps)
	return apps
}

// SetAllowedApps define lista de apps permitidos
func (f *BillingFeatureFlag) SetAllowedApps(apps []string) {
	data, _ := json.Marshal(apps)
	f.AllowedApps = string(data)
}

// GetBlockedApps retorna lista de apps bloqueados
func (f *BillingFeatureFlag) GetBlockedApps() []string {
	if f.BlockedApps == "" {
		return []string{}
	}
	var apps []string
	json.Unmarshal([]byte(f.BlockedApps), &apps)
	return apps
}

// ========================================
// FEATURE FLAG SERVICE
// ========================================

type FeatureFlagService struct {
	db    *gorm.DB
	cache map[string]*BillingFeatureFlag
	mu    sync.RWMutex
}

func NewFeatureFlagService(db *gorm.DB) *FeatureFlagService {
	svc := &FeatureFlagService{
		db:    db,
		cache: make(map[string]*BillingFeatureFlag),
	}
	svc.seedDefaultFlags()
	svc.loadCache()
	return svc
}

// seedDefaultFlags cria flags padrão
func (s *FeatureFlagService) seedDefaultFlags() {
	flags := []BillingFeatureFlag{
		{
			ID:          "flag_live_billing",
			Name:        "live_billing",
			Description: "Habilita cobrança real via Stripe (live mode)",
			Enabled:     false,
			Percentage:  0,
		},
		{
			ID:          "flag_auto_dunning",
			Name:        "auto_dunning",
			Description: "Habilita dunning automático (retry de pagamentos)",
			Enabled:     false,
			Percentage:  0,
		},
		{
			ID:          "flag_proration",
			Name:        "proration",
			Description: "Habilita proration em upgrades mid-cycle",
			Enabled:     true,
			Percentage:  100,
		},
		{
			ID:          "flag_quota_enforcement",
			Name:        "quota_enforcement",
			Description: "Habilita bloqueio por quota excedida",
			Enabled:     true,
			Percentage:  100,
		},
	}

	for _, flag := range flags {
		var existing BillingFeatureFlag
		if err := s.db.Where("name = ?", flag.Name).First(&existing).Error; err == gorm.ErrRecordNotFound {
			flag.CreatedAt = time.Now()
			flag.UpdatedAt = time.Now()
			s.db.Create(&flag)
			log.Printf("✅ Feature flag criada: %s", flag.Name)
		}
	}
}

// loadCache carrega flags em memória
func (s *FeatureFlagService) loadCache() {
	var flags []BillingFeatureFlag
	s.db.Find(&flags)

	s.mu.Lock()
	defer s.mu.Unlock()

	for _, f := range flags {
		flag := f // Cópia para evitar problema de ponteiro
		s.cache[f.Name] = &flag
	}
}

// IsEnabled verifica se feature está habilitada para um app
func (s *FeatureFlagService) IsEnabled(flagName, appID string) bool {
	s.mu.RLock()
	flag, exists := s.cache[flagName]
	s.mu.RUnlock()

	if !exists {
		return false
	}

	// Flag desabilitada globalmente
	if !flag.Enabled {
		return false
	}

	// Verificar se app está bloqueado
	for _, blocked := range flag.GetBlockedApps() {
		if blocked == appID {
			return false
		}
	}

	// Verificar se app está na lista de permitidos (whitelist)
	allowedApps := flag.GetAllowedApps()
	if len(allowedApps) > 0 {
		for _, allowed := range allowedApps {
			if allowed == appID {
				return true
			}
		}
		// Se há whitelist e app não está nela, usar percentage
	}

	// Rollout por porcentagem
	if flag.Percentage >= 100 {
		return true
	}
	if flag.Percentage <= 0 {
		return false
	}

	// Hash do appID para distribuição consistente
	hash := hashAppID(appID)
	return hash%100 < flag.Percentage
}

// hashAppID gera hash consistente para rollout
func hashAppID(appID string) int {
	hash := 0
	for _, c := range appID {
		hash = (hash*31 + int(c)) % 10000
	}
	return hash % 100
}

// ========================================
// FLAG MANAGEMENT
// ========================================

// GetAllFlags retorna todas as flags
func (s *FeatureFlagService) GetAllFlags() ([]BillingFeatureFlag, error) {
	var flags []BillingFeatureFlag
	err := s.db.Order("name ASC").Find(&flags).Error
	return flags, err
}

// GetFlag retorna uma flag específica
func (s *FeatureFlagService) GetFlag(name string) (*BillingFeatureFlag, error) {
	var flag BillingFeatureFlag
	err := s.db.Where("name = ?", name).First(&flag).Error
	return &flag, err
}

// UpdateFlag atualiza uma flag
func (s *FeatureFlagService) UpdateFlag(name string, enabled bool, percentage int) error {
	err := s.db.Model(&BillingFeatureFlag{}).
		Where("name = ?", name).
		Updates(map[string]interface{}{
			"enabled":    enabled,
			"percentage": percentage,
			"updated_at": time.Now(),
		}).Error

	if err == nil {
		s.loadCache() // Recarregar cache
	}
	return err
}

// AddAppToWhitelist adiciona app à whitelist de uma flag
func (s *FeatureFlagService) AddAppToWhitelist(flagName, appID string) error {
	flag, err := s.GetFlag(flagName)
	if err != nil {
		return err
	}

	apps := flag.GetAllowedApps()
	// Verificar se já existe
	for _, a := range apps {
		if a == appID {
			return nil
		}
	}

	apps = append(apps, appID)
	flag.SetAllowedApps(apps)
	flag.UpdatedAt = time.Now()

	err = s.db.Save(flag).Error
	if err == nil {
		s.loadCache()
	}
	return err
}

// RemoveAppFromWhitelist remove app da whitelist
func (s *FeatureFlagService) RemoveAppFromWhitelist(flagName, appID string) error {
	flag, err := s.GetFlag(flagName)
	if err != nil {
		return err
	}

	apps := flag.GetAllowedApps()
	newApps := make([]string, 0)
	for _, a := range apps {
		if a != appID {
			newApps = append(newApps, a)
		}
	}

	flag.SetAllowedApps(newApps)
	flag.UpdatedAt = time.Now()

	err = s.db.Save(flag).Error
	if err == nil {
		s.loadCache()
	}
	return err
}

// ========================================
// PILOT APP MANAGEMENT
// ========================================

// PilotApp representa um app em modo piloto
type PilotApp struct {
	ID            string     `gorm:"primaryKey" json:"id"`
	AppID         string     `gorm:"uniqueIndex" json:"app_id"`
	AppName       string     `json:"app_name"`
	Status        string     `gorm:"default:'pending'" json:"status"` // pending, active, paused, completed
	StartedAt     *time.Time `json:"started_at,omitempty"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
	Notes         string     `gorm:"type:text" json:"notes"`
	MetricsJSON   string     `gorm:"type:text" json:"-"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (PilotApp) TableName() string {
	return "pilot_apps"
}

// PilotMetrics métricas do piloto
type PilotMetrics struct {
	TotalTransactions   int64   `json:"total_transactions"`
	TotalRevenue        int64   `json:"total_revenue"` // centavos
	SuccessfulPayments  int     `json:"successful_payments"`
	FailedPayments      int     `json:"failed_payments"`
	WebhooksReceived    int     `json:"webhooks_received"`
	WebhooksProcessed   int     `json:"webhooks_processed"`
	AlertsGenerated     int     `json:"alerts_generated"`
	DivergencesFound    int     `json:"divergences_found"`
	LastActivityAt      *time.Time `json:"last_activity_at,omitempty"`
}

// GetMetrics retorna métricas do piloto
func (p *PilotApp) GetMetrics() PilotMetrics {
	var metrics PilotMetrics
	if p.MetricsJSON != "" {
		json.Unmarshal([]byte(p.MetricsJSON), &metrics)
	}
	return metrics
}

// SetMetrics define métricas do piloto
func (p *PilotApp) SetMetrics(metrics PilotMetrics) {
	data, _ := json.Marshal(metrics)
	p.MetricsJSON = string(data)
}

// PilotService gerencia apps piloto
type PilotService struct {
	db              *gorm.DB
	featureFlagSvc  *FeatureFlagService
	billingService  *KernelBillingService
}

func NewPilotService(db *gorm.DB, featureFlagSvc *FeatureFlagService, billingService *KernelBillingService) *PilotService {
	return &PilotService{
		db:             db,
		featureFlagSvc: featureFlagSvc,
		billingService: billingService,
	}
}

// RegisterPilotApp registra um app como piloto
func (s *PilotService) RegisterPilotApp(appID, appName, notes string) (*PilotApp, error) {
	pilot := PilotApp{
		ID:        uuid.New().String(),
		AppID:     appID,
		AppName:   appName,
		Status:    "pending",
		Notes:     notes,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(&pilot).Error; err != nil {
		return nil, err
	}

	log.Printf("✅ App piloto registrado: %s (%s)", appName, appID)
	return &pilot, nil
}

// ActivatePilot ativa o piloto para um app
func (s *PilotService) ActivatePilot(appID string) error {
	// Adicionar à whitelist do live_billing
	if err := s.featureFlagSvc.AddAppToWhitelist("live_billing", appID); err != nil {
		return err
	}

	now := time.Now()
	return s.db.Model(&PilotApp{}).
		Where("app_id = ?", appID).
		Updates(map[string]interface{}{
			"status":     "active",
			"started_at": &now,
			"updated_at": now,
		}).Error
}

// PausePilot pausa o piloto
func (s *PilotService) PausePilot(appID string) error {
	// Remover da whitelist
	if err := s.featureFlagSvc.RemoveAppFromWhitelist("live_billing", appID); err != nil {
		return err
	}

	return s.db.Model(&PilotApp{}).
		Where("app_id = ?", appID).
		Updates(map[string]interface{}{
			"status":     "paused",
			"updated_at": time.Now(),
		}).Error
}

// CompletePilot marca piloto como concluído
func (s *PilotService) CompletePilot(appID string) error {
	now := time.Now()
	return s.db.Model(&PilotApp{}).
		Where("app_id = ?", appID).
		Updates(map[string]interface{}{
			"status":       "completed",
			"completed_at": &now,
			"updated_at":   now,
		}).Error
}

// GetPilotApps retorna todos os apps piloto
func (s *PilotService) GetPilotApps() ([]PilotApp, error) {
	var pilots []PilotApp
	err := s.db.Order("created_at DESC").Find(&pilots).Error
	return pilots, err
}

// GetActivePilots retorna pilotos ativos
func (s *PilotService) GetActivePilots() ([]PilotApp, error) {
	var pilots []PilotApp
	err := s.db.Where("status = ?", "active").Find(&pilots).Error
	return pilots, err
}

// UpdatePilotMetrics atualiza métricas de um piloto
func (s *PilotService) UpdatePilotMetrics(appID string) error {
	var pilot PilotApp
	if err := s.db.Where("app_id = ?", appID).First(&pilot).Error; err != nil {
		return err
	}

	// Coletar métricas
	metrics := PilotMetrics{}

	// Usage
	usage, _ := s.billingService.GetOrCreateUsage(appID)
	if usage != nil {
		metrics.TotalTransactions = usage.TransactionsCount
		metrics.LastActivityAt = usage.LastEventAt
	}

	// Invoices
	var invoices []KernelInvoice
	s.db.Where("app_id = ?", appID).Find(&invoices)
	for _, inv := range invoices {
		if inv.Status == InvoiceStatusPaid {
			metrics.SuccessfulPayments++
			metrics.TotalRevenue += inv.Total
		} else if inv.Status == InvoiceStatusOverdue {
			metrics.FailedPayments++
		}
	}

	// Webhooks
	var webhookCount int64
	s.db.Model(&KernelProcessedWebhook{}).Where("app_id = ?", appID).Count(&webhookCount)
	metrics.WebhooksReceived = int(webhookCount)

	var processedCount int64
	s.db.Model(&KernelProcessedWebhook{}).Where("app_id = ? AND status = ?", appID, "processed").Count(&processedCount)
	metrics.WebhooksProcessed = int(processedCount)

	// Alerts
	var alertCount int64
	s.db.Model(&KernelBillingAlert{}).Where("app_id = ?", appID).Count(&alertCount)
	metrics.AlertsGenerated = int(alertCount)

	// Divergences
	var divCount int64
	s.db.Model(&ReconciliationDivergence{}).Where("app_id = ?", appID).Count(&divCount)
	metrics.DivergencesFound = int(divCount)

	// Salvar
	pilot.SetMetrics(metrics)
	pilot.UpdatedAt = time.Now()
	return s.db.Save(&pilot).Error
}
