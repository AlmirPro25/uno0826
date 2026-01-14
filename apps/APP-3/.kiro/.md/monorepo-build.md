# 📦 Monorepo & Build Tools Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Monorepo, Workspace, Workspaces
- Turborepo, Nx, Lerna, Rush
- pnpm, yarn workspaces, npm workspaces

## FILOSOFIA
> "Um repositório para governar todos. Compartilhe código, não problemas."

## STACK RECOMENDADA
- **Build**: Turborepo (simples) ou Nx (enterprise)
- **Package Manager**: pnpm (mais rápido)
- **Bundler**: tsup, esbuild

## ESTRUTURA
```
monorepo/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── ui/
│   ├── config/
│   └── utils/
├── turbo.json
└── pnpm-workspace.yaml
```

## BOAS PRÁTICAS
- Compartilhe configs (ESLint, TS)
- Use workspace:* para deps internas
- Configure cache corretamente
- Otimize CI/CD com affected

## ANTI-PATTERNS
❌ **NUNCA** duplique código entre apps
❌ **NUNCA** ignore o cache do Turbo
❌ **NUNCA** crie dependências circulares
