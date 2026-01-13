package swarm

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
)

const (
	ChunkSize     = 1024 * 1024 // 1MB chunks
	ChunksDir     = "data/chunks"
	FilesDir      = "data/files"
	SwarmTopic    = "nexus-swarm-0.1"
)

// MerkleNode represents a node in the Merkle tree
type MerkleNode struct {
	Hash  string `json:"hash"`
	Left  string `json:"left,omitempty"`
	Right string `json:"right,omitempty"`
}

// FileMetadata contains information about a shared file
// IMPORTANTE: DHT só armazena Hash → PeerIDs, nunca metadados pessoais
type FileMetadata struct {
	Hash        string       `json:"hash"`         // Merkle root - prova criptográfica do arquivo
	Name        string       `json:"name"`         // Nome local (não propagado na DHT)
	Size        int64        `json:"size"`
	MimeType    string       `json:"mime_type"`
	ChunkCount  int          `json:"chunk_count"`
	ChunkHashes []string     `json:"chunk_hashes"` // Folhas da Merkle tree
	MerkleRoot  string       `json:"merkle_root"`  // Raiz da árvore Merkle
	MerkleTree  []MerkleNode `json:"merkle_tree"`  // Árvore completa para verificação
	OwnerID     string       `json:"owner_id"`     // PeerID do criador original
	Timestamp   int64        `json:"timestamp"`
}

// Chunk represents a file chunk
type Chunk struct {
	Hash     string `json:"hash"`
	Index    int    `json:"index"`
	Data     []byte `json:"data,omitempty"`
	Size     int    `json:"size"`
}

// ChunkRequest is sent when requesting a chunk from peers
type ChunkRequest struct {
	Type      string `json:"type"` // "request" or "response"
	FileHash  string `json:"file_hash"`
	ChunkHash string `json:"chunk_hash"`
	ChunkIndex int   `json:"chunk_index"`
	RequesterID string `json:"requester_id"`
}

// FileChunker handles file chunking and reassembly
type FileChunker struct {
	chunksPath string
	filesPath  string
	files      map[string]*FileMetadata
	chunks     map[string]*Chunk
	mutex      sync.RWMutex
}

// NewFileChunker creates a new file chunker
func NewFileChunker() (*FileChunker, error) {
	chunksPath := ChunksDir
	filesPath := FilesDir

	if err := os.MkdirAll(chunksPath, 0755); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filesPath, 0755); err != nil {
		return nil, err
	}

	return &FileChunker{
		chunksPath: chunksPath,
		filesPath:  filesPath,
		files:      make(map[string]*FileMetadata),
		chunks:     make(map[string]*Chunk),
	}, nil
}

// ChunkFile splits a file into chunks and returns metadata with Merkle tree
func (fc *FileChunker) ChunkFile(filePath, ownerID string) (*FileMetadata, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		return nil, fmt.Errorf("failed to stat file: %w", err)
	}

	// Create chunks and collect hashes
	var chunkHashes []string
	chunkIndex := 0
	buffer := make([]byte, ChunkSize)

	for {
		n, err := file.Read(buffer)
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to read file: %w", err)
		}

		chunkData := buffer[:n]
		chunkHasher := sha256.New()
		chunkHasher.Write(chunkData)
		chunkHash := hex.EncodeToString(chunkHasher.Sum(nil))

		chunk := &Chunk{
			Hash:     chunkHash,
			Index:    chunkIndex,
			Size:     n,
		}

		// Save chunk to disk
		chunkPath := filepath.Join(fc.chunksPath, chunkHash)
		if err := os.WriteFile(chunkPath, chunkData, 0644); err != nil {
			return nil, fmt.Errorf("failed to save chunk: %w", err)
		}

		fc.mutex.Lock()
		fc.chunks[chunkHash] = chunk
		fc.mutex.Unlock()

		chunkHashes = append(chunkHashes, chunkHash)
		chunkIndex++
	}

	// Build Merkle tree from chunk hashes
	merkleTree, merkleRoot := buildMerkleTree(chunkHashes)

	metadata := &FileMetadata{
		Hash:        merkleRoot, // O hash do arquivo É a raiz Merkle
		Name:        filepath.Base(filePath),
		Size:        stat.Size(),
		MimeType:    detectMimeType(filePath),
		ChunkCount:  chunkIndex,
		ChunkHashes: chunkHashes,
		MerkleRoot:  merkleRoot,
		MerkleTree:  merkleTree,
		OwnerID:     ownerID,
	}

	fc.mutex.Lock()
	fc.files[merkleRoot] = metadata
	fc.mutex.Unlock()

	return metadata, nil
}

