# 🚀 Instalação do Playwright

## Passo a Passo

### 1. Instalar Dependências

```bash
cd backend
npm install playwright
```

### 2. Instalar Navegadores

```bash
npx playwright install chromium
```

Isso vai baixar o Chromium (~150MB).

**Opcional**: Instalar todos os navegadores
```bash
npx playwright install
```

---

### 3. Reiniciar Backend

```bash
node server.js
```

Você deve ver:
```
╔════════════════════════════════════════════════════════╗
║  🤖 PROX AI STUDIO - BACKEND LIMPO                    ║
╠════════════════════════════════════════════════════════╣
║  Status: ✅ Running                                    ║
║  Port: 3002                                            ║
║  Frontend: http://localhost:3000                    ║
║                                                        ║
║  ⚠️  AUTOMAÇÃO DE PC: DESATIVADA                      ║
║  ✅  Chat com IA: ATIVO                               ║
║  ✅  Busca Web: ATIVO                                 ║
║  ✅  Navegador: ATIVO                                 ║
╚════════════════════════════════════════════════════════╝
```

---

## 🧪 Testar Instalação

### Teste 1: Criar Sessão

```bash
curl -X POST http://localhost:3002/api/browser/session
```

**Esperado**:
```json
{
  "sessionId": "session_1234567890_abc123",
  "message": "Sessão criada com sucesso"
}
```

Se funcionar, o Playwright está instalado corretamente! ✅

---

### Teste 2: Buscar no Google

```bash
curl -X POST http://localhost:3002/api/browser/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Playwright"}'
```

**Esperado**:
```json
{
  "query": "Playwright",
  "results": [
    {
      "title": "Playwright: Fast and reliable...",
      "url": "https://playwright.dev",
      "snippet": "Playwright enables reliable..."
    }
  ]
}
```

---

## ⚠️ Problemas Comuns

### Erro: "Executable doesn't exist"

**Solução**:
```bash
npx playwright install chromium
```

---

### Erro: "Cannot find module 'playwright'"

**Solução**:
```bash
cd backend
npm install playwright
```

---

### Erro: "Browser closed unexpectedly"

**Solução**: Adicionar mais memória ou usar headless mode (já está ativado).

---

### Windows: Erro de permissão

**Solução**: Executar como Administrador ou desabilitar antivírus temporariamente.

---

## 📊 Requisitos do Sistema

| Requisito | Mínimo | Recomendado |
|-----------|--------|-------------|
| RAM | 2GB | 4GB+ |
| Disco | 500MB | 1GB+ |
| CPU | 2 cores | 4 cores+ |
| OS | Windows 10+ | Windows 11 |

---

## 🎯 Próximos Passos

Após instalação:

1. ✅ Testar endpoints
2. ✅ Integrar com Canvas
3. ✅ Criar componente de navegação
4. ✅ Adicionar ao chat

---

## 📚 Documentação

- [Playwright Docs](https://playwright.dev)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Navegador Integrado](./NAVEGADOR_INTEGRADO.md)

---

## ✅ Checklist

- [ ] `npm install playwright`
- [ ] `npx playwright install chromium`
- [ ] Backend reiniciado
- [ ] Teste de sessão funcionando
- [ ] Teste de busca funcionando

**Tudo pronto!** 🎉
