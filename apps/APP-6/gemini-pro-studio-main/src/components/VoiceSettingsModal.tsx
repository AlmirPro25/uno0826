import React, { useState, useEffect } from 'react';
import { speechSynthesisService, VoiceConfig } from '../services/speechSynthesisService';
import { SpeechRecognitionService } from '../services/speechRecognitionService';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<VoiceConfig>(speechSynthesisService.getConfig());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pt-BR');
  const [isTesting, setIsTesting] = useState(false);
  const [showOnlyQuality, setShowOnlyQuality] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadVoices();
      const currentConfig = speechSynthesisService.getConfig();
      setConfig(currentConfig);
      setSelectedLanguage(currentConfig.language);
    }
  }, [isOpen]);

  useEffect(() => {
    filterVoices();
  }, [voices, selectedLanguage, showOnlyQuality]);

  const loadVoices = () => {
    const availableVoices = speechSynthesisService.getAvailableVoices();
    setVoices(availableVoices);
  };

  const filterVoices = () => {
    let filtered = voices;

    // Filtrar por idioma
    if (selectedLanguage) {
      const langCode = selectedLanguage.split('-')[0];
      filtered = filtered.filter(voice => voice.lang.startsWith(langCode));
    }

    // Filtrar apenas vozes de qualidade
    if (showOnlyQuality) {
      filtered = filtered.filter(voice => {
        const name = voice.name.toLowerCase();
        return (
          voice.localService ||
          name.includes('google') ||
          name.includes('microsoft') ||
          name.includes('natural') ||
          name.includes('premium') ||
          name.includes('enhanced') ||
          name.includes('neural')
        );
      });
    }

    setFilteredVoices(filtered);
  };

  const handleConfigChange = (key: keyof VoiceConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    speechSynthesisService.setConfig(newConfig);
    
    // Salvar no localStorage
    localStorage.setItem('voiceConfig', JSON.stringify(newConfig));
  };

  const handleVoiceChange = (voiceName: string) => {
    const voice = voices.find(v => v.name === voiceName) || null;
    handleConfigChange('voice', voice);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    handleConfigChange('language', language);
    
    // Selecionar primeira voz do idioma
    const voicesForLang = voices.filter(v => v.lang.startsWith(language.split('-')[0]));
    if (voicesForLang.length > 0) {
      handleConfigChange('voice', voicesForLang[0]);
    }
  };

  const testVoice = () => {
    setIsTesting(true);
    const testText = selectedLanguage.startsWith('pt') 
      ? 'Olá! Esta é uma demonstração da voz selecionada. Como você está hoje?'
      : 'Hello! This is a demonstration of the selected voice. How are you today?';
    
    speechSynthesisService.speak(testText, {
      onEnd: () => setIsTesting(false),
      onError: () => setIsTesting(false)
    });
  };

  const stopTest = () => {
    speechSynthesisService.stop();
    setIsTesting(false);
  };

  const resetToDefaults = () => {
    const defaultConfig: VoiceConfig = {
      voice: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: 'pt-BR'
    };
    setConfig(defaultConfig);
    setSelectedLanguage('pt-BR');
    speechSynthesisService.setConfig(defaultConfig);
    localStorage.removeItem('voiceConfig');
  };

  if (!isOpen) return null;

  const languages = SpeechRecognitionService.getSupportedLanguages();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border-color">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-color flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <i className="fa-solid fa-volume-high text-white text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Configurações de Voz</h2>
              <p className="text-sm text-text-tertiary">Personalize a síntese e reconhecimento de voz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-bg-tertiary text-text-tertiary hover:text-text-primary transition-all"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Idioma */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center gap-2">
              <i className="fa-solid fa-language text-purple-400"></i>
              Idioma
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-color rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Voz */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary flex items-center gap-2">
                <i className="fa-solid fa-microphone-lines text-blue-400"></i>
                Voz
              </label>
              <label className="flex items-center gap-2 text-xs text-text-tertiary cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyQuality}
                  onChange={(e) => setShowOnlyQuality(e.target.checked)}
                  className="rounded"
                />
                Apenas vozes de qualidade
              </label>
            </div>
            <select
              value={config.voice?.name || ''}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-color rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Voz padrão do sistema</option>
              {filteredVoices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.localService ? '(Local)' : '(Online)'}
                </option>
              ))}
            </select>
            {filteredVoices.length === 0 && (
              <p className="text-xs text-yellow-500">
                Nenhuma voz encontrada para este idioma. Tente desmarcar "Apenas vozes de qualidade".
              </p>
            )}
          </div>

          {/* Velocidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-gauge text-green-400"></i>
                Velocidade
              </span>
              <span className="text-purple-400 font-mono">{config.rate.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.rate}
              onChange={(e) => handleConfigChange('rate', parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Lento (0.5x)</span>
              <span>Normal (1.0x)</span>
              <span>Rápido (2.0x)</span>
            </div>
          </div>

          {/* Tom */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-music text-pink-400"></i>
                Tom
              </span>
              <span className="text-purple-400 font-mono">{config.pitch.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.pitch}
              onChange={(e) => handleConfigChange('pitch', parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Grave (0.5)</span>
              <span>Normal (1.0)</span>
              <span>Agudo (2.0)</span>
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-volume-up text-orange-400"></i>
                Volume
              </span>
              <span className="text-purple-400 font-mono">{Math.round(config.volume * 100)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.volume}
              onChange={(e) => handleConfigChange('volume', parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-text-tertiary">
              <span>Mudo (0%)</span>
              <span>Médio (50%)</span>
              <span>Máximo (100%)</span>
            </div>
          </div>

          {/* Informações */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <i className="fa-solid fa-circle-info text-blue-400 mt-0.5"></i>
              <div className="text-sm text-text-secondary space-y-1">
                <p><strong className="text-text-primary">Dica:</strong> As vozes "Google" e "Microsoft" geralmente oferecem a melhor qualidade.</p>
                <p>Vozes locais funcionam offline, enquanto vozes online requerem conexão com a internet.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-color flex items-center justify-between gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 rounded-xl text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-all text-sm font-medium"
          >
            <i className="fa-solid fa-rotate-left mr-2"></i>
            Restaurar Padrões
          </button>
          <div className="flex gap-3">
            <button
              onClick={isTesting ? stopTest : testVoice}
              disabled={!config.voice && filteredVoices.length === 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTesting ? (
                <>
                  <i className="fa-solid fa-stop"></i>
                  Parar Teste
                </>
              ) : (
                <>
                  <i className="fa-solid fa-play"></i>
                  Testar Voz
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium transition-all"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
