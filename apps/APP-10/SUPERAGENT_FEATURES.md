# 🚀 Aether Prime - Agente Autônomo Inteligente

## ⌨️ Atalhos de Teclado Globais (v5.2)

| Atalho | Ação |
|--------|------|
| `Ctrl+S` | Salvar arquivo atual |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+`` ` | Toggle terminal |
| `Ctrl+Shift+P` | Focar no chat (command palette) |
| `F5` | Recarregar preview |
| `Escape` | Fechar fullscreen/modais |
| `Alt+1-9` | Trocar abas do terminal |
| `Alt+T` | Nova aba de processo |
| `Alt+W` | Fechar aba do terminal |

## 🎨 Novas Features de UI (v5.2)

### Quick Actions no Chat
Botões rápidos que aparecem após a primeira mensagem:
- 🐛 **Fix Errors** - Corrigir erros no código
- ✨ **Improve UI** - Melhorar design e estilo
- ⚡ **Add Features** - Adicionar mais funcionalidades
- 📝 **Refactor** - Refatorar e otimizar código

### Histórico de Prompts
- Salva automaticamente os últimos 20 prompts
- Botão de histórico no chat (ícone de relógio)
- Clique para reutilizar prompts anteriores
- Persistido no localStorage

### Preview Responsivo
- Botões de viewport: Desktop, Tablet, Mobile
- Preview se adapta ao tamanho selecionado
- Console integrado para ver logs do app
- Indicador de conexão com o servidor

### Templates de Projeto
Sugestões na tela inicial:
- 🚀 Landing Page
- ✅ Todo App
- 📊 Dashboard
- 💬 Chat UI

## 🧠 NOVO: Comportamento Autônomo (v5.1)

### O que mudou?
O agente agora é **verdadeiramente autônomo**. Ele não apenas conversa - ele **executa**.

### Comportamento Anterior (Problemático):
```
Usuário: "Crie um app de todo"
IA: "Posso criar um app de todo para você. Gostaria que eu procedesse?"
```

### Comportamento Novo (Autônomo):
```
Usuário: "Crie um app de todo"
IA: *cria todos os arquivos*
    *instala dependências*
    *inicia o servidor*
    "✅ App de todo criado e rodando! Veja o preview."
