package repository

import (
	"time"

	"medisync-platform/backend/internal/core/domain"

	"gorm.io/gorm"
)

type ChatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

// Conversations

func (r *ChatRepository) GetConversations(userID uint) ([]domain.ChatConversation, error) {
	var conversations []domain.ChatConversation
	err := r.db.Where("participant_1_id = ? OR participant_2_id = ?", userID, userID).
		Preload("Participant1").
		Preload("Participant2").
		Order("last_message_at DESC").
		Find(&conversations).Error
	return conversations, err
}

func (r *ChatRepository) GetConversation(id uint) (*domain.ChatConversation, error) {
	var conversation domain.ChatConversation
	err := r.db.Preload("Participant1").Preload("Participant2").First(&conversation, id).Error
	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *ChatRepository) GetConversationByParticipants(user1ID, user2ID uint) (*domain.ChatConversation, error) {
	var conversation domain.ChatConversation
	err := r.db.Where(
		"(participant_1_id = ? AND participant_2_id = ?) OR (participant_1_id = ? AND participant_2_id = ?)",
		user1ID, user2ID, user2ID, user1ID,
	).Preload("Participant1").Preload("Participant2").First(&conversation).Error
	if err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *ChatRepository) CreateConversation(conversation *domain.ChatConversation) error {
	return r.db.Create(conversation).Error
}

func (r *ChatRepository) UpdateConversation(conversation *domain.ChatConversation) error {
	return r.db.Save(conversation).Error
}

func (r *ChatRepository) DeleteConversation(id uint) error {
	return r.db.Delete(&domain.ChatConversation{}, id).Error
}

func (r *ChatRepository) MuteConversation(conversationID, userID uint, muted bool) error {
	var conversation domain.ChatConversation
	if err := r.db.First(&conversation, conversationID).Error; err != nil {
		return err
	}

	if conversation.Participant1ID == userID {
		conversation.IsMuted1 = muted
	} else {
		conversation.IsMuted2 = muted
	}

	return r.db.Save(&conversation).Error
}

func (r *ChatRepository) BlockConversation(conversationID, userID uint, blocked bool) error {
	var conversation domain.ChatConversation
	if err := r.db.First(&conversation, conversationID).Error; err != nil {
		return err
	}

	if conversation.Participant1ID == userID {
		conversation.IsBlocked1 = blocked
	} else {
		conversation.IsBlocked2 = blocked
	}

	return r.db.Save(&conversation).Error
}

// Messages

func (r *ChatRepository) GetMessages(conversationID uint, page, limit int) ([]domain.ChatMessage, error) {
	var messages []domain.ChatMessage
	offset := (page - 1) * limit

	err := r.db.Where("conversation_id = ? AND deleted_at IS NULL", conversationID).
		Preload("Sender").
		Preload("ReplyTo").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&messages).Error

	// Reverse to get chronological order
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, err
}

func (r *ChatRepository) GetMessage(id uint) (*domain.ChatMessage, error) {
	var message domain.ChatMessage
	err := r.db.Preload("Sender").Preload("ReplyTo").First(&message, id).Error
	if err != nil {
		return nil, err
	}
	return &message, nil
}

func (r *ChatRepository) CreateMessage(message *domain.ChatMessage) error {
	if err := r.db.Create(message).Error; err != nil {
		return err
	}

	// Update conversation last message
	return r.db.Model(&domain.ChatConversation{}).
		Where("id = ?", message.ConversationID).
		Updates(map[string]interface{}{
			"last_message":    message.Content,
			"last_message_at": message.CreatedAt,
		}).Error
}

func (r *ChatRepository) MarkAsRead(conversationID, userID uint) error {
	return r.db.Model(&domain.ChatMessage{}).
		Where("conversation_id = ? AND receiver_id = ? AND read = ?", conversationID, userID, false).
		Updates(map[string]interface{}{
			"read":    true,
			"read_at": time.Now(),
		}).Error
}

func (r *ChatRepository) MarkMessageAsRead(messageID uint) error {
	return r.db.Model(&domain.ChatMessage{}).
		Where("id = ?", messageID).
		Updates(map[string]interface{}{
			"read":    true,
			"read_at": time.Now(),
		}).Error
}

func (r *ChatRepository) StarMessage(messageID uint, starred bool) error {
	return r.db.Model(&domain.ChatMessage{}).
		Where("id = ?", messageID).
		Update("starred", starred).Error
}

func (r *ChatRepository) DeleteMessage(messageID uint) error {
	return r.db.Model(&domain.ChatMessage{}).
		Where("id = ?", messageID).
		Update("deleted_at", time.Now()).Error
}

func (r *ChatRepository) GetUnreadCount(conversationID, userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&domain.ChatMessage{}).
		Where("conversation_id = ? AND receiver_id = ? AND read = ?", conversationID, userID, false).
		Count(&count).Error
	return count, err
}

