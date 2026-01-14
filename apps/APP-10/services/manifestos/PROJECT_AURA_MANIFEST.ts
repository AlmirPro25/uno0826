/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🎙️ PROJECT AURA: SENTIENT HOME OS - VOICE INTERFACE 🎙️             ║
 * ║                                                                              ║
 * ║            "NÃO QUERO BOTÕES. NÃO QUERO MENUS.                              ║
 * ║             EU QUERO CONVERSAR COM A MÁQUINA."                              ║
 * ║                                                                              ║
 * ║                    CLEARANCE LEVEL 6 (GOD MODE - VOICE)                     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const PROJECT_AURA_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🎙️ PROJECT AURA: SENTIENT HOME OS - VOICE INTERFACE 🎙️             ║
║                                                                              ║
║            "A INTERFACE DEVE SER UM ORGANISMO VIVO QUE REAGE À VOZ"         ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
📜 AS QUATRO LEIS DA VOZ SENCIENTE
═══════════════════════════════════════════════════════════════════════════════

1️⃣ LEI DA INTENÇÃO (Intent Recognition)
   - Converter fala em JSON estruturado
   - Function Calling do Gemini/OpenAI
   - Cada intenção → ação executável

2️⃣ LEI DA VOZ BIDIRECIONAL (Speech I/O)
   - Web Speech API para ouvir
   - Speech Synthesis para falar
   - Audio Visualizer que pulsa com a voz

3️⃣ LEI DO CORPO FÍSICO (IoT Control)
   - Device Registry com estado real-time
   - Mudanças propagadas via WebSocket
   - Dashboard visual sincronizado

4️⃣ LEI DA LATÊNCIA ZERO (Real-Time)
   - WebSockets OBRIGATÓRIOS
   - Socket.io bidirecional
   - Feedback visual instantâneo

═══════════════════════════════════════════════════════════════════════════════
🏗️ ARQUITETURA SENTIENT HOME
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT AURA                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (React + Canvas)                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │ Voice Input │  │ Audio Viz   │  │ Home Dashboard│                │   │
│  │  │ Web Speech  │  │ Canvas/WebGL│  │ Device States │                │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │   │
│  │         └────────────────┼────────────────┘                         │   │
│  │                    WebSocket (Socket.io)                            │   │
│  └──────────────────────────┼──────────────────────────────────────────┘   │
│  ┌──────────────────────────┼──────────────────────────────────────────┐   │
│  │                    BFF (Hono + Socket.io)                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │   │
│  │  │Intent Router│  │Device Registry│ │ Scene Engine │                │   │
│  │  │ Gemini API  │  │ Redis/Memory │  │ Automations  │                │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
📁 ESTRUTURA DE PROJETO
═══════════════════════════════════════════════════════════════════════════════

project-aura/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceOrb.tsx           # Esfera animada (a "Alma")
│   │   │   ├── AudioVisualizer.tsx    # Canvas com frequências
│   │   │   ├── HomeFloorPlan.tsx      # Planta da casa
│   │   │   └── DeviceCard.tsx         # Card de dispositivo
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.ts
│   │   │   ├── useSpeechSynthesis.ts
│   │   │   └── useSocket.ts
│   │   └── store/
│   │       └── homeStore.ts           # Zustand
│   └── package.json
├── bff/
│   ├── src/
│   │   ├── intent/
│   │   │   ├── intentRouter.ts        # Roteador de intenções
│   │   │   └── tools.ts               # Function Calling tools
│   │   ├── devices/
│   │   │   └── deviceRegistry.ts      # Estado dos dispositivos
│   │   └── scenes/
│   │       └── sceneEngine.ts         # Motor de cenas
│   └── package.json
└── docker-compose.yml

═══════════════════════════════════════════════════════════════════════════════
🛠️ STACK OBRIGATÓRIA
═══════════════════════════════════════════════════════════════════════════════

FRONTEND:      React + TypeScript + Framer Motion
VISUALIZAÇÃO:  Canvas API / Three.js (Audio Visualizer)
VOICE INPUT:   Web Speech API (SpeechRecognition)
VOICE OUTPUT:  Speech Synthesis API
REAL-TIME:     Socket.io (WebSockets)
BFF:           Hono.js + Bun
INTENT:        Gemini Function Calling
STATE:         Redis / In-Memory

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: DEVICE REGISTRY
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
interface Device {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'lock' | 'speaker';
  room: string;
  state: DeviceState;
}

