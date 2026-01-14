// server.js
// Servidor simples para testar a integração do sistema de mídia

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Mapeamento de extensões de arquivo para tipos MIME
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

// Criar servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Normalizar URL
  let filePath = path.join(__dirname, req.url === '/' ? 'test-media-page.html' : req.url);
  
  // Obter extensão do arquivo
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Ler arquivo
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Arquivo não encontrado
        fs.readFile(path.join(__dirname, '404.html'), (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Erro 500: Arquivo 404.html não encontrado');
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Erro de servidor
        res.writeHead(500);
        res.end(`Erro no servidor: ${error.code}`);
      }
    } else {
      // Sucesso
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/test-media-page.html para testar o sistema de mídia`);
});