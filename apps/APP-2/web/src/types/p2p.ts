
export interface Peer {
  ID: string;
  Addrs: string;
  LastSeen: number;
  Nickname: string;
  LatencyMs: number;
}

export interface Message {
  id: string;
  sender_peer_id: string;
  receiver_peer_id: string;
  topic: string;
  payload: string | Uint8Array; // Encrypted content, could be string (base64) or raw bytes
  timestamp: number;
  is_read: boolean;
}

export interface P2PNodeStatus {
  peer_id: string;
  listen_addrs: string[];
  connected_at: number;
  version: string;
  uptime_seconds: number;
}


// Social Feed Types
export type PostType = 'text' | 'image' | 'video' | 'file';

// MediaReference - referência a mídia via hash (não embeda)
export interface MediaReference {
  hash: string;      // Merkle root do arquivo
  mime_type: string; // Tipo MIME
  size: number;      // Tamanho em bytes
  name: string;      // Nome original (metadado opcional)
}

export interface Post {
  id: string;
  author_id: string;
  author_name?: string;
  type: PostType;
  content: string;
  media?: MediaReference;  // Referência, não embed
  timestamp: number;
  nonce: string;           // Anti-replay
  signature: string;
  reply_to?: string;
  likes: number;
  liked_by_me?: boolean;
}

// Swarm/File Sharing Types
export interface FileMetadata {
  hash: string;
  name: string;
  size: number;
  mime_type: string;
  chunk_count: number;
  chunk_hashes: string[];
  owner_id: string;
  timestamp: number;
}

export interface DownloadProgress {
  file_hash: string;
  file_name: string;
  total_chunks: number;
  downloaded: number;
  percentage: number;
  sources: string[];
  status: 'downloading' | 'complete' | 'failed';
}


// Community Types
export interface Community {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  created_at: number;
  rules?: string[];
  tags?: string[];
  is_private: boolean;
  member_count: number;
}

export interface CommunityMessage {
  id: string;
  community_id: string;
  author_id: string;
  author_name?: string;
  content: string;
  timestamp: number;
  nonce: string;
  signature: string;
  reply_to?: string;
}

// Reputation Types
export interface PeerScore {
  peer_id: string;
  trust_score: number;
  reliability_score: number;
  content_score: number;
  network_score: number;
  last_updated: number;
  total_interactions: number;
}

// Notification Types
export type NotificationType = 
  | 'new_message'
  | 'new_post'
  | 'post_liked'
  | 'new_follower'
  | 'mention'
  | 'file_received'
  | 'download_complete'
  | 'call_incoming'
  | 'call_missed'
  | 'community_invite'
  | 'community_message'
  | 'peer_connected'
  | 'peer_disconnected';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  peer_id?: string;
  peer_name?: string;
  data?: unknown;
  timestamp: number;
  read: boolean;
  action_url?: string;
}
