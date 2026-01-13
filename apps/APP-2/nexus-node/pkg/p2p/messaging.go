package p2p

import (
	"context"
	"crypto/ed25519"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/database"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/lighthouse"
)

const (
	// DirectMessageProtocol é o protocolo para mensagens diretas
	DirectMessageProtocol = "/nexus/dm/1.0.0"
	// DMTopicPrefix prefixo para tópicos de DM
	DMTopicPrefix = "nexus-dm"
)

// DirectMessage representa uma mensagem direta entre peers
type DirectMessage struct {
	ID          string `json:"id"`
	FromPeerID  string `json:"from_peer_id"`
	ToPeerID    string `json:"to_peer_id"`
	Content     []byte `json:"content"`      // Conteúdo criptografado E2E
	ContentType string `json:"content_type"` // text, image, file, etc
	Timestamp   int64  `json:"timestamp"`
	Signature   []byte `json:"signature"` // Assinatura Ed25519
	Nonce       []byte `json:"nonce"`     // Para criptografia
}

// MessageEnvelope envelope para transporte de mensagens
type MessageEnvelope struct {
	Type    string          `json:"type"` // dm, ack, typing, read
	Payload json.RawMessage `json:"payload"`
}

// MessagingService gerencia mensagens diretas P2P
type MessagingService struct {
	ctx              context.Context
	host             *P2PHost
	pubsub           *PubSubService
	db               *database.SQLiteDB
	lighthouseClient *lighthouse.Client
	privKey          crypto.PrivKey
	
	// Callbacks
	onMessage    func(*DirectMessage)
	onDelivered  func(messageID string)
	onRead       func(messageID string)
	
	// Estado
	dmTopics     map[string]*pubsub.Topic
	pendingAcks  map[string]chan bool
	mutex        sync.RWMutex
}

// NewMessagingService cria um novo serviço de mensagens
func NewMessagingService(
	ctx context.Context,
	host *P2PHost,
	lighthouseClient *lighthouse.Client,
) *MessagingService {
	ms := &MessagingService{
		ctx:              ctx,
		host:             host,
		pubsub:           host.GetPubSubService(),
		db:               host.GetDB(),
		lighthouseClient: lighthouseClient,
		privKey:          host.GetPrivKey(),
		dmTopics:         make(map[string]*pubsub.Topic),
		pendingAcks:      make(map[string]chan bool),
	}

	// Registrar handler para mensagens diretas
	ms.setupDMHandler()

	return ms
}

// SetOnMessage define callback para novas mensagens
func (ms *MessagingService) SetOnMessage(handler func(*DirectMessage)) {
	ms.onMessage = handler
}

// SetOnDelivered define callback para confirmação de entrega
func (ms *MessagingService) SetOnDelivered(handler func(messageID string)) {
	ms.onDelivered = handler
}

// SetOnRead define callback para confirmação de leitura
func (ms *MessagingService) SetOnRead(handler func(messageID string)) {
	ms.onRead = handler
}

// SendDirectMessage envia uma mensagem direta para um peer
func (ms *MessagingService) SendDirectMessage(ctx context.Context, toPeerID string, content []byte, contentType string) (*DirectMessage, error) {
	// Gerar ID único
	msgID := fmt.Sprintf("%s-%d-%s", ms.host.ID().String()[:8], time.Now().UnixNano(), toPeerID[:8])

	// Criar mensagem
	msg := &DirectMessage{
		ID:          msgID,
		FromPeerID:  ms.host.ID().String(),
		ToPeerID:    toPeerID,
		Content:     content, // TODO: Criptografar E2E com chave pública do destinatário
		ContentType: contentType,
		Timestamp:   time.Now().Unix(),
	}

	// Assinar mensagem
	if err := ms.signMessage(msg); err != nil {
		return nil, fmt.Errorf("falha ao assinar mensagem: %w", err)
	}

	// Tentar enviar via conexão direta primeiro
	targetPeer, err := peer.Decode(toPeerID)
	if err != nil {
		return nil, fmt.Errorf("peer ID inválido: %w", err)
	}

	// Verificar se já está conectado
	if ms.host.Network().Connectedness(targetPeer) != 2 { // NotConnected
		// Tentar descobrir via Lighthouse
		if err := ms.discoverAndConnect(ctx, toPeerID); err != nil {
			log.Printf("[MESSAGING] Peer offline, usando store-and-forward: %v", err)
		}
	}

	// Enviar via GossipSub (funciona mesmo se peer estiver offline - outros peers podem relay)
	topicName := ms.getDMTopicName(toPeerID)
	if err := ms.ensureDMTopic(ctx, topicName); err != nil {
		return nil, fmt.Errorf("falha ao criar tópico DM: %w", err)
	}

	envelope := MessageEnvelope{
		Type:    "dm",
		Payload: mustMarshal(msg),
	}

	if err := ms.pubsub.Publish(topicName, mustMarshal(envelope)); err != nil {
		return nil, fmt.Errorf("falha ao publicar mensagem: %w", err)
	}

	// Salvar mensagem localmente
	dbMsg := &database.Message{
		ID:           msg.ID,
		SenderPeerID: msg.FromPeerID,
		Topic:        topicName,
		Payload:      content,
		Timestamp:    msg.Timestamp,
		IsRead:       true, // Própria mensagem
	}
	if err := ms.db.SaveMessage(dbMsg); err != nil {
		log.Printf("[MESSAGING] Erro ao salvar mensagem local: %v", err)
	}

	log.Printf("[MESSAGING] ✓ Mensagem enviada para %s", toPeerID[:16])
	return msg, nil
}

