# 🎮 Gemini Executor

Módulo de automação física do sistema operacional, coordenado pelo Gemini Maestro.

## 🎯 Propósito

O Executor é o "braço e mão" do sistema de IA. Ele recebe comandos do Maestro via WebSocket e executa ações físicas no computador:
- Mover e clicar o mouse
- Digitar no teclado
- Abrir aplicativos
- Capturar screenshots
- Reconhecer elementos visuais na tela

## 🏗️ Arquitetura

```
┌───────────────────────────────────────────────┐
│           GEMINI MAESTRO (Node.js)            │
│    🎼  Orquestrador de contexto e ações       │
└──────────────┬────────────────────────────────┘
               │  WebSocket Seguro
               ▼
┌───────────────────────────────────────────────┐
│           🎮 GEMINI EXECUTOR (Python)          │
│   • Interpreta comandos                       │
│   • Controla mouse e teclado                  │
│   • Usa visão de IA p/ reconhecer elementos   │
│   • Envia screenshots e logs de volta         │
└───────────────────────────────────────────────┘
```

## 📦 Dependências

```bash
pip install pyautogui pywinauto opencv-python pytesseract websockets cryptography pillow
```

## 🚀 Instalação

1. Instale Python 3.10+
2. Instale as dependências: `pip install -r requirements.txt`
3. Configure o `.env` com a chave de autenticação
4. Execute: `python executor.py`

## 🔒 Segurança

- Autenticação via token compartilhado com o Maestro
- Comandos criptografados
- Botão de parada de emergência (ESC)
- Timeout automático
- Log de todas as ações

## 📡 Comandos Suportados

| Comando | Parâmetros | Descrição |
|---------|-----------|-----------|
| `move` | `x, y` | Move o mouse para coordenadas |
| `click` | `button` (opcional) | Clica o mouse |
| `type` | `text` | Digita texto |
| `press` | `key` | Pressiona tecla especial |
| `screenshot` | - | Captura a tela |
| `open` | `app` | Abre aplicativo |
| `scroll` | `amount` | Rola a página |

## 🎮 Uso

O Executor não é usado diretamente. Ele aguarda comandos do Maestro via WebSocket na porta 8081.
