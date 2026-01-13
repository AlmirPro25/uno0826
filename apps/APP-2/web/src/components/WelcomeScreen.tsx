import { useState } from 'react'
import { Zap, Shield, Users, Globe, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Welcome Screen - Onboarding para novos usuários
// ============================================================================

interface WelcomeScreenProps {
  onComplete: () => void
}

const slides = [
  {
    icon: Zap,
    title: 'Bem-vindo ao Nexus',
    description: 'Uma rede social P2P descentralizada. Seus dados são seus, sem servidores centrais.',
    color: 'from-cyan-400 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Privacidade Total',
    description: 'Criptografia de ponta a ponta em todas as comunicações. Sua identidade é protegida por chaves Ed25519.',
    color: 'from-emerald-400 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Conexões Diretas',
    description: 'Conecte-se diretamente com outros peers. Chamadas de voz e vídeo sem intermediários.',
    color: 'from-purple-400 to-pink-500',
  },
  {
    icon: Globe,
    title: 'Mesh Soberana',
    description: 'Faça parte de uma rede resistente à censura. Comunidades descentralizadas e livres.',
    color: 'from-yellow-400 to-orange-500',
  },
]

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [nickname, setNickname] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  const isLastSlide = currentSlide === slides.length - 1
  const showSetup = currentSlide === slides.length

  const handleNext = () => {
    if (isLastSlide) {
      setCurrentSlide(slides.length) // Go to setup
    } else {
      setCurrentSlide(prev => prev + 1)
    }
  }

  const handleSetup = async () => {
    setIsSettingUp(true)
    
    // Save nickname
    if (nickname.trim()) {
      localStorage.setItem('nexus_nickname', nickname.trim())
    }
    
    // Mark onboarding complete
    localStorage.setItem('nexus_onboarding_complete', 'true')
    
    // Simulate setup
    await new Promise(r => setTimeout(r, 1500))
    
    setSetupComplete(true)
    await new Promise(r => setTimeout(r, 1000))
    
    onComplete()
  }

  // Setup screen
  if (showSetup) {
    return (
      <div className="fixed inset-0 z-[200] bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          {setupComplete ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center justify-center">
                <Check size={40} className="text-black" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Tudo pronto!</h2>
              <p className="text-gray-400">Entrando na mesh...</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center">
                <Zap size={36} className="text-black" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Configure seu perfil</h2>
              <p className="text-gray-400 mb-8">Como você quer ser chamado na mesh?</p>

              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Seu apelido (opcional)"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 mb-6"
                maxLength={20}
              />

              <button
                onClick={handleSetup}
                disabled={isSettingUp}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold text-black transition-all flex items-center justify-center gap-2",
                  isSettingUp
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-cyan-400 to-purple-500 hover:opacity-90"
                )}
              >
                {isSettingUp ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    Entrar na Mesh
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <button
                onClick={handleSetup}
                className="mt-4 text-sm text-gray-500 hover:text-gray-300"
              >
                Pular configuração
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  // Slides
  const slide = slides[currentSlide]
  const Icon = slide.icon

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#0a0a0f] flex flex-col">
      {/* Skip button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setCurrentSlide(slides.length)}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Pular
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          {/* Icon */}
          <div className={cn(
            "w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center",
            `bg-gradient-to-br ${slide.color}`
          )}>
            <Icon size={48} className="text-black" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-white mb-4">{slide.title}</h1>

          {/* Description */}
          <p className="text-gray-400 text-lg leading-relaxed">{slide.description}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentSlide
                  ? "w-8 bg-gradient-to-r from-cyan-400 to-purple-500"
                  : "bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {isLastSlide ? 'Começar' : 'Próximo'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}