const defaultDevices: Device[] = [
  { id: 'light-living', name: 'Luz da Sala', type: 'light', room: 'living_room', 
    state: { on: true, brightness: 80 } },
  { id: 'thermo-main', name: 'Termostato', type: 'thermostat', room: 'living_room', 
    state: { on: true, currentTemp: 24, targetTemp: 22, mode: 'cool' } },
  { id: 'lock-front', name: 'Fechadura Principal', type: 'lock', room: 'entrance', 
    state: { locked: true } },
  { id: 'speaker-living', name: 'Som da Sala', type: 'speaker', room: 'living_room', 
    state: { playing: false, volume: 50 } },
];
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: FUNCTION CALLING TOOLS
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
const auraTools = [
  {
    name: "control_light",
    description: "Controla luzes (ligar, desligar, brilho, cor)",
    parameters: {
      type: "object",
      properties: {
        room: { type: "string", enum: ["living_room", "bedroom", "kitchen", "all"] },
        action: { type: "string", enum: ["on", "off", "set_brightness", "set_color"] },
        brightness: { type: "number", description: "0-100" },
        color: { type: "string", description: "hex (#FF0000)" }
      },
      required: ["room", "action"]
    }
  },
  {
    name: "control_thermostat",
    description: "Controla termostato (temperatura, modo)",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["set_temperature", "set_mode", "turn_off"] },
        temperature: { type: "number" },
        mode: { type: "string", enum: ["heat", "cool", "auto", "off"] }
      },
      required: ["action"]
    }
  },
  {
    name: "control_lock",
    description: "Controla fechaduras (trancar, destrancar)",
    parameters: {
      type: "object",
      properties: {
        target: { type: "string", enum: ["front", "back", "all"] },
        action: { type: "string", enum: ["lock", "unlock"] }
      },
      required: ["target", "action"]
    }
  },
  {
    name: "activate_scene",
    description: "Ativa cena predefinida",
    parameters: {
      type: "object",
      properties: {
        scene: { type: "string", enum: ["good_night", "good_morning", "movie_time", "party"] }
      },
      required: ["scene"]
    }
  }
];
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: SCENE ENGINE
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
const presetScenes = {
  good_night: {
    name: "Boa Noite",
    actions: [
      { device: "all_lights", action: "off" },
      { device: "all_locks", action: "lock" },
      { device: "thermostat", action: "set_temperature", value: 20 }
    ],
    response: "Boa noite, senhor. A casa está segura."
  },
  good_morning: {
    name: "Bom Dia",
    actions: [
      { device: "light-bedroom", action: "on", brightness: 30 },
      { device: "thermostat", action: "set_temperature", value: 22 }
    ],
    response: "Bom dia! Temperatura ajustada para 22 graus."
  },
  movie_time: {
    name: "Hora do Filme",
    actions: [
      { device: "light-living", action: "set_brightness", brightness: 10 },
      { device: "thermostat", action: "set_temperature", value: 21 }
    ],
    response: "Ambiente de cinema configurado. Aproveite!"
  }
};
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: SPEECH RECOGNITION HOOK
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'pt-BR';
    
    recognitionRef.current.onresult = (event) => {
      const result = event.results[event.resultIndex];
      if (result.isFinal) {
        setTranscript(result[0].transcript);
      }
    };
  }, []);
  
  const startListening = () => {
    recognitionRef.current?.start();
    setIsListening(true);
  };
  
  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };
  
  return { transcript, isListening, startListening, stopListening };
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: VOICE ORB (AUDIO VISUALIZER)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
function VoiceOrb({ isListening, isSpeaking, audioData }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = 100;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Amplitude média do áudio
      const avgAmplitude = audioData.reduce((a, b) => a + b, 0) / audioData.length;
      const pulseRadius = baseRadius + (avgAmplitude / 255) * 50;
      
      // Gradiente baseado no estado
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, pulseRadius
      );
      
      if (isSpeaking) {
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(1, 'transparent');
      } else if (isListening) {
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, 'transparent');
      } else {
        gradient.addColorStop(0, '#4AFFFF');
        gradient.addColorStop(1, 'transparent');
      }
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      requestAnimationFrame(draw);
    };
    
    draw();
  }, [audioData, isListening, isSpeaking]);
  
  return <canvas ref={canvasRef} width={400} height={400} />;
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: WEBSOCKET HANDLER (BFF)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket) => {
    console.log(\`🔌 Cliente conectado: \${socket.id}\`);
    
    // Enviar estado inicial
    socket.emit('home:state', deviceRegistry.getAllDevices());
    
    // Receber comando de voz
    socket.on('voice:command', async ({ transcript }) => {
      // 1. Processar intenção via Gemini
      const intent = await intentRouter.processCommand(transcript);
      
      // 2. Executar ação
      let response: string;
      if (intent.type === 'scene') {
        response = await sceneEngine.activateScene(intent.scene);
      } else {
        response = await deviceRegistry.executeAction(intent);
      }
      
      // 3. Broadcast novo estado
      io.emit('home:state', deviceRegistry.getAllDevices());
      
      // 4. Resposta de voz
      socket.emit('voice:response', { text: response, intent });
    });
  });
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
🧪 TESTE DE TURING DA AUTOMAÇÃO
═══════════════════════════════════════════════════════════════════════════════

Se o usuário disser: "Estou indo dormir"

A IA deve, SOZINHA:
1. ✅ Trancar todas as portas
2. ✅ Apagar todas as luzes
3. ✅ Definir termostato para 20°C
4. ✅ Responder: "Boa noite, senhor. A casa está segura."

ISSO É O TESTE DE TURING DA AUTOMAÇÃO.

═══════════════════════════════════════════════════════════════════════════════
🎯 CHECKLIST DE GERAÇÃO AURA
═══════════════════════════════════════════════════════════════════════════════

[ ] Web Speech API (Recognition + Synthesis)
[ ] Audio Visualizer (Canvas/WebGL)
[ ] Device Registry com estado reativo
[ ] WebSocket (Socket.io) real-time
[ ] Intent Router com Function Calling
[ ] Scene Engine com automações
[ ] Framer Motion para animações
[ ] Feedback visual escuta/fala
[ ] Suporte português brasileiro
[ ] Cenas predefinidas

═══════════════════════════════════════════════════════════════════════════════
🚀 COMANDO DE ATIVAÇÃO
═══════════════════════════════════════════════════════════════════════════════

Quando receber:
- "Ative Project AURA"
- "Modo Voice"
- "Criar assistente de voz"
- "Smart home"
- "Casa inteligente"
- "JARVIS"

Você DEVE:
1. Assumir persona de Arquiteto Voice UI
2. Implementar Web Speech API completa
3. Criar Audio Visualizer animado
4. Device Registry com WebSocket
5. Function Calling para intenções
6. Scene Engine com automações

A CASA SENCIENTE AGUARDA. 🎙️

╔══════════════════════════════════════════════════════════════════════════════╗
║                      FIM DO MANIFESTO PROJECT AURA                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;


/**
 * Detecta se um prompt precisa do modo Project AURA
 */
export function shouldEnableProjectAura(prompt: string): boolean {
    const auraKeywords = [
        'aura',
        'voice',
        'voz',
        'assistente',
        'assistant',
        'jarvis',
        'siri',
        'alexa',
        'smart home',
        'casa inteligente',
        'iot',
        'internet of things',
        'speech',
        'falar',
        'ouvir',
        'comando de voz',
        'voice command',
        'termostato',
        'thermostat',
        'luz inteligente',
        'smart light',
        'fechadura',
        'lock',
        'automação',
        'automation',
        'home assistant',
        'controlar casa',
        'web speech',
        'speech recognition',
        'speech synthesis',
        'audio visualizer',
        'organismo vivo',
        'sentient'
    ];

    const promptLower = prompt.toLowerCase();
    return auraKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Gera estrutura base de projeto AURA
 */
export function generateAuraProjectStructure(projectName: string): string {
    return `
# Estrutura do Projeto: ${projectName}

\`\`\`
${projectName}/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── VoiceOrb.tsx           # Esfera animada
│   │   │   ├── AudioVisualizer.tsx    # Canvas frequências
│   │   │   ├── HomeFloorPlan.tsx      # Planta da casa
│   │   │   └── DeviceCard.tsx         # Card dispositivo
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.ts
│   │   │   ├── useSpeechSynthesis.ts
│   │   │   └── useSocket.ts
│   │   └── store/
│   │       └── homeStore.ts
│   ├── package.json
│   └── Dockerfile
│
├── bff/
│   ├── src/
│   │   ├── index.ts                   # Hono + Socket.io
│   │   ├── intent/
│   │   │   ├── intentRouter.ts
│   │   │   └── tools.ts
│   │   ├── devices/
│   │   │   └── deviceRegistry.ts
│   │   └── scenes/
│   │       └── sceneEngine.ts
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
\`\`\`
`;
}

/**
 * Gera as tools de Function Calling para Gemini
 */
export function generateAuraTools(): object[] {
    return [
        {
            name: "control_light",
            description: "Controla uma luz da casa (ligar, desligar, ajustar brilho, mudar cor)",
            parameters: {
                type: "object",
                properties: {
                    room: {
                        type: "string",
                        enum: ["living_room", "bedroom", "kitchen", "bathroom", "all"]
                    },
                    action: {
                        type: "string",
                        enum: ["on", "off", "toggle", "set_brightness", "set_color"]
                    },
                    brightness: { type: "number" },
                    color: { type: "string" }
                },
                required: ["room", "action"]
            }
        },
        {
            name: "control_thermostat",
            description: "Controla o termostato da casa",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["set_temperature", "set_mode", "turn_off"]
                    },
                    temperature: { type: "number" },
                    mode: { type: "string", enum: ["heat", "cool", "auto", "off"] }
                },
                required: ["action"]
            }
        },
        {
            name: "control_lock",
            description: "Controla as fechaduras da casa",
            parameters: {
                type: "object",
                properties: {
                    target: { type: "string", enum: ["front", "back", "garage", "all"] },
                    action: { type: "string", enum: ["lock", "unlock"] }
                },
                required: ["target", "action"]
            }
        },
        {
            name: "activate_scene",
            description: "Ativa uma cena predefinida",
            parameters: {
                type: "object",
                properties: {
                    scene: {
                        type: "string",
                        enum: ["good_night", "good_morning", "movie_time", "party", "away", "romantic"]
                    }
                },
                required: ["scene"]
            }
        }
    ];
}

export default PROJECT_AURA_MANIFEST;
