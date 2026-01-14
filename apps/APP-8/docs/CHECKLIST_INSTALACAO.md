# ✅ Checklist de Instalação

## 📋 Pré-requisitos

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] Python 3.10+ instalado (`python --version`)
- [ ] npm ou yarn instalado (`npm --version`)
- [ ] Git instalado (opcional)

## 🔧 Instalação

### Backend
- [ ] Navegou para pasta `backend/`
- [ ] Executou `npm install`
- [ ] Viu mensagem de sucesso
- [ ] Arquivo `backend/.env` existe
- [ ] `GEMINI_API_KEY` está configurada

### Executor
- [ ] Navegou para pasta `executor/`
- [ ] Executou `pip install -r requirements.txt`
- [ ] Viu mensagem de sucesso
- [ ] Arquivo `executor/.env` existe
- [ ] `AUTH_TOKEN` está configurado

### Frontend
- [ ] Na raiz do projeto
- [ ] Executou `npm install`
- [ ] Viu mensagem de sucesso

## 🚀 Inicialização

### Backend
- [ ] Abriu terminal 1
- [ ] Executou `cd backend && npm run dev`
- [ ] Viu mensagem: "Server running on http://localhost:3001"
- [ ] Testou: `curl http://localhost:3001/health`
- [ ] Retornou: `{"status":"ok"}`

### Executor
- [ ] Abriu terminal 2
- [ ] Executou `cd executor && python executor.py`
- [ ] Viu mensagem: "Gemini Executor inicializado"
- [ ] Viu mensagem: "Conectando ao Maestro..."
- [ ] (Aguardando conexão do frontend)

### Frontend
- [ ] Abriu terminal 3
- [ ] Executou `npm run dev`
- [ ] Viu mensagem: "Local: http://localhost:5173"
- [ ] Abriu navegador em http://localhost:5173
- [ ] Interface carregou corretamente

## 🔗 Conexão

### Executor Control
- [ ] Encontrou painel "Executor Control" na interface
- [ ] Clicou em "Conectar"
- [ ] Viu status mudar para "✅ Conectado"
- [ ] Informações da tela apareceram (resolução, posição do mouse)

### Smart Task Executor
- [ ] Encontrou painel "Smart Task Executor"
- [ ] Clicou em "Ver Tela"
- [ ] Análise da tela apareceu
- [ ] Campo de comando está disponível

## 🧪 Testes

### Teste Básico
- [ ] Digitou comando: "mover mouse para 500, 300"
- [ ] Clicou em "Executar"
- [ ] Mouse se moveu para a posição
- [ ] Sem erros no console

### Teste de Visão
- [ ] Clicou em "Ver Tela"
- [ ] Análise da tela apareceu
- [ ] Elementos foram identificados
- [ ] Descrição faz sentido

### Teste de Planejamento
- [ ] Digitou: "Abra o bloco de notas"
- [ ] Clicou em "Criar Plano"
- [ ] Plano foi gerado com passos
- [ ] Nível de risco apareceu
- [ ] Tempo estimado apareceu

### Teste de Execução
- [ ] Clicou em "Executar Este Plano"
- [ ] Passos foram executados
- [ ] Resultado apareceu (sucesso/falha)
- [ ] Screenshots foram capturados

## 🛑 Parada de Emergência

- [ ] Testou botão "PARAR" na interface
- [ ] Executor parou imediatamente
- [ ] Testou mover mouse para canto superior esquerdo
- [ ] Executor parou (failsafe)
- [ ] Testou Ctrl+C no terminal
- [ ] Executor encerrou

## 📊 Logs

- [ ] Arquivo `executor/executor.log` existe
- [ ] Arquivo `executor/executor_audit.log` existe
- [ ] Logs estão sendo gravados
- [ ] Screenshots estão sendo salvos

## 🎉 Sistema Pronto!

Se todos os itens acima estão marcados, seu sistema está:
- ✅ Instalado corretamente
- ✅ Rodando sem erros
- ✅ Conectado e funcional
- ✅ Pronto para uso!

## 📚 Próximos Passos

1. Leia `SISTEMA_COMPLETO_ROBOTICS.md` para entender todas as capacidades
2. Experimente comandos mais complexos
3. Explore a API REST em `http://localhost:3001/api/tasks`
4. Customize conforme suas necessidades

## 🐛 Se algo falhou

Consulte:
- `INSTALACAO_COMPLETA.md` - Guia detalhado
- `EXECUTOR_GUIDE.md` - Troubleshooting
- Logs em `executor/executor.log`

---

**Tudo funcionando?** Parabéns! 🎉 Você tem um robô de IA completo! 🤖