```

### Recursos de Autonomia:

1. **Auto-Boot do Runtime**
   - Quando o agente precisa executar comandos, o runtime inicia automaticamente
   - Não precisa mais clicar no botão "Boot" manualmente

2. **Execução Completa**
   - Cria TODOS os arquivos de uma vez
   - Instala dependências automaticamente
   - Inicia o servidor automaticamente

3. **Self-Healing**
   - Se algo falha, o agente tenta corrigir
   - Tenta abordagens alternativas
   - Não desiste facilmente

4. **Pre-Boot Inteligente**
   - Detecta pedidos de criação de projeto
   - Inicia o boot em background enquanto processa
   - Reduz tempo de espera

5. **Auto-Correção de Erros** (NOVO!)
   - Detecta padrões de erro comuns
   - Sugere correções automáticas
   - Retry automático com flags alternativas (ex: --legacy-peer-deps)

6. **Feedback Visual Melhorado** (NOVO!)
   - Status detalhado do que o agente está fazendo
   - Badges coloridos por tipo de operação (FILE, NPM, TERMINAL)
   - Animações suaves de progresso

7. **Preview Local Embutido** (NOVO!)
   - Mostra o app rodando dentro do iframe
   - Indicador de conexão (conectado/desconectado)
   - Auto-retry quando o servidor demora para iniciar
   - Botão para abrir em nova aba

8. **Health Check Automático** (NOVO!)
   - Ferramenta `check_app_health` verifica:
     - Status do runtime
     - Se o servidor está respondendo
     - Arquivos essenciais (package.json, App, main)
     - Erros pendentes
   - Ferramenta `get_error_log` mostra histórico de erros

9. **Tracking de Erros Inteligente** (NOVO!)
   - Todos os erros são registrados automaticamente
   - Sistema detecta padrões e sugere correções
   - Histórico de tentativas de correção

10. **Terminal PowerShell Real com PTY** (NOVO!)
    - Terminal PTY real usando `node-pty` (igual VS Code/Kiro)
    - PowerShell interativo completo
    - Suporte a cores ANSI 256 e TrueColor
    - Resize dinâmico do terminal
    - Scrollback de 10.000 linhas
    - Links clicáveis para arquivos e URLs
    - Fallback automático se node-pty não estiver disponível

11. **Gerenciador de Processos** (NOVO!)
    - Múltiplos processos em abas separadas
    - Reutilização inteligente de processos existentes
    - Não abre múltiplos servidores na mesma porta
    - Parar/reiniciar processos individualmente
    - Ver output de cada processo
    - API completa para gerenciamento:
      - `GET /api/processes` - listar processos
      - `POST /api/processes/start` - iniciar processo
      - `POST /api/processes/:id/stop` - parar processo
      - `DELETE /api/processes/:id` - remover processo
      - `POST /api/processes/stop-all` - parar todos

12. **Terminal com Abas (TabbedTerminal)** (NOVO!)
    - Interface de terminal com múltiplas abas (estilo Kiro/VS Code)
    - Aba principal "Shell" para comandos interativos
    - Abas automáticas para cada processo gerenciado
    - Indicadores visuais de status (running/stopped/error)
    - Badge de porta quando detectada (ex: `:5173`)
    - Botão para abrir URL do processo em nova aba
    - WebSocket para output em tempo real
    - Formulário inline para iniciar novos processos
    - Botões de controle: parar, reiniciar, Ctrl+C, limpar, refresh
    - Input direto para processos (digite no terminal do processo)
    - Atalhos de teclado:
      - `Alt+1-9` - Trocar entre abas
      - `Alt+T` - Nova aba de processo
      - `Alt+W` - Fechar aba atual
    - Botão "Stop All" para parar todos os processos de uma vez

## 🎁 Sistema de Bundle (NOVO!)

### O que é?
A IA agora pode gerar projetos completos em um único "bundle" que é automaticamente parseado e distribuído para as pastas corretas.

### Formato do Bundle
```
\`\`\`aether-bundle
===FILE: package.json===
{
  "name": "my-app",
  "dependencies": { ... }
}
===END_FILE===

===FILE: src/App.jsx===
import React from 'react'
export default function App() { ... }
===END_FILE===

===FILE: src/components/Button.jsx===
export const Button = () => { ... }
===END_FILE===
\`\`\`
```
então o sistema Aparentemente está funcionando nele conseguir rodar o aplicativo  só que  o preview não apareceu dentro do webcomtem né mesmo rodando o local sabe vamos usar o Web container como fosse um mini browser dentro do meu sistema para que ele consiga executar  os  sabe aparecer para mim em tempo real aqui na tela não é o que foi criado nem aí dentro da opção também né de eu abrir  em outra tela né em tela cheia mas usando o sistema local sabe é possível fazer isso  sabe colocar  o prevê no web contém né mas tá rodando no local sabe  dá poder aparecer aqui dentro do site sabe que já tem we contendo senão eu teria que tirar do sistema e eu não quero eu também queria ter o previo sabe dentro do meu site eu acho que com web contém nessa possível  é que ele dá para rodar um frontinho ele completo né dentro dele de boa




### Como Funciona
1. A IA gera o bundle com todos os arquivos do projeto
2. O sistema detecta automaticamente o formato `aether-bundle`
3. Parseia e extrai cada arquivo
4. Cria os arquivos nas pastas corretas
5. Se tiver package.json, auto-instala dependências
6. Inicia o dev server automaticamente

### Benefícios
- ✅ Projeto completo em UMA resposta
- ✅ Menos chamadas de API
- ✅ Arquivos organizados automaticamente
- ✅ Dependências instaladas automaticamente
- ✅ Pensamento coeso sobre o projeto inteiro

