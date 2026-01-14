// services/GameWorldContext.ts
// SISTEMA LEGO VERDADEIRO - CONTEXTO PERSISTENTE PARA MUNDOS DE JOGOS

import type { 
  GameWorldContext, 
  GameElement, 
  Vector3, 
  Conflict, 
  ValidationResult,
  Box3,
  TerrainData,
  LightingSetup,
  AudioContext3D,
  PhysicsWorld,
  PerformanceMetrics,
  WorldBounds
} from './ArtesaoMundosService';

/**
 * 🧱 GERENCIADOR DE CONTEXTO DE MUNDO - SISTEMA LEGO VERDADEIRO
 * 
 * Mantém estado persistente entre expansões, detecta conflitos,
 * sugere posicionamentos e garante integridade do mundo.
 */

export class GameWorldContextManager {
  private context: GameWorldContext;
  private changeHistory: ContextChange[] = [];
  private conflictRules: ConflictRule[] = [];

  constructor(initialContext: GameWorldContext) {
    this.context = { ...initialContext };
    this.initializeConflictRules();
  }

  // ===== SISTEMA LEGO - ADIÇÃO DE ELEMENTOS =====

  /**
   * Adiciona um novo elemento ao mundo com validação completa
   */
  addElement(element: GameElement): ValidationResult {
    console.log('🧱 SISTEMA LEGO: Adicionando elemento', element.name);

    // 1. Validar elemento
    const validation = this.validateElement(element);
    if (!validation.isValid) {
      return validation;
    }

    // 2. Verificar conflitos
    const conflicts = this.checkConflicts(element);
    if (conflicts.some(c => c.severity === 'high' || c.severity === 'medium')) {
      return {
        isValid: false,
        errors: conflicts.map(c => c.description),
        warnings: [],
        suggestions: conflicts.map(c => c.suggestedFix)
      };
    }

    // 3. Otimizar posição se necessário
    const optimizedPosition = this.optimizePosition(element);
    if (optimizedPosition) {
      element.position = optimizedPosition;
      validation.suggestions.push(`Posição otimizada para (${optimizedPosition.x}, ${optimizedPosition.y}, ${optimizedPosition.z})`);
    }

    // 4. Adicionar ao contexto
    this.context.elements.push(element);
    this.context.lastModified = new Date();

    // 5. Registrar mudança
    this.recordChange({
      type: 'add',
      elementId: element.id,
      timestamp: new Date(),
      description: `Adicionado ${element.type}: ${element.name}`
    });

    // 6. Atualizar métricas de performance
    this.updatePerformanceMetrics();

    console.log('✅ SISTEMA LEGO: Elemento adicionado com sucesso');
    return {
      isValid: true,
      errors: [],
      warnings: conflicts.filter(c => c.severity === 'low').map(c => c.description),
      suggestions: validation.suggestions
    };
  }

  /**
   * Remove um elemento do mundo
   */
  removeElement(elementId: string): boolean {
    const elementIndex = this.context.elements.findIndex(e => e.id === elementId);
    if (elementIndex === -1) {
      return false;
    }

    const element = this.context.elements[elementIndex];
    
    // Verificar dependências
    const dependentElements = this.context.elements.filter(e => 
      e.dependencies.includes(elementId)
    );

    if (dependentElements.length > 0) {
      console.warn('⚠️ SISTEMA LEGO: Elemento tem dependências:', dependentElements.map(e => e.name));
      return false;
    }

    // Remover elemento
    this.context.elements.splice(elementIndex, 1);
    this.context.lastModified = new Date();

    // Registrar mudança
    this.recordChange({
      type: 'remove',
      elementId: elementId,
      timestamp: new Date(),
      description: `Removido ${element.type}: ${element.name}`
    });

    // Atualizar métricas
    this.updatePerformanceMetrics();

    console.log('✅ SISTEMA LEGO: Elemento removido');
    return true;
  }

  // ===== DETECÇÃO DE CONFLITOS =====

