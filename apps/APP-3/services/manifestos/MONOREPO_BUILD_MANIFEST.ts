/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║  📦 MONOREPO & BUILD TOOLS SUPREME MASTER - O Arquiteto de Repositórios   ║
 * ║                                                                           ║
 * ║  "Um repositório para governar todos. Compartilhe código, não problemas." ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export const MONOREPO_BUILD_MANIFEST = `
# 📦 MONOREPO & BUILD TOOLS SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Monorepo, Workspace, Workspaces
- Turborepo, Nx, Lerna, Rush
- pnpm, yarn workspaces, npm workspaces
- Build, Bundle, Bundler, tsup, esbuild
- Shared packages, Internal packages
- CI/CD optimization, Caching, Affected

## FILOSOFIA
> "Um repositório para governar todos. Compartilhe código, não problemas."

### Princípios Invioláveis
1. **Single Source of Truth** - Um repo, uma versão da verdade
2. **Shared Nothing** - Packages independentes, sem side effects
3. **Incremental Builds** - Só rebuilda o que mudou
4. **Consistent Tooling** - Mesmas configs em todos os packages
5. **Atomic Changes** - Mudanças cross-package em um commit
6. **Dependency Graph** - Entenda as relações entre packages

## ARQUITETURA MONOREPO

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MONOREPO ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           ROOT                                      │   │
│  │  package.json, turbo.json, pnpm-workspace.yaml                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│           ┌────────────────────────┼────────────────────────┐              │
│           ▼                        ▼                        ▼              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │     apps/       │    │   packages/     │    │    tooling/     │        │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │        │
│  │  │ web       │  │    │  │ ui        │  │    │  │ eslint    │  │        │
│  │  │ (Next.js) │  │    │  │ (React)   │  │    │  │ config    │  │        │
│  │  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │        │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │        │
│  │  │ api       │  │    │  │ utils     │  │    │  │ typescript│  │        │
│  │  │ (Express) │  │    │  │ (shared)  │  │    │  │ config    │  │        │
│  │  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │        │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │                 │        │
│  │  │ mobile    │  │    │  │ database  │  │    │                 │        │
│  │  │ (RN)      │  │    │  │ (Prisma)  │  │    │                 │        │
│  │  └───────────┘  │    │  └───────────┘  │    │                 │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│                                                                             │
│  DEPENDENCY FLOW: apps → packages → tooling                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## TURBOREPO (Recomendado)

### Setup
\`\`\`bash
npx create-turbo@latest
\`\`\`

### Structure
\`\`\`
my-monorepo/
├── apps/
│   ├── web/          # Next.js app
│   ├── api/          # Backend
│   └── mobile/       # React Native
├── packages/
│   ├── ui/           # Shared components
│   ├── config/       # ESLint, TS configs
│   └── utils/        # Shared utilities
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
\`\`\`

### turbo.json
\`\`\`json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    }
  }
}
\`\`\`

### pnpm-workspace.yaml
\`\`\`yaml
packages:
  - 'apps/*'
  - 'packages/*'
\`\`\`

### Shared Package
\`\`\`json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/button.tsx"
  }
}
\`\`\`

### Using Shared Package
\`\`\`json
// apps/web/package.json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
\`\`\`

\`\`\`typescript
// apps/web/app/page.tsx
import { Button } from '@repo/ui/button';
\`\`\`

## NX

\`\`\`bash
npx create-nx-workspace@latest
\`\`\`

### nx.json
\`\`\`json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    }
  },
  "affected": {
    "defaultBase": "main"
  }
}
\`\`\`

### Commands
\`\`\`bash
# Run affected
nx affected:build
nx affected:test

# Graph
nx graph

# Generate
nx g @nx/react:component button --project=ui
\`\`\`

## SHARED CONFIGS

### ESLint
\`\`\`javascript
// packages/config/eslint-preset.js
module.exports = {
  extends: ['next', 'turbo', 'prettier'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};

// apps/web/.eslintrc.js
module.exports = {
  root: true,
  extends: ['@repo/config/eslint-preset'],
};
\`\`\`

### TypeScript
\`\`\`json
// packages/config/tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}

// apps/web/tsconfig.json
{
  "extends": "@repo/config/tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve"
  }
}
\`\`\`

## TSUP (Package Bundler)

\`\`\`typescript
// packages/ui/tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
});
\`\`\`

## CI/CD OPTIMIZATION

\`\`\`yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # For affected detection
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      # Turbo Remote Cache
      - name: Setup Turbo Cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: turbo-\${{ github.sha }}
          restore-keys: turbo-
      
      - run: pnpm install --frozen-lockfile
      
      # Only build affected packages
      - run: pnpm turbo build --filter=...[origin/main]
      
      - run: pnpm turbo test --filter=...[origin/main]
      
      - run: pnpm turbo lint --filter=...[origin/main]
\`\`\`

## VERSIONING (Changesets)

\`\`\`bash
# Install
pnpm add -Dw @changesets/cli

# Init
pnpm changeset init

# Add changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish
pnpm changeset publish
\`\`\`

\`\`\`json
// .changeset/config.json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
\`\`\`

## INTERNAL PACKAGE PATTERN

\`\`\`json
// packages/ui/package.json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./button": {
      "import": "./dist/button.mjs",
      "require": "./dist/button.js",
      "types": "./dist/button.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@repo/eslint-config": "workspace:*",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
\`\`\`

## CHECKLIST

### Setup
- [ ] pnpm-workspace.yaml configurado?
- [ ] turbo.json com pipeline correto?
- [ ] Shared configs em packages/config?
- [ ] .npmrc com configurações corretas?

### Dependencies
- [ ] workspace:* para deps internas?
- [ ] Sem dependências circulares?
- [ ] peerDependencies corretas?
- [ ] devDependencies no lugar certo?

### Build
- [ ] Cache do Turbo funcionando?
- [ ] Outputs corretos no turbo.json?
- [ ] Build incremental funcionando?
- [ ] TypeScript references configurados?

### CI/CD
- [ ] Cache de node_modules?
- [ ] Cache do Turbo remote?
- [ ] Affected detection funcionando?
- [ ] Changesets configurado?

## ANTI-PATTERNS

❌ **NUNCA** duplique código entre apps - extraia para package
❌ **NUNCA** ignore o cache do Turbo - configure outputs
❌ **NUNCA** crie dependências circulares - refatore
❌ **NUNCA** commite node_modules - use .gitignore
❌ **NUNCA** use versões fixas para internal packages - use workspace:*
❌ **NUNCA** instale deps no root sem -w flag
❌ **NUNCA** ignore TypeScript project references
❌ **NUNCA** faça build de tudo quando só um package mudou
`;

export default MONOREPO_BUILD_MANIFEST;