## ⚡ Otimizações de API (v2.0)

### Problema Resolvido
O sistema estava fazendo muitas chamadas API, causando:
- Rate limiting
- Custos elevados
- Latência excessiva

### Soluções Implementadas

#### 1. System Prompt Otimizado
- Instruções claras para o modelo pensar mais e chamar menos ferramentas
- Diretiva de "Single-Call Execution" - completar tarefas em uma única resposta
- Padrões proibidos vs padrões otimizados documentados

#### 2. Configurações do Modelo
- `thinkingBudget`: 32768 (aumentado para mais raciocínio interno)
- `temperature`: 0.5 (reduzido para respostas mais focadas)
- `MAX_TURNS`: 8 (reduzido de 20 para forçar eficiência)

#### 3. Ferramentas Categorizadas por Custo

**SEM CUSTO DE API:**
- Operações de arquivo (read, write, delete, move)
- Terminal (run_command, install_package)
- Edição local (insert_code, wrap_code, rename_symbol)
- Memória (remember, recall)

**CUSTO DE 1 API CALL (usar com moderação):**
- `smart_edit` - Edição com IA
- `analyze_code` - Análise profunda
- `debug_error` - Debug com IA
- `generate_tests` - Geração de testes

## 🛠️ Ferramentas Disponíveis

### � POperações de Arquivo (PREFERIR BATCH)
| Ferramenta | Descrição |
|------------|-----------|
| `write_multiple_files` | **SEMPRE USE** para múltiplos arquivos |
| `read_multiple_files` | **SEMPRE USE** para ler múltiplos arquivos |
| `write_file` | Apenas para arquivo único |
| `read_file` | Apenas quando precisa de UM arquivo |
| `replace_string` | **PREFERIDO** para edições pequenas |
| `delete_file` | Deletar arquivo/pasta |
| `move_file` | Mover/renomear |

### 💻 Terminal & Pacotes
| Ferramenta | Descrição |
|------------|-----------|
| `run_command` | Executar comando shell |
| `install_package` | npm install (pode instalar múltiplos: "pkg1 pkg2") |
| `uninstall_package` | npm uninstall |
| `git` | Comandos git |

### ✏️ Edição de Código (Local - Sem Custo)
| Ferramenta | Descrição |
|------------|-----------|
| `insert_code` | Inserir código em linha específica |
| `wrap_code` | Envolver código (try-catch, useEffect, etc) |
| `rename_symbol` | Renomear variável/função no arquivo |

### 🧪 Testes (Terminal - Sem Custo)
| Ferramenta | Descrição |
|------------|-----------|
| `run_tests` | Executar testes |
| `check_types` | Verificação TypeScript |
| `lint_fix` | ESLint com auto-fix |

### 🤖 Ferramentas com IA (⚠️ Custo de API)
| Ferramenta | Descrição |
|------------|-----------|
| `smart_edit` | Edição com linguagem natural |
| `analyze_code` | Análise profunda de código |
| `debug_error` | Análise de erro com sugestões |
| `generate_tests` | Gerar testes automaticamente |

### 🧠 Memória (Sem Custo)
| Ferramenta | Descrição |
|------------|-----------|
| `remember` | Armazenar informação |
| `recall` | Recuperar informação |
| `summarize_changes` | Resumo das mudanças |

### � aControle do Sistema (NOVO!)
| Ferramenta | Descrição |
|------------|-----------|
| `reset_project` | 🔄 Reseta TUDO: arquivos, container, memória. Começa do zero. |
| `restart_server` | 🔄 Reinicia o dev server (útil quando trava) |
| `clear_terminal` | Limpa o terminal |

**Quando usar `reset_project`:**
- Projeto está quebrado além do reparo
- Usuário quer começar do zero
- Muitos erros acumulados
- Precisa de um fresh start

