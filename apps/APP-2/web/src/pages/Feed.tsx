import { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Zap, Image, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

interface Post {
  id: string;
  author: {
    name: string;
    peerId: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  timestamp: Date;
  isLiked: boolean;
}

// Mock posts for demo
const mockPosts: Post[] = [
  {
    id: '1',
    author: { name: 'CyberNinja', peerId: '12D3KooW...abc' },
    content: '🔥 Acabei de entrar na mesh! Rede P2P descentralizada é o futuro. Sem servidores, sem censura, só liberdade.',
    likes: 42,
    comments: 8,
    shares: 3,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isLiked: false,
  },
  {
    id: '2',
    author: { name: 'NeonHacker', peerId: '12D3KooW...xyz' },
    content: 'Testando chamadas de voz P2P. Qualidade incrível e zero latência! WebRTC + libp2p = 🚀',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600',
    likes: 128,
    comments: 24,
    shares: 15,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    isLiked: true,
  },
  {
    id: '3',
    author: { name: 'DataPhantom', peerId: '12D3KooW...def' },
    content: 'Comunidade de devs crescendo! Já somos 50 nodes ativos na mesh. Quem mais quer fazer parte dessa revolução?',
    likes: 89,
    comments: 31,
    shares: 12,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isLiked: false,
  },
];

export function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [newPost, setNewPost] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const toast = useToast();

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLiked = !post.isLiked;
        if (newLiked) {
          toast.success('Curtido!', 'Post adicionado aos favoritos');
        }
        return {
          ...post,
          isLiked: newLiked,
          likes: newLiked ? post.likes + 1 : post.likes - 1,
        };
      }
      return post;
    }));
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    
    // Simulate posting
    await new Promise(r => setTimeout(r, 500));
    
    const post: Post = {
      id: Date.now().toString(),
      author: { name: 'Você', peerId: '12D3KooW...you' },
      content: newPost,
      likes: 0,
      comments: 0,
      shares: 0,
      timestamp: new Date(),
      isLiked: false,
    };
    
    setPosts([post, ...posts]);
    setNewPost('');
    setIsPosting(false);
    toast.success('Publicado!', 'Seu post foi enviado para a mesh');
  };

  const handleShare = (postId: string) => {
    navigator.clipboard.writeText(`nexus://post/${postId}`);
    toast.info('Link copiado!', 'Compartilhe com outros peers');
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Stories/Status Row */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-3">
          {/* Add Story */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-dashed border-cyan-500/50 flex items-center justify-center">
              <span className="text-2xl text-cyan-400">+</span>
            </div>
            <span className="text-[10px] text-gray-500">Seu status</span>
          </div>
          
          {/* Online peers as stories */}
          {['CyberNinja', 'NeonHacker', 'DataPhantom', 'GhostNode'].map((name, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-cyan-400 to-purple-500">
                <div className="w-full h-full rounded-full bg-[#0d0d15] flex items-center justify-center">
                  <span className="text-lg">{name[0]}</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 truncate w-16 text-center">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Post */}
      <div className="mx-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-black" />
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="O que está acontecendo na mesh?"
              className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none text-sm"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-cyan-400 transition-colors">
                  <Image size={18} />
                </button>
              </div>
              <button
                onClick={handlePost}
                disabled={!newPost.trim() || isPosting}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  newPost.trim()
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                    : "bg-white/10 text-gray-500"
                )}
              >
                {isPosting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {isPosting ? 'Enviando...' : 'Postar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4 px-4 pb-4">
        {posts.map((post) => (
          <article 
            key={post.id} 
            className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden"
          >
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/50 to-purple-500/50 flex items-center justify-center">
                  <span className="font-bold">{post.author.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{post.author.name}</p>
                  <p className="text-xs text-gray-500">{formatTime(post.timestamp)}</p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                <MoreHorizontal size={18} />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-200 leading-relaxed">{post.content}</p>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="relative">
                <img 
                  src={post.image} 
                  alt="" 
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            )}

            {/* Post Actions */}
            <div className="p-4 flex items-center justify-between border-t border-white/5">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    post.isLiked ? "text-pink-500" : "text-gray-400 hover:text-pink-400"
                  )}
                >
                  <Heart size={20} fill={post.isLiked ? "currentColor" : "none"} />
                  <span className="text-sm">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-cyan-400 transition-colors">
                  <MessageCircle size={20} />
                  <span className="text-sm">{post.comments}</span>
                </button>
                <button 
                  onClick={() => handleShare(post.id)}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-purple-400 transition-colors"
                >
                  <Share2 size={20} />
                  <span className="text-sm">{post.shares}</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
