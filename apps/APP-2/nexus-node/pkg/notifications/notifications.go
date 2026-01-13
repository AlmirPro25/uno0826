package notifications

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// NotificationType define tipos de notificação
type NotificationType string

const (
	NotifyNewMessage      NotificationType = "new_message"
	NotifyNewPost         NotificationType = "new_post"
	NotifyPostLiked       NotificationType = "post_liked"
	NotifyNewFollower     NotificationType = "new_follower"
	NotifyMention         NotificationType = "mention"
	NotifyFileReceived    NotificationType = "file_received"
	NotifyDownloadComplete NotificationType = "download_complete"
	NotifyCallIncoming    NotificationType = "call_incoming"
	NotifyCallMissed      NotificationType = "call_missed"
	NotifyCommunityInvite NotificationType = "community_invite"
	NotifyCommunityMessage NotificationType = "community_message"
	NotifyPeerConnected   NotificationType = "peer_connected"
	NotifyPeerDisconnected NotificationType = "peer_disconnected"
)

// Notification representa uma notificação
type Notification struct {
	ID        string           `json:"id"`
	Type      NotificationType `json:"type"`
	Title     string           `json:"title"`
	Body      string           `json:"body"`
	PeerID    string           `json:"peer_id,omitempty"`
	PeerName  string           `json:"peer_name,omitempty"`
	Data      interface{}      `json:"data,omitempty"`
	Timestamp int64            `json:"timestamp"`
	Read      bool             `json:"read"`
	ActionURL string           `json:"action_url,omitempty"`
}

// NotificationService gerencia notificações
type NotificationService struct {
	notifications []*Notification
	listeners     []func(*Notification)
	unreadCount   int
	maxHistory    int
	mutex         sync.RWMutex
}

// NewNotificationService cria um novo serviço de notificações
func NewNotificationService() *NotificationService {
	ns := &NotificationService{
		notifications: make([]*Notification, 0),
		listeners:     make([]func(*Notification), 0),
		maxHistory:    100,
	}

	log.Println("[NEXUS] ✓ Serviço de Notificações inicializado")
	return ns
}

// Push adiciona uma nova notificação
func (ns *NotificationService) Push(notif *Notification) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	// Gerar ID se não existir
	if notif.ID == "" {
		notif.ID = generateNotificationID()
	}
	notif.Timestamp = time.Now().Unix()
	notif.Read = false

	// Adicionar ao início
	ns.notifications = append([]*Notification{notif}, ns.notifications...)

	// Manter limite
	if len(ns.notifications) > ns.maxHistory {
		ns.notifications = ns.notifications[:ns.maxHistory]
	}

	ns.unreadCount++

	// Notificar listeners
	for _, listener := range ns.listeners {
		go listener(notif)
	}

	log.Printf("[NEXUS] Notificação: %s - %s", notif.Type, notif.Title)
}

// PushSimple cria e envia uma notificação simples
func (ns *NotificationService) PushSimple(notifType NotificationType, title, body string) {
	ns.Push(&Notification{
		Type:  notifType,
		Title: title,
		Body:  body,
	})
}

// PushFromPeer cria notificação relacionada a um peer
func (ns *NotificationService) PushFromPeer(notifType NotificationType, title, body, peerID, peerName string) {
	ns.Push(&Notification{
		Type:     notifType,
		Title:    title,
		Body:     body,
		PeerID:   peerID,
		PeerName: peerName,
	})
}

// MarkAsRead marca uma notificação como lida
func (ns *NotificationService) MarkAsRead(notifID string) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	for _, n := range ns.notifications {
		if n.ID == notifID && !n.Read {
			n.Read = true
			ns.unreadCount--
			break
		}
	}
}

// MarkAllAsRead marca todas as notificações como lidas
func (ns *NotificationService) MarkAllAsRead() {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	for _, n := range ns.notifications {
		n.Read = true
	}
	ns.unreadCount = 0
}

// GetAll retorna todas as notificações
func (ns *NotificationService) GetAll(limit int) []*Notification {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	if limit <= 0 || limit > len(ns.notifications) {
		limit = len(ns.notifications)
	}
	return ns.notifications[:limit]
}

// GetUnread retorna apenas notificações não lidas
func (ns *NotificationService) GetUnread() []*Notification {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	var unread []*Notification
	for _, n := range ns.notifications {
		if !n.Read {
			unread = append(unread, n)
		}
	}
	return unread
}

// GetUnreadCount retorna contagem de não lidas
func (ns *NotificationService) GetUnreadCount() int {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	return ns.unreadCount
}

// Delete remove uma notificação
func (ns *NotificationService) Delete(notifID string) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	for i, n := range ns.notifications {
		if n.ID == notifID {
			if !n.Read {
				ns.unreadCount--
			}
			ns.notifications = append(ns.notifications[:i], ns.notifications[i+1:]...)
			break
		}
	}
}

// ClearAll limpa todas as notificações
func (ns *NotificationService) ClearAll() {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	ns.notifications = make([]*Notification, 0)
	ns.unreadCount = 0
}

// OnNotification registra um listener para novas notificações
func (ns *NotificationService) OnNotification(listener func(*Notification)) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()
	ns.listeners = append(ns.listeners, listener)
}

// ToJSON serializa notificações para JSON
func (ns *NotificationService) ToJSON() ([]byte, error) {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	return json.Marshal(map[string]interface{}{
		"notifications": ns.notifications,
		"unread_count":  ns.unreadCount,
	})
}

func generateNotificationID() string {
	return time.Now().Format("20060102150405.000000")
}
