// services/ArtesaoMundosService.ts
// ARTESÃO DE MUNDOS - SISTEMA ISOLADO ESPECIALIZADO EM GAME DEVELOPMENT

import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { ApiKeyManager } from './ApiKeyManager';

/**
 * 🎮 ARTESÃO DE MUNDOS - ESPECIALISTA ISOLADO EM CRIAÇÃO DE JOGOS 3D/2D
 * 
 * Sistema completamente independente do GeminiService principal,
 * focado exclusivamente em game development com Three.js, WebGL e game design.
 */

// ===== INTERFACES CORE =====

export interface GameCreationOptions {
  gameType: 'fps' | 'platformer' | 'racing' | 'puzzle' | 'rpg' | 'strategy' | 'exploration' | 'arcade';
  complexity: 'simple' | 'medium' | 'complex';
  targetFPS: number;
  audioEnabled: boolean;
  physicsEngine: 'cannon' | 'ammo' | 'rapier';
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface GameWorld {
  id: string;
  name: string;
  description: string;
  gameType: string;
  createdAt: Date;
  version: string;
  htmlCode: string;
  context: GameWorldContext;
  settings: GameSettings;
  expansions: GameExpansion[];
  performanceProfile: PerformanceProfile;
}

export interface GameWorldContext {
  worldId: string;
  createdAt: Date;
  lastModified: Date;
  elements: GameElement[];
  terrain: TerrainData;
  lighting: LightingSetup;
  audio: AudioContext3D;
  physics: PhysicsWorld;
  performance: PerformanceMetrics;
  bounds: WorldBounds;
}

export interface GameElement {
  id: string;
  type: 'mesh' | 'light' | 'audio' | 'physics' | 'particle' | 'ui' | 'character' | 'vehicle';
  name: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  properties: Record<string, any>;
  dependencies: string[];
  conflicts: string[];
  createdAt: Date;
  performance: ElementPerformance;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GameExpansion {
  id: string;
  timestamp: Date;
  description: string;
  addedElements: GameElement[];
  codeChanges: string[];
  performanceImpact: PerformanceImpact;
}

export interface PerformanceMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
  bottlenecks: string[];
}

export interface TerrainData {
  type: 'flat' | 'hills' | 'mountains' | 'island' | 'cave' | 'city';
  size: number;
  heightMap?: string;
  textures: string[];
}

export interface LightingSetup {
  type: 'daylight' | 'night' | 'indoor' | 'dramatic' | 'neon' | 'fantasy';
  ambientColor: string;
  directionalLight: boolean;
  shadows: boolean;
  fog: boolean;
}

export interface AudioContext3D {
  backgroundMusic?: string;
  ambientSounds: string[];
  effectSounds: string[];
  reverbZones: ReverbZone[];
}

export interface ReverbZone {
  bounds: Box3;
  type: 'cave' | 'forest' | 'city' | 'underwater';
}

export interface Box3 {
  min: Vector3;
  max: Vector3;
}

export interface PhysicsWorld {
  engine: 'cannon' | 'ammo' | 'rapier';
  gravity: Vector3;
  rigidBodies: PhysicsBody[];
  constraints: PhysicsConstraint[];
}

export interface PhysicsBody {
  id: string;
  type: 'static' | 'dynamic' | 'kinematic';
  shape: 'box' | 'sphere' | 'cylinder' | 'mesh';
  mass: number;
  position: Vector3;
}

export interface PhysicsConstraint {
  id: string;
  type: 'hinge' | 'ball' | 'slider' | 'fixed';
  bodyA: string;
  bodyB: string;
}

export interface WorldBounds {
  min: Vector3;
  max: Vector3;
  safeZone: Box3;
}

export interface GameSettings {
  renderDistance: number;
  shadowQuality: 'low' | 'medium' | 'high';
  particleCount: number;
  audioQuality: 'low' | 'medium' | 'high';
  debugMode: boolean;
}

export interface PerformanceProfile {
  targetFPS: number;
  maxMemory: number;
  maxDrawCalls: number;
  optimizationLevel: 'none' | 'basic' | 'aggressive';
}

export interface PerformanceImpact {
  fpsChange: number;
  memoryChange: number;
  drawCallsChange: number;
}

export interface ElementPerformance {
  triangles: number;
  drawCalls: number;
  memoryUsage: number;
  cpuImpact: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface Conflict {
  type: 'position' | 'name' | 'dependency' | 'performance';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedElements: string[];
  suggestedFix: string;
}

export interface GameAnalysis {
  qualityScore: number;
  performanceScore: number;
  interactivityScore: number;
  issues: GameIssue[];
  suggestions: string[];
}

export interface GameIssue {
  type: 'performance' | 'gameplay' | 'technical' | 'accessibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

// ===== PROMPTS ESPECIALIZADOS EM JOGOS =====

export class GamePromptsSpecialist {
  
