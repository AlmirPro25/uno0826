
package replication

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReplicationEvent representa um evento a ser replicado, similar a event.Event,
// mas pode conter campos específicos para metadados de replicação.
type ReplicationEvent struct {
	ID             uuid.UUID         `json:"id"`
	Type           string            `json:"type"`
	Timestamp      int64             `json:"timestamp"` // Unix epoch ms
	Payload        json.RawMessage   `json:"payload"`
	Signature      string            `json:"signature"`
	CausalityChain []uuid.UUID       `json:"causalityChain"` // Array de UUIDs
	Metadata       map[string]string `json:"metadata"`
	SourceNodeID   uuid.UUID         `json:"sourceNodeId"` // ID do nó que originou o evento
}

// ReplicationState armazena o estado de sincronização com outros nós.
type ReplicationState struct {
	NodeID             uuid.UUID `gorm:"type:uuid;primaryKey" json:"nodeId"` // ID do nó parceiro
	LastSyncedEventID  uuid.UUID `gorm:"type:uuid" json:"lastSyncedEventId"`
	LastSyncedTimestamp int64     `json:"lastSyncedTimestamp"`
	PendingEventsCount int       `json:"pendingEventsCount"`
	LastConflictID     uuid.UUID `gorm:"type:uuid" json:"lastConflictId"` // ID do último conflito resolvido por IA
	CreatedAt          time.Time `gorm:"not null" json:"createdAt"`
	UpdatedAt          time.Time `gorm:"not null" json:"updatedAt"`
	gorm.Model
}

// ReceiveEventsResponse é a resposta ao receber eventos.
type ReceiveEventsResponse struct {
	Status            string `json:"status"`
	ReceivedEvents    int    `json:"receivedEvents"`
	ConflictsResolved int    `json:"conflictsResolved"`
	Message           string `json:"message"`
}

