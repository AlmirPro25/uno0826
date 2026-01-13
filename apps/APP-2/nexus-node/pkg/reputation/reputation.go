package reputation

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

// ReputationSystem implementa reputação soberana sem tokens
// Cada nó calcula reputação localmente baseado em suas próprias observações
// NÃO existe consenso global - cada nó tem sua própria visão
type ReputationSystem struct {
	scores      map[string]*PeerScore // peerID -> score
	interactions map[string][]Interaction
	mutex       sync.RWMutex
}

// PeerScore representa a reputação de um peer
type PeerScore struct {
	PeerID           string  `json:"peer_id"`
	TrustScore       float64 `json:"trust_score"`       // 0.0 - 1.0
	ReliabilityScore float64 `json:"reliability_score"` // Uptime/disponibilidade
	ContentScore     float64 `json:"content_score"`     // Qualidade do conteúdo
	NetworkScore     float64 `json:"network_score"`     // Contribuição para rede
	LastUpdated      int64   `json:"last_updated"`
	TotalInteractions int    `json:"total_interactions"`
}

// InteractionType define tipos de interação
type InteractionType string

const (
	InteractionMessageReceived  InteractionType = "message_received"
	InteractionMessageSent      InteractionType = "message_sent"
	InteractionFileShared       InteractionType = "file_shared"
	InteractionFileReceived     InteractionType = "file_received"
	InteractionChunkProvided    InteractionType = "chunk_provided"
	InteractionPostLiked        InteractionType = "post_liked"
	InteractionPostReported     InteractionType = "post_reported"
	InteractionConnectionStable InteractionType = "connection_stable"
	InteractionConnectionDropped InteractionType = "connection_dropped"
)

// Interaction registra uma interação com um peer
type Interaction struct {
	Type      InteractionType `json:"type"`
	PeerID    string          `json:"peer_id"`
	Timestamp int64           `json:"timestamp"`
	Value     float64         `json:"value"` // Peso da interação (-1.0 a 1.0)
	Details   string          `json:"details,omitempty"`
}

// NewReputationSystem cria um novo sistema de reputação
func NewReputationSystem() *ReputationSystem {
	rs := &ReputationSystem{
		scores:       make(map[string]*PeerScore),
		interactions: make(map[string][]Interaction),
	}

	// Decay periódico de scores (reputação decai se não há interação)
	go rs.decayLoop()

	log.Println("[NEXUS] ✓ Sistema de Reputação Soberana inicializado")
	return rs
}

// RecordInteraction registra uma interação com um peer
func (rs *ReputationSystem) RecordInteraction(interaction Interaction) {
	rs.mutex.Lock()
	defer rs.mutex.Unlock()

	interaction.Timestamp = time.Now().Unix()

	// Adicionar à lista de interações
	rs.interactions[interaction.PeerID] = append(
		rs.interactions[interaction.PeerID],
		interaction,
	)

	// Manter apenas últimas 100 interações por peer
	if len(rs.interactions[interaction.PeerID]) > 100 {
		rs.interactions[interaction.PeerID] = rs.interactions[interaction.PeerID][1:]
	}

	// Recalcular score
	rs.recalculateScore(interaction.PeerID)
}

// recalculateScore recalcula o score de um peer baseado em interações
func (rs *ReputationSystem) recalculateScore(peerID string) {
	interactions := rs.interactions[peerID]
	if len(interactions) == 0 {
		return
	}

	score, exists := rs.scores[peerID]
	if !exists {
		score = &PeerScore{
			PeerID:      peerID,
			TrustScore:  0.5, // Começa neutro
			LastUpdated: time.Now().Unix(),
		}
		rs.scores[peerID] = score
	}

	// Calcular scores por categoria
	var trustSum, reliabilitySum, contentSum, networkSum float64
	var trustCount, reliabilityCount, contentCount, networkCount int

	for _, i := range interactions {
		switch i.Type {
		case InteractionMessageReceived, InteractionMessageSent:
			trustSum += i.Value
			trustCount++
		case InteractionConnectionStable:
			reliabilitySum += i.Value
			reliabilityCount++
		case InteractionConnectionDropped:
			reliabilitySum += i.Value // Valor negativo
			reliabilityCount++
		case InteractionPostLiked:
			contentSum += i.Value
			contentCount++
		case InteractionPostReported:
			contentSum += i.Value // Valor negativo
			contentCount++
		case InteractionFileShared, InteractionChunkProvided:
			networkSum += i.Value
			networkCount++
		}
	}

	// Calcular médias (com fallback para neutro)
	if trustCount > 0 {
		score.TrustScore = clamp((trustSum/float64(trustCount)+1)/2, 0, 1)
	}
	if reliabilityCount > 0 {
		score.ReliabilityScore = clamp((reliabilitySum/float64(reliabilityCount)+1)/2, 0, 1)
	}
	if contentCount > 0 {
		score.ContentScore = clamp((contentSum/float64(contentCount)+1)/2, 0, 1)
	}
	if networkCount > 0 {
		score.NetworkScore = clamp((networkSum/float64(networkCount)+1)/2, 0, 1)
	}

	score.TotalInteractions = len(interactions)
	score.LastUpdated = time.Now().Unix()
}