func (r *ChatRepository) GetTotalUnreadCount(userID uint) (int64, error) {
	var count int64
	err := r.db.Model(&domain.ChatMessage{}).
		Where("receiver_id = ? AND read = ?", userID, false).
		Count(&count).Error
	return count, err
}

// Contacts

func (r *ChatRepository) GetContacts(userID uint) ([]domain.ChatContact, error) {
	var contacts []domain.ChatContact
	err := r.db.Where("user_id = ?", userID).
		Preload("Contact").
		Order("is_favorite DESC, created_at DESC").
		Find(&contacts).Error
	return contacts, err
}

func (r *ChatRepository) GetContact(userID, contactID uint) (*domain.ChatContact, error) {
	var contact domain.ChatContact
	err := r.db.Where("user_id = ? AND contact_id = ?", userID, contactID).
		Preload("Contact").
		First(&contact).Error
	if err != nil {
		return nil, err
	}
	return &contact, nil
}

func (r *ChatRepository) AddContact(contact *domain.ChatContact) error {
	return r.db.Create(contact).Error
}

func (r *ChatRepository) UpdateContact(contact *domain.ChatContact) error {
	return r.db.Save(contact).Error
}

func (r *ChatRepository) RemoveContact(userID, contactID uint) error {
	return r.db.Where("user_id = ? AND contact_id = ?", userID, contactID).
		Delete(&domain.ChatContact{}).Error
}

// Followed Clinics

func (r *ChatRepository) GetFollowedClinics(userID uint) ([]domain.FollowedClinic, error) {
	var clinics []domain.FollowedClinic
	err := r.db.Where("user_id = ?", userID).
		Preload("Clinic").
		Order("created_at DESC").
		Find(&clinics).Error
	return clinics, err
}

func (r *ChatRepository) FollowClinic(follow *domain.FollowedClinic) error {
	return r.db.Create(follow).Error
}

func (r *ChatRepository) UnfollowClinic(userID, clinicID uint) error {
	return r.db.Where("user_id = ? AND clinic_id = ?", userID, clinicID).
		Delete(&domain.FollowedClinic{}).Error
}

func (r *ChatRepository) IsFollowingClinic(userID, clinicID uint) (bool, error) {
	var count int64
	err := r.db.Model(&domain.FollowedClinic{}).
		Where("user_id = ? AND clinic_id = ?", userID, clinicID).
		Count(&count).Error
	return count > 0, err
}

func (r *ChatRepository) ToggleClinicNotifications(userID, clinicID uint, enabled bool) error {
	return r.db.Model(&domain.FollowedClinic{}).
		Where("user_id = ? AND clinic_id = ?", userID, clinicID).
		Update("notifications_enabled", enabled).Error
}

// Online Status

func (r *ChatRepository) UpdateOnlineStatus(userID uint, online bool) error {
	status := domain.UserOnlineStatus{
		UserID:   userID,
		Online:   online,
		LastSeen: time.Now(),
	}
	return r.db.Save(&status).Error
}

func (r *ChatRepository) GetOnlineStatus(userID uint) (*domain.UserOnlineStatus, error) {
	var status domain.UserOnlineStatus
	err := r.db.First(&status, userID).Error
	if err != nil {
		return nil, err
	}
	return &status, nil
}

func (r *ChatRepository) GetOnlineUsers(userIDs []uint) (map[uint]bool, error) {
	var statuses []domain.UserOnlineStatus
	err := r.db.Where("user_id IN ?", userIDs).Find(&statuses).Error
	if err != nil {
		return nil, err
	}

	result := make(map[uint]bool)
	for _, s := range statuses {
		result[s.UserID] = s.Online
	}
	return result, nil
}

// Search

func (r *ChatRepository) SearchUsers(query string, role string, limit int) ([]domain.User, error) {
	var users []domain.User
	q := r.db.Where("full_name ILIKE ? OR email ILIKE ?", "%"+query+"%", "%"+query+"%")
	
	if role != "" {
		q = q.Where("role = ?", role)
	}
	
	err := q.Limit(limit).Find(&users).Error
	return users, err
}

func (r *ChatRepository) SearchMessages(query string, conversationID *uint, userID uint, limit int) ([]domain.ChatMessage, error) {
	var messages []domain.ChatMessage
	q := r.db.Where("content ILIKE ? AND (sender_id = ? OR receiver_id = ?)", "%"+query+"%", userID, userID)
	
	if conversationID != nil {
		q = q.Where("conversation_id = ?", *conversationID)
	}
	
	err := q.Preload("Sender").Order("created_at DESC").Limit(limit).Find(&messages).Error
	return messages, err
}
