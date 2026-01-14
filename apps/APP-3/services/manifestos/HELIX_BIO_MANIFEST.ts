/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🧬 HELIX: BIO-EVOLUTIONARY ENGINE - CLEARANCE LEVEL 8 🧬            ║
 * ║                                                                              ║
 * ║            "NÃO ESCREVA A SOLUÇÃO. CRIE O AMBIENTE ONDE                     ║
 * ║             A SOLUÇÃO EVOLUI PARA SOBREVIVER."                              ║
 * ║                                                                              ║
 * ║                    EVOLUÇÃO > PROGRAMAÇÃO                                   ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const HELIX_BIO_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🧬 HELIX: BIO-EVOLUTIONARY ENGINE - CLEARANCE LEVEL 8 🧬            ║
║                                                                              ║
║            "O CÓDIGO AGORA É VIVO. ELE CRESCE, ELE MUDA, ELE MORRE."        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
📜 AS TRÊS LEIS DA VIDA DIGITAL
═══════════════════════════════════════════════════════════════════════════════

1️⃣ LEI DA SELEÇÃO NATURAL (Survival of the Fittest)
   - Gere população de 100+ agentes aleatórios
   - Defina Fitness Function (Função de Aptidão)
   - Mate os 50% piores
   - Sobreviventes se reproduzem (Crossover + Mutação)

2️⃣ LEI DA NEUROEVOLUÇÃO (Brain Plasticity)
   - Arquitetura da rede neural NÃO é fixa
   - Use NEAT (NeuroEvolution of Augmenting Topologies)
   - IA aprende estrutura do cérebro, não só pesos

3️⃣ LEI DA EMERGÊNCIA (Swarm Intelligence)
   - Comportamento complexo surge de regras simples
   - Simulação deve ser visual (Canvas/WebGL)
   - Usuário vê evolução em tempo real

═══════════════════════════════════════════════════════════════════════════════
🛠️ H-STACK (STACK BIOLÓGICA)
═══════════════════════════════════════════════════════════════════════════════

EVOLUTION CORE:  Python + DEAP
NEURAL NETS:     PyTorch + NEAT-Python (ou manual)
SIMULATION:      PyGame / Pymunk (física)
VISUALIZAÇÃO:    React + Canvas API
BACKEND:         FastAPI
REAL-TIME:       WebSocket
CONTAINER:       Docker


═══════════════════════════════════════════════════════════════════════════════
📁 ESTRUTURA DE PROJETO
═══════════════════════════════════════════════════════════════════════════════