  /**
   * Verifica conflitos de um novo elemento com o mundo existente
   */
  checkConflicts(newElement: GameElement): Conflict[] {
    const conflicts: Conflict[] = [];

    // 1. Conflitos de posição
    const positionConflicts = this.checkPositionConflicts(newElement);
    conflicts.push(...positionConflicts);

    // 2. Conflitos de nome
    const nameConflicts = this.checkNameConflicts(newElement);
    conflicts.push(...nameConflicts);

    // 3. Conflitos de dependência
    const dependencyConflicts = this.checkDependencyConflicts(newElement);
    conflicts.push(...dependencyConflicts);

    // 4. Conflitos de performance
    const performanceConflicts = this.checkPerformanceConflicts(newElement);
    conflicts.push(...performanceConflicts);

    // 5. Conflitos específicos por tipo
    const typeConflicts = this.checkTypeSpecificConflicts(newElement);
    conflicts.push(...typeConflicts);

    return conflicts;
  }

  /**
   * Sugere posições alternativas para um elemento
   */
  suggestPlacement(element: GameElement): Vector3[] {
    const suggestions: Vector3[] = [];
    const { bounds } = this.context;
    const safeDistance = 5; // Distância mínima entre elementos

    // Gerar grid de posições possíveis
    for (let x = bounds.min.x; x <= bounds.max.x; x += safeDistance) {
      for (let z = bounds.min.z; z <= bounds.max.z; z += safeDistance) {
        const y = this.getGroundHeight(x, z);
        const testPosition: Vector3 = { x, y, z };

        // Verificar se posição está livre
        if (this.isPositionFree(testPosition, safeDistance)) {
          suggestions.push(testPosition);
          
          // Limitar sugestões
          if (suggestions.length >= 10) {
            break;
          }
        }
      }
      if (suggestions.length >= 10) break;
    }

    // Ordenar por proximidade ao centro
    const center = this.getWorldCenter();
    suggestions.sort((a, b) => {
      const distA = this.calculateDistance(a, center);
      const distB = this.calculateDistance(b, center);
      return distA - distB;
    });

    return suggestions;
  }

  // ===== PERSISTÊNCIA E SERIALIZAÇÃO =====

  /**
   * Serializa o contexto para armazenamento
   */
  serialize(): string {
    const serializedContext = {
      ...this.context,
      changeHistory: this.changeHistory,
      version: '1.0.0',
      serializedAt: new Date().toISOString()
    };

    return JSON.stringify(serializedContext, null, 2);
  }

  /**
   * Deserializa contexto do armazenamento
   */
  static deserialize(data: string): GameWorldContextManager {
    try {
      const parsed = JSON.parse(data);
      const context: GameWorldContext = {
        worldId: parsed.worldId,
        createdAt: new Date(parsed.createdAt),
        lastModified: new Date(parsed.lastModified),
        elements: parsed.elements || [],
        terrain: parsed.terrain,
        lighting: parsed.lighting,
        audio: parsed.audio,
        physics: parsed.physics,
        performance: parsed.performance,
        bounds: parsed.bounds
      };

      const manager = new GameWorldContextManager(context);
      if (parsed.changeHistory) {
        manager.changeHistory = parsed.changeHistory;
      }

      return manager;
    } catch (error) {
      console.error('❌ Erro na deserialização do contexto:', error);
      throw new Error('Falha ao carregar contexto do mundo');
    }
  }

  // ===== GETTERS E SETTERS =====

  getContext(): GameWorldContext {
    return { ...this.context };
  }

  getElements(): GameElement[] {
    return [...this.context.elements];
  }

  getElementById(id: string): GameElement | undefined {
    return this.context.elements.find(e => e.id === id);
  }

  getElementsByType(type: string): GameElement[] {
    return this.context.elements.filter(e => e.type === type);
  }

  getChangeHistory(): ContextChange[] {
    return [...this.changeHistory];
  }

  // ===== MÉTODOS PRIVADOS =====

