# ⚡ Início Rápido - 3 Passos

## ✅ Instalação Completa!

Tudo já está instalado e o backend está rodando!

## 🎯 3 Passos para Começar

### 1️⃣ Configurar API Key (2 minutos)

Obtenha sua chave em: 👉 https://makersuite.google.com/app/apikey

**Edite 2 arquivos:**

**A) backend/.env** (linha 3):
```env
GEMINI_API_KEY=cole_sua_chave_aqui
```

**B) .env.local** (linha 5):
```env
API_KEY=cole_sua_chave_aqui
```

### 2️⃣ Iniciar Frontend (1 minuto)

**Opção A - Clique duas vezes:**
```
start-frontend.bat
```

**Opção B - Terminal:**
```bash
npm run dev
```

### 3️⃣ Abrir no Navegador

Abra: http://localhost:5173

## 🎼 Ativar Gemini Maestro (Opcional)

Para usar contexto dinâmico, edite `src/App.tsx` (linha ~10):

**Antes:**
```typescript
import UnifiedInterface from './components/UnifiedInterface';
```

**Depois:**
```typescript
import UnifiedInterface from './components/UnifiedInterfaceWithMaestro';
```

Salve e recarregue. Pronto! 🎼

## ✅ Verificar se Está Funcionando

### Backend (já está rodando)
```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{"status":"ok","database":"connected"}
```

### Frontend
Abra http://localhost:5173 e você verá:
```
Gemini Live Companion
Your personal AI partner
```

## 🎉 Pronto!

Agora você tem:
- ✅ Backend rodando (localhost:3001)
- ✅ Frontend rodando (localhost:5173)
- ✅ Banco de dados SQLite3 ativo
- ✅ Gemini Maestro funcionando
- ✅ Sistema completo operacional!

## 📚 Mais Informações

- **[COMO_INICIAR.md](COMO_INICIAR.md)** - Guia completo
- **[STATUS_INSTALACAO.md](STATUS_INSTALACAO.md)** - Status da instalação
- **[README_SISTEMA_COMPLETO.md](README_SISTEMA_COMPLETO.md)** - Documentação completa

---

**Aproveite seu assistente inteligente! 🤖✨**
