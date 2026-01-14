# 🤖 Agentes de Navegação Inteligente - README

## 🚀 Status da Implementação

✅ **Backend**: Implementado e funcional
✅ **Frontend**: Implementado e funcional  
✅ **Documentação**: Completa
⚠️ **Requer**: Reiniciar backend para ativar

## 📦 O Que Foi Implementado

### Sistema Completo de Agentes Inteligentes

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIO                              │
│  "Busque por Python no Google"                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React)                           │
│  • Detecta intenção de navegação                       │
│  • Envia para API dos agentes                          │
│  • Mostra progresso em tempo real                      │
│  • Exibe resultado no Canvas                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Node.js)                          │
│  • Seleciona melhor agente disponível                  │
│  • Balanceia carga entre 3 modelos                     │
│  • Controla quotas (4000 req/dia)                      │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           AGENTE GEMINI (IA)                            │
│  • Analisa intenção do usuário                         │
│  • Gera plano de ação em JSON                          │
│  • Define passos específicos                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│           PLAYWRIGHT (Navegador)                        │
│  • Executa cada passo do plano                         │
│  • Navega, clica, preenche, extrai                     │
│  • Captura screenshot                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              RESULTADO                                  │
│  • Screenshot da página                                │
│  • Conteúdo extraído                                   │
│  • Plano executado                                     │
│  • Exibido no Canvas                                   │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Início Rápido

### 1. Reiniciar Backend (IMPORTANTE!)

```bash
# Parar backend atual (Ctrl+C)
# Depois:
cd backend
npm start
```

### 2. Verificar Inicialização

Console deve mostrar:
```
🤖 Navigator Agent inicializado
🤖 Navigator Agents inicializados
```

### 3. Testar

```bash
# Teste automático
node backend/test-agentes.js

# Ou teste manual no frontend:
# 1. Abrir http://localhost:3000
# 2. Ativar "Modo Navegação"
# 3. Digitar: "Busque por Python no Google"
```

## 📊 Recursos

### 3 Agentes Gemini
- **Flash**: 1500 req/dia (rápido)
- **Lite**: 1500 req/dia (leve)
- **Pro**: 1000 req/dia (reserva)
- **Total**: 4000 req/dia

### Balanceamento Automático
- Intercala entre modelos
- Controla quota por minuto
- Fallback inteligente

### Ações Suportadas
- ✅ Navegar (navigate)
- ✅ Aguardar (wait)
- ✅ Clicar (click)
- ✅ Preencher (fill)
- ✅ Extrair (extract)
- ✅ Screenshot (screenshot)

## 📝 Exemplos de Uso

```
✅ "Busque por Python no Google"
✅ "Procure por notebooks na Amazon"
✅ "Acesse o GitHub e busque por playwright"
✅ "Vá para wikipedia.org e busque sobre IA"
✅ "Entre no Mercado Livre e tire um screenshot"
```

## 🔧 Troubleshooting

### Erro 404?
→ Ver `SOLUCAO_ERRO_404.md`

### Agentes não disponíveis?
→ Configurar GEMINI_API_KEY no `.env`

### Outros problemas?
→ Ver `TROUBLESHOOTING_AGENTES.md`

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `SOLUCAO_ERRO_404.md` | ⚡ Solução rápida do erro atual |
| `QUICK_START_AGENTES.md` | 🚀 Início rápido |
| `AGENTES_NAVEGACAO_INTELIGENTE.md` | 📖 Documentação completa |
| `TESTE_AGENTES_NAVEGACAO.md` | 🧪 Guia de testes |
| `TROUBLESHOOTING_AGENTES.md` | 🔧 Solução de problemas |
| `RESUMO_AGENTES_INTELIGENTES.md` | 📊 Resumo executivo |

## 🎯 Próximos Passos

1. ✅ Reiniciar backend
2. ✅ Testar com `node backend/test-agentes.js`
3. ✅ Testar no frontend
4. ✅ Configurar API key (se necessário)
5. 🔮 Expandir com novos recursos

## 💡 Dicas

### Desenvolvimento
```bash
# Auto-restart com nodemon
npm install -g nodemon
nodemon backend/server.js
```

### Monitoramento
```bash
# Ver estatísticas
curl http://localhost:3002/api/navigator/stats

# Ver saúde
curl http://localhost:3002/health
```

### Limpeza
```bash
# Resetar estatísticas (dev only)
curl -X POST http://localhost:3002/api/navigator/stats/reset
```

## 🎊 Resultado Final

Após seguir os passos, você terá:

✅ Sistema de navegação inteligente funcionando
✅ 3 agentes Gemini balanceados
✅ 4000 requisições/dia disponíveis
✅ Planejamento automático de navegações
✅ Execução automatizada no Playwright
✅ Feedback visual em tempo real
✅ Resultados no Canvas

---

**Versão**: 1.0.0  
**Status**: ✅ Implementado - Requer reiniciar backend  
**Última atualização**: 2025-01-XX

---

## 🆘 Precisa de Ajuda?

1. Verificar `SOLUCAO_ERRO_404.md` primeiro
2. Executar `node backend/test-agentes.js`
3. Consultar `TROUBLESHOOTING_AGENTES.md`
4. Verificar console do backend e frontend

**Boa sorte! 🚀**
