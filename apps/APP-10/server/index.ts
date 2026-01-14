/**
 * 🚀 Aether Local Runtime Server
 * Backend que expõe PowerShell REAL para o agente via PTY
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Tentar importar node-pty (pode falhar se não estiver instalado)
let pty: any = null;
try {
  pty = require('node-pty');
  console.log('✅ node-pty loaded - Real PTY terminal available');
} catch (e) {
  console.warn('⚠️ node-pty not available - falling back to basic shell');
  console.warn('   Run: cd server && npm install node-pty');
}

const app = express();
const server = createServer(app);
const io = new SocketIO(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Diretório de trabalho do projeto (pode ser alterado em runtime)
let WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.cwd(), 'workspace');

// Garantir que o workspace existe
if (!existsSync(WORKSPACE_ROOT)) {
  mkdirSync(WORKSPACE_ROOT, { recursive: true });
}

// PTY Process (terminal real)
let ptyProcess: any = null;

// ============================================================================
// 🔄 PROCESS MANAGER - Gerenciamento de múltiplos processos
// ============================================================================

interface ManagedProcess {
  id: string;
  name: string;
  command: string;
  process: ChildProcessWithoutNullStreams | null;
  status: 'running' | 'stopped' | 'error';
  port?: number;
  output: string[];
  startedAt: number;
  cwd: string;
  tabId?: string; // ID da aba do terminal associada
  pid?: number;   // PID real do processo
}

// ============================================================================
// 🖥️ TERMINAL TABS - Múltiplas abas de terminal
// ============================================================================

interface TerminalTab {
  id: string;
  name: string;
  type: 'shell' | 'process' | 'log';
  ptyProcess: any | null;
  shellProcess: ChildProcessWithoutNullStreams | null;
  output: string[];
  createdAt: number;
  isActive: boolean;
  cwd: string;
  processId?: string; // Se associado a um processo gerenciado
}

const terminalTabs: Map<string, TerminalTab> = new Map();
let activeTabId: string | null = null;

// Gerar ID único para aba
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// ============================================================================
// 📊 CENTRALIZED LOGGING - Logs para a IA
// ============================================================================

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug' | 'command' | 'output';
  source: string; // 'shell', 'process:id', 'system', 'agent'
  message: string;
  metadata?: Record<string, any>;
}

const systemLogs: LogEntry[] = [];
const MAX_LOGS = 5000;

function addLog(level: LogEntry['level'], source: string, message: string, metadata?: Record<string, any>) {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level,
    source,
    message,
    metadata
  };
  
  systemLogs.push(entry);
  
  // Manter apenas os últimos MAX_LOGS
  if (systemLogs.length > MAX_LOGS) {
    systemLogs.splice(0, systemLogs.length - MAX_LOGS);
  }
  
  // Emitir para o frontend em tempo real
  io.emit('log:entry', entry);
}

// ============================================================================
// 🧠 AI CONTEXT - Contexto para a IA entender o estado do sistema
// ============================================================================

interface SystemState {
  processes: {
    total: number;
    running: number;
    stopped: number;
    error: number;
    list: Array<{
      id: string;
      name: string;
      command: string;
      status: string;
      port?: number;
      uptime: number;
    }>;
  };
  terminals: {
    total: number;
    active: string | null;
    list: Array<{
      id: string;
      name: string;
      type: string;
      isActive: boolean;
    }>;
  };
  workspace: {
    path: string;
    name: string;
  };
  ports: {
    reserved: number[];
    inUse: number[];
    available: number;
  };
  recentLogs: LogEntry[];
  health: {
    backendUptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

const serverStartTime = Date.now();

async function getSystemState(): Promise<SystemState> {
  const processes = Array.from(managedProcesses.values());
  const tabs = Array.from(terminalTabs.values());
  
  // Detectar portas em uso
  const portsInUse: number[] = [];
  for (const proc of processes) {
    if (proc.port && proc.status === 'running') {
      portsInUse.push(proc.port);
    }
  }
  
  // Encontrar próxima porta disponível
  let nextAvailable = WORKSPACE_PORT_RANGE.min;
  try {
    nextAvailable = await findAvailablePort();
  } catch (e) {}
  
  return {
    processes: {
      total: processes.length,
      running: processes.filter(p => p.status === 'running').length,
      stopped: processes.filter(p => p.status === 'stopped').length,
      error: processes.filter(p => p.status === 'error').length,
      list: processes.map(p => ({
        id: p.id,
        name: p.name,
        command: p.command,
        status: p.status,
        port: p.port,
        uptime: p.status === 'running' ? Date.now() - p.startedAt : 0
      }))
    },
    terminals: {
      total: tabs.length,
      active: activeTabId,
      list: tabs.map(t => ({
        id: t.id,
        name: t.name,
        type: t.type,
        isActive: t.isActive
      }))
    },
    workspace: {
      path: WORKSPACE_ROOT,
      name: path.basename(WORKSPACE_ROOT)
    },
    ports: {
      reserved: RESERVED_PORTS,
      inUse: portsInUse,
      available: nextAvailable
    },
    recentLogs: systemLogs.slice(-50),
    health: {
      backendUptime: Date.now() - serverStartTime,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuUsage: 0 // TODO: implementar
    }
  };
}

const managedProcesses: Map<string, ManagedProcess> = new Map();

// Encontrar processo por porta
function findProcessByPort(port: number): ManagedProcess | undefined {
  for (const proc of managedProcesses.values()) {
    if (proc.port === port && proc.status === 'running') {
      return proc;
    }
  }
  return undefined;
}

// Encontrar processo por comando similar
function findSimilarProcess(command: string): ManagedProcess | undefined {
  const normalizedCmd = command.toLowerCase().trim();
  for (const proc of managedProcesses.values()) {
    if (proc.status === 'running' && proc.command.toLowerCase().includes(normalizedCmd.split(' ')[0])) {
      return proc;
    }
  }
  return undefined;
}

// Gerar ID único para processo
function generateProcessId(): string {
  return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Portas reservadas que NUNCA devem ser usadas por apps do workspace
const RESERVED_PORTS = [3001, 5174]; // 3001 = backend, 5174 = frontend IDE
const WORKSPACE_PORT_RANGE = { min: 5173, max: 5199 }; // Workspace usa 5173+

// Detectar porta no comando ou output
function detectPort(text: string): number | undefined {
  const portMatch = text.match(/(?:port|localhost:|:)(\d{4,5})/i);
  if (portMatch) {
    return parseInt(portMatch[1]);
  }
  return undefined;
}

// Verificar se porta está em uso
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

// Encontrar próxima porta disponível no range do workspace
async function findAvailablePort(startPort: number = WORKSPACE_PORT_RANGE.min): Promise<number> {
  for (let port = startPort; port <= WORKSPACE_PORT_RANGE.max; port++) {
    if (RESERVED_PORTS.includes(port)) continue;
    const inUse = await isPortInUse(port);
    if (!inUse) return port;
  }
  throw new Error('No available ports in workspace range');
}

// ============================================================================
// 🚨 SHELL COMMAND INTERCEPTOR - Protege portas reservadas
// ============================================================================

// Detectar se comando é um dev server que pode usar porta reservada
function isDevServerCommand(cmd: string): boolean {
  const devServerPatterns = [
    /npm\s+run\s+dev/i,
    /npm\s+start/i,
    /yarn\s+dev/i,
    /yarn\s+start/i,
    /pnpm\s+dev/i,
    /pnpm\s+start/i,
    /vite(?:\s|$)/i,
    /next\s+dev/i,
    /nuxt\s+dev/i,
    /webpack\s+serve/i,
    /webpack-dev-server/i,
    /react-scripts\s+start/i
  ];
  return devServerPatterns.some(pattern => pattern.test(cmd));
}

// Verificar se comando já tem porta especificada
function hasPortSpecified(cmd: string): boolean {
  return /--port\s*[=\s]?\d+/i.test(cmd) || /-p\s*\d+/i.test(cmd);
}

// Interceptar e modificar comandos do shell para proteger portas
async function interceptShellCommand(input: string): Promise<string> {
  // Só processar se for um comando completo (termina com Enter)
  if (!input.endsWith('\r') && !input.endsWith('\n') && !input.endsWith('\r\n')) {
    return input;
  }
  
  const cmd = input.trim();
  
  // Se não é um dev server ou já tem porta, deixar passar
  if (!isDevServerCommand(cmd) || hasPortSpecified(cmd)) {
    return input;
  }
  
  // Encontrar porta segura
  try {
    const safePort = await findAvailablePort();
    
    // Construir comando modificado com porta segura
    let modifiedCmd = cmd;
    
    // Para npm/yarn/pnpm, adicionar -- --port
    if (/npm\s+run\s+dev/i.test(cmd) || /yarn\s+dev/i.test(cmd) || /pnpm\s+dev/i.test(cmd)) {
      modifiedCmd = `${cmd.replace(/[\r\n]+$/, '')} -- --port ${safePort}`;
    }
    // Para npm start, yarn start, pnpm start
    else if (/npm\s+start/i.test(cmd) || /yarn\s+start/i.test(cmd) || /pnpm\s+start/i.test(cmd)) {
      modifiedCmd = `${cmd.replace(/[\r\n]+$/, '')} -- --port ${safePort}`;
    }
    // Para vite direto
    else if (/vite(?:\s|$)/i.test(cmd)) {
      modifiedCmd = `${cmd.replace(/[\r\n]+$/, '')} --port ${safePort}`;
    }
    // Para next dev
    else if (/next\s+dev/i.test(cmd)) {
      modifiedCmd = `${cmd.replace(/[\r\n]+$/, '')} -p ${safePort}`;
    }
    // Outros casos
    else {
      modifiedCmd = `${cmd.replace(/[\r\n]+$/, '')} --port ${safePort}`;
    }
    
    console.log(`🔒 Port Protection: Intercepted "${cmd.replace(/[\r\n]+$/, '')}" → using port ${safePort}`);
    
    // Emitir aviso para o frontend
    io.emit('shell:port-redirect', { 
      originalCommand: cmd.replace(/[\r\n]+$/, ''),
      safePort,
      message: `⚠️ Porta protegida! Usando porta ${safePort} (5174 é reservada para o IDE)`
    });
    
    return modifiedCmd + '\r';
  } catch (e: any) {
    console.error('❌ Port protection failed:', e.message);
    return input;
  }
}

// ============================================================================
// 📂 WORKSPACE MANAGEMENT API
// ============================================================================

// Obter workspace atual
app.get('/api/workspace', (req, res) => {
  res.json({ 
    path: WORKSPACE_ROOT,
    name: path.basename(WORKSPACE_ROOT)
  });
});

// Alterar workspace
app.post('/api/workspace/set', async (req, res) => {
  const { path: newPath } = req.body;
  
  if (!newPath) {
    return res.json({ success: false, error: 'Path is required' });
  }
  
  // Verificar se o caminho existe
  if (!existsSync(newPath)) {
    // Tentar criar
    try {
      mkdirSync(newPath, { recursive: true });
    } catch (e: any) {
      return res.json({ success: false, error: `Cannot create folder: ${e.message}` });
    }
  }
  
  WORKSPACE_ROOT = newPath;
  
  // Reiniciar shell se estiver rodando
  if (shellProcess) {
    shellProcess.kill();
    shellProcess = null;
  }
  
  console.log(`📂 Workspace changed to: ${WORKSPACE_ROOT}`);
  io.emit('workspace:changed', { path: WORKSPACE_ROOT });
  
  res.json({ success: true, path: WORKSPACE_ROOT });
});

// Listar pastas recentes (salvas em arquivo local)
const RECENT_FILE = path.join(process.cwd(), '.recent-workspaces.json');

app.get('/api/workspace/recent', (req, res) => {
  try {
    if (existsSync(RECENT_FILE)) {
      const data = JSON.parse(require('fs').readFileSync(RECENT_FILE, 'utf-8'));
      res.json({ success: true, workspaces: data });
    } else {
      res.json({ success: true, workspaces: [] });
    }
  } catch (e) {
    res.json({ success: true, workspaces: [] });
  }
});

// Adicionar pasta aos recentes
app.post('/api/workspace/recent/add', (req, res) => {
  const { path: wsPath, name } = req.body;
  
  try {
    let workspaces: any[] = [];
    if (existsSync(RECENT_FILE)) {
      workspaces = JSON.parse(require('fs').readFileSync(RECENT_FILE, 'utf-8'));
    }
    
    // Remover se já existe
    workspaces = workspaces.filter(w => w.path !== wsPath);
    
    // Adicionar no início
    workspaces.unshift({ path: wsPath, name: name || path.basename(wsPath), lastOpened: Date.now() });
    
    // Manter apenas os 10 mais recentes
    workspaces = workspaces.slice(0, 10);
    
    require('fs').writeFileSync(RECENT_FILE, JSON.stringify(workspaces, null, 2));
    
    res.json({ success: true });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Abrir diálogo de seleção de pasta (via PowerShell com STA)
app.post('/api/workspace/browse', async (req, res) => {
  try {
    const result = await new Promise<string>((resolve, reject) => {
      // Usar -STA para Single Thread Apartment (necessário para Windows Forms)
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-STA',
        '-Command',
        `
        [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms") | Out-Null
        $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
        $dialog.Description = "Select workspace folder for Aether"
        $dialog.ShowNewFolderButton = $true
        $dialog.RootFolder = [System.Environment+SpecialFolder]::MyComputer
        $result = $dialog.ShowDialog()
        if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
          Write-Output $dialog.SelectedPath
        } else {
          Write-Output ""
        }
        `
      ], {
        windowsHide: false,
        detached: false
      });
      
      let output = '';
      let errorOutput = '';
      
      ps.stdout.on('data', (data) => { 
        output += data.toString(); 
      });
      
      ps.stderr.on('data', (data) => { 
        errorOutput += data.toString();
        console.error('Browse dialog error:', data.toString()); 
      });
      
      ps.on('error', (err) => {
        reject(new Error(`Failed to spawn PowerShell: ${err.message}`));
      });
      
      ps.on('close', (code) => {
        const selectedPath = output.trim();
        if (selectedPath && selectedPath.length > 0) {
          resolve(selectedPath);
        } else {
          reject(new Error('No folder selected or dialog cancelled'));
        }
      });
      
      // Timeout de 2 minutos
      setTimeout(() => {
        ps.kill();
        reject(new Error('Dialog timeout'));
      }, 120000);
    });
    
    res.json({ success: true, path: result });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Shell interativo (PowerShell)
let shellProcess: ChildProcessWithoutNullStreams | null = null;
let shellSocket: any = null;

// ============================================================================
// 📁 FILE SYSTEM API
// ============================================================================

app.post('/api/fs/read', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/fs/write', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    
    // Criar diretório pai se não existir
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    
    res.json({ success: true });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/fs/delete', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    await fs.rm(fullPath, { recursive: true, force: true });
    res.json({ success: true });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/fs/rename', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    const fullOld = path.join(WORKSPACE_ROOT, oldPath);
    const fullNew = path.join(WORKSPACE_ROOT, newPath);
    
    await fs.mkdir(path.dirname(fullNew), { recursive: true });
    await fs.rename(fullOld, fullNew);
    res.json({ success: true });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

app.post('/api/fs/list', async (req, res) => {
  try {
    const { path: dirPath = '.' } = req.body;
    const fullPath = path.join(WORKSPACE_ROOT, dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    
    const items = entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory()
    }));
    
    res.json({ success: true, items });
  } catch (e: any) {
    res.json({ success: false, error: e.message, items: [] });
  }
});

app.post('/api/fs/exists', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    const exists = existsSync(fullPath);
    res.json({ success: true, exists });
  } catch (e: any) {
    res.json({ success: false, exists: false });
  }
});

// Listar arquivos recursivamente (para sincronizar com o frontend)
app.get('/api/fs/tree', async (req, res) => {
  try {
    const tree = await buildFileTree(WORKSPACE_ROOT, '');
    res.json({ success: true, files: tree });
  } catch (e: any) {
    res.json({ success: false, error: e.message, files: [] });
  }
});

// Função auxiliar para construir árvore de arquivos
async function buildFileTree(basePath: string, relativePath: string): Promise<any[]> {
  const fullPath = path.join(basePath, relativePath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  
  const result: any[] = [];
  
  // Ignorar node_modules e .git
  const ignoredDirs = ['node_modules', '.git', '.vite', 'dist'];
  
  for (const entry of entries) {
    if (ignoredDirs.includes(entry.name)) continue;
    
    const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      const children = await buildFileTree(basePath, entryPath);
      result.push({
        name: entry.name,
        path: entryPath,
        isFolder: true,
        children
      });
    } else {
      // Ler conteúdo do arquivo
      let content = '';
      let language = 'text';
      
      try {
        const ext = path.extname(entry.name).toLowerCase();
        // Só ler arquivos de texto
        const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.scss', '.md', '.txt', '.yml', '.yaml', '.env', '.gitignore', '.prettierrc', '.eslintrc'];
        
        if (textExtensions.includes(ext) || entry.name.startsWith('.')) {
          content = await fs.readFile(path.join(fullPath, entry.name), 'utf-8');
        }
        
        // Determinar linguagem
        if (ext === '.js' || ext === '.mjs') language = 'javascript';
        else if (ext === '.jsx') language = 'javascript';
        else if (ext === '.ts') language = 'typescript';
        else if (ext === '.tsx') language = 'typescript';
        else if (ext === '.json') language = 'json';
        else if (ext === '.html') language = 'html';
        else if (ext === '.css' || ext === '.scss') language = 'css';
        else if (ext === '.md') language = 'markdown';
      } catch (e) {
        // Arquivo binário ou erro de leitura
      }
      
      result.push({
        name: entry.name,
        path: entryPath,
        isFolder: false,
        content,
        language
      });
    }
  }
  
  // Ordenar: pastas primeiro, depois arquivos
  result.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });
  
  return result;
}

// Sincronizar arquivos do frontend para o sistema local
app.post('/api/fs/sync', async (req, res) => {
  try {
    const { files } = req.body; // Array de {path, content}
    
    for (const file of files) {
      const fullPath = path.join(WORKSPACE_ROOT, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf-8');
    }
    
    res.json({ success: true, synced: files.length });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// ============================================================================
// 🖥️ COMMAND EXECUTION API
// ============================================================================

app.post('/api/exec', async (req, res) => {
  let { command, timeout = 60000 } = req.body;
  
  try {
    // 🚨 INTERCEPTAR COMANDOS DE DEV SERVER
    if (isDevServerCommand(command) && !hasPortSpecified(command)) {
      const safePort = await findAvailablePort();
      
      // Modificar comando para usar porta segura
      if (/npm\s+run\s+dev/i.test(command) || /yarn\s+dev/i.test(command) || /pnpm\s+dev/i.test(command)) {
        command = `${command} -- --port ${safePort}`;
      } else if (/npm\s+start/i.test(command) || /yarn\s+start/i.test(command)) {
        command = `${command} -- --port ${safePort}`;
      } else if (/vite(?:\s|$)/i.test(command)) {
        command = `${command} --port ${safePort}`;
      } else if (/next\s+dev/i.test(command)) {
        command = `${command} -p ${safePort}`;
      } else {
        command = `${command} --port ${safePort}`;
      }
      
      console.log(`🔒 API Exec: Port protection applied → port ${safePort}`);
      io.emit('shell:port-redirect', { 
        originalCommand: req.body.command,
        safePort,
        message: `⚠️ Porta protegida! Usando porta ${safePort}`
      });
    }
    
    const result = await executeCommand(command, timeout);
    res.json(result);
  } catch (e: any) {
    res.json({ success: false, output: e.message, exitCode: 1 });
  }
});

function executeCommand(command: string, timeout: number): Promise<{ success: boolean; output: string; exitCode: number }> {
  return new Promise((resolve) => {
    let output = '';
    let resolved = false;
    
    // Usar PowerShell no Windows
    const proc = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
      cwd: WORKSPACE_ROOT,
      env: { ...process.env, FORCE_COLOR: '1' },
      shell: false
    });
    
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill();
        resolve({ success: false, output: output + '\n[TIMEOUT]', exitCode: 124 });
      }
    }, timeout);
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
      // Broadcast para o terminal em tempo real
      io.emit('terminal:output', data.toString());
    });
    
    proc.stderr.on('data', (data) => {
      output += data.toString();
      io.emit('terminal:output', data.toString());
    });
    
    proc.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ success: code === 0, output, exitCode: code || 0 });
      }
    });
    
    proc.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ success: false, output: err.message, exitCode: 1 });
      }
    });
  });
}

// ============================================================================
// 🔌 WEBSOCKET - SHELL INTERATIVO REAL COM PTY
// ============================================================================

io.on('connection', (socket) => {
  console.log('🔌 Client connected');
  shellSocket = socket;
  
  // Iniciar shell interativo REAL com PTY
  socket.on('shell:start', (options?: { cols?: number; rows?: number }) => {
    const cols = options?.cols || 120;
    const rows = options?.rows || 30;
    
    // Fechar processo anterior se existir
    if (ptyProcess) {
      try {
        ptyProcess.kill();
      } catch (e) {}
      ptyProcess = null;
    }
    
    if (shellProcess) {
      try {
        shellProcess.kill('SIGTERM');
      } catch (e) {}
      shellProcess = null;
    }
    
    // Usar node-pty se disponível (terminal REAL)
    if (pty) {
      console.log('🖥️ Starting PTY shell...');
      
      try {
        // Criar PTY com PowerShell
        ptyProcess = pty.spawn('powershell.exe', ['-NoLogo', '-NoProfile'], {
          name: 'xterm-256color',
          cols: cols,
          rows: rows,
          cwd: WORKSPACE_ROOT,
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLORTERM: 'truecolor'
          }
        });
        
        // Enviar output para o cliente
        ptyProcess.onData((data: string) => {
          socket.emit('shell:output', data);
        });
        
        ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
          console.log(`🖥️ PTY exited with code ${exitCode}`);
          socket.emit('shell:exit', exitCode);
          ptyProcess = null;
        });
        
        // Enviar mensagem de boas-vindas
        setTimeout(() => {
          ptyProcess?.write(`cd "${WORKSPACE_ROOT}"\r`);
          ptyProcess?.write('cls\r');
          ptyProcess?.write('Write-Host "🖥️ Aether PowerShell - Real PTY Terminal" -ForegroundColor Magenta\r');
          ptyProcess?.write(`Write-Host "📁 Workspace: ${WORKSPACE_ROOT}" -ForegroundColor DarkGray\r`);
          ptyProcess?.write('Write-Host ""\r');
        }, 500);
        
        socket.emit('shell:ready', { type: 'pty' });
        console.log('✅ PTY shell started');
        
      } catch (e: any) {
        console.error('❌ Failed to start PTY:', e.message);
        socket.emit('shell:error', e.message);
        // Fallback para spawn normal
        startFallbackShell(socket);
      }
    } else {
      // Fallback: usar spawn normal
      startFallbackShell(socket);
    }
  });
  
  // Input do usuário para o shell
  socket.on('shell:input', async (data: string) => {
    // 🚨 INTERCEPTAR COMANDOS QUE PODEM USAR PORTAS RESERVADAS
    const interceptedData = await interceptShellCommand(data);
    
    if (ptyProcess) {
      ptyProcess.write(interceptedData);
    } else if (shellProcess && shellProcess.stdin.writable) {
      shellProcess.stdin.write(interceptedData);
    }
  });
  
  // Resize do terminal (funciona com PTY!)
  socket.on('shell:resize', ({ cols, rows }: { cols: number; rows: number }) => {
    if (ptyProcess) {
      try {
        ptyProcess.resize(cols, rows);
      } catch (e) {}
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected');
    if (ptyProcess) {
      try {
        ptyProcess.kill();
      } catch (e) {}
      ptyProcess = null;
    }
    if (shellProcess) {
      try {
        shellProcess.kill();
      } catch (e) {}
      shellProcess = null;
    }
  });
});

// Fallback shell sem PTY
function startFallbackShell(socket: any) {
  console.log('🖥️ Starting fallback shell (no PTY)...');
  
  shellProcess = spawn('powershell.exe', [
    '-NoLogo',
    '-NoProfile', 
    '-NoExit'
  ], {
    cwd: WORKSPACE_ROOT,
    env: { 
      ...process.env, 
      TERM: 'xterm-256color',
      FORCE_COLOR: '1'
    },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  shellProcess.stdout.on('data', (data: Buffer) => {
    socket.emit('shell:output', data.toString());
  });
  
  shellProcess.stderr.on('data', (data: Buffer) => {
    socket.emit('shell:output', data.toString());
  });
  
  shellProcess.on('close', (code: number) => {
    socket.emit('shell:exit', code);
    shellProcess = null;
  });
  
  // Enviar comandos iniciais
  setTimeout(() => {
    shellProcess?.stdin.write(`cd "${WORKSPACE_ROOT}"\r\n`);
    shellProcess?.stdin.write('cls\r\n');
    shellProcess?.stdin.write('Write-Host "🖥️ Aether PowerShell (Fallback Mode)" -ForegroundColor Yellow\r\n');
  }, 500);
  
  socket.emit('shell:ready', { type: 'fallback' });
}

// ============================================================================
// 🌐 DEV SERVER PROXY INFO
// ============================================================================

let devServerPort: number | null = null;
let devServerProcess: ChildProcessWithoutNullStreams | null = null;

app.post('/api/server/start', async (req, res) => {
  let { command = 'npm run dev', port = 4173 } = req.body;
  
  // 🚨 PROTEÇÃO: Nunca usar portas reservadas
  if (RESERVED_PORTS.includes(port)) {
    console.log(`⚠️ Port ${port} is RESERVED! Using safe port...`);
    try {
      port = await findAvailablePort();
    } catch (e: any) {
      return res.json({ success: false, error: `Cannot find safe port: ${e.message}` });
    }
  }
  
  if (devServerProcess) {
    devServerProcess.kill();
  }
  
  devServerPort = port;
  
  // Adicionar porta ao comando se for vite/npm run dev
  if (command.includes('npm run dev') || command.includes('vite')) {
    command = `${command} -- --port ${port}`;
  }
  
  devServerProcess = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env, PORT: String(port) }
  });
  
  devServerProcess.stdout.on('data', (data) => {
    io.emit('server:output', data.toString());
  });
  
  devServerProcess.stderr.on('data', (data) => {
    io.emit('server:output', data.toString());
  });
  
  devServerProcess.on('close', (code) => {
    io.emit('server:exit', code);
    devServerProcess = null;
    devServerPort = null;
  });
  
  res.json({ success: true, port });
});

app.post('/api/server/stop', (req, res) => {
  if (devServerProcess) {
    devServerProcess.kill();
    devServerProcess = null;
    devServerPort = null;
  }
  res.json({ success: true });
});

app.get('/api/server/status', (req, res) => {
  res.json({
    running: devServerProcess !== null,
    port: devServerPort,
    url: devServerPort ? `http://localhost:${devServerPort}` : null
  });
});

// Status do shell interativo
app.get('/api/shell/status', (req, res) => {
  res.json({
    running: shellProcess !== null,
    connected: shellSocket?.connected || false,
    workspace: WORKSPACE_ROOT
  });
});

// Executar comando e retornar output em tempo real via WebSocket
app.post('/api/shell/exec', async (req, res) => {
  const { command } = req.body;
  
  if (!shellProcess || !shellProcess.stdin.writable) {
    return res.json({ success: false, error: 'Shell not running' });
  }
  
  // Enviar comando para o shell interativo
  shellProcess.stdin.write(command + '\r\n');
  
  res.json({ success: true, message: 'Command sent to shell' });
});

// ============================================================================
// 🔄 PROCESS MANAGER API - Gerenciamento de múltiplos processos
// ============================================================================

// Listar todos os processos
app.get('/api/processes', (req, res) => {
  const processes = Array.from(managedProcesses.values()).map(p => ({
    id: p.id,
    name: p.name,
    command: p.command,
    status: p.status,
    port: p.port,
    startedAt: p.startedAt,
    cwd: p.cwd,
    outputLines: p.output.length
  }));
  res.json({ success: true, processes });
});

// Obter detalhes de um processo
app.get('/api/processes/:id', (req, res) => {
  const proc = managedProcesses.get(req.params.id);
  if (!proc) {
    return res.json({ success: false, error: 'Process not found' });
  }
  res.json({ 
    success: true, 
    process: {
      ...proc,
      process: undefined, // Não serializar o processo
      output: proc.output.slice(-100) // Últimas 100 linhas
    }
  });
});

// Obter output de um processo
app.get('/api/processes/:id/output', (req, res) => {
  const proc = managedProcesses.get(req.params.id);
  if (!proc) {
    return res.json({ success: false, error: 'Process not found' });
  }
  const lines = parseInt(req.query.lines as string) || 100;
  res.json({ 
    success: true, 
    output: proc.output.slice(-lines).join('\n')
  });
});

// Iniciar um novo processo
app.post('/api/processes/start', async (req, res) => {
  let { command, name, port: requestedPort, cwd } = req.body;
  
  if (!command) {
    return res.json({ success: false, error: 'Command is required' });
  }
  
  addLog('command', 'process-manager', `Starting process: ${command}`, { name, port: requestedPort, cwd });
  
  // Detectar porta no comando
  let detectedPort = requestedPort || detectPort(command);
  
  // 🚨 PROTEÇÃO: Se a porta detectada é reservada, forçar porta do workspace
  if (detectedPort && RESERVED_PORTS.includes(detectedPort)) {
    console.log(`⚠️ Port ${detectedPort} is RESERVED! Finding alternative...`);
    try {
      const safePort = await findAvailablePort();
      console.log(`✅ Using safe port: ${safePort}`);
      
      // Modificar comando para usar porta segura
      if (command.includes('npm run dev') || command.includes('vite')) {
        command = `${command} -- --port ${safePort}`;
      }
      detectedPort = safePort;
    } catch (e: any) {
      return res.json({ success: false, error: `Cannot find safe port: ${e.message}` });
    }
  }
  
  // Se não tem porta definida e é um dev server, usar porta do workspace
  if (!detectedPort && (command.includes('npm run dev') || command.includes('npm start') || command.includes('vite'))) {
    try {
      detectedPort = await findAvailablePort();
      command = `${command} -- --port ${detectedPort}`;
      console.log(`📍 Auto-assigned port ${detectedPort} for dev server`);
    } catch (e: any) {
      return res.json({ success: false, error: `Cannot find available port: ${e.message}` });
    }
  }
  
  // Verificar se já existe processo na mesma porta
  if (detectedPort) {
    const existingByPort = findProcessByPort(detectedPort);
    if (existingByPort) {
      return res.json({ 
        success: true, 
        reused: true,
        message: `Reusing existing process on port ${detectedPort}`,
        process: {
          id: existingByPort.id,
          name: existingByPort.name,
          status: existingByPort.status,
          port: existingByPort.port
        }
      });
    }
  }
  
  // Verificar se já existe processo similar rodando
  const existingSimilar = findSimilarProcess(command);
  if (existingSimilar && existingSimilar.status === 'running') {
    // Se é npm run dev e já tem um rodando, reusar
    if (command.includes('npm run dev') || command.includes('npm start')) {
      return res.json({ 
        success: true, 
        reused: true,
        message: 'Reusing existing dev server',
        process: {
          id: existingSimilar.id,
          name: existingSimilar.name,
          status: existingSimilar.status,
          port: existingSimilar.port
        }
      });
    }
  }
  
  // Criar novo processo
  const processId = generateProcessId();
  const processName = name || command.split(' ').slice(0, 2).join(' ');
  const processCwd = cwd ? path.join(WORKSPACE_ROOT, cwd) : WORKSPACE_ROOT;
  
  const newProcess: ManagedProcess = {
    id: processId,
    name: processName,
    command: command,
    process: null,
    status: 'running',
    port: detectedPort,
    output: [],
    startedAt: Date.now(),
    cwd: processCwd
  };
  
  try {
    const proc = spawn('powershell.exe', ['-NoProfile', '-Command', command], {
      cwd: processCwd,
      env: { ...process.env, FORCE_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    newProcess.process = proc;
    
    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      newProcess.output.push(text);
      // Manter apenas últimas 1000 linhas
      if (newProcess.output.length > 1000) {
        newProcess.output = newProcess.output.slice(-1000);
      }
      // Detectar porta no output
      if (!newProcess.port) {
        const port = detectPort(text);
        if (port && !RESERVED_PORTS.includes(port)) {
          newProcess.port = port;
          io.emit('process:port', { id: processId, port });
        }
      }
      // Emitir output via WebSocket
      io.emit('process:output', { id: processId, data: text });
    });
    
    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      newProcess.output.push(text);
      io.emit('process:output', { id: processId, data: text });
    });
    
    proc.on('close', (code: number) => {
      newProcess.status = code === 0 ? 'stopped' : 'error';
      newProcess.process = null;
      io.emit('process:exit', { id: processId, code });
    });
    
    proc.on('error', (err: Error) => {
      newProcess.status = 'error';
      newProcess.output.push(`Error: ${err.message}`);
      io.emit('process:error', { id: processId, error: err.message });
    });
    
    managedProcesses.set(processId, newProcess);
    
    res.json({ 
      success: true, 
      reused: false,
      process: {
        id: processId,
        name: processName,
        command: command,
        status: 'running',
        port: detectedPort
      }
    });
    
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Parar um processo
app.post('/api/processes/:id/stop', (req, res) => {
  const proc = managedProcesses.get(req.params.id);
  if (!proc) {
    return res.json({ success: false, error: 'Process not found' });
  }
  
  if (proc.process) {
    try {
      proc.process.kill('SIGTERM');
      proc.status = 'stopped';
      proc.process = null;
      io.emit('process:stopped', { id: proc.id });
      res.json({ success: true, message: 'Process stopped' });
    } catch (e: any) {
      res.json({ success: false, error: e.message });
    }
  } else {
    res.json({ success: true, message: 'Process already stopped' });
  }
});

// Remover um processo da lista
app.delete('/api/processes/:id', (req, res) => {
  const proc = managedProcesses.get(req.params.id);
  if (!proc) {
    return res.json({ success: false, error: 'Process not found' });
  }
  
  // Parar se estiver rodando
  if (proc.process) {
    try {
      proc.process.kill('SIGTERM');
    } catch (e) {}
  }
  
  managedProcesses.delete(req.params.id);
  io.emit('process:removed', { id: req.params.id });
  res.json({ success: true, message: 'Process removed' });
});

// Parar todos os processos
app.post('/api/processes/stop-all', (req, res) => {
  let stopped = 0;
  for (const proc of managedProcesses.values()) {
    if (proc.process) {
      try {
        proc.process.kill('SIGTERM');
        proc.status = 'stopped';
        proc.process = null;
        stopped++;
      } catch (e) {}
    }
  }
  io.emit('processes:stopped-all');
  res.json({ success: true, stopped });
});

// Enviar input para um processo
app.post('/api/processes/:id/input', (req, res) => {
  const { input } = req.body;
  const proc = managedProcesses.get(req.params.id);
  
  if (!proc || !proc.process) {
    return res.json({ success: false, error: 'Process not running' });
  }
  
  try {
    proc.process.stdin.write(input);
    res.json({ success: true });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// ============================================================================
// 🚀 START SERVER
// ============================================================================

// ============================================================================
// 🖥️ TERMINAL TABS API - Gerenciamento de múltiplas abas
// ============================================================================

// Listar todas as abas
app.get('/api/terminals', (req, res) => {
  const tabs = Array.from(terminalTabs.values()).map(t => ({
    id: t.id,
    name: t.name,
    type: t.type,
    isActive: t.isActive,
    createdAt: t.createdAt,
    cwd: t.cwd,
    processId: t.processId,
    outputLines: t.output.length
  }));
  res.json({ success: true, tabs, activeTabId });
});

// Criar nova aba de terminal
app.post('/api/terminals/create', async (req, res) => {
  const { name, type = 'shell', cwd } = req.body;
  
  const tabId = generateTabId();
  const tabCwd = cwd ? path.join(WORKSPACE_ROOT, cwd) : WORKSPACE_ROOT;
  
  const newTab: TerminalTab = {
    id: tabId,
    name: name || `Terminal ${terminalTabs.size + 1}`,
    type: type as 'shell' | 'process' | 'log',
    ptyProcess: null,
    shellProcess: null,
    output: [],
    createdAt: Date.now(),
    isActive: false,
    cwd: tabCwd
  };
  
  terminalTabs.set(tabId, newTab);
  
  addLog('info', 'system', `Terminal tab created: ${newTab.name}`, { tabId });
  io.emit('terminal:tab-created', { tab: newTab });
  
  res.json({ success: true, tab: newTab });
});

// Ativar uma aba
app.post('/api/terminals/:id/activate', (req, res) => {
  const tab = terminalTabs.get(req.params.id);
  if (!tab) {
    return res.json({ success: false, error: 'Tab not found' });
  }
  
  // Desativar todas as outras
  for (const t of terminalTabs.values()) {
    t.isActive = false;
  }
  
  tab.isActive = true;
  activeTabId = tab.id;
  
  io.emit('terminal:tab-activated', { tabId: tab.id });
  res.json({ success: true });
});

// Fechar uma aba
app.delete('/api/terminals/:id', (req, res) => {
  const tab = terminalTabs.get(req.params.id);
  if (!tab) {
    return res.json({ success: false, error: 'Tab not found' });
  }
  
  // Matar processos associados
  if (tab.ptyProcess) {
    try { tab.ptyProcess.kill(); } catch (e) {}
  }
  if (tab.shellProcess) {
    try { tab.shellProcess.kill('SIGTERM'); } catch (e) {}
  }
  
  terminalTabs.delete(req.params.id);
  
  // Se era a aba ativa, ativar outra
  if (activeTabId === req.params.id) {
    const remaining = Array.from(terminalTabs.values());
    if (remaining.length > 0) {
      remaining[0].isActive = true;
      activeTabId = remaining[0].id;
    } else {
      activeTabId = null;
    }
  }
  
  addLog('info', 'system', `Terminal tab closed: ${tab.name}`, { tabId: tab.id });
  io.emit('terminal:tab-closed', { tabId: req.params.id });
  
  res.json({ success: true });
});

// Fechar todas as abas
app.post('/api/terminals/close-all', (req, res) => {
  let closed = 0;
  
  for (const tab of terminalTabs.values()) {
    if (tab.ptyProcess) {
      try { tab.ptyProcess.kill(); } catch (e) {}
    }
    if (tab.shellProcess) {
      try { tab.shellProcess.kill('SIGTERM'); } catch (e) {}
    }
    closed++;
  }
  
  terminalTabs.clear();
  activeTabId = null;
  
  addLog('info', 'system', `All terminal tabs closed: ${closed}`);
  io.emit('terminal:all-closed');
  
  res.json({ success: true, closed });
});

// Obter output de uma aba
app.get('/api/terminals/:id/output', (req, res) => {
  const tab = terminalTabs.get(req.params.id);
  if (!tab) {
    return res.json({ success: false, error: 'Tab not found' });
  }
  
  const lines = parseInt(req.query.lines as string) || 100;
  res.json({ success: true, output: tab.output.slice(-lines).join('') });
});

// Renomear uma aba
app.post('/api/terminals/:id/rename', (req, res) => {
  const { name } = req.body;
  const tab = terminalTabs.get(req.params.id);
  
  if (!tab) {
    return res.json({ success: false, error: 'Tab not found' });
  }
  
  tab.name = name;
  io.emit('terminal:tab-renamed', { tabId: tab.id, name });
  
  res.json({ success: true });
});

// ============================================================================
// 📊 LOGS API - Logs centralizados para a IA
// ============================================================================

// Obter logs
app.get('/api/logs', (req, res) => {
  const lines = parseInt(req.query.lines as string) || 100;
  const level = req.query.level as string;
  const source = req.query.source as string;
  
  let logs = systemLogs.slice(-lines);
  
  if (level) {
    logs = logs.filter(l => l.level === level);
  }
  if (source) {
    logs = logs.filter(l => l.source.includes(source));
  }
  
  res.json({ success: true, logs, total: systemLogs.length });
});

// Adicionar log (para o agente)
app.post('/api/logs', (req, res) => {
  const { level = 'info', source = 'agent', message, metadata } = req.body;
  
  if (!message) {
    return res.json({ success: false, error: 'Message is required' });
  }
  
  addLog(level, source, message, metadata);
  res.json({ success: true });
});

// Limpar logs
app.delete('/api/logs', (req, res) => {
  const count = systemLogs.length;
  systemLogs.length = 0;
  
  addLog('info', 'system', 'Logs cleared');
  res.json({ success: true, cleared: count });
});

// Exportar logs
app.get('/api/logs/export', (req, res) => {
  const format = req.query.format || 'json';
  
  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=aether-logs.json');
    res.json(systemLogs);
  } else {
    // Formato texto
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=aether-logs.txt');
    const text = systemLogs.map(l => 
      `[${new Date(l.timestamp).toISOString()}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}`
    ).join('\n');
    res.send(text);
  }
});

// ============================================================================
// 🧠 SYSTEM STATE API - Estado completo para a IA
// ============================================================================

// Obter estado completo do sistema
app.get('/api/system/state', async (req, res) => {
  try {
    const state = await getSystemState();
    res.json({ success: true, state });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Obter resumo para a IA (formato otimizado)
app.get('/api/system/summary', async (req, res) => {
  try {
    const state = await getSystemState();
    
    // Formato compacto para o contexto da IA
    const summary = `
🖥️ AETHER SYSTEM STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 WORKSPACE: ${state.workspace.path}

🔄 PROCESSES (${state.processes.running}/${state.processes.total} running):
${state.processes.list.map(p => 
  `   ${p.status === 'running' ? '🟢' : p.status === 'error' ? '🔴' : '⚪'} [${p.id}] ${p.name} ${p.port ? `→ :${p.port}` : ''}`
).join('\n') || '   (none)'}

🖥️ TERMINALS (${state.terminals.total} tabs):
${state.terminals.list.map(t => 
  `   ${t.isActive ? '▶️' : '  '} [${t.id}] ${t.name} (${t.type})`
).join('\n') || '   (none)'}

🔌 PORTS:
   Reserved: ${state.ports.reserved.join(', ')}
   In Use: ${state.ports.inUse.join(', ') || 'none'}
   Next Available: ${state.ports.available}

📊 HEALTH:
   Uptime: ${Math.floor(state.health.backendUptime / 1000 / 60)}min
   Memory: ${state.health.memoryUsage.toFixed(1)}MB

📝 RECENT ACTIVITY (last 10):
${state.recentLogs.slice(-10).map(l => 
  `   [${l.level}] ${l.message}`
).join('\n') || '   (none)'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
    
    res.json({ success: true, summary, state });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Reiniciar sistema (mata todos os processos e limpa)
app.post('/api/system/reset', async (req, res) => {
  addLog('warn', 'system', 'System reset initiated');
  
  // Parar todos os processos
  for (const proc of managedProcesses.values()) {
    if (proc.process) {
      try { proc.process.kill('SIGTERM'); } catch (e) {}
    }
  }
  managedProcesses.clear();
  
  // Fechar todas as abas
  for (const tab of terminalTabs.values()) {
    if (tab.ptyProcess) {
      try { tab.ptyProcess.kill(); } catch (e) {}
    }
    if (tab.shellProcess) {
      try { tab.shellProcess.kill('SIGTERM'); } catch (e) {}
    }
  }
  terminalTabs.clear();
  activeTabId = null;
  
  // Fechar shell principal
  if (ptyProcess) {
    try { ptyProcess.kill(); } catch (e) {}
    ptyProcess = null;
  }
  if (shellProcess) {
    try { shellProcess.kill('SIGTERM'); } catch (e) {}
    shellProcess = null;
  }
  
  addLog('info', 'system', 'System reset complete');
  io.emit('system:reset');
  
  res.json({ success: true, message: 'System reset complete' });
});

// Matar processo por PID (Windows)
app.post('/api/system/kill-pid', async (req, res) => {
  const { pid } = req.body;
  
  if (!pid) {
    return res.json({ success: false, error: 'PID is required' });
  }
  
  try {
    // Windows: taskkill
    await executeCommand(`taskkill /PID ${pid} /F`, 5000);
    addLog('info', 'system', `Killed process PID ${pid}`);
    res.json({ success: true, message: `Process ${pid} killed` });
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Matar processo por porta (Windows)
app.post('/api/system/kill-port', async (req, res) => {
  const { port } = req.body;
  
  if (!port) {
    return res.json({ success: false, error: 'Port is required' });
  }
  
  try {
    // Encontrar PID usando netstat
    const result = await executeCommand(
      `netstat -ano | findstr :${port} | findstr LISTENING`,
      5000
    );
    
    if (result.output) {
      const lines = result.output.trim().split('\n');
      const pids = new Set<string>();
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }
      
      for (const pid of pids) {
        await executeCommand(`taskkill /PID ${pid} /F`, 5000);
        addLog('info', 'system', `Killed process on port ${port} (PID ${pid})`);
      }
      
      res.json({ success: true, message: `Killed ${pids.size} process(es) on port ${port}` });
    } else {
      res.json({ success: true, message: `No process found on port ${port}` });
    }
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// Listar processos do sistema (Windows)
app.get('/api/system/processes', async (req, res) => {
  try {
    const result = await executeCommand(
      'Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object Id, ProcessName, CPU, WorkingSet64 | ConvertTo-Json',
      10000
    );
    
    if (result.success && result.output) {
      try {
        const processes = JSON.parse(result.output);
        res.json({ success: true, processes: Array.isArray(processes) ? processes : [processes] });
      } catch (e) {
        res.json({ success: true, processes: [], raw: result.output });
      }
    } else {
      res.json({ success: false, error: result.output });
    }
  } catch (e: any) {
    res.json({ success: false, error: e.message });
  }
});

// ============================================================================
// 🚀 START SERVER
// ============================================================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  🚀 Aether Local Runtime Server                          ║
║  ────────────────────────────────────────────────────────║
║  API:       http://localhost:${PORT}                        ║
║  Workspace: ${WORKSPACE_ROOT}
║  Shell:     PowerShell                                   ║
╚══════════════════════════════════════════════════════════╝
  `);
});
