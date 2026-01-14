import React, { useState, useEffect } from 'react';
import { personalityService, PersonalityType, EmotionalTone, PersonalityConfig } from '../services/personalityService';
import { CloseIcon } from './Icons';

interface PersonalitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PersonalitySettings: React.FC<PersonalitySettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<PersonalityConfig>(personalityService.getConfig());

  useEffect(() => {
    if (isOpen) {
      setConfig(personalityService.getConfig());
    }
  }, [isOpen]);

  const handleSave = () => {
    personalityService.saveConfig(config);
    onClose();
  };

  const handleReset = () => {
    if (confirm('Resetar todas as configurações de personalidade?')) {
      personalityService.reset();
      setConfig(personalityService.getConfig());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">⚙️ Configurações de Personalidade</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <CloseIcon className="w-7 h-7" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Tipo de Personalidade */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tipo de Personalidade
            </label>
            <select
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value as PersonalityType })}
              className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={PersonalityType.ADAPTIVE}>🎭 Adaptativa (recomendado)</option>
              <option value={PersonalityType.FRIENDLY}>😊 Amigável</option>
              <option value={PersonalityType.PROFESSIONAL}>💼 Profissional</option>
              <option value={PersonalityType.TECHNICAL}>🔧 Técnica</option>
              <option value={PersonalityType.CREATIVE}>🎨 Criativa</option>
              <option value={PersonalityType.TUTOR}>📚 Tutor</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {config.type === PersonalityType.ADAPTIVE && 'Ajusta automaticamente baseado no contexto'}
              {config.type === PersonalityType.FRIENDLY && 'Casual, empático e acolhedor'}
              {config.type === PersonalityType.PROFESSIONAL && 'Formal, direto e eficiente'}
              {config.type === PersonalityType.TECHNICAL && 'Preciso, detalhado e rigoroso'}
              {config.type === PersonalityType.CREATIVE && 'Inovador, inspirador e original'}
              {config.type === PersonalityType.TUTOR && 'Didático, paciente e encorajador'}
            </p>
          </div>

          {/* Tom Emocional */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Tom Emocional
            </label>
            <select
              value={config.tone}
              onChange={(e) => setConfig({ ...config, tone: e.target.value as EmotionalTone })}
              className="w-full p-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value={EmotionalTone.ENCOURAGING}>💪 Encorajador</option>
              <option value={EmotionalTone.ENTHUSIASTIC}>🎉 Entusiasmado</option>
              <option value={EmotionalTone.CALM}>😌 Calmo</option>
              <option value={EmotionalTone.ANALYTICAL}>🧮 Analítico</option>
              <option value={EmotionalTone.PLAYFUL}>🎮 Divertido</option>
            </select>
          </div>

          {/* Verbosidade */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nível de Detalhe
            </label>
            <div className="flex gap-2">
              {(['concise', 'balanced', 'detailed'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfig({ ...config, verbosity: level })}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    config.verbosity === level
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {level === 'concise' && '📝 Conciso'}
                  {level === 'balanced' && '⚖️ Balanceado'}
                  {level === 'detailed' && '📖 Detalhado'}
                </button>
              ))}
            </div>
          </div>

          {/* Nível de Proatividade */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Proatividade
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setConfig({ ...config, proactiveLevel: level })}
                  className={`flex-1 p-3 rounded-lg border transition-colors ${
                    config.proactiveLevel === level
                      ? 'bg-teal-600 border-teal-500 text-white'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {level === 'low' && '🔇 Baixa'}
                  {level === 'medium' && '🔔 Média'}
                  {level === 'high' && '📢 Alta'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {config.proactiveLevel === 'low' && 'Responde apenas quando perguntado'}
              {config.proactiveLevel === 'medium' && 'Oferece sugestões quando relevante'}
              {config.proactiveLevel === 'high' && 'Sugere melhorias proativamente'}
            </p>
          </div>

          {/* Usar Emojis */}
          <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
            <div>
              <p className="font-semibold text-white">Usar Emojis</p>
              <p className="text-xs text-gray-500">Adiciona emojis às respostas</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, useEmojis: !config.useEmojis })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                config.useEmojis ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  config.useEmojis ? 'transform translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Resetar
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalitySettings;