  private initializeConflictRules(): void {
    this.conflictRules = [
      {
        name: 'position_overlap',
        check: (element: GameElement, existing: GameElement) => {
          const distance = this.calculateDistance(element.position, existing.position);
          return distance < 2; // Muito próximos
        },
        severity: 'medium',
        message: 'Elementos muito próximos podem se sobrepor'
      },
      {
        name: 'same_name',
        check: (element: GameElement, existing: GameElement) => {
          return element.name === existing.name && element.id !== existing.id;
        },
        severity: 'high',
        message: 'Nome duplicado pode causar conflitos'
      },
      {
        name: 'light_overload',
        check: (element: GameElement, existing: GameElement) => {
          if (element.type === 'light') {
            const lightCount = this.context.elements.filter(e => e.type === 'light').length;
            return lightCount >= 8; // Limite de luzes
          }
          return false;
        },
        severity: 'medium',
        message: 'Muitas luzes podem impactar performance'
      }
    ];
  }

  private validateElement(element: GameElement): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validações básicas
    if (!element.id || element.id.trim() === '') {
      errors.push('ID do elemento é obrigatório');
    }

    if (!element.name || element.name.trim() === '') {
      errors.push('Nome do elemento é obrigatório');
    }

    if (!element.type) {
      errors.push('Tipo do elemento é obrigatório');
    }

    // Validar posição
    if (!this.isPositionValid(element.position)) {
      errors.push('Posição do elemento está fora dos limites do mundo');
    }

    // Validações específicas por tipo
    switch (element.type) {
      case 'mesh':
        if (!element.properties.geometry) {
          warnings.push('Mesh sem geometria definida');
        }
        break;
      case 'light':
        if (!element.properties.intensity) {
          suggestions.push('Definir intensidade da luz para melhor controle');
        }
        break;
      case 'audio':
        if (!element.properties.source) {
          errors.push('Fonte de áudio é obrigatória');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  private checkPositionConflicts(element: GameElement): Conflict[] {
    const conflicts: Conflict[] = [];
    const minDistance = 1.5;

    for (const existing of this.context.elements) {
      const distance = this.calculateDistance(element.position, existing.position);
      
      if (distance < minDistance) {
        conflicts.push({
          type: 'position',
          severity: 'medium',
          description: `Muito próximo de ${existing.name} (distância: ${distance.toFixed(2)})`,
          affectedElements: [existing.id],
          suggestedFix: `Mover para posição com pelo menos ${minDistance}m de distância`
        });
      }
    }

    return conflicts;
  }

  private checkNameConflicts(element: GameElement): Conflict[] {
    const conflicts: Conflict[] = [];
    
    const existingWithSameName = this.context.elements.find(e => 
      e.name === element.name && e.id !== element.id
    );

    if (existingWithSameName) {
      conflicts.push({
        type: 'name',
        severity: 'high',
        description: `Nome '${element.name}' já existe`,
        affectedElements: [existingWithSameName.id],
        suggestedFix: `Usar nome único como '${element.name}_${Date.now()}'`
      });
    }

    return conflicts;
  }

  private checkDependencyConflicts(element: GameElement): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const depId of element.dependencies) {
      const dependency = this.context.elements.find(e => e.id === depId);
      if (!dependency) {
        conflicts.push({
          type: 'dependency',
          severity: 'high',
          description: `Dependência '${depId}' não encontrada`,
          affectedElements: [depId],
          suggestedFix: 'Remover dependência ou criar elemento dependente primeiro'
        });
      }
    }

    return conflicts;
  }

  private checkPerformanceConflicts(element: GameElement): Conflict[] {
    const conflicts: Conflict[] = [];
    const currentTriangles = this.context.performance.triangles;
    const newTriangles = element.performance.triangles;

    if (currentTriangles + newTriangles > 100000) {
      conflicts.push({
        type: 'performance',
        severity: 'medium',
        description: `Adição pode exceder limite de triângulos (${currentTriangles + newTriangles} > 100000)`,
        affectedElements: [element.id],
        suggestedFix: 'Usar geometria com menos detalhes ou implementar LOD'
      });
    }

    return conflicts;
  }

