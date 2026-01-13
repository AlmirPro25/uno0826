package lighthouse

import (
	"context"
	"database/sql"
	"time"
)

// PostgresStore implementação do LighthouseStore para Postgres/Supabase
type PostgresStore struct {
	db *sql.DB
}

// NewPostgresStore cria um novo store Postgres
func NewPostgresStore(db *sql.DB) *PostgresStore {
	return &PostgresStore{db: db}
}

// SavePresence salva ou atualiza a presença de um peer
func (s *PostgresStore) SavePresence(ctx context.Context, presence *PeerPresence) error {
	query := `
		INSERT INTO presence_ledger (
			peer_id, network_hash, lighthouse_id, 
			capabilities, reputation, last_seen, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (peer_id) DO UPDATE SET
			network_hash = EXCLUDED.network_hash,
			lighthouse_id = EXCLUDED.lighthouse_id,
			capabilities = EXCLUDED.capabilities,
			last_seen = EXCLUDED.last_seen
	`

	_, err := s.db.ExecContext(ctx, query,
		presence.PeerID,
		presence.NetworkHash,
		presence.LighthouseID,
		presence.Capabilities,
		presence.Reputation,
		presence.LastSeen,
		presence.CreatedAt,
	)

	return err
}

// GetPresence busca a presença de um peer
func (s *PostgresStore) GetPresence(ctx context.Context, peerID string) (*PeerPresence, error) {
	query := `
		SELECT peer_id, network_hash, lighthouse_id, 
		       capabilities, reputation, last_seen, created_at
		FROM presence_ledger
		WHERE peer_id = $1
	`

	var p PeerPresence
	err := s.db.QueryRowContext(ctx, query, peerID).Scan(
		&p.PeerID,
		&p.NetworkHash,
		&p.LighthouseID,
		&p.Capabilities,
		&p.Reputation,
		&p.LastSeen,
		&p.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &p, nil
}

// ListPeers lista peers por região
func (s *PostgresStore) ListPeers(ctx context.Context, region string, limit int) ([]*PeerPresence, error) {
	query := `
		SELECT peer_id, network_hash, lighthouse_id, 
		       capabilities, reputation, last_seen, created_at
		FROM presence_ledger
		WHERE ($1 = '' OR network_hash LIKE $1 || '%')
		  AND last_seen > NOW() - INTERVAL '5 minutes'
		ORDER BY reputation DESC, last_seen DESC
		LIMIT $2
	`

	rows, err := s.db.QueryContext(ctx, query, region, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var peers []*PeerPresence
	for rows.Next() {
		var p PeerPresence
		if err := rows.Scan(
			&p.PeerID,
			&p.NetworkHash,
			&p.LighthouseID,
			&p.Capabilities,
			&p.Reputation,
			&p.LastSeen,
			&p.CreatedAt,
		); err != nil {
			return nil, err
		}
		peers = append(peers, &p)
	}

	return peers, rows.Err()
}

// DeletePresence remove a presença de um peer
func (s *PostgresStore) DeletePresence(ctx context.Context, peerID string) error {
	_, err := s.db.ExecContext(ctx, 
		"DELETE FROM presence_ledger WHERE peer_id = $1", 
		peerID,
	)
	return err
}

// UpdateLastSeen atualiza o timestamp de last_seen
func (s *PostgresStore) UpdateLastSeen(ctx context.Context, peerID string) error {
	_, err := s.db.ExecContext(ctx,
		"UPDATE presence_ledger SET last_seen = $1 WHERE peer_id = $2",
		time.Now(),
		peerID,
	)
	return err
}

// GetLighthouses retorna lista de faróis ativos
func (s *PostgresStore) GetLighthouses(ctx context.Context) ([]LighthouseInfo, error) {
	query := `
		SELECT id, region, url, status
		FROM lighthouse_registry
		WHERE status = 'active'
		  AND last_heartbeat > NOW() - INTERVAL '1 minute'
		ORDER BY region
	`

	rows, err := s.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lighthouses []LighthouseInfo
	for rows.Next() {
		var l LighthouseInfo
		if err := rows.Scan(&l.ID, &l.Region, &l.URL, &l.Status); err != nil {
			return nil, err
		}
		lighthouses = append(lighthouses, l)
	}

	return lighthouses, rows.Err()
}

// MemoryStore implementação em memória para testes/desenvolvimento
type MemoryStore struct {
	peers       map[string]*PeerPresence
	lighthouses []LighthouseInfo
}

// NewMemoryStore cria um store em memória
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		peers: make(map[string]*PeerPresence),
		lighthouses: []LighthouseInfo{
			{ID: "lighthouse-sa-01", Region: "sa-east", URL: "https://nexus-sa.fly.dev", Status: "active"},
			{ID: "lighthouse-us-01", Region: "us-east", URL: "https://nexus-us.vercel.app", Status: "active"},
			{ID: "lighthouse-eu-01", Region: "eu-west", URL: "https://nexus-eu.render.com", Status: "active"},
		},
	}
}

func (s *MemoryStore) SavePresence(ctx context.Context, presence *PeerPresence) error {
	s.peers[presence.PeerID] = presence
	return nil
}

func (s *MemoryStore) GetPresence(ctx context.Context, peerID string) (*PeerPresence, error) {
	return s.peers[peerID], nil
}

func (s *MemoryStore) ListPeers(ctx context.Context, region string, limit int) ([]*PeerPresence, error) {
	var result []*PeerPresence
	cutoff := time.Now().Add(-5 * time.Minute)
	
	for _, p := range s.peers {
		if p.LastSeen.After(cutoff) {
			result = append(result, p)
			if len(result) >= limit {
				break
			}
		}
	}
	return result, nil
}

func (s *MemoryStore) DeletePresence(ctx context.Context, peerID string) error {
	delete(s.peers, peerID)
	return nil
}

func (s *MemoryStore) UpdateLastSeen(ctx context.Context, peerID string) error {
	if p, ok := s.peers[peerID]; ok {
		p.LastSeen = time.Now()
	}
	return nil
}

func (s *MemoryStore) GetLighthouses(ctx context.Context) ([]LighthouseInfo, error) {
	return s.lighthouses, nil
}
