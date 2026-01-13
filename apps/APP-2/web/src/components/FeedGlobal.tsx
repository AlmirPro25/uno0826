import { useState, useEffect, useRef } from 'react';
import { 
  HeartIcon, MessageCircleIcon, Share2Icon, ImageIcon, 
  VideoIcon, FileIcon, MoreHorizontalIcon, RefreshCwIcon, UserIcon,
  DownloadIcon, XIcon
} from 'lucide-react';
import { Post, PostType } from '@/types/p2p';
import { getFeed, createPost, likePost, uploadFile } from '@/services/api';
import { cn } from '@/lib/utils';

interface FeedGlobalProps {
  localPeerId: string | null;
}

export function FeedGlobal({ localPeerId }: FeedGlobalProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadFeed = async () => {
    try {
      setIsLoading(true);
      const data = await getFeed();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('[NEXUS] Erro ao carregar feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedMedia) return;
    
    setIsPosting(true);
    try {
      let mediaHash = '';
      let mediaType = '';
      let mediaSize = 0;
      let mediaName = '';
      let postType: PostType = 'text';

      if (selectedMedia) {
        const uploadResult = await uploadFile(selectedMedia);
        if (uploadResult.metadata) {
          mediaHash = uploadResult.metadata.hash;
          mediaType = uploadResult.metadata.mime_type;
          mediaSize = uploadResult.metadata.size;
          mediaName = selectedMedia.name;
          postType = mediaType.startsWith('image/') ? 'image' : 
                     mediaType.startsWith('video/') ? 'video' : 'file';
        }
      }

      await createPost(newPostContent, postType, mediaHash, mediaType, mediaSize, mediaName);
      setNewPostContent('');
      setSelectedMedia(null);
      setMediaPreview(null);
      loadFeed();
    } catch (error) {
      console.error('[NEXUS] Erro ao criar post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await likePost(postId);
      setPosts(posts.map(p => 
        p.id === postId ? { ...p, likes: p.likes + 1, liked_by_me: true } : p
      ));
    } catch (error) {
      console.error('[NEXUS] Erro ao curtir:', error);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onload = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return 'agora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('pt-BR');
  };

  const renderMedia = (post: Post) => {
    if (!post.media) return null;

    // Mídia é resolvida via Swarm usando o hash
    const mediaUrl = `/api/v1/swarm/chunk?hash=${post.media.hash}`;

    if (post.type === 'image' || post.media.mime_type?.startsWith('image/')) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden bg-black/20">
          <img 
            src={mediaUrl} 
            alt="Post media" 
            className="w-full max-h-96 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (post.type === 'video' || post.media.mime_type?.startsWith('video/')) {
      return (
        <div className="mt-3 rounded-xl overflow-hidden bg-black">
          <video 
            src={mediaUrl}
            controls
            className="w-full max-h-96"
            preload="metadata"
          />
        </div>
      );
    }

    return (
      <div className="mt-3 p-3 bg-[#1a1a1a] rounded-xl flex items-center gap-3">
        <FileIcon size={24} className="text-emerald-400" />
        <span className="text-gray-300 text-sm truncate flex-1">
          {post.media.name || post.media.mime_type}
        </span>
        <button className="p-2 hover:bg-[#222] rounded-lg transition-all">
          <DownloadIcon size={16} className="text-gray-400" />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Pulso da Malha</h2>
          <p className="text-xs text-gray-500">O que seu nó escolheu armazenar</p>
        </div>
        <button 
          onClick={loadFeed}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
        >
          <RefreshCwIcon size={18} className={cn(isLoading && "animate-spin")} />
        </button>
      </div>

      {/* New Post Composer */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <UserIcon size={18} className="text-black" />
          </div>
          <div className="flex-1">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="O que está acontecendo na malha?"
              className="w-full bg-transparent text-white placeholder:text-gray-500 resize-none focus:outline-none text-sm"
              rows={2}
            />
            
            {/* Media Preview */}
            {mediaPreview && (
              <div className="relative mt-2 rounded-xl overflow-hidden bg-[#1a1a1a]">
                {selectedMedia?.type.startsWith('image/') ? (
                  <img src={mediaPreview} alt="Preview" className="max-h-48 w-full object-contain" />
                ) : selectedMedia?.type.startsWith('video/') ? (
                  <video src={mediaPreview} className="max-h-48 w-full" controls />
                ) : (
                  <div className="p-4 flex items-center gap-3">
                    <FileIcon size={24} className="text-emerald-400" />
                    <span className="text-gray-300 text-sm">{selectedMedia?.name}</span>
                  </div>
                )}
                <button 
                  onClick={() => { setSelectedMedia(null); setMediaPreview(null); }}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80"
                >
                  <XIcon size={16} className="text-white" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a1a]">
              <div className="flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                >
                  <ImageIcon size={18} />
                </button>
                <button 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'video/*';
                      fileInputRef.current.click();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                >
                  <VideoIcon size={18} />
                </button>
              </div>
              <button
                onClick={handleCreatePost}
                disabled={(!newPostContent.trim() && !selectedMedia) || isPosting}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
              >
                {isPosting ? 'Postando...' : 'Postar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
              <MessageCircleIcon size={28} className="text-emerald-500/30" />
            </div>
            <p className="text-gray-400 font-medium text-sm">Nenhum post ainda</p>
            <p className="text-gray-600 text-xs mt-1">Seja o primeiro a pulsar na malha!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="p-4 border-b border-[#1a1a1a] hover:bg-[#0d0d0d] transition-all">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold text-sm">
                    {(post.author_name || post.author_id)[0].toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm truncate">
                      {post.author_name || `Peer ${post.author_id.substring(0, 12)}...`}
                    </span>
                    <span className="text-gray-500 text-xs">·</span>
                    <span className="text-gray-500 text-xs">{formatTime(post.timestamp)}</span>
                    {post.author_id === localPeerId && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] rounded-full">
                        você
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-gray-200 text-sm mt-1 whitespace-pre-wrap break-words">
                    {post.content}
                  </p>

                  {/* Media */}
                  {renderMedia(post)}

                  {/* Actions */}
                  <div className="flex items-center gap-6 mt-3">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs transition-all",
                        post.liked_by_me 
                          ? "text-red-400" 
                          : "text-gray-500 hover:text-red-400"
                      )}
                    >
                      <HeartIcon size={16} className={cn(post.liked_by_me && "fill-current")} />
                      <span>{post.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-400 text-xs transition-all">
                      <MessageCircleIcon size={16} />
                      <span>0</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-500 hover:text-blue-400 text-xs transition-all">
                      <Share2Icon size={16} />
                    </button>
                  </div>
                </div>

                <button className="p-1 text-gray-500 hover:text-white hover:bg-[#1a1a1a] rounded-lg transition-all self-start">
                  <MoreHorizontalIcon size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