  private checkTypeSpecificConflicts(element: GameElement): Conflict[] {
    const conflicts: Conflict[] = [];

    switch (element.type) {
      case 'light':
        const lightCount = this.context.elements.filter(e => e.type === 'light').length;
        if (lightCount >= 8) {
          conflicts.push({
            type: 'performance',
            severity: 'medium',
            description: 'Muitas luzes podem impactar performance',
            affectedElements: this.context.elements.filter(e => e.type === 'light').map(e => e.id),
            suggestedFix: 'Considerar usar menos luzes ou light baking'
          });
        }
        break;

      case 'audio':
        const audioCount = this.context.elements.filter(e => e.type === 'audio').length;
        if (audioCount >= 16) {
          conflicts.push({
            type: 'performance',
            severity: 'low',
            description: 'Muitas fontes de áudio simultâneas',
            affectedElements: this.context.elements.filter(e => e.type === 'audio').map(e => e.id),
            suggestedFix: 'Implementar sistema de pooling de áudio'
          });
        }
        break;
    }

    return conflicts;
  }

  private optimizePosition(element: GameElement): Vector3 | null {
    // Se posição está fora dos limites, mover para dentro
    const { bounds } = this.context;
    let optimized = false;
    const newPosition = { ...element.position };

    if (newPosition.x < bounds.min.x) {
      newPosition.x = bounds.min.x + 1;
      optimized = true;
    }
    if (newPosition.x > bounds.max.x) {
      newPosition.x = bounds.max.x - 1;
      optimized = true;
    }
    if (newPosition.z < bounds.min.z) {
      newPosition.z = bounds.min.z + 1;
      optimized = true;
    }
    if (newPosition.z > bounds.max.z) {
      newPosition.z = bounds.max.z - 1;
      optimized = true;
    }

    // Ajustar altura para o chão
    const groundHeight = this.getGroundHeight(newPosition.x, newPosition.z);
    if (element.type === 'mesh' && newPosition.y < groundHeight) {
      newPosition.y = groundHeight + 0.5;
      optimized = true;
    }

    return optimized ? newPosition : null;
  }

  private updatePerformanceMetrics(): void {
    const metrics: PerformanceMetrics = {
      fps: this.context.performance.fps, // Mantém FPS atual
      drawCalls: this.context.elements.length, // Aproximação
      triangles: this.context.elements.reduce((sum, el) => sum + el.performance.triangles, 0),
      memoryUsage: this.context.elements.reduce((sum, el) => sum + el.performance.memoryUsage, 0),
      bottlenecks: []
    };

    // Detectar bottlenecks
    if (metrics.triangles > 50000) {
      metrics.bottlenecks.push('high_triangle_count');
    }
    if (metrics.drawCalls > 100) {
      metrics.bottlenecks.push('high_draw_calls');
    }
    if (metrics.memoryUsage > 256) {
      metrics.bottlenecks.push('high_memory_usage');
    }

    this.context.performance = metrics;
  }

  private recordChange(change: ContextChange): void {
    this.changeHistory.push(change);
    
    // Manter apenas últimas 100 mudanças
    if (this.changeHistory.length > 100) {
      this.changeHistory = this.changeHistory.slice(-100);
    }
  }

  private isPositionValid(position: Vector3): boolean {
    const { bounds } = this.context;
    return position.x >= bounds.min.x && position.x <= bounds.max.x &&
           position.y >= bounds.min.y && position.y <= bounds.max.y &&
           position.z >= bounds.min.z && position.z <= bounds.max.z;
  }

  private isPositionFree(position: Vector3, minDistance: number): boolean {
    return !this.context.elements.some(element => {
      const distance = this.calculateDistance(position, element.position);
      return distance < minDistance;
    });
  }

  private getGroundHeight(x: number, z: number): number {
    // Implementação simplificada - assumir terreno plano
    return 0;
  }

  private getWorldCenter(): Vector3 {
    const { bounds } = this.context;
    return {
      x: (bounds.min.x + bounds.max.x) / 2,
      y: (bounds.min.y + bounds.max.y) / 2,
      z: (bounds.min.z + bounds.max.z) / 2
    };
  }

  private calculateDistance(pos1: Vector3, pos2: Vector3): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

// ===== INTERFACES AUXILIARES =====

interface ContextChange {
  type: 'add' | 'remove' | 'modify';
  elementId: string;
  timestamp: Date;
  description: string;
}

interface ConflictRule {
  name: string;
  check: (element: GameElement, existing: GameElement) => boolean;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export default GameWorldContextManager;