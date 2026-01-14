# 🛠️ Comandos Úteis - Backend SQLite3

## 🚀 Instalação e Configuração

### Instalar Dependências
```bash
cd backend
npm install
```

### Criar Arquivo de Configuração
```bash
# Windows (PowerShell)
@"
GEMINI_API_KEY=sua_chave_aqui
PORT=3001
DATABASE_PATH=./data/companion.db
"@ | Out-File -FilePath .env -Encoding utf8

# Linux/Mac
cat > .env << EOF
GEMINI_API_KEY=sua_chave_aqui
PORT=3001
DATABASE_PATH=./data/companion.db
EOF
```

## 🏃 Executar

### Modo Desenvolvimento (com watch)
```bash
cd backend
npm run dev
```

### Build para Produção
```bash
cd backend
npm run build
```

### Executar Produção
```bash
cd backend
npm start
```

## 🧪 Testes

### Teste Completo do Sistema
```bash
cd backend
npx tsx examples/test-system.ts
```

### Health Check
```bash
curl http://localhost:3001/health
```

### Teste de API

#### Criar Sessão
```bash
curl -X POST http://localhost:3001/api/sessions
```

#### Adicionar Mensagem
```bash
curl -X POST http://localhost:3001/api/sessions/1/messages \
  -H "Content-Type: application/json" \
  -d "{\"speaker\":\"user\",\"text\":\"Olá!\"}"
```

#### Buscar Sessão
```bash
curl http://localhost:3001/api/sessions/1
```

#### Listar Todas as Sessões
```bash
curl http://localhost:3001/api/sessions
```

#### Resumir Sessão
```bash
curl -X POST http://localhost:3001/api/sessions/1/summarize
```

#### Buscar Memórias
```bash
curl "http://localhost:3001/api/memories/search?q=programação&limit=5"
```

#### Adicionar Memória
```bash
curl -X POST http://localhost:3001/api/memories \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Usuário gosta de TypeScript\",\"type\":\"preference\",\"importance\":8,\"tags\":[\"typescript\",\"programação\"]}"
```

#### Estatísticas de Memória
```bash
curl http://localhost:3001/api/memories/stats
```

#### Upload de Imagem
```bash
curl -X POST http://localhost:3001/api/captures \
  -F "image=@screenshot.jpg" \
  -F "sessionId=1" \
  -F "context=Tela do código"
```

#### Buscar Resumo Diário
```bash
curl http://localhost:3001/api/summaries/2024-01-15
```

#### Criar Resumo Diário
```bash
curl -X POST http://localhost:3001/api/summaries \
  -H "Content-Type: application/json" \
  -d "{\"date\":\"2024-01-15\"}"
```

#### Análise Semanal
```bash
curl http://localhost:3001/api/summaries/trends/weekly
```

## 🗄️ Banco de Dados

### Ver Tamanho do Banco
```bash
# Windows
dir backend\data\companion.db

# Linux/Mac
ls -lh backend/data/companion.db
```

### Backup do Banco
```bash
# Windows
copy backend\data\companion.db backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%.db

# Linux/Mac
cp backend/data/companion.db backup-$(date +%Y%m%d).db
```

### Consultar Banco Diretamente
```bash
sqlite3 backend/data/companion.db
```

#### Comandos SQLite Úteis
```sql
-- Ver todas as tabelas
.tables

-- Ver estrutura de uma tabela
.schema sessions

-- Contar sessões
SELECT COUNT(*) FROM sessions;

-- Contar mensagens
SELECT COUNT(*) FROM messages;

-- Contar memórias
SELECT COUNT(*) FROM memories;

-- Contar capturas
SELECT COUNT(*) FROM captures;

-- Ver últimas sessões
SELECT id, start_time, summary FROM sessions ORDER BY start_time DESC LIMIT 5;

-- Ver memórias por tipo
SELECT type, COUNT(*) as count FROM memories GROUP BY type;

-- Ver tamanho do banco
SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();

-- Sair
.quit
```

### Limpar Banco (CUIDADO!)
```bash
# Windows
del backend\data\companion.db

# Linux/Mac
rm backend/data/companion.db
```

## 🔍 Debug e Monitoramento

