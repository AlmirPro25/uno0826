/**
 * ======================================================
 * EXCELLENCE CORE - O NÚCLEO DA EXCELÊNCIA PROGRAMÁVEL
 * ======================================================
 * 
 * Este módulo implementa o princípio fundamental:
 * "A mediocridade é inaceitável. Buscar excelência é obrigatório."
 * 
 * Não é apenas validação técnica - é consciência de propósito.
 */

// ============================================
// CONSTANTE SIMBÓLICA - O MANTRA INTERNO
// ============================================

export const CORE_PRINCIPLE = {
  mantra: "A mediocridade é inaceitável. Buscar excelência é obrigatório.",
  purpose: "Criar com significado, não apenas cumprir tarefas.",
  standard: "Cada linha de código, cada pixel, cada palavra deve ter propósito e qualidade.",
  commitment: "Refinar até atingir padrão elevado, sem atalhos."
} as const;

// ============================================
// CRITÉRIOS DE EXCELÊNCIA POR DOMÍNIO
// ============================================

export interface ExcellenceCriteria {
  domain: string;
  checks: ExcellenceCheck[];
  minimumScore: number; // 0-100
}

export interface ExcellenceCheck {
  name: string;
  description: string;
  weight: number; // Importância relativa (1-10)
  validator: (content: string) => ExcellenceCheckResult;
}

export interface ExcellenceCheckResult {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  suggestions: string[];
  autoFixable: boolean;
}

export interface ExcellenceReport {
  domain: string;
  overallScore: number;
  passed: boolean;
  checks: Array<{
    name: string;
    result: ExcellenceCheckResult;
  }>;
  summary: string;
  improvements: string[];
}

// ============================================
// CRITÉRIOS PARA HTML/WEB
// ============================================

