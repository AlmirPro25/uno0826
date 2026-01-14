<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 🚀 AETHER PRIME - Autonomous AI App Builder

> **O agente de IA mais poderoso do ecossistema PROST-QS**

## 🧬 ALEXANDRIA INTEGRATION (NEW!)

O AETHER PRIME agora possui **127 manifestos de conhecimento especializado** integrados do projeto ALEXANDRIA. Isso significa que o agente automaticamente se torna um especialista em qualquer domínio que você precisar:

### Domínios Disponíveis

| Level | Manifesto | Descrição |
|-------|-----------|-----------|
| 100 | TOKEN_COMPUTING | O Assembly da Cognição - Tokenização, LLM, Transformers |
| 99 | SYSTEMS_PROGRAMMING | Rust, C++, C, Go, Assembly (Anti-Fallback) |
| 95 | COMPILER_INTERPRETER | Lexer, Parser, AST, Code Generation, JIT |
| 94 | NETWORKING_PROTOCOLS | TCP/UDP, Custom Protocols, Zero-Copy, DPDK |
| 93 | CRYPTOGRAPHY | AES, ChaCha20, Ed25519, Argon2, TLS |
| 92 | MEMORY_MANAGEMENT | Allocators, Ownership, GC, Leak Detection |
| 26 | MICRO_SAAS_FACTORY | Fábrica de Micro-SaaS Autônomos |
| 25 | GEMINI_ROBOTICS | ROS2, MuJoCo, Embodied AI |
| 22 | G3_DESIGN | Agente Criador de Sites Profissionais |
| 20 | OBSERVABILITY | Logs, Métricas, Traces, Grafana |
| 18 | AR_VR_METAVERSE | ARKit, ARCore, WebXR, Unity VR |
| 17 | EMBEDDED_SYSTEMS | Arduino, ESP32, Raspberry Pi, Firmware |
| 16 | GAME_ENGINE | Unity, Unreal, Godot, Física, Shaders |
| 15 | MOBILE_NATIVE | Swift, Kotlin, Flutter, React Native |
| 13 | SECURITY_FORTRESS | OWASP, Zero Trust, Vault, Pentesting |
| 9 | AION_CIVILIZATION | Web3, DAO, Blockchain, Solidity |
| 7 | OMNIS_QUANTUM | Computação Quântica, Qiskit |
| 5 | SYNTHIA_LABS | PyTorch, MLOps, Training Loops |

**E mais 100+ manifestos especializados!**

### Como Funciona

1. Você faz um pedido ao AETHER PRIME
2. O sistema detecta automaticamente o domínio (ex: "criar um jogo" → GAME_ENGINE)
3. O manifesto especializado é injetado no prompt
4. O agente executa com conhecimento de especialista

### Exemplos de Uso

```
"Crie um smart contract para NFT marketplace"
→ Ativa: AION_CIVILIZATION (Web3/Blockchain)

"Desenvolva um driver de kernel Linux"
→ Ativa: SYSTEMS_PROGRAMMING + KERNEL_DRIVER

"Faça um app de realidade aumentada"
→ Ativa: AR_VR_METAVERSE + MOBILE_NATIVE

"Crie um sistema de trading com ML"
→ Ativa: SYNTHIA_LABS + SECURITY_FORTRESS
```

---

## 🔧 Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

## 🏗️ Architecture

```
APP-10/
├── services/
│   ├── gemini.ts           # Core AI engine
│   ├── manifestIntegration.ts  # 🆕 Alexandria integration
│   ├── manifestos/         # 🆕 127 knowledge manifestos
│   │   ├── ManifestOrchestrator.ts
│   │   ├── SYSTEMS_PROGRAMMING_MANIFEST.ts
│   │   ├── GAME_ENGINE_MANIFEST.ts
│   │   └── ... (127 files)
│   ├── webcontainer.ts     # WebContainer runtime
│   ├── localRuntime.ts     # Local PowerShell runtime
│   └── analyzer.ts         # Code analysis
├── constants.ts            # System instructions
└── store.ts               # State management
```

## 🎯 Key Features

- **Autonomous Execution**: Creates complete apps without asking
- **Self-Healing**: Automatically fixes errors
- **Real Terminal**: PowerShell/WebContainer execution
- **127 Knowledge Domains**: Expert in any technology
- **Bundle System**: Generates complete project structures

## 📊 Ecosystem Integration

Part of the **PROST-QS/UNO** ecosystem:
- Backend: https://uno0826.onrender.com
- Frontend: https://uno0826-pr57.vercel.app

---

<div align="center">
  <strong>🧬 AETHER PRIME + ALEXANDRIA = AGI-lite</strong>
  <br>
  <em>Conhecimento + Execução Autônoma</em>
</div>
