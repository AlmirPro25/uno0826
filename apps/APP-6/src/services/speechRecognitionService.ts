/**
 * Speech Recognition Service
 * Usa a Web Speech API nativa do navegador para reconhecimento de voz
 */

export interface SpeechRecognitionConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface RecognitionResult {
  transcript: string;
  isFinal: boolean;
  confidence: number;
}

export class SpeechRecognitionService {
  private recognition: any = null;
  private isRecording = false;
  private onResultCallback: ((result: RecognitionResult) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;

  constructor() {
    // Verifica suporte do navegador
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition não é suportado neste navegador');
      return;
    }

    this.recognition = new SpeechRecognition();
  }

  /**
   * Verifica se o navegador suporta Speech Recognition
   */
  static isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  /**
   * Obtém lista de idiomas suportados (principais)
   */
  static getSupportedLanguages(): { code: string; name: string }[] {
    return [
      { code: 'pt-BR', name: 'Português (Brasil)' },
      { code: 'pt-PT', name: 'Português (Portugal)' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'es-ES', name: 'Español (España)' },
      { code: 'es-MX', name: 'Español (México)' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'it-IT', name: 'Italiano' },
      { code: 'ja-JP', name: '日本語' },
      { code: 'ko-KR', name: '한국어' },
      { code: 'zh-CN', name: '中文 (简体)' },
      { code: 'zh-TW', name: '中文 (繁體)' },
      { code: 'ru-RU', name: 'Русский' },
      { code: 'ar-SA', name: 'العربية' },
    ];
  }

  /**
   * Inicia a gravação de áudio
   */
  async startRecording(
    config: SpeechRecognitionConfig = {},
    onResult: (result: RecognitionResult) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech Recognition não está disponível');
    }

    if (this.isRecording) {
      console.warn('Já está gravando');
      return;
    }

    // Configurações
    this.recognition.lang = config.language || 'pt-BR';
    this.recognition.continuous = config.continuous !== undefined ? config.continuous : true;
    this.recognition.interimResults = config.interimResults !== undefined ? config.interimResults : true;
    this.recognition.maxAlternatives = config.maxAlternatives || 1;

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onEndCallback = onEnd || null;

    // Event handlers
    this.recognition.onresult = (event: any) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const transcript = lastResult[0].transcript;
      const isFinal = lastResult.isFinal;
      const confidence = lastResult[0].confidence;

      if (this.onResultCallback) {
        this.onResultCallback({
          transcript,
          isFinal,
          confidence
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'Erro no reconhecimento de voz';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Nenhuma fala detectada';
          break;
        case 'audio-capture':
          errorMessage = 'Erro ao capturar áudio';
          break;
        case 'not-allowed':
          errorMessage = 'Permissão de microfone negada';
          break;
        case 'network':
          errorMessage = 'Erro de rede';
          break;
        case 'aborted':
          errorMessage = 'Gravação abortada';
          break;
      }

      if (this.onErrorCallback) {
        this.onErrorCallback(errorMessage);
      }
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    try {
      this.recognition.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Erro ao iniciar reconhecimento:', error);
      throw new Error('Falha ao iniciar reconhecimento de voz');
    }
  }

  /**
   * Para a gravação
   */
  stopRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
  }

  /**
   * Aborta a gravação imediatamente
   */
  abortRecording(): void {
    if (this.recognition && this.isRecording) {
      this.recognition.abort();
      this.isRecording = false;
    }
  }

  /**
   * Verifica se está gravando
   */
  getIsRecording(): boolean {
    return this.isRecording;
  }
}

// Instância singleton
export const speechRecognitionService = new SpeechRecognitionService();
