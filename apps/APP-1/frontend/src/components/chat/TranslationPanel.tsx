import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNexusStore } from '@/store/useNexusStore'
import { useTheme } from '@/hooks/useTheme'
import { useSound } from '@/hooks/useSound'
import { MediaUpload, MediaType } from './MediaUpload'
import { MediaPreview } from './MediaPreview'

interface MediaFile {
  type: MediaType
  file: File
  preview: string
  duration?: number
}

interface Props {
  onSendMessage?: (message: string) => void
  onSendMedia?: (type: MediaType, data: string, fileName: string) => void
  onTyping?: () => void
}

export function TranslationPanel({ onSendMessage, onSendMedia, onTyping }: Props) {
  const { status, messages, partnerInfo, user, partnerTyping, sessionStats } = useNexusStore()
  const { theme } = useTheme()
  const { playMessage } = useSound()
  const [input, setInput] = useState('')
  const [showMediaUpload, setShowMediaUpload] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessageCount = useRef(messages.length)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (messages.length > prevMessageCount.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.senderId !== user?.anonymousId) playMessage()
    }
    prevMessageCount.current = messages.length
  }, [messages, user?.anonymousId, playMessage])

  const handleSend = () => {
    if (!input.trim() || !onSendMessage) return
    useNexusStore.getState().addMessage({
      id: Date.now().toString(),
      senderId: user?.anonymousId || 'me',
      originalText: input,
      translatedText: input,
      timestamp: new Date(),
      isAiOptimized: false
    })
    onSendMessage(input)
    setInput('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (e.target.value && onTyping) onTyping()
  }

  // Handle paste event for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          const preview = URL.createObjectURL(file)
          setSelectedMedia({ type: 'image', file, preview })
        }
        return
      }
    }
  }, [])

  // Handle media selection
  const handleMediaSelect = useCallback((media: MediaFile) => {
    setSelectedMedia(media)
    setShowMediaUpload(false)
  }, [])

  // Send media
  const handleSendMedia = useCallback(async () => {
    if (!selectedMedia || !onSendMedia) return

    // Convert to base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      onSendMedia(selectedMedia.type, base64, selectedMedia.file.name)
      
      // Add to local messages (cast to any to add media fields)
      const newMessage: any = {
        id: Date.now().toString(),
        senderId: user?.anonymousId || 'me',
        originalText: `[${selectedMedia.type === 'image' ? '📷 Imagem' : selectedMedia.type === 'video' ? '🎬 Vídeo' : '🎤 Áudio'}]`,
        translatedText: '',
        timestamp: new Date(),
        isAiOptimized: false,
        mediaType: selectedMedia.type,
        mediaUrl: selectedMedia.preview
      }
      useNexusStore.getState().addMessage(newMessage)
      
      setSelectedMedia(null)
    }
    reader.readAsDataURL(selectedMedia.file)
  }, [selectedMedia, onSendMedia, user?.anonymousId])

  const formatDuration = () => {
    if (!sessionStats.startTime) return '0:00'
    const diff = Math.floor((Date.now() - sessionStats.startTime.getTime()) / 1000)
    return `${Math.floor(diff / 60)}:${(diff % 60).toString().padStart(2, '0')}`
  }

  const isDark = theme === 'dark'

  return (
    <div className="h-full w-full flex flex-col" style={{ background: isDark ? '#0a0a0a' : '#fff' }}>
      {/* Header */}
      <div className="shrink-0 p-4 border-b" style={{ borderColor: isDark ? '#222' : '#eee' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: isDark ? '#fff' : '#111' }}>Chat</h2>
              <p className="text-xs" style={{ color: isDark ? '#666' : '#888' }}>Mensagens</p>
            </div>
          </div>
          {status === 'connected' && (
            <div className="text-right">
              <p className="text-sm font-mono text-cyan-500">{formatDuration()}</p>
              <p className="text-xs" style={{ color: isDark ? '#666' : '#888' }}>{sessionStats.messageCount} msgs</p>
            </div>
          )}
        </div>
      </div>

      {/* Partner Banner */}
      {status === 'connected' && partnerInfo && (
        <div className="shrink-0 mx-4 mt-3 p-3 rounded-xl" style={{ background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">{partnerInfo.anonymousId?.slice(0, 2)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-green-500 text-sm truncate">{partnerInfo.anonymousId}</p>
              <div className="flex items-center gap-2">
                {partnerInfo.nativeLanguage && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                    Fala {partnerInfo.nativeLanguage?.toUpperCase()}
                  </span>
                )}
                {partnerInfo.commonInterests && partnerInfo.commonInterests.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                    {partnerInfo.commonInterests.length} interesse{partnerInfo.commonInterests.length > 1 ? 's' : ''} em comum
                  </span>
                )}
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {status === 'idle' && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3" style={{ background: isDark ? '#1a1a1a' : '#f5f5f5' }}>
              <svg className="w-8 h-8" style={{ color: isDark ? '#444' : '#999' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: isDark ? '#fff' : '#111' }}>Sem conversa</p>
            <p className="text-sm mt-1" style={{ color: isDark ? '#666' : '#888' }}>Conecte para conversar</p>
          </div>
        )}

        {status === 'searching' && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin mb-3" />
            <p style={{ color: isDark ? '#888' : '#666' }}>Procurando...</p>
          </div>
        )}

        {status === 'connected' && messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="text-4xl mb-3">👋</div>
            <p className="font-medium" style={{ color: isDark ? '#fff' : '#111' }}>Diga olá!</p>
            <p className="text-sm mt-1" style={{ color: isDark ? '#666' : '#888' }}>Comece a conversar</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.anonymousId
          const hasMedia = (msg as any).mediaType && (msg as any).mediaUrl
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMe && (
                  <span className="text-[10px] font-black text-cyan-500 mb-1 ml-1 uppercase tracking-tighter">
                    {msg.senderId}
                  </span>
                )}
                <div className={`
                  rounded-2xl shadow-sm overflow-hidden
                  ${isMe
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-br-none shadow-cyan-500/20'
                    : `${isDark ? 'bg-[#1a1a1a] text-white border border-white/5' : 'bg-gray-100 text-gray-800'} rounded-bl-none`
                  }
                `}>
                  {/* Media content */}
                  {hasMedia && (
                    <div className="max-w-[280px]">
                      {(msg as any).mediaType === 'image' && (
                        <img 
                          src={(msg as any).mediaUrl} 
                          alt="Imagem" 
                          className="w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open((msg as any).mediaUrl, '_blank')}
                        />
                      )}
                      {(msg as any).mediaType === 'video' && (
                        <video 
                          src={(msg as any).mediaUrl} 
                          controls 
                          className="w-full h-auto max-h-64"
                        />
                      )}
                      {(msg as any).mediaType === 'audio' && (
                        <div className="p-3">
                          <audio src={(msg as any).mediaUrl} controls className="w-full h-10" />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Text content */}
                  {!hasMedia && (
                    <div className="px-4 py-3 text-sm leading-relaxed">
                      <p>{msg.originalText}</p>
                      {msg.translatedText && msg.translatedText !== msg.originalText && (
                        <div className={`mt-2 pt-2 border-t ${isMe ? 'border-white/20' : 'border-white/5'} text-[13px] italic opacity-90`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Neural Bridge</span>
                          </div>
                          <p>{msg.translatedText}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 px-1">
                  <span className={`text-[9px] font-medium uppercase ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && (
                    <svg className="w-3 h-3 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {partnerTyping && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: isDark ? '#1a1a1a' : '#f0f0f0' }}>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - fixed at bottom */}
      {status === 'connected' && (
        <div className="shrink-0 p-4 border-t relative" style={{ borderColor: isDark ? '#222' : '#eee' }}>
          {/* Media Upload Panel */}
          {showMediaUpload && (
            <MediaUpload
              onMediaSelect={handleMediaSelect}
              onClose={() => setShowMediaUpload(false)}
              isDark={isDark}
            />
          )}

          {/* Media Preview */}
          {selectedMedia && (
            <MediaPreview
              type={selectedMedia.type}
              preview={selectedMedia.preview}
              onSend={handleSendMedia}
              onCancel={() => setSelectedMedia(null)}
              isDark={isDark}
            />
          )}

          <div className="flex items-center gap-2 bg-transparent">
            {/* Attach button */}
            <button
              onClick={() => setShowMediaUpload(!showMediaUpload)}
              className={`h-[48px] w-[48px] flex items-center justify-center rounded-2xl transition-all ${
                showMediaUpload
                  ? 'bg-cyan-500 text-white'
                  : isDark 
                    ? 'bg-[#161616] text-gray-400 hover:text-white hover:bg-[#222]' 
                    : 'bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>

            <div className="flex-1 relative group">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onPaste={handlePaste}
                placeholder="Escreva ou cole uma imagem..."
                className={`
                  w-full px-5 py-3.5 rounded-2xl text-sm outline-none transition-all
                  ${isDark
                    ? 'bg-[#161616] text-white border border-white/5 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10'
                    : 'bg-gray-50 text-gray-900 border border-gray-200 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5'
                  }
                `}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="group h-[48px] w-[48px] flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-30 transition-all active:scale-90"
            >
              <svg className="w-5 h-5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