// discoverAndConnect tenta descobrir e conectar a um peer via Lighthouse
func (ms *MessagingService) discoverAndConnect(ctx context.Context, peerID string) error {
	if ms.lighthouseClient == nil {
		return fmt.Errorf("lighthouse client não configurado")
	}

	// Buscar peers do lighthouse
	bootstrap, err := ms.lighthouseClient.Bootstrap(ctx)
	if err != nil {
		return fmt.Errorf("falha ao consultar lighthouse: %w", err)
	}

	// Procurar o peer específico
	for _, p := range bootstrap.Peers {
		if p.PeerID == peerID {
			// Encontrado! Tentar conectar
			targetPeer, err := peer.Decode(peerID)
			if err != nil {
				continue
			}

			// Conectar via DHT (o lighthouse não tem endereços diretos por privacidade)
			connectCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
			defer cancel()

			// Usar DHT para encontrar endereços
			peerInfo, err := ms.host.DHT.FindPeer(connectCtx, targetPeer)
			if err != nil {
				return fmt.Errorf("peer não encontrado no DHT: %w", err)
			}

			if err := ms.host.Connect(connectCtx, peerInfo); err != nil {
				return fmt.Errorf("falha ao conectar: %w", err)
			}

			log.Printf("[MESSAGING] ✓ Conectado a %s via Lighthouse+DHT", peerID[:16])
			return nil
		}
	}

	return fmt.Errorf("peer não encontrado no lighthouse")
}

// setupDMHandler configura o handler para receber mensagens diretas
func (ms *MessagingService) setupDMHandler() {
	// Subscrever ao próprio tópico de DM
	myTopic := ms.getDMTopicName(ms.host.ID().String())
	
	go func() {
		time.Sleep(2 * time.Second) // Aguardar inicialização
		
		ctx := ms.ctx
		if err := ms.ensureDMTopic(ctx, myTopic); err != nil {
			log.Printf("[MESSAGING] Erro ao criar tópico DM próprio: %v", err)
			return
		}

		// Registrar handler customizado
		ms.pubsub.SetMessageHandler(myTopic, func(ctx context.Context, msg *pubsub.Message) {
			ms.handleIncomingMessage(ctx, msg)
		})

		log.Printf("[MESSAGING] ✓ Escutando mensagens diretas em %s", myTopic)
	}()
}

// handleIncomingMessage processa mensagens recebidas
func (ms *MessagingService) handleIncomingMessage(ctx context.Context, msg *pubsub.Message) {
	var envelope MessageEnvelope
	if err := json.Unmarshal(msg.Data, &envelope); err != nil {
		log.Printf("[MESSAGING] Erro ao decodificar envelope: %v", err)
		return
	}

	switch envelope.Type {
	case "dm":
		var dm DirectMessage
		if err := json.Unmarshal(envelope.Payload, &dm); err != nil {
			log.Printf("[MESSAGING] Erro ao decodificar DM: %v", err)
			return
		}

		// Verificar assinatura
		if !ms.verifySignature(&dm) {
			log.Printf("[MESSAGING] ⚠️ Assinatura inválida de %s", dm.FromPeerID[:16])
			return
		}

		// Verificar se é para mim
		if dm.ToPeerID != ms.host.ID().String() {
			return // Não é para mim
		}

		log.Printf("[MESSAGING] ✓ Mensagem recebida de %s", dm.FromPeerID[:16])

		// Salvar no banco
		dbMsg := &database.Message{
			ID:           dm.ID,
			SenderPeerID: dm.FromPeerID,
			Topic:        ms.getDMTopicName(dm.FromPeerID),
			Payload:      dm.Content,
			Timestamp:    dm.Timestamp,
			IsRead:       false,
		}
		if err := ms.db.SaveMessage(dbMsg); err != nil {
			log.Printf("[MESSAGING] Erro ao salvar mensagem: %v", err)
		}

		// Enviar ACK
		ms.sendAck(ctx, dm.FromPeerID, dm.ID)

		// Callback
		if ms.onMessage != nil {
			ms.onMessage(&dm)
		}

	case "ack":
		var ack struct {
			MessageID string `json:"message_id"`
		}
		if err := json.Unmarshal(envelope.Payload, &ack); err != nil {
			return
		}

		log.Printf("[MESSAGING] ✓ ACK recebido para %s", ack.MessageID)
		if ms.onDelivered != nil {
			ms.onDelivered(ack.MessageID)
		}

	case "read":
		var read struct {
			MessageID string `json:"message_id"`
		}
		if err := json.Unmarshal(envelope.Payload, &read); err != nil {
			return
		}

		if ms.onRead != nil {
			ms.onRead(read.MessageID)
		}
	}
}

