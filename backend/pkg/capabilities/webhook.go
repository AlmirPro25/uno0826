package capabilities

import (
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ========================================
// ADD-ON WEBHOOK PROCESSOR
// "Stripe confirma. Sistema concede. Log registra."
// ========================================

// AddOnWebhookProcessor processa webhooks de add-ons
type AddOnWebhookProcessor struct {
	db *gorm.DB
}

// NewAddOnWebhookProcessor cria novo processor
func NewAddOnWebhookProcessor(db *gorm.DB) *AddOnWebhookProcessor {
	return &AddOnWebhookProcessor{db: db}
}

// ProcessCheckoutCompleted processa checkout.session.completed para add-ons
// Retorna true se processou (era add-on), false se não era add-on
func (p *AddOnWebhookProcessor) ProcessCheckoutCompleted(
	stripeEventID string,
	sessionID string,
	customerID string,
	metadata map[string]string,
) (bool, error) {
	// Verificar se é checkout de add-on
	grantType, hasGrantType := metadata["grant_type"]
	if !hasGrantType || grantType != "addon" {
		return false, nil // Não é add-on, deixar outro handler processar
	}
	
	userIDStr, hasUserID := metadata["user_id"]
	addOnID, hasAddOnID := metadata["addon_id"]
	
	if !hasUserID || !hasAddOnID {
		log.Printf("⚠️ [ADDON_WEBHOOK] Metadata incompleta: user_id=%v addon_id=%v", hasUserID, hasAddOnID)
		return true, nil // Era add-on mas metadata inválida
	}
	
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		log.Printf("❌ [ADDON_WEBHOOK] user_id inválido: %s", userIDStr)
		return true, err
	}
	
	// Verificar idempotência - já processou este evento?
	if p.isEventProcessed(stripeEventID) {
		log.Printf("⏭️ [ADDON_WEBHOOK] Evento já processado: %s", stripeEventID)
		return true, nil
	}
	
	// Verificar se add-on existe
	addon := GetAddOn(addOnID)
	if addon == nil {
		log.Printf("❌ [ADDON_WEBHOOK] Add-on não encontrado: %s", addOnID)
		return true, nil
	}
	
	// Verificar se usuário já tem este add-on ativo
	var existing UserAddOn
	if err := p.db.Where("user_id = ? AND addon_id = ? AND status = ?", userID, addOnID, "active").First(&existing).Error; err == nil {
		// Já tem - renovar
		existing.ExpiresAt = time.Now().AddDate(0, 1, 0) // +1 mês
		existing.UpdatedAt = time.Now()
		p.db.Save(&existing)
		
		p.logGrant(userID, addOnID, "webhook_renewal", stripeEventID, map[string]interface{}{
			"session_id":  sessionID,
			"customer_id": customerID,
		})
		
		log.Printf("🔄 [ADDON_WEBHOOK] Add-on renovado: user=%s addon=%s", userID, addOnID)
		return true, nil
	}
	
	// Criar novo add-on
	now := time.Now()
	userAddOn := UserAddOn{
		ID:                   uuid.New(),
		UserID:               userID,
		AddOnID:              addOnID,
		Status:               "active",
		StripeSubscriptionID: "", // Será preenchido se for subscription
		StartedAt:            now,
		ExpiresAt:            now.AddDate(0, 1, 0), // +1 mês
		CreatedAt:            now,
		UpdatedAt:            now,
	}
	
	if err := p.db.Create(&userAddOn).Error; err != nil {
		log.Printf("❌ [ADDON_WEBHOOK] Erro ao criar add-on: %v", err)
		return true, err
	}
	
	// Registrar grant
	p.logGrant(userID, addOnID, "webhook", stripeEventID, map[string]interface{}{
		"session_id":  sessionID,
		"customer_id": customerID,
	})
	
	// Marcar evento como processado
	p.markEventProcessed(stripeEventID, "addon_checkout_completed")
	
	log.Printf("🎉 [ADDON_WEBHOOK] Add-on concedido: user=%s addon=%s capability=%s", 
		userID, addOnID, addon.Capability)
	
	return true, nil
}

