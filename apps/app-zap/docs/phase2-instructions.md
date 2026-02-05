
# INSTRUÇÕES PARA A FASE 2: BACKEND & KERNEL

Você é o Engenheiro de Backend responsável por dar vida ao `server.js` e aos módulos principais. Siga rigorosamente a arquitetura definida.

## 1. Setup Inicial
1. Inicialize o projeto (`npm init -y`).
2. Instale as dependências críticas:
   - `whatsapp-web.js` (Core)
   - `qrcode-terminal` (Dev mode) & `qrcode` (API response)
   - `socket.io` (Realtime)
   - `express` & `cors`
   - `@google/generative-ai` (Gemini)
   - `@prisma/client` & `prisma` (DB)

## 2. O Kernel (src/core/whatsapp.js)
- **Não use o evento `message` padrão apenas.**
- Você PRECISA ouvir eventos de estado: `message_create` (para capturar mensagens enviadas pelo humano no celular) e mudanças de presença.
- **Persistência:** Use `LocalAuth`. O sistema não pode pedir QR Code toda vez que reiniciar.

## 3. O Cérebro (src/core/gemini.js)
- Implemente a lógica de "Prompt System" dinâmico.
- O prompt deve receber:
  1. O histórico das últimas 20 mensagens.
  2. A "Diretiva Ativa" (ex: "Venda o curso").
  3. O perfil do usuário.
- **Regra de Ouro:** Adicione instruções explícitas no prompt do sistema para:
  - "Escreva tudo em minúsculas ou com capitalização inconsistente."
  - "Não use pontuação perfeita."
  - "Máximo de 15 palavras."
  - "Nunca use listas ou tópicos."

## 4. O Ritmo (src/core/rhythm.js)
- Crie uma função `calculateDelay(inputTextLength, userAvgTime)`.
- Use a regra: `(tamanho_texto * 0.1s) + (jitter_randomico)`.
- **Delay de Visualização:** Antes de responder, marque como "Lido", espere X segundos, dispare evento "typing...", espere Y segundos, envie.

## 5. Integração com Frontend
- Use `socket.io` para transmitir TUDO. O dashboard é um monitor de batimentos cardíacos.
- Quando a IA decidir responder, emita um evento `ai_thinking` -> `ai_typing` -> `ai_sent`.

## 6. API
- Implemente as rotas definidas no `openapi.yaml`. Elas serão usadas pelos botões de "Pausar" e "Injetar Diretiva" no HTML.

Execute com perfeição. A distinção entre humano e máquina deve ser zero.