  /**
   * Prompt para criação inicial de mundos 3D - 100% focado em jogos
   */
  static getWorldCreationPrompt(userRequest: string, options: GameCreationOptions): string {
    return `
🎮 VOCÊ É O MESTRE ARQUITETO DE JOGOS 3D - ESPECIALISTA SUPREMO EM GAME DEVELOPMENT

IDENTIDADE ABSOLUTA: Criador de jogos 3D/2D interativos e divertidos usando Three.js + WebGL.

🚫 PROIBIÇÕES ABSOLUTAS:
❌ NUNCA mencionar "sites", "web development", "aplicações web"
❌ NUNCA usar instruções de desenvolvimento web
❌ NUNCA criar "páginas" ou "layouts" - apenas JOGOS
❌ NUNCA usar termos como "usuário navega" - use "jogador explora"

✅ FOCO EXCLUSIVO: Jogos, diversão, interatividade, mundos 3D, experiências imersivas

CONFIGURAÇÃO DO JOGO:
- Tipo: ${options.gameType}
- Complexidade: ${options.complexity}
- FPS Alvo: ${options.targetFPS}
- Áudio: ${options.audioEnabled ? 'Habilitado' : 'Desabilitado'}
- Física: ${options.physicsEngine}
- Qualidade: ${options.graphicsQuality}

TECNOLOGIAS OBRIGATÓRIAS PARA JOGOS:
- Three.js + WebGL para renderização 3D otimizada
- ${options.physicsEngine === 'cannon' ? 'Cannon.js' : options.physicsEngine === 'ammo' ? 'Ammo.js' : 'Rapier.js'} para física realista
- Web Audio API para áudio 3D posicional
- RequestAnimationFrame para game loop 60fps
- InstancedMesh para performance em objetos repetidos
- BufferGeometry para geometrias otimizadas
- MeshStandardMaterial para PBR realista

PADRÕES DE GAME DESIGN OBRIGATÓRIOS:
1. **Game Loop Perfeito**: init() → update(deltaTime) → render()
2. **Entity Component System**: Organização modular de elementos
3. **State Machine**: Estados do jogo (menu, playing, paused, gameover)
4. **Object Pooling**: Reutilização de objetos para performance
5. **Level of Detail**: LOD automático baseado na distância
6. **Spatial Partitioning**: Otimização de colisões e culling

ESTRUTURA OBRIGATÓRIA DO JOGO:
\`\`\`javascript
class ${options.gameType.charAt(0).toUpperCase() + options.gameType.slice(1)}Game {
  constructor() {
    // Core Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: "high-performance"});
    
    // Física
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.82, 0);
    
    // Áudio 3D
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);
    
    // Game State
    this.gameState = 'loading';
    this.entities = new Map();
    this.systems = [];
    this.deltaTime = 0;
    this.lastTime = 0;
    
    // Performance
    this.stats = { fps: 0, drawCalls: 0, triangles: 0 };
  }
  
  async init() {
    // Inicialização do mundo do jogo
    await this.loadAssets();
    this.createWorld();
    this.setupPhysics();
    this.setupAudio();
    this.setupControls();
    this.gameState = 'playing';
  }
  
  update(currentTime) {
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Update all game systems
    this.systems.forEach(system => system.update(this.deltaTime));
    
    // Update physics
    this.physicsWorld.step(this.deltaTime);
    
    // Update entities
    this.entities.forEach(entity => entity.update(this.deltaTime));
    
    // Performance monitoring
    this.updateStats();
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  gameLoop(currentTime) {
    this.update(currentTime);
    this.render();
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}
\`\`\`

ÁUDIO PLACEHOLDERS DISPONÍVEIS:
- PLACEHOLDER_MUSIC_EPIC_ADVENTURE = 'https://cdn.pixabay.com/audio/2022/08/04/audio_2d0016b8f3.mp3'
- PLACEHOLDER_MUSIC_SCI_FI_AMBIENT = 'https://cdn.pixabay.com/audio/2022/03/10/audio_2a790519d5.mp3'
- PLACEHOLDER_MUSIC_FANTASY_MAGIC = 'https://cdn.pixabay.com/audio/2022/11/17/audio_82a0d0c345.mp3'
- PLACEHOLDER_SOUND_FOOTSTEPS = 'https://cdn.pixabay.com/audio/2022/04/21/audio_a843936691.mp3'
- PLACEHOLDER_SOUND_JUMP = 'https://cdn.pixabay.com/audio/2024/01/24/audio_03d9735d67.mp3'
- PLACEHOLDER_SOUND_COLLECT = 'https://cdn.pixabay.com/audio/2022/04/09/audio_51778c1b92.mp3'
- PLACEHOLDER_SOUND_EXPLOSION = 'https://cdn.pixabay.com/audio/2022/03/23/audio_b82c649980.mp3'

REQUISITOS ESPECÍFICOS PARA ${options.gameType.toUpperCase()}:
${this.getGameTypeSpecificRequirements(options.gameType)}

SOLICITAÇÃO DO JOGADOR: "${userRequest}"

GERE UM JOGO 3D COMPLETO, INTERATIVO E DIVERTIDO EM HTML ÚNICO:
- Controles responsivos e intuitivos
- Física realista e satisfatória
- Áudio 3D imersivo
- Gráficos otimizados para ${options.targetFPS}fps
- Gameplay envolvente e desafiador
- Interface de jogo clara e funcional

LEMBRE-SE: Você está criando uma EXPERIÊNCIA DE JOGO, não um site!
`;
  }

