/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║           ⚙️ LEVEL 2 — ENGINEERING OPS: COMO EU EXECUTO ⚙️                  ║
 * ║                                                                              ║
 * ║         "CÓDIGO BOM É CÓDIGO QUE FUNCIONA, É TESTADO, É VERSIONADO,         ║
 * ║          É DOCUMENTADO E PODE SER REPRODUZIDO."                             ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const LEVEL_2_ENGINEERING_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           ⚙️ LEVEL 2 — ENGINEERING OPS: COMO EU EXECUTO ⚙️                  ║
║                                                                              ║
║         "DA IDEIA AO DEPLOY. DO COMMIT AO PRODUCTION."                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
2.1 — VERSIONAMENTO (GIT)
═══════════════════════════════════════════════════════════════════════════════

BRANCHING STRATEGY

Git Flow (projetos com releases):
├── main         → Produção estável
├── develop      → Integração contínua
├── feature/*    → Novas funcionalidades
├── release/*    → Preparação de release
├── hotfix/*     → Correções urgentes
└── bugfix/*     → Correções não urgentes

Trunk-Based (projetos com deploy contínuo):
├── main         → Sempre deployável
├── feature/*    → Branches curtas (< 2 dias)
└── Feature flags para código incompleto

CONVENTIONAL COMMITS

Formato: <type>(<scope>): <description>

Types:
├── feat:     Nova funcionalidade
├── fix:      Correção de bug
├── docs:     Documentação
├── style:    Formatação (não afeta código)
├── refactor: Refatoração (não muda comportamento)
├── perf:     Melhoria de performance
├── test:     Adição/correção de testes
├── chore:    Tarefas de manutenção
├── ci:       Mudanças em CI/CD
└── revert:   Reverter commit anterior

Exemplos:
├── feat(auth): add JWT refresh token rotation
├── fix(payment): handle timeout on PIX generation
├── docs(api): update OpenAPI spec for v2 endpoints
├── refactor(user): extract validation to separate service
└── test(order): add integration tests for checkout flow

COMMIT MESSAGES

Boas práticas:
├── Imperativo: "Add feature" não "Added feature"
├── Primeira linha: máximo 72 caracteres
├── Corpo: explicar O QUÊ e POR QUÊ
├── Footer: referências (closes #123)
└── Um commit = uma mudança lógica

PULL REQUESTS

Checklist:
├── [ ] Título segue Conventional Commits
├── [ ] Descrição explica o contexto
├── [ ] Testes passando
├── [ ] Sem conflitos
├── [ ] Code review solicitado
├── [ ] Documentação atualizada
└── [ ] Breaking changes documentados

═══════════════════════════════════════════════════════════════════════════════
2.2 — ESTRUTURA DE PROJETO
═══════════════════════════════════════════════════════════════════════════════

LAYOUT UNIVERSAL

project-name/
├── .github/
│   └── workflows/        # CI/CD pipelines
├── src/
│   ├── core/             # Lógica de negócio
│   ├── infra/            # Implementações externas
│   ├── api/              # Controllers, routes
│   └── shared/           # Utilitários
├── tests/
│   ├── unit/             # Testes unitários
│   ├── integration/      # Testes de integração
│   └── e2e/              # Testes end-to-end
├── docs/
│   ├── api/              # Documentação da API
│   ├── architecture/     # Decisões arquiteturais
│   └── guides/           # Guias de uso
├── scripts/              # Scripts de automação
├── config/               # Configurações
├── .env.example          # Template de variáveis
├── .gitignore
├── README.md
├── CHANGELOG.md
├── LICENSE
└── package.json / go.mod / Cargo.toml

ARQUIVOS OBRIGATÓRIOS

README.md:
├── O que é o projeto
├── Como instalar
├── Como rodar
├── Como testar
├── Como contribuir
└── Licença

.env.example:
├── Todas as variáveis necessárias
├── Valores de exemplo (não reais)
├── Comentários explicativos
└── Agrupadas por categoria

.gitignore:
├── node_modules / vendor / target
├── .env (nunca commitar!)
├── Arquivos de IDE
├── Logs e caches
└── Build artifacts

═══════════════════════════════════════════════════════════════════════════════
2.3 — QUALIDADE CONTÍNUA
═══════════════════════════════════════════════════════════════════════════════

LINTING

Configuração obrigatória:
├── ESLint / Biome (JavaScript/TypeScript)
├── golangci-lint (Go)
├── Clippy (Rust)
├── Pylint / Ruff (Python)
└── Configuração compartilhada no repo

Regras mínimas:
├── Sem variáveis não utilizadas
├── Sem imports não utilizados
├── Formatação consistente
├── Complexidade ciclomática limitada
└── Sem console.log em produção

TESTES

Pirâmide de testes:
├── Unitários (70%) - Rápidos, isolados
├── Integração (20%) - Componentes juntos
└── E2E (10%) - Sistema completo

Cobertura mínima:
├── Código crítico: 90%+
├── Código geral: 70%+
├── Novos PRs: não reduzir cobertura
└── Branches e edge cases cobertos

CI PIPELINE

Stages obrigatórios:
├── 1. Lint - Verificar formatação
├── 2. Test - Rodar testes
├── 3. Build - Compilar/empacotar
├── 4. Security - Scan de vulnerabilidades
└── 5. Deploy - Apenas se tudo passar

Exemplo GitHub Actions:
name: CI
on: [push, pull_request]
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint
        run: npm run lint
      - name: Test
        run: npm run test:coverage
      - name: Build
        run: npm run build
      - name: Security
        run: npm audit --audit-level=high

═══════════════════════════════════════════════════════════════════════════════
2.4 — REPRODUTIBILIDADE
═══════════════════════════════════════════════════════════════════════════════

DEPENDÊNCIAS

Lock files obrigatórios:
├── package-lock.json (npm)
├── yarn.lock (yarn)
├── pnpm-lock.yaml (pnpm)
├── go.sum (Go)
├── Cargo.lock (Rust)
└── poetry.lock (Python)

Versionamento:
├── Dependências de produção: versões fixas
├── Dependências de dev: ranges permitidos
├── Atualização regular (Dependabot)
└── Changelog de breaking changes

CONTAINERIZAÇÃO

Dockerfile padrão:
├── Multi-stage build
├── Imagem base mínima (alpine, distroless)
├── Usuário não-root
├── Health check
└── Labels de metadata

docker-compose.yml:
├── Todos os serviços necessários
├── Volumes para persistência
├── Networks isoladas
├── Variáveis de ambiente
└── Profiles para dev/test/prod

DOCUMENTAÇÃO MÍNIMA

Para rodar do zero:
├── 1. Clone o repositório
├── 2. Copie .env.example para .env
├── 3. Preencha as variáveis
├── 4. Execute docker-compose up
└── 5. Acesse http://localhost:3000

═══════════════════════════════════════════════════════════════════════════════
2.5 — AUTOMAÇÃO
═══════════════════════════════════════════════════════════════════════════════

SCRIPTS PADRÃO

package.json / Makefile:
├── dev       → Rodar em desenvolvimento
├── build     → Compilar para produção
├── test      → Rodar todos os testes
├── test:unit → Apenas unitários
├── test:e2e  → Apenas e2e
├── lint      → Verificar código
├── lint:fix  → Corrigir automaticamente
├── format    → Formatar código
├── clean     → Limpar artifacts
├── db:migrate → Rodar migrations
└── db:seed   → Popular banco

HOOKS

Pre-commit (obrigatório):
├── Lint
├── Format
├── Testes unitários rápidos
└── Verificar secrets

Pre-push:
├── Testes completos
├── Build
└── Security scan

═══════════════════════════════════════════════════════════════════════════════
2.6 — CHANGELOG E RELEASES
═══════════════════════════════════════════════════════════════════════════════

SEMANTIC VERSIONING

MAJOR.MINOR.PATCH (ex: 2.1.3)
├── MAJOR: Breaking changes
├── MINOR: Novas features (backward compatible)
└── PATCH: Bug fixes (backward compatible)

CHANGELOG.md

Formato:
## [2.1.0] - 2024-01-15
### Added
- Nova feature X
### Changed
- Comportamento Y modificado
### Fixed
- Bug Z corrigido
### Deprecated
- Feature W será removida em 3.0
### Removed
- Feature V removida
### Security
- Vulnerabilidade corrigida

═══════════════════════════════════════════════════════════════════════════════

"CÓDIGO BOM É CÓDIGO QUE FUNCIONA, É TESTADO, É VERSIONADO,
 É DOCUMENTADO E PODE SER REPRODUZIDO."

Este manifesto define como eu EXECUTO.
Ele garante que todo código seja profissional.
Ele transforma ideias em software real.

                    — Engineering Ops, Level 2
`;

// Level 2 está SEMPRE ativo - é como o agente executa
export function shouldEnableEngineering(): boolean {
  return true; // Sempre ativo
}

export default LEVEL_2_ENGINEERING_MANIFEST;
