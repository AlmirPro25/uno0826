package swarm

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	dht "github.com/libp2p/go-libp2p-kad-dht"
	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
)

// SwarmMessage types
const (
	MsgTypeAnnounce     = "announce"      // Announce a new file
	MsgTypeChunkRequest = "chunk_request" // Request a chunk
	MsgTypeChunkData    = "chunk_data"    // Send chunk data
	MsgTypeHaveChunks   = "have_chunks"   // Announce which chunks we have
)

// SwarmMessage is the message format for swarm communication
type SwarmMessage struct {
	Type       string          `json:"type"`
	FileHash   string          `json:"file_hash,omitempty"`
	ChunkHash  string          `json:"chunk_hash,omitempty"`
	ChunkIndex int             `json:"chunk_index,omitempty"`
	ChunkData  string          `json:"chunk_data,omitempty"` // base64 encoded
	Metadata   *FileMetadata   `json:"metadata,omitempty"`
	SenderID   string          `json:"sender_id"`
	HaveChunks []string        `json:"have_chunks,omitempty"`
}

// DownloadProgress tracks download progress
type DownloadProgress struct {
	FileHash     string   `json:"file_hash"`
	FileName     string   `json:"file_name"`
	TotalChunks  int      `json:"total_chunks"`
	Downloaded   int      `json:"downloaded"`
	Percentage   float64  `json:"percentage"`
	Sources      []string `json:"sources"`
	Status       string   `json:"status"` // "downloading", "complete", "failed"
}

// SwarmService manages P2P file sharing
type SwarmService struct {
	ctx       context.Context
	host      host.Host
	dht       *dht.IpfsDHT
	ps        *pubsub.PubSub
	topic     *pubsub.Topic
	sub       *pubsub.Subscription
	chunker   *FileChunker
	downloads map[string]*DownloadProgress
	listeners []func(*DownloadProgress)
	mutex     sync.RWMutex
}

// NewSwarmService creates a new swarm service
func NewSwarmService(ctx context.Context, h host.Host, kadDHT *dht.IpfsDHT, ps *pubsub.PubSub) (*SwarmService, error) {
	chunker, err := NewFileChunker()
	if err != nil {
		return nil, err
	}

	topic, err := ps.Join(SwarmTopic)
	if err != nil {
		return nil, err
	}

	sub, err := topic.Subscribe()
	if err != nil {
		return nil, err
	}

	ss := &SwarmService{
		ctx:       ctx,
		host:      h,
		dht:       kadDHT,
		ps:        ps,
		topic:     topic,
		sub:       sub,
		chunker:   chunker,
		downloads: make(map[string]*DownloadProgress),
		listeners: make([]func(*DownloadProgress), 0),
	}

	go ss.readLoop()

	log.Printf("[NEXUS] ✓ Swarm Service inicializado no tópico: %s", SwarmTopic)
	return ss, nil
}

// readLoop listens for swarm messages
func (ss *SwarmService) readLoop() {
	for {
		select {
		case <-ss.ctx.Done():
			return
		default:
			msg, err := ss.sub.Next(ss.ctx)
			if err != nil {
				if err == context.Canceled {
					return
				}
				continue
			}

			// Ignore own messages
			if msg.ReceivedFrom == ss.host.ID() {
				continue
			}

			var swarmMsg SwarmMessage
			if err := json.Unmarshal(msg.Data, &swarmMsg); err != nil {
				continue
			}

			ss.handleMessage(&swarmMsg, msg.ReceivedFrom)
		}
	}
}

// handleMessage processes incoming swarm messages
func (ss *SwarmService) handleMessage(msg *SwarmMessage, from peer.ID) {
	switch msg.Type {
	case MsgTypeAnnounce:
		ss.handleAnnounce(msg, from)
	case MsgTypeChunkRequest:
		ss.handleChunkRequest(msg, from)
	case MsgTypeChunkData:
		ss.handleChunkData(msg, from)
	case MsgTypeHaveChunks:
		ss.handleHaveChunks(msg, from)
	}
}

// handleAnnounce handles file announcements
func (ss *SwarmService) handleAnnounce(msg *SwarmMessage, from peer.ID) {
	if msg.Metadata == nil {
		return
	}

	log.Printf("[NEXUS] Swarm: Arquivo anunciado por %s: %s (%d chunks)",
		from.String()[:16], msg.Metadata.Name, msg.Metadata.ChunkCount)

	ss.chunker.RegisterFile(msg.Metadata)

	// Announce to DHT that this peer has this file
	key := fmt.Sprintf("/nexus/file/%s", msg.Metadata.Hash)
	ss.dht.PutValue(ss.ctx, key, []byte(from.String()))
}

// handleChunkRequest handles chunk requests
func (ss *SwarmService) handleChunkRequest(msg *SwarmMessage, from peer.ID) {
	if !ss.chunker.HasChunk(msg.ChunkHash) {
		return
	}

	data, err := ss.chunker.GetChunk(msg.ChunkHash)
	if err != nil {
		return
	}

	// Send chunk data
	response := &SwarmMessage{
		Type:       MsgTypeChunkData,
		FileHash:   msg.FileHash,
		ChunkHash:  msg.ChunkHash,
		ChunkIndex: msg.ChunkIndex,
		ChunkData:  base64.StdEncoding.EncodeToString(data),
		SenderID:   ss.host.ID().String(),
	}

	responseData, _ := json.Marshal(response)
	ss.topic.Publish(ss.ctx, responseData)

	log.Printf("[NEXUS] Swarm: Chunk %s enviado para %s", msg.ChunkHash[:16], from.String()[:16])
}