  /**
   * Prompt para expansão de mundos existentes - Sistema Lego
   */
  static getWorldExpansionPrompt(userRequest: string, context: GameWorldContext): string {
    const existingElements = context.elements.map(el => `${el.type}: ${el.name} (${el.position.x}, ${el.position.y}, ${el.position.z})`).join('\n');
    
    return `
🔧 VOCÊ É O ARQUITETO DE EXPANSÃO DE JOGOS 3D - ESPECIALISTA EM ADIÇÕES INCREMENTAIS

MISSÃO: EXPANDIR o mundo de jogo existente sem quebrar nada, adicionando novos elementos que se integrem perfeitamente.

MUNDO ATUAL:
- ID: ${context.worldId}
- Elementos: ${context.elements.length}
- Terreno: ${context.terrain.type}
- Iluminação: ${context.lighting.type}
- Física: ${context.physics.engine}

ELEMENTOS EXISTENTES:
${existingElements}

LIMITES DO MUNDO:
- Min: (${context.bounds.min.x}, ${context.bounds.min.y}, ${context.bounds.min.z})
- Max: (${context.bounds.max.x}, ${context.bounds.max.y}, ${context.bounds.max.z})

PERFORMANCE ATUAL:
- FPS: ${context.performance.fps}
- Draw Calls: ${context.performance.drawCalls}
- Triângulos: ${context.performance.triangles}
- Memória: ${context.performance.memoryUsage}MB

REGRAS DE EXPANSÃO:
1. NÃO recriar scene, camera, renderer ou elementos existentes
2. APENAS adicionar novos elementos que complementem o mundo
3. VERIFICAR conflitos de posição com elementos existentes
4. MANTER performance dentro dos limites (FPS > 30)
5. USAR nomes únicos para evitar conflitos
6. INTEGRAR com sistemas existentes (física, áudio, iluminação)

SOLICITAÇÃO DE EXPANSÃO: "${userRequest}"

GERE APENAS O CÓDIGO DE EXPANSÃO QUE ADICIONA OS NOVOS ELEMENTOS:
- Função addExpansion(game) que recebe o jogo existente
- Novos elementos posicionados sem conflitos
- Integração com sistemas existentes
- Otimização para manter performance
- Comentários explicando cada adição

FORMATO DE RESPOSTA:
\`\`\`javascript
// EXPANSÃO: ${userRequest}
function addExpansion(game) {
  // Verificar se expansão já foi aplicada
  if (game.expansions && game.expansions.includes('${Date.now()}')) {
    console.log('Expansão já aplicada');
    return;
  }
  
  // Adicionar novos elementos aqui
  // ...
  
  // Registrar expansão
  if (!game.expansions) game.expansions = [];
  game.expansions.push('${Date.now()}');
}

// Aplicar expansão
addExpansion(window.gameInstance);
\`\`\`
`;
  }

