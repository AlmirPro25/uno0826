package domain

import (
	"time"
)

// ChatConversation represents a conversation between two users
type ChatConversation struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	Participant1ID uint      `json:"participant_1_id" gorm:"index"`
	Participant2ID uint      `json:"participant_2_id" gorm:"index"`
	LastMessage    string    `json:"last_message"`
	LastMessageAt  time.Time `json:"last_message_at"`
	IsMuted1       bool      `json:"is_muted_1" gorm:"default:false"` // Muted by participant 1
	IsMuted2       bool      `json:"is_muted_2" gorm:"default:false"` // Muted by participant 2
	IsBlocked1     bool      `json:"is_blocked_1" gorm:"default:false"`
	IsBlocked2     bool      `json:"is_blocked_2" gorm:"default:false"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relations
	Participant1 User `json:"participant_1,omitempty" gorm:"foreignKey:Participant1ID"`
	Participant2 User `json:"participant_2,omitempty" gorm:"foreignKey:Participant2ID"`
}

// ChatMessage represents a message in a conversation
type ChatMessage struct {
	ID             uint      `json:"id" gorm:"primaryKey"`
	ConversationID uint      `json:"conversation_id" gorm:"index"`
	SenderID       uint      `json:"sender_id" gorm:"index"`
	ReceiverID     uint      `json:"receiver_id" gorm:"index"`
	Content        string    `json:"content"`
	MessageType    string    `json:"message_type" gorm:"default:'text'"` // text, image, file, audio, location
	FileURL        string    `json:"file_url,omitempty"`
	FileName       string    `json:"file_name,omitempty"`
	FileSize       int64     `json:"file_size,omitempty"`
	Read           bool      `json:"read" gorm:"default:false"`
	ReadAt         time.Time `json:"read_at,omitempty"`
	Starred        bool      `json:"starred" gorm:"default:false"`
	ReplyToID      *uint     `json:"reply_to_id,omitempty"`
	DeletedAt      time.Time `json:"deleted_at,omitempty" gorm:"index"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relations
	Conversation ChatConversation `json:"conversation,omitempty" gorm:"foreignKey:ConversationID"`
	Sender       User             `json:"sender,omitempty" gorm:"foreignKey:SenderID"`
	Receiver     User             `json:"receiver,omitempty" gorm:"foreignKey:ReceiverID"`
	ReplyTo      *ChatMessage     `json:"reply_to,omitempty" gorm:"foreignKey:ReplyToID"`
}

// ChatContact represents a user's contact
type ChatContact struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     uint      `json:"user_id" gorm:"index"`
	ContactID  uint      `json:"contact_id" gorm:"index"`
	Nickname   string    `json:"nickname,omitempty"`
	IsFavorite bool      `json:"is_favorite" gorm:"default:false"`
	CreatedAt  time.Time `json:"created_at"`

	// Relations
	User    User `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Contact User `json:"contact,omitempty" gorm:"foreignKey:ContactID"`
}

// FollowedClinic represents a user following a clinic
type FollowedClinic struct {
	ID                   uint      `json:"id" gorm:"primaryKey"`
	UserID               uint      `json:"user_id" gorm:"index"`
	ClinicID             uint      `json:"clinic_id" gorm:"index"`
	NotificationsEnabled bool      `json:"notifications_enabled" gorm:"default:true"`
	CreatedAt            time.Time `json:"created_at"`

	// Relations
	User   User   `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Clinic Clinic `json:"clinic,omitempty" gorm:"foreignKey:ClinicID"`
}

// UserOnlineStatus tracks user online status
type UserOnlineStatus struct {
	UserID   uint      `json:"user_id" gorm:"primaryKey"`
	Online   bool      `json:"online" gorm:"default:false"`
	LastSeen time.Time `json:"last_seen"`
}

// ChatConversationResponse is the API response for a conversation
type ChatConversationResponse struct {
	ID            uint                    `json:"id"`
	Participant   ChatParticipantResponse `json:"participant"`
	LastMessage   string                  `json:"last_message,omitempty"`
	LastMessageAt *time.Time              `json:"last_message_at,omitempty"`
	UnreadCount   int                     `json:"unread_count"`
	IsMuted       bool                    `json:"is_muted"`
	IsBlocked     bool                    `json:"is_blocked"`
	CreatedAt     time.Time               `json:"created_at"`
	UpdatedAt     time.Time               `json:"updated_at"`
}

// ChatParticipantResponse is the API response for a participant
type ChatParticipantResponse struct {
	ID        uint       `json:"id"`
	FullName  string     `json:"full_name"`
	Email     string     `json:"email"`
	Role      string     `json:"role"`
	AvatarURL string     `json:"avatar_url,omitempty"`
	Specialty string     `json:"specialty,omitempty"`
	Online    bool       `json:"online"`
	LastSeen  *time.Time `json:"last_seen,omitempty"`
}

// CreateConversationRequest is the request to create a conversation
type CreateConversationRequest struct {
	ParticipantID uint `json:"participant_id" binding:"required"`
}

// SendMessageRequest is the request to send a message
type SendMessageRequest struct {
	Content     string `json:"content" binding:"required"`
	MessageType string `json:"message_type" binding:"required,oneof=text image file audio location"`
	ReplyToID   *uint  `json:"reply_to_id,omitempty"`
}

// AddContactRequest is the request to add a contact
type AddContactRequest struct {
	ContactID uint   `json:"contact_id" binding:"required"`
	Nickname  string `json:"nickname,omitempty"`
}

// UpdateContactRequest is the request to update a contact
type UpdateContactRequest struct {
	Nickname   *string `json:"nickname,omitempty"`
	IsFavorite *bool   `json:"is_favorite,omitempty"`
}

// WebSocket message types
type WSMessage struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

type WSNewMessage struct {
	Type    string      `json:"type"`
	Message ChatMessage `json:"message"`
}

type WSTyping struct {
	Type           string `json:"type"`
	ConversationID uint   `json:"conversation_id"`
	UserID         uint   `json:"user_id"`
	Typing         bool   `json:"typing"`
}

type WSOnlineStatus struct {
	Type   string `json:"type"`
	UserID uint   `json:"user_id"`
	Online bool   `json:"online"`
}

type WSMessageRead struct {
	Type      string `json:"type"`
	MessageID uint   `json:"message_id"`
}
