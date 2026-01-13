package community

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
)

const (
	CommunityTopicPrefix = "nexus-community"
)

// Community representa uma comunidade descentralizada
// Não existe servidor central - a comunidade existe enquanto membros existirem
type Community struct {
	ID          string   `json:"id"`           // Hash único
	Name        string   `json:"name"`
	Description string   `json:"description"`
	CreatorID   string   `json:"creator_id"`
	CreatedAt   int64    `json:"created_at"`
	Rules       []string `json:"rules,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	IsPrivate   bool     `json:"is_private"`   // Se true, requer convite
	MemberCount int      `json:"member_count"` // Estimativa local
}

// CommunityMessage representa uma mensagem em uma comunidade
type CommunityMessage struct {
	ID          string `json:"id"`
	CommunityID string `json:"community_id"`
	AuthorID    string `json:"author_id"`
	AuthorName  string `json:"author_name,omitempty"`
	Content     string `json:"content"`
	Timestamp   int64  `json:"timestamp"`
	Nonce       string `json:"nonce"`
	Signature   string `json:"signature"`
	ReplyTo     string `json:"reply_to,omitempty"`
}

// CommunityService gerencia comunidades descentralizadas
type CommunityService struct {
	ctx         context.Context
	host        host.Host
	privKey     crypto.PrivKey
	ps          *pubsub.PubSub
	communities map[string]*Community
	topics      map[string]*pubsub.Topic
	subs        map[string]*pubsub.Subscription
	messages    map[string][]*CommunityMessage // communityID -> messages
	members     map[string]map[string]bool     // communityID -> peerIDs
	listeners   []func(string, *CommunityMessage)
	mutex       sync.RWMutex
}

// NewCommunityService cria um novo serviço de comunidades
func NewCommunityService(ctx context.Context, h host.Host, privKey crypto.PrivKey, ps *pubsub.PubSub) *CommunityService {
	cs := &CommunityService{
		ctx:         ctx,
		host:        h,
		privKey:     privKey,
		ps:          ps,
		communities: make(map[string]*Community),
		topics:      make(map[string]*pubsub.Topic),
		subs:        make(map[string]*pubsub.Subscription),
		messages:    make(map[string][]*CommunityMessage),
		members:     make(map[string]map[string]bool),
		listeners:   make([]func(string, *CommunityMessage), 0),
	}

	log.Println("[NEXUS] ✓ Serviço de Comunidades inicializado")
	return cs
}

// CreateCommunity cria uma nova comunidade
func (cs *CommunityService) CreateCommunity(name, description string, rules, tags []string, isPrivate bool) (*Community, error) {
	peerID, _ := peer.IDFromPrivateKey(cs.privKey)

	// Gerar ID único
	data := fmt.Sprintf("%s:%s:%d", name, peerID.String(), time.Now().UnixNano())
	hash := sha256.Sum256([]byte(data))
	communityID := hex.EncodeToString(hash[:16])

	community := &Community{
		ID:          communityID,
		Name:        name,
		Description: description,
		CreatorID:   peerID.String(),
		CreatedAt:   time.Now().Unix(),
		Rules:       rules,
		Tags:        tags,
		IsPrivate:   isPrivate,
		MemberCount: 1,
	}

	// Registrar e entrar na comunidade
	cs.mutex.Lock()
	cs.communities[communityID] = community
	cs.members[communityID] = map[string]bool{peerID.String(): true}
	cs.messages[communityID] = make([]*CommunityMessage, 0)
	cs.mutex.Unlock()

	// Subscrever ao tópico da comunidade
	if err := cs.joinCommunityTopic(communityID); err != nil {
		return nil, err
	}

	log.Printf("[NEXUS] Comunidade criada: %s (%s)", name, communityID[:16])
	return community, nil
}

// JoinCommunity entra em uma comunidade existente
func (cs *CommunityService) JoinCommunity(community *Community) error {
	peerID, _ := peer.IDFromPrivateKey(cs.privKey)

	cs.mutex.Lock()
	if _, exists := cs.communities[community.ID]; !exists {
		cs.communities[community.ID] = community
		cs.messages[community.ID] = make([]*CommunityMessage, 0)
	}
	if cs.members[community.ID] == nil {
		cs.members[community.ID] = make(map[string]bool)
	}
	cs.members[community.ID][peerID.String()] = true
	cs.mutex.Unlock()

	if err := cs.joinCommunityTopic(community.ID); err != nil {
		return err
	}

	log.Printf("[NEXUS] Entrou na comunidade: %s", community.Name)
	return nil
}

// LeaveCommunity sai de uma comunidade
func (cs *CommunityService) LeaveCommunity(communityID string) error {
	peerID, _ := peer.IDFromPrivateKey(cs.privKey)

	cs.mutex.Lock()
	if members, exists := cs.members[communityID]; exists {
		delete(members, peerID.String())
	}

	// Cancelar subscription
	if sub, exists := cs.subs[communityID]; exists {
		sub.Cancel()
		delete(cs.subs, communityID)
	}
	if topic, exists := cs.topics[communityID]; exists {
		topic.Close()
		delete(cs.topics, communityID)
	}
	cs.mutex.Unlock()

	log.Printf("[NEXUS] Saiu da comunidade: %s", communityID[:16])
	return nil
}

// joinCommunityTopic subscreve ao tópico GossipSub da comunidade
func (cs *CommunityService) joinCommunityTopic(communityID string) error {
	topicName := fmt.Sprintf("%s/%s", CommunityTopicPrefix, communityID)

	cs.mutex.Lock()
	defer cs.mutex.Unlock()

	if _, exists := cs.topics[communityID]; exists {
		return nil // Já subscrito
	}

	topic, err := cs.ps.Join(topicName)
	if err != nil {
		return err
	}
	cs.topics[communityID] = topic

	sub, err := topic.Subscribe()
	if err != nil {
		return err
	}
	cs.subs[communityID] = sub

	// Iniciar loop de leitura
	go cs.readLoop(communityID, sub)

	return nil
}

// readLoop lê mensagens de uma comunidade
func (cs *CommunityService) readLoop(communityID string, sub *pubsub.Subscription) {
	for {
		select {
		case <-cs.ctx.Done():
			return
		default:
			msg, err := sub.Next(cs.ctx)
			if err != nil {
				if err == context.Canceled || err == pubsub.ErrSubscriptionCancelled {
					return
				}
				continue
			}

			if msg.ReceivedFrom == cs.host.ID() {
				continue
			}

			var communityMsg CommunityMessage
			if err := json.Unmarshal(msg.Data, &communityMsg); err != nil {
				continue
			}

			// Verificar assinatura
			if !cs.verifyMessage(&communityMsg) {
				log.Printf("[NEXUS] Comunidade: Mensagem com assinatura inválida")
				continue
			}

			// Registrar membro
			cs.mutex.Lock()
			if cs.members[communityID] == nil {
				cs.members[communityID] = make(map[string]bool)
			}
			cs.members[communityID][communityMsg.AuthorID] = true

			// Salvar mensagem
			cs.messages[communityID] = append(cs.messages[communityID], &communityMsg)
			if len(cs.messages[communityID]) > 500 {
				cs.messages[communityID] = cs.messages[communityID][1:]
			}
			cs.mutex.Unlock()

			// Notificar listeners
			for _, listener := range cs.listeners {
				go listener(communityID, &communityMsg)
			}
		}
	}
}

// SendMessage envia uma mensagem para uma comunidade
func (cs *CommunityService) SendMessage(communityID, content string, replyTo string) (*CommunityMessage, error) {
	peerID, _ := peer.IDFromPrivateKey(cs.privKey)

	cs.mutex.RLock()
	topic, exists := cs.topics[communityID]
	cs.mutex.RUnlock()

	if !exists {
		return nil, fmt.Errorf("não está na comunidade")
	}

	// Criar mensagem
	nonce := generateNonce()
	timestamp := time.Now().Unix()

	msg := &CommunityMessage{
		ID:          generateMessageID(peerID.String(), timestamp, content),
		CommunityID: communityID,
		AuthorID:    peerID.String(),
		Content:     content,
		Timestamp:   timestamp,
		Nonce:       nonce,
		ReplyTo:     replyTo,
	}

	// Assinar
	sigData := fmt.Sprintf("%s:%s:%s:%d:%s", msg.ID, msg.CommunityID, msg.Content, msg.Timestamp, msg.Nonce)
	sig, err := cs.privKey.Sign([]byte(sigData))
	if err != nil {
		return nil, err
	}
	msg.Signature = hex.EncodeToString(sig)

	// Publicar
	data, _ := json.Marshal(msg)
	if err := topic.Publish(cs.ctx, data); err != nil {
		return nil, err
	}

	// Salvar localmente
	cs.mutex.Lock()
	cs.messages[communityID] = append(cs.messages[communityID], msg)
	cs.mutex.Unlock()

	return msg, nil
}

// verifyMessage verifica a assinatura de uma mensagem
func (cs *CommunityService) verifyMessage(msg *CommunityMessage) bool {
	peerID, err := peer.Decode(msg.AuthorID)
	if err != nil {
		return false
	}

	pubKey, err := peerID.ExtractPublicKey()
	if err != nil {
		return false
	}

	sig, err := hex.DecodeString(msg.Signature)
	if err != nil {
		return false
	}

	sigData := fmt.Sprintf("%s:%s:%s:%d:%s", msg.ID, msg.CommunityID, msg.Content, msg.Timestamp, msg.Nonce)
	valid, _ := pubKey.Verify([]byte(sigData), sig)
	return valid
}

// GetCommunities retorna as comunidades que o nó participa
func (cs *CommunityService) GetCommunities() []*Community {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	var communities []*Community
	for _, c := range cs.communities {
		// Atualizar contagem de membros
		if members, exists := cs.members[c.ID]; exists {
			c.MemberCount = len(members)
		}
		communities = append(communities, c)
	}
	return communities
}

// GetMessages retorna mensagens de uma comunidade
func (cs *CommunityService) GetMessages(communityID string, limit int) []*CommunityMessage {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	messages := cs.messages[communityID]
	if len(messages) > limit {
		return messages[len(messages)-limit:]
	}
	return messages
}

// GetMembers retorna membros conhecidos de uma comunidade
func (cs *CommunityService) GetMembers(communityID string) []string {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	var members []string
	if m, exists := cs.members[communityID]; exists {
		for peerID := range m {
			members = append(members, peerID)
		}
	}
	return members
}

// OnMessage registra um listener para novas mensagens
func (cs *CommunityService) OnMessage(listener func(string, *CommunityMessage)) {
	cs.mutex.Lock()
	defer cs.mutex.Unlock()
	cs.listeners = append(cs.listeners, listener)
}

// SearchCommunities busca comunidades por tags
func (cs *CommunityService) SearchCommunities(tag string) []*Community {
	cs.mutex.RLock()
	defer cs.mutex.RUnlock()

	var results []*Community
	for _, c := range cs.communities {
		for _, t := range c.Tags {
			if t == tag {
				results = append(results, c)
				break
			}
		}
	}
	return results
}

func generateNonce() string {
	data := fmt.Sprintf("%d", time.Now().UnixNano())
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:8])
}

func generateMessageID(authorID string, timestamp int64, content string) string {
	data := fmt.Sprintf("%s:%d:%s", authorID, timestamp, content)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:16])
}
