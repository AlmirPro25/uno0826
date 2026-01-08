package admin

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"prost-qs/backend/internal/billing"
	"prost-qs/backend/internal/federation"
	"prost-qs/backend/internal/identity"
)

// ========================================
// ADMIN SUPREMO - READ-ONLY SERVICE
// "Visibilidade total. Controle absoluto."
// ========================================

// AdminService fornece visão completa do sistema
type AdminService struct {
	db *gorm.DB
}

// NewAdminService cria uma nova instância
func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{db: db}
}

// ========================================
// DASHBOARD STATS
// ========================================

// DashboardStats estatísticas gerais do sistema
type DashboardStats struct {
	TotalIdentities      int64   `json:"total_identities"`
	TotalBillingAccounts int64   `json:"total_billing_accounts"`
	TotalFederatedLinks  int64   `json:"total_federated_links"`
	TotalPaymentIntents  int64   `json:"total_payment_intents"`
	TotalSubscriptions   int64   `json:"total_subscriptions"`
	TotalLedgerEntries   int64   `json:"total_ledger_entries"`
	TotalRevenue         float64 `json:"total_revenue"`
	ActiveSubscriptions  int64   `json:"active_subscriptions"`
	PendingPayouts       int64   `json:"pending_payouts"`
	IdentitiesLast24h    int64   `json:"identities_last_24h"`
	PaymentsLast24h      int64   `json:"payments_last_24h"`
}

// GetDashboardStats retorna estatísticas do dashboard
func (s *AdminService) GetDashboardStats() (*DashboardStats, error) {
	stats := &DashboardStats{}
	now := time.Now()
	last24h := now.Add(-24 * time.Hour)

	// Identities
	s.db.Model(&identity.SovereignIdentity{}).Count(&stats.TotalIdentities)
	s.db.Model(&identity.SovereignIdentity{}).Where("created_at > ?", last24h).Count(&stats.IdentitiesLast24h)

	// Billing
	s.db.Model(&billing.BillingAccount{}).Count(&stats.TotalBillingAccounts)
	s.db.Model(&billing.PaymentIntent{}).Count(&stats.TotalPaymentIntents)
	s.db.Model(&billing.PaymentIntent{}).Where("created_at > ?", last24h).Count(&stats.PaymentsLast24h)

	// Subscriptions
	s.db.Model(&billing.Subscription{}).Count(&stats.TotalSubscriptions)
	s.db.Model(&billing.Subscription{}).Where("status = ?", "active").Count(&stats.ActiveSubscriptions)

	// Ledger
	s.db.Model(&billing.LedgerEntry{}).Count(&stats.TotalLedgerEntries)

	// Revenue (sum of confirmed payments)
	var totalRevenue int64
	s.db.Model(&billing.PaymentIntent{}).
		Where("status = ?", "confirmed").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRevenue)
	stats.TotalRevenue = float64(totalRevenue) / 100 // Centavos para reais

	// Payouts
	s.db.Model(&billing.Payout{}).Where("status = ?", "pending").Count(&stats.PendingPayouts)

	// Federation
	s.db.Model(&federation.FederatedIdentity{}).Count(&stats.TotalFederatedLinks)

	return stats, nil
}

// ========================================
// IDENTITIES
// ========================================

