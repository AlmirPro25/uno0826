package social

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	pubsub "github.com/libp2p/go-libp2p-pubsub"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/nexus-sovereign-mesh/nexus-node/pkg/database"
)

// PersistenceMode define como o nó armazena posts
type PersistenceMode string

const (
	PersistAll       PersistenceMode = "all"       // Guardar tudo
	PersistFollowing PersistenceMode = "following" // Só quem segue
	PersistNone      PersistenceMode = "none"      // Modo transitório
)

// RateLimiter controla taxa de posts por autor
type RateLimiter struct {
	posts    map[string][]int64 // authorID -> timestamps
	maxPosts int                // máximo de posts por janela
	window   time.Duration      // janela de tempo
	mutex    sync.RWMutex
}

func NewRateLimiter(maxPosts int, window time.Duration) *RateLimiter {
	return &RateLimiter{
		posts:    make(map[string][]int64),
		maxPosts: maxPosts,
		window:   window,
	}
}

func (rl *RateLimiter) Allow(authorID string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now().Unix()
	cutoff := now - int64(rl.window.Seconds())

	// Limpar posts antigos
	var recent []int64
	for _, ts := range rl.posts[authorID] {
		if ts > cutoff {
			recent = append(recent, ts)
		}
	}

	if len(recent) >= rl.maxPosts {
		return false
	}

	rl.posts[authorID] = append(recent, now)
	return true
}

// FeedService manages the social feed via GossipSub
// IMPORTANTE: Não existe timeline global - cada nó constrói seu próprio feed
// GossipSub é apenas para propagação, validação é sempre local via assinatura
type FeedService struct {
	ctx             context.Context
	host            host.Host
	privKey         crypto.PrivKey
	db              *database.SQLiteDB
	ps              *pubsub.PubSub
	topic           *pubsub.Topic
	sub             *pubsub.Subscription
	posts           []*Post
	seenNonces      map[string]int64    // nonce -> timestamp (anti-replay)
	following       map[string]bool     // PeerIDs que seguimos
	blocked         map[string]bool     // PeerIDs bloqueados (não armazenar/propagar)
	persistenceMode PersistenceMode
	rateLimiter     *RateLimiter
	listeners       []func(*Post)
	mutex           sync.RWMutex
}

// NewFeedService creates a new feed service
func NewFeedService(ctx context.Context, h host.Host, privKey crypto.PrivKey, ps *pubsub.PubSub, db *database.SQLiteDB) (*FeedService, error) {
	topic, err := ps.Join(FeedTopic)
	if err != nil {
		return nil, err
	}

	sub, err := topic.Subscribe()
	if err != nil {
		return nil, err
	}

	fs := &FeedService{
		ctx:             ctx,
		host:            h,
		privKey:         privKey,
		db:              db,
		ps:              ps,
		topic:           topic,
		sub:             sub,
		posts:           make([]*Post, 0),
		seenNonces:      make(map[string]int64),
		following:       make(map[string]bool),
		blocked:         make(map[string]bool),
		persistenceMode: PersistAll,
		rateLimiter:     NewRateLimiter(10, time.Minute), // Max 10 posts/min por autor
		listeners:       make([]func(*Post), 0),
	}

	// Garbage collection de nonces antigos (a cada 5 min)
	go fs.cleanupNonces()

	// Start listening for new posts
	go fs.readLoop()

	log.Printf("[NEXUS] ✓ Pulso da Malha inicializado no tópico: %s", FeedTopic)
	return fs, nil
}

// cleanupNonces remove nonces mais antigos que 1 hora
func (fs *FeedService) cleanupNonces() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-fs.ctx.Done():
			return
		case <-ticker.C:
			fs.mutex.Lock()
			cutoff := time.Now().Unix() - 3600 // 1 hora
			for nonce, ts := range fs.seenNonces {
				if ts < cutoff {
					delete(fs.seenNonces, nonce)
				}
			}
			fs.mutex.Unlock()
		}
	}
}

// readLoop listens for incoming posts
// GossipSub é apenas propagação - validação é sempre local via assinatura
func (fs *FeedService) readLoop() {
	for {
		select {
		case <-fs.ctx.Done():
			return
		default:
			msg, err := fs.sub.Next(fs.ctx)
			if err != nil {
				if err == context.Canceled {
					return
				}
				continue
			}

			// Ignore own messages
			if msg.ReceivedFrom == fs.host.ID() {
				continue
			}

			// Parse the post
			post, err := PostFromJSON(msg.Data)
			if err != nil {
				log.Printf("[NEXUS] Pulso: Erro ao parsear post: %v", err)
				continue
			}

			// Check if author is blocked (moderação local)
			fs.mutex.RLock()
			isBlocked := fs.blocked[post.AuthorID]
			fs.mutex.RUnlock()

			if isBlocked {
				log.Printf("[NEXUS] Pulso: Post de autor bloqueado ignorado: %s", post.AuthorID[:16])
				continue
			}

			// Rate limiting check
			if !fs.rateLimiter.Allow(post.AuthorID) {
				log.Printf("[NEXUS] Pulso: Rate limit excedido para %s", post.AuthorID[:16])
				continue
			}

			// Anti-replay: verificar nonce
			fs.mutex.Lock()
			if _, seen := fs.seenNonces[post.Nonce]; seen {
				fs.mutex.Unlock()
				log.Printf("[NEXUS] Pulso: Replay attack detectado de %s", post.AuthorID[:16])
				continue
			}
			fs.seenNonces[post.Nonce] = post.Timestamp
			fs.mutex.Unlock()

			// Timestamp validation (não aceitar posts do futuro ou muito antigos)
			now := time.Now().Unix()
			if post.Timestamp > now+60 || post.Timestamp < now-3600 {
				log.Printf("[NEXUS] Pulso: Timestamp inválido de %s", post.AuthorID[:16])
				continue
			}

			// Verify signature (validação local - CRÍTICO)
			valid, err := post.VerifySignature()
			if err != nil || !valid {
				log.Printf("[NEXUS] Pulso: Assinatura inválida de %s", post.AuthorID[:16])
				continue
			}

			log.Printf("[NEXUS] Pulso: Post recebido de %s: %s", post.AuthorID[:16], truncate(post.Content, 50))

			// Apply persistence policy
			fs.applyPersistencePolicy(post)
		}
	}
}