// buildMerkleTree constructs a Merkle tree from leaf hashes
// Retorna a árvore completa e a raiz (prova criptográfica do arquivo)
func buildMerkleTree(leafHashes []string) ([]MerkleNode, string) {
	if len(leafHashes) == 0 {
		return nil, ""
	}

	// Create leaf nodes
	var nodes []MerkleNode
	var currentLevel []string

	for _, hash := range leafHashes {
		nodes = append(nodes, MerkleNode{Hash: hash})
		currentLevel = append(currentLevel, hash)
	}

	// Build tree bottom-up
	for len(currentLevel) > 1 {
		var nextLevel []string

		for i := 0; i < len(currentLevel); i += 2 {
			left := currentLevel[i]
			right := left // Duplicate if odd number
			if i+1 < len(currentLevel) {
				right = currentLevel[i+1]
			}

			// Hash the concatenation
			combined := left + right
			hasher := sha256.New()
			hasher.Write([]byte(combined))
			parentHash := hex.EncodeToString(hasher.Sum(nil))

			nodes = append(nodes, MerkleNode{
				Hash:  parentHash,
				Left:  left,
				Right: right,
			})
			nextLevel = append(nextLevel, parentHash)
		}
		currentLevel = nextLevel
	}

	// Root is the last element
	root := ""
	if len(currentLevel) > 0 {
		root = currentLevel[0]
	}

	return nodes, root
}

// VerifyMerkleProof verifies that a chunk belongs to a file using Merkle proof
func VerifyMerkleProof(chunkHash, merkleRoot string, proof []string) bool {
	currentHash := chunkHash

	for _, siblingHash := range proof {
		// Determine order (smaller hash first for consistency)
		var combined string
		if currentHash < siblingHash {
			combined = currentHash + siblingHash
		} else {
			combined = siblingHash + currentHash
		}

		hasher := sha256.New()
		hasher.Write([]byte(combined))
		currentHash = hex.EncodeToString(hasher.Sum(nil))
	}

	return currentHash == merkleRoot
}

// GetChunk retrieves a chunk by hash
func (fc *FileChunker) GetChunk(chunkHash string) ([]byte, error) {
	chunkPath := filepath.Join(fc.chunksPath, chunkHash)
	return os.ReadFile(chunkPath)
}

// HasChunk checks if we have a chunk
func (fc *FileChunker) HasChunk(chunkHash string) bool {
	chunkPath := filepath.Join(fc.chunksPath, chunkHash)
	_, err := os.Stat(chunkPath)
	return err == nil
}

// SaveChunk saves a received chunk
func (fc *FileChunker) SaveChunk(chunkHash string, data []byte) error {
	// Verify hash
	hasher := sha256.New()
	hasher.Write(data)
	calculatedHash := hex.EncodeToString(hasher.Sum(nil))

	if calculatedHash != chunkHash {
		return fmt.Errorf("chunk hash mismatch")
	}

	chunkPath := filepath.Join(fc.chunksPath, chunkHash)
	return os.WriteFile(chunkPath, data, 0644)
}

// ReassembleFile reassembles a file from chunks
func (fc *FileChunker) ReassembleFile(metadata *FileMetadata) (string, error) {
	outputPath := filepath.Join(fc.filesPath, metadata.Name)
	output, err := os.Create(outputPath)
	if err != nil {
		return "", err
	}
	defer output.Close()

	for _, chunkHash := range metadata.ChunkHashes {
		chunkData, err := fc.GetChunk(chunkHash)
		if err != nil {
			return "", fmt.Errorf("missing chunk %s: %w", chunkHash[:16], err)
		}
		if _, err := output.Write(chunkData); err != nil {
			return "", err
		}
	}

	return outputPath, nil
}

// GetMissingChunks returns chunks we don't have for a file
func (fc *FileChunker) GetMissingChunks(metadata *FileMetadata) []string {
	var missing []string
	for _, hash := range metadata.ChunkHashes {
		if !fc.HasChunk(hash) {
			missing = append(missing, hash)
		}
	}
	return missing
}

// GetFileMetadata returns metadata for a file
func (fc *FileChunker) GetFileMetadata(fileHash string) *FileMetadata {
	fc.mutex.RLock()
	defer fc.mutex.RUnlock()
	return fc.files[fileHash]
}

// RegisterFile registers file metadata (from network)
func (fc *FileChunker) RegisterFile(metadata *FileMetadata) {
	fc.mutex.Lock()
	defer fc.mutex.Unlock()
	fc.files[metadata.Hash] = metadata
}

// ToJSON serializes metadata to JSON
func (m *FileMetadata) ToJSON() ([]byte, error) {
	return json.Marshal(m)
}

// FileMetadataFromJSON deserializes metadata from JSON
func FileMetadataFromJSON(data []byte) (*FileMetadata, error) {
	var m FileMetadata
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	return &m, nil
}

func detectMimeType(path string) string {
	ext := filepath.Ext(path)
	mimeTypes := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".webp": "image/webp",
		".mp4":  "video/mp4",
		".webm": "video/webm",
		".mov":  "video/quicktime",
		".mp3":  "audio/mpeg",
		".wav":  "audio/wav",
		".pdf":  "application/pdf",
		".zip":  "application/zip",
		".txt":  "text/plain",
	}
	if mime, ok := mimeTypes[ext]; ok {
		return mime
	}
	return "application/octet-stream"
}
