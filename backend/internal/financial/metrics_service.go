package financial

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// FINANCIAL METRICS SERVICE
// "Métricas derivadas, não recalculadas"
// ========================================

type MetricsService struct {
	db *gorm.DB
}

func NewMetricsService(db *gorm.DB) *MetricsService {
	return &MetricsService{db: db}
}

// ========================================
// APP METRICS
// ========================================

// GetAppMetrics retorna métricas de um app
func (s *MetricsService) GetAppMetrics(appID uuid.UUID) (*AppFinancialMetrics, error) {
	var metrics AppFinancialMetrics
	if err := s.db.Where("app_id = ?", appID).First(&metrics).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Retornar métricas zeradas se não existir
			return &AppFinancialMetrics{
				AppID:     appID,
				CreatedAt: time.Now(),
			}, nil
		}
		return nil, err
	}
	return &metrics, nil
}

// GetAppMetricsWithRolling retorna métricas com cálculos rolling
func (s *MetricsService) GetAppMetricsWithRolling(appID uuid.UUID) (*AppMetricsResponse, error) {
	metrics, err := s.GetAppMetrics(appID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	today := now.Truncate(24 * time.Hour)
	day7 := today.AddDate(0, 0, -7)
	day30 := today.AddDate(0, 0, -30)

	// Calcular rolling metrics dos snapshots
	var revenueToday, revenue7d, revenue30d int64

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("app_id = ? AND date = ?", appID, today).
		Select("COALESCE(SUM(revenue), 0)").
		Scan(&revenueToday)

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("app_id = ? AND date >= ?", appID, day7).
		Select("COALESCE(SUM(revenue), 0)").
		Scan(&revenue7d)

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("app_id = ? AND date >= ?", appID, day30).
		Select("COALESCE(SUM(revenue), 0)").
		Scan(&revenue30d)

	return &AppMetricsResponse{
		AppID:               appID,
		TotalRevenue:        metrics.TotalRevenue,
		TotalRefunds:        metrics.TotalRefunds,
		TotalFees:           metrics.TotalFees,
		NetRevenue:          metrics.NetRevenue,
		PaymentsSuccess:     metrics.PaymentsSuccess,
		PaymentsFailed:      metrics.PaymentsFailed,
		RefundsCount:        metrics.RefundsCount,
		DisputesCount:       metrics.DisputesCount,
		ActiveSubscriptions: metrics.ActiveSubscriptions,
		RevenueToday:        revenueToday,
		Revenue7d:           revenue7d,
		Revenue30d:          revenue30d,
		LastPaymentAt:       metrics.LastPaymentAt,
		LastEventAt:         metrics.LastEventAt,
	}, nil
}

// AppMetricsResponse resposta formatada de métricas
type AppMetricsResponse struct {
	AppID               uuid.UUID  `json:"app_id"`
	TotalRevenue        int64      `json:"total_revenue"`
	TotalRefunds        int64      `json:"total_refunds"`
	TotalFees           int64      `json:"total_fees"`
	NetRevenue          int64      `json:"net_revenue"`
	PaymentsSuccess     int64      `json:"payments_success"`
	PaymentsFailed      int64      `json:"payments_failed"`
	RefundsCount        int64      `json:"refunds_count"`
	DisputesCount       int64      `json:"disputes_count"`
	ActiveSubscriptions int64      `json:"active_subscriptions"`
	RevenueToday        int64      `json:"revenue_today"`
	Revenue7d           int64      `json:"revenue_7d"`
	Revenue30d          int64      `json:"revenue_30d"`
	LastPaymentAt       *time.Time `json:"last_payment_at,omitempty"`
	LastEventAt         *time.Time `json:"last_event_at,omitempty"`
}

// ========================================
// GLOBAL METRICS (Super Admin)
// ========================================

// GetGlobalMetrics retorna métricas globais
func (s *MetricsService) GetGlobalMetrics() (*GlobalMetricsResponse, error) {
	var metrics GlobalFinancialMetrics
	if err := s.db.First(&metrics).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &GlobalMetricsResponse{}, nil
		}
		return nil, err
	}

	now := time.Now()
	today := now.Truncate(24 * time.Hour)
	day7 := today.AddDate(0, 0, -7)
	day30 := today.AddDate(0, 0, -30)

	// Rolling metrics
	var revenueToday, revenue7d, revenue30d int64
	var volumeToday, volume7d, volume30d int64

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("date = ?", today).
		Select("COALESCE(SUM(revenue), 0)").
		Scan(&revenueToday)

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("date >= ?", day7).
		Select("COALESCE(SUM(revenue), 0)").
		Scan(&revenue7d)

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("date >= ?", day30).
		Select("COALESCE(SUM(revenue), 0)").
		Scan(&revenue30d)

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("date = ?", today).
		Select("COALESCE(SUM(payments_success), 0)").
		Scan(&volumeToday)

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("date >= ?", day7).
		Select("COALESCE(SUM(payments_success), 0)").
		Scan(&volume7d)

	s.db.Model(&DailyFinancialSnapshot{}).
		Where("date >= ?", day30).
		Select("COALESCE(SUM(payments_success), 0)").
		Scan(&volume30d)

	// Contar apps ativos
	var activeApps int64
	s.db.Model(&AppFinancialMetrics{}).
		Where("last_payment_at >= ?", day30).
		Count(&activeApps)

	var totalApps int64
	s.db.Model(&AppFinancialMetrics{}).Count(&totalApps)

	return &GlobalMetricsResponse{
		TotalRevenue:   metrics.TotalRevenue,
		TotalRefunds:   metrics.TotalRefunds,
		TotalFees:      metrics.TotalFees,
		NetRevenue:     metrics.NetRevenue,
		TotalPayments:  metrics.TotalPayments,
		TotalApps:      totalApps,
		ActiveApps:     activeApps,
		RevenueToday:   revenueToday,
		Revenue7d:      revenue7d,
		Revenue30d:     revenue30d,
		VolumeToday:    volumeToday,
		Volume7d:       volume7d,
		Volume30d:      volume30d,
		UpdatedAt:      metrics.UpdatedAt,
	}, nil
}