### Ver Logs do Backend
```bash
cd backend
npm run dev
# Logs aparecem no console
```

### Verificar Porta em Uso
```bash
# Windows
netstat -ano | findstr :3001

# Linux/Mac
lsof -i :3001
```

### Matar Processo na Porta
```bash
# Windows (substitua PID pelo número encontrado)
taskkill /PID <PID> /F

# Linux/Mac
kill -9 $(lsof -t -i:3001)
```

### Ver Processos Node
```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

## 📊 Estatísticas

### Ver Estatísticas do Sistema
```bash
curl http://localhost:3001/api/memories/stats
```

### Ver Informações do Servidor
```bash
curl http://localhost:3001/
```

## 🔄 Migração de Dados

### Exportar Dados do localStorage (no console do navegador)
```javascript
// Exportar sessões antigas
const oldSessions = await databaseService.getHistory();
console.log(JSON.stringify(oldSessions, null, 2));
```

### Importar para Backend (script Node.js)
```javascript
// Criar arquivo import.js
const sessions = require('./old-sessions.json');

async function importData() {
  for (const session of sessions) {
    const response = await fetch('http://localhost:3001/api/sessions', {
      method: 'POST'
    });
    const { sessionId } = await response.json();
    
    for (const message of session.messages) {
      await fetch(`http://localhost:3001/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speaker: message.speaker,
          text: message.text
        })
      });
    }
  }
  console.log('Importação concluída!');
}

importData();
```

## 🧹 Limpeza

### Limpar node_modules
```bash
cd backend
rm -rf node_modules
npm install
```

### Limpar Build
```bash
cd backend
rm -rf dist
npm run build
```

### Limpar Tudo e Reinstalar
```bash
cd backend
rm -rf node_modules dist data
npm install
npm run dev
```

## 🔐 Segurança

### Verificar API Key
```bash
# Windows
echo %GEMINI_API_KEY%

# Linux/Mac
echo $GEMINI_API_KEY
```

### Testar API Key do Gemini
```bash
curl "https://generativelanguage.googleapis.com/v1/models?key=SUA_CHAVE_AQUI"
```

## 📦 Deploy

### Build para Produção
```bash
cd backend
npm run build
```

### Executar em Produção
```bash
cd backend
NODE_ENV=production npm start
```

### PM2 (Process Manager)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar com PM2
cd backend
pm2 start dist/server.js --name gemini-backend

# Ver status
pm2 status

# Ver logs
pm2 logs gemini-backend

# Parar
pm2 stop gemini-backend

# Reiniciar
pm2 restart gemini-backend
```

## 🐳 Docker (Opcional)

### Criar Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Build e Run
```bash
# Build
docker build -t gemini-backend .

# Run
docker run -p 3001:3001 --env-file .env gemini-backend
```

## 🔄 Atualização

### Atualizar Dependências
```bash
cd backend
npm update
```

### Verificar Dependências Desatualizadas
```bash
cd backend
npm outdated
```

## 📝 Logs

### Redirecionar Logs para Arquivo
```bash
cd backend
npm run dev > logs.txt 2>&1
```

### Ver Logs em Tempo Real
```bash
# Windows
type logs.txt

# Linux/Mac
tail -f logs.txt
```

## 🎯 Atalhos Úteis

### Script de Início Rápido (criar start.sh)
```bash
#!/bin/bash
cd backend
npm run dev &
cd ..
npm run dev
```

### Script de Teste Completo (criar test-all.sh)
```bash
#!/bin/bash
echo "🧪 Testando Backend..."
curl http://localhost:3001/health
echo "\n✅ Health check OK"

echo "\n🧪 Criando sessão..."
curl -X POST http://localhost:3001/api/sessions
echo "\n✅ Sessão criada"

echo "\n🧪 Executando teste completo..."
cd backend
npx tsx examples/test-system.ts
```

## 💡 Dicas

### Desenvolvimento Rápido
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
npm run dev

# Terminal 3: Testes
cd backend && npx tsx examples/test-system.ts
```

### Verificação Rápida
```bash
# Tudo em um comando
curl http://localhost:3001/health && \
curl -X POST http://localhost:3001/api/sessions && \
curl http://localhost:3001/api/sessions
```

---

**Salve este arquivo para referência rápida! 📌**
