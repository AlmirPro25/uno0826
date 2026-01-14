# 🚀 Quick Start - PROX AI Studio + COGNITO

## ⚡ Instalação Rápida (5 minutos)

### 1. **Instalar Dependências**

```bash
# Backend
cd gemini-pro-studio-main/backend
npm install

# Frontend (se ainda não instalou)
cd ..
npm install
```

### 2. **Configurar API Key**

Crie o arquivo `.env` no backend:

```bash
cd backend
echo GEMINI_API_KEY=sua_api_key_aqui > .env
```

Obtenha sua API key em: https://makersuite.google.com/app/apikey

### 3. **Iniciar Sistema**

```bash
# Terminal 1 - Backend (porta 3002)
cd gemini-pro-studio-main/backend
npm start

# Terminal 2 - Frontend (porta 3000)
cd gemini-pro-studio-main
npm run dev
```

### 4. **Acessar**

Abra o navegador em: http://localhost:3000

---

## 🧠 COGNITO - Recursos Avançados

O módulo COGNITO já está integrado! Ele adiciona:

✅ **Cache inteligente** - Economiza 70% de chamadas API  
✅ **Grade adaptativa** - Auto-ajusta à resolução  
✅ **Clique inteligente** - Detecta hotspots  
✅ **Busca por cor** - Encontra elementos visuais  
✅ **Memória de longo prazo** - 1000+ interações  
✅ **Skills reutilizáveis** - Automação inteligente  

### Verificar se COGNITO está ativo

Ao iniciar o backend, você verá:

```
🧠 Inicializando COGNITO Bridge...
📚 X memórias carregadas
🔧 Y skills carregadas
✅ COGNITO Bridge inicializado
```

Se não aparecer, o sistema funciona normalmente sem os recursos avançados.

---

## 📱 Testar Funcionalidades

### 1. **Desktop Automation**

1. Acesse a aba "Desktop Control" no menu lateral
2. Clique em "Capturar Tela"
3. Use "Ações Inteligentes" para controlar o PC

### 2. **Chat com IA**

1. Digite uma mensagem no chat
2. A IA responde com contexto e memória
3. Sugestões aparecem automaticamente

### 3. **Geração de Imagens**

1. Selecione modelo "Gemini 2.0 Flash Exp"
2. Digite: "gere uma imagem de um gato astronauta"
3. Aguarde a geração

### 4. **WhatsApp (Opcional)**

```bash
cd whatsapp-bridge
npm install
npm start
```

Escaneie o QR Code com WhatsApp.

---

## 🔧 Troubleshooting

### Backend não inicia

```bash
# Verifique se a porta 3002 está livre
netstat -ano | findstr :3002

# Se estiver ocupada, mate o processo ou mude a porta
set PORT=3003
npm start
```

### Frontend não conecta

1. Verifique se backend está rodando (http://localhost:3002/health)
2. Verifique CORS no `backend/server.js`
3. Limpe cache do navegador

### COGNITO não funciona

É normal! O COGNITO é opcional. O sistema funciona sem ele.

Para ativar:
1. Verifique se PowerShell está instalado
2. Verifique se o arquivo `cognito/cognito-module.ps1` existe
3. Execute como administrador (para controle de mouse/teclado)

---

## 📊 Estrutura de Portas

| Serviço | Porta | URL |
|---------|-------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 3002 | http://localhost:3002 |
| WhatsApp | 3001 | http://localhost:3001 |

---

## 🎯 Próximos Passos

1. ✅ Sistema básico funcionando
2. 📖 Leia `COGNITO_INTEGRATION.md` para recursos avançados
3. 🤖 Configure WhatsApp (opcional)
4. 🎨 Explore geração de imagens e documentos
5. 🔐 Configure análise de segurança

---

## 💡 Dicas

- **Use Ctrl+K** para abrir busca rápida
- **Modo escuro/claro** no canto superior direito
- **Histórico** salvo automaticamente no IndexedDB
- **Memórias COGNITO** em `~/.cognito/`

---

## 📞 Suporte

- Documentação completa: `COGNITO_INTEGRATION.md`
- Resumo técnico: `INTEGRATION_SUMMARY.md`
- Issues: Verifique logs do console (F12)

---

**🎉 Pronto! Seu sistema está funcionando!**

Explore as funcionalidades e divirta-se! 🚀
