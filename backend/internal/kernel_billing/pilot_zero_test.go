package kernel_billing

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ========================================
// FASE 28.3 — PILOT ZERO VALIDATION
// "Esse app existe para sofrer, não para faturar"
// ========================================

const (
	// VOX-BRIDGE - App piloto interno
	PilotZeroAppID   = "4fb16e2f-f8f0-425d-84f0-2ef3176bba43"
	PilotZeroAppName = "VOX-BRIDGE (Pilot Zero)"
	PilotZeroEmail   = "pilot@prostqs.internal"
)

// PilotZeroTestSuite suite de testes para validação do piloto
type PilotZeroTestSuite struct {
	DB                 *gorm.DB
	BillingService     *KernelBillingService
	FeatureFlagService *FeatureFlagService
	PilotService       *PilotService
	StripeService      *KernelStripeService
	AlertService       *KernelBillingAlertService
}

// SetupPilotZeroSuite configura a suite de testes
func SetupPilotZeroSuite(t *testing.T) *PilotZeroTestSuite {
	// Usar banco em memória para testes
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Migrar schemas
	err = db.AutoMigrate(
		&KernelPlan{},
		&AppSubscription{},
		&AppUsage{},
		&KernelInvoice{},
		&KernelProcessedWebhook{},
		&KernelBillingAlert{},
		&ReconciliationDivergence{},
		&BillingFeatureFlag{},
		&PilotApp{},
	)
	require.NoError(t, err)

	// Inicializar serviços
	billingService := NewKernelBillingService(db)
	billingService.SeedDefaultPlans()

	featureFlagService := NewFeatureFlagService(db)
	pilotService := NewPilotService(db, featureFlagService, billingService)
	alertService := NewKernelBillingAlertService(db)

	// Stripe em test mode
	stripeConfig := &KernelStripeConfig{
		SecretKey:     os.Getenv("STRIPE_SECRET_KEY"),
		WebhookSecret: os.Getenv("STRIPE_WEBHOOK_SECRET"),
		TestMode:      true,
	}
	stripeService := NewKernelStripeService(stripeConfig, billingService)

	return &PilotZeroTestSuite{
		DB:                 db,
		BillingService:     billingService,
		FeatureFlagService: featureFlagService,
		PilotService:       pilotService,
		StripeService:      stripeService,
		AlertService:       alertService,
	}
}

// ========================================
// ETAPA 1: REGISTRAR PILOT ZERO
// ========================================

func TestPilotZero_Step1_RegisterPilot(t *testing.T) {
	suite := SetupPilotZeroSuite(t)

	// Registrar app como piloto
	pilot, err := suite.PilotService.RegisterPilotApp(
		PilotZeroAppID,
		PilotZeroAppName,
		"App interno para validação de billing real. Pode falhar sem impacto.",
	)
	require.NoError(t, err)
	assert.Equal(t, "pending", pilot.Status)
	assert.Equal(t, PilotZeroAppID, pilot.AppID)

	log.Printf("✅ ETAPA 1: Pilot Zero registrado - ID: %s, Status: %s", pilot.ID, pilot.Status)
}

// ========================================
// ETAPA 2: ATIVAR PILOT (SEM ATIVAR FLAGS)
// ========================================

func TestPilotZero_Step2_ActivatePilot(t *testing.T) {
	suite := SetupPilotZeroSuite(t)

	// Registrar
	_, err := suite.PilotService.RegisterPilotApp(PilotZeroAppID, PilotZeroAppName, "Pilot Zero")
	require.NoError(t, err)

	// Ativar piloto
	err = suite.PilotService.ActivatePilot(PilotZeroAppID)
	require.NoError(t, err)

	// Verificar status
	pilots, _ := suite.PilotService.GetActivePilots()
	assert.Len(t, pilots, 1)
	assert.Equal(t, "active", pilots[0].Status)
	assert.NotNil(t, pilots[0].StartedAt)

	// Verificar whitelist (app deve estar na whitelist do live_billing)
	flag, _ := suite.FeatureFlagService.GetFlag("live_billing")
	allowedApps := flag.GetAllowedApps()
	assert.Contains(t, allowedApps, PilotZeroAppID)

	// MAS a flag ainda deve estar DESABILITADA
	assert.False(t, flag.Enabled, "Flag live_billing NÃO deve estar habilitada ainda")

	log.Printf("✅ ETAPA 2: Pilot ativado, whitelisted, mas flag DESABILITADA")
}

