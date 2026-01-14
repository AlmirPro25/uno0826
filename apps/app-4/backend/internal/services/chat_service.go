package services

import (
	"context"
	"errors"
	"medisync-platform/backend/internal/adapters/repository"
	"medisync-platform/backend/internal/core/domain"
	"time"
)

type ChatService struct {
	repo     *repository.ChatRepository
	userRepo *repository.UserRepository
}

func NewChatService(repo *repository.ChatRepository, userRepo *repository.UserRepository) *ChatService {
	return &ChatService{repo: repo, userRepo: userRepo}
}

// Conversations

func (s *ChatService) GetConversations(userID uint) ([]domain.ChatConversationResponse, error) {
	conversations, err := s.repo.GetConversations(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]domain.ChatConversationResponse, len(conversations))
	for i, conv := range conversations {
		responses[i] = s.toConversationResponse(conv, userID)
	}

	return responses, nil
}

func (s *ChatService) GetConversation(id, userID uint) (*domain.ChatConversationResponse, error) {
	conv, err := s.repo.GetConversation(id)
	if err != nil {
		return nil, err
	}

	// Verify user is participant
	if conv.Participant1ID != userID && conv.Participant2ID != userID {
		return nil, errors.New("não autorizado")
	}

	response := s.toConversationResponse(*conv, userID)
	return &response, nil
}

