/**
 * Speech Synthesis Service
 * Usa a Web Speech API nativa do navegador para síntese de voz (Text-to-Speech)
 */

export interface VoiceConfig {
  voice: SpeechSynthesisVoice | null;
  rate: number;      // 0.1 a 10 (padrão: 1)
  pitch: number;     // 0 a 2 (padrão: 1)
  volume: number;    // 0 a 1 (padrão: 1)
  language: string;
}

export interface SpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: string) => void;
  onBoundary?: (charIndex: number) => void;
}

export class SpeechSynthesisService {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private config: VoiceConfig;
  private availableVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    // Configuração padrão
    this.config = {
      voice: null,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: 'pt-BR'
    };

    // Carregar vozes disponíveis
    this.loadVoices();
    
    // Algumas vezes as vozes demoram para carregar
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  /**
   * Verifica se o navegador suporta Speech Synthesis
   */
  static isSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  /**
   * Carrega as vozes disponíveis
   */
  private loadVoices(): void {
    this.availableVoices = this.synthesis.getVoices();
    
    // Se não tem voz configurada, tenta selecionar uma voz em português
    if (!this.config.voice && this.availableVoices.length > 0) {
      const portugueseVoice = this.availableVoices.find(
        voice => voice.lang.startsWith('pt')
      );
      this.config.voice = portugueseVoice || this.availableVoices[0];
    }
  }

  /**
   * Obtém todas as vozes disponíveis
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0) {
      this.loadVoices();
    }
    return this.availableVoices;
  }

  /**
   * Obtém vozes filtradas por idioma
   */
  getVoicesByLanguage(language: string): SpeechSynthesisVoice[] {
    return this.getAvailableVoices().filter(
      voice => voice.lang.startsWith(language.split('-')[0])
    );
  }

  /**
   * Obtém as melhores vozes (mais naturais e de alta qualidade)
   */
  getBestVoices(): SpeechSynthesisVoice[] {
    const voices = this.getAvailableVoices();
    
    // Prioriza vozes locais e de alta qualidade
    const qualityVoices = voices.filter(voice => {
      const name = voice.name.toLowerCase();
      const isLocal = voice.localService;
      
      // Vozes conhecidas de alta qualidade
      const isHighQuality = 
        name.includes('google') ||
        name.includes('microsoft') ||
        name.includes('natural') ||
        name.includes('premium') ||
        name.includes('enhanced') ||
        name.includes('neural');
      
      return isLocal || isHighQuality;
    });

    return qualityVoices.length > 0 ? qualityVoices : voices;
  }

  /**
   * Obtém vozes recomendadas por idioma
   */
  getRecommendedVoices(language: string = 'pt-BR'): SpeechSynthesisVoice[] {
    const langCode = language.split('-')[0];
    const voices = this.getVoicesByLanguage(langCode);
    
    // Filtra vozes de alta qualidade
    const highQuality = voices.filter(voice => {
      const name = voice.name.toLowerCase();
      return (
        name.includes('google') ||
        name.includes('microsoft') ||
        name.includes('natural') ||
        name.includes('premium') ||
        name.includes('enhanced') ||
        name.includes('neural')
      );
    });

    return highQuality.length > 0 ? highQuality : voices;
  }

  /**
   * Define a configuração de voz
   */
  setConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtém a configuração atual
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Fala o texto fornecido
   */
  speak(text: string, options: SpeechOptions = {}): void {
    // Cancela qualquer fala em andamento
    this.stop();

    if (!text.trim()) {
      console.warn('Texto vazio fornecido para síntese de voz');
      return;
    }

    // Cria nova utterance
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Aplica configurações
    if (this.config.voice) {
      this.currentUtterance.voice = this.config.voice;
    }
    this.currentUtterance.rate = this.config.rate;
    this.currentUtterance.pitch = this.config.pitch;
    this.currentUtterance.volume = this.config.volume;
    this.currentUtterance.lang = this.config.language;

    // Event handlers
    if (options.onStart) {
      this.currentUtterance.onstart = options.onStart;
    }

    if (options.onEnd) {
      this.currentUtterance.onend = options.onEnd;
    }

    if (options.onPause) {
      this.currentUtterance.onpause = options.onPause;
    }

    if (options.onResume) {
      this.currentUtterance.onresume = options.onResume;
    }

    if (options.onError) {
      this.currentUtterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        options.onError?.('Erro na síntese de voz');
      };
    }

    if (options.onBoundary) {
      this.currentUtterance.onboundary = (event) => {
        options.onBoundary?.(event.charIndex);
      };
    }

    // Inicia a fala
    try {
      this.synthesis.speak(this.currentUtterance);
    } catch (error) {
      console.error('Erro ao iniciar síntese de voz:', error);
      options.onError?.('Falha ao iniciar síntese de voz');
    }
  }

  /**
   * Pausa a fala
   */
  pause(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume a fala
   */
  resume(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Para a fala
   */
  stop(): void {
    if (this.synthesis.speaking || this.synthesis.pending) {
      this.synthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Verifica se está falando
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * Verifica se está pausado
   */
  isPaused(): boolean {
    return this.synthesis.paused;
  }

  /**
   * Verifica se há fala pendente
   */
  isPending(): boolean {
    return this.synthesis.pending;
  }
}

// Instância singleton
export const speechSynthesisService = new SpeechSynthesisService();
