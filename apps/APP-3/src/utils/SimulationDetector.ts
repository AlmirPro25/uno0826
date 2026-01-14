/**
 * SimulationDetector.ts
 * 
 * Sistema avançado para detectar e prevenir simulações em código gerado por IA.
 * Este sistema trabalha em conjunto com o AntiSimulationSystem para garantir
 * que todo o código gerado seja real, funcional e pronto para produção.
 */

export interface SimulationPattern {
  pattern: RegExp;
  description: string;
  severity: 'high' | 'medium' | 'low';
  category: 'placeholder' | 'fake_code' | 'incomplete' | 'security_simulation' | 'api_simulation';
}

export interface DetectionResult {
  detected: boolean;
  matches: {
    pattern: SimulationPattern;
    matchedText: string;
    location: string;
  }[];
  score: number; // 0-100, onde 0 é código totalmente simulado e 100 é código totalmente real
  recommendations: string[];
}

export class SimulationDetector {
  private simulationPatterns: SimulationPattern[] = [
    // Padrões de placeholder
    {
      pattern: /lorem\s+ipsum|placeholder|dummy\s+text|sample\s+text|example\s+text/gi,
      description: 'Texto placeholder detectado',
      severity: 'high',
      category: 'placeholder'
    },
    {
      pattern: /\[.*?\]|\{.*?\}|<.*?>|\(.*?\)/g,
      description: 'Possível placeholder em formato de marcador',
      severity: 'medium',
      category: 'placeholder'
    },
    
    // Padrões de código falso/incompleto
    {
      pattern: /\/\/\s*TODO|FIXME|XXX|@todo|@fixme|@implement/gi,
      description: 'Marcadores de tarefas pendentes',
      severity: 'high',
      category: 'incomplete'
    },
    {
      pattern: /console\.log\(["']?(?:test|debug|here|working|check)["']?\)/gi,
      description: 'Logs de depuração temporários',
      severity: 'medium',
      category: 'incomplete'
    },
    {
      pattern: /function\s+\w+\s*\(.*?\)\s*\{\s*\/\/[^\n]*?implement[^\n]*?\s*\}/gi,
      description: 'Função vazia com comentário de implementação',
      severity: 'high',
      category: 'fake_code'
    },
    
    // Padrões de simulação de segurança
    {
      pattern: /\/\/\s*Implement\s+security|Add\s+authentication|TODO:\s*Add\s+validation/gi,
      description: 'Simulação de implementação de segurança',
      severity: 'high',
      category: 'security_simulation'
    },
    {
      pattern: /const\s+(?:secret|apiKey|token|password)\s*=\s*["'](?:your_secret|your_api_key|your_token|your_password)["']/gi,
      description: 'Placeholder para credenciais',
      severity: 'high',
      category: 'security_simulation'
    },
    
    // Padrões de simulação de API
    {
      pattern: /\/\/\s*API\s+call\s+simulation|Mock\s+API\s+response|Simulated\s+API\s+call/gi,
      description: 'Simulação explícita de chamada de API',
      severity: 'high',
      category: 'api_simulation'
    },
    {
      pattern: /const\s+\w+\s*=\s*\{[^\}]*?\}\s*\/\/\s*mock\s+data|fake\s+data|simulated\s+data/gi,
      description: 'Dados simulados em vez de integração real',
      severity: 'high',
      category: 'api_simulation'
    },
    {
      pattern: /fetch\(["']https?:\/\/example\.com|api\.example\.com|fake-api\.com/gi,
      description: 'URL de API de exemplo ou falsa',
      severity: 'high',
      category: 'api_simulation'
    },
    
    // Padrões avançados de detecção
    {
      pattern: /\b(?:imagine|pretend|simulate|fake)\s+that\b/gi,
      description: 'Linguagem que sugere simulação',
      severity: 'medium',
      category: 'fake_code'
    },
    {
      pattern: /\b(?:would|could|should|might)\s+(?:implement|add|create|use)\b/gi,
      description: 'Linguagem condicional em vez de implementação real',
      severity: 'medium',
      category: 'incomplete'
    },
    {
      pattern: /\b(?:normally|typically|usually|generally)\s+(?:you|we|one)\s+(?:would|could|should|might)\b/gi,
      description: 'Explicação em vez de implementação',
      severity: 'medium',
      category: 'incomplete'
    },
    
    // Padrões específicos para tecnologias
    {
      pattern: /import\s+\{[^\}]*?\}\s+from\s+["'](?!\.|\/)\w+["']\s*;\s*\/\/\s*Install\s+this\s+package/gi,
      description: 'Importação de pacote não instalado',
      severity: 'high',
      category: 'incomplete'
    },
    {
      pattern: /\/\/\s*Requires\s+(?:Stripe|Cloudinary|MongoDB|Firebase|AWS)\s+configuration/gi,
      description: 'Comentário sobre configuração de serviço externo em vez de implementação',
      severity: 'high',
      category: 'api_simulation'
    },
    {
      pattern: /env\.(?:STRIPE_KEY|CLOUDINARY_KEY|MONGODB_URI|FIREBASE_CONFIG|AWS_SECRET)\s*\|\|\s*["']your_[\w_]+_key["']/gi,
      description: 'Fallback para chave de API simulada',
      severity: 'high',
      category: 'api_simulation'
    }
  ];

  /**
   * Detecta padrões de simulação no código fornecido
   */
  public detectSimulations(code: string, filePath: string = 'unknown'): DetectionResult {
    const matches: DetectionResult['matches'] = [];
    let simulationScore = 100; // Começa com pontuação perfeita

    // Verifica cada padrão de simulação
    for (const pattern of this.simulationPatterns) {
      const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        // Reduz a pontuação com base na severidade
        switch (pattern.severity) {
          case 'high':
            simulationScore -= 15;
            break;
          case 'medium':
            simulationScore -= 10;
            break;
          case 'low':
            simulationScore -= 5;
            break;
        }

        matches.push({
          pattern,
          matchedText: match[0],
          location: `${filePath}:${this.getLineNumber(code, match.index)}`
        });
      }
    }

    // Garante que a pontuação esteja entre 0 e 100
    simulationScore = Math.max(0, Math.min(100, simulationScore));

    // Gera recomendações com base nas simulações detectadas
    const recommendations = this.generateRecommendations(matches);

    return {
      detected: matches.length > 0,
      matches,
      score: simulationScore,
      recommendations
    };
  }

  /**
   * Verifica se o código está pronto para produção
   */
  public isProductionReady(code: string, filePath: string = 'unknown'): boolean {
    const result = this.detectSimulations(code, filePath);
    
    // Código está pronto para produção se a pontuação for alta e não houver simulações de alta severidade
    const hasHighSeverityIssues = result.matches.some(match => match.pattern.severity === 'high');
    
    return result.score >= 85 && !hasHighSeverityIssues;
  }

  /**
   * Gera recomendações específicas com base nas simulações detectadas
   */
  private generateRecommendations(matches: DetectionResult['matches']): string[] {
    const recommendations: string[] = [];
    const categoryCounts: Record<string, number> = {};

    // Conta ocorrências por categoria
    matches.forEach(match => {
      const category = match.pattern.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Gera recomendações por categoria
    if (categoryCounts['placeholder'] > 0) {
      recommendations.push('Substitua todos os textos placeholder por conteúdo real e relevante.');
    }

    if (categoryCounts['fake_code'] > 0) {
      recommendations.push('Implemente código real e funcional em vez de simulações ou pseudocódigo.');
    }

    if (categoryCounts['incomplete'] > 0) {
      recommendations.push('Complete todas as implementações pendentes e remova todos os TODOs.');
    }

    if (categoryCounts['security_simulation'] > 0) {
      recommendations.push('Implemente medidas de segurança reais, incluindo autenticação, autorização e validação de entrada.');
    }

    if (categoryCounts['api_simulation'] > 0) {
      recommendations.push('Substitua simulações de API por integrações reais com serviços externos, usando variáveis de ambiente para configuração.');
    }

    return recommendations;
  }

  /**
   * Obtém o número da linha com base no índice do caractere
   */
  private getLineNumber(text: string, index: number): number {
    const lines = text.substring(0, index).split('\n');
    return lines.length;
  }

  /**
   * Verifica se o código contém integrações reais de API
   */
  public hasRealApiIntegrations(code: string): boolean {
    // Verifica padrões de integração real com APIs comuns
    const realApiPatterns = [
      // Stripe
      /const\s+stripe\s*=\s*require\(['"]stripe['"]\)\(process\.env\.\w+\)/,
      /import\s+Stripe\s+from\s+['"]stripe['"];/,
      
      // Cloudinary
      /cloudinary\.config\(\{[^}]*cloud_name:\s*process\.env\.\w+/,
      /import\s+\{\s*v2\s+as\s+cloudinary\s*\}\s+from\s+['"]cloudinary['"];/,
      
      // Banco de dados
      /mongoose\.connect\(process\.env\.\w+/,
      /new\s+PrismaClient\(\)/,
      /createPool\(\{[^}]*host:\s*process\.env\.\w+/,
      
      // Autenticação
      /jwt\.sign\(\{[^}]*\},\s*process\.env\.\w+/,
      /bcrypt\.hash\([^,]+,\s*\d+\)/,
      
      // Email
      /nodemailer\.createTransport\(\{[^}]*host:\s*process\.env\.\w+/,
      
      // Armazenamento
      /new\s+S3Client\(\{[^}]*region:\s*process\.env\.\w+/,
      
      // Gemini API
      /const\s+genAI\s*=\s*new\s+GoogleGenerativeAI\(process\.env\.\w+\)/,
      /const\s+model\s*=\s*genAI\.getGenerativeModel\(\{\s*model:\s*['"]gemini/
    ];

    return realApiPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Verifica se o código contém implementações reais de segurança
   */
  public hasRealSecurityImplementations(code: string): boolean {
    // Verifica padrões de implementação real de segurança
    const securityPatterns = [
      // Autenticação
      /jwt\.verify\([^,]+,\s*process\.env\.\w+/,
      /bcrypt\.compare\([^,]+,\s*[^,]+\)/,
      
      // Middleware de segurança
      /app\.use\(helmet\(\)\)/,
      /app\.use\(cors\(\{[^}]*\}\)\)/,
      /app\.use\(express\.json\(\{\s*limit:\s*['"]\d+(?:kb|mb)['"]\s*\}\)\)/,
      /app\.use\(rateLimit\(\{[^}]*\}\)\)/,
      
      // Validação de entrada
      /body\(['"][^'"]+['"]\)\.isEmail\(\)/,
      /body\(['"][^'"]+['"]\)\.isLength\(\{[^}]*\}\)/,
      /\w+\.validate\([^)]+\)/,
      /joi\.validate\([^)]+\)/,
      /zod\.[^(]+\([^)]*\)/,
      
      // Sanitização
      /sanitize\([^)]+\)/,
      /escape\([^)]+\)/,
      /\w+\.trim\(\)/,
      
      // CSRF
      /app\.use\(csrf\(\{[^}]*\}\)\)/,
      
      // XSS
      /app\.use\(xss\(\)\)/,
      /DOMPurify\.sanitize\([^)]+\)/
    ];

    return securityPatterns.some(pattern => pattern.test(code));
  }
}

// Exporta uma instância singleton para uso em toda a aplicação
export const simulationDetector = new SimulationDetector();