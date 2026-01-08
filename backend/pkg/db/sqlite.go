package db

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	legacyad "prost-qs/backend/internal/ad"
	"prost-qs/backend/internal/ads"
	"prost-qs/backend/internal/agent"
	"prost-qs/backend/internal/ai"
	"prost-qs/backend/internal/application"
	"prost-qs/backend/internal/approval"
	"prost-qs/backend/internal/audit"
	"prost-qs/backend/internal/authority"
	"prost-qs/backend/internal/autonomy"
	"prost-qs/backend/internal/billing"
	"prost-qs/backend/internal/event"
	"prost-qs/backend/internal/explainability"
	"prost-qs/backend/internal/federation"
	"prost-qs/backend/internal/financial"
	"prost-qs/backend/internal/identity"
	kernel_billing "prost-qs/backend/internal/kernel_billing"
	"prost-qs/backend/internal/jobs"
	"prost-qs/backend/internal/killswitch"
	"prost-qs/backend/internal/memory"
	"prost-qs/backend/internal/observer"
	"prost-qs/backend/internal/payment"
	"prost-qs/backend/internal/policy"
	"prost-qs/backend/internal/replication"
	"prost-qs/backend/internal/risk"
	"prost-qs/backend/internal/secrets"
	"prost-qs/backend/internal/shadow"
)

// InitSQLite inicializa a conexão com o banco de dados SQLite.
func InitSQLite(dbPath string) (*gorm.DB, error) {
	// Garantir que o diretório para o arquivo SQLite exista
	dir := filepath.Dir(dbPath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err := os.MkdirAll(dir, 0755)
		if err != nil {
			return nil, fmt.Errorf("falha ao criar diretório para SQLite: %w", err)
		}
	}

	gormDB, err := gorm.Open(sqlite.Open(dbPath+"?_journal_mode=WAL"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // Logar consultas SQL
	})
	if err != nil {
		return nil, fmt.Errorf("falha ao conectar ao banco de dados SQLite: %w", err)
	}

	log.Printf("Conectado ao SQLite em: %s", dbPath)
	return gormDB, nil
}

