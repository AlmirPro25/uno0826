#!/usr/bin/env node
// 🔧 AI WEAVER LOCAL BRIDGE
// Executor local que permite o SaaS rodar comandos na máquina do usuário

const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

const PORT = process.env.BRIDGE_PORT || 4567;
const ALLOWED_COMMANDS = [
  'npm', 'node', 'npx', 'yarn', 'pnpm',
  'docker', 'docker-compose',
  'git', 'go', 'cargo', 'python', 'pip',
  'ls', 'dir', 'mkdir', 'cat', 'echo'
];

// 🛡️ SAFE HANDS: Comandos que exigem confirmação
const DANGEROUS_COMMANDS = ['rm', 'del', 'rmdir', 'sudo', 'chmod', 'chown'];

class LocalBridge {
  constructor() {
    this.io = new Server(PORT, {
      cors: { origin: '*' }
    });
    this.workingDir = process.cwd();
    this.activeCommands = new Map();
    
    console.log(chalk.cyan('╔════════════════════════════════════════╗'));
    console.log(chalk.cyan('║   🤖 AI WEAVER LOCAL BRIDGE ATIVO     ║'));
    console.log(chalk.cyan('╚════════════════════════════════════════╝'));
    console.log(chalk.green(`\n✅ Escutando na porta ${PORT}`));
    console.log(chalk.yellow(`📁 Diretório de trabalho: ${this.workingDir}\n`));
  }

  start() {
    this.io.on('connection', (socket) => {
      console.log(chalk.blue('🔌 Cliente conectado:', socket.id));

      socket.on('execute_command', (data) => this.handleCommand(socket, data));
      socket.on('file_write', (data, callback) => this.handleFileWrite(data, callback));
      socket.on('file_read', (data, callback) => this.handleFileRead(data, callback));
      socket.on('health_check', (data, callback) => callback({ status: 'ok' }));

      socket.on('disconnect', () => {
        console.log(chalk.gray('🔌 Cliente desconectado:', socket.id));
      });
    });
  }

  async handleCommand(socket, { id, command, cwd, timeout }) {
    console.log(chalk.yellow(`\n🚀 Executando: ${command}`));

    // 🛡️ VALIDAÇÃO DE SEGURANÇA
    const [cmd, ...args] = command.split(' ');
    
    if (DANGEROUS_COMMANDS.includes(cmd)) {
      socket.emit('command_error', {
        id,
        error: `⛔ Comando bloqueado por segurança: ${cmd}\nComandos destrutivos não são permitidos.`
      });
      socket.emit('command_exit', { id, exitCode: 1 });
      return;
    }

    if (!ALLOWED_COMMANDS.includes(cmd)) {
      socket.emit('command_error', {
        id,
        error: `⚠️ Comando não permitido: ${cmd}\nApenas comandos de desenvolvimento são aceitos.`
      });
      socket.emit('command_exit', { id, exitCode: 1 });
      return;
    }

    // 🔒 SANDBOX: Garante que não sai do diretório de trabalho
    const targetDir = path.resolve(this.workingDir, cwd || '.');
    if (!targetDir.startsWith(this.workingDir)) {
      socket.emit('command_error', {
        id,
        error: '⛔ Acesso negado: Tentativa de sair do diretório sandbox.'
      });
      socket.emit('command_exit', { id, exitCode: 1 });
      return;
    }

    // Executa o comando
    const child = spawn(cmd, args, {
      cwd: targetDir,
      shell: true,
      env: { ...process.env }
    });

    this.activeCommands.set(id, child);

    // Stream stdout
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(chalk.gray(output));
      socket.emit('command_output', { id, output });
    });

    // Stream stderr
    child.stderr.on('data', (data) => {
      const error = data.toString();
      console.log(chalk.red(error));
      socket.emit('command_error', { id, error });
    });

    // Fim da execução
    child.on('close', (code) => {
      console.log(chalk.green(`✅ Comando finalizado com código: ${code}\n`));
      socket.emit('command_exit', { id, exitCode: code });
      this.activeCommands.delete(id);
    });

    // Timeout de segurança
    if (timeout) {
      setTimeout(() => {
        if (this.activeCommands.has(id)) {
          child.kill();
          socket.emit('command_error', { id, error: '⏱️ Timeout: Comando excedeu o tempo limite.' });
        }
      }, timeout);
    }
  }

  async handleFileWrite({ files }, callback) {
    try {
      console.log(chalk.yellow(`\n📝 Escrevendo ${files.length} arquivo(s)...`));

      for (const { path: filePath, content } of files) {
        const fullPath = path.resolve(this.workingDir, filePath);

        // 🔒 SANDBOX: Valida caminho
        if (!fullPath.startsWith(this.workingDir)) {
          throw new Error(`Acesso negado: ${filePath}`);
        }

        // Cria diretórios se necessário
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
        console.log(chalk.green(`✅ ${filePath}`));
      }

      callback({ success: true });
    } catch (error) {
      console.error(chalk.red('❌ Erro ao escrever arquivos:', error.message));
      callback({ success: false, error: error.message });
    }
  }

  async handleFileRead({ path: filePath }, callback) {
    try {
      const fullPath = path.resolve(this.workingDir, filePath);

      // 🔒 SANDBOX: Valida caminho
      if (!fullPath.startsWith(this.workingDir)) {
        throw new Error('Acesso negado');
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      callback({ content });
    } catch (error) {
      console.error(chalk.red(`❌ Erro ao ler arquivo: ${error.message}`));
      callback({ content: null });
    }
  }
}

// Inicia o Bridge
const bridge = new LocalBridge();
bridge.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Encerrando Local Bridge...'));
  process.exit(0);
});
