package social

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/peer"
)

const (
	FeedTopic = "nexus-global-feed-0.1"
)

// PostType defines the type of post
type PostType string

const (
	PostTypeText  PostType = "text"
	PostTypeImage PostType = "image"
	PostTypeVideo PostType = "video"
	PostTypeFile  PostType = "file"
)

// MediaReference referencia mídia via hash (não embeda)
// Regra de ouro: Feed referencia mídia, não carrega mídia
type MediaReference struct {
	Hash     string `json:"hash"`      // Merkle root do arquivo
	MimeType string `json:"mime_type"` // Tipo MIME
	Size     int64  `json:"size"`      // Tamanho em bytes
	Name     string `json:"name"`      // Nome original (metadado opcional)
}

// Post represents a signed social post in the mesh
// Cada post é: { author_pubkey, timestamp, content, signature, nonce }
type Post struct {
	ID          string          `json:"id"`
	AuthorID    string          `json:"author_id"`
	AuthorName  string          `json:"author_name,omitempty"`
	Type        PostType        `json:"type"`
	Content     string          `json:"content"`
	Media       *MediaReference `json:"media,omitempty"`      // Referência, não embed
	Timestamp   int64           `json:"timestamp"`
	Nonce       string          `json:"nonce"`                // Anti-replay attack
	Signature   string          `json:"signature"`
	ReplyTo     string          `json:"reply_to,omitempty"`
	Likes       int             `json:"likes"`
	LikedByMe   bool            `json:"liked_by_me,omitempty"`
}

// SignableData returns the data to be signed (includes nonce for anti-replay)
func (p *Post) SignableData() []byte {
	mediaHash := ""
	if p.Media != nil {
		mediaHash = p.Media.Hash
	}
	// Nonce + Timestamp = proteção contra replay attacks
	data := fmt.Sprintf("%s:%s:%s:%s:%s:%d:%s",
		p.ID, p.AuthorID, p.Type, p.Content, mediaHash, p.Timestamp, p.Nonce)
	return []byte(data)
}

// GenerateID generates a unique post ID
func GeneratePostID(authorID string, timestamp int64, content string) string {
	data := fmt.Sprintf("%s:%d:%s", authorID, timestamp, content)
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:16])
}

// GenerateNonce creates a cryptographic nonce for anti-replay protection
func GenerateNonce() string {
	nonce := make([]byte, 16)
	rand.Read(nonce)
	return hex.EncodeToString(nonce)
}

// NewPost creates a new post and signs it
func NewPost(privKey crypto.PrivKey, postType PostType, content string, media *MediaReference) (*Post, error) {
	peerID, err := peer.IDFromPrivateKey(privKey)
	if err != nil {
		return nil, fmt.Errorf("failed to get peer ID: %w", err)
	}

	timestamp := time.Now().Unix()
	nonce := GenerateNonce()
	
	post := &Post{
		ID:        GeneratePostID(peerID.String(), timestamp, content),
		AuthorID:  peerID.String(),
		Type:      postType,
		Content:   content,
		Media:     media,
		Timestamp: timestamp,
		Nonce:     nonce,
	}

	// Sign the post
	sig, err := privKey.Sign(post.SignableData())
	if err != nil {
		return nil, fmt.Errorf("failed to sign post: %w", err)
	}
	post.Signature = hex.EncodeToString(sig)

	return post, nil
}

// VerifySignature verifies the post signature
func (p *Post) VerifySignature() (bool, error) {
	peerID, err := peer.Decode(p.AuthorID)
	if err != nil {
		return false, fmt.Errorf("invalid author ID: %w", err)
	}

	pubKey, err := peerID.ExtractPublicKey()
	if err != nil {
		return false, fmt.Errorf("failed to extract public key: %w", err)
	}

	sig, err := hex.DecodeString(p.Signature)
	if err != nil {
		return false, fmt.Errorf("invalid signature format: %w", err)
	}

	return pubKey.Verify(p.SignableData(), sig)
}

// ToJSON serializes the post to JSON
func (p *Post) ToJSON() ([]byte, error) {
	return json.Marshal(p)
}

// PostFromJSON deserializes a post from JSON
func PostFromJSON(data []byte) (*Post, error) {
	var post Post
	if err := json.Unmarshal(data, &post); err != nil {
		return nil, err
	}
	return &post, nil
}