// MigrateSchema executa as migrações automáticas para todos os modelos.
func MigrateSchema(db *gorm.DB) error {
	log.Println("Iniciando migrações do schema...")
	err := db.AutoMigrate(
		// Legacy models (serão deprecados)
		&identity.User{},
		
		// ========================================
		// USER MODELS - Identidade Real (FASE 10)
		// ========================================
		&identity.UserProfile{},
		&identity.AuthMethod{},
		
		// Core models
		&event.Event{},
		&payment.Payment{},
		&ai.AISchemaVersion{},
		&replication.ReplicationState{},
		&legacyad.Ad{},
		
		// ========================================
		// IDENTITY KERNEL - Sovereign Models
		// ========================================
		&identity.SovereignIdentity{},
		&identity.IdentityLink{},
		&identity.PendingVerification{},
		&identity.SovereignSession{},
		&identity.RateLimitEntry{},

		// ========================================
		// ECONOMIC KERNEL - Billing Models
		// ========================================
		&billing.BillingAccount{},
		&billing.PaymentIntent{},
		&billing.Subscription{},
		&billing.LedgerEntry{},
		&billing.Payout{},
		&billing.ProcessedWebhook{},
		&billing.ReconciliationLog{},
		&billing.SubscriptionStateTransition{},

		// ========================================
		// FEDERATION KERNEL - OAuth Models
		// ========================================
		&federation.OAuthState{},
		&federation.FederatedIdentity{},

		// ========================================
		// JOBS - Fila Interna
		// ========================================
		&jobs.Job{},
		&jobs.DeadLetterJob{},

		// ========================================
		// ADS MODULE - Economic Extension
		// ========================================
		&ads.AdAccount{},
		&ads.AdBudget{},
		&ads.AdCampaign{},
		&ads.AdSpendEvent{},
		&ads.AdGovernanceLimit{},

		// ========================================
		// AGENT GOVERNANCE LAYER
		// ========================================
		&agent.Agent{},
		&agent.AgentPolicy{},
		&agent.AgentDecision{},
		&agent.AgentExecutionLog{},
		&agent.AgentDailyStats{},

		// ========================================
		// POLICY ENGINE - Fase 11
		// ========================================
		&policy.Policy{},
		&policy.PolicyEvaluation{},

		// ========================================
		// POLICY THRESHOLDS - Fase 17 Step 2
		// ========================================
		&policy.PolicyThreshold{},
		&policy.ThresholdAdjustment{},

		// ========================================
		// AUDIT LOG - Fase 11
		// ========================================
		&audit.AuditEvent{},

		// ========================================
		// KILL SWITCH - Fase 11
		// ========================================
		&killswitch.KillSwitch{},

		// ========================================
		// AUTONOMY - Fase 12
		// ========================================
		&autonomy.AutonomyProfile{},

		// ========================================
		// SHADOW MODE - Fase 12.2
		// ========================================
		&shadow.ShadowExecution{},

		// ========================================
		// AUTHORITY - Fase 13
		// ========================================
		&authority.DecisionAuthority{},

		// ========================================
		// APPROVAL - Fase 13
		// ========================================
		&approval.ApprovalRequest{},
		&approval.ApprovalDecision{},

		// ========================================
		// INSTITUTIONAL MEMORY - Fase 14
		// ========================================
		&memory.DecisionLifecycle{},
		&memory.DecisionConflict{},
		&memory.DecisionPrecedent{},
		&memory.DecisionReview{},
		&memory.LifecycleTransition{},

		// ========================================
		// APPLICATION IDENTITY - Fase 15
		// "O PROST-QS não serve usuários. Ele serve aplicativos."
		// ========================================
		&application.Application{},
		&application.AppCredential{},
		&application.AppUser{},
		&application.AppSession{},

		// ========================================
		// RISK SCORING ENGINE - Fase 17
		// "Risco calculável, explicável, defensável"
		// ========================================
		&risk.RiskScore{},
		&risk.RiskHistory{},
		&risk.RiskConfig{},

		// ========================================
		// EXPLAINABILITY - Fase 18
		// "Timeline é registro, não julgamento"
		// ========================================
		&explainability.DecisionTimeline{},

		// ========================================
		// SECRETS SYSTEM - Fase 20
		// "Segredos pertencem à plataforma, não ao app"
		// ========================================
		&secrets.Secret{},
		&secrets.SecretVersion{},
		&secrets.SecretAccess{},

		// ========================================
		// APP AUDIT EVENTS - Fase 22 (Audit-Only Integration)
		// "Eventos de apps externos, separados do audit principal"
		// ========================================
		&application.AppAuditEvent{},

		// ========================================
		// AGENT MEMORY - Fase 24
		// "O sistema lembra, mas não aprende"
		// ========================================
		&observer.AgentMemoryEntry{},

		// ========================================
		// HUMAN DECISIONS - Fase 25
		// "Dar olhos humanos ao sistema — sem dar mãos"
		// ========================================
		&observer.HumanDecision{},

		// ========================================
		// LOGIN EVENTS - Fase 26.8
		// "Quem logou, quando, de onde"
		// ========================================
		&identity.LoginEvent{},

		// ========================================
		// PAYMENT PROVIDER PER APP - Fase 26.8
		// "Cada app conecta sua própria Stripe"
		// ========================================
		&application.AppPaymentProvider{},

		// ========================================
		// FINANCIAL EVENT PIPELINE - Fase 27.0
		// "Todo centavo que passa é registrado"
		// ========================================
		&financial.FinancialEvent{},
		&financial.AppFinancialMetrics{},
		&financial.DailyFinancialSnapshot{},
		&financial.GlobalFinancialMetrics{},
		&financial.WebhookLog{},

		// ========================================
		// RECONCILIATION - Fase 27.1
		// "Seu ledger bate com a Stripe?"
		// ========================================
		&financial.ReconciliationResult{},

		// ========================================
		// FINANCIAL HARDENING - Fase 27.2
		// "Webhook duplicado NUNCA duplica dinheiro"
		// ========================================
		&financial.ProcessedWebhook{},
		&financial.FinancialAlert{},
		&financial.AlertThreshold{},

		// ========================================
		// KERNEL BILLING - Fase 28.1
		// "O kernel cobra dos apps que usam a infraestrutura"
		// ========================================
		&kernel_billing.KernelPlan{},
		&kernel_billing.AppSubscription{},
		&kernel_billing.AppUsage{},
		&kernel_billing.KernelInvoice{},

		// ========================================
		// KERNEL BILLING - Fase 28.2-B (Stripe Integration)
		// "Webhooks processados e alertas financeiros"
		// ========================================
		&kernel_billing.KernelProcessedWebhook{},
		&kernel_billing.KernelBillingAlert{},
		&kernel_billing.ReconciliationDivergence{},

		// ========================================
		// KERNEL BILLING - Fase 28.2-D (Pilot App)
		// "Rollout gradual: 1 app → 10% → 50% → 100%"
		// ========================================
		&kernel_billing.BillingFeatureFlag{},
		&kernel_billing.PilotApp{},
	)
	if err != nil {
		return fmt.Errorf("falha ao executar migrações: %w", err)
	}
	log.Println("Migrações do schema concluídas com sucesso.")
	return nil
}
