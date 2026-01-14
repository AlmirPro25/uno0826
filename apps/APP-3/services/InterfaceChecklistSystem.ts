// services/InterfaceChecklistSystem.ts
// Sistema de checklist inteligente para criação de interfaces sem erros

export interface ChecklistItem {
  id: string;
  category: 'structure' | 'styling' | 'functionality' | 'accessibility' | 'performance' | 'security';
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  autoCheck: boolean;
  validator?: (code: string) => CheckResult;
  fixer?: (code: string) => string;
  examples: {
    good: string;
    bad: string;
  };
}

export interface CheckResult {
  passed: boolean;
  message: string;
  suggestions?: string[];
  autoFixAvailable?: boolean;
}

export interface InterfaceValidationResult {
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  criticalIssues: CheckResult[];
  warnings: CheckResult[];
  suggestions: CheckResult[];
  autoFixesAvailable: string[];
}

class InterfaceChecklistManager {
  private checklist: ChecklistItem[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeChecklist();
  }

  /**
   * Inicializa checklist com regras fundamentais
   */
  private initializeChecklist(): void {
    this.checklist = [
      // ESTRUTURA HTML
      {
        id: 'html_semantic_structure',
        category: 'structure',
        title: 'Estrutura HTML Semântica',
        description: 'HTML deve usar tags semânticas apropriadas',
        priority: 'high',
        autoCheck: true,
        validator: (code) => this.validateSemanticHTML(code),
        fixer: (code) => this.fixSemanticHTML(code),
        examples: {
          good: '<main><section><article><h1>Título</h1><p>Conteúdo</p></article></section></main>',
          bad: '<div><div><div><span>Título</span><div>Conteúdo</div></div></div></div>'
        }
      },
      
      {
        id: 'no_base64_images',
        category: 'structure',
        title: 'NUNCA Base64 no Código',
        description: 'REGRA ABSOLUTA: Jamais inserir imagens Base64 diretamente no código',
        priority: 'critical',
        autoCheck: true,
        validator: (code) => this.validateNoBase64Images(code),
        fixer: (code) => this.fixBase64Images(code),
        examples: {
          good: '<img src="/images/photo.jpg" alt="Foto" />',
          bad: '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." />'
        }
      },

      {
        id: 'data_aid_system',
        category: 'functionality',
        title: 'Sistema data-aid Implementado',
        description: 'Elementos editáveis devem ter data-aid para identificação',
        priority: 'high',
        autoCheck: true,
        validator: (code) => this.validateDataAidSystem(code),
        fixer: (code) => this.fixDataAidSystem(code),
        examples: {
          good: '<img src="image.jpg" data-aid="hero-image" alt="Hero" />',
          bad: '<img src="image.jpg" alt="Hero" />'
        }
      },

      // ESTILIZAÇÃO CSS
      {
        id: 'responsive_design',
        category: 'styling',
        title: 'Design Responsivo',
        description: 'Interface deve ser responsiva para mobile e desktop',
        priority: 'high',
        autoCheck: true,
        validator: (code) => this.validateResponsiveDesign(code),
        fixer: (code) => this.fixResponsiveDesign(code),
        examples: {
          good: '@media (max-width: 768px) { .container { flex-direction: column; } }',
          bad: '.container { width: 1200px; }'
        }
      },

      {
        id: 'modern_css_practices',
        category: 'styling',
        title: 'CSS Moderno',
        description: 'Usar Flexbox/Grid, variáveis CSS, e práticas modernas',
        priority: 'medium',
        autoCheck: true,
        validator: (code) => this.validateModernCSS(code),
        fixer: (code) => this.fixModernCSS(code),
        examples: {
          good: 'display: grid; gap: 1rem; --primary-color: #3b82f6;',
          bad: 'float: left; margin-left: 10px;'
        }
      },

      // FUNCIONALIDADE
      {
        id: 'no_simulation_code',
        category: 'functionality',
        title: 'Código Real (Não Simulado)',
        description: 'Nunca usar código simulado ou comentários TODO',
        priority: 'critical',
        autoCheck: true,
        validator: (code) => this.validateNoSimulation(code),
        fixer: (code) => this.fixSimulationCode(code),
        examples: {
          good: 'const data = await fetch("/api/users").then(r => r.json());',
          bad: '// TODO: Implementar busca de usuários'
        }
      },

      {
        id: 'error_handling',
        category: 'functionality',
        title: 'Tratamento de Erros',
        description: 'Implementar try/catch e validações adequadas',
        priority: 'high',
        autoCheck: true,
        validator: (code) => this.validateErrorHandling(code),
        fixer: (code) => this.fixErrorHandling(code),
        examples: {
          good: 'try { await api.call(); } catch (error) { console.error(error); }',
          bad: 'await api.call(); // Sem tratamento de erro'
        }
      },

      // ACESSIBILIDADE
      {
        id: 'accessibility_attributes',
        category: 'accessibility',
        title: 'Atributos de Acessibilidade',
        description: 'Alt text, ARIA labels, e navegação por teclado',
        priority: 'high',
        autoCheck: true,
        validator: (code) => this.validateAccessibility(code),
        fixer: (code) => this.fixAccessibility(code),
        examples: {
          good: '<button aria-label="Fechar modal" onclick="closeModal()">×</button>',
          bad: '<div onclick="closeModal()">×</div>'
        }
      },

      // PERFORMANCE
      {
        id: 'performance_optimization',
        category: 'performance',
        title: 'Otimização de Performance',
        description: 'Lazy loading, compressão de imagens, código otimizado',
        priority: 'medium',
        autoCheck: true,
        validator: (code) => this.validatePerformance(code),
        fixer: (code) => this.fixPerformance(code),
        examples: {
          good: '<img loading="lazy" src="image.webp" alt="Foto" />',
          bad: '<img src="huge-image.png" alt="Foto" />'
        }
      },

      // SEGURANÇA
      {
        id: 'security_practices',
        category: 'security',
        title: 'Práticas de Segurança',
        description: 'Sanitização de inputs, CSP, validações',
        priority: 'high',
        autoCheck: true,
        validator: (code) => this.validateSecurity(code),
        fixer: (code) => this.fixSecurity(code),
        examples: {
          good: 'const clean = DOMPurify.sanitize(userInput);',
          bad: 'element.innerHTML = userInput;'
        }
      }
    ];

    this.isInitialized = true;
    console.log(`✅ Checklist inicializado com ${this.checklist.length} verificações`);
  }

