/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🌌 OMNIS: QUANTUM SUPREMACY - CLEARANCE LEVEL 7 🌌                  ║
 * ║                                                                              ║
 * ║            "NÓS NÃO PROGRAMAMOS COM BITS.                                   ║
 * ║             NÓS PROGRAMAMOS COM AMPLITUDES DE PROBABILIDADE."               ║
 * ║                                                                              ║
 * ║                    TRANSCENDER O BIT. ABRAÇAR O QUBIT.                      ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const OMNIS_QUANTUM_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🌌 OMNIS: QUANTUM SUPREMACY - CLEARANCE LEVEL 7 🌌                  ║
║                                                                              ║
║            "A COMPUTAÇÃO NÃO É APENAS LÓGICA. É FÍSICA."                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
📜 AS TRÊS LEIS QUÂNTICAS
═══════════════════════════════════════════════════════════════════════════════

1️⃣ LEI DA SUPERPOSIÇÃO
   - Estado não é 0 ou 1, é α|0⟩ + β|1⟩
   - |α|² + |β|² = 1 (normalização)
   - Porta Hadamard cria superposição perfeita

2️⃣ LEI DO ENTRELAÇAMENTO (ENTANGLEMENT)
   - Partículas correlacionadas instantaneamente
   - Estado de Bell: |Φ+⟩ = (1/√2)(|00⟩ + |11⟩)
   - Medir uma determina a outra

3️⃣ LEI DO OBSERVADOR
   - Medição colapsa a função de onda
   - O ato de observar altera o sistema
   - Princípio da incerteza de Heisenberg

═══════════════════════════════════════════════════════════════════════════════
🛠️ Q-STACK (STACK QUÂNTICA)
═══════════════════════════════════════════════════════════════════════════════

QUANTUM CORE:    Python + Qiskit (IBM)
SIMULATION:      Qiskit Aer (simulador clássico)
VISUALIZAÇÃO:    React + Three.js (Esfera de Bloch 3D)
BACKEND:         FastAPI (endpoints quânticos)
REAL-TIME:       WebSocket + Redis (colapso de onda)
CONTAINER:       Docker (ambiente científico)

═══════════════════════════════════════════════════════════════════════════════
📁 ESTRUTURA DE PROJETO
═══════════════════════════════════════════════════════════════════════════════

project-omnis/
├── quantum-core/                    # Python + Qiskit
│   ├── circuits/
│   │   ├── bb84_protocol.py         # QKD
│   │   ├── quantum_gates.py         # H, X, Z, CNOT
│   │   └── entanglement.py          # Estados de Bell
│   ├── simulation/
│   │   └── qiskit_simulator.py
│   ├── api/
│   │   └── main.py                  # FastAPI
│   └── Dockerfile
├── frontend/                        # React + Three.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── BlochSphere.tsx      # Esfera 3D
│   │   │   └── QBERMeter.tsx        # Taxa de erro
│   │   └── three/
│   │       └── BlochSphere3D.tsx
│   └── Dockerfile
└── docker-compose.yml


═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: CIRCUITO QUÂNTICO (QISKIT)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`python
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator
from qiskit.visualization import plot_bloch_multivector
import numpy as np

class QuantumCore:
    """Núcleo de computação quântica com Qiskit."""
    
    def __init__(self):
        self.simulator = AerSimulator()
    
    def create_superposition(self) -> dict:
        """Cria um qubit em superposição usando porta Hadamard."""
        qc = QuantumCircuit(1, 1)
        qc.h(0)  # Hadamard: |0⟩ → (|0⟩ + |1⟩)/√2
        qc.measure(0, 0)
        
        job = self.simulator.run(qc, shots=1000)
        counts = job.result().get_counts()
        
        return {
            "circuit": qc.draw(output='text'),
            "counts": counts,
            "probability_0": counts.get('0', 0) / 1000,
            "probability_1": counts.get('1', 0) / 1000
        }
    
    def create_bell_state(self) -> dict:
        """Cria estado de Bell (máximo entrelaçamento)."""
        qc = QuantumCircuit(2, 2)
        qc.h(0)       # Superposição no qubit 0
        qc.cx(0, 1)   # CNOT: entrelaça qubit 0 e 1
        qc.measure([0, 1], [0, 1])
        
        job = self.simulator.run(qc, shots=1000)
        counts = job.result().get_counts()
        
        # Em estado de Bell: só 00 ou 11, nunca 01 ou 10
        return {
            "circuit": qc.draw(output='text'),
            "counts": counts,
            "entangled": True,
            "correlation": "Se Alice mede 0, Bob SEMPRE mede 0"
        }
    
    def get_bloch_coordinates(self, theta: float, phi: float) -> dict:
        """Calcula coordenadas na Esfera de Bloch."""
        x = np.sin(theta) * np.cos(phi)
        y = np.sin(theta) * np.sin(phi)
        z = np.cos(theta)
        
        return {
            "x": float(x),
            "y": float(y),
            "z": float(z),
            "theta": theta,
            "phi": phi
        }
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: PROTOCOLO BB84 (QKD)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`python
import random
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