// IdentityView visão completa de uma identidade
type IdentityView struct {
	UserID       string    `json:"user_id"`
	PrimaryPhone string    `json:"primary_phone"`
	Source       string    `json:"source"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	// Linked providers
	LinkedProviders []ProviderLink `json:"linked_providers"`

	// Billing info
	BillingAccount *BillingAccountView `json:"billing_account,omitempty"`
}

// ProviderLink link de provider
type ProviderLink struct {
	Provider   string    `json:"provider"`
	ProviderID string    `json:"provider_id"`
	Email      string    `json:"email"`
	Name       string    `json:"name"`
	LinkedAt   time.Time `json:"linked_at"`
}

// BillingAccountView visão da conta de billing
type BillingAccountView struct {
	AccountID        string  `json:"account_id"`
	StripeCustomerID string  `json:"stripe_customer_id"`
	Balance          float64 `json:"balance"`
	Currency         string  `json:"currency"`
}

// ListIdentities lista todas as identidades com paginação
func (s *AdminService) ListIdentities(page, limit int) ([]IdentityView, int64, error) {
	var identities []identity.SovereignIdentity
	var total int64

	offset := (page - 1) * limit

	s.db.Model(&identity.SovereignIdentity{}).Count(&total)
	if err := s.db.Order("created_at DESC").Offset(offset).Limit(limit).Find(&identities).Error; err != nil {
		return nil, 0, err
	}

	views := make([]IdentityView, len(identities))
	for i, id := range identities {
		views[i] = s.buildIdentityView(id)
	}

	return views, total, nil
}

// GetIdentity busca uma identidade específica
func (s *AdminService) GetIdentity(userID uuid.UUID) (*IdentityView, error) {
	var id identity.SovereignIdentity
	if err := s.db.Where("user_id = ?", userID).First(&id).Error; err != nil {
		return nil, err
	}

	view := s.buildIdentityView(id)
	return &view, nil
}

func (s *AdminService) buildIdentityView(id identity.SovereignIdentity) IdentityView {
	view := IdentityView{
		UserID:       id.UserID.String(),
		PrimaryPhone: id.PrimaryPhone,
		Source:       id.Source,
		CreatedAt:    id.CreatedAt,
		UpdatedAt:    id.UpdatedAt,
	}

	// Get linked providers
	var links []federation.FederatedIdentity
	s.db.Where("user_id = ?", id.UserID).Find(&links)
	view.LinkedProviders = make([]ProviderLink, len(links))
	for i, link := range links {
		view.LinkedProviders[i] = ProviderLink{
			Provider:   link.Provider,
			ProviderID: link.ProviderID,
			Email:      link.Email,
			Name:       link.Name,
			LinkedAt:   link.LinkedAt,
		}
	}

	// Get billing account
	var ba billing.BillingAccount
	if err := s.db.Where("user_id = ?", id.UserID).First(&ba).Error; err == nil {
		view.BillingAccount = &BillingAccountView{
			AccountID:        ba.AccountID.String(),
			StripeCustomerID: ba.StripeCustomerID,
			Balance:          float64(ba.Balance) / 100,
			Currency:         ba.Currency,
		}
	}

	return view
}

// ========================================
// BILLING & PAYMENTS
// ========================================

// PaymentView visão de um pagamento
type PaymentView struct {
	IntentID       string    `json:"intent_id"`
	AccountID      string    `json:"account_id"`
	UserID         string    `json:"user_id"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	Status         string    `json:"status"`
	Description    string    `json:"description"`
	StripeIntentID string    `json:"stripe_intent_id"`
	CreatedAt      time.Time `json:"created_at"`
	ConfirmedAt    time.Time `json:"confirmed_at,omitempty"`
}