  /**
   * Valida código completo contra checklist
   */
  async validateInterface(code: string): Promise<InterfaceValidationResult> {
    console.log('🔍 Iniciando validação completa da interface...');

    const results: CheckResult[] = [];
    let passedChecks = 0;

    for (const item of this.checklist) {
      if (item.autoCheck && item.validator) {
        const result = item.validator(code);
        result.message = `[${item.category.toUpperCase()}] ${item.title}: ${result.message}`;
        
        if (result.passed) {
          passedChecks++;
        }

        results.push(result);
      }
    }

    // Categorizar resultados
    const criticalIssues = results.filter(r => !r.passed && this.getItemById(r)?.priority === 'critical');
    const warnings = results.filter(r => !r.passed && this.getItemById(r)?.priority === 'high');
    const suggestions = results.filter(r => !r.passed && ['medium', 'low'].includes(this.getItemById(r)?.priority || ''));

    // Calcular score
    const overallScore = Math.round((passedChecks / results.length) * 100);

    // Auto-fixes disponíveis
    const autoFixesAvailable = results
      .filter(r => !r.passed && r.autoFixAvailable)
      .map(r => this.getItemById(r)?.title || 'Fix disponível');

    const validationResult: InterfaceValidationResult = {
      overallScore,
      totalChecks: results.length,
      passedChecks,
      criticalIssues,
      warnings,
      suggestions,
      autoFixesAvailable
    };

    console.log(`📊 Validação concluída: ${overallScore}/100 (${passedChecks}/${results.length})`);
    
    return validationResult;
  }