// sendAck envia confirmação de recebimento
func (ms *MessagingService) sendAck(ctx context.Context, toPeerID, messageID string) {
	topicName := ms.getDMTopicName(toPeerID)
	
	ack := struct {
		MessageID string `json:"message_id"`
	}{MessageID: messageID}

	envelope := MessageEnvelope{
		Type:    "ack",
		Payload: mustMarshal(ack),
	}

	if err := ms.ensureDMTopic(ctx, topicName); err != nil {
		return
	}

	ms.pubsub.Publish(topicName, mustMarshal(envelope))
}

// MarkAsRead marca mensagem como lida e notifica o remetente
func (ms *MessagingService) MarkAsRead(ctx context.Context, messageID, senderPeerID string) error {
	// Atualizar no banco
	// TODO: Implementar no database

	// Notificar remetente
	topicName := ms.getDMTopicName(senderPeerID)
	
	read := struct {
		MessageID string `json:"message_id"`
	}{MessageID: messageID}

	envelope := MessageEnvelope{
		Type:    "read",
		Payload: mustMarshal(read),
	}

	if err := ms.ensureDMTopic(ctx, topicName); err != nil {
		return err
	}

	return ms.pubsub.Publish(topicName, mustMarshal(envelope))
}

// getDMTopicName retorna o nome do tópico para DMs de um peer
func (ms *MessagingService) getDMTopicName(peerID string) string {
	return fmt.Sprintf("%s-%s", DMTopicPrefix, peerID[:16])
}

// ensureDMTopic garante que o tópico existe
func (ms *MessagingService) ensureDMTopic(ctx context.Context, topicName string) error {
	ms.mutex.Lock()
	defer ms.mutex.Unlock()

	if _, ok := ms.dmTopics[topicName]; ok {
		return nil
	}

	if err := ms.pubsub.SubscribeToTopic(ctx, topicName); err != nil {
		return err
	}

	ms.dmTopics[topicName] = ms.pubsub.GetTopic(topicName)
	return nil
}

// signMessage assina a mensagem com a chave privada
func (ms *MessagingService) signMessage(msg *DirectMessage) error {
	// Criar payload para assinatura
	payload := fmt.Sprintf("%s|%s|%s|%d", msg.ID, msg.FromPeerID, msg.ToPeerID, msg.Timestamp)
	
	sig, err := ms.privKey.Sign([]byte(payload))
	if err != nil {
		return err
	}
	
	msg.Signature = sig
	return nil
}

// verifySignature verifica a assinatura da mensagem
func (ms *MessagingService) verifySignature(msg *DirectMessage) bool {
	// Decodificar peer ID para obter chave pública
	peerID, err := peer.Decode(msg.FromPeerID)
	if err != nil {
		return false
	}

	pubKey, err := peerID.ExtractPublicKey()
	if err != nil {
		return false
	}

	// Recriar payload
	payload := fmt.Sprintf("%s|%s|%s|%d", msg.ID, msg.FromPeerID, msg.ToPeerID, msg.Timestamp)
	
	ok, err := pubKey.Verify([]byte(payload), msg.Signature)
	return err == nil && ok
}

// GetConversation retorna mensagens de uma conversa
func (ms *MessagingService) GetConversation(peerID string, limit int) ([]*DirectMessage, error) {
	// TODO: Implementar busca no banco
	return nil, nil
}

// GetUnreadCount retorna contagem de mensagens não lidas
func (ms *MessagingService) GetUnreadCount() (int, error) {
	// TODO: Implementar
	return 0, nil
}

// Helper para marshal JSON
func mustMarshal(v interface{}) json.RawMessage {
	data, _ := json.Marshal(v)
	return data
}

// GenerateMessageID gera um ID único para mensagem
func GenerateMessageID(fromPeer, toPeer string) string {
	return fmt.Sprintf("%s-%d-%s", fromPeer[:8], time.Now().UnixNano(), toPeer[:8])
}

// EncryptContent criptografa conteúdo com chave pública do destinatário
// TODO: Implementar criptografia E2E real
func EncryptContent(content []byte, recipientPubKey ed25519.PublicKey) ([]byte, []byte, error) {
	// Por enquanto, retorna sem criptografia
	// Em produção: usar X25519 para key exchange + ChaCha20-Poly1305
	nonce := make([]byte, 24)
	return content, nonce, nil
}

// DecryptContent descriptografa conteúdo
func DecryptContent(encrypted []byte, nonce []byte, privKey ed25519.PrivateKey) ([]byte, error) {
	// Por enquanto, retorna sem descriptografia
	return encrypted, nil
}

// HexEncode codifica bytes para hex
func HexEncode(data []byte) string {
	return hex.EncodeToString(data)
}

// HexDecode decodifica hex para bytes
func HexDecode(s string) ([]byte, error) {
	return hex.DecodeString(s)
}
