# 📁 Estrutura do Projeto

## 🗂️ Organização de Pastas

```
ai-web-weaver/
│
├── 📄 README.md                    # Documentação principal
├── 📄 LICENSE                      # Licença MIT
├── 📄 .gitignore                   # Arquivos ignorados
├── 📄 .env.example                 # Exemplo de configuração
├── 📄 package.json                 # Dependências
│
├── 📁 services/                    # 💼 Serviços principais
│   ├── GeminiService.ts            # Serviço Gemini (núcleo)
│   ├── ExcellenceCore.ts           # Sistema de excelência
│   ├── SingleFileAppManifest.ts    # Manifesto single-file apps
│   ├── GeminiServiceEnhanced.ts    # Serviço aprimorado
│   ├── ApiKeyManager.ts            # Gerenciador de API keys
│   ├── HTMLQualityGuard.ts         # Guardião de qualidade
│   ├── AdvancedResearch.ts         # Pesquisa avançada
│   ├── PixabayService.ts           # Integração Pixabay
│   └── AndroidWebViewGenerator.ts  # Gerador Android
│
├── 📁 components/                  # 🎨 Componentes React
│   ├── App.tsx                     # Componente principal
│   ├── ContextualAiPanel.tsx       # Painel de IA contextual
│   ├── BrainstormingModal.tsx      # Modal de brainstorming
│   ├── ThemeCustomizerModal.tsx    # Customizador de tema
│   └── ProjectTaskManager.tsx      # Gerenciador de tarefas
│
├── 📁 store/                       # 📦 Estado global
│   └── useAppStore.ts              # Zustand store
│
├── 📁 src/                         # 🔧 Código fonte
│   └── utils/                      # Utilitários
│       ├── GeminiEnhancer.ts       # Melhorias de código
│       ├── SimulationDetector.ts   # Detector de simulações
│       └── CodeQualityChecker.ts   # Verificador de qualidade
│
├── 📁 docs/                        # 📚 Documentação
│   ├── COMECE_AQUI.md              # ⭐ Guia ultra rápido
│   ├── PRONTO_PARA_GITHUB.md       # ⭐ Checklist GitHub
│   ├── EXCELLENCE_CORE_INTEGRADO.md # Sistema de excelência
│   ├── SINGLE_FILE_APP_INTEGRADO.md # Apps portáteis
│   ├── INDICE_DOCUMENTACAO.md      # Índice completo
│   ├── GUIA_GITHUB.md              # Guia GitHub completo
│   ├── COMO_USAR_GITHUB.md         # Guia rápido GitHub
│   ├── COMANDOS_GIT_UTEIS.md       # Referência Git
│   ├── CONTRIBUTING.md             # Como contribuir
│   └── ... (80+ documentos)
│
├── 📁 tests/                       # 🧪 Testes e demos
│   ├── README.md                   # Índice de testes
│   ├── test-excellence-core.html   # ⭐ Demo Excellence Core
│   ├── test-single-file-app-integration.html # ⭐ Demo Single-File
│   ├── test-sistema-completo.html  # Sistema completo
│   ├── test-image-generation-fixed.html # Sistema de imagens
│   ├── test-mobile-responsive.html # Responsividade
│   └── ... (16 arquivos de teste)
│
└── 📁 scripts/                     # 🚀 Scripts auxiliares
    ├── setup-github.sh             # Setup Linux/Mac
    └── setup-github.bat            # Setup Windows
```

## 📂 Descrição das Pastas

### 💼 services/
Contém todos os serviços principais do sistema:
- **GeminiService.ts**: Núcleo da integração com Gemini API
- **ExcellenceCore.ts**: Sistema de avaliação de excelência
- **SingleFileAppManifest.ts**: Geração de apps portáteis
- Outros serviços especializados

### 🎨 components/
Componentes React da interface:
- Componente principal (App.tsx)
- Painéis e modais
- Gerenciadores de funcionalidades

### 📦 store/
Gerenciamento de estado global:
- Zustand store com todo o estado da aplicação

