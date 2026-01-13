package p2p

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/database"
)

const (
	GlobalDiscoveryTopic = "nexus-global-discovery-0.1"
	ChatTopicPrefix      = "nexus-chat"
)

// MessageEventHandler processes incoming pubsub messages.
type MessageEventHandler func(context.Context, *pubsub.Message)

// PubSubService manages GossipSub subscriptions and publications.
type PubSubService struct {
	ctx      context.Context
	host     host.Host
	ps       *pubsub.PubSub
	db       *database.SQLiteDB
	topics   map[string]*pubsub.Topic
	subs     map[string]*pubsub.Subscription
	handlers map[string]MessageEventHandler
	mutex    sync.RWMutex
}

// NewPubSubService initializes a new GossipSub service.
func NewPubSubService(ctx context.Context, h host.Host, db *database.SQLiteDB) (*PubSubService, error) {
	ps, err := pubsub.NewGossipSub(ctx, h)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar GossipSub: %w", err)
	}

	pss := &PubSubService{
		ctx:      ctx,
		host:     h,
		ps:       ps,
		db:       db,
		topics:   make(map[string]*pubsub.Topic),
		subs:     make(map[string]*pubsub.Subscription),
		handlers: make(map[string]MessageEventHandler),
	}

	return pss, nil
}

// SubscribeToTopic subscribes to a given GossipSub topic.
func (pss *PubSubService) SubscribeToTopic(ctx context.Context, topicName string) error {
	pss.mutex.Lock()
	defer pss.mutex.Unlock()

	if _, ok := pss.topics[topicName]; ok {
		return nil // Already subscribed
	}

	topic, err := pss.ps.Join(topicName)
	if err != nil {
		return fmt.Errorf("falha ao entrar no tópico '%s': %w", topicName, err)
	}
	pss.topics[topicName] = topic

	sub, err := topic.Subscribe()
	if err != nil {
		return fmt.Errorf("falha ao subscrever tópico '%s': %w", topicName, err)
	}
	pss.subs[topicName] = sub

	log.Printf("[NEXUS] ✓ Subscrito ao tópico: %s", topicName)

	// Start reading messages
	go pss.readLoop(ctx, topicName, sub)

	return nil
}

// Publish publishes a message to a given GossipSub topic.
func (pss *PubSubService) Publish(topicName string, data []byte) error {
	pss.mutex.RLock()
	topic, ok := pss.topics[topicName]
	pss.mutex.RUnlock()

	if !ok {
		return fmt.Errorf("não subscrito ao tópico '%s'", topicName)
	}

	return topic.Publish(pss.ctx, data)
}

// SetMessageHandler registers a custom handler for a given topic.
func (pss *PubSubService) SetMessageHandler(topicName string, handler MessageEventHandler) {
	pss.mutex.Lock()
	pss.handlers[topicName] = handler
	pss.mutex.Unlock()
}

// readLoop reads messages from a subscribed topic.
func (pss *PubSubService) readLoop(ctx context.Context, topicName string, sub *pubsub.Subscription) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			msg, err := sub.Next(ctx)
			if err != nil {
				if err == context.Canceled || err == pubsub.ErrSubscriptionCancelled {
					return
				}
				log.Printf("[NEXUS] ERRO: Falha ao ler do tópico '%s': %v", topicName, err)
				continue
			}

			// Ignore own messages
			if msg.ReceivedFrom == pss.host.ID() {
				continue
			}

			log.Printf("[NEXUS] Mensagem recebida de %s no tópico '%s'",
				msg.ReceivedFrom.String()[:16], topicName)

			// Dispatch to handler
			pss.mutex.RLock()
			handler, ok := pss.handlers[topicName]
			pss.mutex.RUnlock()

			if ok {
				handler(ctx, msg)
			} else {
				pss.defaultHandler(ctx, msg, topicName)
			}
		}
	}
}

// defaultHandler saves messages to the database.
func (pss *PubSubService) defaultHandler(ctx context.Context, msg *pubsub.Message, topicName string) {
	dbMsg := &database.Message{
		SenderPeerID: msg.ReceivedFrom.String(),
		Topic:        topicName,
		Payload:      msg.Data,
		Timestamp:    time.Now().Unix(),
		IsRead:       false,
	}
	if err := pss.db.SaveMessage(dbMsg); err != nil {
		log.Printf("[NEXUS] ERRO: Falha ao salvar mensagem: %v", err)
	}
}

// GetTopic returns a topic by name.
func (pss *PubSubService) GetTopic(topicName string) *pubsub.Topic {
	pss.mutex.RLock()
	defer pss.mutex.RUnlock()
	return pss.topics[topicName]
}
