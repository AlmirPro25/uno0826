package kernel

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Event types for P2P telemetry
const (
	EventPeerConnected    = "p2p.peer.connected"
	EventPeerDisconnected = "p2p.peer.disconnected"
	EventMessageSent      = "p2p.message.sent"
	EventMessageReceived  = "p2p.message.received"
	EventCallStarted      = "p2p.call.started"
	EventCallEnded        = "p2p.call.ended"
	EventFileShared       = "p2p.file.shared"
	EventFileDownloaded   = "p2p.file.downloaded"
	EventPostCreated      = "p2p.post.created"
	EventPostLiked        = "p2p.post.liked"
	EventCommunityJoined  = "p2p.community.joined"
	EventCommunityLeft    = "p2p.community.left"
	EventNodeStarted      = "p2p.node.started"
	EventNodeStopped      = "p2p.node.stopped"
)

// EmitEvent queues an event to be sent to the kernel
func (b *Bridge) EmitEvent(eventType string, metadata map[string]interface{}) {
	if !b.IsEnabled() {
		return
	}

	event := &TelemetryEvent{
		Type:      eventType,
		UserID:    b.getLinkedUserID(),
		Metadata:  metadata,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	// Non-blocking send
	select {
	case b.eventQueue <- event:
	default:
		log.Println("[KERNEL] Event queue full, dropping event")
	}
}

// EmitPeerConnected emits a peer connection event
func (b *Bridge) EmitPeerConnected(peerID string, latencyMs int64) {
	b.EmitEvent(EventPeerConnected, map[string]interface{}{
		"peer_id":    peerID,
		"latency_ms": latencyMs,
	})
}

// EmitPeerDisconnected emits a peer disconnection event
func (b *Bridge) EmitPeerDisconnected(peerID string, durationSec int64) {
	b.EmitEvent(EventPeerDisconnected, map[string]interface{}{
		"peer_id":      peerID,
		"duration_sec": durationSec,
	})
}

// EmitMessageSent emits a message sent event
func (b *Bridge) EmitMessageSent(receiverPeerID string, topic string, sizeBytes int) {
	b.EmitEvent(EventMessageSent, map[string]interface{}{
		"receiver_peer_id": receiverPeerID,
		"topic":            topic,
		"size_bytes":       sizeBytes,
	})
}

// EmitCallStarted emits a call started event
func (b *Bridge) EmitCallStarted(targetPeerID string, callType string) {
	b.EmitEvent(EventCallStarted, map[string]interface{}{
		"target_peer_id": targetPeerID,
		"call_type":      callType,
	})
}

// EmitCallEnded emits a call ended event
func (b *Bridge) EmitCallEnded(targetPeerID string, durationSec int64) {
	b.EmitEvent(EventCallEnded, map[string]interface{}{
		"target_peer_id": targetPeerID,
		"duration_sec":   durationSec,
	})
}

// EmitFileShared emits a file shared event
func (b *Bridge) EmitFileShared(fileHash string, sizeBytes int64, mimeType string) {
	b.EmitEvent(EventFileShared, map[string]interface{}{
		"file_hash":  fileHash,
		"size_bytes": sizeBytes,
		"mime_type":  mimeType,
	})
}

// EmitPostCreated emits a post created event
func (b *Bridge) EmitPostCreated(postID string, postType string) {
	b.EmitEvent(EventPostCreated, map[string]interface{}{
		"post_id":   postID,
		"post_type": postType,
	})
}

// EmitCommunityJoined emits a community joined event
func (b *Bridge) EmitCommunityJoined(communityID string, communityName string) {
	b.EmitEvent(EventCommunityJoined, map[string]interface{}{
		"community_id":   communityID,
		"community_name": communityName,
	})
}

// EmitNodeStarted emits a node started event
func (b *Bridge) EmitNodeStarted(version string, features []string) {
	b.EmitEvent(EventNodeStarted, map[string]interface{}{
		"version":  version,
		"features": features,
	})
}

// processEventQueue processes events in the background
func (b *Bridge) processEventQueue() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	var batch []*TelemetryEvent

	for {
		select {
		case event := <-b.eventQueue:
			batch = append(batch, event)
			// Send batch when it reaches 50 events
			if len(batch) >= 50 {
				b.sendBatch(batch)
				batch = nil
			}
		case <-ticker.C:
			// Send any pending events every 5 seconds
			if len(batch) > 0 {
				b.sendBatch(batch)
				batch = nil
			}
		}
	}
}

// sendBatch sends a batch of events to the kernel
func (b *Bridge) sendBatch(events []*TelemetryEvent) {
	if len(events) == 0 {
		return
	}

	b.mu.RLock()
	if !b.enabled || b.kernelURL == "" {
		b.mu.RUnlock()
		return
	}
	kernelURL := b.kernelURL
	appKey := b.appKey
	appSecret := b.appSecret
	b.mu.RUnlock()

	// Send each event (could be optimized to batch endpoint)
	for _, event := range events {
		if err := b.sendEvent(kernelURL, appKey, appSecret, event); err != nil {
			log.Printf("[KERNEL] Erro ao enviar evento: %v", err)
		}
	}
}

// sendEvent sends a single event to the kernel
func (b *Bridge) sendEvent(kernelURL, appKey, appSecret string, event *TelemetryEvent) error {
	payload := map[string]interface{}{
		"type":      event.Type,
		"user_id":   event.UserID,
		"metadata":  event.Metadata,
		"timestamp": event.Timestamp,
		"context":   "{}",
	}

	// Set default user_id if not linked
	if payload["user_id"] == "" {
		payload["user_id"] = "00000000-0000-0000-0000-000000000000"
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	req, err := http.NewRequest("POST", kernelURL+"/api/v1/telemetry/events", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Prost-App-Key", appKey)
	req.Header.Set("X-Prost-App-Secret", appSecret)

	resp, err := b.client.Do(req)
	if err != nil {
		return fmt.Errorf("http error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("kernel returned status %d", resp.StatusCode)
	}

	return nil
}

// getLinkedUserID returns the linked user ID or empty string
func (b *Bridge) getLinkedUserID() string {
	b.mu.RLock()
	defer b.mu.RUnlock()
	return b.linkedUserID
}
