# 🚀 Guia de Início Rápido - Neural Core

## ⚡ Iniciar em 3 Passos

### Passo 1: Iniciar Neural Core

**Clique duas vezes em:**
```
INICIAR_NEURAL_CORE.bat
```

**Ou no terminal:**
```bash
cd neural-core
npm install
npm run dev
```

**Você verá:**
```
╔══════════════════════════════════════════════════════════════╗
║        🧠 NEURAL CORE - ORQUESTRADOR INTELIGENTE 🧠          ║
╚══════════════════════════════════════════════════════════════╝

🚀 Servidor rodando em: http://localhost:3000
🔑 API Key configurada: ✅
🧠 Protocolos carregados:
   ✅ ARTISAN_DIGITAL_MANIFESTO
   ✅ FINTECH_ARCHITECT_PROTOCOL
   ✅ FULLSTACK_PRO_PROTOCOL
   ✅ GAME_DEV_PROTOCOL
   ✅ EXCELLENCE_CRITERIA

✨ Neural Core pronto para injetar sabedoria!
```

---

### Passo 2: Ativar no Frontend

Edite o arquivo `.env` na raiz do projeto:

```bash
# Mude de false para true
VITE_USE_NEURAL_CORE=true
VITE_NEURAL_CORE_URL=http://localhost:3000
```

---

### Passo 3: Iniciar Frontend

**Em outro terminal:**
```bash
npm run dev
```

---

## 🧪 Testar

### Teste 1: Verificar Neural Core

**Clique duas vezes em:**
```
TESTAR_NEURAL_CORE.bat
```

**Ou no navegador:**
```
http://localhost:3000/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "neural-core",
  "version": "2.0.0"
}
```

---

### Teste 2: Usar no App

Abra seu app em `http://localhost:5173` e digite:

```
Crie um banco digital com PIX
```

**No console do navegador, você verá:**
```
🧠 Neural Core: Tentando amplificação...
✅ Neural Core ativado! Protocolos: [
  "ARTISAN_DIGITAL_MANIFESTO",
  "FINTECH_ARCHITECT_PROTOCOL",
  "EXCELLENCE_CRITERIA"
]
```

---

## 🎯 Comandos Úteis

### Iniciar Neural Core
```bash
cd neural-core
npm run dev
```

### Testar Health Check
```bash
curl http://localhost:3000/health
```

### Ver Logs
Os logs aparecem no terminal onde você rodou `npm run dev`

### Parar Servidor
Pressione `Ctrl+C` no terminal

---

## 🔧 Troubleshooting

### Erro: "GEMINI_API_KEY não configurada"

**Solução:**
1. Abra `neural-core/.env`
2. Adicione sua API Key:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```

### Erro: "Porta 3000 já em uso"

**Solução:**
1. Pare outros servidores na porta 3000
2. Ou mude a porta em `neural-core/.env`:
   ```
   PORT=3001
   ```

### Erro: "Neural Core indisponível"

**Solução:**
1. Verifique se o Neural Core está rodando
2. Teste: `curl http://localhost:3000/health`
3. Verifique a URL no `.env` do frontend

---

## 📊 Status

### ✅ Neural Core Funcionando
```
⚡ Usando modo normal (frontend)
🧠 Neural Core: Tentando amplificação...
✅ Neural Core ativado!
```

### ❌ Neural Core Desligado
```
⚡ Usando modo normal (frontend)
🧠 Consultando Knowledge Base...
```

### ⚠️ Neural Core com Erro
```
🧠 Neural Core: Tentando amplificação...
⚠️ Neural Core indisponível, usando modo normal...
⚡ Usando modo normal (frontend)
```

---

## 🎉 Pronto!

Agora você tem:
- ✅ Neural Core rodando
- ✅ Frontend conectado
- ✅ Modo amplificado ativo
- ✅ Fallback automático

**Teste criando um banco digital ou jogo e veja a diferença!** 🚀

---

## 📚 Documentação Completa

- `NEURAL_CORE_GUIA_RAPIDO.md` - Guia de uso
- `TESTE_NEURAL_CORE.md` - Testes detalhados
- `neural-core/README.md` - Documentação técnica
- `neural-core/MODELOS_GEMINI.md` - Guia de modelos
