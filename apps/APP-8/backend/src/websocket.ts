import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface ExecutorClient {
  ws: WebSocket;
  id: string;
  connected: boolean;
}

let executorClient: ExecutorClient | null = null;

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/executor-ws'
  });

  console.log('🔌 WebSocket Server iniciado em /executor-ws');

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('📡 Nova conexão WebSocket recebida');

    // Verifica autenticação
    const authHeader = req.headers.authorization;
    const expectedToken = `Bearer ${process.env.EXECUTOR_AUTH_TOKEN}`;

    if (authHeader !== expectedToken) {
      console.log('❌ Autenticação falhou');
      ws.close(1008, 'Unauthorized');
      return;
    }

    // Registra cliente
    executorClient = {
      ws,
      id: Date.now().toString(),
      connected: true
    };

    console.log('✅ Executor conectado!');

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Mensagem do Executor:', message);

        // Processa mensagem de inicialização
        if (message.type === 'init') {
          console.log('🎮 Executor pronto:', message);
          ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Conectado ao Maestro!'
          }));
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
      }
    });

    ws.on('close', () => {
      console.log('⚠️ Executor desconectado');
      if (executorClient?.ws === ws) {
        executorClient = null;
      }
    });

    ws.on('error', (error) => {
      console.error('❌ Erro no WebSocket:', error);
    });
  });

  return wss;
}

export function getExecutorClient(): ExecutorClient | null {
  return executorClient;
}

export function isExecutorConnected(): boolean {
  return executorClient !== null && executorClient.connected;
}

/**
 * Envia comando para o Executor
 */
export function sendCommandToExecutor(command: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!executorClient || !executorClient.connected) {
      reject(new Error('Executor não está conectado'));
      return;
    }

    try {
      // Envia comando
      executorClient.ws.send(JSON.stringify(command));
      console.log('📤 Comando enviado ao Executor:', command);

      // Aguarda resposta (timeout de 30s)
      const timeout = setTimeout(() => {
        reject(new Error('Timeout aguardando resposta do Executor'));
      }, 30000);

      // Handler temporário para resposta
      const responseHandler = (data: Buffer) => {
        try {
          const response = JSON.parse(data.toString());
          clearTimeout(timeout);
          executorClient!.ws.off('message', responseHandler);
          resolve(response);
        } catch (error) {
          // Ignora mensagens que não são respostas
        }
      };

      executorClient.ws.on('message', responseHandler);
    } catch (error) {
      reject(error);
    }
  });
}
