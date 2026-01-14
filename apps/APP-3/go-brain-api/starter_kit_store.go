package main

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                    STARTER KIT STORE - Persistência SQLite                    ║
║                                                                               ║
║              "Nunca perca uma geração. Lixo hoje pode ser ouro amanhã."      ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// StarterKitStore gerencia persistência dos Starter Kits
type StarterKitStore struct {
	db *sql.DB
}

// NewStarterKitStore cria nova instância do store
func NewStarterKitStore(dbPath string) (*StarterKitStore, error) {
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_synchronous=NORMAL")
	if err != nil {
		return nil, fmt.Errorf("erro ao abrir banco: %w", err)
	}

	store := &StarterKitStore{db: db}
	if err := store.initialize(); err != nil {
		return nil, fmt.Errorf("erro ao inicializar: %w", err)
	}

	return store, nil
}

// initialize cria as tabelas necessárias
func (s *StarterKitStore) initialize() error {
	schema := `
	-- Tabela principal de Starter Kits
	CREATE TABLE IF NOT EXISTS starter_kits (
		id TEXT PRIMARY KEY,
		version INTEGER DEFAULT 1,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL,
		
		-- Conteúdo
		code TEXT NOT NULL,
		prompt TEXT NOT NULL,
		readme TEXT DEFAULT '',
		architecture TEXT DEFAULT '',
		
		-- Metadados (JSON)
		metadata TEXT DEFAULT '{}',
		
		-- Classificação (JSON)
		classification TEXT DEFAULT '{}',
		
		-- Marketplace (JSON)
		marketplace_status TEXT DEFAULT '{}',
		
		-- Ownership
		owner_id TEXT NOT NULL,
		is_public INTEGER DEFAULT 0,
		license_type TEXT DEFAULT 'user_owned'
	);

	-- Índices para busca rápida
	CREATE INDEX IF NOT EXISTS idx_sk_owner ON starter_kits(owner_id);
	CREATE INDEX IF NOT EXISTS idx_sk_public ON starter_kits(is_public);
	CREATE INDEX IF NOT EXISTS idx_sk_created ON starter_kits(created_at DESC);

	-- Tabela de histórico (auditoria)
	CREATE TABLE IF NOT EXISTS starter_kit_history (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		kit_id TEXT NOT NULL,
		action TEXT NOT NULL,
		old_value TEXT,
		new_value TEXT,
		changed_by TEXT,
		changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (kit_id) REFERENCES starter_kits(id)
	);

	-- Tabela de métricas do marketplace
	CREATE TABLE IF NOT EXISTS marketplace_events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		kit_id TEXT NOT NULL,
		event_type TEXT NOT NULL,
		user_id TEXT,
		metadata TEXT DEFAULT '{}',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (kit_id) REFERENCES starter_kits(id)
	);

	CREATE INDEX IF NOT EXISTS idx_events_kit ON marketplace_events(kit_id);
	CREATE INDEX IF NOT EXISTS idx_events_type ON marketplace_events(event_type);

	-- Tabela para dataset de treinamento
	CREATE TABLE IF NOT EXISTS training_dataset (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		kit_id TEXT NOT NULL,
		prompt TEXT NOT NULL,
		code TEXT NOT NULL,
		quality_score INTEGER,
		category TEXT,
		added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		used_in_training INTEGER DEFAULT 0,
		FOREIGN KEY (kit_id) REFERENCES starter_kits(id)
	);

	CREATE INDEX IF NOT EXISTS idx_training_quality ON training_dataset(quality_score DESC);
	CREATE INDEX IF NOT EXISTS idx_training_used ON training_dataset(used_in_training);
	`

	_, err := s.db.Exec(schema)
	return err
}

// ═══════════════════════════════════════════════════════════════════════════════
// CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Save salva ou atualiza um Starter Kit
func (s *StarterKitStore) Save(kit *StarterKit) error {
	metadataJSON, _ := json.Marshal(kit.Metadata)
	classificationJSON, _ := json.Marshal(kit.Classification)
	marketplaceJSON, _ := json.Marshal(kit.MarketplaceStatus)

	query := `
	INSERT INTO starter_kits (
		id, version, created_at, updated_at,
		code, prompt, readme, architecture,
		metadata, classification, marketplace_status,
		owner_id, is_public, license_type
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		version = version + 1,
		updated_at = ?,
		code = ?,
		readme = ?,
		architecture = ?,
		metadata = ?,
		classification = ?,
		marketplace_status = ?,
		is_public = ?,
		license_type = ?
	`

	isPublic := 0
	if kit.IsPublic {
		isPublic = 1
	}

	_, err := s.db.Exec(query,
		// INSERT
		kit.ID, kit.Version, kit.CreatedAt, kit.UpdatedAt,
		kit.Code, kit.Prompt, kit.README, kit.Architecture,
		string(metadataJSON), string(classificationJSON), string(marketplaceJSON),
		kit.OwnerID, isPublic, kit.LicenseType,
		// UPDATE
		time.Now().UTC(),
		kit.Code, kit.README, kit.Architecture,
		string(metadataJSON), string(classificationJSON), string(marketplaceJSON),
		isPublic, kit.LicenseType,
	)

	return err
}

