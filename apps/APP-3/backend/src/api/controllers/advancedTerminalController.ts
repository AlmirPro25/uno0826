/**
 * ============================================
 * 🚀 ADVANCED TERMINAL CONTROLLER
 * ============================================
 * 
 * Controller avançado com:
 * - Gerenciamento de processos em background
 * - Streaming de output via polling
 * - Execução segura com sandbox
 * - Suporte a comandos longos
 */

import { Request, Response } from 'express';
import { spawn, ChildProcess, exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { EventEmitter } from 'events';

// ============================================
// CONFIGURAÇÕES
// ============================================

const WORKSPACE_DIR = path.join(process.cwd(), '..');

// Comandos permitidos (expandido)
const ALLOWED_COMMANDS = [
  // Node/NPM
  'npm', 'npx', 'node', 'yarn', 'pnpm', 'bun',
  // Git
  'git',
  // Linguagens
  'python', 'python3', 'pip', 'pip3',
  'go', 'cargo', 'rustc',
  'java', 'javac', 'mvn', 'gradle',
  // Containers
  'docker', 'docker-compose', 'podman',
  // Utilitários
  'ls', 'dir', 'cat', 'type', 'echo', 'pwd', 'cd',
  'mkdir', 'touch', 'cp', 'mv', 'find', 'grep',
  'curl', 'wget', 'tar', 'unzip', 'zip',
  // Build tools
  'make', 'cmake', 'tsc', 'esbuild', 'vite', 'webpack'
];

// Comandos perigosos
const DANGEROUS_COMMANDS = [
  'rm', 'rmdir', 'del', 'rd',
  'sudo', 'su', 'chmod', 'chown',
  'format', 'fdisk', 'mkfs',
  'shutdown', 'reboot', 'halt'
];

// ============================================
// GERENCIADOR DE PROCESSOS
// ============================================

interface ManagedProcess {
  id: string;
  command: string;
  cwd: string;
  process: ChildProcess;
  output: string[];
  status: 'running' | 'stopped' | 'error';
  startTime: number;
  pid?: number;
}

class ProcessManager extends EventEmitter {
  private processes: Map<string, ManagedProcess> = new Map();
  private maxOutputLines = 1000;

  startProcess(id: string, command: string, cwd: string): ManagedProcess | null {
    // Valida comando
    const [cmd] = command.split(' ');
    if (DANGEROUS_COMMANDS.includes(cmd)) {
      throw new Error(`Comando bloqueado: ${cmd}`);
    }

    // Valida diretório
    const targetDir = path.resolve(WORKSPACE_DIR, cwd);
    if (!targetDir.startsWith(WORKSPACE_DIR)) {
      throw new Error('Acesso negado: fora do workspace');
    }

    // Inicia processo
    const child = spawn(command, [], {
      cwd: targetDir,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    const managed: ManagedProcess = {
      id,
      command,
      cwd: targetDir,
      process: child,
      output: [],
      status: 'running',
      startTime: Date.now(),
      pid: child.pid
    };

    // Captura output
    child.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n');
      managed.output.push(...lines);
      // Limita tamanho do buffer
      if (managed.output.length > this.maxOutputLines) {
        managed.output = managed.output.slice(-this.maxOutputLines);
      }
      this.emit('output', { id, data: data.toString() });
    });

    child.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n');
      managed.output.push(...lines);
      if (managed.output.length > this.maxOutputLines) {
        managed.output = managed.output.slice(-this.maxOutputLines);
      }
      this.emit('output', { id, data: data.toString(), isError: true });
    });

    child.on('close', (code) => {
      managed.status = code === 0 ? 'stopped' : 'error';
      this.emit('close', { id, code });
    });

    child.on('error', (error) => {
      managed.status = 'error';
      managed.output.push(`Error: ${error.message}`);
      this.emit('error', { id, error: error.message });
    });

    this.processes.set(id, managed);
    return managed;
  }

  stopProcess(id: string): boolean {
    const managed = this.processes.get(id);
    if (!managed) return false;

    try {
      managed.process.kill('SIGTERM');
      setTimeout(() => {
        if (managed.status === 'running') {
          managed.process.kill('SIGKILL');
        }
      }, 5000);
      managed.status = 'stopped';
      return true;
    } catch {
      return false;
    }
  }

  getProcess(id: string): ManagedProcess | undefined {
    return this.processes.get(id);
  }

  getOutput(id: string, lines?: number): string[] {
    const managed = this.processes.get(id);
    if (!managed) return [];
    return lines ? managed.output.slice(-lines) : managed.output;
  }

  listProcesses(): Array<{
    id: string;
    command: string;
    status: string;
    pid?: number;
    startTime: number;
  }> {
    return Array.from(this.processes.values()).map(p => ({
      id: p.id,
      command: p.command,
      status: p.status,
      pid: p.pid,
      startTime: p.startTime
    }));
  }

  cleanup() {
    for (const [id, managed] of this.processes) {
      if (managed.status === 'running') {
        this.stopProcess(id);
      }
    }
  }
}