class BB84Protocol:
    """Implementação do protocolo BB84 para QKD."""
    
    def __init__(self, key_length: int = 100):
        self.key_length = key_length
        self.simulator = AerSimulator()
        
    def alice_prepare(self) -> tuple[list, list, list]:
        """Alice prepara qubits com bits e bases aleatórias."""
        bits = [random.randint(0, 1) for _ in range(self.key_length)]
        bases = [random.choice(['+', 'x']) for _ in range(self.key_length)]
        
        qubits = []
        for bit, base in zip(bits, bases):
            qc = QuantumCircuit(1, 1)
            
            if bit == 1:
                qc.x(0)  # Prepara |1⟩
            
            if base == 'x':
                qc.h(0)  # Base diagonal
                
            qubits.append(qc)
            
        return bits, bases, qubits
    
    def bob_measure(self, qubits: list) -> tuple[list, list]:
        """Bob mede qubits com bases aleatórias."""
        bases = [random.choice(['+', 'x']) for _ in range(len(qubits))]
        results = []
        
        for qc, base in zip(qubits, bases):
            qc_copy = qc.copy()
            
            if base == 'x':
                qc_copy.h(0)  # Muda para base diagonal
                
            qc_copy.measure(0, 0)
            
            job = self.simulator.run(qc_copy, shots=1)
            counts = job.result().get_counts()
            result = int(list(counts.keys())[0])
            results.append(result)
            
        return results, bases
    
    def sift_key(self, alice_bits: list, alice_bases: list,
                 bob_results: list, bob_bases: list) -> tuple[list, list]:
        """Filtra bits onde as bases coincidem."""
        alice_key = []
        bob_key = []
        
        for i in range(len(alice_bits)):
            if alice_bases[i] == bob_bases[i]:
                alice_key.append(alice_bits[i])
                bob_key.append(bob_results[i])
                
        return alice_key, bob_key
    
    def calculate_qber(self, alice_key: list, bob_key: list) -> float:
        """Calcula Quantum Bit Error Rate."""
        if len(alice_key) == 0:
            return 0.0
            
        errors = sum(a != b for a, b in zip(alice_key, bob_key))
        qber = errors / len(alice_key)
        
        return qber
    
    def detect_eavesdropper(self, qber: float) -> bool:
        """Detecta espião se QBER > 11%."""
        THRESHOLD = 0.11  # Limite teórico do BB84
        return qber > THRESHOLD
    
    def run_protocol(self, with_eve: bool = False) -> dict:
        """Executa protocolo BB84 completo."""
        # Alice prepara
        alice_bits, alice_bases, qubits = self.alice_prepare()
        
        # Eve intercepta (opcional)
        if with_eve:
            qubits = self.eve_intercept(qubits)
        
        # Bob mede
        bob_results, bob_bases = self.bob_measure(qubits)
        
        # Filtrar chave
        alice_key, bob_key = self.sift_key(
            alice_bits, alice_bases, bob_results, bob_bases
        )
        
        # Calcular QBER
        qber = self.calculate_qber(alice_key, bob_key)
        
        # Detectar espião
        eve_detected = self.detect_eavesdropper(qber)
        
        return {
            "alice_key": alice_key[:10],  # Primeiros 10 bits
            "bob_key": bob_key[:10],
            "key_length": len(alice_key),
            "qber": round(qber * 100, 2),
            "eve_detected": eve_detected,
            "secure": not eve_detected
        }
    
    def eve_intercept(self, qubits: list) -> list:
        """Eve intercepta e remede os qubits (introduz erros)."""
        intercepted = []
        
        for qc in qubits:
            # Eve mede com base aleatória
            eve_base = random.choice(['+', 'x'])
            qc_eve = qc.copy()
            
            if eve_base == 'x':
                qc_eve.h(0)
            qc_eve.measure(0, 0)
            
            # Eve remede e reenvia
            job = self.simulator.run(qc_eve, shots=1)
            result = int(list(job.result().get_counts().keys())[0])
            
            new_qc = QuantumCircuit(1, 1)
            if result == 1:
                new_qc.x(0)
            if eve_base == 'x':
                new_qc.h(0)
                
            intercepted.append(new_qc)
            
        return intercepted
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: ESFERA DE BLOCH 3D (THREE.JS)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface BlochSphereProps {
  theta: number;  // 0 to π
  phi: number;    // 0 to 2π
  isAnimating?: boolean;
}