// GetByID busca um Starter Kit pelo ID
func (s *StarterKitStore) GetByID(id string) (*StarterKit, error) {
	query := `
	SELECT id, version, created_at, updated_at,
		code, prompt, readme, architecture,
		metadata, classification, marketplace_status,
		owner_id, is_public, license_type
	FROM starter_kits WHERE id = ?
	`

	var kit StarterKit
	var metadataJSON, classificationJSON, marketplaceJSON string
	var isPublic int

	err := s.db.QueryRow(query, id).Scan(
		&kit.ID, &kit.Version, &kit.CreatedAt, &kit.UpdatedAt,
		&kit.Code, &kit.Prompt, &kit.README, &kit.Architecture,
		&metadataJSON, &classificationJSON, &marketplaceJSON,
		&kit.OwnerID, &isPublic, &kit.LicenseType,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	json.Unmarshal([]byte(metadataJSON), &kit.Metadata)
	json.Unmarshal([]byte(classificationJSON), &kit.Classification)
	json.Unmarshal([]byte(marketplaceJSON), &kit.MarketplaceStatus)
	kit.IsPublic = isPublic == 1

	return &kit, nil
}

// ListByOwner lista kits de um usuário
func (s *StarterKitStore) ListByOwner(ownerID string, limit, offset int) ([]*StarterKit, error) {
	query := `
	SELECT id, version, created_at, updated_at,
		code, prompt, readme, architecture,
		metadata, classification, marketplace_status,
		owner_id, is_public, license_type
	FROM starter_kits 
	WHERE owner_id = ?
	ORDER BY created_at DESC
	LIMIT ? OFFSET ?
	`

	return s.queryKits(query, ownerID, limit, offset)
}

// ListPublic lista kits públicos no marketplace
func (s *StarterKitStore) ListPublic(limit, offset int, category string) ([]*StarterKit, error) {
	query := `
	SELECT id, version, created_at, updated_at,
		code, prompt, readme, architecture,
		metadata, classification, marketplace_status,
		owner_id, is_public, license_type
	FROM starter_kits 
	WHERE is_public = 1
	`

	args := []interface{}{}

	if category != "" {
		query += ` AND json_extract(metadata, '$.category') = ?`
		args = append(args, category)
	}

	query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

	return s.queryKits(query, args...)
}

// queryKits executa query e retorna lista de kits
func (s *StarterKitStore) queryKits(query string, args ...interface{}) ([]*StarterKit, error) {
	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var kits []*StarterKit
	for rows.Next() {
		var kit StarterKit
		var metadataJSON, classificationJSON, marketplaceJSON string
		var isPublic int

		err := rows.Scan(
			&kit.ID, &kit.Version, &kit.CreatedAt, &kit.UpdatedAt,
			&kit.Code, &kit.Prompt, &kit.README, &kit.Architecture,
			&metadataJSON, &classificationJSON, &marketplaceJSON,
			&kit.OwnerID, &isPublic, &kit.LicenseType,
		)
		if err != nil {
			return nil, err
		}

		json.Unmarshal([]byte(metadataJSON), &kit.Metadata)
		json.Unmarshal([]byte(classificationJSON), &kit.Classification)
		json.Unmarshal([]byte(marketplaceJSON), &kit.MarketplaceStatus)
		kit.IsPublic = isPublic == 1

		kits = append(kits, &kit)
	}

	return kits, nil
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKETPLACE EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

// RecordEvent registra evento do marketplace
func (s *StarterKitStore) RecordEvent(kitID, eventType, userID string, metadata map[string]interface{}) error {
	metadataJSON, _ := json.Marshal(metadata)

	query := `
	INSERT INTO marketplace_events (kit_id, event_type, user_id, metadata)
	VALUES (?, ?, ?, ?)
	`

	_, err := s.db.Exec(query, kitID, eventType, userID, string(metadataJSON))
	return err
}

// GetStats retorna estatísticas gerais
func (s *StarterKitStore) GetStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total de kits
	var total int
	s.db.QueryRow("SELECT COUNT(*) FROM starter_kits").Scan(&total)
	stats["total_kits"] = total

	// Kits públicos
	var public int
	s.db.QueryRow("SELECT COUNT(*) FROM starter_kits WHERE is_public = 1").Scan(&public)
	stats["public_kits"] = public

	// Por categoria
	rows, _ := s.db.Query(`
		SELECT json_extract(metadata, '$.category') as cat, COUNT(*) 
		FROM starter_kits 
		GROUP BY cat
	`)
	categories := make(map[string]int)
	for rows.Next() {
		var cat sql.NullString
		var count int
		rows.Scan(&cat, &count)
		if cat.Valid {
			categories[cat.String] = count
		}
	}
	rows.Close()
	stats["by_category"] = categories

	// Qualidade média
	var avgQuality float64
	s.db.QueryRow(`
		SELECT AVG(json_extract(classification, '$.quality_score')) 
		FROM starter_kits 
		WHERE json_extract(classification, '$.quality_score') > 0
	`).Scan(&avgQuality)
	stats["avg_quality"] = avgQuality

	// Dataset de treinamento
	var trainingCount int
	s.db.QueryRow("SELECT COUNT(*) FROM training_dataset").Scan(&trainingCount)
	stats["training_samples"] = trainingCount

	return stats, nil
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING DATASET
// ═══════════════════════════════════════════════════════════════════════════════

// AddToTrainingDataset adiciona kit ao dataset de treinamento
func (s *StarterKitStore) AddToTrainingDataset(kit *StarterKit) error {
	query := `
	INSERT INTO training_dataset (kit_id, prompt, code, quality_score, category)
	VALUES (?, ?, ?, ?, ?)
	`

	_, err := s.db.Exec(query,
		kit.ID,
		kit.Prompt,
		kit.Code,
		kit.Classification.QualityScore,
		kit.Metadata.Category,
	)
	return err
}

// GetTrainingData exporta dados para fine-tuning
func (s *StarterKitStore) GetTrainingData(minQuality int, limit int) ([]map[string]string, error) {
	query := `
	SELECT prompt, code FROM training_dataset
	WHERE quality_score >= ? AND used_in_training = 0
	ORDER BY quality_score DESC
	LIMIT ?
	`

	rows, err := s.db.Query(query, minQuality, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []map[string]string
	for rows.Next() {
		var prompt, code string
		rows.Scan(&prompt, &code)
		data = append(data, map[string]string{
			"prompt":     prompt,
			"completion": code,
		})
	}

	return data, nil
}

// MarkAsUsedInTraining marca dados como usados no treinamento
func (s *StarterKitStore) MarkAsUsedInTraining(ids []int) error {
	for _, id := range ids {
		s.db.Exec("UPDATE training_dataset SET used_in_training = 1 WHERE id = ?", id)
	}
	return nil
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════════

// Search busca kits por texto no prompt, código ou categoria
func (s *StarterKitStore) Search(query string, limit int, category string, minQuality int) ([]*StarterKit, error) {
	searchQuery := `
	SELECT id, version, created_at, updated_at,
		code, prompt, readme, architecture,
		metadata, classification, marketplace_status,
		owner_id, is_public, license_type
	FROM starter_kits 
	WHERE is_public = 1
		AND (
			prompt LIKE ? 
			OR code LIKE ? 
			OR json_extract(metadata, '$.category') LIKE ?
			OR json_extract(metadata, '$.tags') LIKE ?
		)
	`

	args := []interface{}{
		"%" + query + "%",
		"%" + query + "%",
		"%" + query + "%",
		"%" + query + "%",
	}

	if category != "" {
		searchQuery += ` AND json_extract(metadata, '$.category') = ?`
		args = append(args, category)
	}

	if minQuality > 0 {
		searchQuery += ` AND json_extract(classification, '$.quality_score') >= ?`
		args = append(args, minQuality)
	}

	searchQuery += ` ORDER BY json_extract(classification, '$.quality_score') DESC LIMIT ?`
	args = append(args, limit)

	return s.queryKits(searchQuery, args...)
}

// GetTopKits retorna os melhores kits por qualidade
func (s *StarterKitStore) GetTopKits(limit int) ([]*StarterKit, error) {
	query := `
	SELECT id, version, created_at, updated_at,
		code, prompt, readme, architecture,
		metadata, classification, marketplace_status,
		owner_id, is_public, license_type
	FROM starter_kits 
	WHERE is_public = 1
	ORDER BY json_extract(classification, '$.quality_score') DESC
	LIMIT ?
	`

	return s.queryKits(query, limit)
}

// GetFeaturedKits retorna kits em destaque
func (s *StarterKitStore) GetFeaturedKits(limit int) ([]*StarterKit, error) {
	query := `
	SELECT id, version, created_at, updated_at,
		code, prompt, readme, architecture,
		metadata, classification, marketplace_status,
		owner_id, is_public, license_type
	FROM starter_kits 
	WHERE is_public = 1
		AND json_extract(marketplace_status, '$.is_featured') = 1
	ORDER BY created_at DESC
	LIMIT ?
	`

	return s.queryKits(query, limit)
}

// Close fecha a conexão
func (s *StarterKitStore) Close() error {
	return s.db.Close()
}