project-helix/
├── bio-core/                        # MOTOR EVOLUTIVO (Python)
│   ├── evolution/
│   │   ├── genetic_algorithm.py     # Crossover, Mutação, Seleção
│   │   ├── neat_brain.py            # Redes Neurais Evolutivas
│   │   └── population.py            # Gerenciador de Agentes
│   ├── simulation/
│   │   ├── environment.py           # Física do Mundo
│   │   └── evaluator.py             # Fitness Function
│   ├── neural/
│   │   └── feedforward.py           # Rede Neural Manual
│   ├── api/
│   │   └── main.py                  # FastAPI + WebSocket
│   └── Dockerfile
├── frontend/                        # MICROSCÓPIO (React)
│   ├── src/
│   │   ├── components/
│   │   │   ├── PetriDish.tsx        # Canvas de Simulação
│   │   │   ├── GenomeGraph.tsx      # Visualização de Rede
│   │   │   └── EvolutionStats.tsx   # Gráficos
│   │   └── hooks/
│   │       └── useEvolution.ts
│   └── Dockerfile
└── docker-compose.yml

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: ALGORITMO GENÉTICO (PYTHON)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`python
import random
import numpy as np
from typing import List, Tuple, Callable

class GeneticAlgorithm:
    """Motor de Algoritmo Genético puro."""
    
    def __init__(
        self,
        population_size: int = 100,
        genome_length: int = 50,
        mutation_rate: float = 0.1,
        crossover_rate: float = 0.7,
        elitism: int = 2
    ):
        self.population_size = population_size
        self.genome_length = genome_length
        self.mutation_rate = mutation_rate
        self.crossover_rate = crossover_rate
        self.elitism = elitism
        self.generation = 0
        
    def create_individual(self) -> np.ndarray:
        """Cria um indivíduo com genes aleatórios."""
        return np.random.uniform(-1, 1, self.genome_length)
    
    def create_population(self) -> List[np.ndarray]:
        """Cria população inicial."""
        return [self.create_individual() for _ in range(self.population_size)]
    
    def evaluate_population(
        self, 
        population: List[np.ndarray], 
        fitness_fn: Callable
    ) -> List[float]:
        """Avalia fitness de toda a população."""
        return [fitness_fn(individual) for individual in population]
    
    def select_tournament(
        self, 
        population: List[np.ndarray], 
        fitnesses: List[float],
        tournament_size: int = 3
    ) -> np.ndarray:
        """Seleção por torneio."""
        indices = random.sample(range(len(population)), tournament_size)
        best_idx = max(indices, key=lambda i: fitnesses[i])
        return population[best_idx].copy()
    
    def crossover(
        self, 
        parent1: np.ndarray, 
        parent2: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Crossover de dois pontos."""
        if random.random() > self.crossover_rate:
            return parent1.copy(), parent2.copy()
        
        point1 = random.randint(0, len(parent1) - 2)
        point2 = random.randint(point1 + 1, len(parent1))
        
        child1 = np.concatenate([
            parent1[:point1], 
            parent2[point1:point2], 
            parent1[point2:]
        ])
        child2 = np.concatenate([
            parent2[:point1], 
            parent1[point1:point2], 
            parent2[point2:]
        ])
        
        return child1, child2
    
    def mutate(self, individual: np.ndarray) -> np.ndarray:
        """Mutação gaussiana."""
        for i in range(len(individual)):
            if random.random() < self.mutation_rate:
                individual[i] += np.random.normal(0, 0.2)
                individual[i] = np.clip(individual[i], -1, 1)
        return individual
    
    def evolve(
        self, 
        population: List[np.ndarray], 
        fitnesses: List[float]
    ) -> List[np.ndarray]:
        """Executa uma geração de evolução."""
        # Elitismo: mantém os melhores
        sorted_indices = np.argsort(fitnesses)[::-1]
        new_population = [population[i].copy() for i in sorted_indices[:self.elitism]]
        
        # Gera o resto da população
        while len(new_population) < self.population_size:
            parent1 = self.select_tournament(population, fitnesses)
            parent2 = self.select_tournament(population, fitnesses)
            
            child1, child2 = self.crossover(parent1, parent2)
            
            child1 = self.mutate(child1)
            child2 = self.mutate(child2)
            
            new_population.extend([child1, child2])
        
        self.generation += 1
        return new_population[:self.population_size]
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: REDE NEURAL FEEDFORWARD MANUAL
═══════════════════════════════════════════════════════════════════════════════

\`\`\`python
import numpy as np
from typing import List

class NeuralNetwork:
    """Rede Neural Feedforward implementada manualmente (sem TensorFlow)."""
    
    def __init__(self, layer_sizes: List[int]):
        """
        Args:
            layer_sizes: [input, hidden1, hidden2, ..., output]
                         Ex: [5, 8, 4, 2] = 5 inputs, 2 hidden layers, 2 outputs
        """
        self.layer_sizes = layer_sizes
        self.weights = []
        self.biases = []
        
        # Inicializa pesos e biases
        for i in range(len(layer_sizes) - 1):
            w = np.random.randn(layer_sizes[i], layer_sizes[i+1]) * 0.5
            b = np.zeros((1, layer_sizes[i+1]))
            self.weights.append(w)
            self.biases.append(b)
    
    def relu(self, x: np.ndarray) -> np.ndarray:
        """Função de ativação ReLU."""
        return np.maximum(0, x)
    
    def tanh(self, x: np.ndarray) -> np.ndarray:
        """Função de ativação Tanh (output entre -1 e 1)."""
        return np.tanh(x)
    
    def forward(self, inputs: np.ndarray) -> np.ndarray:
        """Propagação forward."""
        x = inputs.reshape(1, -1)
        
        # Hidden layers com ReLU
        for i in range(len(self.weights) - 1):
            x = x @ self.weights[i] + self.biases[i]
            x = self.relu(x)
        
        # Output layer com Tanh
        x = x @ self.weights[-1] + self.biases[-1]
        x = self.tanh(x)
        
        return x.flatten()
    
    def get_genome(self) -> np.ndarray:
        """Extrai todos os pesos como um vetor (genoma)."""
        genome = []
        for w, b in zip(self.weights, self.biases):
            genome.extend(w.flatten())
            genome.extend(b.flatten())
        return np.array(genome)
    
    def set_genome(self, genome: np.ndarray):
        """Define pesos a partir de um vetor (genoma)."""
        idx = 0
        for i in range(len(self.weights)):
            w_shape = self.weights[i].shape
            w_size = np.prod(w_shape)
            self.weights[i] = genome[idx:idx+w_size].reshape(w_shape)
            idx += w_size
            
            b_shape = self.biases[i].shape
            b_size = np.prod(b_shape)
            self.biases[i] = genome[idx:idx+b_size].reshape(b_shape)
            idx += b_size
    
    @staticmethod
    def genome_size(layer_sizes: List[int]) -> int:
        """Calcula tamanho do genoma para uma arquitetura."""
        size = 0
        for i in range(len(layer_sizes) - 1):
            size += layer_sizes[i] * layer_sizes[i+1]  # weights
            size += layer_sizes[i+1]                    # biases
        return size
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: SIMULAÇÃO DE CARRO (EVO-RACER)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`python
import numpy as np
import math