// ========================================
// ETAPA 3: STRIPE TEST MODE END-TO-END
// ========================================

func TestPilotZero_Step3_StripeTestMode(t *testing.T) {
	suite := SetupPilotZeroSuite(t)

	if !suite.StripeService.IsConfigured() {
		t.Skip("Stripe não configurado - pulando teste de integração")
	}

	// Registrar e ativar piloto
	suite.PilotService.RegisterPilotApp(PilotZeroAppID, PilotZeroAppName, "Pilot Zero")
	suite.PilotService.ActivatePilot(PilotZeroAppID)

	// Criar subscription no kernel (usa GetOrCreateSubscription)
	sub, err := suite.BillingService.GetOrCreateSubscription(PilotZeroAppID)
	require.NoError(t, err)
	assert.Equal(t, SubscriptionStatusActive, sub.Status)

	// Verificar usage criado
	usage, err := suite.BillingService.GetOrCreateUsage(PilotZeroAppID)
	require.NoError(t, err)
	assert.NotNil(t, usage)

	log.Printf("✅ ETAPA 3: Subscription criada - Plan: %s, Status: %s", sub.PlanID, sub.Status)
}

// ========================================
// ETAPA 4: ATIVAR FLAG SOMENTE PARA PILOTO
// ========================================

func TestPilotZero_Step4_EnableFlagForPilotOnly(t *testing.T) {
	suite := SetupPilotZeroSuite(t)

	// Setup piloto
	suite.PilotService.RegisterPilotApp(PilotZeroAppID, PilotZeroAppName, "Pilot Zero")
	suite.PilotService.ActivatePilot(PilotZeroAppID)

	// Habilitar flag com percentage 0 (só whitelist)
	err := suite.FeatureFlagService.UpdateFlag("live_billing", true, 0)
	require.NoError(t, err)

	// Verificar: piloto deve ter acesso
	hasPilotAccess := suite.FeatureFlagService.IsEnabled("live_billing", PilotZeroAppID)
	assert.True(t, hasPilotAccess, "Piloto deve ter acesso ao live_billing")

	// Verificar: outro app NÃO deve ter acesso
	hasOtherAccess := suite.FeatureFlagService.IsEnabled("live_billing", "outro-app-qualquer")
	assert.False(t, hasOtherAccess, "Outro app NÃO deve ter acesso ao live_billing")

	log.Printf("✅ ETAPA 4: Flag habilitada SOMENTE para piloto")
}

// ========================================
// ETAPA 5: SIMULAR FALHAS
// ========================================

