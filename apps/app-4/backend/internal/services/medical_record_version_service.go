package services

import (
	"encoding/json"
	"reflect"
	"time"

	"gorm.io/gorm"
)

// MedicalRecordVersionService gerencia versões de prontuários
type MedicalRecordVersionService struct {
	db *gorm.DB
}

// MedicalRecordVersion representa uma versão do prontuário
type MedicalRecordVersion struct {
	ID              uint      `json:"id"`
	MedicalRecordID uint      `json:"medical_record_id"`
	Version         int       `json:"version"`
	Diagnosis       string    `json:"diagnosis"`
	Symptoms        string    `json:"symptoms"`
	Treatment       string    `json:"treatment"`
	Notes           string    `json:"notes"`
	Vitals          string    `json:"vitals"`
	Allergies       string    `json:"allergies"`
	Medications     string    `json:"medications"`
	ChangedBy       uint      `json:"changed_by"`
	ChangedByName   string    `json:"changed_by_name"`
	ChangeReason    string    `json:"change_reason"`
	ChangeSummary   string    `json:"change_summary"`
	CreatedAt       time.Time `json:"created_at"`
}

// MedicalRecordData dados do prontuário para versionamento
type MedicalRecordData struct {
	Diagnosis   string `json:"diagnosis"`
	Symptoms    string `json:"symptoms"`
	Treatment   string `json:"treatment"`
	Notes       string `json:"notes"`
	Vitals      string `json:"vitals"`
	Allergies   string `json:"allergies"`
	Medications string `json:"medications"`
}

// FieldDiff representa uma diferença em um campo
type FieldDiff struct {
	Field    string `json:"field"`
	OldValue string `json:"old_value"`
	NewValue string `json:"new_value"`
}

// NewMedicalRecordVersionService cria uma nova instância do serviço
func NewMedicalRecordVersionService(db *gorm.DB) *MedicalRecordVersionService {
	return &MedicalRecordVersionService{db: db}
}

// CreateVersion cria uma nova versão do prontuário
func (s *MedicalRecordVersionService) CreateVersion(
	recordID uint,
	data MedicalRecordData,
	changedBy uint,
	changedByName string,
	changeReason string,
) (*MedicalRecordVersion, error) {
	// Buscar última versão
	var lastVersion MedicalRecordVersion
	s.db.Where("medical_record_id = ?", recordID).
		Order("version DESC").
		First(&lastVersion)

	newVersionNum := lastVersion.Version + 1

	// Calcular resumo das mudanças
	changeSummary := s.calculateChangeSummary(&lastVersion, &data)

	version := &MedicalRecordVersion{
		MedicalRecordID: recordID,
		Version:         newVersionNum,
		Diagnosis:       data.Diagnosis,
		Symptoms:        data.Symptoms,
		Treatment:       data.Treatment,
		Notes:           data.Notes,
		Vitals:          data.Vitals,
		Allergies:       data.Allergies,
		Medications:     data.Medications,
		ChangedBy:       changedBy,
		ChangedByName:   changedByName,
		ChangeReason:    changeReason,
		ChangeSummary:   changeSummary,
		CreatedAt:       time.Now(),
	}

	if err := s.db.Create(version).Error; err != nil {
		return nil, err
	}

	return version, nil
}

// GetVersions retorna todas as versões de um prontuário
func (s *MedicalRecordVersionService) GetVersions(recordID uint) ([]MedicalRecordVersion, error) {
	var versions []MedicalRecordVersion
	
	err := s.db.Where("medical_record_id = ?", recordID).
		Order("version DESC").
		Find(&versions).Error
	
	return versions, err
}

// GetVersion retorna uma versão específica
func (s *MedicalRecordVersionService) GetVersion(recordID uint, versionNum int) (*MedicalRecordVersion, error) {
	var version MedicalRecordVersion
	
	err := s.db.Where("medical_record_id = ? AND version = ?", recordID, versionNum).
		First(&version).Error
	
	if err != nil {
		return nil, err
	}
	
	return &version, nil
}