// ProcessSubscriptionUpdated processa customer.subscription.updated para add-ons
func (p *AddOnWebhookProcessor) ProcessSubscriptionUpdated(
	stripeEventID string,
	stripeSubID string,
	status string,
	metadata map[string]string,
) (bool, error) {
	// Verificar se é subscription de add-on
	grantType, hasGrantType := metadata["grant_type"]
	if !hasGrantType || grantType != "addon" {
		return false, nil
	}
	
	// Verificar idempotência
	if p.isEventProcessed(stripeEventID) {
		return true, nil
	}
	
	// Buscar add-on por stripe_subscription_id
	var userAddOn UserAddOn
	if err := p.db.Where("stripe_subscription_id = ?", stripeSubID).First(&userAddOn).Error; err != nil {
		log.Printf("⚠️ [ADDON_WEBHOOK] Subscription não encontrada: %s", stripeSubID)
		return true, nil
	}
	
	// Atualizar status baseado no status do Stripe
	switch status {
	case "active", "trialing":
		userAddOn.Status = "active"
	case "past_due":
		userAddOn.Status = "past_due"
	case "canceled", "unpaid":
		userAddOn.Status = "canceled"
		userAddOn.CanceledAt = time.Now()
	}
	
	userAddOn.UpdatedAt = time.Now()
	p.db.Save(&userAddOn)
	
	p.markEventProcessed(stripeEventID, "addon_subscription_updated")
	
	log.Printf("📝 [ADDON_WEBHOOK] Add-on atualizado: addon=%s status=%s", userAddOn.AddOnID, status)
	
	return true, nil
}

// ProcessSubscriptionDeleted processa customer.subscription.deleted para add-ons
func (p *AddOnWebhookProcessor) ProcessSubscriptionDeleted(
	stripeEventID string,
	stripeSubID string,
) (bool, error) {
	// Verificar idempotência
	if p.isEventProcessed(stripeEventID) {
		return true, nil
	}
	
	// Buscar add-on por stripe_subscription_id
	var userAddOn UserAddOn
	if err := p.db.Where("stripe_subscription_id = ?", stripeSubID).First(&userAddOn).Error; err != nil {
		// Pode não ser add-on
		return false, nil
	}
	
	// Cancelar
	userAddOn.Status = "canceled"
	userAddOn.CanceledAt = time.Now()
	userAddOn.UpdatedAt = time.Now()
	p.db.Save(&userAddOn)
	
	p.logGrant(userAddOn.UserID, userAddOn.AddOnID, "webhook_canceled", stripeEventID, nil)
	p.markEventProcessed(stripeEventID, "addon_subscription_deleted")
	
	log.Printf("🚫 [ADDON_WEBHOOK] Add-on cancelado: user=%s addon=%s", userAddOn.UserID, userAddOn.AddOnID)
	
	return true, nil
}

// ========================================
// HELPERS
// ========================================

// isEventProcessed verifica se evento já foi processado
func (p *AddOnWebhookProcessor) isEventProcessed(eventID string) bool {
	var count int64
	p.db.Model(&AddOnGrantLog{}).Where("stripe_event_id = ?", eventID).Count(&count)
	return count > 0
}

// markEventProcessed marca evento como processado (via grant log)
func (p *AddOnWebhookProcessor) markEventProcessed(eventID, eventType string) {
	// O grant log já serve como registro de idempotência
	// Mas podemos ter um registro separado se necessário
}

// logGrant registra grant com metadata
func (p *AddOnWebhookProcessor) logGrant(userID uuid.UUID, addOnID, trigger, stripeEventID string, metadata map[string]interface{}) {
	metadataJSON := ""
	if metadata != nil {
		if data, err := json.Marshal(metadata); err == nil {
			metadataJSON = string(data)
		}
	}
	
	grantLog := AddOnGrantLog{
		ID:            uuid.New(),
		UserID:        userID,
		AddOnID:       addOnID,
		Trigger:       trigger,
		StripeEventID: stripeEventID,
		Metadata:      metadataJSON,
		CreatedAt:     time.Now(),
	}
	p.db.Create(&grantLog)
}
