#!/usr/bin/env node
/**
 * ============================================
 * AI WEB WEAVER CLI - Node.js Edition
 * ============================================
 * Versão: 1.0.0
 * Descrição: CLI para instalar, debugar e gerenciar apps gerados
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, exec } = require('child_process');
const http = require('http');

// ============================================
// CONFIGURAÇÕES GLOBAIS
// ============================================

const CLI_VERSION = "1.0.0";
const CLI_NAME = "AI Web Weaver CLI";
const HOME_DIR = os.homedir();
const APPS_DIR = path.join(HOME_DIR, '.aiweaver', 'apps');
const LOGS_DIR = path.join(HOME_DIR, '.aiweaver', 'logs');
const CONFIG_FILE = path.join(HOME_DIR, '.aiweaver', 'config.json');
const DB_FILE = path.join(HOME_DIR, '.aiweaver', 'apps.db');

// Cores para output
const Colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function log(message, color = '') {
    console.log(`${color}${message}${Colors.reset}`);
}

function success(message) { log(`✅ ${message}`, Colors.green); }
function error(message) { log(`❌ ${message}`, Colors.red); }
function warning(message) { log(`⚠️  ${message}`, Colors.yellow); }
function info(message) { log(`ℹ️  ${message}`, Colors.cyan); }
function highlight(message) { log(`🎯 ${message}`, Colors.magenta); }

function showBanner() {
    console.log('');
    log('╔═══════════════════════════════════════════╗', Colors.magenta);
    log('║                                           ║', Colors.magenta);
    log(`║       AI WEB WEAVER CLI v${CLI_VERSION}        ║`, Colors.magenta);
    log('║   Instale, Debug e Gerencie seus Apps    ║', Colors.magenta);
    log('║                                           ║', Colors.magenta);
    log('╚═══════════════════════════════════════════╝', Colors.magenta);
    console.log('');
}

function ensureDirectories() {
    [APPS_DIR, LOGS_DIR, path.dirname(CONFIG_FILE)].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            info(`Diretório criado: ${dir}`);
        }
    });

    if (!fs.existsSync(CONFIG_FILE)) {
        const config = {
            version: CLI_VERSION,
            defaultPort: 3000,
            autoOpenBrowser: true,
            logLevel: "info"
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        info(`Configuração criada: ${CONFIG_FILE}`);
    }

    if (!fs.existsSync(DB_FILE)) {
        const db = { apps: [], installations: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
        info(`Banco de dados criado: ${DB_FILE}`);
    }
}

function loadDB() {
    try {
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
        return { apps: [], installations: [] };
    }
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

function detectAppType(content) {
    if (content.includes('<!DOCTYPE html>') && content.includes('type="module"')) {
        if (content.includes('express') || content.includes('fastify')) {
            return 'fullstack';
        }
        return 'single-file-html';
    }
    if (content.includes('package.json') || content.includes('require(') || content.includes('import ')) {
        return 'node-backend';
    }
    return 'unknown';
}

// ============================================
// COMANDOS PRINCIPAIS
// ============================================

function installApp(filePath, appName = null) {
    highlight('Instalando aplicação...');

    if (!fs.existsSync(filePath)) {
        error(`Arquivo não encontrado: ${filePath}`);
        return;
    }

    const appId = generateId();
    const appDir = path.join(APPS_DIR, appId);
    fs.mkdirSync(appDir, { recursive: true });

    const fileName = path.basename(filePath);
    fs.copyFileSync(filePath, path.join(appDir, fileName));

    const content = fs.readFileSync(filePath, 'utf-8');
    const appType = detectAppType(content);

    const db = loadDB();
    const app = {
        id: appId,
        name: appName || fileName,
        path: appDir,
        file: fileName,
        type: appType,
        port: 3000 + db.apps.length,
        installedAt: new Date().toISOString(),
        status: 'installed'
    };

    db.apps.push(app);
    saveDB(db);

    success('App instalado com sucesso!');
    info(`ID: ${appId}`);
    info(`Nome: ${app.name}`);
    info(`Tipo: ${appType}`);
    info(`Porta: ${app.port}`);
    info(`Caminho: ${appDir}`);

    return appId;
}

function listApps() {
    const db = loadDB();

    if (db.apps.length === 0) {
        warning('Nenhum app instalado.');
        return;
    }

    console.log('');
    highlight('📱 APPS INSTALADOS');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    db.apps.forEach(app => {
        log(`🔹 ${app.name}`, Colors.cyan);
        console.log(`   ID: ${app.id}`);
        console.log(`   Tipo: ${app.type}`);
        console.log(`   Porta: ${app.port}`);
        console.log(`   Status: ${app.status}`);
        console.log(`   Instalado: ${app.installedAt}`);
        console.log('');
    });
}

function startApp(appId) {
    const db = loadDB();
    const app = db.apps.find(a => a.id === appId);

    if (!app) {
        error(`App não encontrado: ${appId}`);
        return;
    }

    highlight(`Iniciando: ${app.name}`);

    const filePath = path.join(app.path, app.file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Servidor HTTP simples
    const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
    });

    server.listen(app.port, () => {
        success(`Servidor rodando em: http://localhost:${app.port}`);
        info('Pressione Ctrl+C para parar');

        // Abrir navegador
        const url = `http://localhost:${app.port}`;
        if (process.platform === 'win32') {
            exec(`start ${url}`);
        } else if (process.platform === 'darwin') {
            exec(`open ${url}`);
        } else {
            exec(`xdg-open ${url}`);
        }
    });

    // Atualizar status
    app.status = 'running';
    saveDB(db);
}

function removeApp(appId) {
    const db = loadDB();
    const appIndex = db.apps.findIndex(a => a.id === appId);

    if (appIndex === -1) {
        error(`App não encontrado: ${appId}`);
        return;
    }

    const app = db.apps[appIndex];
    warning(`Removendo app: ${app.name}`);

    // Remover diretório
    if (fs.existsSync(app.path)) {
        fs.rmSync(app.path, { recursive: true, force: true });
    }

    // Remover do banco
    db.apps.splice(appIndex, 1);
    saveDB(db);

    success('App removido com sucesso!');
}

function showHelp() {
    console.log('');
    highlight('📚 AI WEB WEAVER CLI - AJUDA');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('COMANDOS DISPONÍVEIS:');
    console.log('');
    log('  install <arquivo> [nome]', Colors.cyan);
    console.log('    Instala um app gerado pelo AI Web Weaver');
    console.log('    Exemplo: aiweaver install app.html MeuApp');
    console.log('');
    log('  start <app-id>', Colors.cyan);
    console.log('    Inicia um app instalado');
    console.log('    Exemplo: aiweaver start abc123');
    console.log('');
    log('  list', Colors.cyan);
    console.log('    Lista todos os apps instalados');
    console.log('');
    log('  remove <app-id>', Colors.cyan);
    console.log('    Remove um app instalado');
    console.log('    Exemplo: aiweaver remove abc123');
    console.log('');
    log('  help', Colors.cyan);
    console.log('    Mostra esta ajuda');
    console.log('');
}

// ============================================
// MAIN
// ============================================

function main() {
    showBanner();
    ensureDirectories();

    const args = process.argv.slice(2);
    const command = args[0]?.toLowerCase();

    switch (command) {
        case 'install':
            if (!args[1]) {
                error('Especifique o caminho do arquivo');
                return;
            }
            installApp(args[1], args[2]);
            break;
        case 'start':
            if (!args[1]) {
                error('Especifique o ID do app');
                return;
            }
            startApp(args[1]);
            break;
        case 'list':
        case 'ls':
            listApps();
            break;
        case 'remove':
        case 'rm':
            if (!args[1]) {
                error('Especifique o ID do app');
                return;
            }
            removeApp(args[1]);
            break;
        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;
        default:
            showHelp();
    }
}

main();
