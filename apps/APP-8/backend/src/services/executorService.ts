import { isExecutorConnected, sendCommandToExecutor } from '../websocket';

interface ExecutorCommand {
  action: string;
  params?: Record<string, any>;
}

interface ExecutorResponse {
  status: string;
  [key: string]: any;
}

/**
 * Serviço de comunicação com o Gemini Executor (Python)
 * Usa o WebSocket Server do backend
 */
export class ExecutorService {
  /**
   * Verifica se está conectado
   */
  get connected(): boolean {
    return isExecutorConnected();
  }



  /**
   * Envia comando ao Executor via WebSocket Server
   */
  async sendCommand(command: ExecutorCommand): Promise<ExecutorResponse> {
    if (!this.connected) {
      throw new Error('Executor não está conectado');
    }

    return await sendCommandToExecutor(command) as ExecutorResponse;
  }

  /**
   * Move o mouse
   */
  async moveMouse(x: number, y: number, duration: number = 0.5): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'move',
      params: { x, y, duration },
    });
  }

  /**
   * Clica o mouse
   */
  async click(button: 'left' | 'right' | 'middle' = 'left', x?: number, y?: number): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'click',
      params: { button, x, y },
    });
  }

  /**
   * Digita texto
   */
  async type(text: string): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'type',
      params: { text },
    });
  }

  /**
   * Pressiona tecla
   */
  async press(key: string, presses: number = 1): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'press',
      params: { key, presses },
    });
  }

  /**
   * Executa atalho de teclado
   */
  async hotkey(...keys: string[]): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'hotkey',
      params: { keys },
    });
  }

  /**
   * Captura screenshot
   */
  async screenshot(filename?: string, region?: [number, number, number, number]): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'screenshot',
      params: { filename, region },
    });
  }

  /**
   * Rola a página
   */
  async scroll(amount: number, x?: number, y?: number): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'scroll',
      params: { amount, x, y },
    });
  }

  /**
   * Arrasta o mouse
   */
  async drag(x: number, y: number, duration: number = 0.5, button: 'left' | 'right' = 'left'): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'drag',
      params: { x, y, duration, button },
    });
  }

  /**
   * Obtém informações da tela
   */
  async getScreenInfo(): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'screen_info',
    });
  }

  /**
   * Pressiona botão do mouse (sem soltar)
   */
  async mouseDown(button: 'left' | 'right' | 'middle' = 'left', x?: number, y?: number): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'mouse_down',
      params: { button, x, y },
    });
  }

  /**
   * Solta botão do mouse
   */
  async mouseUp(button: 'left' | 'right' | 'middle' = 'left'): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'mouse_up',
      params: { button },
    });
  }

  /**
   * Move mouse relativamente
   */
  async moveRelative(dx: number, dy: number, duration: number = 0.3): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'move_relative',
      params: { dx, dy, duration },
    });
  }

  /**
   * Duplo clique
   */
  async doubleClick(x?: number, y?: number): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'double_click',
      params: { x, y },
    });
  }

  /**
   * Clique direito
   */
  async rightClick(x?: number, y?: number): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'right_click',
      params: { x, y },
    });
  }

  /**
   * Para o Executor
   */
  async stop(): Promise<ExecutorResponse> {
    return this.sendCommand({
      action: 'stop',
    });
  }

}

// Instância singleton
export const executorService = new ExecutorService();