// GetScore retorna o score de um peer
func (rs *ReputationSystem) GetScore(peerID string) *PeerScore {
	rs.mutex.RLock()
	defer rs.mutex.RUnlock()

	if score, exists := rs.scores[peerID]; exists {
		return score
	}

	// Retorna score neutro para peers desconhecidos
	return &PeerScore{
		PeerID:           peerID,
		TrustScore:       0.5,
		ReliabilityScore: 0.5,
		ContentScore:     0.5,
		NetworkScore:     0.5,
		LastUpdated:      time.Now().Unix(),
	}
}

// GetOverallScore retorna um score geral combinado
func (rs *ReputationSystem) GetOverallScore(peerID string) float64 {
	score := rs.GetScore(peerID)
	
	// Média ponderada
	return (score.TrustScore*0.3 +
		score.ReliabilityScore*0.3 +
		score.ContentScore*0.2 +
		score.NetworkScore*0.2)
}

// IsTrusted verifica se um peer é confiável (score > threshold)
func (rs *ReputationSystem) IsTrusted(peerID string, threshold float64) bool {
	return rs.GetOverallScore(peerID) >= threshold
}

// GetTopPeers retorna os peers com maior reputação
func (rs *ReputationSystem) GetTopPeers(limit int) []*PeerScore {
	rs.mutex.RLock()
	defer rs.mutex.RUnlock()

	var scores []*PeerScore
	for _, s := range rs.scores {
		scores = append(scores, s)
	}

	// Ordenar por score geral (bubble sort simples)
	for i := 0; i < len(scores)-1; i++ {
		for j := 0; j < len(scores)-i-1; j++ {
			scoreA := scores[j].TrustScore*0.3 + scores[j].ReliabilityScore*0.3 +
				scores[j].ContentScore*0.2 + scores[j].NetworkScore*0.2
			scoreB := scores[j+1].TrustScore*0.3 + scores[j+1].ReliabilityScore*0.3 +
				scores[j+1].ContentScore*0.2 + scores[j+1].NetworkScore*0.2
			if scoreA < scoreB {
				scores[j], scores[j+1] = scores[j+1], scores[j]
			}
		}
	}

	if len(scores) > limit {
		return scores[:limit]
	}
	return scores
}

// decayLoop aplica decay periódico aos scores
func (rs *ReputationSystem) decayLoop() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		rs.mutex.Lock()
		now := time.Now().Unix()
		decayRate := 0.01 // 1% decay por hora sem interação

		for _, score := range rs.scores {
			hoursSinceUpdate := float64(now-score.LastUpdated) / 3600
			if hoursSinceUpdate > 24 { // Só aplica decay após 24h
				decay := decayRate * (hoursSinceUpdate - 24)
				score.TrustScore = clamp(score.TrustScore-decay, 0.1, 1)
				score.ReliabilityScore = clamp(score.ReliabilityScore-decay, 0.1, 1)
				score.ContentScore = clamp(score.ContentScore-decay, 0.1, 1)
				score.NetworkScore = clamp(score.NetworkScore-decay, 0.1, 1)
			}
		}
		rs.mutex.Unlock()
	}
}

// ToJSON serializa os scores para JSON
func (rs *ReputationSystem) ToJSON() ([]byte, error) {
	rs.mutex.RLock()
	defer rs.mutex.RUnlock()
	return json.Marshal(rs.scores)
}

func clamp(value, min, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}