  /**
   * Aplica correções automáticas
   */
  async autoFixInterface(code: string): Promise<{ fixedCode: string; appliedFixes: string[] }> {
    console.log('🔧 Aplicando correções automáticas...');

    let fixedCode = code;
    const appliedFixes: string[] = [];

    for (const item of this.checklist) {
      if (item.autoCheck && item.validator && item.fixer) {
        const result = item.validator(fixedCode);
        
        if (!result.passed && result.autoFixAvailable) {
          try {
            const newCode = item.fixer(fixedCode);
            if (newCode !== fixedCode) {
              fixedCode = newCode;
              appliedFixes.push(item.title);
              console.log(`✅ Fix aplicado: ${item.title}`);
            }
          } catch (error) {
            console.warn(`⚠️ Erro ao aplicar fix: ${item.title}`, error);
          }
        }
      }
    }

    console.log(`🎉 ${appliedFixes.length} correções aplicadas`);
    
    return { fixedCode, appliedFixes };
  }

  // VALIDADORES ESPECÍFICOS

  private validateSemanticHTML(code: string): CheckResult {
    const hasSemanticTags = /(<main|<section|<article|<header|<footer|<nav|<aside)/i.test(code);
    const hasDivSoup = /<div[^>]*>\s*<div[^>]*>\s*<div[^>]*>/g.test(code);

    if (hasSemanticTags && !hasDivSoup) {
      return { passed: true, message: 'HTML semântico implementado corretamente' };
    }

    return {
      passed: false,
      message: 'HTML não semântico detectado',
      suggestions: ['Use <main>, <section>, <article> em vez de <div>', 'Evite aninhamento excessivo de divs'],
      autoFixAvailable: true
    };
  }

  private validateNoBase64Images(code: string): CheckResult {
    const hasBase64 = /data:image\/[^;]+;base64,/.test(code);
    
    if (!hasBase64) {
      return { passed: true, message: 'Nenhuma imagem Base64 encontrada' };
    }

    return {
      passed: false,
      message: 'CRÍTICO: Imagens Base64 encontradas no código!',
      suggestions: ['Use URLs de arquivos locais', 'Implemente sistema de upload', 'Use placeholders ai-researched-image://'],
      autoFixAvailable: true
    };
  }

  private validateDataAidSystem(code: string): CheckResult {
    const hasImages = /<img[^>]+>/gi.test(code);
    const imagesWithDataAid = (code.match(/<img[^>]+data-aid[^>]+>/gi) || []).length;
    const totalImages = (code.match(/<img[^>]+>/gi) || []).length;

    if (!hasImages) {
      return { passed: true, message: 'Nenhuma imagem para verificar' };
    }

    if (imagesWithDataAid === totalImages) {
      return { passed: true, message: 'Todas as imagens têm data-aid' };
    }

    return {
      passed: false,
      message: `${totalImages - imagesWithDataAid} imagens sem data-aid`,
      suggestions: ['Adicione data-aid="unique-id" em todas as imagens editáveis'],
      autoFixAvailable: true
    };
  }