func (s *ChatService) CreateConversation(userID, participantID uint) (*domain.ChatConversationResponse, error) {
	// Check if conversation already exists
	existing, _ := s.repo.GetConversationByParticipants(userID, participantID)
	if existing != nil {
		response := s.toConversationResponse(*existing, userID)
		return &response, nil
	}

	// Verify participant exists
	participant, err := s.userRepo.FindByID(context.Background(), int(participantID))
	if err != nil {
		return nil, errors.New("usuário não encontrado")
	}
	if participant == nil {
		return nil, errors.New("usuário não encontrado")
	}

	conv := &domain.ChatConversation{
		Participant1ID: userID,
		Participant2ID: participantID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.CreateConversation(conv); err != nil {
		return nil, err
	}

	// Reload with relations
	conv, _ = s.repo.GetConversation(conv.ID)
	response := s.toConversationResponse(*conv, userID)
	return &response, nil
}

func (s *ChatService) DeleteConversation(id, userID uint) error {
	conv, err := s.repo.GetConversation(id)
	if err != nil {
		return err
	}

	if conv.Participant1ID != userID && conv.Participant2ID != userID {
		return errors.New("não autorizado")
	}

	return s.repo.DeleteConversation(id)
}

func (s *ChatService) MuteConversation(conversationID, userID uint, muted bool) error {
	conv, err := s.repo.GetConversation(conversationID)
	if err != nil {
		return err
	}

	if conv.Participant1ID != userID && conv.Participant2ID != userID {
		return errors.New("não autorizado")
	}

	return s.repo.MuteConversation(conversationID, userID, muted)
}

func (s *ChatService) BlockConversation(conversationID, userID uint, blocked bool) error {
	conv, err := s.repo.GetConversation(conversationID)
	if err != nil {
		return err
	}

	if conv.Participant1ID != userID && conv.Participant2ID != userID {
		return errors.New("não autorizado")
	}

	return s.repo.BlockConversation(conversationID, userID, blocked)
}

// Messages

func (s *ChatService) GetMessages(conversationID, userID uint, page, limit int) ([]domain.ChatMessage, error) {
	conv, err := s.repo.GetConversation(conversationID)
	if err != nil {
		return nil, err
	}

	if conv.Participant1ID != userID && conv.Participant2ID != userID {
		return nil, errors.New("não autorizado")
	}

	return s.repo.GetMessages(conversationID, page, limit)
}

func (s *ChatService) SendMessage(conversationID, senderID uint, req domain.SendMessageRequest) (*domain.ChatMessage, error) {
	conv, err := s.repo.GetConversation(conversationID)
	if err != nil {
		return nil, err
	}

	if conv.Participant1ID != senderID && conv.Participant2ID != senderID {
		return nil, errors.New("não autorizado")
	}

	// Check if blocked
	if (conv.Participant1ID == senderID && conv.IsBlocked2) ||
		(conv.Participant2ID == senderID && conv.IsBlocked1) {
		return nil, errors.New("conversa bloqueada")
	}

	// Determine receiver
	receiverID := conv.Participant1ID
	if conv.Participant1ID == senderID {
		receiverID = conv.Participant2ID
	}

	message := &domain.ChatMessage{
		ConversationID: conversationID,
		SenderID:       senderID,
		ReceiverID:     receiverID,
		Content:        req.Content,
		MessageType:    req.MessageType,
		ReplyToID:      req.ReplyToID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.CreateMessage(message); err != nil {
		return nil, err
	}

	// Reload with relations
	return s.repo.GetMessage(message.ID)
}


func (s *ChatService) MarkAsRead(conversationID, userID uint) error {
	conv, err := s.repo.GetConversation(conversationID)
	if err != nil {
		return err
	}

	if conv.Participant1ID != userID && conv.Participant2ID != userID {
		return errors.New("não autorizado")
	}

	return s.repo.MarkAsRead(conversationID, userID)
}

func (s *ChatService) StarMessage(messageID, userID uint, starred bool) error {
	msg, err := s.repo.GetMessage(messageID)
	if err != nil {
		return err
	}

	if msg.SenderID != userID && msg.ReceiverID != userID {
		return errors.New("não autorizado")
	}

	return s.repo.StarMessage(messageID, starred)
}

func (s *ChatService) DeleteMessage(messageID, userID uint) error {
	msg, err := s.repo.GetMessage(messageID)
	if err != nil {
		return err
	}

	if msg.SenderID != userID {
		return errors.New("não autorizado")
	}

	return s.repo.DeleteMessage(messageID)
}

func (s *ChatService) GetUnreadCount(conversationID, userID uint) (int64, error) {
	return s.repo.GetUnreadCount(conversationID, userID)
}

func (s *ChatService) GetTotalUnreadCount(userID uint) (int64, error) {
	return s.repo.GetTotalUnreadCount(userID)
}

// Contacts

func (s *ChatService) GetContacts(userID uint) ([]domain.ChatContact, error) {
	return s.repo.GetContacts(userID)
}

func (s *ChatService) AddContact(userID uint, req domain.AddContactRequest) (*domain.ChatContact, error) {
	// Check if already a contact
	existing, _ := s.repo.GetContact(userID, req.ContactID)
	if existing != nil {
		return existing, nil
	}

	// Verify contact exists
	contact, err := s.userRepo.FindByID(context.Background(), int(req.ContactID))
	if err != nil || contact == nil {
		return nil, errors.New("usuário não encontrado")
	}

	chatContact := &domain.ChatContact{
		UserID:    userID,
		ContactID: req.ContactID,
		Nickname:  req.Nickname,
		CreatedAt: time.Now(),
	}

	if err := s.repo.AddContact(chatContact); err != nil {
		return nil, err
	}

	return s.repo.GetContact(userID, req.ContactID)
}

func (s *ChatService) UpdateContact(userID, contactID uint, req domain.UpdateContactRequest) (*domain.ChatContact, error) {
	contact, err := s.repo.GetContact(userID, contactID)
	if err != nil {
		return nil, err
	}

	if req.Nickname != nil {
		contact.Nickname = *req.Nickname
	}
	if req.IsFavorite != nil {
		contact.IsFavorite = *req.IsFavorite
	}

	if err := s.repo.UpdateContact(contact); err != nil {
		return nil, err
	}

	return contact, nil
}

func (s *ChatService) RemoveContact(userID, contactID uint) error {
	return s.repo.RemoveContact(userID, contactID)
}

// Followed Clinics

func (s *ChatService) GetFollowedClinics(userID uint) ([]domain.FollowedClinic, error) {
	return s.repo.GetFollowedClinics(userID)
}

func (s *ChatService) FollowClinic(userID, clinicID uint) (*domain.FollowedClinic, error) {
	// Check if already following
	isFollowing, _ := s.repo.IsFollowingClinic(userID, clinicID)
	if isFollowing {
		clinics, _ := s.repo.GetFollowedClinics(userID)
		for _, c := range clinics {
			if c.ClinicID == clinicID {
				return &c, nil
			}
		}
	}

	follow := &domain.FollowedClinic{
		UserID:               userID,
		ClinicID:             clinicID,
		NotificationsEnabled: true,
		CreatedAt:            time.Now(),
	}

	if err := s.repo.FollowClinic(follow); err != nil {
		return nil, err
	}

	return follow, nil
}

func (s *ChatService) UnfollowClinic(userID, clinicID uint) error {
	return s.repo.UnfollowClinic(userID, clinicID)
}

func (s *ChatService) ToggleClinicNotifications(userID, clinicID uint, enabled bool) error {
	isFollowing, _ := s.repo.IsFollowingClinic(userID, clinicID)
	if !isFollowing {
		return errors.New("não está seguindo esta clínica")
	}

	return s.repo.ToggleClinicNotifications(userID, clinicID, enabled)
}

// Online Status

func (s *ChatService) UpdateOnlineStatus(userID uint, online bool) error {
	return s.repo.UpdateOnlineStatus(userID, online)
}

func (s *ChatService) GetOnlineStatus(userID uint) (bool, *time.Time, error) {
	status, err := s.repo.GetOnlineStatus(userID)
	if err != nil {
		return false, nil, nil
	}
	return status.Online, &status.LastSeen, nil
}

// Search

func (s *ChatService) SearchUsers(query, role string, limit int) ([]domain.User, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.SearchUsers(query, role, limit)
}

func (s *ChatService) SearchMessages(query string, conversationID *uint, userID uint, limit int) ([]domain.ChatMessage, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.SearchMessages(query, conversationID, userID, limit)
}

// Helper functions

func (s *ChatService) toConversationResponse(conv domain.ChatConversation, userID uint) domain.ChatConversationResponse {
	// Determine which participant is the "other" user
	var participant domain.User
	var isMuted, isBlocked bool

	if conv.Participant1ID == userID {
		participant = conv.Participant2
		isMuted = conv.IsMuted1
		isBlocked = conv.IsBlocked1
	} else {
		participant = conv.Participant1
		isMuted = conv.IsMuted2
		isBlocked = conv.IsBlocked2
	}

	// Get online status
	online := false
	var lastSeen *time.Time
	if status, err := s.repo.GetOnlineStatus(uint(participant.ID)); err == nil {
		online = status.Online
		lastSeen = &status.LastSeen
	}

	// Get unread count
	unreadCount, _ := s.repo.GetUnreadCount(conv.ID, userID)

	// Get specialty if doctor
	specialty := ""
	if participant.Specialty != nil {
		specialty = *participant.Specialty
	}

	// Get role name
	roleName := ""
	if participant.Role.Name != "" {
		roleName = participant.Role.Name
	}

	response := domain.ChatConversationResponse{
		ID: conv.ID,
		Participant: domain.ChatParticipantResponse{
			ID:        uint(participant.ID),
			FullName:  participant.FullName,
			Email:     participant.Email,
			Role:      roleName,
			AvatarURL: "", // User doesn't have AvatarURL field yet
			Specialty: specialty,
			Online:    online,
			LastSeen:  lastSeen,
		},
		LastMessage: conv.LastMessage,
		UnreadCount: int(unreadCount),
		IsMuted:     isMuted,
		IsBlocked:   isBlocked,
		CreatedAt:   conv.CreatedAt,
		UpdatedAt:   conv.UpdatedAt,
	}

	if !conv.LastMessageAt.IsZero() {
		response.LastMessageAt = &conv.LastMessageAt
	}

	return response
}