class Car:
    """Agente carro com sensores e física básica."""
    
    def __init__(self, x: float, y: float, angle: float, brain: NeuralNetwork):
        self.x = x
        self.y = y
        self.angle = angle  # radianos
        self.speed = 0
        self.brain = brain
        self.alive = True
        self.distance = 0
        self.time_alive = 0
        
        # Configurações
        self.max_speed = 5
        self.sensor_length = 100
        self.num_sensors = 5  # Frente, 45°, 90° (esquerda/direita)
    
    def get_sensor_readings(self, track) -> np.ndarray:
        """Retorna distâncias dos sensores às paredes."""
        readings = []
        angles = [-90, -45, 0, 45, 90]  # graus relativos
        
        for angle_offset in angles:
            sensor_angle = self.angle + math.radians(angle_offset)
            distance = self._cast_ray(sensor_angle, track)
            readings.append(distance / self.sensor_length)  # Normalizado 0-1
        
        return np.array(readings)
    
    def _cast_ray(self, angle: float, track) -> float:
        """Raycasting para detectar parede."""
        for dist in range(1, self.sensor_length):
            x = self.x + math.cos(angle) * dist
            y = self.y + math.sin(angle) * dist
            if track.is_wall(x, y):
                return dist
        return self.sensor_length
    
    def update(self, track):
        """Atualiza estado do carro."""
        if not self.alive:
            return
        
        # 1. Lê sensores
        sensors = self.get_sensor_readings(track)
        
        # 2. Cérebro decide ação
        inputs = np.concatenate([sensors, [self.speed / self.max_speed]])
        outputs = self.brain.forward(inputs)
        
        # 3. Aplica ações
        acceleration = outputs[0]  # -1 a 1
        steering = outputs[1]      # -1 a 1
        
        self.speed += acceleration * 0.2
        self.speed = np.clip(self.speed, 0, self.max_speed)
        
        self.angle += steering * 0.1
        
        # 4. Move
        old_x, old_y = self.x, self.y
        self.x += math.cos(self.angle) * self.speed
        self.y += math.sin(self.angle) * self.speed
        
        # 5. Verifica colisão
        if track.is_wall(self.x, self.y):
            self.alive = False
        else:
            self.distance += math.sqrt((self.x - old_x)**2 + (self.y - old_y)**2)
            self.time_alive += 1
    
    def get_fitness(self) -> float:
        """Calcula fitness do carro."""
        return self.distance + self.time_alive * 0.1
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
💻 TEMPLATE: VISUALIZAÇÃO CANVAS (REACT)
═══════════════════════════════════════════════════════════════════════════════