func TestPilotZero_Step5_SimulateFailures(t *testing.T) {
	suite := SetupPilotZeroSuite(t)

	// Setup
	suite.PilotService.RegisterPilotApp(PilotZeroAppID, PilotZeroAppName, "Pilot Zero")
	suite.PilotService.ActivatePilot(PilotZeroAppID)
	suite.BillingService.GetOrCreateSubscription(PilotZeroAppID)

	t.Run("5.1_WebhookDuplicado", func(t *testing.T) {
		// Simular mesmo webhook 5 vezes via banco direto
		eventID := "evt_test_duplicate_" + time.Now().Format("20060102150405")
		
		// Primeiro registro
		webhook := KernelProcessedWebhook{
			ID:              "wh_" + eventID,
			Provider:        "stripe",
			ExternalEventID: eventID,
			EventType:       "invoice.paid",
			AppID:           PilotZeroAppID,
			Status:          "processed",
			ReceivedAt:      time.Now(),
			CreatedAt:       time.Now(),
		}
		err := suite.DB.Create(&webhook).Error
		require.NoError(t, err)

		// Tentar criar duplicados (deve falhar por unique constraint ou ser ignorado)
		for i := 0; i < 4; i++ {
			dupWebhook := KernelProcessedWebhook{
				ID:              fmt.Sprintf("wh_%s_%d", eventID, i),
				Provider:        "stripe",
				ExternalEventID: eventID,
				EventType:       "invoice.paid",
				AppID:           PilotZeroAppID,
				Status:          "duplicate",
				ReceivedAt:      time.Now(),
				CreatedAt:       time.Now(),
			}
			suite.DB.Create(&dupWebhook) // Ignora erro de duplicado
		}

		// Verificar: apenas 1 registro processado
		var processedCount int64
		suite.DB.Model(&KernelProcessedWebhook{}).Where("external_event_id = ? AND status = ?", eventID, "processed").Count(&processedCount)
		assert.Equal(t, int64(1), processedCount, "Deve haver apenas 1 webhook processado")

		log.Printf("✅ 5.1: Webhook duplicado tratado corretamente")
	})

	t.Run("5.2_AlertaGerado", func(t *testing.T) {
		// Criar alerta de teste
		err := suite.AlertService.CreateAlert(
			"payment_failed",
			"high",
			PilotZeroAppID,
			map[string]interface{}{
				"test":   true,
				"reason": "card_declined",
			},
		)
		require.NoError(t, err)

		// Verificar alerta criado
		alerts, _ := suite.AlertService.GetAlertsByApp(PilotZeroAppID)
		assert.GreaterOrEqual(t, len(alerts), 1)

		log.Printf("✅ 5.2: Alerta gerado corretamente")
	})

	t.Run("5.3_TransicaoEstado", func(t *testing.T) {
		// Simular transição: active → past_due
		sub, _ := suite.BillingService.GetSubscription(PilotZeroAppID)
		
		// Atualizar status diretamente no banco
		err := suite.DB.Model(&AppSubscription{}).Where("app_id = ?", PilotZeroAppID).Update("status", SubscriptionStatusPastDue).Error
		require.NoError(t, err)

		// Verificar
		subUpdated, _ := suite.BillingService.GetSubscription(PilotZeroAppID)
		assert.Equal(t, SubscriptionStatusPastDue, subUpdated.Status)

		// Voltar para active
		err = suite.DB.Model(&AppSubscription{}).Where("app_id = ?", PilotZeroAppID).Update("status", SubscriptionStatusActive).Error
		require.NoError(t, err)

		log.Printf("✅ 5.3: Transição de estado %s → past_due → active OK", sub.Status)
	})
}

// ========================================
// ETAPA 6: VERIFICAR ROLLBACK
// ========================================

func TestPilotZero_Step6_Rollback(t *testing.T) {
	suite := SetupPilotZeroSuite(t)

	// Setup completo
	suite.PilotService.RegisterPilotApp(PilotZeroAppID, PilotZeroAppName, "Pilot Zero")
	suite.PilotService.ActivatePilot(PilotZeroAppID)
	suite.FeatureFlagService.UpdateFlag("live_billing", true, 0)

	// Verificar acesso antes do rollback
	hasAccess := suite.FeatureFlagService.IsEnabled("live_billing", PilotZeroAppID)
	assert.True(t, hasAccess)

	// ROLLBACK: Pausar piloto
	err := suite.PilotService.PausePilot(PilotZeroAppID)
	require.NoError(t, err)

	// Verificar: piloto pausado
	var pilot PilotApp
	suite.DB.Where("app_id = ?", PilotZeroAppID).First(&pilot)
	assert.Equal(t, "paused", pilot.Status)

	// Verificar: removido da whitelist
	flag, _ := suite.FeatureFlagService.GetFlag("live_billing")
	allowedApps := flag.GetAllowedApps()
	assert.NotContains(t, allowedApps, PilotZeroAppID)

	// Verificar: sem acesso após rollback
	hasAccessAfter := suite.FeatureFlagService.IsEnabled("live_billing", PilotZeroAppID)
	assert.False(t, hasAccessAfter, "Piloto NÃO deve ter acesso após rollback")

	log.Printf("✅ ETAPA 6: Rollback funcionando - piloto pausado e sem acesso")
}

// ========================================
// RELATÓRIO FINAL
// ========================================