// handleChunkData handles received chunk data
func (ss *SwarmService) handleChunkData(msg *SwarmMessage, from peer.ID) {
	ss.mutex.Lock()
	progress, exists := ss.downloads[msg.FileHash]
	ss.mutex.Unlock()

	if !exists {
		return
	}

	// Decode and save chunk
	data, err := base64.StdEncoding.DecodeString(msg.ChunkData)
	if err != nil {
		return
	}

	if err := ss.chunker.SaveChunk(msg.ChunkHash, data); err != nil {
		log.Printf("[NEXUS] Swarm: Erro ao salvar chunk: %v", err)
		return
	}

	// Update progress
	ss.mutex.Lock()
	progress.Downloaded++
	progress.Percentage = float64(progress.Downloaded) / float64(progress.TotalChunks) * 100

	if progress.Downloaded >= progress.TotalChunks {
		progress.Status = "complete"
		// Reassemble file
		metadata := ss.chunker.GetFileMetadata(msg.FileHash)
		if metadata != nil {
			path, err := ss.chunker.ReassembleFile(metadata)
			if err != nil {
				log.Printf("[NEXUS] Swarm: Erro ao remontar arquivo: %v", err)
				progress.Status = "failed"
			} else {
				log.Printf("[NEXUS] Swarm: ✓ Arquivo completo: %s", path)
			}
		}
	}
	ss.mutex.Unlock()

	// Notify listeners
	for _, listener := range ss.listeners {
		go listener(progress)
	}

	log.Printf("[NEXUS] Swarm: Chunk %d/%d recebido de %s (%.1f%%)",
		progress.Downloaded, progress.TotalChunks, from.String()[:16], progress.Percentage)
}

// handleHaveChunks handles chunk availability announcements
func (ss *SwarmService) handleHaveChunks(msg *SwarmMessage, from peer.ID) {
	// Track which peers have which chunks for smarter downloading
	log.Printf("[NEXUS] Swarm: Peer %s tem %d chunks do arquivo %s",
		from.String()[:16], len(msg.HaveChunks), msg.FileHash[:16])
}

// ShareFile chunks and announces a file to the swarm
func (ss *SwarmService) ShareFile(filePath string) (*FileMetadata, error) {
	metadata, err := ss.chunker.ChunkFile(filePath, ss.host.ID().String())
	if err != nil {
		return nil, err
	}

	// Announce to swarm
	msg := &SwarmMessage{
		Type:     MsgTypeAnnounce,
		FileHash: metadata.Hash,
		Metadata: metadata,
		SenderID: ss.host.ID().String(),
	}

	data, _ := json.Marshal(msg)
	if err := ss.topic.Publish(ss.ctx, data); err != nil {
		return nil, err
	}

	// Announce to DHT
	key := fmt.Sprintf("/nexus/file/%s", metadata.Hash)
	ss.dht.PutValue(ss.ctx, key, []byte(ss.host.ID().String()))

	log.Printf("[NEXUS] Swarm: ✓ Arquivo compartilhado: %s (%d chunks)", metadata.Name, metadata.ChunkCount)
	return metadata, nil
}

// DownloadFile starts downloading a file from the swarm
func (ss *SwarmService) DownloadFile(metadata *FileMetadata) (*DownloadProgress, error) {
	ss.chunker.RegisterFile(metadata)

	missing := ss.chunker.GetMissingChunks(metadata)
	if len(missing) == 0 {
		// Already have all chunks
		path, err := ss.chunker.ReassembleFile(metadata)
		if err != nil {
			return nil, err
		}
		return &DownloadProgress{
			FileHash:    metadata.Hash,
			FileName:    metadata.Name,
			TotalChunks: metadata.ChunkCount,
			Downloaded:  metadata.ChunkCount,
			Percentage:  100,
			Status:      "complete",
			Sources:     []string{path},
		}, nil
	}

	progress := &DownloadProgress{
		FileHash:    metadata.Hash,
		FileName:    metadata.Name,
		TotalChunks: metadata.ChunkCount,
		Downloaded:  metadata.ChunkCount - len(missing),
		Percentage:  float64(metadata.ChunkCount-len(missing)) / float64(metadata.ChunkCount) * 100,
		Status:      "downloading",
		Sources:     []string{},
	}

	ss.mutex.Lock()
	ss.downloads[metadata.Hash] = progress
	ss.mutex.Unlock()

	// Request missing chunks
	go ss.requestChunks(metadata, missing)

	return progress, nil
}

// requestChunks requests missing chunks from the swarm
func (ss *SwarmService) requestChunks(metadata *FileMetadata, missing []string) {
	for i, chunkHash := range missing {
		msg := &SwarmMessage{
			Type:       MsgTypeChunkRequest,
			FileHash:   metadata.Hash,
			ChunkHash:  chunkHash,
			ChunkIndex: i,
			SenderID:   ss.host.ID().String(),
		}

		data, _ := json.Marshal(msg)
		ss.topic.Publish(ss.ctx, data)

		// Small delay between requests
		time.Sleep(50 * time.Millisecond)
	}
}

// GetDownloadProgress returns progress for a download
func (ss *SwarmService) GetDownloadProgress(fileHash string) *DownloadProgress {
	ss.mutex.RLock()
	defer ss.mutex.RUnlock()
	return ss.downloads[fileHash]
}

// OnProgress registers a listener for download progress
func (ss *SwarmService) OnProgress(listener func(*DownloadProgress)) {
	ss.mutex.Lock()
	defer ss.mutex.Unlock()
	ss.listeners = append(ss.listeners, listener)
}

// GetChunker returns the file chunker
func (ss *SwarmService) GetChunker() *FileChunker {
	return ss.chunker
}