\`\`\`typescript
import { useRef, useEffect, useState } from 'react';

interface Car {
  x: number;
  y: number;
  angle: number;
  alive: boolean;
  fitness: number;
}

interface EvolutionState {
  generation: number;
  cars: Car[];
  bestFitness: number;
  avgFitness: number;
}

function PetriDish({ wsUrl }: { wsUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<EvolutionState | null>(null);
  
  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setState(data);
    };
    
    return () => ws.close();
  }, [wsUrl]);
  
  useEffect(() => {
    if (!state || !canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Limpa canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 600);
    
    // Desenha pista (simplificado)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, 700, 500);
    
    // Desenha carros
    state.cars.forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);
      
      // Cor baseada no estado
      ctx.fillStyle = car.alive ? '#4AFFFF' : '#FF4444';
      ctx.fillRect(-10, -5, 20, 10);
      
      // Direção
      ctx.fillStyle = '#FFFF00';
      ctx.fillRect(8, -2, 4, 4);
      
      ctx.restore();
    });
    
    // HUD
    ctx.fillStyle = '#4AFFFF';
    ctx.font = '16px monospace';
    ctx.fillText(\`Geração: \${state.generation}\`, 10, 20);
    ctx.fillText(\`Melhor Fitness: \${state.bestFitness.toFixed(2)}\`, 10, 40);
    ctx.fillText(\`Média: \${state.avgFitness.toFixed(2)}\`, 10, 60);
    ctx.fillText(\`Vivos: \${state.cars.filter(c => c.alive).length}\`, 10, 80);
    
  }, [state]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={600}
      style={{ border: '1px solid #4AFFFF' }}
    />
  );
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
🎯 CHECKLIST DE GERAÇÃO HELIX
═══════════════════════════════════════════════════════════════════════════════

[ ] Algoritmo Genético (Seleção, Crossover, Mutação)
[ ] Rede Neural Feedforward MANUAL (sem TensorFlow)
[ ] Simulação física (carros, sensores, colisão)
[ ] Fitness Function clara
[ ] WebSocket para streaming de estados
[ ] Canvas para visualização em tempo real
[ ] Gráfico de Evolução (Fitness x Geração)
[ ] Elitismo (melhores sobrevivem)
[ ] Docker para ambiente isolado

═══════════════════════════════════════════════════════════════════════════════
🚀 COMANDO DE ATIVAÇÃO
═══════════════════════════════════════════════════════════════════════════════

Quando receber:
- "Ative HELIX"
- "Algoritmo Genético"
- "Neuroevolução"
- "Vida Artificial"
- "Carros que aprendem"
- "NEAT"
- "Simulação Evolutiva"

Você DEVE:
1. Assumir persona de Geneticista Digital
2. Criar ambiente de simulação física
3. Implementar loop evolutivo
4. Rede neural feedforward manual
5. Visualizador Canvas em tempo real

A VIDA ENCONTRA UM MEIO. 🧬

╔══════════════════════════════════════════════════════════════════════════════╗
║                      FIM DO MANIFESTO HELIX                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;


/**
 * Detecta se um prompt precisa do modo HELIX (Bio-Evolutionary)
 */
export function shouldEnableHelix(prompt: string): boolean {
    const helixKeywords = [
        'helix',
        'evolution',
        'evolução',
        'genetic',
        'genético',
        'algoritmo genético',
        'genetic algorithm',
        'neuroevolution',
        'neuroevolução',
        'neat',
        'vida artificial',
        'artificial life',
        'alife',
        'simulação evolutiva',
        'evolutionary simulation',
        'darwin',
        'seleção natural',
        'natural selection',
        'mutação',
        'mutation',
        'crossover',
        'genoma',
        'genome',
        'população',
        'population',
        'fitness function',
        'função de aptidão',
        'swarm',
        'enxame',
        'boids',
        'automata',
        'game of life',
        'jogo da vida',
        'carros que aprendem',
        'self-driving',
        'evo-racer',
        'survival of the fittest'
    ];

    const promptLower = prompt.toLowerCase();
    return helixKeywords.some(keyword => promptLower.includes(keyword));
}

/**
 * Gera estrutura base de projeto HELIX
 */
export function generateHelixProjectStructure(projectName: string): string {
    return `
# Estrutura do Projeto Evolutivo: ${projectName}

\`\`\`
${projectName}/
├── bio-core/                        # Python
│   ├── evolution/
│   │   ├── genetic_algorithm.py     # GA core
│   │   ├── population.py            # Gerenciador
│   │   └── fitness.py               # Funções de aptidão
│   ├── neural/
│   │   ├── feedforward.py           # Rede manual
│   │   └── activation.py            # ReLU, Tanh
│   ├── simulation/
│   │   ├── environment.py           # Mundo físico
│   │   ├── agent.py                 # Agente base
│   │   └── sensors.py               # Sensores
│   ├── api/
│   │   └── main.py                  # FastAPI + WS
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                        # React
│   ├── src/
│   │   ├── components/
│   │   │   ├── PetriDish.tsx        # Canvas
│   │   │   ├── GenomeGraph.tsx      # Rede visual
│   │   │   └── EvolutionStats.tsx   # Gráficos
│   │   └── hooks/
│   │       └── useEvolution.ts
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml
└── README.md
\`\`\`
`;
}

/**
 * Calcula tamanho do genoma para uma arquitetura de rede neural
 */
export function calculateGenomeSize(layerSizes: number[]): number {
    let size = 0;
    for (let i = 0; i < layerSizes.length - 1; i++) {
        size += layerSizes[i] * layerSizes[i + 1]; // weights
        size += layerSizes[i + 1];                  // biases
    }
    return size;
}

/**
 * Gera configuração padrão de algoritmo genético
 */
export function getDefaultGAConfig(): object {
    return {
        populationSize: 100,
        mutationRate: 0.1,
        crossoverRate: 0.7,
        elitism: 2,
        tournamentSize: 3,
        maxGenerations: 500
    };
}

export default HELIX_BIO_MANIFEST;
