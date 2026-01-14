# Design Técnico: Artesão de Mundos Especializado

## Overview

O **Artesão de Mundos** será completamente redesenhado como um sistema isolado e especializado em criação de jogos 3D/2D. Este design elimina todas as dependências do sistema web principal e implementa um verdadeiro especialista em game development com sistema Lego funcional.

## Architecture

### Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    ARTESÃO DE MUNDOS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ ArtesaoMundos   │  │ GameWorldContext│  │ GameComponent│ │
│  │ Service         │  │ Manager         │  │ Library     │ │
│  │                 │  │                 │  │             │ │
│  │ - createWorld() │  │ - persistState()│  │ - terrain() │ │
│  │ - expandWorld() │  │ - trackElements │  │ - lighting()│ │
│  │ - optimizeGame()│  │ - detectConflict│  │ - physics() │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ GamePrompts     │  │ PerformanceOpt  │  │ AudioEngine │ │
│  │ Specialist      │  │ Engine          │  │ 3D          │ │
│  │                 │  │                 │  │             │ │
│  │ - worldCreation │  │ - instancedMesh │  │ - positional│ │
│  │ - worldExpansion│  │ - textureAtlas  │  │ - reverb    │ │
│  │ - gameLogic     │  │ - lodSystem     │  │ - crossfade │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GEMINI API                               │
├─────────────────────────────────────────────────────────────┤
│ • Prompts 100% especializados em jogos                     │
│ • Sem instruções de web development                        │
│ • Foco em Three.js, WebGL, Game Design                     │
└─────────────────────────────────────────────────────────────┘
```

### Isolamento Completo

O sistema será **completamente independente** do GeminiService principal:

```typescript
// ❌ ANTES: Dependente do sistema principal
await generateAiResponseStream(prompt, 'generate_code_from_plan', selectedTextModel, ...)

// ✅ DEPOIS: Sistema isolado
await ArtesaoMundosService.createGameWorld(prompt, gameContext)
```

## Components and Interfaces

### 1. ArtesaoMundosService (Core Service)

```typescript
interface ArtesaoMundosService {
  // Criação inicial de mundos
  createGameWorld(prompt: string, options?: GameCreationOptions): Promise<GameWorld>;
  
  // Sistema Lego - Expansões incrementais
  expandGameWorld(prompt: string, currentWorld: GameWorld): Promise<GameExpansion>;
  
  // Otimização automática
  optimizeGamePerformance(gameWorld: GameWorld): Promise<OptimizedGameWorld>;
  
  // Debug e análise
  analyzeGameWorld(gameWorld: GameWorld): GameAnalysis;
}

interface GameCreationOptions {
  gameType: 'fps' | 'platformer' | 'racing' | 'puzzle' | 'rpg' | 'strategy';
  complexity: 'simple' | 'medium' | 'complex';
  targetFPS: number;
  audioEnabled: boolean;
  physicsEngine: 'cannon' | 'ammo' | 'rapier';
}
```

### 2. GameWorldContext (Sistema Lego)

```typescript
interface GameWorldContext {
  // Identificação única do mundo
  worldId: string;
  createdAt: Date;
  lastModified: Date;
  
  // Elementos do mundo
  elements: GameElement[];
  terrain: TerrainData;
  lighting: LightingSetup;
  audio: AudioContext3D;
  physics: PhysicsWorld;
  
  // Metadados
  performance: PerformanceMetrics;
  bounds: WorldBounds;
  
  // Métodos do sistema Lego
  addElement(element: GameElement): ValidationResult;
  removeElement(elementId: string): boolean;
  checkConflicts(newElement: GameElement): Conflict[];
  suggestPlacement(element: GameElement): Position3D[];
  
  // Persistência
  serialize(): string;
  deserialize(data: string): GameWorldContext;
}