// ListPayments lista todos os pagamentos
func (s *AdminService) ListPayments(page, limit int, status string) ([]PaymentView, int64, error) {
	var intents []billing.PaymentIntent
	var total int64

	offset := (page - 1) * limit
	query := s.db.Model(&billing.PaymentIntent{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&intents).Error; err != nil {
		return nil, 0, err
	}

	views := make([]PaymentView, len(intents))
	for i, intent := range intents {
		// Get user ID from billing account
		var ba billing.BillingAccount
		s.db.Where("account_id = ?", intent.AccountID).First(&ba)

		views[i] = PaymentView{
			IntentID:       intent.IntentID.String(),
			AccountID:      intent.AccountID.String(),
			UserID:         ba.UserID.String(),
			Amount:         float64(intent.Amount) / 100,
			Currency:       intent.Currency,
			Status:         intent.Status,
			Description:    intent.Description,
			StripeIntentID: intent.StripeIntentID,
			CreatedAt:      intent.CreatedAt,
			ConfirmedAt:    intent.ConfirmedAt,
		}
	}

	return views, total, nil
}

// ========================================
// SUBSCRIPTIONS
// ========================================

// SubscriptionView visão de uma assinatura
type SubscriptionView struct {
	SubscriptionID       string    `json:"subscription_id"`
	AccountID            string    `json:"account_id"`
	UserID               string    `json:"user_id"`
	PlanID               string    `json:"plan_id"`
	Status               string    `json:"status"`
	Amount               float64   `json:"amount"`
	Currency             string    `json:"currency"`
	Interval             string    `json:"interval"`
	StripeSubscriptionID string    `json:"stripe_subscription_id"`
	StartedAt            time.Time `json:"started_at"`
	CurrentPeriodEnd     time.Time `json:"current_period_end"`
	CanceledAt           time.Time `json:"canceled_at,omitempty"`
}

// ListSubscriptions lista todas as assinaturas
func (s *AdminService) ListSubscriptions(page, limit int, status string) ([]SubscriptionView, int64, error) {
	var subs []billing.Subscription
	var total int64

	offset := (page - 1) * limit
	query := s.db.Model(&billing.Subscription{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&subs).Error; err != nil {
		return nil, 0, err
	}

	views := make([]SubscriptionView, len(subs))
	for i, sub := range subs {
		var ba billing.BillingAccount
		s.db.Where("account_id = ?", sub.AccountID).First(&ba)

		views[i] = SubscriptionView{
			SubscriptionID:       sub.SubscriptionID.String(),
			AccountID:            sub.AccountID.String(),
			UserID:               ba.UserID.String(),
			PlanID:               sub.PlanID,
			Status:               sub.Status,
			Amount:               float64(sub.Amount) / 100,
			Currency:             sub.Currency,
			Interval:             sub.Interval,
			StripeSubscriptionID: sub.StripeSubscriptionID,
			StartedAt:            sub.StartedAt,
			CurrentPeriodEnd:     sub.CurrentPeriodEnd,
			CanceledAt:           sub.CanceledAt,
		}
	}

	return views, total, nil
}

// ========================================
// LEDGER
// ========================================

// LedgerEntryView visão de uma entrada do ledger
type LedgerEntryView struct {
	EntryID      string    `json:"entry_id"`
	AccountID    string    `json:"account_id"`
	UserID       string    `json:"user_id"`
	Type         string    `json:"type"`
	Amount       float64   `json:"amount"`
	Currency     string    `json:"currency"`
	Description  string    `json:"description"`
	ReferenceID  string    `json:"reference_id"`
	BalanceAfter float64   `json:"balance_after"`
	CreatedAt    time.Time `json:"created_at"`
}

// ListLedgerEntries lista entradas do ledger
func (s *AdminService) ListLedgerEntries(page, limit int, accountID string) ([]LedgerEntryView, int64, error) {
	var entries []billing.LedgerEntry
	var total int64

	offset := (page - 1) * limit
	query := s.db.Model(&billing.LedgerEntry{})

	if accountID != "" {
		query = query.Where("account_id = ?", accountID)
	}

	query.Count(&total)
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&entries).Error; err != nil {
		return nil, 0, err
	}

	views := make([]LedgerEntryView, len(entries))
	for i, entry := range entries {
		var ba billing.BillingAccount
		s.db.Where("account_id = ?", entry.AccountID).First(&ba)

		views[i] = LedgerEntryView{
			EntryID:      entry.EntryID.String(),
			AccountID:    entry.AccountID.String(),
			UserID:       ba.UserID.String(),
			Type:         entry.Type,
			Amount:       float64(entry.Amount) / 100,
			Currency:     entry.Currency,
			Description:  entry.Description,
			ReferenceID:  entry.ReferenceID,
			BalanceAfter: float64(entry.BalanceAfter) / 100,
			CreatedAt:    entry.CreatedAt,
		}
	}

	return views, total, nil
}

// ========================================
// PAYOUTS
// ========================================

// PayoutView visão de um payout
type PayoutView struct {
	PayoutID       string    `json:"payout_id"`
	AccountID      string    `json:"account_id"`
	UserID         string    `json:"user_id"`
	Amount         float64   `json:"amount"`
	Currency       string    `json:"currency"`
	Status         string    `json:"status"`
	Destination    string    `json:"destination"`
	StripePayoutID string    `json:"stripe_payout_id"`
	RequestedAt    time.Time `json:"requested_at"`
	SentAt         time.Time `json:"sent_at,omitempty"`
}

// ListPayouts lista todos os payouts
func (s *AdminService) ListPayouts(page, limit int, status string) ([]PayoutView, int64, error) {
	var payouts []billing.Payout
	var total int64

	offset := (page - 1) * limit
	query := s.db.Model(&billing.Payout{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	query.Count(&total)
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&payouts).Error; err != nil {
		return nil, 0, err
	}

	views := make([]PayoutView, len(payouts))
	for i, payout := range payouts {
		var ba billing.BillingAccount
		s.db.Where("account_id = ?", payout.AccountID).First(&ba)

		views[i] = PayoutView{
			PayoutID:       payout.PayoutID.String(),
			AccountID:      payout.AccountID.String(),
			UserID:         ba.UserID.String(),
			Amount:         float64(payout.Amount) / 100,
			Currency:       payout.Currency,
			Status:         payout.Status,
			Destination:    payout.Destination,
			StripePayoutID: payout.StripePayoutID,
			RequestedAt:    payout.RequestedAt,
			SentAt:         payout.SentAt,
		}
	}

	return views, total, nil
}


// ========================================
// USER MANAGEMENT (NOVO)
// ========================================

// UserView visão completa de um usuário
type UserView struct {
	ID          string                 `json:"id"`
	Status      string                 `json:"status"`
	Role        string                 `json:"role"`
	CreatedAt   time.Time              `json:"created_at"`
	Profile     *identity.UserProfile  `json:"profile,omitempty"`
	AuthMethods []identity.AuthMethod  `json:"auth_methods,omitempty"`
	Balance     int64                  `json:"balance"`
}

// ListUsers lista todos os usuários
func (s *AdminService) ListUsers(page, limit int, search string) ([]identity.User, int64, error) {
	var users []identity.User
	var total int64

	offset := (page - 1) * limit
	query := s.db.Model(&identity.User{}).Preload("Profile").Preload("AuthMethods")

	if search != "" {
		// Buscar por nome, email ou telefone
		var profileUserIDs []uuid.UUID
		s.db.Model(&identity.UserProfile{}).
			Where("name LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%").
			Pluck("user_id", &profileUserIDs)

		var authUserIDs []uuid.UUID
		s.db.Model(&identity.AuthMethod{}).
			Where("identifier LIKE ?", "%"+search+"%").
			Pluck("user_id", &authUserIDs)

		allIDs := append(profileUserIDs, authUserIDs...)
		if len(allIDs) > 0 {
			query = query.Where("id IN ?", allIDs)
		} else {
			return []identity.User{}, 0, nil
		}
	}

	query.Count(&total)
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// GetUserDetails busca detalhes de um usuário
func (s *AdminService) GetUserDetails(userID uuid.UUID) (*identity.User, error) {
	var user identity.User
	if err := s.db.Preload("Profile").Preload("AuthMethods").Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

// SuspendUser suspende um usuário
func (s *AdminService) SuspendUser(userID uuid.UUID, reason string) error {
	return s.db.Model(&identity.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":     identity.UserStatusSuspended,
		"updated_at": time.Now(),
	}).Error
}

// BanUser bane um usuário
func (s *AdminService) BanUser(userID uuid.UUID, reason string) error {
	return s.db.Model(&identity.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":     identity.UserStatusBanned,
		"updated_at": time.Now(),
	}).Error
}

// ReactivateUser reativa um usuário
func (s *AdminService) ReactivateUser(userID uuid.UUID) error {
	return s.db.Model(&identity.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":     identity.UserStatusActive,
		"updated_at": time.Now(),
	}).Error
}

// SetUserRole define o role de um usuário
func (s *AdminService) SetUserRole(userID uuid.UUID, role string) error {
	return s.db.Model(&identity.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"role":       role,
		"updated_at": time.Now(),
	}).Error
}