export const HTML_EXCELLENCE_CRITERIA: ExcellenceCriteria = {
  domain: 'HTML/Web',
  minimumScore: 85,
  checks: [
    {
      name: 'Estrutura Semântica',
      description: 'HTML deve usar tags semânticas apropriadas',
      weight: 9,
      validator: (html: string): ExcellenceCheckResult => {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Verificar DOCTYPE
        if (!html.includes('<!DOCTYPE html>')) {
          issues.push('Falta declaração DOCTYPE');
          suggestions.push('Adicionar <!DOCTYPE html> no início');
          score -= 15;
        }

        // Verificar tags semânticas
        const semanticTags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];
        const hasSemanticTags = semanticTags.some(tag => html.includes(`<${tag}`));
        
        if (!hasSemanticTags && html.length > 500) {
          issues.push('Falta uso de tags semânticas (header, main, section, etc.)');
          suggestions.push('Usar tags semânticas para melhor estrutura e acessibilidade');
          score -= 20;
        }

        // Verificar divitis (excesso de divs)
        const divCount = (html.match(/<div/g) || []).length;
        const totalTags = (html.match(/<\w+/g) || []).length;
        
        if (divCount > totalTags * 0.5) {
          issues.push('Excesso de <div> - considere tags semânticas');
          suggestions.push('Substituir divs genéricos por tags semânticas apropriadas');
          score -= 10;
        }

        // 🎯 BÔNUS: Código excepcional pode ultrapassar 100
        if (score >= 95 && hasSemanticTags && divCount < totalTags * 0.3) {
          score += 5; // Bônus por estrutura excepcional
        }

        return {
          passed: score >= 70,
          score: Math.max(0, score), // Permite scores > 100
          issues,
          suggestions,
          autoFixable: false
        };
      }
    },
    {
      name: 'Meta Tags Essenciais',
      description: 'Deve incluir meta tags fundamentais',
      weight: 8,
      validator: (html: string): ExcellenceCheckResult => {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        const requiredMetas = [
          { tag: 'charset', pattern: /<meta\s+charset=/i, penalty: 20 },
          { tag: 'viewport', pattern: /<meta\s+name=["']viewport["']/i, penalty: 25 },
          { tag: 'description', pattern: /<meta\s+name=["']description["']/i, penalty: 15 }
        ];

        requiredMetas.forEach(meta => {
          if (!meta.pattern.test(html)) {
            issues.push(`Falta meta tag: ${meta.tag}`);
            suggestions.push(`Adicionar <meta ${meta.tag === 'charset' ? 'charset="UTF-8"' : `name="${meta.tag}"`}>`);
            score -= meta.penalty;
          }
        });

        // Verificar título
        if (!/<title>(.+?)<\/title>/i.test(html)) {
          issues.push('Falta tag <title>');
          suggestions.push('Adicionar título descritivo na página');
          score -= 20;
        } else {
          const titleMatch = html.match(/<title>(.+?)<\/title>/i);
          if (titleMatch && titleMatch[1].length < 10) {
            issues.push('Título muito curto ou genérico');
            suggestions.push('Usar título descritivo e específico (mínimo 10 caracteres)');
            score -= 10;
          }
        }

        // 🎯 BÔNUS: Meta tags completas e bem escritas
        if (score >= 95) {
          const hasOgTags = /<meta\s+property=["']og:/i.test(html);
          const hasTwitterTags = /<meta\s+name=["']twitter:/i.test(html);
          if (hasOgTags) score += 3;
          if (hasTwitterTags) score += 2;
        }

        return {
          passed: score >= 60,
          score: Math.max(0, score), // Permite scores > 100
          issues,
          suggestions,
          autoFixable: true
        };
      }
    },
    {
      name: 'Acessibilidade',
      description: 'Deve seguir princípios básicos de acessibilidade',
      weight: 10,
      validator: (html: string): ExcellenceCheckResult => {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Verificar atributo lang
        if (!/<html[^>]+lang=/i.test(html)) {
          issues.push('Falta atributo lang no <html>');
          suggestions.push('Adicionar lang="pt-BR" ou idioma apropriado');
          score -= 15;
        }

        // Verificar imagens sem alt
        const imgTags = html.match(/<img[^>]*>/gi) || [];
        const imgsWithoutAlt = imgTags.filter(img => !img.includes('alt='));
        
        if (imgsWithoutAlt.length > 0) {
          issues.push(`${imgsWithoutAlt.length} imagem(ns) sem atributo alt`);
          suggestions.push('Adicionar alt descritivo em todas as imagens');
          score -= Math.min(30, imgsWithoutAlt.length * 10);
        }

        // Verificar labels em inputs
        const inputTags = html.match(/<input[^>]*>/gi) || [];
        const hasLabels = html.includes('<label');
        
        if (inputTags.length > 0 && !hasLabels) {
          issues.push('Inputs sem labels associados');
          suggestions.push('Adicionar <label> para cada input');
          score -= 20;
        }

        // Verificar contraste (básico - verificar se há estilos inline com cores)
        const hasInlineColors = /<[^>]+style=["'][^"']*color:/i.test(html);
        if (hasInlineColors) {
          suggestions.push('Verificar contraste de cores para acessibilidade (mínimo 4.5:1)');
        }

        // Verificar botões sem texto
        const buttonTags = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
        const emptyButtons = buttonTags.filter(btn => {
          const content = btn.replace(/<button[^>]*>|<\/button>/gi, '').trim();
          return content.length === 0 || /<img[^>]*>/.test(content) && !btn.includes('aria-label');
        });

        if (emptyButtons.length > 0) {
          issues.push('Botões sem texto ou aria-label');
          suggestions.push('Adicionar texto descritivo ou aria-label em botões');
          score -= 15;
        }

        // 🎯 BÔNUS: Acessibilidade excepcional
        if (score >= 95) {
          const hasAriaLabels = /aria-label|aria-labelledby|aria-describedby/i.test(html);
          const hasRoles = /role=["'](main|navigation|banner|contentinfo|complementary)/i.test(html);
          const hasSkipLinks = /skip-to-content|skip-navigation/i.test(html);
          
          if (hasAriaLabels) score += 3;
          if (hasRoles) score += 2;
          if (hasSkipLinks) score += 5; // Bônus extra por skip links
        }

        return {
          passed: score >= 70,
          score: Math.max(0, score), // Permite scores > 100
          issues,
          suggestions,
          autoFixable: false
        };
      }
    },
    {
      name: 'Responsividade',
      description: 'Design deve ser responsivo e mobile-friendly',
      weight: 9,
      validator: (html: string): ExcellenceCheckResult => {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Verificar viewport meta tag
        if (!/<meta\s+name=["']viewport["']/i.test(html)) {
          issues.push('Falta meta viewport para responsividade');
          suggestions.push('Adicionar <meta name="viewport" content="width=device-width, initial-scale=1.0">');
          score -= 30;
        }

        // Verificar media queries
        const hasMediaQueries = /@media\s*\([^)]*\)/i.test(html);
        const hasTailwind = /tailwind|sm:|md:|lg:|xl:/i.test(html);
        
        if (!hasMediaQueries && !hasTailwind && html.length > 1000) {
          issues.push('Sem media queries ou classes responsivas');
          suggestions.push('Adicionar media queries ou usar framework responsivo (Tailwind)');
          score -= 25;
        }

        // Verificar larguras fixas
        const hasFixedWidths = /width:\s*\d+px(?!.*max-width)/i.test(html);
        if (hasFixedWidths) {
          issues.push('Uso de larguras fixas em pixels');
          suggestions.push('Usar unidades relativas (%, rem, vw) ou max-width');
          score -= 15;
        }

        // 🎯 BÔNUS: Design responsivo excepcional
        if (score >= 95 && hasTailwind) {
          const hasContainerQueries = /@container/i.test(html);
          const hasFluidTypography = /clamp\(|min\(|max\(/i.test(html);
          
          if (hasContainerQueries) score += 5;
          if (hasFluidTypography) score += 3;
        }

        return {
          passed: score >= 60,
          score: Math.max(0, score), // Permite scores > 100
          issues,
          suggestions,
          autoFixable: false
        };
      }
    },
    {
      name: 'Performance',
      description: 'Otimizações básicas de performance',
      weight: 7,
      validator: (html: string): ExcellenceCheckResult => {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Verificar scripts bloqueantes
        const scriptTags = html.match(/<script[^>]*>/gi) || [];
        const blockingScripts = scriptTags.filter(script => 
          !script.includes('async') && 
          !script.includes('defer') && 
          !script.includes('type="module"')
        );

        if (blockingScripts.length > 0) {
          issues.push(`${blockingScripts.length} script(s) bloqueante(s)`);
          suggestions.push('Adicionar async, defer ou type="module" nos scripts');
          score -= Math.min(20, blockingScripts.length * 5);
        }

        // Verificar imagens grandes inline (base64)
        const base64Images = html.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g) || [];
        const largeBase64 = base64Images.filter(img => img.length > 10000);
        
        if (largeBase64.length > 0) {
          issues.push(`${largeBase64.length} imagem(ns) grande(s) em base64`);
          suggestions.push('Considerar usar URLs externas para imagens grandes');
          score -= 15;
        }

        // Verificar CSS inline excessivo
        const inlineStyles: string[] = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
        const totalCssLength: number = inlineStyles.reduce((sum: number, style: string) => sum + style.length, 0);
        
        if (totalCssLength > 50000) {
          issues.push('CSS inline muito extenso');
          suggestions.push('Considerar minificar CSS ou usar arquivo externo');
          score -= 10;
        }

        // 🎯 BÔNUS: Performance excepcional
        if (score >= 95) {
          const hasLazyLoading = /loading=["']lazy["']/i.test(html);
          const hasPreload = /<link[^>]+rel=["']preload["']/i.test(html);
          const hasMinifiedCode = html.length < 50000 && !html.includes('\n\n\n');
          
          if (hasLazyLoading) score += 3;
          if (hasPreload) score += 2;
          if (hasMinifiedCode) score += 2;
        }

        return {
          passed: score >= 70,
          score: Math.max(0, score), // Permite scores > 100
          issues,
          suggestions,
          autoFixable: false
        };
      }
    },
    {
      name: 'Segurança',
      description: 'Práticas básicas de segurança',
      weight: 8,
      validator: (html: string): ExcellenceCheckResult => {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Verificar innerHTML ou eval
        if (/\.innerHTML\s*=|eval\(/i.test(html)) {
          issues.push('Uso de innerHTML ou eval (risco XSS)');
          suggestions.push('Usar textContent, createElement ou sanitização adequada');
          score -= 25;
        }

        // Verificar links externos sem rel
        const externalLinks = html.match(/<a[^>]+href=["']https?:\/\/[^"']+["'][^>]*>/gi) || [];
        const unsafeLinks = externalLinks.filter(link => !link.includes('rel='));
        
        if (unsafeLinks.length > 0) {
          issues.push('Links externos sem rel="noopener noreferrer"');
          suggestions.push('Adicionar rel="noopener noreferrer" em links externos');
          score -= 15;
        }

        // Verificar API keys expostas
        const hasApiKey = /api[_-]?key|apikey|secret[_-]?key/i.test(html);
        if (hasApiKey) {
          const keyPattern = /['"]([A-Za-z0-9_-]{20,})['"]/.test(html);
          if (keyPattern) {
            issues.push('⚠️ CRÍTICO: Possível API key exposta no código');
            suggestions.push('NUNCA expor API keys no frontend - usar variáveis de ambiente ou backend');
            score -= 40;
          }
        }

        // 🎯 BÔNUS: Segurança excepcional
        if (score >= 95) {
          const hasCSP = /<meta[^>]+Content-Security-Policy/i.test(html);
          const hasSRI = /integrity=["']sha/i.test(html);
          const hasHTTPS = /https:\/\//i.test(html) && !/http:\/\//i.test(html);
          
          if (hasCSP) score += 5; // Bônus grande por CSP
          if (hasSRI) score += 3;
          if (hasHTTPS) score += 2;
        }

        return {
          passed: score >= 60,
          score: Math.max(0, score), // Permite scores > 100
          issues,
          suggestions,
          autoFixable: false
        };
      }
    },
    {
      name: 'UX e Estética',
      description: 'Experiência do usuário e design visual',
      weight: 7,
      validator: (html: string): ExcellenceCheckResult => {
        const issues: string[] = [];
        const suggestions: string[] = [];
        let score = 100;

        // Verificar se há estilos (CSS)
        const hasStyles = /<style|class=|style=/i.test(html);
        if (!hasStyles && html.length > 500) {
          issues.push('Sem estilos CSS - aparência básica');
          suggestions.push('Adicionar estilos para melhor experiência visual');
          score -= 30;
        }

        // Verificar loading states
        const hasInteractivity = /<button|<input|fetch\(|axios/i.test(html);
        const hasLoadingState = /loading|spinner|skeleton/i.test(html);
        
        if (hasInteractivity && !hasLoadingState) {
          suggestions.push('Adicionar estados de loading para melhor feedback ao usuário');
          score -= 10;
        }

        // Verificar mensagens de erro
        const hasErrorHandling = /catch\s*\(|\.catch\(|error/i.test(html);
        const hasErrorUI = /error|alert|toast|notification/i.test(html);
        
        if (hasErrorHandling && !hasErrorUI) {
          suggestions.push('Adicionar UI para exibir erros ao usuário');
          score -= 10;
        }

        // Verificar animações/transições
        const hasAnimations = /transition|animation|@keyframes/i.test(html);
        if (!hasAnimations && html.length > 1000) {
          suggestions.push('Considerar adicionar transições suaves para melhor UX');
          score -= 5;
        }

        // 🎯 BÔNUS: UX excepcional
        if (score >= 95) {
          const hasDarkMode = /dark:|prefers-color-scheme/i.test(html);
          const hasAccessibleFocus = /:focus-visible|focus:ring/i.test(html);
          const hasReducedMotion = /prefers-reduced-motion/i.test(html);
          const hasMicroInteractions = /hover:|active:|transform|scale/i.test(html);
          
          if (hasDarkMode) score += 3;
          if (hasAccessibleFocus) score += 2;
          if (hasReducedMotion) score += 3;
          if (hasMicroInteractions) score += 2;
        }

        return {
          passed: score >= 70,
          score: Math.max(0, score), // Permite scores > 100
          issues,
          suggestions,
          autoFixable: false
        };
      }
    }
  ]
};

// ============================================
// MOTOR DE AVALIAÇÃO DE EXCELÊNCIA
// ============================================

export class ExcellenceEngine {
  /**
   * Avalia conteúdo contra critérios de excelência
   */
  static evaluate(content: string, criteria: ExcellenceCriteria): ExcellenceReport {
    const checkResults = criteria.checks.map(check => ({
      name: check.name,
      weight: check.weight,
      result: check.validator(content)
    }));

    // Calcular score ponderado
    const totalWeight = checkResults.reduce((sum, check) => sum + check.weight, 0);
    const weightedScore = checkResults.reduce((sum, check) => {
      return sum + (check.result.score * check.weight);
    }, 0) / totalWeight;

    const overallScore = Math.round(weightedScore);
    const passed = overallScore >= criteria.minimumScore;

    // Coletar todas as melhorias sugeridas
    const improvements: string[] = [];
    checkResults.forEach(check => {
      if (check.result.issues.length > 0) {
        improvements.push(`**${check.name}:**`);
        check.result.issues.forEach(issue => improvements.push(`  ❌ ${issue}`));
        check.result.suggestions.forEach(suggestion => improvements.push(`  💡 ${suggestion}`));
      }
    });

    // Gerar resumo
    const failedChecks = checkResults.filter(c => !c.result.passed);
    let summary = '';
    
    if (passed) {
      summary = `✅ Excelente! Score: ${overallScore}/100. `;
      if (improvements.length > 0) {
        summary += `Há ${improvements.length} sugestões de melhoria para atingir perfeição.`;
      } else {
        summary += 'Código atinge padrão de excelência!';
      }
    } else {
      summary = `⚠️ Score: ${overallScore}/100 (mínimo: ${criteria.minimumScore}). `;
      summary += `${failedChecks.length} verificação(ões) falharam. Melhorias necessárias.`;
    }

    return {
      domain: criteria.domain,
      overallScore,
      passed,
      checks: checkResults.map(c => ({ name: c.name, result: c.result })),
      summary,
      improvements
    };
  }

  /**
   * Gera relatório formatado em Markdown
   */
  static generateReport(report: ExcellenceReport): string {
    let markdown = `# 📊 Relatório de Excelência - ${report.domain}\n\n`;
    
    markdown += `## Score Geral: ${report.overallScore}/100\n\n`;
    markdown += `${report.summary}\n\n`;

    if (report.improvements.length > 0) {
      markdown += `## 🎯 Melhorias Recomendadas\n\n`;
      report.improvements.forEach(improvement => {
        markdown += `${improvement}\n`;
      });
      markdown += `\n`;
    }

    markdown += `## 📋 Detalhes das Verificações\n\n`;
    report.checks.forEach(check => {
      const icon = check.result.passed ? '✅' : '⚠️';
      markdown += `### ${icon} ${check.name} (${check.result.score}/100)\n\n`;
      
      if (check.result.issues.length > 0) {
        markdown += `**Problemas encontrados:**\n`;
        check.result.issues.forEach(issue => markdown += `- ${issue}\n`);
        markdown += `\n`;
      }
      
      if (check.result.suggestions.length > 0) {
        markdown += `**Sugestões:**\n`;
        check.result.suggestions.forEach(suggestion => markdown += `- ${suggestion}\n`);
        markdown += `\n`;
      }
    });

    markdown += `\n---\n\n`;
    markdown += `*${CORE_PRINCIPLE.mantra}*\n`;

    return markdown;
  }

  /**
   * Verifica se conteúdo atinge padrão de excelência
   */
  static meetsExcellenceStandard(content: string, criteria: ExcellenceCriteria): boolean {
    const report = this.evaluate(content, criteria);
    return report.passed;
  }

  /**
   * Retorna sugestões de melhoria priorizadas
   */
  static getPrioritizedImprovements(report: ExcellenceReport): string[] {
    // Ordenar checks por score (piores primeiro)
    const sortedChecks = [...report.checks].sort((a, b) => a.result.score - b.result.score);
    
    const improvements: string[] = [];
    sortedChecks.forEach(check => {
      if (!check.result.passed) {
        improvements.push(`🔴 CRÍTICO - ${check.name}:`);
        check.result.suggestions.forEach(s => improvements.push(`   ${s}`));
      } else if (check.result.score < 90) {
        improvements.push(`🟡 MELHORIA - ${check.name}:`);
        check.result.suggestions.forEach(s => improvements.push(`   ${s}`));
      }
    });

    return improvements;
  }
}

// ============================================
// AUTOAVALIAÇÃO DE COMPLETUDE
// ============================================

export interface CompletenessCheck {
  aspect: string;
  complete: boolean;
  details: string;
}

export class CompletenessValidator {
  /**
   * Verifica completude de um HTML gerado
   */
  static validateHtmlCompleteness(html: string): CompletenessCheck[] {
    return [
      {
        aspect: 'Estrutura Básica',
        complete: this.hasBasicStructure(html),
        details: 'DOCTYPE, html, head, body'
      },
      {
        aspect: 'Metadados',
        complete: this.hasEssentialMetadata(html),
        details: 'charset, viewport, title, description'
      },
      {
        aspect: 'Conteúdo Significativo',
        complete: this.hasMeaningfulContent(html),
        details: 'Texto real, não placeholders'
      },
      {
        aspect: 'Estilos',
        complete: this.hasStyles(html),
        details: 'CSS inline ou classes'
      },
      {
        aspect: 'Interatividade',
        complete: this.hasInteractivity(html),
        details: 'JavaScript funcional se necessário'
      },
      {
        aspect: 'Responsividade',
        complete: this.isResponsive(html),
        details: 'Design adaptável a diferentes telas'
      },
      {
        aspect: 'Acessibilidade',
        complete: this.isAccessible(html),
        details: 'Alt em imagens, labels em inputs'
      }
    ];
  }

  private static hasBasicStructure(html: string): boolean {
    return html.includes('<!DOCTYPE html>') &&
           html.includes('<html') &&
           html.includes('<head>') &&
           html.includes('<body>');
  }

  private static hasEssentialMetadata(html: string): boolean {
    return /<meta\s+charset=/i.test(html) &&
           /<meta\s+name=["']viewport["']/i.test(html) &&
           /<title>(.+?)<\/title>/i.test(html);
  }

  private static hasMeaningfulContent(html: string): boolean {
    const hasLoremIpsum = /lorem\s+ipsum/i.test(html);
    const hasTodo = /TODO|FIXME|placeholder/i.test(html);
    const hasContent = html.length > 1000;
    
    return hasContent && !hasLoremIpsum && !hasTodo;
  }

  private static hasStyles(html: string): boolean {
    return /<style|class=["'][^"']+["']|style=["'][^"']+["']/i.test(html);
  }

  private static hasInteractivity(html: string): boolean {
    const hasButtons = /<button/i.test(html);
    const hasInputs = /<input/i.test(html);
    const hasScripts = /<script/i.test(html);
    
    // Se tem elementos interativos, deve ter scripts
    if (hasButtons || hasInputs) {
      return hasScripts;
    }
    
    return true; // Se não precisa de interatividade, está OK
  }

  private static isResponsive(html: string): boolean {
    const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
    const hasMediaQueries = /@media/i.test(html);
    const hasTailwind = /tailwind|sm:|md:|lg:/i.test(html);
    
    return hasViewport && (hasMediaQueries || hasTailwind);
  }

  private static isAccessible(html: string): boolean {
    const images = html.match(/<img[^>]*>/gi) || [];
    const imagesWithAlt = images.filter(img => img.includes('alt='));
    const altRatio = images.length > 0 ? imagesWithAlt.length / images.length : 1;
    
    const hasLang = /<html[^>]+lang=/i.test(html);
    
    return altRatio >= 0.8 && hasLang;
  }
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default {
  CORE_PRINCIPLE,
  ExcellenceEngine,
  CompletenessValidator,
  HTML_EXCELLENCE_CRITERIA
};