// GlobalMetricsResponse resposta de métricas globais
type GlobalMetricsResponse struct {
	TotalRevenue  int64     `json:"total_revenue"`
	TotalRefunds  int64     `json:"total_refunds"`
	TotalFees     int64     `json:"total_fees"`
	NetRevenue    int64     `json:"net_revenue"`
	TotalPayments int64     `json:"total_payments"`
	TotalApps     int64     `json:"total_apps"`
	ActiveApps    int64     `json:"active_apps"`
	RevenueToday  int64     `json:"revenue_today"`
	Revenue7d     int64     `json:"revenue_7d"`
	Revenue30d    int64     `json:"revenue_30d"`
	VolumeToday   int64     `json:"volume_today"`
	Volume7d      int64     `json:"volume_7d"`
	Volume30d     int64     `json:"volume_30d"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ========================================
// DAILY SNAPSHOTS (para gráficos)
// ========================================

// GetDailySnapshots retorna snapshots diários de um app
func (s *MetricsService) GetDailySnapshots(appID uuid.UUID, days int) ([]DailyFinancialSnapshot, error) {
	since := time.Now().AddDate(0, 0, -days).Truncate(24 * time.Hour)
	
	var snapshots []DailyFinancialSnapshot
	err := s.db.Where("app_id = ? AND date >= ?", appID, since).
		Order("date ASC").
		Find(&snapshots).Error
	
	return snapshots, err
}

// GetGlobalDailySnapshots retorna snapshots diários globais
func (s *MetricsService) GetGlobalDailySnapshots(days int) ([]GlobalDailySnapshot, error) {
	since := time.Now().AddDate(0, 0, -days).Truncate(24 * time.Hour)
	
	var results []GlobalDailySnapshot
	err := s.db.Model(&DailyFinancialSnapshot{}).
		Where("date >= ?", since).
		Select("date, SUM(revenue) as revenue, SUM(refunds) as refunds, SUM(net_revenue) as net_revenue, SUM(payments_success) as payments_success").
		Group("date").
		Order("date ASC").
		Scan(&results).Error
	
	return results, err
}

// GlobalDailySnapshot snapshot diário agregado
type GlobalDailySnapshot struct {
	Date            time.Time `json:"date"`
	Revenue         int64     `json:"revenue"`
	Refunds         int64     `json:"refunds"`
	NetRevenue      int64     `json:"net_revenue"`
	PaymentsSuccess int64     `json:"payments_success"`
}

// ========================================
// TOP APPS
// ========================================

// GetTopAppsByRevenue retorna apps com maior receita
func (s *MetricsService) GetTopAppsByRevenue(limit int) ([]AppRevenueRank, error) {
	var results []AppRevenueRank
	err := s.db.Model(&AppFinancialMetrics{}).
		Select("app_id, total_revenue, net_revenue, payments_success").
		Order("total_revenue DESC").
		Limit(limit).
		Scan(&results).Error
	return results, err
}

// AppRevenueRank ranking de apps por receita
type AppRevenueRank struct {
	AppID           uuid.UUID `json:"app_id"`
	TotalRevenue    int64     `json:"total_revenue"`
	NetRevenue      int64     `json:"net_revenue"`
	PaymentsSuccess int64     `json:"payments_success"`
}

// ========================================
// RECALCULATE (para correções)
// ========================================

// RecalculateAppMetrics recalcula métricas de um app a partir dos eventos
func (s *MetricsService) RecalculateAppMetrics(appID uuid.UUID) error {
	// Zerar métricas
	s.db.Where("app_id = ?", appID).Delete(&AppFinancialMetrics{})
	
	// Criar nova entrada
	metrics := AppFinancialMetrics{
		ID:        uuid.New(),
		AppID:     appID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Calcular totais dos eventos
	var totalRevenue, totalRefunds, totalFees int64
	var paymentsSuccess, paymentsFailed, refundsCount int64

	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ?", appID, EventPaymentSucceeded).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRevenue)

	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ?", appID, EventPaymentSucceeded).
		Select("COALESCE(SUM(fee_amount), 0)").
		Scan(&totalFees)

	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ?", appID, EventRefundSucceeded).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&totalRefunds)

	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ?", appID, EventPaymentSucceeded).
		Count(&paymentsSuccess)

	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ?", appID, EventPaymentFailed).
		Count(&paymentsFailed)

	s.db.Model(&FinancialEvent{}).
		Where("app_id = ? AND type = ?", appID, EventRefundSucceeded).
		Count(&refundsCount)

	metrics.TotalRevenue = totalRevenue
	metrics.TotalRefunds = totalRefunds
	metrics.TotalFees = totalFees
	metrics.NetRevenue = totalRevenue - totalRefunds - totalFees
	metrics.PaymentsSuccess = paymentsSuccess
	metrics.PaymentsFailed = paymentsFailed
	metrics.RefundsCount = refundsCount

	return s.db.Create(&metrics).Error
}