// ========================================
// ECONOMY OVERVIEW
// ========================================

// EconomyOverview visão geral da economia
type EconomyOverview struct {
	TotalBalance  int64 `json:"total_balance"`
	TotalCredits  int64 `json:"total_credits"`
	TotalDebits   int64 `json:"total_debits"`
	TotalAccounts int64 `json:"total_accounts"`
}

// GetEconomyOverview retorna visão geral da economia
func (s *AdminService) GetEconomyOverview() (*EconomyOverview, error) {
	overview := &EconomyOverview{}

	// Total balance (soma de todas as contas)
	s.db.Model(&billing.BillingAccount{}).Select("COALESCE(SUM(balance), 0)").Scan(&overview.TotalBalance)

	// Total accounts
	s.db.Model(&billing.BillingAccount{}).Count(&overview.TotalAccounts)

	// Credits e debits dos últimos 30 dias
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	s.db.Model(&billing.LedgerEntry{}).
		Where("type = ? AND created_at > ?", "credit", thirtyDaysAgo).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&overview.TotalCredits)

	s.db.Model(&billing.LedgerEntry{}).
		Where("type = ? AND created_at > ?", "debit", thirtyDaysAgo).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&overview.TotalDebits)

	return overview, nil
}

// ========================================
// DISPUTED
// ========================================

