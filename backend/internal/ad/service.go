package ad

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Ad representa um anúncio no ecossistema neural.
type Ad struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Title          string    `json:"title"`
	Content        string    `json:"content"`
	TargetURL      string    `json:"targetUrl"`
	ImpressionCost float64   `json:"impressionCost"`
	Status         string    `json:"status"` // "active", "paused", "finished"
	AppID          string    `json:"appId"`  // ID da aplicação que vinculou o anúncio
	CreatedAt      time.Time `json:"createdAt"`
}

// AdEventPayload é o payload para eventos de anúncios.
type AdEventPayload struct {
	AdID      string    `json:"adId"`
	Type      string    `json:"type"` // "impression", "click"
	Cost      float64   `json:"cost"`
	AppID     string    `json:"appId"`
	Timestamp time.Time `json:"timestamp"`
}

type AdService struct {
	db *gorm.DB
}

func NewAdService(db *gorm.DB) *AdService {
	return &AdService{db: db}
}

// RegisterAd registra um novo anúncio (Intenção Pura).
func (s *AdService) RegisterAd(title, content, targetURL string, cost float64, appID string) (*Ad, error) {
	ad := &Ad{
		ID:             uuid.New(),
		Title:          title,
		Content:        content,
		TargetURL:      targetURL,
		ImpressionCost: cost,
		Status:         "active",
		AppID:          appID,
		CreatedAt:      time.Now(),
	}
	// Em um sistema de Pure Intention, não salvamos aqui.
	// Mas como anúncios podem ser dados de referência, podemos salvar a configuração inicial.
	// No entanto, para seguir o kernel, vamos apenas retornar o objeto para ser gravado via evento.
	return ad, nil
}

// TrackImpression gera o payload para um evento de impressão de anúncio.
func (s *AdService) TrackImpression(adID string, appID string) (*AdEventPayload, error) {
	var ad Ad
	if err := s.db.Where("id = ?", adID).First(&ad).Error; err != nil {
		return nil, fmt.Errorf("anúncio não encontrado: %w", err)
	}

	return &AdEventPayload{
		AdID:      adID,
		Type:      "impression",
		Cost:      ad.ImpressionCost,
		AppID:     appID,
		Timestamp: time.Now(),
	}, nil
}