### 🔧 src/utils/
Utilitários e helpers:
- Melhorias de código
- Detectores e validadores
- Funções auxiliares

### 📚 docs/
**Toda a documentação do projeto** (80+ documentos):
- Guias de início rápido
- Documentação técnica
- Tutoriais e exemplos
- Guias de contribuição

### 🧪 tests/
**Todos os testes e demos** (16 arquivos):
- Demos visuais HTML
- Testes de integração
- Exemplos práticos

### 🚀 scripts/
Scripts de automação:
- Setup para GitHub
- Utilitários de desenvolvimento

## 🎯 Arquivos Importantes na Raiz

### Documentação
- **README.md** - Documentação principal (comece aqui!)
- **LICENSE** - Licença MIT
- **ESTRUTURA_PROJETO.md** - Este arquivo

### Configuração
- **.env.example** - Exemplo de variáveis de ambiente
- **.gitignore** - Arquivos ignorados pelo Git
- **package.json** - Dependências do projeto
- **tsconfig.json** - Configuração TypeScript
- **vite.config.ts** - Configuração Vite

## 🚀 Navegação Rápida

### Para Começar
1. Leia: [README.md](./README.md)
2. Siga: [docs/COMECE_AQUI.md](./docs/COMECE_AQUI.md)
3. Configure: `.env` (use `.env.example` como base)

### Para Desenvolver
1. Instale: `npm install`
2. Execute: `npm run dev`
3. Teste: Abra arquivos em `tests/`

### Para Contribuir
1. Leia: [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)
2. Veja: [docs/GUIA_GITHUB.md](./docs/GUIA_GITHUB.md)

### Para Entender o Sistema
1. Excellence Core: [docs/EXCELLENCE_CORE_INTEGRADO.md](./docs/EXCELLENCE_CORE_INTEGRADO.md)
2. Single-File Apps: [docs/SINGLE_FILE_APP_INTEGRADO.md](./docs/SINGLE_FILE_APP_INTEGRADO.md)
3. Índice completo: [docs/INDICE_DOCUMENTACAO.md](./docs/INDICE_DOCUMENTACAO.md)

## 📊 Estatísticas

- **Serviços:** 10+ arquivos
- **Componentes:** 5+ arquivos
- **Documentação:** 80+ arquivos
- **Testes:** 16 arquivos
- **Total de linhas:** ~50.000+

## 🎨 Convenções

### Nomenclatura de Arquivos
- **Componentes:** PascalCase (App.tsx)
- **Serviços:** PascalCase (GeminiService.ts)
- **Utilitários:** camelCase (geminiEnhancer.ts)
- **Documentação:** UPPER_SNAKE_CASE.md
- **Testes:** kebab-case.html (test-excellence-core.html)

### Organização
- Código TypeScript em `services/`, `components/`, `src/`
- Documentação em `docs/`
- Testes em `tests/`
- Scripts em raiz ou `scripts/`

## 🔍 Busca Rápida

### Procurando algo específico?

**Excellence Core:**
- Código: `services/ExcellenceCore.ts`
- Docs: `docs/EXCELLENCE_CORE_INTEGRADO.md`
- Demo: `tests/test-excellence-core.html`

**Single-File Apps:**
- Código: `services/SingleFileAppManifest.ts`
- Docs: `docs/SINGLE_FILE_APP_INTEGRADO.md`
- Demo: `tests/test-single-file-app-integration.html`

**Gemini Service:**
- Código: `services/GeminiService.ts`
- Docs: `docs/GEMINI_ENHANCED_INSTRUCTIONS.md`

**GitHub:**
- Guia rápido: `docs/COMECE_AQUI.md`
- Checklist: `docs/PRONTO_PARA_GITHUB.md`
- Scripts: `setup-github.sh` / `setup-github.bat`

## 📝 Notas

- Todos os arquivos `.md` estão em `docs/` (exceto README.md e LICENSE)
- Todos os testes `.html` estão em `tests/`
- Código fonte está organizado por tipo (services, components, utils)
- Documentação está categorizada e indexada

---

**Última atualização:** 2025-11-13

**Estrutura limpa e organizada!** ✨