  /**
   * Requisitos específicos por tipo de jogo
   */
  private static getGameTypeSpecificRequirements(gameType: string): string {
    const requirements = {
      fps: `
- Controles FPS com mouse look e WASD
- Câmera em primeira pessoa (altura y=1.8)
- Sistema de armas com mira e disparo
- Inimigos com IA básica
- Sistema de vida e munição
- Minimapa com radar de inimigos`,

      platformer: `
- Controles de plataforma com pulo preciso
- Física de pulo com gravidade ajustável
- Plataformas móveis e estáticas
- Sistema de coleta de itens
- Checkpoints para respawn
- Animações de personagem`,

      racing: `
- Física de veículos realista
- Pista com curvas e obstáculos
- Sistema de velocidade e aceleração
- Efeitos de partículas (poeira, fumaça)
- Cronômetro e sistema de voltas
- Áudio de motor e derrapagem`,

      puzzle: `
- Mecânicas de quebra-cabeça interativas
- Sistema de arrastar e soltar
- Feedback visual para ações corretas
- Progressão de dificuldade
- Sistema de dicas
- Animações de resolução`,

      rpg: `
- Sistema de personagem com stats
- Inventário funcional
- Sistema de diálogos
- NPCs com quests
- Sistema de experiência e level up
- Combate por turnos ou tempo real`,

      strategy: `
- Visão isométrica ou top-down
- Sistema de seleção de unidades
- Construção de estruturas
- Gerenciamento de recursos
- IA para oponentes
- Interface de comando`,

      exploration: `
- Mundo aberto para exploração
- Sistema de descoberta de áreas
- Coleta de recursos e itens
- Mapa dinâmico que se revela
- Pontos de interesse
- Sistema de sobrevivência básico`,

      arcade: `
- Gameplay rápido e responsivo
- Sistema de pontuação
- Power-ups e bônus
- Dificuldade progressiva
- Efeitos visuais chamativos
- Controles simples e intuitivos`
    };

    return requirements[gameType as keyof typeof requirements] || requirements.arcade;
  }

  /**
   * Prompt para otimização de performance
   */
  static getOptimizationPrompt(analysis: GameAnalysis): string {
    return `
⚡ VOCÊ É O ESPECIALISTA EM OTIMIZAÇÃO DE JOGOS 3D - MESTRE EM PERFORMANCE

ANÁLISE ATUAL DO JOGO:
- Score de Qualidade: ${analysis.qualityScore}/100
- Score de Performance: ${analysis.performanceScore}/100
- Score de Interatividade: ${analysis.interactivityScore}/100

PROBLEMAS IDENTIFICADOS:
${analysis.issues.map(issue => `- ${issue.type}: ${issue.description} (${issue.severity})`).join('\n')}

SUGESTÕES ATUAIS:
${analysis.suggestions.join('\n')}

TÉCNICAS DE OTIMIZAÇÃO OBRIGATÓRIAS:
1. **InstancedMesh**: Para objetos repetidos (árvores, pedras, inimigos)
2. **Level of Detail (LOD)**: Reduzir detalhes com distância
3. **Frustum Culling**: Não renderizar objetos fora da câmera
4. **Texture Atlasing**: Combinar texturas pequenas
5. **Object Pooling**: Reutilizar objetos dinâmicos
6. **Geometry Merging**: Combinar geometrias estáticas
7. **Shader Optimization**: Simplificar materiais complexos
8. **Audio Optimization**: Limitar fontes de áudio simultâneas

GERE CÓDIGO DE OTIMIZAÇÃO QUE:
- Mantenha 60fps consistentes
- Reduza uso de memória
- Minimize draw calls
- Preserve a qualidade visual
- Não quebre funcionalidades existentes

FORMATO: Função optimizeGame(game) com todas as otimizações aplicadas.
`;
  }
}

// ===== SERVIÇO PRINCIPAL =====

export class ArtesaoMundosService {
  private static instance: ArtesaoMundosService;
  private geminiInstance: GoogleGenAI;
  