// CompareVersions compara duas versões e retorna as diferenças
func (s *MedicalRecordVersionService) CompareVersions(recordID uint, fromVersion, toVersion int) ([]FieldDiff, error) {
	var from, to MedicalRecordVersion
	
	if err := s.db.Where("medical_record_id = ? AND version = ?", recordID, fromVersion).First(&from).Error; err != nil {
		return nil, err
	}
	
	if err := s.db.Where("medical_record_id = ? AND version = ?", recordID, toVersion).First(&to).Error; err != nil {
		return nil, err
	}
	
	return s.calculateDifferences(&from, &to), nil
}

// RestoreVersion restaura uma versão anterior
func (s *MedicalRecordVersionService) RestoreVersion(
	recordID uint,
	versionNum int,
	restoredBy uint,
	restoredByName string,
) (*MedicalRecordVersion, error) {
	// Buscar versão a ser restaurada
	oldVersion, err := s.GetVersion(recordID, versionNum)
	if err != nil {
		return nil, err
	}

	// Criar nova versão com os dados da versão antiga
	data := MedicalRecordData{
		Diagnosis:   oldVersion.Diagnosis,
		Symptoms:    oldVersion.Symptoms,
		Treatment:   oldVersion.Treatment,
		Notes:       oldVersion.Notes,
		Vitals:      oldVersion.Vitals,
		Allergies:   oldVersion.Allergies,
		Medications: oldVersion.Medications,
	}

	changeReason := "Restaurado da versão " + string(rune(versionNum))

	return s.CreateVersion(recordID, data, restoredBy, restoredByName, changeReason)
}

// calculateChangeSummary calcula um resumo das mudanças
func (s *MedicalRecordVersionService) calculateChangeSummary(old *MedicalRecordVersion, new *MedicalRecordData) string {
	if old.ID == 0 {
		return "Versão inicial"
	}

	changes := []string{}

	if old.Diagnosis != new.Diagnosis {
		changes = append(changes, "diagnóstico")
	}
	if old.Symptoms != new.Symptoms {
		changes = append(changes, "sintomas")
	}
	if old.Treatment != new.Treatment {
		changes = append(changes, "tratamento")
	}
	if old.Notes != new.Notes {
		changes = append(changes, "observações")
	}
	if old.Vitals != new.Vitals {
		changes = append(changes, "sinais vitais")
	}
	if old.Allergies != new.Allergies {
		changes = append(changes, "alergias")
	}
	if old.Medications != new.Medications {
		changes = append(changes, "medicamentos")
	}

	if len(changes) == 0 {
		return "Sem alterações"
	}

	summary := "Alterado: "
	for i, change := range changes {
		if i > 0 {
			summary += ", "
		}
		summary += change
	}

	return summary
}

// calculateDifferences calcula as diferenças entre duas versões
func (s *MedicalRecordVersionService) calculateDifferences(from, to *MedicalRecordVersion) []FieldDiff {
	diffs := []FieldDiff{}

	fields := map[string][2]string{
		"Diagnóstico":   {from.Diagnosis, to.Diagnosis},
		"Sintomas":      {from.Symptoms, to.Symptoms},
		"Tratamento":    {from.Treatment, to.Treatment},
		"Observações":   {from.Notes, to.Notes},
		"Sinais Vitais": {from.Vitals, to.Vitals},
		"Alergias":      {from.Allergies, to.Allergies},
		"Medicamentos":  {from.Medications, to.Medications},
	}

	for field, values := range fields {
		if values[0] != values[1] {
			diffs = append(diffs, FieldDiff{
				Field:    field,
				OldValue: values[0],
				NewValue: values[1],
			})
		}
	}

	return diffs
}

// GetVersionCount retorna o número de versões de um prontuário
func (s *MedicalRecordVersionService) GetVersionCount(recordID uint) (int64, error) {
	var count int64
	err := s.db.Model(&MedicalRecordVersion{}).
		Where("medical_record_id = ?", recordID).
		Count(&count).Error
	return count, err
}

// ExportVersionHistory exporta o histórico de versões em JSON
func (s *MedicalRecordVersionService) ExportVersionHistory(recordID uint) ([]byte, error) {
	versions, err := s.GetVersions(recordID)
	if err != nil {
		return nil, err
	}

	return json.MarshalIndent(versions, "", "  ")
}

// Dummy function to avoid unused import error
func init() {
	_ = reflect.TypeOf(nil)
}
