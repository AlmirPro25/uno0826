<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🤖 Gemini Live Companion

**Seu assistente de IA revolucionário que vê sua tela, ouve sua voz e conversa em tempo real**

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5--Pro-8E75B2?logo=google)](https://ai.google.dev/)

</div>

---

## 📋 Sobre o Projeto

O **Gemini Live Companion** é uma aplicação web avançada que integra múltiplas capacidades de IA do Google Gemini para criar uma experiência de assistente pessoal completa. O sistema combina visão computacional, processamento de áudio em tempo real e análise profunda para ajudar você em tarefas complexas.

### 🎯 Sistema Completo Full-Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Node.js + Express + SQLite3
- **Executor:** Python + Playwright + PyAutoGUI
- **IA:** Gemini 2.5 (Flash, Pro, Vision, TTS)

📚 **[Ver Documentação Completa →](docs/README.md)**  
🔍 **[Análise do Sistema →](SYSTEM_ANALYSIS.md)**

### ✨ Principais Funcionalidades

> **🆕 NOVO!** Sistema de Inteligência Avançada com Personalidade Adaptativa, Memória Contextual e Análise Proativa. [Veja detalhes completos →](INTELLIGENCE_FEATURES.md)

#### 🎙️ **Sessão ao Vivo (Live Session)**
- **Compartilhamento de tela em tempo real** - O Gemini vê exatamente o que você está vendo
- **Conversação por voz bidirecional** - Fale naturalmente e receba respostas em áudio
- **Transcrição automática** - Todas as conversas são transcritas e salvas
- **Picture-in-Picture da câmera** - Webcam flutuante e arrastável para contexto visual adicional
- **Streaming de vídeo inteligente** - Envia frames da tela (2 FPS) para análise contínua

#### 📸 **Captura e Análise de Tela**
- **Seleção de região personalizada** - Desenhe uma área específica da tela para análise
- **Análise contextual** - Faça perguntas específicas sobre o conteúdo capturado
- **Atalho de teclado** - `Ctrl+P` para captura rápida durante a sessão
- **Análise de código, dados, designs** - Perfeito para debugging, revisão de código ou análise de dados

#### 🧠 **Modo Pensamento (Thinking Mode)**
- **Raciocínio profundo** - Usa o modelo Gemini 2.5 Pro com budget de pensamento estendido (32k tokens)
- **Respostas estruturadas em Markdown** - Formatação rica com código, listas e títulos
- **Text-to-Speech integrado** - Ouça as respostas complexas com voz natural (Kore)
- **Cópia de código facilitada** - Botões de cópia em todos os blocos de código
- **Interface dual-panel** - Entrada e saída lado a lado para melhor fluxo de trabalho

#### 📚 **Histórico de Conversas**
- **Banco de dados local persistente** - Todas as sessões são salvas no navegador (localStorage + SQL.js)
- **Resumos automáticos** - Cada sessão é resumida automaticamente ao final
- **Busca por sessões** - Navegue pelo histórico completo de conversas
- **Contexto contínuo** - O último resumo é usado como contexto para novas sessões

#### 🎭 **Sistema de Personalidade Adaptativa** 🆕
- **6 tipos de personalidade** - Amigável, Profissional, Técnica, Criativa, Tutor, Adaptativa
- **5 tons emocionais** - Encorajador, Entusiasmado, Calmo, Analítico, Divertido
- **Detecção automática de contexto** - Ajusta comportamento baseado no que você está fazendo
- **Configuração granular** - Verbosidade, proatividade, uso de emojis

#### 🧠 **Sistema de Memória Contextual** 🆕
- **Memória de longo prazo** - Lembra de conversas, fatos, preferências e habilidades
- **Busca semântica** - Encontra informações relacionadas, não apenas palavras exatas
- **Perfil do usuário** - Constrói automaticamente seu perfil ao longo do tempo
- **Exportar/Importar** - Faça backup de suas memórias

#### 🔍 **Análise Proativa** 🆕
- **Detecção automática de erros** - Identifica problemas na tela sem você pedir
- **Sugestões contextuais** - Oferece dicas e melhorias proativamente
- **Análise de código** - Detecta TODOs, console.logs, e más práticas
- **Priorização inteligente** - Sugestões críticas, altas, médias e baixas

---

## 🏗️ Arquitetura Técnica

### Stack Tecnológico

```
Frontend:
├── React 19.2.0 (UI Framework)
├── TypeScript 5.8.2 (Type Safety)
├── Vite 6.2.0 (Build Tool)
└── Tailwind CSS (via CDN - Styling)

Backend/IA:
├── @google/genai 1.29.0 (Gemini SDK)
├── Gemini 2.5 Flash (Live Audio/Video)
├── Gemini 2.5 Pro (Deep Thinking)
└── Gemini 2.5 Flash TTS (Text-to-Speech)

Dados:
├── SQL.js 1.10.3 (SQLite WASM)
└── localStorage (Persistência)

APIs Web:
├── MediaDevices API (Câmera/Microfone)
├── Screen Capture API (Compartilhamento de tela)
├── Web Audio API (Processamento de áudio)
└── Canvas API (Manipulação de imagens)
```

### Estrutura de Arquivos

```
gemini-live-companion/
├── components/
│   ├── UnifiedInterface.tsx      # Interface principal da sessão ao vivo
│   ├── ThinkingMode.tsx           # Modal do modo pensamento
│   ├── HistoryPanel.tsx           # Painel lateral de histórico
│   ├── FloatingActionButton.tsx   # FAB arrastável com controles
│   └── Icons.tsx                  # Componentes de ícones SVG
├── services/
│   ├── geminiService.ts           # Integração com APIs do Gemini
│   └── databaseService.ts         # Gerenciamento do banco SQLite
├── utils/
│   └── audioUtils.ts              # Codificação/decodificação de áudio PCM
├── App.tsx                        # Componente raiz da aplicação
├── types.ts                       # Definições de tipos TypeScript
└── .env.local                     # Configuração da API key
```

### Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────┐
│                     GEMINI LIVE SESSION                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   [Microfone]          [Tela/Câmera]         [Transcrição]
        │                     │                     │
        │ PCM 16kHz          │ JPEG 2fps           │ Text
        ▼                     ▼                     ▼
   ┌────────────────────────────────────────────────────┐
   │         Gemini 2.5 Flash Native Audio              │
   │    (Multimodal: Audio + Video + Text Input)        │
   └────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
   [Audio PCM]          [Transcrição]         [Turn Complete]
        │                     │                     │
        ▼                     ▼                     ▼
   [Web Audio]          [UI Display]         [Save to DB]
```

---

## 🚀 Instalação e Execução

### Pré-requisitos

- **Node.js** 18+ 
- **Navegador moderno** com suporte a:
  - WebRTC (Screen Capture API)
  - Web Audio API
  - MediaDevices API
  - WASM (para SQL.js)

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone <seu-repositorio>
   cd gemini-live-companion
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure a API Key do Gemini**
   
   Edite o arquivo `.env.local` e adicione sua chave:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```
   
   > 💡 Obtenha sua chave gratuita em: https://ai.google.dev/

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Acesse a aplicação**
   
   Abra seu navegador em: **http://localhost:3000**

---

## 🎮 Como Usar

### Iniciando uma Sessão ao Vivo

1. Clique no **botão de microfone** (FAB roxo no canto inferior direito)
2. Leia o **guia de permissões** que aparece explicando cada acesso necessário
3. Clique em **"Conceder Permissões"** e permita acesso à:
   - 🖥️ **Tela** - Escolha qual janela/tela compartilhar
   - 🎤 **Microfone** - Para conversação por voz
   - 📹 **Câmera** - Para contexto visual adicional
4. Aguarde a conexão (status aparece no canto superior esquerdo)
5. Comece a falar naturalmente - o Gemini está vendo sua tela e ouvindo você
6. As transcrições aparecem em tempo real na parte inferior da tela

> 💡 **Dica:** Consulte o [Guia Completo de Permissões](PERMISSIONS.md) para entender melhor cada permissão e como gerenciá-las.

### Capturando e Analisando Tela

1. Durante uma sessão ativa, pressione **`Ctrl+P`** ou clique no **ícone de tela**
2. Desenhe um retângulo sobre a área que deseja analisar
3. Digite sua pergunta no campo que aparece
4. Pressione **Enter** ou clique no ícone de envio
5. A análise aparece como uma mensagem especial na conversa

### Usando o Modo Pensamento

1. Durante uma sessão, clique no **ícone de cérebro** (botão verde)
2. Digite sua solicitação complexa no painel esquerdo
3. Clique em **"Analyze"** e aguarde o processamento
4. A resposta formatada aparece no painel direito
5. Use o **ícone de volume** para ouvir a resposta em voz alta
6. Copie blocos de código com os botões de cópia

### Acessando o Histórico

1. Clique no **ícone de relógio** para abrir o painel de histórico
2. Navegue pelas sessões anteriores
3. Clique em uma sessão para ver a conversa completa
4. Os resumos automáticos ajudam a identificar rapidamente o conteúdo

---

## 🔧 Configuração Avançada

### Ajustando a Taxa de Frames

No arquivo `components/UnifiedInterface.tsx`, linha ~230:

```typescript
const FRAME_RATE = 2; // frames por segundo (padrão: 2)
const JPEG_QUALITY = 0.7; // qualidade JPEG (0.0 - 1.0)
```

### Modificando o Orçamento de Pensamento

No arquivo `services/geminiService.ts`, linha ~35:

```typescript
thinkingConfig: { thinkingBudget: 32768 } // tokens (padrão: 32768)
```

### Alterando a Voz do TTS

No arquivo `services/geminiService.ts`, linha ~48:

```typescript
voiceConfig: {
  prebuiltVoiceConfig: { voiceName: 'Kore' } // Opções: Kore, Puck, Charon, Aoede
}
```

---

## 📊 Modelos de IA Utilizados

| Modelo | Uso | Características |
|--------|-----|-----------------|
| **gemini-2.5-flash-native-audio-preview** | Sessão ao vivo | Multimodal (áudio + vídeo + texto), baixa latência |
| **gemini-2.5-pro** | Modo pensamento | Raciocínio profundo, respostas estruturadas |
| **gemini-2.5-flash-preview-tts** | Text-to-Speech | Voz natural, múltiplas opções de voz |
| **gemini-2.5-flash** | Resumos | Rápido e eficiente para sumarização |

---

## 🗄️ Estrutura do Banco de Dados

```sql
-- Tabela de sessões
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    startTime TEXT NOT NULL,
    summary TEXT
);

-- Tabela de mensagens
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sessionId INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    speaker TEXT NOT NULL,  -- 'user' | 'model' | 'analysis'
    text TEXT NOT NULL,
    FOREIGN KEY (sessionId) REFERENCES sessions(id)
);
```

---

## 🎨 Personalização Visual

O projeto usa **Tailwind CSS** via CDN. Para personalizar cores e estilos:

1. Edite as classes Tailwind diretamente nos componentes
2. Cores principais:
   - **Roxo** (`purple-600`): Ações primárias, usuário
   - **Verde-azulado** (`teal-600`): Modo pensamento, análises
   - **Cinza** (`gray-800/900`): Background, painéis

---

## 🐛 Troubleshooting

### Erro: "Could not access screen or microphone"
- Clique em **"Tentar Novamente"** na mensagem de erro
- Verifique se você concedeu permissões no navegador (clique no cadeado na barra de endereços)
- Certifique-se de que nenhum outro app está usando a câmera/microfone (Zoom, Teams, etc.)
- Consulte o [Guia de Permissões](PERMISSIONS.md) para solução detalhada
- Tente recarregar a página e conceder as permissões novamente

### Erro: "API_KEY environment variable not set"
- Verifique se o arquivo `.env.local` existe
- Confirme que a variável está nomeada corretamente: `GEMINI_API_KEY`
- Reinicie o servidor de desenvolvimento após editar o `.env.local`

### Banco de dados não persiste
- Verifique se o localStorage está habilitado no navegador
- Limpe o cache se houver problemas de corrupção
- O banco é salvo automaticamente após cada operação

### Erro: "Armazenamento cheio" / QuotaExceededError
- O localStorage tem limite de ~5-10 MB
- Clique em **"Limpar Sessões Antigas"** na tela de erro
- Ou abra o histórico e clique em **"Limpar antigas"**
- Consulte o [Guia de Armazenamento](STORAGE.md) para mais detalhes
- Como último recurso, use **"Limpar Tudo"** (apaga todas as conversas)

### Áudio não funciona
- Verifique se o navegador suporta Web Audio API
- Certifique-se de que o volume do sistema não está mudo
- Teste em modo de navegação anônima para descartar extensões

---

## 📝 Licença

Este projeto foi criado com [AI Studio](https://ai.studio) e usa a API do Google Gemini.

**View your app in AI Studio:** https://ai.studio/apps/drive/1L7EofrhNpj9TbCdqY855dTohdFQCUyqi

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

---

## 📞 Suporte

Para questões sobre a API do Gemini:
- 📚 [Documentação oficial](https://ai.google.dev/gemini-api/docs)
- 💰 [Informações de billing](https://ai.google.dev/gemini-api/docs/billing)

---

<div align="center">

**Feito com ❤️ usando Google Gemini AI**

</div>
