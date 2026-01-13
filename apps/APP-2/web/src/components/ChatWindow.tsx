import React, { useRef, useEffect } from 'react';
import { Message } from '@/types/p2p';
import { format } from 'date-fns';
import { FileIcon, DownloadIcon } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  localPeerId: string | null;
  peerName: string;
}

// Check if content is a media message
const isMediaMessage = (content: string): { isMedia: boolean; type?: string; hash?: string; name?: string } => {
  try {
    if (content.startsWith('{') && content.includes('"type"')) {
      const parsed = JSON.parse(content);
      if (parsed.type === 'media' && parsed.hash) {
        return { isMedia: true, type: parsed.mediaType, hash: parsed.hash, name: parsed.name };
      }
    }
  } catch {}
  return { isMedia: false };
};

// Render media content
const MediaContent: React.FC<{ type?: string; hash?: string; name?: string }> = ({ type, hash, name }) => {
  const mediaUrl = `/api/v1/swarm/chunk?hash=${hash}`;

  if (type?.startsWith('image/')) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden bg-black/20 max-w-sm">
        <img 
          src={mediaUrl} 
          alt={name || 'Image'} 
          className="w-full max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      </div>
    );
  }

  if (type?.startsWith('video/')) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden bg-black max-w-sm relative">
        <video 
          src={mediaUrl}
          controls
          className="w-full max-h-64"
          preload="metadata"
        />
      </div>
    );
  }

  // Generic file
  return (
    <div className="mt-2 p-3 bg-black/20 rounded-lg flex items-center gap-3 max-w-sm">
      <FileIcon size={20} className="text-emerald-400 flex-shrink-0" />
      <span className="text-sm truncate flex-1">{name || 'Arquivo'}</span>
      <a 
        href={mediaUrl} 
        download={name}
        className="p-1.5 hover:bg-white/10 rounded transition-colors"
      >
        <DownloadIcon size={16} />
      </a>
    </div>
  );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, localPeerId, peerName }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to decode message payload (base64 to string)
  const decodePayload = (payload: string | Uint8Array): string => {
    if (typeof payload === 'string') {
      try {
        // Use browser's atob for base64 decoding
        return atob(payload);
      } catch (e) {
        // If not base64, return as-is
        return payload;
      }
    }
    // If it's Uint8Array, convert to string
    return new TextDecoder().decode(payload);
  };

  return (
    <div className="flex-1 overflow-y-auto border border-nexus-grey rounded-md p-4 bg-nexus-black flex flex-col-reverse custom-scrollbar">
      <div ref={messagesEndRef} />
      {messages.slice().reverse().map((msg, index) => {
        const isLocalSender = msg.sender_peer_id === localPeerId;
        const decodedContent = decodePayload(msg.payload);
        const mediaInfo = isMediaMessage(decodedContent);

        return (
          <div
            key={msg.id || index}
            className={`flex mb-4 ${isLocalSender ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                isLocalSender
                  ? 'bg-nexus-accent-green text-nexus-black'
                  : 'bg-nexus-grey text-nexus-light-grey border border-nexus-accent-amber'
              }`}
            >
              <div className="text-xs text-nexus-muted-foreground mb-1">
                {isLocalSender ? 'Você' : (msg.sender_peer_id === peerName ? peerName : msg.sender_peer_id.substring(0, 10) + '...')}
                {' '}- {format(new Date(msg.timestamp * 1000), 'HH:mm:ss')}
              </div>
              
              {mediaInfo.isMedia ? (
                <MediaContent type={mediaInfo.type} hash={mediaInfo.hash} name={mediaInfo.name} />
              ) : (
                <p className="text-sm break-words">{decodedContent}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
