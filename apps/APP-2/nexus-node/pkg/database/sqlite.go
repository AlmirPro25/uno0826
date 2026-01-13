package database

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"
)

// SQLiteDB is an in-memory database for development (no CGO required)
type SQLiteDB struct {
	peers     map[string]*Peer
	messages  []*Message
	feedPosts []*FeedPost
	settings  map[string]string
	mutex     sync.RWMutex
}

// FeedPost represents a social feed post in the database
type FeedPost struct {
	ID         string
	AuthorID   string
	AuthorName string
	Type       string
	Content    string
	MediaHash  string
	MediaType  string
	Timestamp  int64
	Signature  string
	ReplyTo    string
	Likes      int
}

// Peer represents a peer in the network
type Peer struct {
	ID        string
	Addrs     string
	LastSeen  int64
	Nickname  string
	LatencyMs int64
}

// Message represents a chat message
type Message struct {
	ID             string
	SenderPeerID   string
	ReceiverPeerID string
	Topic          string
	Payload        []byte
	Timestamp      int64
	IsRead         bool
}

// NewSQLiteDB initializes a new in-memory database
func NewSQLiteDB(path, passphrase string) (*SQLiteDB, error) {
	log.Println("[NEXUS] ✓ Banco de dados em memória inicializado")
	return &SQLiteDB{
		peers:     make(map[string]*Peer),
		messages:  make([]*Message, 0),
		feedPosts: make([]*FeedPost, 0),
		settings:  make(map[string]string),
	}, nil
}

// Close closes the database connection
func (s *SQLiteDB) Close() error {
	return nil
}

// SavePeer saves or updates a peer
func (s *SQLiteDB) SavePeer(p *Peer) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	if existing, ok := s.peers[p.ID]; ok {
		existing.Addrs = p.Addrs
		existing.LastSeen = p.LastSeen
		if p.Nickname != "" {
			existing.Nickname = p.Nickname
		}
	} else {
		s.peers[p.ID] = p
	}
	return nil
}

// GetPeer retrieves a peer by ID
func (s *SQLiteDB) GetPeer(id string) (*Peer, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	if p, ok := s.peers[id]; ok {
		return p, nil
	}
	return nil, nil
}

// GetAllPeers retrieves all peers
func (s *SQLiteDB) GetAllPeers() ([]*Peer, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	peers := make([]*Peer, 0, len(s.peers))
	for _, p := range s.peers {
		peers = append(peers, p)
	}
	return peers, nil
}

// SaveMessage saves a message
func (s *SQLiteDB) SaveMessage(m *Message) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	
	if m.ID == "" {
		m.ID = fmt.Sprintf("%d-%s", time.Now().UnixNano(), m.SenderPeerID[:8])
	}
	s.messages = append(s.messages, m)
	
	// Keep only last 1000 messages
	if len(s.messages) > 1000 {
		s.messages = s.messages[len(s.messages)-1000:]
	}
	return nil
}

// GetMessagesByPeer retrieves messages for a specific peer
func (s *SQLiteDB) GetMessagesByPeer(peerID string, limit, offset int) ([]*Message, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	var result []*Message
	for _, m := range s.messages {
		if m.SenderPeerID == peerID || m.ReceiverPeerID == peerID {
			result = append(result, m)
		}
	}
	
	// Apply limit
	if len(result) > limit {
		result = result[len(result)-limit:]
	}
	return result, nil
}

// GetGlobalTopicMessages retrieves messages from a topic
func (s *SQLiteDB) GetGlobalTopicMessages(topic string, limit, offset int) ([]*Message, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	
	var result []*Message
	for _, m := range s.messages {
		if m.Topic == topic {
			result = append(result, m)
		}
	}
	
	if len(result) > limit {
		result = result[len(result)-limit:]
	}
	return result, nil
}

// SetSetting saves a setting
func (s *SQLiteDB) SetSetting(key, value string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.settings[key] = value
	return nil
}

// GetSetting retrieves a setting
func (s *SQLiteDB) GetSetting(key string) (string, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	return s.settings[key], nil
}


// SaveFeedPost saves a feed post
func (s *SQLiteDB) SaveFeedPost(post interface{}) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Convert from the social.Post type using JSON marshaling
	data, err := json.Marshal(post)
	if err != nil {
		return err
	}

	var fp FeedPost
	if err := json.Unmarshal(data, &fp); err != nil {
		return err
	}

	// Check for duplicates
	for _, existing := range s.feedPosts {
		if existing.ID == fp.ID {
			return nil
		}
	}

	s.feedPosts = append([]*FeedPost{&fp}, s.feedPosts...)

	// Keep only last 500 posts
	if len(s.feedPosts) > 500 {
		s.feedPosts = s.feedPosts[:500]
	}

	return nil
}

// GetFeedPosts retrieves feed posts
func (s *SQLiteDB) GetFeedPosts(limit, offset int) (interface{}, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	if offset >= len(s.feedPosts) {
		return []*FeedPost{}, nil
	}

	end := offset + limit
	if end > len(s.feedPosts) {
		end = len(s.feedPosts)
	}

	return s.feedPosts[offset:end], nil
}