// DisputedItem item em estado disputed
type DisputedItem struct {
	Type   string `json:"type"`
	ID     string `json:"id"`
	Reason string `json:"reason"`
}

// ListDisputed lista entidades em estado DISPUTED
func (s *AdminService) ListDisputed() ([]DisputedItem, error) {
	var items []DisputedItem

	// PaymentIntents disputed
	var disputedPayments []billing.PaymentIntent
	s.db.Where("status = ?", "disputed").Find(&disputedPayments)
	for _, p := range disputedPayments {
		items = append(items, DisputedItem{
			Type:   "payment_intent",
			ID:     p.IntentID.String(),
			Reason: p.FailureMessage,
		})
	}

	// Subscriptions disputed
	var disputedSubs []billing.Subscription
	s.db.Where("status = ?", "disputed").Find(&disputedSubs)
	for _, sub := range disputedSubs {
		items = append(items, DisputedItem{
			Type:   "subscription",
			ID:     sub.SubscriptionID.String(),
			Reason: "Subscription disputed",
		})
	}

	return items, nil
}

// ResolveDisputed resolve uma entidade DISPUTED
func (s *AdminService) ResolveDisputed(entityType, entityID, resolution, note, adminID string) error {
	switch entityType {
	case "payment_intent":
		newStatus := "failed"
		if resolution == "approved" {
			newStatus = "confirmed"
		}
		return s.db.Model(&billing.PaymentIntent{}).
			Where("intent_id = ?", entityID).
			Updates(map[string]interface{}{
				"status":     newStatus,
				"updated_at": time.Now(),
			}).Error

	case "subscription":
		newStatus := "canceled"
		if resolution == "approved" {
			newStatus = "active"
		}
		return s.db.Model(&billing.Subscription{}).
			Where("subscription_id = ?", entityID).
			Updates(map[string]interface{}{
				"status":     newStatus,
				"updated_at": time.Now(),
			}).Error
	}

	return nil
}

// ========================================
// JOBS
// ========================================

// ListJobs lista jobs do sistema
func (s *AdminService) ListJobs(status string, limit int) ([]map[string]interface{}, error) {
	var jobs []map[string]interface{}

	query := s.db.Table("jobs")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Order("created_at DESC").Limit(limit).Find(&jobs).Error; err != nil {
		return nil, err
	}

	return jobs, nil
}

// RetryJob reexecuta um job falho
func (s *AdminService) RetryJob(jobID string) error {
	return s.db.Table("jobs").
		Where("id = ?", jobID).
		Updates(map[string]interface{}{
			"status":      "pending",
			"attempts":    0,
			"next_run_at": time.Now(),
			"updated_at":  time.Now(),
		}).Error
}

// ========================================
// BOOTSTRAP SUPER ADMIN
// ========================================

// BootstrapSuperAdmin cria o primeiro super_admin do sistema
func (s *AdminService) BootstrapSuperAdmin(phone, name, email string) (*identity.User, error) {
	// Verificar se já existe um super_admin
	var count int64
	s.db.Model(&identity.User{}).Where("role = ?", identity.UserRoleSuperAdmin).Count(&count)
	if count > 0 {
		return nil, fmt.Errorf("super_admin already exists")
	}

	// Criar usuário
	user := &identity.User{
		ID:        uuid.New(),
		Status:    identity.UserStatusActive,
		Role:      identity.UserRoleSuperAdmin,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, err
	}

	// Criar perfil
	profile := &identity.UserProfile{
		ID:        uuid.New(),
		UserID:    user.ID,
		Name:      name,
		Email:     email,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.db.Create(profile).Error; err != nil {
		return nil, err
	}

	// Criar método de auth (telefone)
	authMethod := &identity.AuthMethod{
		ID:         uuid.New(),
		UserID:     user.ID,
		Type:       identity.AuthMethodPhone,
		Identifier: phone,
		Verified:   true,
		CreatedAt:  time.Now(),
	}

	if err := s.db.Create(authMethod).Error; err != nil {
		return nil, err
	}

	user.Profile = profile
	user.AuthMethods = []identity.AuthMethod{*authMethod}

	return user, nil
}
