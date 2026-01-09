'use client'

import { useState } from 'react'
import { useUserStore, Gender, Preference, CallMode } from '@/store/useUserStore'

export function OnboardingScreen() {
  const { setProfile } = useUserStore()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState<Gender | null>(null)
  const [preference, setPreference] = useState<Preference | null>(null)
  const [callMode, setCallMode] = useState<CallMode>('random')

  const canSubmit = name.length >= 2 && age && parseInt(age) >= 18 && gender && preference

  const handleSubmit = () => {
    if (!canSubmit) return
    setProfile({
      name,
      age: parseInt(age),
      gender: gender!,
      preference: preference!,
      callMode,
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      {/* Scrollable content with custom scrollbar */}
      <div className="relative h-screen overflow-y-auto scrollbar-thin">
        <div className="max-w-md mx-auto px-5 py-10 pb-36">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-5">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-cyan-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-[#0a0a0f] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Bem-vindo ao <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">VOX</span>
            </h1>
            <p className="text-gray-400">Configure seu perfil em segundos</p>
          </div>

          {/* Form Cards */}
          <div className="space-y-4">
            {/* Nome */}
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold">1</span>
                Como te chamam?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome ou apelido"
                className="w-full px-4 py-3.5 bg-black/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                maxLength={20}
              />
            </div>

            {/* Idade */}
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">2</span>
                Sua idade
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="18"
                min={18}
                max={99}
                className="w-full px-4 py-3.5 bg-black/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              {age && parseInt(age) < 18 && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Voce precisa ter 18+
                </p>
              )}
            </div>

            {/* Genero */}
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-xs font-bold">3</span>
                Voce e...
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'male', emoji: 'M', sublabel: 'Homem' },
                  { value: 'female', emoji: 'F', sublabel: 'Mulher' },
                  { value: 'other', emoji: '+', sublabel: 'Outro' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setGender(opt.value as Gender)}
                    className={`py-4 px-2 rounded-xl text-center transition-all duration-200 ${
                      gender === opt.value
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
                        : 'bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white border border-gray-700/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1 font-bold">{opt.emoji}</span>
                    <span className="text-xs font-medium">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferencia */}
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-bold">4</span>
                Quer conversar com...
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'male', emoji: 'M', sublabel: 'Homens' },
                  { value: 'female', emoji: 'F', sublabel: 'Mulheres' },
                  { value: 'any', emoji: '*', sublabel: 'Todos' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPreference(opt.value as Preference)}
                    className={`py-4 px-2 rounded-xl text-center transition-all duration-200 ${
                      preference === opt.value
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-[1.02]'
                        : 'bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white border border-gray-700/50'
                    }`}
                  >
                    <span className="text-2xl block mb-1 font-bold">{opt.emoji}</span>
                    <span className="text-xs font-medium">{opt.sublabel}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modo de chamada */}
            <div className="group bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-5 border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 backdrop-blur-sm">
              <label className="flex items-center gap-2 text-white font-semibold mb-3">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-xs font-bold">5</span>
                Modo de conexao
              </label>
              <div className="space-y-2">
                {[
                  { value: 'random', icon: '?', label: 'Aleatorio', desc: '1 pessoa por vez' },
                  { value: 'duo', icon: '2', label: 'Duo', desc: 'Voce + amigo vs 2' },
                  { value: 'group', icon: '4', label: 'Grupo', desc: 'Ate 4 pessoas' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setCallMode(opt.value as CallMode)}
                    className={`w-full py-3.5 px-4 rounded-xl text-left transition-all duration-200 flex items-center gap-3 ${
                      callMode === opt.value
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/50'
                        : 'bg-black/30 text-gray-400 hover:bg-black/50 hover:text-white border border-gray-700/50'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-lg font-bold">{opt.icon}</span>
                    <div className="flex-1">
                      <span className="font-medium block">{opt.label}</span>
                      <span className="text-xs opacity-60">{opt.desc}</span>
                    </div>
                    {callMode === opt.value && (
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent pt-10">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              canSubmit
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-800/80 text-gray-500 cursor-not-allowed'
            }`}
          >
            {canSubmit ? (
              <>
                Comecar
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            ) : (
              'Preencha todos os campos'
            )}
          </button>
          <p className="text-center text-gray-600 text-xs mt-4">
            Seus dados ficam salvos apenas no seu dispositivo
          </p>
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #3b82f6);
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #22d3ee, #60a5fa);
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #06b6d4 transparent;
        }
      `}</style>
    </div>
  )
}
