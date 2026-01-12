package ads

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrNoAdsAvailable   = errors.New("no ads available for this slot")
	ErrSlotNotFound     = errors.New("ad slot not found")
	ErrFraudDetected    = errors.New("fraud detected")
	ErrRateLimited      = errors.New("rate limited")
	ErrInvalidRequest   = errors.New("invalid ad request")
	ErrUserBlocked      = errors.New("user blocked from ads")
	ErrAppNotConfigured = errors.New("app not configured for ads")
)

type AdSlot struct {
	ID            uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	AppID         uuid.UUID `gorm:"type:text;not null;index" json:"app_id"`
	Name          string    `gorm:"type:text;not null" json:"name"`
	Format        string    `gorm:"type:text;not null" json:"format"`
	Width         int       `gorm:"default:0" json:"width"`
	Height        int       `gorm:"default:0" json:"height"`
	MinCPM        int64     `gorm:"default:0" json:"min_cpm"`
	MaxAdsPerHour int       `gorm:"default:100" json:"max_ads_per_hour"`
	Enabled       bool      `gorm:"default:true" json:"enabled"`
	CreatedAt     time.Time `json:"created_at"`
}

func (AdSlot) TableName() string { return "ad_slots" }

type AdCreative struct {
	ID          uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	CampaignID  uuid.UUID `gorm:"type:text;not null;index" json:"campaign_id"`
	Name        string    `gorm:"type:text;not null" json:"name"`
	Format      string    `gorm:"type:text;not null" json:"format"`
	ContentURL  string    `gorm:"type:text" json:"content_url"`
	ClickURL    string    `gorm:"type:text" json:"click_url"`
	Title       string    `gorm:"type:text" json:"title"`
	Description string    `gorm:"type:text" json:"description"`
	CTAText     string    `gorm:"type:text" json:"cta_text"`
	Status      string    `gorm:"type:text;default:'pending'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}

func (AdCreative) TableName() string { return "ad_creatives" }

type AdTargeting struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	CampaignID   uuid.UUID `gorm:"type:text;not null;index" json:"campaign_id"`
	SlotIDs      string    `gorm:"type:text" json:"slot_ids"`
	Plans        string    `gorm:"type:text" json:"plans"`
	Countries    string    `gorm:"type:text" json:"countries"`
	Languages    string    `gorm:"type:text" json:"languages"`
	DeviceTypes  string    `gorm:"type:text" json:"device_types"`
	TimeRanges   string    `gorm:"type:text" json:"time_ranges"`
	ExcludeUsers string    `gorm:"type:text" json:"exclude_users"`
}

func (AdTargeting) TableName() string { return "ad_targetings" }

type AdRequest struct {
	RequestID  string            `json:"request_id"`
	AppID      string            `json:"app_id"`
	SlotName   string            `json:"slot"`
	UserID     string            `json:"user_id,omitempty"`
	DeviceID   string            `json:"device_id,omitempty"`
	Plan       string            `json:"plan,omitempty"`
	Country    string            `json:"country,omitempty"`
	Language   string            `json:"language,omitempty"`
	DeviceType string            `json:"device_type,omitempty"`
	IP         string            `json:"ip,omitempty"`
	UserAgent  string            `json:"user_agent,omitempty"`
	Metadata   map[string]string `json:"metadata,omitempty"`
	Timestamp  time.Time         `json:"timestamp"`
}

type AdResponse struct {
	RequestID    string `json:"request_id"`
	AdID         string `json:"ad_id,omitempty"`
	CampaignID   string `json:"campaign_id,omitempty"`
	CreativeID   string `json:"creative_id,omitempty"`
	Format       string `json:"format,omitempty"`
	ContentURL   string `json:"content_url,omitempty"`
	ClickURL     string `json:"click_url,omitempty"`
	Title        string `json:"title,omitempty"`
	Description  string `json:"description,omitempty"`
	CTAText      string `json:"cta_text,omitempty"`
	TrackingURL  string `json:"tracking_url,omitempty"`
	ImpressionID string `json:"impression_id,omitempty"`
	NoFill       bool   `json:"no_fill"`
	Reason       string `json:"reason,omitempty"`
	Latency      int64  `json:"latency_ms"`
}

type AdImpression struct {
	ID         uuid.UUID  `gorm:"type:text;primaryKey" json:"id"`
	RequestID  string     `gorm:"type:text;index" json:"request_id"`
	CampaignID uuid.UUID  `gorm:"type:text;index" json:"campaign_id"`
	CreativeID uuid.UUID  `gorm:"type:text" json:"creative_id"`
	SlotID     uuid.UUID  `gorm:"type:text;index" json:"slot_id"`
	AppID      uuid.UUID  `gorm:"type:text;index" json:"app_id"`
	UserID     *uuid.UUID `gorm:"type:text" json:"user_id,omitempty"`
	DeviceID   string     `gorm:"type:text" json:"device_id,omitempty"`
	IP         string     `gorm:"type:text" json:"ip"`
	Country    string     `gorm:"type:text" json:"country"`
	CPM        int64      `gorm:"not null" json:"cpm"`
	Verified   bool       `gorm:"default:false" json:"verified"`
	FraudScore float64    `gorm:"default:0" json:"fraud_score"`
	CreatedAt  time.Time  `gorm:"index" json:"created_at"`
}

func (AdImpression) TableName() string { return "ad_impressions" }

type AdClick struct {
	ID           uuid.UUID `gorm:"type:text;primaryKey" json:"id"`
	ImpressionID uuid.UUID `gorm:"type:text;index" json:"impression_id"`
	CampaignID   uuid.UUID `gorm:"type:text;index" json:"campaign_id"`
	CPC          int64     `gorm:"not null" json:"cpc"`
	Verified     bool      `gorm:"default:false" json:"verified"`
	FraudScore   float64   `gorm:"default:0" json:"fraud_score"`
	CreatedAt    time.Time `gorm:"index" json:"created_at"`
}

func (AdClick) TableName() string { return "ad_clicks" }

type DecisionEngine struct {
	db             *gorm.DB
	adsService     *AdsService
	slotCache      map[string]*AdSlot
	cacheMu        sync.RWMutex
	cacheExpiry    time.Time
	requestCounts  map[string]int64
	rateMu         sync.RWMutex
	fraudThreshold float64
	totalRequests  int64
	totalFills     int64
	totalNoFills   int64
	totalFraud     int64
	avgLatencyMs   float64
	metricsMu      sync.RWMutex
}

func NewDecisionEngine(db *gorm.DB, adsService *AdsService) *DecisionEngine {
	return &DecisionEngine{
		db:             db,
		adsService:     adsService,
		slotCache:      make(map[string]*AdSlot),
		requestCounts:  make(map[string]int64),
		fraudThreshold: 0.7,
	}
}

func (e *DecisionEngine) Decide(ctx context.Context, req *AdRequest) (*AdResponse, error) {
	start := time.Now()
	if err := e.validateRequest(req); err != nil {
		return e.noFillResponse(req, err.Error(), start), err
	}
	if e.isRateLimited(req) {
		e.recordMetric(false, true, start)
		return e.noFillResponse(req, "rate_limited", start), ErrRateLimited
	}
	fraudScore := e.calculateFraudScore(req)
	if fraudScore > e.fraudThreshold {
		e.recordMetric(false, true, start)
		return e.noFillResponse(req, "fraud_detected", start), ErrFraudDetected
	}
	slot, err := e.getSlot(req.AppID, req.SlotName)
	if err != nil {
		return e.noFillResponse(req, "slot_not_found", start), err
	}
	if !slot.Enabled {
		return e.noFillResponse(req, "slot_disabled", start), nil
	}
	campaigns, err := e.findEligibleCampaigns(ctx, slot, req)
	if err != nil || len(campaigns) == 0 {
		e.recordMetric(false, false, start)
		return e.noFillResponse(req, "no_campaigns", start), nil
	}
	winner := e.selectWinner(campaigns, slot)
	if winner == nil {
		e.recordMetric(false, false, start)
		return e.noFillResponse(req, "no_winner", start), nil
	}
	creative, err := e.getCreative(winner.ID)
	if err != nil {
		e.recordMetric(false, false, start)
		return e.noFillResponse(req, "no_creative", start), nil
	}
	impression := e.createImpression(req, slot, winner, creative, fraudScore)
	response := e.buildResponse(req, winner, creative, impression, start)
	e.recordMetric(true, false, start)
	return response, nil
}

func (e *DecisionEngine) validateRequest(req *AdRequest) error {
	if req.AppID == "" || req.SlotName == "" {
		return ErrInvalidRequest
	}
	if req.RequestID == "" {
		req.RequestID = uuid.New().String()
	}
	if req.Timestamp.IsZero() {
		req.Timestamp = time.Now()
	}
	return nil
}

func (e *DecisionEngine) isRateLimited(req *AdRequest) bool {
	key := fmt.Sprintf("%s:%s", req.AppID, req.SlotName)
	e.rateMu.Lock()
	defer e.rateMu.Unlock()
	count := e.requestCounts[key]
	e.requestCounts[key] = count + 1
	go func() {
		time.Sleep(time.Minute)
		e.rateMu.Lock()
		e.requestCounts[key] = 0
		e.rateMu.Unlock()
	}()
	return count > 1000
}

func (e *DecisionEngine) calculateFraudScore(req *AdRequest) float64 {
	score := 0.0
	if req.UserAgent == "" {
		score += 0.3
	}
	if req.IP == "" || req.IP == "0.0.0.0" {
		score += 0.2
	}
	if req.DeviceID == "" && req.UserID == "" {
		score += 0.2
	}
	return score
}

func (e *DecisionEngine) getSlot(appID, slotName string) (*AdSlot, error) {
	cacheKey := fmt.Sprintf("%s:%s", appID, slotName)
	e.cacheMu.RLock()
	if slot, ok := e.slotCache[cacheKey]; ok && time.Now().Before(e.cacheExpiry) {
		e.cacheMu.RUnlock()
		return slot, nil
	}
	e.cacheMu.RUnlock()
	var slot AdSlot
	appUUID, err := uuid.Parse(appID)
	if err != nil {
		return nil, ErrInvalidRequest
	}
	err = e.db.Where("app_id = ? AND name = ?", appUUID, slotName).First(&slot).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSlotNotFound
		}
		return nil, err
	}
	e.cacheMu.Lock()
	e.slotCache[cacheKey] = &slot
	e.cacheExpiry = time.Now().Add(5 * time.Minute)
	e.cacheMu.Unlock()
	return &slot, nil
}

func (e *DecisionEngine) findEligibleCampaigns(ctx context.Context, slot *AdSlot, req *AdRequest) ([]*AdCampaign, error) {
	var campaigns []*AdCampaign
	err := e.db.Joins("JOIN ad_budgets ON ad_campaigns.budget_id = ad_budgets.id").
		Where("ad_campaigns.status = ?", string(CampaignActive)).
		Where("ad_budgets.status = ?", string(BudgetActive)).
		Where("ad_budgets.amount_spent < ad_budgets.amount_total").
		Find(&campaigns).Error
	if err != nil {
		return nil, err
	}
	eligible := make([]*AdCampaign, 0)
	for _, c := range campaigns {
		if e.matchesTargeting(c, slot, req) {
			eligible = append(eligible, c)
		}
	}
	return eligible, nil
}

func (e *DecisionEngine) matchesTargeting(campaign *AdCampaign, slot *AdSlot, req *AdRequest) bool {
	// Buscar targeting da campanha
	var targeting AdTargeting
	if err := e.db.Where("campaign_id = ?", campaign.ID).First(&targeting).Error; err != nil {
		// Sem targeting = aceita tudo
		return true
	}

	// Verificar slot
	if targeting.SlotIDs != "" {
		slotIDs := parseArray(targeting.SlotIDs)
		if len(slotIDs) > 0 && !contains(slotIDs, slot.ID.String()) {
			return false
		}
	}

	// Verificar plano do usuário
	if targeting.Plans != "" && req.Plan != "" {
		plans := parseArray(targeting.Plans)
		if len(plans) > 0 && !contains(plans, req.Plan) {
			return false
		}
	}

	// Verificar país
	if targeting.Countries != "" && req.Country != "" {
		countries := parseArray(targeting.Countries)
		if len(countries) > 0 && !contains(countries, req.Country) {
			return false
		}
	}

	// Verificar idioma
	if targeting.Languages != "" && req.Language != "" {
		languages := parseArray(targeting.Languages)
		if len(languages) > 0 && !contains(languages, req.Language) {
			return false
		}
	}

	// Verificar tipo de dispositivo
	if targeting.DeviceTypes != "" && req.DeviceType != "" {
		deviceTypes := parseArray(targeting.DeviceTypes)
		if len(deviceTypes) > 0 && !contains(deviceTypes, req.DeviceType) {
			return false
		}
	}

	// Verificar usuários excluídos
	if targeting.ExcludeUsers != "" && req.UserID != "" {
		excludeUsers := parseArray(targeting.ExcludeUsers)
		if contains(excludeUsers, req.UserID) {
			return false
		}
	}

	return true
}

// parseArray converte string separada por vírgula em slice
func parseArray(s string) []string {
	if s == "" {
		return nil
	}
	result := make([]string, 0)
	current := ""
	for _, c := range s {
		if c == ',' {
			if current != "" {
				result = append(result, current)
				current = ""
			}
		} else {
			current += string(c)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}

// contains verifica se slice contém string
func contains(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}

// selectWinner implementa Second-Price Auction
// O vencedor paga o segundo maior lance + 1 centavo
func (e *DecisionEngine) selectWinner(campaigns []*AdCampaign, slot *AdSlot) *AdCampaign {
	if len(campaigns) == 0 {
		return nil
	}

	// Filtrar campanhas com bid >= minCPM do slot
	eligible := make([]*AdCampaign, 0)
	for _, c := range campaigns {
		if c.BidAmount >= slot.MinCPM {
			eligible = append(eligible, c)
		}
	}

	if len(eligible) == 0 {
		return nil
	}

	// Se só tem uma, ela vence pagando o minCPM
	if len(eligible) == 1 {
		return eligible[0]
	}

	// Ordenar por bid (maior primeiro)
	for i := 0; i < len(eligible)-1; i++ {
		for j := i + 1; j < len(eligible); j++ {
			if eligible[j].BidAmount > eligible[i].BidAmount {
				eligible[i], eligible[j] = eligible[j], eligible[i]
			}
		}
	}

	// Vencedor é o maior lance
	// Preço pago = segundo maior lance + 1 centavo (ou minCPM se não houver segundo)
	winner := eligible[0]
	
	// Calcular preço a pagar (second-price)
	var priceToPay int64
	if len(eligible) > 1 {
		priceToPay = eligible[1].BidAmount + 1 // Segundo maior + 1 centavo
	} else {
		priceToPay = slot.MinCPM
	}

	// Garantir que não paga mais que o próprio lance
	if priceToPay > winner.BidAmount {
		priceToPay = winner.BidAmount
	}

	// Armazenar preço a pagar no contexto (será usado na impressão)
	winner.WinningPrice = priceToPay

	return winner
}

func (e *DecisionEngine) getCreative(campaignID uuid.UUID) (*AdCreative, error) {
	var creative AdCreative
	err := e.db.Where("campaign_id = ? AND status = ?", campaignID, "approved").Order("RANDOM()").First(&creative).Error
	if err != nil {
		return nil, err
	}
	return &creative, nil
}

func (e *DecisionEngine) createImpression(req *AdRequest, slot *AdSlot, campaign *AdCampaign, creative *AdCreative, fraudScore float64) *AdImpression {
	// Usar WinningPrice do leilão (second-price) ou fallback para MinCPM
	cpm := campaign.WinningPrice
	if cpm == 0 {
		cpm = slot.MinCPM
	}
	
	impression := &AdImpression{
		ID:         uuid.New(),
		RequestID:  req.RequestID,
		CampaignID: campaign.ID,
		CreativeID: creative.ID,
		SlotID:     slot.ID,
		AppID:      slot.AppID,
		DeviceID:   req.DeviceID,
		IP:         req.IP,
		Country:    req.Country,
		CPM:        cpm, // Preço do leilão (second-price)
		FraudScore: fraudScore,
		CreatedAt:  time.Now(),
	}
	if req.UserID != "" {
		userUUID, err := uuid.Parse(req.UserID)
		if err == nil {
			impression.UserID = &userUUID
		}
	}
	
	// Salvar impressão
	go func() { e.db.Create(impression) }()
	
	// Registrar evento de gasto (async)
	go func() {
		if e.adsService != nil {
			ctx := context.Background()
			e.adsService.RegisterSpendEvent(ctx, campaign.ID, cpm, 1, SpendUnitImpression, SpendSourceInternal)
		}
	}()
	
	return impression
}

func (e *DecisionEngine) buildResponse(req *AdRequest, campaign *AdCampaign, creative *AdCreative, impression *AdImpression, start time.Time) *AdResponse {
	return &AdResponse{
		RequestID:    req.RequestID,
		AdID:         impression.ID.String(),
		CampaignID:   campaign.ID.String(),
		CreativeID:   creative.ID.String(),
		Format:       creative.Format,
		ContentURL:   creative.ContentURL,
		ClickURL:     creative.ClickURL,
		Title:        creative.Title,
		Description:  creative.Description,
		CTAText:      creative.CTAText,
		TrackingURL:  fmt.Sprintf("/ads/track/%s", impression.ID.String()),
		ImpressionID: impression.ID.String(),
		NoFill:       false,
		Latency:      time.Since(start).Milliseconds(),
	}
}

func (e *DecisionEngine) noFillResponse(req *AdRequest, reason string, start time.Time) *AdResponse {
	return &AdResponse{RequestID: req.RequestID, NoFill: true, Reason: reason, Latency: time.Since(start).Milliseconds()}
}

func (e *DecisionEngine) RecordClick(ctx context.Context, impressionID string) error {
	impUUID, err := uuid.Parse(impressionID)
	if err != nil {
		return ErrInvalidRequest
	}
	var impression AdImpression
	if err := e.db.Where("id = ?", impUUID).First(&impression).Error; err != nil {
		return err
	}
	click := &AdClick{ID: uuid.New(), ImpressionID: impUUID, CampaignID: impression.CampaignID, CPC: impression.CPM / 10, CreatedAt: time.Now()}
	if err := e.db.Create(click).Error; err != nil {
		return err
	}
	if e.adsService != nil {
		_, err = e.adsService.RegisterSpendEvent(ctx, impression.CampaignID, click.CPC, 1, SpendUnitClick, SpendSourceInternal)
	}
	return err
}

func (e *DecisionEngine) recordMetric(fill bool, fraud bool, start time.Time) {
	e.metricsMu.Lock()
	defer e.metricsMu.Unlock()
	e.totalRequests++
	if fill {
		e.totalFills++
	} else {
		e.totalNoFills++
	}
	if fraud {
		e.totalFraud++
	}
	latency := float64(time.Since(start).Milliseconds())
	e.avgLatencyMs = (e.avgLatencyMs*float64(e.totalRequests-1) + latency) / float64(e.totalRequests)
}

func (e *DecisionEngine) GetMetrics() map[string]interface{} {
	e.metricsMu.RLock()
	defer e.metricsMu.RUnlock()
	fillRate := float64(0)
	if e.totalRequests > 0 {
		fillRate = float64(e.totalFills) / float64(e.totalRequests) * 100
	}
	return map[string]interface{}{"total_requests": e.totalRequests, "total_fills": e.totalFills, "total_no_fills": e.totalNoFills, "total_fraud": e.totalFraud, "fill_rate": fillRate, "avg_latency_ms": e.avgLatencyMs}
}

func (e *DecisionEngine) CreateSlot(ctx context.Context, appID uuid.UUID, name, format string, width, height int, minCPM int64) (*AdSlot, error) {
	slot := &AdSlot{ID: uuid.New(), AppID: appID, Name: name, Format: format, Width: width, Height: height, MinCPM: minCPM, Enabled: true, CreatedAt: time.Now()}
	if err := e.db.Create(slot).Error; err != nil {
		return nil, err
	}
	return slot, nil
}

func (e *DecisionEngine) ListSlots(appID uuid.UUID) ([]AdSlot, error) {
	var slots []AdSlot
	err := e.db.Where("app_id = ?", appID).Find(&slots).Error
	return slots, err
}

func (e *DecisionEngine) EnableSlot(slotID uuid.UUID, enabled bool) error {
	return e.db.Model(&AdSlot{}).Where("id = ?", slotID).Update("enabled", enabled).Error
}

func (e *DecisionEngine) CreateCreative(ctx context.Context, campaignID uuid.UUID, name, format, contentURL, clickURL, title, desc, cta string) (*AdCreative, error) {
	creative := &AdCreative{ID: uuid.New(), CampaignID: campaignID, Name: name, Format: format, ContentURL: contentURL, ClickURL: clickURL, Title: title, Description: desc, CTAText: cta, Status: "pending", CreatedAt: time.Now()}
	if err := e.db.Create(creative).Error; err != nil {
		return nil, err
	}
	return creative, nil
}

func (e *DecisionEngine) ApproveCreative(creativeID uuid.UUID) error {
	return e.db.Model(&AdCreative{}).Where("id = ?", creativeID).Update("status", "approved").Error
}

func (e *DecisionEngine) RejectCreative(creativeID uuid.UUID) error {
	return e.db.Model(&AdCreative{}).Where("id = ?", creativeID).Update("status", "rejected").Error
}

type AdReport struct {
	CampaignID  string  `json:"campaign_id"`
	Impressions int64   `json:"impressions"`
	Clicks      int64   `json:"clicks"`
	CTR         float64 `json:"ctr"`
	Spend       int64   `json:"spend"`
	AvgCPM      float64 `json:"avg_cpm"`
	AvgCPC      float64 `json:"avg_cpc"`
}

func (e *DecisionEngine) GetCampaignReport(campaignID uuid.UUID, from, to time.Time) (*AdReport, error) {
	var impressions, clicks, totalCPM, totalCPC int64
	e.db.Model(&AdImpression{}).Where("campaign_id = ? AND created_at BETWEEN ? AND ?", campaignID, from, to).Count(&impressions)
	e.db.Model(&AdImpression{}).Where("campaign_id = ? AND created_at BETWEEN ? AND ?", campaignID, from, to).Select("COALESCE(SUM(cpm), 0)").Scan(&totalCPM)
	e.db.Model(&AdClick{}).Where("campaign_id = ? AND created_at BETWEEN ? AND ?", campaignID, from, to).Count(&clicks)
	e.db.Model(&AdClick{}).Where("campaign_id = ? AND created_at BETWEEN ? AND ?", campaignID, from, to).Select("COALESCE(SUM(cpc), 0)").Scan(&totalCPC)
	ctr, avgCPM, avgCPC := float64(0), float64(0), float64(0)
	if impressions > 0 {
		ctr = float64(clicks) / float64(impressions) * 100
		avgCPM = float64(totalCPM) / float64(impressions)
	}
	if clicks > 0 {
		avgCPC = float64(totalCPC) / float64(clicks)
	}
	return &AdReport{CampaignID: campaignID.String(), Impressions: impressions, Clicks: clicks, CTR: ctr, Spend: totalCPM + totalCPC, AvgCPM: avgCPM, AvgCPC: avgCPC}, nil
}