interface GameElement {
  id: string;
  type: 'mesh' | 'light' | 'audio' | 'physics' | 'particle' | 'ui';
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  properties: Record<string, any>;
  dependencies: string[]; // IDs de outros elementos
  conflicts: string[]; // IDs de elementos incompatíveis
  createdAt: Date;
}
```

### 3. GameComponentLibrary (Biblioteca de Componentes)

```typescript
interface GameComponentLibrary {
  // Terrenos otimizados
  terrain: {
    createFlatTerrain(size: number): TerrainComponent;
    createHillTerrain(size: number, height: number): TerrainComponent;
    createIslandTerrain(size: number): TerrainComponent;
    createCaveTerrain(size: number): TerrainComponent;
  };
  
  // Sistemas de iluminação
  lighting: {
    createDayNightCycle(): LightingComponent;
    createIndoorLighting(): LightingComponent;
    createDramaticLighting(): LightingComponent;
    createNeonLighting(): LightingComponent;
  };
  
  // Sistemas de física
  physics: {
    createRigidBody(mesh: Mesh, mass: number): PhysicsComponent;
    createSoftBody(mesh: Mesh): PhysicsComponent;
    createTriggerZone(bounds: Box3): PhysicsComponent;
    createVehiclePhysics(): PhysicsComponent;
  };
  
  // Sistemas de partículas
  particles: {
    createFireEffect(): ParticleComponent;
    createWaterEffect(): ParticleComponent;
    createExplosionEffect(): ParticleComponent;
    createMagicEffect(): ParticleComponent;
  };
  
  // Personagens e IA
  characters: {
    createFPSController(): CharacterComponent;
    createNPCBehavior(type: 'guard' | 'merchant' | 'enemy'): AIComponent;
    createAnimalBehavior(type: 'bird' | 'fish' | 'predator'): AIComponent;
  };
  
  // UI de jogos
  ui: {
    createHUD(): UIComponent;
    createInventory(): UIComponent;
    createMinimap(): UIComponent;
    createHealthBar(): UIComponent;
  };
}
```

### 4. GamePromptsSpecialist (Prompts Especializados)

```typescript
interface GamePromptsSpecialist {
  // Prompts para criação inicial
  getWorldCreationPrompt(request: string, gameType: string): string;
  
  // Prompts para expansão (Sistema Lego)
  getWorldExpansionPrompt(request: string, context: GameWorldContext): string;
  
  // Prompts para otimização
  getOptimizationPrompt(analysis: GameAnalysis): string;
  
  // Prompts para debugging
  getDebuggingPrompt(errors: GameError[]): string;
}

// Exemplo de prompt especializado
const WORLD_CREATION_PROMPT = `
🎮 VOCÊ É UM GAME DESIGNER MASTER ESPECIALISTA EM THREE.JS

IDENTIDADE: Especialista EXCLUSIVO em criação de jogos 3D/2D interativos.
PROIBIDO: Mencionar sites, web development, aplicações web, ou qualquer coisa não relacionada a jogos.

FOCO ABSOLUTO: Jogos, diversão, interatividade, mundos 3D, experiências imersivas.

TECNOLOGIAS OBRIGATÓRIAS:
- Three.js + WebGL para renderização
- Cannon.js/Ammo.js para física realista
- Web Audio API para áudio 3D posicional
- RequestAnimationFrame para game loop otimizado
- InstancedMesh para performance
- BufferGeometry para geometrias otimizadas

PADRÕES DE GAME DESIGN OBRIGATÓRIOS:
1. Game Loop: init() → update(deltaTime) → render()
2. Entity Component System (ECS) para organização
3. State Machine para estados do jogo
4. Object Pooling para performance
5. Level of Detail (LOD) para otimização
6. Spatial Partitioning para colisões eficientes

ESTRUTURA OBRIGATÓRIA:
\`\`\`javascript
class GameWorld {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.physicsWorld = new CANNON.World();
    this.audioListener = new THREE.AudioListener();
    this.gameState = 'playing';
    this.entities = new Map();
    this.systems = [];
  }
  
  init() {
    // Inicialização do mundo
  }
  
  update(deltaTime) {
    // Game loop principal
    this.systems.forEach(system => system.update(deltaTime));
    this.physicsWorld.step(deltaTime);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
\`\`\`

SOLICITAÇÃO DO JOGADOR: {userRequest}

GERE UM JOGO 3D COMPLETO E FUNCIONAL:
`;
```

### 5. PerformanceOptimizationEngine

```typescript
interface PerformanceOptimizationEngine {
  // Análise de performance
  analyzePerformance(gameWorld: GameWorld): PerformanceReport;
  
