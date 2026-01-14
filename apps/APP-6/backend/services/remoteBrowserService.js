/**
 * 🖥️ REMOTE BROWSER SERVICE
 * Navegador remoto interativo com Playwright
 * Captura frames e transmite para o frontend via Socket.IO
 */

import { chromium } from 'playwright';

class RemoteBrowserService {
  constructor() {
    this.sessions = new Map(); // sessionId -> { browser, page, viewport, streaming }
  }

  /**
   * Criar sessão de navegador remoto
   */
  async createSession(sessionId, options = {}) {
    try {
      console.log(`🖥️ Criando sessão remota: ${sessionId}`);

      const viewport = options.viewport || { width: 1366, height: 768 };
      
      // Lançar navegador
      const browser = await chromium.launch({
        headless: options.headless !== false, // headless por padrão
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      // Criar contexto
      const context = await browser.newContext({
        viewport,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      // Criar página
      const page = await context.newPage();

      // Navegar para URL inicial
      const initialUrl = options.url || 'https://www.google.com';
      await page.goto(initialUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // Salvar sessão
      this.sessions.set(sessionId, {
        browser,
        context,
        page,
        viewport,
        streaming: false,
        frameInterval: null,
        socket: null
      });

      console.log(`✅ Sessão criada: ${sessionId}`);

      return {
        success: true,
        sessionId,
        viewport,
        url: page.url()
      };

    } catch (error) {
      console.error(`❌ Erro ao criar sessão ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Iniciar streaming de frames
   */
  startStreaming(sessionId, socket, fps = 10) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    if (session.streaming) {
      console.log(`⚠️ Streaming já ativo para ${sessionId}`);
      return;
    }

    console.log(`📹 Iniciando streaming: ${sessionId} (${fps} fps)`);

    session.socket = socket;
    session.streaming = true;

    const interval = 1000 / fps; // ms entre frames

    // Loop de captura
    const captureLoop = async () => {
      if (!session.streaming) return;

      try {
        // Capturar screenshot
        const screenshot = await session.page.screenshot({
          type: 'jpeg',
          quality: 60,
          fullPage: false
        });

        // Enviar frame para o cliente
        if (session.socket && session.socket.connected) {
          session.socket.emit('browser:frame', screenshot);
        }

        // Agendar próximo frame
        session.frameTimeout = setTimeout(captureLoop, interval);

      } catch (error) {
        console.error(`❌ Erro ao capturar frame ${sessionId}:`, error);
        // Continua tentando
        session.frameTimeout = setTimeout(captureLoop, interval);
      }
    };

    // Iniciar loop
    captureLoop();

    // Enviar metadados iniciais
    this.sendMetadata(sessionId);
  }

  /**
   * Parar streaming
   */
  stopStreaming(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`⏹️ Parando streaming: ${sessionId}`);

    session.streaming = false;
    if (session.frameTimeout) {
      clearTimeout(session.frameTimeout);
      session.frameTimeout = null;
    }
  }

  /**
   * Enviar metadados da sessão
   */
  sendMetadata(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.socket) return;

    session.socket.emit('browser:metadata', {
      viewport: session.viewport,
      url: session.page.url(),
      title: session.page.title()
    });
  }

  /**
   * Processar evento de input do cliente
   */
  async handleInput(sessionId, inputEvent) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    const { page } = session;

    try {
      if (inputEvent.inputType === 'mouse') {
        const x = Math.round(inputEvent.x);
        const y = Math.round(inputEvent.y);

        switch (inputEvent.event) {
          case 'move':
            await page.mouse.move(x, y);
            break;

          case 'down':
            await page.mouse.down({ button: inputEvent.button || 'left' });
            break;

          case 'up':
            await page.mouse.up({ button: inputEvent.button || 'left' });
            break;

          case 'click':
            await page.mouse.click(x, y, { button: inputEvent.button || 'left' });
            // Atualizar metadados após clique (pode ter mudado de página)
            setTimeout(() => this.sendMetadata(sessionId), 500);
            break;

          case 'dblclick':
            await page.mouse.dblclick(x, y);
            setTimeout(() => this.sendMetadata(sessionId), 500);
            break;

          case 'wheel':
            await page.mouse.wheel(inputEvent.deltaX || 0, inputEvent.deltaY || 0);
            break;
        }

      } else if (inputEvent.inputType === 'keyboard') {
        switch (inputEvent.event) {
          case 'type':
            await page.keyboard.type(inputEvent.text, { delay: inputEvent.delay || 5 });
            break;

          case 'press':
            await page.keyboard.press(inputEvent.key);
            break;

          case 'down':
            await page.keyboard.down(inputEvent.key);
            break;

          case 'up':
            await page.keyboard.up(inputEvent.key);
            break;
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao processar input ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Navegar para URL
   */
  async navigate(sessionId, url) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    console.log(`🌐 Navegando para: ${url}`);

    try {
      await session.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      this.sendMetadata(sessionId);

      return {
        success: true,
        url: session.page.url(),
        title: await session.page.title()
      };

    } catch (error) {
      console.error(`❌ Erro ao navegar ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Executar JavaScript na página
   */
  async evaluate(sessionId, script) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    try {
      const result = await session.page.evaluate(script);
      return result;
    } catch (error) {
      console.error(`❌ Erro ao executar script ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Fechar sessão
   */
  async closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    console.log(`🔒 Fechando sessão: ${sessionId}`);

    // Parar streaming
    this.stopStreaming(sessionId);

    // Fechar navegador
    try {
      await session.browser.close();
    } catch (error) {
      console.error(`❌ Erro ao fechar navegador ${sessionId}:`, error);
    }

    // Remover sessão
    this.sessions.delete(sessionId);

    console.log(`✅ Sessão fechada: ${sessionId}`);
  }

  /**
   * Obter informações da sessão
   */
  getSessionInfo(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      sessionId,
      viewport: session.viewport,
      streaming: session.streaming,
      url: session.page.url()
    };
  }

  /**
   * Listar todas as sessões
   */
  listSessions() {
    return Array.from(this.sessions.keys()).map(id => this.getSessionInfo(id));
  }
}

// Instância singleton
export const remoteBrowserService = new RemoteBrowserService();

export default remoteBrowserService;
