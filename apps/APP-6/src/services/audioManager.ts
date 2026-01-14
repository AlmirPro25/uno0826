/**
 * Audio Manager - Gerenciador Global de Áudio
 * Controla todas as reproduções de áudio do sistema
 */

class AudioManager {
  private static instance: AudioManager;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying: boolean = false;
  private currentMessageId: string | null = null;

  private constructor() {
    // Parar áudio antes de sair da página
    window.addEventListener('beforeunload', () => {
      this.stopAll();
    });
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Para toda reprodução de áudio
   */
  stopAll(): void {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.isPlaying = false;
    this.currentMessageId = null;
  }

  /**
   * Inicia reprodução de áudio
   */
  play(
    utterance: SpeechSynthesisUtterance,
    messageId: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: () => void
  ): void {
    // Se já está tocando, para primeiro
    this.stopAll();

    this.currentUtterance = utterance;
    this.currentMessageId = messageId;
    this.isPlaying = true;

    // Event handlers
    utterance.onstart = () => {
      this.isPlaying = true;
      onStart?.();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      this.currentMessageId = null;
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      this.isPlaying = false;
      this.currentUtterance = null;
      this.currentMessageId = null;
      onError?.();
    };

    // Iniciar reprodução
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Para reprodução de uma mensagem específica
   */
  stop(messageId: string): void {
    if (this.currentMessageId === messageId) {
      this.stopAll();
    }
  }

  /**
   * Verifica se uma mensagem específica está tocando
   */
  isPlayingMessage(messageId: string): boolean {
    return this.isPlaying && this.currentMessageId === messageId;
  }

  /**
   * Verifica se há algum áudio tocando
   */
  isAnyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Obtém o ID da mensagem atual
   */
  getCurrentMessageId(): string | null {
    return this.currentMessageId;
  }
}

// Exportar instância singleton
export const audioManager = AudioManager.getInstance();