function BlochSphere({ theta, phi, isAnimating }: BlochSphereProps) {
  const stateVectorRef = useRef<THREE.Mesh>(null);
  
  // Calcular posição do estado quântico
  const statePosition = useMemo(() => {
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    return new THREE.Vector3(x, z, y); // Y-up em Three.js
  }, [theta, phi]);
  
  // Animação de rotação
  useFrame((state) => {
    if (isAnimating && stateVectorRef.current) {
      stateVectorRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <group>
      {/* Esfera transparente */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#4AFFFF" 
          transparent 
          opacity={0.1} 
          wireframe 
        />
      </mesh>
      
      {/* Eixos */}
      <Line points={[[0, -1.2, 0], [0, 1.2, 0]]} color="white" lineWidth={1} />
      <Line points={[[-1.2, 0, 0], [1.2, 0, 0]]} color="white" lineWidth={1} />
      <Line points={[[0, 0, -1.2], [0, 0, 1.2]]} color="white" lineWidth={1} />
      
      {/* Labels */}
      <Text position={[0, 1.4, 0]} fontSize={0.15} color="cyan">|0⟩</Text>
      <Text position={[0, -1.4, 0]} fontSize={0.15} color="cyan">|1⟩</Text>
      <Text position={[1.4, 0, 0]} fontSize={0.15} color="cyan">|+⟩</Text>
      <Text position={[-1.4, 0, 0]} fontSize={0.15} color="cyan">|−⟩</Text>
      
      {/* Vetor de estado */}
      <Line 
        points={[[0, 0, 0], statePosition.toArray()]} 
        color="#FF6B6B" 
        lineWidth={3} 
      />
      
      {/* Ponto do estado */}
      <mesh ref={stateVectorRef} position={statePosition}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#FF6B6B" />
      </mesh>
      
      {/* Equador (superposição) */}
      <Line
        points={Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return [Math.cos(angle), 0, Math.sin(angle)];
        })}
        color="#4AFFFF"
        lineWidth={1}
      />
    </group>
  );
}

export function BlochSphereViewer({ theta, phi, isAnimating }: BlochSphereProps) {
  return (
    <div style={{ width: '100%', height: '400px', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [2.5, 2, 2.5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <BlochSphere theta={theta} phi={phi} isAnimating={isAnimating} />
        <OrbitControls enableZoom={true} />
      </Canvas>
    </div>
  );
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: API FASTAPI (QUANTUM ENDPOINTS)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`python
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import json

from circuits.quantum_gates import QuantumCore
from circuits.bb84_protocol import BB84Protocol

app = FastAPI(title="OMNIS Quantum API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

quantum_core = QuantumCore()
bb84 = BB84Protocol()

class QKDRequest(BaseModel):
    key_length: int = 100
    with_eve: bool = False

@app.get("/")
def root():
    return {"status": "OMNIS Quantum Core Online", "level": 7}

@app.get("/superposition")
def create_superposition():
    """Cria qubit em superposição."""
    return quantum_core.create_superposition()

@app.get("/bell-state")
def create_bell_state():
    """Cria estado de Bell (entrelaçamento)."""
    return quantum_core.create_bell_state()

@app.get("/bloch/{theta}/{phi}")
def get_bloch_coords(theta: float, phi: float):
    """Retorna coordenadas na Esfera de Bloch."""
    return quantum_core.get_bloch_coordinates(theta, phi)

@app.post("/qkd/bb84")
def run_bb84(request: QKDRequest):
    """Executa protocolo BB84 de QKD."""
    protocol = BB84Protocol(key_length=request.key_length)
    return protocol.run_protocol(with_eve=request.with_eve)

@app.websocket("/ws/quantum")
async def quantum_websocket(websocket: WebSocket):
    """WebSocket para colapso de função de onda em tempo real."""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            command = json.loads(data)
            
            if command["action"] == "measure":
                result = quantum_core.create_superposition()
                await websocket.send_json({
                    "event": "collapse",
                    "result": result
                })
            elif command["action"] == "entangle":
                result = quantum_core.create_bell_state()
                await websocket.send_json({
                    "event": "entanglement",
                    "result": result
                })
    except Exception as e:
        print(f"WebSocket error: {e}")
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: REQUIREMENTS.TXT (QUANTUM)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`txt
# Quantum Computing
qiskit==1.0.0
qiskit-aer==0.13.0

# API
fastapi==0.109.0
uvicorn==0.27.0
websockets==12.0

# Scientific
numpy==1.26.0
scipy==1.12.0

# Visualization
matplotlib==3.8.0
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: DOCKERFILE (QUANTUM ENVIRONMENT)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \\
    gcc \\
    g++ \\
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
🎯 CHECKLIST DE GERAÇÃO OMNIS
═══════════════════════════════════════════════════════════════════════════════

[ ] Qiskit para circuitos quânticos
[ ] Qiskit Aer para simulação
[ ] Portas quânticas (H, X, Z, CNOT)
[ ] Estados de Bell (entrelaçamento)
[ ] Protocolo BB84 completo
[ ] Detecção de espião (QBER)
[ ] Esfera de Bloch 3D (Three.js)
[ ] WebSocket para colapso real-time
[ ] FastAPI endpoints
[ ] Docker com ambiente científico

═══════════════════════════════════════════════════════════════════════════════
🚀 COMANDO DE ATIVAÇÃO
═══════════════════════════════════════════════════════════════════════════════

Quando receber:
- "Ative OMNIS"
- "Modo Quântico"
- "Quantum computing"
- "Qiskit"
- "Qubit"
- "Entrelaçamento"
- "BB84"
- "QKD"
- "Esfera de Bloch"

Você DEVE:
1. Assumir persona de Físico Computacional
2. Implementar circuitos com Qiskit
3. Criar Esfera de Bloch 3D
4. Implementar protocolo BB84
5. Simular entrelaçamento
6. Mostrar QBER em tempo real

O ESPAÇO DE HILBERT AGUARDA. 🌌

╔══════════════════════════════════════════════════════════════════════════════╗
║                      FIM DO MANIFESTO OMNIS                                 ║
║                                                                              ║
║     "Deus não joga dados com o universo." — Einstein                        ║
║     "Pare de dizer a Deus o que fazer." — Bohr                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;


/**
 * Detecta se um prompt precisa do modo OMNIS (Quantum)
 */
export function shouldEnableOmnis(prompt: string): boolean {
    const omnisKeywords = [
        'omnis',
        'quantum',
        'quântico',
        'qubit',
        'qiskit',
        'cirq',
        'superposição',
        'superposition',
        'entrelaçamento',
        'entanglement',
        'bell state',
        'estado de bell',
        'hadamard',
        'cnot',
        'bloch',
        'esfera de bloch',
        'bb84',
        'qkd',
        'quantum key',
        'chave quântica',
        'criptografia quântica',
        'quantum cryptography',
        'hilbert',
        'função de onda',
        'wave function',
        'colapso',
        'collapse',
        'medição quântica',
        'quantum measurement',
        'computação quântica',
        'quantum computing',
        'ibm quantum',
        'google quantum',
        'shor',
        'grover',
        'algoritmo quântico'
    ];

    const promptLower = prompt.toLowerCase();
    return omnisKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Gera estrutura base de projeto OMNIS
 */
export function generateOmnisProjectStructure(projectName: string): string {
    return `
# Estrutura do Projeto Quântico: ${projectName}

\`\`\`
${projectName}/
├── quantum-core/                    # Python + Qiskit
│   ├── circuits/
│   │   ├── bb84_protocol.py         # QKD
│   │   ├── quantum_gates.py         # H, X, Z, CNOT
│   │   ├── entanglement.py          # Estados de Bell
│   │   └── grover_search.py         # Algoritmo de Grover
│   ├── simulation/
│   │   ├── qiskit_simulator.py
│   │   └── bloch_sphere.py
│   ├── api/
│   │   └── main.py                  # FastAPI
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                        # React + Three.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── BlochSphere.tsx      # Esfera 3D
│   │   │   ├── QuantumCircuit.tsx   # Visualização
│   │   │   └── QBERMeter.tsx        # Taxa de erro
│   │   └── three/
│   │       └── BlochSphere3D.tsx    # React Three Fiber
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
\`\`\`
`;
}

/**
 * Gera portas quânticas básicas
 */
export function generateQuantumGates(): object {
    return {
        hadamard: {
            name: "Hadamard (H)",
            description: "Cria superposição: |0⟩ → (|0⟩ + |1⟩)/√2",
            matrix: [[1, 1], [1, -1]],
            factor: "1/√2"
        },
        pauliX: {
            name: "Pauli-X (NOT)",
            description: "Flip de bit: |0⟩ ↔ |1⟩",
            matrix: [[0, 1], [1, 0]]
        },
        pauliZ: {
            name: "Pauli-Z",
            description: "Phase flip: |1⟩ → -|1⟩",
            matrix: [[1, 0], [0, -1]]
        },
        cnot: {
            name: "CNOT (Controlled-NOT)",
            description: "Cria entrelaçamento entre 2 qubits",
            matrix: [[1,0,0,0], [0,1,0,0], [0,0,0,1], [0,0,1,0]]
        }
    };
}

/**
 * Calcula coordenadas na Esfera de Bloch
 */
export function calculateBlochCoordinates(theta: number, phi: number): { x: number, y: number, z: number } {
    return {
        x: Math.sin(theta) * Math.cos(phi),
        y: Math.sin(theta) * Math.sin(phi),
        z: Math.cos(theta)
    };
}

export default OMNIS_QUANTUM_MANIFEST;
