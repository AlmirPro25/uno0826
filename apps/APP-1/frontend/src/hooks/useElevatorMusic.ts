import { useRef, useCallback, useEffect, useState } from 'react'

// URLs de músicas lofi/elevator royalty-free (Pixabay License - free for commercial use)
const ELEVATOR_TRACKS = [
  'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3', // Lofi study
  'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', // Relaxing
]

export function useElevatorMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Inicializa o áudio uma vez
  useEffect(() => {
    const audio = new Audio()
    audio.loop = true
    audio.volume = 0.25
    audio.preload = 'auto'
    audio.src = ELEVATOR_TRACKS[Math.floor(Math.random() * ELEVATOR_TRACKS.length)]
    audioRef.current = audio
    
    // Preload
    audio.load()
    
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const play = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isPlaying) return
    
    console.log('🎵 Attempting to play music...')
    audio.volume = 0
    
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log('🎵 Music started!')
        setIsPlaying(true)
        // Fade in
        let vol = 0
        const fadeIn = setInterval(() => {
          vol += 0.03
          if (audio) {
            audio.volume = Math.min(vol, isMuted ? 0 : 0.25)
          }
          if (vol >= 0.25) clearInterval(fadeIn)
        }, 80)
      }).catch((err) => {
        console.log('🎵 Autoplay blocked:', err.message)
        // Tenta novamente com user gesture
      })
    }
  }, [isPlaying, isMuted])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    
    // Fade out
    let vol = audio.volume
    const fadeOut = setInterval(() => {
      vol -= 0.03
      if (audio) {
        audio.volume = Math.max(vol, 0)
      }
      if (vol <= 0) {
        clearInterval(fadeOut)
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
      }
    }, 40)
  }, [])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    
    if (isMuted) {
      audio.volume = 0.25
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }, [isMuted])

  return { play, stop, toggleMute, isPlaying, isMuted }
}