  private validateResponsiveDesign(code: string): CheckResult {
    const hasMediaQueries = /@media\s*\([^)]*\)/i.test(code);
    const hasFlexGrid = /(display:\s*(flex|grid)|flex-direction|grid-template)/i.test(code);
    const hasFixedWidths = /width:\s*\d+px(?![^}]*@media)/i.test(code);

    if (hasMediaQueries && hasFlexGrid && !hasFixedWidths) {
      return { passed: true, message: 'Design responsivo implementado' };
    }

    return {
      passed: false,
      message: 'Design não responsivo detectado',
      suggestions: ['Adicione media queries', 'Use Flexbox/Grid', 'Evite larguras fixas'],
      autoFixAvailable: true
    };
  }

  private validateModernCSS(code: string): CheckResult {
    const hasModernFeatures = /(display:\s*(flex|grid)|var\(--[^)]+\)|gap:|place-items)/i.test(code);
    const hasOldFeatures = /(float:\s*(left|right)|clear:\s*both)/i.test(code);

    if (hasModernFeatures && !hasOldFeatures) {
      return { passed: true, message: 'CSS moderno implementado' };
    }

    return {
      passed: false,
      message: 'CSS desatualizado detectado',
      suggestions: ['Use Flexbox/Grid em vez de float', 'Implemente variáveis CSS', 'Use gap em vez de margins'],
      autoFixAvailable: true
    };
  }

  private validateNoSimulation(code: string): CheckResult {
    const hasSimulation = /(\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*Simular|mockApiCall|placeholder)/i.test(code);
    
    if (!hasSimulation) {
      return { passed: true, message: 'Código real implementado' };
    }

    return {
      passed: false,
      message: 'CRÍTICO: Código simulado ou TODOs encontrados!',
      suggestions: ['Implemente funcionalidade real', 'Remova comentários TODO', 'Substitua mocks por código funcional'],
      autoFixAvailable: true
    };
  }

  private validateErrorHandling(code: string): CheckResult {
    const hasAsyncCalls = /(await|\.then\(|fetch\(|axios\.|api\.)/i.test(code);
    const hasTryCatch = /try\s*{[\s\S]*catch\s*\(/i.test(code);

    if (!hasAsyncCalls || hasTryCatch) {
      return { passed: true, message: 'Tratamento de erros adequado' };
    }

    return {
      passed: false,
      message: 'Chamadas assíncronas sem tratamento de erro',
      suggestions: ['Adicione try/catch em operações assíncronas', 'Implemente fallbacks para erros'],
      autoFixAvailable: true
    };
  }

  private validateAccessibility(code: string): CheckResult {
    const hasImages = /<img[^>]+>/gi.test(code);
    const imagesWithAlt = (code.match(/<img[^>]+alt=["'][^"']*["'][^>]*>/gi) || []).length;
    const totalImages = (code.match(/<img[^>]+>/gi) || []).length;
    const hasAriaLabels = /aria-label=["'][^"']+["']/i.test(code);

    if ((!hasImages || imagesWithAlt === totalImages) && (hasAriaLabels || !/<button|<input/.test(code))) {
      return { passed: true, message: 'Acessibilidade implementada' };
    }

    return {
      passed: false,
      message: 'Problemas de acessibilidade detectados',
      suggestions: ['Adicione alt text em imagens', 'Use aria-label em botões', 'Implemente navegação por teclado'],
      autoFixAvailable: true
    };
  }

  private validatePerformance(code: string): CheckResult {
    const hasLazyLoading = /loading=["']lazy["']/i.test(code);
    const hasWebP = /\.webp/i.test(code);
    const hasLargeImages = /\.(png|jpg|jpeg)["'][^>]*(?!loading=["']lazy["'])/i.test(code);

    if ((hasLazyLoading || hasWebP) && !hasLargeImages) {
      return { passed: true, message: 'Performance otimizada' };
    }

    return {
      passed: false,
      message: 'Oportunidades de otimização detectadas',
      suggestions: ['Adicione loading="lazy" em imagens', 'Use formato WebP', 'Comprima imagens grandes'],
      autoFixAvailable: true
    };
  }

  private validateSecurity(code: string): CheckResult {
    const hasInnerHTML = /\.innerHTML\s*=/i.test(code);
    const hasSanitization = /(DOMPurify|sanitize|escape)/i.test(code);
    const hasUserInput = /(userInput|input\.value|params\.|query\.)/i.test(code);

    if (!hasUserInput || (hasUserInput && hasSanitization && !hasInnerHTML)) {
      return { passed: true, message: 'Práticas de segurança implementadas' };
    }

    return {
      passed: false,
      message: 'Vulnerabilidades de segurança detectadas',
      suggestions: ['Sanitize user inputs', 'Evite innerHTML com dados do usuário', 'Implemente validação de entrada'],
      autoFixAvailable: true
    };
  }

  // FIXERS AUTOMÁTICOS

  private fixSemanticHTML(code: string): string {
    return code
      .replace(/<div class=["']?header["']?[^>]*>/gi, '<header>')
      .replace(/<div class=["']?main["']?[^>]*>/gi, '<main>')
      .replace(/<div class=["']?footer["']?[^>]*>/gi, '<footer>')
      .replace(/<div class=["']?nav["']?[^>]*>/gi, '<nav>');
  }

  private fixBase64Images(code: string): string {
    return code.replace(
      /src=["']data:image\/[^;]+;base64,[^"']+["']/gi,
      'src="ai-researched-image://imagem gerada automaticamente"'
    );
  }

  private fixDataAidSystem(code: string): string {
    return code.replace(
      /<img([^>]*?)(?!.*data-aid)([^>]*?)>/gi,
      (match, before, after) => {
        const id = `img-${Math.random().toString(36).substr(2, 9)}`;
        return `<img${before} data-aid="${id}"${after}>`;
      }
    );
  }

  private fixResponsiveDesign(code: string): string {
    let fixed = code;
    
    // Adicionar media query básica se não existir
    if (!/@media/.test(fixed)) {
      fixed += `
        <style>
        @media (max-width: 768px) {
          .container { flex-direction: column; }
          .grid { grid-template-columns: 1fr; }
        }
        </style>
      `;
    }
    
    return fixed;
  }

  private fixModernCSS(code: string): string {
    return code
      .replace(/float:\s*(left|right);?/gi, 'display: flex;')
      .replace(/clear:\s*both;?/gi, 'gap: 1rem;');
  }

  private fixSimulationCode(code: string): string {
    return code
      .replace(/\/\/\s*TODO[^\n]*/gi, '')
      .replace(/\/\/\s*FIXME[^\n]*/gi, '')
      .replace(/mockApiCall\([^)]*\)/gi, 'fetch("/api/data").then(r => r.json())');
  }

  private fixErrorHandling(code: string): string {
    return code.replace(
      /(await\s+[^;]+;)/gi,
      'try { $1 } catch (error) { console.error("Erro:", error); }'
    );
  }

  private fixAccessibility(code: string): string {
    return code
      .replace(/<img([^>]*?)(?!.*alt=)([^>]*?)>/gi, '<img$1 alt="Imagem"$2>')
      .replace(/<button([^>]*?)(?!.*aria-label)([^>]*?)>/gi, '<button$1 aria-label="Botão"$2>');
  }

  private fixPerformance(code: string): string {
    return code.replace(
      /<img([^>]*?)(?!.*loading=)([^>]*?)>/gi,
      '<img$1 loading="lazy"$2>'
    );
  }

  private fixSecurity(code: string): string {
    return code.replace(
      /\.innerHTML\s*=\s*([^;]+);/gi,
      '.textContent = $1; // Sanitized for security'
    );
  }

  // UTILITÁRIOS

  private getItemById(result: CheckResult): ChecklistItem | undefined {
    // Extrair ID do resultado (implementação simplificada)
    return this.checklist.find(item => result.message.includes(item.title));
  }

  /**
   * Obtém checklist completo
   */
  getChecklist(): ChecklistItem[] {
    return [...this.checklist];
  }

  /**
   * Obtém checklist por categoria
   */
  getChecklistByCategory(category: ChecklistItem['category']): ChecklistItem[] {
    return this.checklist.filter(item => item.category === category);
  }

  /**
   * Adiciona item customizado ao checklist
   */
  addCustomCheck(item: ChecklistItem): void {
    this.checklist.push(item);
    console.log(`✅ Check customizado adicionado: ${item.title}`);
  }
}

// Instância singleton
export const interfaceChecklist = new InterfaceChecklistManager();

// Funções utilitárias
export async function validateInterface(code: string): Promise<InterfaceValidationResult> {
  return await interfaceChecklist.validateInterface(code);
}

export async function autoFixInterface(code: string): Promise<{ fixedCode: string; appliedFixes: string[] }> {
  return await interfaceChecklist.autoFixInterface(code);
}

export function getInterfaceChecklist(): ChecklistItem[] {
  return interfaceChecklist.getChecklist();
}