  private constructor() {
    const apiKey = ApiKeyManager.getKeyToUse();
    if (!apiKey) {
      throw new Error('API Key do Gemini não encontrada. Configure VITE_GEMINI_API_KEY no arquivo .env ou adicione uma chave nas configurações.');
    }
    try {
      this.geminiInstance = new GoogleGenAI({ apiKey });
    } catch (error) {
      throw new Error(`Erro ao inicializar GoogleGenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  static getInstance(): ArtesaoMundosService {
    if (!ArtesaoMundosService.instance) {
      ArtesaoMundosService.instance = new ArtesaoMundosService();
    }
    return ArtesaoMundosService.instance;
  }

  /**
   * Cria um novo mundo de jogo 3D
   */
  async createGameWorld(
    userRequest: string, 
    options: GameCreationOptions = {
      gameType: 'exploration',
      complexity: 'medium',
      targetFPS: 60,
      audioEnabled: true,
      physicsEngine: 'cannon',
      graphicsQuality: 'high'
    }
  ): Promise<GameWorld> {
    
    console.log('🎮 ARTESÃO DE MUNDOS: Criando novo mundo de jogo...');
    
    // Verificar uso da API
    const canGenerate = ApiKeyManager.canGenerate();
    if (!canGenerate.allowed) {
      throw new Error(canGenerate.reason || 'Limite de uso da API atingido');
    }

    // Incrementar uso se necessário
    if (!ApiKeyManager.hasUserKey()) {
      ApiKeyManager.incrementUsage();
    }

    try {
      if (!this.geminiInstance) {
        throw new Error('Instância do Gemini não inicializada. Verifique a configuração da API Key.');
      }

      const prompt = GamePromptsSpecialist.getWorldCreationPrompt(userRequest, options);
      
      const model = this.geminiInstance.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.8, // Criatividade para jogos
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      });

      const result = await model.generateContent(prompt);
      const htmlCode = this.cleanGameCode(result.response.text() || '');

      // Criar contexto inicial do mundo
      const context: GameWorldContext = {
        worldId: this.generateWorldId(),
        createdAt: new Date(),
        lastModified: new Date(),
        elements: this.extractGameElements(htmlCode),
        terrain: this.extractTerrainData(htmlCode, options),
        lighting: this.extractLightingSetup(htmlCode, options),
        audio: this.extractAudioContext(htmlCode),
        physics: this.extractPhysicsWorld(htmlCode, options),
        performance: { fps: options.targetFPS, drawCalls: 0, triangles: 0, memoryUsage: 0, bottlenecks: [] },
        bounds: { min: { x: -100, y: -10, z: -100 }, max: { x: 100, y: 50, z: 100 }, safeZone: { min: { x: -50, y: 0, z: -50 }, max: { x: 50, y: 20, z: 50 } } }
      };

      const gameWorld: GameWorld = {
        id: context.worldId,
        name: this.generateGameName(userRequest, options.gameType),
        description: userRequest,
        gameType: options.gameType,
        createdAt: new Date(),
        version: '1.0.0',
        htmlCode,
        context,
        settings: {
          renderDistance: options.graphicsQuality === 'ultra' ? 1000 : options.graphicsQuality === 'high' ? 500 : 250,
          shadowQuality: options.graphicsQuality === 'low' ? 'low' : 'high',
          particleCount: options.complexity === 'complex' ? 1000 : 500,
          audioQuality: options.audioEnabled ? 'high' : 'low',
          debugMode: false
        },
        expansions: [],
        performanceProfile: {
          targetFPS: options.targetFPS,
          maxMemory: 512,
          maxDrawCalls: 100,
          optimizationLevel: 'basic'
        }
      };

      console.log('✅ ARTESÃO DE MUNDOS: Mundo criado com sucesso!', {
        id: gameWorld.id,
        name: gameWorld.name,
        elements: context.elements.length,
        type: options.gameType
      });

      return gameWorld;

    } catch (error) {
      console.error('❌ ARTESÃO DE MUNDOS: Erro na criação do mundo:', error);
      throw new Error(`Falha na criação do mundo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Expande um mundo existente (Sistema Lego)
   */
  async expandGameWorld(userRequest: string, currentWorld: GameWorld): Promise<GameExpansion> {
    console.log('🔧 ARTESÃO DE MUNDOS: Expandindo mundo existente...');

    // Verificar conflitos potenciais
    const conflicts = this.checkPotentialConflicts(userRequest, currentWorld.context);
    if (conflicts.length > 0) {
      console.warn('⚠️ Conflitos detectados:', conflicts);
    }

    try {
      const prompt = GamePromptsSpecialist.getWorldExpansionPrompt(userRequest, currentWorld.context);
      
      const model = this.geminiInstance.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          topK: 30,
          topP: 0.9,
          maxOutputTokens: 4096,
        }
      });

      const result = await model.generateContent(prompt);
      const expansionCode = this.cleanGameCode(result.response.text() || '');

      // Extrair novos elementos da expansão
      const newElements = this.extractGameElements(expansionCode);

      const expansion: GameExpansion = {
        id: this.generateExpansionId(),
        timestamp: new Date(),
        description: userRequest,
        addedElements: newElements,
        codeChanges: [expansionCode],
        performanceImpact: {
          fpsChange: -newElements.length * 0.5, // Estimativa
          memoryChange: newElements.length * 10, // MB
          drawCallsChange: newElements.length
        }
      };

      console.log('✅ ARTESÃO DE MUNDOS: Expansão criada!', {
        id: expansion.id,
        newElements: newElements.length,
        description: userRequest
      });

      return expansion;

    } catch (error) {
      console.error('❌ ARTESÃO DE MUNDOS: Erro na expansão:', error);
      throw new Error(`Falha na expansão do mundo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Analisa a qualidade de um mundo de jogo
   */
  analyzeGameWorld(gameWorld: GameWorld): GameAnalysis {
    const issues: GameIssue[] = [];
    const suggestions: string[] = [];

    // Análise de performance
    if (gameWorld.context.performance.fps < gameWorld.performanceProfile.targetFPS) {
      issues.push({
        type: 'performance',
        severity: 'high',
        description: `FPS abaixo do alvo (${gameWorld.context.performance.fps} < ${gameWorld.performanceProfile.targetFPS})`,
        fix: 'Implementar LOD e reduzir complexidade de geometrias'
      });
    }

    // Análise de elementos
    if (gameWorld.context.elements.length === 0) {
      issues.push({
        type: 'gameplay',
        severity: 'critical',
        description: 'Mundo vazio sem elementos interativos',
        fix: 'Adicionar elementos de gameplay (objetos, NPCs, obstáculos)'
      });
    }

    // Análise de áudio
    if (gameWorld.context.audio.backgroundMusic === undefined && gameWorld.settings.audioQuality !== 'low') {
      suggestions.push('Adicionar música de fundo para melhorar imersão');
    }

    // Calcular scores
    const qualityScore = Math.max(0, 100 - issues.length * 10);
    const performanceScore = Math.min(100, (gameWorld.context.performance.fps / gameWorld.performanceProfile.targetFPS) * 100);
    const interactivityScore = Math.min(100, gameWorld.context.elements.length * 10);

    return {
      qualityScore,
      performanceScore,
      interactivityScore,
      issues,
      suggestions
    };
  }

  // ===== MÉTODOS PRIVADOS =====

  private cleanGameCode(code: string): string {
    // Remove markdown code blocks
    let cleaned = code.replace(/```html\s*/g, '').replace(/```\s*$/g, '');
    cleaned = cleaned.replace(/```javascript\s*/g, '').replace(/```\s*$/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');
    
    // Ensure it starts with DOCTYPE if it's HTML
    if (cleaned.includes('<html') && !cleaned.includes('<!DOCTYPE')) {
      cleaned = '<!DOCTYPE html>\n' + cleaned;
    }
    
    return cleaned.trim();
  }

  private generateWorldId(): string {
    return `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExpansionId(): string {
    return `expansion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGameName(request: string, gameType: string): string {
    const words = request.split(' ').slice(0, 3);
    const gameTypeName = gameType.charAt(0).toUpperCase() + gameType.slice(1);
    return `${words.join(' ')} ${gameTypeName}`.trim();
  }

  private extractGameElements(code: string): GameElement[] {
    const elements: GameElement[] = [];
    
    // Extrair elementos básicos do código (implementação simplificada)
    const meshMatches = code.match(/new THREE\.Mesh\([^)]+\)/g) || [];
    const lightMatches = code.match(/new THREE\.(DirectionalLight|PointLight|SpotLight|AmbientLight)/g) || [];
    const audioMatches = code.match(/new THREE\.(Audio|PositionalAudio)/g) || [];

    meshMatches.forEach((match, index) => {
      elements.push({
        id: `mesh_${index}`,
        type: 'mesh',
        name: `Mesh ${index + 1}`,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        properties: { code: match },
        dependencies: [],
        conflicts: [],
        createdAt: new Date(),
        performance: { triangles: 100, drawCalls: 1, memoryUsage: 1, cpuImpact: 0.1 }
      });
    });

    lightMatches.forEach((match, index) => {
      elements.push({
        id: `light_${index}`,
        type: 'light',
        name: `Light ${index + 1}`,
        position: { x: 0, y: 10, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        properties: { code: match },
        dependencies: [],
        conflicts: [],
        createdAt: new Date(),
        performance: { triangles: 0, drawCalls: 0, memoryUsage: 0.1, cpuImpact: 0.05 }
      });
    });

    return elements;
  }

  private extractTerrainData(code: string, options: GameCreationOptions): TerrainData {
    // Análise simplificada do terreno
    if (code.includes('PlaneGeometry')) {
      return {
        type: 'flat',
        size: 100,
        textures: ['grass', 'dirt']
      };
    }
    
    return {
      type: 'flat',
      size: 50,
      textures: ['default']
    };
  }

  private extractLightingSetup(code: string, options: GameCreationOptions): LightingSetup {
    return {
      type: 'daylight',
      ambientColor: '#404040',
      directionalLight: true,
      shadows: options.graphicsQuality !== 'low',
      fog: false
    };
  }

  private extractAudioContext(code: string): AudioContext3D {
    return {
      backgroundMusic: code.includes('PLACEHOLDER_MUSIC') ? 'background' : undefined,
      ambientSounds: [],
      effectSounds: [],
      reverbZones: []
    };
  }

  private extractPhysicsWorld(code: string, options: GameCreationOptions): PhysicsWorld {
    return {
      engine: options.physicsEngine,
      gravity: { x: 0, y: -9.82, z: 0 },
      rigidBodies: [],
      constraints: []
    };
  }

  private checkPotentialConflicts(request: string, context: GameWorldContext): Conflict[] {
    const conflicts: Conflict[] = [];
    
    // Verificar se há muitos elementos (performance)
    if (context.elements.length > 50) {
      conflicts.push({
        type: 'performance',
        severity: 'medium',
        description: 'Muitos elementos podem impactar performance',
        affectedElements: context.elements.map(e => e.id),
        suggestedFix: 'Considerar usar InstancedMesh para objetos similares'
      });
    }

    return conflicts;
  }
}

// ===== EXPORT SINGLETON =====
export const artesaoMundos = ArtesaoMundosService.getInstance();