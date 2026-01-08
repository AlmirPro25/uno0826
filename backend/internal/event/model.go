
package event

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Event representa um fato imutável no ledger do kernel.
type Event struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Type           string         `gorm:"size:255;not null" json:"type"`
	Timestamp      int64          `gorm:"not null" json:"timestamp"` // Unix epoch ms
	Payload        json.RawMessage `gorm:"type:jsonb;not null" json:"payload"` // Dados do evento em JSON
	Signature      string         `gorm:"type:text;not null" json:"signature"` // Assinatura criptográfica
	CausalityChain string         `gorm:"type:text" json:"causalityChain"`    // JSON array de IDs de eventos causadores
	Metadata       map[string]string `gorm:"type:jsonb" json:"metadata"`       // Metadados adicionais, e.g., userId, sourceNodeId
	gorm.Model
}

// UnmarshalJSON customizado para Metadata
func (e *Event) UnmarshalJSON(data []byte) error {
	type Alias Event
	aux := &struct {
		Metadata map[string]string `json:"metadata"`
		*Alias
	}{
		Alias: (*Alias)(e),
	}
	if err := json.Unmarshal(data, aux); err != nil {
		return err
	}
	e.Metadata = aux.Metadata
	return nil
}

// MarshalJSON customizado para Metadata
func (e Event) MarshalJSON() ([]byte, error) {
	type Alias Event
	return json.Marshal(&struct {
		Metadata map[string]string `json:"metadata"`
		Alias
	}{
		Metadata: e.Metadata,
		Alias:    (Alias)(e),
	})
}


// EntityState representa o estado atual de uma entidade (projeção).
// Esta é uma representação genérica. Em um sistema real, haveria modelos específicos
// para UserState, AccountState, etc., derivados dos eventos.
type EntityState struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	EntityType string    `gorm:"size:255;not null" json:"entityType"`
	StateData  json.RawMessage `gorm:"type:jsonb;not null" json:"stateData"`
	Version   int       `gorm:"not null" json:"version"` // Versão do estado (número de eventos aplicados)
	LastEventID uuid.UUID `gorm:"type:uuid;not null" json:"lastEventId"`
	CreatedAt time.Time `gorm:"not null" json:"createdAt"`
	UpdatedAt time.Time `gorm:"not null" json:"updatedAt"`
	gorm.Model
}

