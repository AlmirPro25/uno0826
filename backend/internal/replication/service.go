package replication

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"

	"prost-qs/backend/internal/event" // Para acessar EventRepository e Event
)

// ReplicationService define as operações de negócio para replicação.
type ReplicationService struct {
	stateRepo ReplicationStateRepository
	eventRepo event.EventRepository // Necessário para buscar e persistir eventos
	// aiService *ai.AIService // Para resolução de conflitos por IA
}

// NewReplicationService cria uma nova instância de ReplicationService.
func NewReplicationService(stateRepo ReplicationStateRepository) *ReplicationService {
	// TODO: Injetar event.EventRepository e ai.AIService aqui
	// Por enquanto, o eventRepo será nil, para teste do serviço de replicação.
	return &ReplicationService{
		stateRepo: stateRepo,
		// eventRepo: eventRepo,
		// aiService: aiService,
	}
}

// ReceiveEvents processa eventos recebidos de outro nó.
func (s *ReplicationService) ReceiveEvents(events []ReplicationEvent) (int, int, error) {
	receivedCount := 0
	conflictsResolved := 0

	for _, evt := range events {
		log.Printf("Recebido evento de replicação: %s do nó %s", evt.ID, evt.SourceNodeID)

		// Em um sistema real:
		// 1. Validar assinatura do evento (evt.Signature)
		// 2. Verificar o CausalityChain para ordem e dependências
		// 3. Tentar persistir o evento (s.eventRepo.CreateEvent)
		// 4. Se houver erro de PK (conflito de ID) ou de consistência:
		//    - Chamar s.aiService.ResolveConflict para decidir o que fazer.
		//    - Registrar o conflito e sua resolução.
		// 5. Após persistir, aplicar o evento à projeção de estado (s.eventService.ApplyEvent).

		// Simulação: Apenas loga e incrementa o contador.
		receivedCount++

		// Exemplo de atualização do estado de replicação (mock)
		nodeID := evt.SourceNodeID
		if nodeID == uuid.Nil {
			nodeID = uuid.New() // Criar um ID de nó se não estiver no evento
		}
		state := &ReplicationState{
			NodeID:              nodeID,
			LastSyncedEventID:   evt.ID,
			LastSyncedTimestamp: evt.Timestamp,
			PendingEventsCount:  0, // Reset ou recalcular
			UpdatedAt:           time.Now(),
		}
		if err := s.stateRepo.CreateOrUpdateReplicationState(state); err != nil {
			log.Printf("WARNING: Falha ao atualizar estado de replicação para o nó %s: %v", nodeID, err)
		}
	}

	log.Printf("Processados %d eventos de replicação. Conflitos resolvidos: %d.", receivedCount, conflictsResolved)
	return receivedCount, conflictsResolved, nil
}

// GetEventsSince retorna eventos a partir de um timestamp lógico para replicação.
func (s *ReplicationService) GetEventsSince(timestamp int64, requestingNodeID string) ([]ReplicationEvent, error) {
	// Em um sistema real, usaria s.eventRepo.GetAllEvents(limit, offset) ou
	// um método mais específico para buscar eventos *a partir* de um timestamp
	// e para um *determinado nó*, considerando o last_synced_event_id.

	// Simulação: Retorna eventos mockados.
	var mockEvents []ReplicationEvent
	if time.Now().UnixMilli() > timestamp+5000 { // Se o timestamp for antigo, retorna algo
		mockEvents = append(mockEvents, ReplicationEvent{
			ID:             uuid.New(),
			Type:           "MockEventForReplication",
			Timestamp:      time.Now().UnixMilli(),
			Payload:        json.RawMessage(`{"data": "mock_data_from_node_A"}`),
			Signature:      "mock_signature",
			CausalityChain: []uuid.UUID{},
			Metadata:       map[string]string{"targetNode": requestingNodeID},
			SourceNodeID:   uuid.New(), // Este nó
		})
	}

	log.Printf("Retornando %d eventos para o nó solicitante %s desde o timestamp %d", len(mockEvents), requestingNodeID, timestamp)
	return mockEvents, nil
}

// SyncWithPeer inicia um processo de sincronização com um nó par.
func (s *ReplicationService) SyncWithPeer(peerNodeID uuid.UUID) error {
	// 1. Obter o estado de replicação para o peerNodeID
	state, err := s.stateRepo.GetReplicationStateByNodeID(peerNodeID)
	if err != nil {
		if err.Error() == fmt.Sprintf("estado de replicação para o nó %s não encontrado", peerNodeID) {
			log.Printf("Criando novo estado de replicação para o nó %s", peerNodeID)
			state = &ReplicationState{
				NodeID:              peerNodeID,
				LastSyncedTimestamp: 0, // Começa do zero
				CreatedAt:           time.Now(),
				UpdatedAt:           time.Now(),
			}
			if err := s.stateRepo.CreateOrUpdateReplicationState(state); err != nil {
				return fmt.Errorf("falha ao criar estado de replicação inicial: %w", err)
			}
		} else {
			return fmt.Errorf("falha ao obter estado de replicação para o nó %s: %w", peerNodeID, err)
		}
	}

	// 2. Solicitar eventos do peerNodeID desde LastSyncedTimestamp
	// (Isso exigiria um cliente HTTP para chamar o endpoint /replication/events/since do peer)
	// mockEventsFromPeer, err := callPeerAPI(peerNodeID, state.LastSyncedTimestamp)
	// if err != nil { /* handle error */ }

	// 3. Processar eventos recebidos do peer
	// _, _, err = s.ReceiveEvents(mockEventsFromPeer)
	// if err != nil { /* handle error */ }

	// 4. Enviar eventos para o peer (os eventos deste nó que o peer ainda não tem)
	// (Isso exigiria buscar eventos e enviá-los ao endpoint /replication/events do peer)

	log.Printf("Sincronização com o nó %s iniciada. LastSyncedTimestamp: %d", peerNodeID, state.LastSyncedTimestamp)
	return nil
}
