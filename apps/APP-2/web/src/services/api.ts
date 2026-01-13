
import { Message } from '@/types/p2p';

const API_BASE_URL = '/api/v1';

export const getStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/status`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getConnectedPeers = async () => {
  const response = await fetch(`${API_BASE_URL}/peers`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getMessages = async (peerId?: string, topic?: string): Promise<Message[]> => {
  let url = `${API_BASE_URL}/messages`;
  if (peerId) {
    url += `?peerId=${peerId}`;
  } else if (topic) {
    url += `?topic=${topic}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const sendMessage = async (receiverPeerId: string, payload: string, topic?: string) => {
  const response = await fetch(`${API_BASE_URL}/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receiver_peer_id: receiverPeerId,
      topic: topic,
      payload: payload,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
  }
  return response.json();
};

export const startWebRTCCall = async (targetPeerId: string, callType: 'audio' | 'video' = 'audio') => {
  const response = await fetch(`${API_BASE_URL}/webrtc/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target_peer_id: targetPeerId,
      call_type: callType,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
  }
  return response.json();
};

export const startVideoCall = async (targetPeerId: string) => {
  return startWebRTCCall(targetPeerId, 'video');
};

export const hangupWebRTCCall = async (targetPeerId: string) => {
  const response = await fetch(`${API_BASE_URL}/webrtc/hangup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target_peer_id: targetPeerId,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
  }
  return response.json();
};


import { Post, FileMetadata, DownloadProgress } from '@/types/p2p';

// ═══════════════════════════════════════════════════════════════════
// FEED SOCIAL API
// ═══════════════════════════════════════════════════════════════════

export const getFeed = async (): Promise<{ posts: Post[]; local_peer_id: string }> => {
  const response = await fetch(`${API_BASE_URL}/feed`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const createPost = async (
  content: string, 
  type: string = 'text',
  mediaHash?: string,
  mediaType?: string,
  mediaSize?: number,
  mediaName?: string
): Promise<Post> => {
  const response = await fetch(`${API_BASE_URL}/feed/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      content, 
      type, 
      media_hash: mediaHash, 
      media_type: mediaType,
      media_size: mediaSize,
      media_name: mediaName
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
  }
  return response.json();
};

export const likePost = async (postId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/feed/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ post_id: postId }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

// ═══════════════════════════════════════════════════════════════════
// SWARM/FILE SHARING API
// ═══════════════════════════════════════════════════════════════════

export const uploadFile = async (file: File): Promise<{ status: string; path: string; metadata?: FileMetadata }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const shareFile = async (filePath: string): Promise<FileMetadata> => {
  const response = await fetch(`${API_BASE_URL}/swarm/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_path: filePath }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const downloadFile = async (metadata: FileMetadata): Promise<DownloadProgress> => {
  const response = await fetch(`${API_BASE_URL}/swarm/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getDownloadProgress = async (fileHash: string): Promise<DownloadProgress> => {
  const response = await fetch(`${API_BASE_URL}/swarm/progress?hash=${fileHash}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};


// ═══════════════════════════════════════════════════════════════════
// FEED SOCIAL - FOLLOW/BLOCK/SETTINGS
// ═══════════════════════════════════════════════════════════════════

export const followPeer = async (peerId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/feed/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ peer_id: peerId }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

export const unfollowPeer = async (peerId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/feed/unfollow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ peer_id: peerId }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

export const blockPeer = async (peerId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/feed/block`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ peer_id: peerId }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};

export type PersistenceMode = 'all' | 'following' | 'none';

export const getFeedSettings = async (): Promise<{ following: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/feed/settings`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const setFeedPersistenceMode = async (mode: PersistenceMode): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/feed/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persistence_mode: mode }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
};


import { Community, CommunityMessage, PeerScore, Notification } from '@/types/p2p';

// ═══════════════════════════════════════════════════════════════════
// COMMUNITY API
// ═══════════════════════════════════════════════════════════════════

export const getCommunities = async (): Promise<{ communities: Community[] }> => {
  const response = await fetch(`${API_BASE_URL}/communities`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const createCommunity = async (
  name: string,
  description: string,
  rules?: string[],
  tags?: string[],
  isPrivate?: boolean
): Promise<Community> => {
  const response = await fetch(`${API_BASE_URL}/community/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, rules, tags, is_private: isPrivate }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const joinCommunity = async (community: Community): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/community/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(community),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
};

export const leaveCommunity = async (communityId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/community/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ community_id: communityId }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
};

export const getCommunityMessages = async (communityId: string): Promise<{
  messages: CommunityMessage[];
  members: string[];
}> => {
  const response = await fetch(`${API_BASE_URL}/community/messages?id=${communityId}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const sendCommunityMessage = async (
  communityId: string,
  content: string,
  replyTo?: string
): Promise<CommunityMessage> => {
  const response = await fetch(`${API_BASE_URL}/community/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ community_id: communityId, content, reply_to: replyTo }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ═══════════════════════════════════════════════════════════════════
// REPUTATION API
// ═══════════════════════════════════════════════════════════════════

export const getPeerReputation = async (peerId: string): Promise<{
  score: PeerScore;
  overall_score: number;
  is_trusted: boolean;
}> => {
  const response = await fetch(`${API_BASE_URL}/reputation?peer_id=${peerId}`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const getTopPeers = async (): Promise<{ top_peers: PeerScore[] }> => {
  const response = await fetch(`${API_BASE_URL}/reputation/top`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

// ═══════════════════════════════════════════════════════════════════
// NOTIFICATIONS API
// ═══════════════════════════════════════════════════════════════════

export const getNotifications = async (): Promise<{
  notifications: Notification[];
  unread_count: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/notifications`);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
};

export const markNotificationRead = async (notificationId?: string, markAll?: boolean): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notifications/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notification_id: notificationId, mark_all: markAll }),
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
};

export const clearNotifications = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notifications/clear`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
};
