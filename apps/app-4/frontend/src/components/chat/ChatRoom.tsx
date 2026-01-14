import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send, Paperclip, Image as ImageIcon, Smile, Mic, MicOff,
    Phone, Video, MoreVertical, Check, CheckCheck, X,
    ChevronLeft, Camera, File, MapPin, User, Clock,
    Trash2, Copy, Reply, Forward, Star, Download
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
    id: string;
    senderId: number;
    receiverId: number;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'location';
    fileName?: string;
    fileSize?: number;
    imageUrl?: string;
    audioUrl?: string;
    audioDuration?: number;
    location?: { lat: number; lng: number };
    createdAt: Date;
    read: boolean;
    starred?: boolean;
    replyTo?: Message;
}

interface Participant {
    id: number;
    name: string;
    avatar?: string;
    role: 'doctor' | 'patient' | 'clinic';
    specialty?: string;
    online?: boolean;
    lastSeen?: Date;
    typing?: boolean;
}

interface ChatRoomProps {
    participant: Participant;
    messages: Message[];
    currentUserId: number;
    onSendMessage: (content: string, type: Message['type'], file?: File) => void;
    onBack: () => void;
    onCall?: (type: 'audio' | 'video') => void;
    onViewProfile?: () => void;
}

export function ChatRoom({
    participant,
    messages,
    currentUserId,
    onSendMessage,
    onBack,
    onCall,
    onViewProfile
}: ChatRoomProps) {
    const [newMessage, setNewMessage] = useState('');
    const [showAttachMenu, setShowAttachMenu] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!newMessage.trim()) return;
        onSendMessage(newMessage, 'text');
        setNewMessage('');
        setReplyingTo(null);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const file = e.target.files?.[0];
        if (file) {
            onSendMessage(file.name, type, file);
        }
        setShowAttachMenu(false);
    };

    const formatMessageDate = (date: Date) => {
        if (isToday(date)) return 'Hoje';
        if (isYesterday(date)) return 'Ontem';
        return format(date, "dd 'de' MMMM", { locale: ptBR });
    };

    const formatTime = (date: Date) => {
        return format(date, 'HH:mm');
    };

    const formatLastSeen = (date?: Date) => {
        if (!date) return '';
        if (isToday(date)) return `visto hoje às ${format(date, 'HH:mm')}`;
        if (isYesterday(date)) return `visto ontem às ${format(date, 'HH:mm')}`;
        return `visto em ${format(date, "dd/MM 'às' HH:mm")}`;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    const groupMessagesByDate = () => {
        const groups: { date: string; messages: Message[] }[] = [];
        let currentDate = '';

        messages.forEach(msg => {
            const msgDate = formatMessageDate(new Date(msg.createdAt));
            if (msgDate !== currentDate) {
                currentDate = msgDate;
                groups.push({ date: msgDate, messages: [msg] });
            } else {
                groups[groups.length - 1].messages.push(msg);
            }
        });

        return groups;
    };

    const emojis = ['😀', '😂', '😍', '🥰', '😊', '👍', '❤️', '🙏', '👏', '🎉', '💪', '🤔'];

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg md:hidden"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={onViewProfile}
                    >
                        <div className="relative">
                            {participant.avatar ? (
                                <img
                                    src={participant.avatar}
                                    alt={participant.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {getInitials(participant.name)}
                                </div>
                            )}
                            {participant.online && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full" />
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {participant.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {participant.typing ? (
                                    <span className="text-cyan-500">digitando...</span>
                                ) : participant.online ? (
                                    'online'
                                ) : (
                                    formatLastSeen(participant.lastSeen)
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={() => onCall?.('audio')}
                        className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <Phone className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => onCall?.('video')}
                        className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                {groupMessagesByDate().map((group, groupIndex) => (
                    <div key={groupIndex}>
                        {/* Date Separator */}
                        <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs text-gray-500 shadow-sm">
                                {group.date}
                            </span>
                        </div>

                        {/* Messages */}
                        {group.messages.map((message, msgIndex) => {
                            const isOwn = message.senderId === currentUserId;
                            const showAvatar = !isOwn && (
                                msgIndex === 0 || 
                                group.messages[msgIndex - 1].senderId !== message.senderId
                            );

                            return (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                                >
                                    {!isOwn && showAvatar && (
                                        <div className="w-8 h-8 mr-2 flex-shrink-0">
                                            {participant.avatar ? (
                                                <img
                                                    src={participant.avatar}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                    {getInitials(participant.name)}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!isOwn && !showAvatar && <div className="w-8 mr-2" />}

                                    <div
                                        className={`max-w-[70%] group relative ${
                                            isOwn ? 'order-1' : ''
                                        }`}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setSelectedMessage(message);
                                        }}
                                    >
                                        {/* Reply Preview */}
                                        {message.replyTo && (
                                            <div className={`px-3 py-2 mb-1 rounded-t-xl text-xs ${
                                                isOwn 
                                                    ? 'bg-cyan-600/50 text-cyan-100' 
                                                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                            }`}>
                                                <p className="font-medium">
                                                    {message.replyTo.senderId === currentUserId ? 'Você' : participant.name}
                                                </p>
                                                <p className="truncate">{message.replyTo.content}</p>
                                            </div>
                                        )}

                                        {/* Message Bubble */}
                                        <div className={`px-4 py-2 rounded-2xl shadow-sm ${
                                            isOwn 
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-br-md' 
                                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                                        } ${message.replyTo ? 'rounded-t-none' : ''}`}>
                                            {/* Image Message */}
                                            {message.type === 'image' && message.imageUrl && (
                                                <img
                                                    src={message.imageUrl}
                                                    alt=""
                                                    className="rounded-lg max-w-full mb-2 cursor-pointer"
                                                />
                                            )}

                                            {/* File Message */}
                                            {message.type === 'file' && (
                                                <div className={`flex items-center gap-3 p-2 rounded-lg mb-2 ${
                                                    isOwn ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                                                }`}>
                                                    <File className="w-8 h-8" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{message.fileName}</p>
                                                        <p className="text-xs opacity-70">
                                                            {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
                                                        </p>
                                                    </div>
                                                    <button className="p-1">
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Audio Message */}
                                            {message.type === 'audio' && (
                                                <div className="flex items-center gap-3 min-w-[200px]">
                                                    <button className="p-2 bg-white/20 rounded-full">
                                                        <Mic className="w-4 h-4" />
                                                    </button>
                                                    <div className="flex-1 h-1 bg-white/30 rounded-full">
                                                        <div className="w-1/3 h-full bg-white rounded-full" />
                                                    </div>
                                                    <span className="text-xs">
                                                        {message.audioDuration ? `${Math.floor(message.audioDuration / 60)}:${(message.audioDuration % 60).toString().padStart(2, '0')}` : '0:00'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Text Content */}
                                            {message.content && (
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            )}

                                            {/* Time & Status */}
                                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                                                isOwn ? 'text-cyan-100' : 'text-gray-400'
                                            }`}>
                                                {message.starred && <Star className="w-3 h-3 fill-current" />}
                                                <span className="text-xs">{formatTime(new Date(message.createdAt))}</span>
                                                {isOwn && (
                                                    message.read 
                                                        ? <CheckCheck className="w-4 h-4 text-cyan-200" />
                                                        : <Check className="w-4 h-4" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Quick Actions (on hover) */}
                                        <div className={`absolute top-0 ${isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                            <button 
                                                onClick={() => setReplyingTo(message)}
                                                className="p-1 bg-white dark:bg-gray-700 rounded-full shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                                            >
                                                <Reply className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Reply className="w-4 h-4 text-cyan-500" />
                                <div>
                                    <p className="text-xs font-medium text-cyan-600">
                                        Respondendo a {replyingTo.senderId === currentUserId ? 'você' : participant.name}
                                    </p>
                                    <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                        {replyingTo.content}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                    {/* Attach Button */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <Paperclip className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                            {showAttachMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                >
                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 w-full"
                                    >
                                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <span className="text-sm font-medium">Imagem</span>
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 w-full"
                                    >
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <File className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-medium">Documento</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 w-full">
                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                                            <MapPin className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <span className="text-sm font-medium">Localização</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Hidden File Inputs */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'file')}
                    />
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'image')}
                    />

                    {/* Message Input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Digite sua mensagem..."
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Emoji Button */}
                    <div className="relative">
                        <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            <Smile className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                            {showEmojiPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
                                >
                                    <div className="grid grid-cols-6 gap-1">
                                        {emojis.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => {
                                                    setNewMessage(prev => prev + emoji);
                                                    setShowEmojiPicker(false);
                                                }}
                                                className="w-8 h-8 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Send/Record Button */}
                    {newMessage.trim() ? (
                        <button
                            onClick={handleSend}
                            className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:opacity-90"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsRecording(!isRecording)}
                            className={`p-3 rounded-xl transition-colors ${
                                isRecording 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            </div>

            {/* Message Context Menu */}
            <AnimatePresence>
                {selectedMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                        onClick={() => setSelectedMessage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {[
                                { icon: Reply, label: 'Responder', action: () => { setReplyingTo(selectedMessage); setSelectedMessage(null); } },
                                { icon: Copy, label: 'Copiar', action: () => { navigator.clipboard.writeText(selectedMessage.content); setSelectedMessage(null); } },
                                { icon: Forward, label: 'Encaminhar', action: () => setSelectedMessage(null) },
                                { icon: Star, label: selectedMessage.starred ? 'Remover estrela' : 'Favoritar', action: () => setSelectedMessage(null) },
                                { icon: Trash2, label: 'Apagar', action: () => setSelectedMessage(null), danger: true }
                            ].map((item, i) => (
                                <button
                                    key={i}
                                    onClick={item.action}
                                    className={`flex items-center gap-3 px-4 py-3 w-full hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                        item.danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ChatRoom;