**Exemplo:**
```
"O projeto está muito bagunçado, vamos resetar e começar do zero"
→ IA chama reset_project(confirm: true)
→ Tudo é limpo
→ IA pode criar novo projeto com bundle
```

## 📋 Padrões de Uso Eficiente

### ✅ FAÇA (Eficiente)
```
1. Planeje mentalmente TODAS as etapas antes de agir
2. Use write_multiple_files para criar vários arquivos de uma vez
3. Use replace_string para edições pequenas
4. Raciocine sobre o código ao invés de chamar analyze_code
5. Complete a tarefa inteira em UMA resposta
```

### ❌ NÃO FAÇA (Desperdiça API)
```
1. Ler arquivo, depois editar em chamadas separadas
2. Criar arquivos um por um
3. Chamar analyze_code quando pode entender lendo
4. Múltiplas edições pequenas ao invés de uma completa
5. Perguntar "devo continuar?" - apenas faça
```

## 🎯 Fluxo Otimizado

```
TAREFA → PENSAR → PLANEJAR → EXECUTAR TUDO → CONCLUIR
         (interno)  (interno)   (1 resposta)
```

O modelo agora usa seu "thinking budget" expandido para:
1. Entender completamente a tarefa
2. Planejar todas as etapas necessárias
3. Executar todas as ferramentas em uma única resposta
4. Minimizar o número de turnos do agent loop


## 🖥️ Modo Local - PowerShell Real (NOVO!)

### O que é?
O modo local substitui o WebContainer (sandbox) por execução real no seu sistema, dando ao agente acesso ao PowerShell nativo do Windows.

### Diferenças

| Feature | WebContainer | Local Mode |
|---------|-------------|------------|
| Shell | jsh (limitado) | PowerShell real |
| File System | Virtual (sandbox) | Sistema real |
| Packages | npm (sandbox) | npm real |
| Git | Limitado | Completo |
| Segurança | Isolado | ⚠️ Acesso total |
| Performance | Mais lento | Nativo |

### Como Ativar

**Opção 1: Script Automático**
```powershell
.\start-local.ps1
# ou
.\start-local.bat
```

**Opção 2: Manual**
```powershell
# Terminal 1 - Backend
cd server && npm install && npm run dev

# Terminal 2 - Frontend
$env:VITE_LOCAL_MODE="true"
npm run dev
```

### Arquitetura

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Frontend      │◄──────────────────►│   Backend       │
│   (React)       │     REST API       │   (Node.js)     │
│   :5173         │                    │   :3001         │
└─────────────────┘                    └────────┬────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   PowerShell    │
                                       │   (Real)        │
                                       └─────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────┐
                                       │   workspace/    │
                                       │   (Local Files) │
                                       └─────────────────┘
```

### Indicadores Visuais

Quando em modo local, você verá:
- Badge **"PowerShell"** no header
- Badge **"LOCAL"** no terminal
- Terminal com cor roxa ao invés de azul
- Mensagem de boas-vindas diferente

### ⚠️ Aviso de Segurança

O modo local dá ao agente acesso real ao seu sistema:
- Pode executar qualquer comando PowerShell
- Pode ler/escrever arquivos no workspace
- Pode instalar pacotes npm reais
- Pode acessar a rede

**Use com cuidado e apenas em ambientes de desenvolvimento!**

### API do Backend

**File System:**
- `POST /api/fs/read` - Ler arquivo
- `POST /api/fs/write` - Escrever arquivo
- `POST /api/fs/delete` - Deletar arquivo
- `POST /api/fs/rename` - Renomear arquivo
- `POST /api/fs/list` - Listar diretório

**Execução:**
- `POST /api/exec` - Executar comando PowerShell

**Dev Server:**
- `POST /api/server/start` - Iniciar servidor
- `POST /api/server/stop` - Parar servidor
- `GET /api/server/status` - Status do servidor

**WebSocket:**
- `shell:start` - Iniciar shell interativo
- `shell:input` - Enviar input
- `shell:output` - Receber output
