package domain

import (
	"time"

	"gorm.io/gorm"
)

// MedicalRecordVersion representa uma versão do prontuário
type MedicalRecordVersion struct {
	gorm.Model
	MedicalRecordID uint      `json:"medical_record_id" gorm:"index"`
	Version         int       `json:"version"`
	
	// Dados do prontuário nesta versão
	Diagnosis       string    `json:"diagnosis"`
	Symptoms        string    `json:"symptoms"`
	Treatment       string    `json:"treatment"`
	Notes           string    `json:"notes"`
	Vitals          string    `json:"vitals"`          // JSON com sinais vitais
	Allergies       string    `json:"allergies"`
	Medications     string    `json:"medications"`
	
	// Metadados da versão
	ChangedBy       uint      `json:"changed_by"`       // ID do usuário que fez a alteração
	ChangedByName   string    `json:"changed_by_name"`  // Nome do usuário
	ChangeReason    string    `json:"change_reason"`    // Motivo da alteração
	ChangeSummary   string    `json:"change_summary"`   // Resumo das mudanças
	
	// Timestamps
	CreatedAt       time.Time `json:"created_at"`
}

// TableName define o nome da tabela
func (MedicalRecordVersion) TableName() string {
	return "medical_record_versions"
}

// MedicalRecordDiff representa as diferenças entre duas versões
type MedicalRecordDiff struct {
	Field    string `json:"field"`
	OldValue string `json:"old_value"`
	NewValue string `json:"new_value"`
}

// VersionComparison representa a comparação entre duas versões
type VersionComparison struct {
	FromVersion int                 `json:"from_version"`
	ToVersion   int                 `json:"to_version"`
	Differences []MedicalRecordDiff `json:"differences"`
	ChangedAt   time.Time           `json:"changed_at"`
	ChangedBy   string              `json:"changed_by"`
}
