# 🧩 Browser Extensions Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Browser Extension, Chrome Extension, Firefox Add-on
- Manifest V3, Content Script, Background Worker
- Popup, Options Page, Side Panel
- WebExtensions API

## FILOSOFIA
> "Extensões ampliam o browser sem comprometer segurança."

## ARQUITETURA
```
Extension/
├── manifest.json      # Configuração e permissões
├── background.js      # Service Worker (MV3)
├── content.js         # Injeta em páginas
├── popup/             # UI do popup
└── options/           # Página de configurações
```

## MANIFEST V3 (Obrigatório Chrome)
- Service Workers ao invés de background pages
- Declarative Net Request ao invés de webRequest
- Promises ao invés de callbacks
- Host permissions explícitas

## BOAS PRÁTICAS
- Peça permissões mínimas
- Use storage.sync para settings
- Implemente CSP rigoroso
- Teste em múltiplos browsers
- Suporte modo escuro

## ANTI-PATTERNS
❌ **NUNCA** peça permissões desnecessárias
❌ **NUNCA** injete scripts em todas as páginas
❌ **NUNCA** armazene dados sensíveis sem criptografia
