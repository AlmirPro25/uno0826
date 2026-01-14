# 🧪 TESTE LIMPO DO SISTEMA - Passo a Passo

## 📋 PRÉ-REQUISITOS

Antes de começar, verifique:
- ✅ Node.js instalado
- ✅ Python instalado
- ✅ Dependências instaladas (npm install em ambos os diretórios)
- ✅ API Keys configuradas (.env files)

## 🚀 PASSO 1: INICIAR BACKEND

```bash
cd backend
npm run dev
```

**Aguarde ver**:
```
╔═══════════════════════════════════════════════════════╗
║  🚀 Gemini Companion Backend                          ║
║  📡 Server running on http://localhost:3001           ║
║  🤖 Gemini Maestro: ACTIVE                            ║
║  💾 SQLite3 Database: READY                           ║
║  📅 Auto-summaries: SCHEDULED                         ║
╚═══════════════════════════════════════════════════════╝

✅ Database initialized
🔌 WebSocket Server listening on port 3002
```

**✅ CHECKPOINT 1**: Backend rodando na porta 3001

## 🐍 PASSO 2: INICIAR EXECUTOR PYTHON

**Novo terminal**:
```bash
cd executor
python executor.py
```

**Aguarde ver**:
```
🤖 Gemini Executor iniciando...
🔌 Conectando ao backend em ws://localhost:3002
✅ Executor conectado ao backend!
📡 Aguardando comandos...
```

**✅ CHECKPOINT 2**: Executor conectado via WebSocket

## ⚛️ PASSO 3: INICIAR FRONTEND

**Novo terminal**:
```bash
npm run dev
```

**Aguarde ver**:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ CHECKPOINT 3**: Frontend rodando na porta 5173

## 🌐 PASSO 4: ABRIR NAVEGADOR

Abra: `http://localhost:5173`

**Você deve ver**:
- Tela inicial do Gemini Live Companion
- Botão de play para iniciar sessão

## 🎬 PASSO 5: INICIAR SESSÃO

1. Clique no botão de **Play** (▶️)
2. Permita acesso à **tela** (escolha qual tela compartilhar)
3. Permita acesso ao **microfone**
4. Permita acesso à **câmera**

**Aguarde ver**:
- Status: "✅ Conectado com Maestro"
- Canto superior direito: "✅ Executor Online"

**✅ CHECKPOINT 4**: Sessão iniciada com sucesso

## 🧪 PASSO 6: TESTES BÁSICOS

### Teste 1: Comando Simples
**Fale**: "Abra o navegador"

**Esperado**:
1. Transcrição aparece: "Você: Abra o navegador"
2. Indicador: "🤖 Executando: Abrir navegador"
3. Chrome abre
4. Mensagem: "🤖 Maestro Executor: ✅ Abrindo navegador..."

**Tempo**: < 3 segundos

### Teste 2: Comando com Navegação
**Fale**: "Abra o YouTube"

**Esperado**:
1. Transcrição aparece
2. Indicador de execução
3. Chrome abre com YouTube
4. Mensagem de confirmação

**Tempo**: < 3 segundos

### Teste 3: Pesquisa
**Fale**: "Pesquise por Python tutorial"

**Esperado**:
1. Transcrição aparece
2. Indicador de execução
3. YouTube abre com resultados da busca
4. Mensagem de confirmação

**Tempo**: < 3 segundos

### Teste 4: Modo Autônomo (NOVO!)
**Fale**: "O que tem na tela?"

**Esperado**:
1. Gemini Live analisa a tela
2. Responde descrevendo o que vê
3. Pode sugerir ações

**Tempo**: 2-4 segundos

## 🔍 VERIFICAÇÃO DE LOGS

### Backend (Terminal 1)
Deve mostrar:
```
🎯 COMANDO RECEBIDO DA LIVE
============================================================
📝 Comando: "Abra o navegador"
🎭 Tipo: navigation
📊 Confiança: 95%
============================================================

🚀 Comando rápido: Abrir navegador
✅ Comando executado com sucesso
```