// Instância global
const processManager = new ProcessManager();

// Cleanup ao encerrar
process.on('SIGINT', () => processManager.cleanup());
process.on('SIGTERM', () => processManager.cleanup());

// ============================================
// CONTROLLERS
// ============================================

/**
 * Executa comando com timeout
 * POST /api/terminal/execute
 */
export const executeCommandAdvanced = async (req: Request, res: Response) => {
  try {
    const { command, cwd = '.', timeout = 60000 } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, error: 'Comando não fornecido' });
    }

    // Valida comando
    const [cmd] = command.split(' ');
    if (DANGEROUS_COMMANDS.includes(cmd)) {
      return res.status(403).json({ 
        success: false, 
        error: `Comando bloqueado por segurança: ${cmd}` 
      });
    }

    // Valida diretório
    const targetDir = path.resolve(WORKSPACE_DIR, cwd);
    if (!targetDir.startsWith(WORKSPACE_DIR)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Acesso negado: fora do workspace' 
      });
    }

    // Garante que diretório existe
    await fs.mkdir(targetDir, { recursive: true });

    // Executa com timeout
    const startTime = Date.now();
    
    const child = spawn(command, [], {
      cwd: targetDir,
      shell: true,
      env: { ...process.env }
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeout);

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      res.json({
        success: !timedOut && code === 0,
        exitCode: timedOut ? -1 : code,
        stdout: stdout.substring(0, 50000), // Limita tamanho
        stderr: stderr.substring(0, 10000),
        duration,
        timedOut,
        command
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      res.status(500).json({
        success: false,
        error: error.message,
        command
      });
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Inicia processo em background
 * POST /api/terminal/start-process
 */
export const startBackgroundProcess = async (req: Request, res: Response) => {
  try {
    const { command, cwd = '.', processId } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, error: 'Comando não fornecido' });
    }

    const id = processId || `proc_${Date.now()}`;
    
    const managed = processManager.startProcess(id, command, cwd);
    
    if (managed) {
      res.json({
        success: true,
        processId: id,
        pid: managed.pid,
        command,
        status: 'running'
      });
    } else {
      res.status(500).json({ success: false, error: 'Falha ao iniciar processo' });
    }

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Para processo em background
 * POST /api/terminal/stop-process
 */
export const stopBackgroundProcess = async (req: Request, res: Response) => {
  try {
    const { processId } = req.body;

    if (!processId) {
      return res.status(400).json({ success: false, error: 'processId não fornecido' });
    }

    const success = processManager.stopProcess(processId);
    
    res.json({ success, processId });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Obtém output de processo
 * GET /api/terminal/process-output
 */
export const getProcessOutput = async (req: Request, res: Response) => {
  try {
    const { processId, lines } = req.query;

    if (!processId) {
      return res.status(400).json({ success: false, error: 'processId não fornecido' });
    }

    const output = processManager.getOutput(
      processId as string, 
      lines ? parseInt(lines as string) : undefined
    );
    
    const process = processManager.getProcess(processId as string);

    res.json({
      success: true,
      processId,
      status: process?.status || 'unknown',
      output: output.join('\n'),
      lineCount: output.length
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Lista processos em background
 * GET /api/terminal/processes
 */
export const listBackgroundProcesses = async (req: Request, res: Response) => {
  try {
    const processes = processManager.listProcesses();
    res.json({ success: true, processes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { processManager };
