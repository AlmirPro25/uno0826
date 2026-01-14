# ⚡ Quick Start - Agentes de Navegação

## 🚀 Iniciar em 3 Passos

### 1️⃣ Configurar API Key

```bash
# Editar .env
GEMINI_API_KEY=sua_chave_aqui
VITE_GEMINI_API_KEY=sua_chave_aqui
```

### 2️⃣ Iniciar Sistema

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
npm run dev
```

### 3️⃣ Testar

1. Abrir http://localhost:3000
2. Clicar em **"Modo Navegação"**
3. Digitar: `Busque por Python no Google`
4. Ver resultado no Canvas!

## 🎯 Comandos de Teste Rápido

```
✅ Busque por Python no Google
✅ Procure por notebooks na Amazon
✅ Acesse o GitHub e busque por playwright
✅ Vá para wikipedia.org e busque sobre IA
✅ Entre no site do Mercado Livre e tire um screenshot
```

## 📊 Verificar Status

```bash
# Estatísticas dos agentes
curl http://localhost:3002/api/navigator/stats

# Estatísticas do navegador
curl http://localhost:3002/api/browser/stats
```

## 🐛 Problemas?

### Erro: "Agentes não disponíveis"
```bash
# Verificar se API key está no .env
cat .env | grep GEMINI_API_KEY

# Reiniciar backend
cd backend && npm start
```

### Erro: "Playwright não instalado"
```bash
cd backend
npm install playwright
npx playwright install chromium
```

## 📚 Documentação Completa

- **AGENTES_NAVEGACAO_INTELIGENTE.md** - Documentação técnica
- **TESTE_AGENTES_NAVEGACAO.md** - Guia de testes
- **RESUMO_AGENTES_INTELIGENTES.md** - Resumo executivo

## 🎉 Pronto!

Agora você tem um sistema de navegação inteligente com:
- 🤖 3 agentes Gemini
- 🔄 Balanceamento automático
- 📊 4000 requisições/dia
- 🧠 Planejamento inteligente
- 🚀 Execução automatizada

**Divirta-se! 🎊**