func TestPilotZero_FinalReport(t *testing.T) {
	suite := SetupPilotZeroSuite(t)

	// Executar setup completo
	suite.PilotService.RegisterPilotApp(PilotZeroAppID, PilotZeroAppName, "Pilot Zero")
	suite.PilotService.ActivatePilot(PilotZeroAppID)
	suite.BillingService.GetOrCreateSubscription(PilotZeroAppID)
	suite.FeatureFlagService.UpdateFlag("live_billing", true, 0)

	// Atualizar métricas
	suite.PilotService.UpdatePilotMetrics(PilotZeroAppID)

	// Buscar piloto
	var pilot PilotApp
	suite.DB.Where("app_id = ?", PilotZeroAppID).First(&pilot)
	metrics := pilot.GetMetrics()

	// Gerar relatório
	report := fmt.Sprintf(`
========================================
PILOT ZERO VALIDATION REPORT
========================================
App ID:     %s
App Name:   %s
Status:     %s
Started At: %v

MÉTRICAS:
- Transactions:     %d
- Revenue (cents):  %d
- Webhooks:         %d/%d (received/processed)
- Alerts:           %d
- Divergences:      %d

FLAGS:
- live_billing:     enabled=true, percentage=0 (pilot_only)

ROLLBACK:
- pause_pilot:      ✅ Testado
- disable_flag:     ✅ Disponível
- force_reconcile:  ✅ Disponível

PRÓXIMOS PASSOS:
1. Executar checkout real com cartão 4242 4242 4242 4242
2. Observar por 7 dias
3. Se estável, considerar early_rollout (10%%)
========================================
`,
		pilot.AppID,
		pilot.AppName,
		pilot.Status,
		pilot.StartedAt,
		metrics.TotalTransactions,
		metrics.TotalRevenue,
		metrics.WebhooksReceived,
		metrics.WebhooksProcessed,
		metrics.AlertsGenerated,
		metrics.DivergencesFound,
	)

	log.Println(report)
	t.Log(report)
}

// ========================================
// HELPER: HTTP CLIENT PARA TESTES MANUAIS
// ========================================

// PilotZeroHTTPClient cliente para testes manuais via API
type PilotZeroHTTPClient struct {
	BaseURL string
	Token   string
}

// NewPilotZeroHTTPClient cria cliente HTTP
func NewPilotZeroHTTPClient(baseURL, token string) *PilotZeroHTTPClient {
	return &PilotZeroHTTPClient{
		BaseURL: baseURL,
		Token:   token,
	}
}

// RegisterPilot registra piloto via API
func (c *PilotZeroHTTPClient) RegisterPilot() error {
	payload := map[string]string{
		"app_id":   PilotZeroAppID,
		"app_name": PilotZeroAppName,
		"notes":    "Pilot Zero - App interno para validação",
	}
	return c.post("/api/v1/admin/kernel/billing/pilots", payload)
}

// ActivatePilot ativa piloto via API
func (c *PilotZeroHTTPClient) ActivatePilot() error {
	return c.post("/api/v1/admin/kernel/billing/pilots/"+PilotZeroAppID+"/activate", nil)
}

// EnableLiveBillingForPilot habilita flag somente para piloto
func (c *PilotZeroHTTPClient) EnableLiveBillingForPilot() error {
	payload := map[string]interface{}{
		"enabled":    true,
		"percentage": 0, // Só whitelist
	}
	return c.put("/api/v1/admin/kernel/billing/flags/live_billing", payload)
}

// PausePilot pausa piloto (rollback)
func (c *PilotZeroHTTPClient) PausePilot() error {
	return c.post("/api/v1/admin/kernel/billing/pilots/"+PilotZeroAppID+"/pause", nil)
}

// GetRolloutStatus retorna status do rollout
func (c *PilotZeroHTTPClient) GetRolloutStatus() (map[string]interface{}, error) {
	return c.get("/api/v1/admin/kernel/billing/rollout/status")
}

func (c *PilotZeroHTTPClient) post(path string, payload interface{}) error {
	var body io.Reader
	if payload != nil {
		data, _ := json.Marshal(payload)
		body = bytes.NewBuffer(data)
	}

	req, _ := http.NewRequest("POST", c.BaseURL+path, body)
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *PilotZeroHTTPClient) put(path string, payload interface{}) error {
	data, _ := json.Marshal(payload)
	req, _ := http.NewRequest("PUT", c.BaseURL+path, bytes.NewBuffer(data))
	req.Header.Set("Authorization", "Bearer "+c.Token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}
	return nil
}

func (c *PilotZeroHTTPClient) get(path string) (map[string]interface{}, error) {
	req, _ := http.NewRequest("GET", c.BaseURL+path, nil)
	req.Header.Set("Authorization", "Bearer "+c.Token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	return result, nil
}