// applyPersistencePolicy decides whether to store a post based on user settings
func (fs *FeedService) applyPersistencePolicy(post *Post) {
	fs.mutex.RLock()
	mode := fs.persistenceMode
	isFollowing := fs.following[post.AuthorID]
	fs.mutex.RUnlock()

	shouldStore := false

	switch mode {
	case PersistAll:
		shouldStore = true
	case PersistFollowing:
		shouldStore = isFollowing
	case PersistNone:
		shouldStore = false
	}

	if shouldStore {
		fs.addPost(post)
	} else {
		// Ainda notifica listeners (modo transitório - mostra mas não guarda)
		for _, listener := range fs.listeners {
			go listener(post)
		}
	}
}

// addPost adds a post to the feed
func (fs *FeedService) addPost(post *Post) {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()

	// Check for duplicates
	for _, p := range fs.posts {
		if p.ID == post.ID {
			return
		}
	}

	fs.posts = append([]*Post{post}, fs.posts...)

	// Keep only last 500 posts in memory
	if len(fs.posts) > 500 {
		fs.posts = fs.posts[:500]
	}

	// Save to DB
	if err := fs.db.SaveFeedPost(post); err != nil {
		log.Printf("[NEXUS] Feed: Erro ao salvar post: %v", err)
	}

	// Notify listeners
	for _, listener := range fs.listeners {
		go listener(post)
	}
}

// CreatePost creates and publishes a new post
func (fs *FeedService) CreatePost(postType PostType, content string, media *MediaReference) (*Post, error) {
	post, err := NewPost(fs.privKey, postType, content, media)
	if err != nil {
		return nil, err
	}

	// Publish to GossipSub
	data, err := post.ToJSON()
	if err != nil {
		return nil, err
	}

	if err := fs.topic.Publish(fs.ctx, data); err != nil {
		return nil, err
	}

	// Add to local feed
	fs.addPost(post)

	log.Printf("[NEXUS] Pulso: Post publicado: %s", truncate(content, 50))
	return post, nil
}

// GetPosts returns the feed posts
func (fs *FeedService) GetPosts(limit, offset int) []*Post {
	fs.mutex.RLock()
	defer fs.mutex.RUnlock()

	if offset >= len(fs.posts) {
		return []*Post{}
	}

	end := offset + limit
	if end > len(fs.posts) {
		end = len(fs.posts)
	}

	return fs.posts[offset:end]
}

// OnNewPost registers a listener for new posts
func (fs *FeedService) OnNewPost(listener func(*Post)) {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()
	fs.listeners = append(fs.listeners, listener)
}

// LikePost likes a post (local only for now)
func (fs *FeedService) LikePost(postID string) error {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()

	for _, p := range fs.posts {
		if p.ID == postID {
			p.Likes++
			p.LikedByMe = true
			return nil
		}
	}
	return nil
}

// Follow adds a peer to the following list
func (fs *FeedService) Follow(peerID string) {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()
	fs.following[peerID] = true
	delete(fs.blocked, peerID) // Unblock if following
	log.Printf("[NEXUS] Feed: Seguindo %s", peerID[:16])
}

// Unfollow removes a peer from the following list
func (fs *FeedService) Unfollow(peerID string) {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()
	delete(fs.following, peerID)
	log.Printf("[NEXUS] Feed: Deixou de seguir %s", peerID[:16])
}

// Block adds a peer to the blocked list (moderação local)
// Bloqueio = não armazenar / não propagar - NÃO existe ban global
func (fs *FeedService) Block(peerID string) {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()
	fs.blocked[peerID] = true
	delete(fs.following, peerID) // Unfollow if blocking
	log.Printf("[NEXUS] Feed: Bloqueado %s (local)", peerID[:16])
}

// Unblock removes a peer from the blocked list
func (fs *FeedService) Unblock(peerID string) {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()
	delete(fs.blocked, peerID)
	log.Printf("[NEXUS] Feed: Desbloqueado %s", peerID[:16])
}

// SetPersistenceMode configures how posts are stored
func (fs *FeedService) SetPersistenceMode(mode PersistenceMode) {
	fs.mutex.Lock()
	defer fs.mutex.Unlock()
	fs.persistenceMode = mode
	log.Printf("[NEXUS] Feed: Modo de persistência: %s", mode)
}

// GetFollowing returns the list of followed peers
func (fs *FeedService) GetFollowing() []string {
	fs.mutex.RLock()
	defer fs.mutex.RUnlock()
	
	var following []string
	for peerID := range fs.following {
		following = append(following, peerID)
	}
	return following
}

// IsFollowing checks if a peer is being followed
func (fs *FeedService) IsFollowing(peerID string) bool {
	fs.mutex.RLock()
	defer fs.mutex.RUnlock()
	return fs.following[peerID]
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// FeedMessage wraps a post for WebSocket broadcast
type FeedMessage struct {
	Type string `json:"type"`
	Post *Post  `json:"post"`
}

func NewFeedMessage(post *Post) []byte {
	msg := FeedMessage{Type: "new_post", Post: post}
	data, _ := json.Marshal(msg)
	return data
}