### Executor (Terminal 2)
Deve mostrar:
```
📨 Comando recebido: hotkey
⚙️  Executando: hotkey(['win', 'r'])
✅ Comando executado com sucesso

📨 Comando recebido: type
⚙️  Executando: type('chrome')
✅ Comando executado com sucesso
```

### Frontend (Terminal 3)
Deve mostrar logs do Vite (normalmente silencioso)

## ❌ TROUBLESHOOTING

### Problema: Backend não inicia
**Erro**: `Error: Cannot find module...`
**Solução**:
```bash
cd backend
npm install
npm run dev
```

### Problema: Executor não conecta
**Erro**: `Connection refused`
**Solução**:
1. Verifique se backend está rodando
2. Verifique porta 3002 livre
3. Reinicie executor:
```bash
cd executor
python executor.py
```

### Problema: "Executor Offline" no frontend
**Causa**: Executor não está conectado
**Solução**:
1. Verifique terminal do executor
2. Deve mostrar "✅ Executor conectado"
3. Se não, reinicie executor

### Problema: Comandos não executam
**Verificar**:
1. Backend está rodando? (porta 3001)
2. Executor está conectado? (WebSocket 3002)
3. Frontend mostra "✅ Executor Online"?

**Teste manual**:
```bash
# Teste se backend responde
curl http://localhost:3001/health

# Deve retornar:
{"status":"ok","timestamp":"...","database":"connected"}
```

### Problema: Permissões negadas
**Erro**: "NotAllowedError"
**Solução**:
1. Clique em "Tentar Novamente"
2. Permita TODAS as permissões (tela, microfone, câmera)
3. Se navegador bloqueou, vá em Configurações → Permissões

### Problema: API Key inválida
**Erro**: "API Key não configurada"
**Solução**:
1. Verifique `.env.local` (frontend):
```
VITE_API_KEY=sua_chave_aqui
```
2. Verifique `backend/.env`:
```
GEMINI_API_KEY=sua_chave_aqui
```

## ✅ CHECKLIST FINAL

Marque conforme testa:

### Inicialização
- [ ] Backend iniciou (porta 3001)
- [ ] Executor conectou (WebSocket 3002)
- [ ] Frontend abriu (porta 5173)
- [ ] Sessão iniciada com sucesso
- [ ] Status: "✅ Conectado com Maestro"
- [ ] Status: "✅ Executor Online"

### Comandos Rápidos
- [ ] "Abra o navegador" funciona
- [ ] "Abra o YouTube" funciona
- [ ] "Pesquise por..." funciona
- [ ] "Role para baixo" funciona
- [ ] "Feche essa janela" funciona

### Modo Autônomo (NOVO!)
- [ ] Gemini Live responde perguntas sobre tela
- [ ] Gemini Live pode executar ações autonomamente
- [ ] Function calling funciona

### Feedback Visual
- [ ] Indicador de execução aparece
- [ ] Mensagens do sistema aparecem na conversa
- [ ] Status do executor é atualizado

### Logs
- [ ] Backend mostra logs de comandos
- [ ] Executor mostra logs de ações
- [ ] Sem erros críticos

## 🎉 SUCESSO!

Se todos os checkpoints passaram, seu sistema está:
- ✅ 100% funcional
- ✅ Totalmente integrado
- ✅ Com modo autônomo ativo
- ✅ Pronto para uso!

## 📊 PRÓXIMOS TESTES

Depois que tudo funcionar, teste:
1. Comandos complexos: "Clique no primeiro vídeo"
2. Navegação: "Volte a página"
3. Análise: "O que tem na tela?"
4. Modo autônomo: Deixe Gemini Live tomar iniciativa

## 🆘 PRECISA DE AJUDA?

Se algo não funcionar:
1. Verifique os 3 terminais (backend, executor, frontend)
2. Leia os logs de erro
3. Consulte a seção Troubleshooting acima
4. Verifique as API Keys

**Boa sorte! 🚀**