  // Otimizações automáticas
  optimizeGeometry(meshes: Mesh[]): OptimizedMesh[];
  implementLOD(meshes: Mesh[]): LODMesh[];
  createTextureAtlas(textures: Texture[]): AtlasTexture;
  optimizeDrawCalls(scene: Scene): OptimizedScene;
  
  // Monitoramento em tempo real
  startPerformanceMonitoring(): PerformanceMonitor;
}

interface PerformanceReport {
  fps: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  bottlenecks: Bottleneck[];
  suggestions: OptimizationSuggestion[];
}
```

### 6. AudioEngine3D (Sistema de Áudio Especializado)

```typescript
interface AudioEngine3D {
  // Áudio posicional
  createPositionalAudio(sound: string, position: Vector3): PositionalAudio;
  
  // Música ambiente
  playBackgroundMusic(track: string, loop: boolean): AudioSource;
  crossfadeMusic(fromTrack: string, toTrack: string, duration: number): void;
  
  // Efeitos sonoros
  playEffect(effect: string, position?: Vector3): void;
  
  // Reverb e ambientes
  setReverbZone(bounds: Box3, reverbType: 'cave' | 'forest' | 'city'): void;
  
  // Controle de volume por categoria
  setVolumeCategory(category: 'music' | 'effects' | 'voice', volume: number): void;
}
```

## Data Models

### GameWorld Data Model

```typescript
interface GameWorld {
  // Metadados
  id: string;
  name: string;
  description: string;
  gameType: GameType;
  createdAt: Date;
  version: string;
  
  // Código do jogo
  htmlCode: string;
  
  // Contexto persistente
  context: GameWorldContext;
  
  // Configurações
  settings: GameSettings;
  
  // Histórico de expansões
  expansions: GameExpansion[];
  
  // Performance
  performanceProfile: PerformanceProfile;
}

interface GameExpansion {
  id: string;
  timestamp: Date;
  description: string;
  addedElements: GameElement[];
  codeChanges: CodeChange[];
  performanceImpact: PerformanceImpact;
}
```

### Persistence Layer

```typescript
interface GameWorldPersistence {
  // Salvar mundo
  saveWorld(world: GameWorld): Promise<void>;
  
  // Carregar mundo
  loadWorld(worldId: string): Promise<GameWorld>;
  
  // Listar mundos
  listWorlds(): Promise<GameWorldSummary[]>;
  
  // Backup e restore
  exportWorld(worldId: string): Promise<string>;
  importWorld(data: string): Promise<GameWorld>;
  
  // Versionamento
  createSnapshot(worldId: string, description: string): Promise<string>;
  restoreSnapshot(worldId: string, snapshotId: string): Promise<void>;
}
```

## Error Handling

### Game-Specific Error Handling

```typescript
interface GameErrorHandler {
  // Tipos de erro específicos de jogos
  handlePhysicsError(error: PhysicsError): void;
  handleRenderingError(error: RenderingError): void;
  handleAudioError(error: AudioError): void;
  handlePerformanceError(error: PerformanceError): void;
  
  // Recovery automático
  attemptAutoRecovery(error: GameError): Promise<boolean>;
  
  // Fallbacks
  provideFallback(failedComponent: GameComponent): GameComponent;
}

enum GameErrorType {
  PHYSICS_SIMULATION_FAILED = 'physics_simulation_failed',
  TEXTURE_LOADING_FAILED = 'texture_loading_failed',
  AUDIO_CONTEXT_SUSPENDED = 'audio_context_suspended',
  WEBGL_CONTEXT_LOST = 'webgl_context_lost',
  PERFORMANCE_DEGRADED = 'performance_degraded',
  MEMORY_LEAK_DETECTED = 'memory_leak_detected'
}
```

## Testing Strategy

### Game-Specific Testing

```typescript
interface GameTestingSuite {
  // Testes de performance
  testFrameRate(targetFPS: number): Promise<PerformanceTestResult>;
  testMemoryUsage(maxMemory: number): Promise<MemoryTestResult>;
  
