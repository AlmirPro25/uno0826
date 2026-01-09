'use client'

import React, { useRef, useState, useEffect } from 'react'
import { MediaType } from './MediaUpload'

interface Props {
  type: MediaType
  preview: string
  onSend: () => void
  onCancel: () => void
  isDark: boolean
}

export function MediaPreview({ type, preview, onSend, onCancel, isDark }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    if (type === 'audio' && audioRef.current) {
      const audio = audioRef.current
      audio.onloadedmetadata = () => setDuration(audio.duration)
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
      audio.onended = () => setIsPlaying(false)
    }
  }, [type])

  const toggleAudio = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl shadow-xl border overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
      style={{ 
        background: isDark ? '#1a1a1a' : '#fff',
        borderColor: isDark ? '#333' : '#e5e5e5'
      }}>
      
      {/* Preview content */}
      <div className="p-3">
        {type === 'image' && (
          <div className="relative rounded-xl overflow-hidden max-h-64">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          </div>
        )}

        {type === 'video' && (
          <div className="relative rounded-xl overflow-hidden max-h-64">
            <video src={preview} controls className="w-full h-full object-contain" />
          </div>
        )}

        {type === 'audio' && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: isDark ? '#222' : '#f5f5f5' }}>
            <button
              onClick={toggleAudio}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="flex-1">
              <div className="h-1 rounded-full overflow-hidden" style={{ background: isDark ? '#333' : '#ddd' }}>
                <div 
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatTime(currentTime)}
                </span>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatTime(duration)}
                </span>
              </div>
            </div>
            <audio ref={audioRef} src={preview} className="hidden" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 p-3 border-t" style={{ borderColor: isDark ? '#333' : '#e5e5e5' }}>
        <button
          onClick={onCancel}
          className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
            isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancelar
        </button>
        <button
          onClick={onSend}
          className="flex-1 py-2.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Enviar
        </button>
      </div>
    </div>
  )
}