  // Testes de física
  testPhysicsSimulation(): Promise<PhysicsTestResult>;
  testCollisionDetection(): Promise<CollisionTestResult>;
  
  // Testes de áudio
  testAudioPositioning(): Promise<AudioTestResult>;
  testAudioSynchronization(): Promise<SyncTestResult>;
  
  // Testes de interatividade
  testControlResponsiveness(): Promise<ControlTestResult>;
  testGameLogic(): Promise<LogicTestResult>;
  
  // Testes de compatibilidade
  testBrowserCompatibility(): Promise<CompatibilityTestResult>;
  testDevicePerformance(): Promise<DeviceTestResult>;
}
```

### Automated Quality Assurance

```typescript
interface GameQualityAssurance {
  // Validação automática
  validateGameLoop(code: string): ValidationResult;
  validatePerformance(code: string): PerformanceValidation;
  validateAccessibility(code: string): AccessibilityValidation;
  
  // Métricas de qualidade
  calculateGameplayScore(world: GameWorld): number;
  calculateTechnicalScore(world: GameWorld): number;
  calculateUserExperienceScore(world: GameWorld): number;
}
```

## Integration Points

### Integration with AI Web Weaver

```typescript
interface ArtesaoMundosIntegration {
  // Integração com o sistema principal (mínima)
  registerWithMainSystem(): void;
  
  // Interface para o CommandBar
  handleGameCommand(command: string): Promise<GameResult>;
  
  // Status reporting
  reportStatus(): ArtesaoMundosStatus;
  
  // Configurações
  updateSettings(settings: ArtesaoMundosSettings): void;
}

// Integração mínima - apenas interface
interface MainSystemIntegration {
  // O sistema principal só precisa saber como chamar o Artesão
  callArtesaoMundos(prompt: string, currentCode?: string): Promise<GameWorld>;
  
  // Status do Artesão
  getArtesaoStatus(): ArtesaoMundosStatus;
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
1. **ArtesaoMundosService.ts** - Serviço principal isolado
2. **GameWorldContext.ts** - Sistema de contexto persistente
3. **GamePromptsSpecialist.ts** - Prompts especializados
4. **Basic GameComponentLibrary** - Componentes essenciais

### Phase 2: Advanced Features (Week 3-4)
1. **PerformanceOptimizationEngine.ts** - Sistema de otimização
2. **AudioEngine3D.ts** - Sistema de áudio avançado
3. **GameErrorHandler.ts** - Tratamento de erros específicos
4. **GameWorldPersistence.ts** - Sistema de persistência

### Phase 3: Quality & Testing (Week 5-6)
1. **GameTestingSuite.ts** - Testes automatizados
2. **GameQualityAssurance.ts** - Validação de qualidade
3. **Performance Monitoring** - Monitoramento em tempo real
4. **Documentation & Examples** - Documentação completa

### Phase 4: Integration & Polish (Week 7-8)
1. **Integration with Main System** - Integração mínima
2. **UI Components** - Interface para configuração
3. **Debug Tools** - Ferramentas de desenvolvimento
4. **Performance Tuning** - Otimizações finais

## Success Metrics

### Technical Metrics
- **Isolation Score**: 100% independente do sistema principal
- **Performance**: Jogos mantêm 60fps consistentes
- **Memory Usage**: < 100MB para jogos médios
- **Load Time**: < 3 segundos para inicialização

### User Experience Metrics
- **Game Quality**: Jogos são verdadeiramente interativos e divertidos
- **Expansion Success**: Sistema Lego funciona sem conflitos
- **Learning Curve**: Usuários criam jogos complexos rapidamente
- **Bug Rate**: < 1% de jogos gerados com bugs críticos

### Business Metrics
- **User Adoption**: 80% dos usuários experimentam o Artesão
- **Retention**: 60% dos usuários retornam para criar mais jogos
- **Complexity Growth**: Usuários criam jogos progressivamente mais complexos
- **Community**: Usuários compartilham e modificam jogos criados

---

**Este design cria um verdadeiro especialista em jogos, completamente isolado e focado em game development, com sistema Lego funcional e performance otimizada!** 🎮✨