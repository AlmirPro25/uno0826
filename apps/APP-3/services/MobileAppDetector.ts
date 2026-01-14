// services/MobileAppDetector.ts
// Detector inteligente de pedidos de apps mobile

export interface MobileAppIntent {
  isMobileApp: boolean;
  confidence: number; // 0-100
  appType: 'android' | 'ios' | 'hybrid' | 'pwa' | null;
  suggestedName: string;
  suggestedPackage: string;
  features: string[];
  keywords: string[];
}

export class MobileAppDetector {
  
  /**
   * Detecta se o prompt é um pedido de app mobile
   */
  static detectMobileIntent(prompt: string): MobileAppIntent {
    const promptLower = prompt.toLowerCase();
    let confidence = 0;
    let appType: 'android' | 'ios' | 'hybrid' | 'pwa' | null = null;
    const features: string[] = [];
    const keywords: string[] = [];

    // 🎯 PALAVRAS-CHAVE PRINCIPAIS (alta confiança)
    const primaryKeywords = [
      'app', 'aplicativo', 'aplicação mobile', 'app mobile',
      'celular', 'smartphone', 'mobile', 'android', 'ios',
      'apk', 'play store', 'app store', 'baixar app',
      'instalar app', 'app para', 'aplicativo de', 'aplicativo para'
    ];

    // 🔍 PALAVRAS-CHAVE SECUNDÁRIAS (média confiança)
    const secondaryKeywords = [
      'tela', 'interface mobile', 'touch', 'swipe', 'notificação',
      'push notification', 'offline', 'câmera', 'gps', 'localização',
      'vibração', 'sensor', 'giroscópio', 'acelerômetro',
      'compartilhar', 'share', 'galeria', 'fotos', 'contatos'
    ];

    // 🎨 TIPOS DE APP (contexto)
    const appTypes = {
      social: ['rede social', 'chat', 'mensagem', 'conversa', 'amigos', 'perfil', 'feed'],
      ecommerce: ['loja', 'comprar', 'carrinho', 'produto', 'venda', 'pagamento', 'checkout'],
      productivity: ['tarefa', 'todo', 'lista', 'nota', 'agenda', 'calendário', 'lembrete'],
      entertainment: ['jogo', 'música', 'vídeo', 'filme', 'série', 'streaming', 'player'],
      health: ['saúde', 'fitness', 'exercício', 'treino', 'dieta', 'calorias', 'peso'],
      education: ['curso', 'aula', 'estudo', 'aprender', 'quiz', 'flashcard', 'educação'],
      finance: ['banco', 'dinheiro', 'carteira', 'investimento', 'gasto', 'orçamento'],
      utility: ['calculadora', 'conversor', 'ferramenta', 'utilitário', 'scanner']
    };

    // 🔍 DETECTAR PALAVRAS-CHAVE PRINCIPAIS
    primaryKeywords.forEach(keyword => {
      if (promptLower.includes(keyword)) {
        confidence += 30;
        keywords.push(keyword);
      }
    });

    // 🔍 DETECTAR PALAVRAS-CHAVE SECUNDÁRIAS
    secondaryKeywords.forEach(keyword => {
      if (promptLower.includes(keyword)) {
        confidence += 10;
        keywords.push(keyword);
      }
    });

    // 🎯 DETECTAR PLATAFORMA ESPECÍFICA
    if (promptLower.includes('android') || promptLower.includes('apk')) {
      appType = 'android';
      confidence += 40;
    } else if (promptLower.includes('ios') || promptLower.includes('iphone') || promptLower.includes('app store')) {
      appType = 'ios';
      confidence += 40;
    } else if (promptLower.includes('pwa') || promptLower.includes('progressive web')) {
      appType = 'pwa';
      confidence += 30;
    } else if (promptLower.includes('react native') || promptLower.includes('flutter')) {
      appType = 'hybrid';
      confidence += 35;
    }

    // 🎨 DETECTAR TIPO DE APP
    Object.entries(appTypes).forEach(([type, typeKeywords]) => {
      typeKeywords.forEach(keyword => {
        if (promptLower.includes(keyword)) {
          features.push(type);
          confidence += 5;
        }
      });
    });

    // 🔍 PADRÕES DE FRASE
    const phrasePatterns = [
      /crie?\s+(um\s+)?app/i,
      /desenvolv(a|er)\s+(um\s+)?aplicativo/i,
      /fazer\s+(um\s+)?app/i,
      /preciso\s+(de\s+)?(um\s+)?app/i,
      /quero\s+(um\s+)?aplicativo/i,
      /app\s+(de|para|que)/i,
      /aplicativo\s+(de|para|que)/i
    ];

    phrasePatterns.forEach(pattern => {
      if (pattern.test(prompt)) {
        confidence += 25;
      }
    });

    // 🎯 LIMITAR CONFIANÇA
    confidence = Math.min(confidence, 100);

    // 📱 DETERMINAR SE É APP MOBILE
    const isMobileApp = confidence >= 50;

    // 🏷️ SUGERIR NOME DO APP
    const suggestedName = this.extractAppName(prompt);
    const suggestedPackage = this.generatePackageName(suggestedName);

    return {
      isMobileApp,
      confidence,
      appType: isMobileApp ? (appType || 'android') : null,
      suggestedName,
      suggestedPackage,
      features: [...new Set(features)],
      keywords: [...new Set(keywords)]
    };
  }

  /**
   * Extrai nome do app do prompt
   */
  private static extractAppName(prompt: string): string {
    // Padrões para extrair nome
    const patterns = [
      /app\s+(?:de\s+|para\s+)?["']?([^"',.]+)["']?/i,
      /aplicativo\s+(?:de\s+|para\s+)?["']?([^"',.]+)["']?/i,
      /chamado\s+["']?([^"',.]+)["']?/i,
      /nome\s+["']?([^"',.]+)["']?/i
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match && match[1]) {
        return this.capitalizeWords(match[1].trim());
      }
    }

    // Fallback: usar primeiras palavras significativas
    const words = prompt.split(' ')
      .filter(w => w.length > 3)
      .slice(0, 3)
      .join(' ');
    
    return this.capitalizeWords(words) || 'Meu App';
  }

  /**
   * Gera package name a partir do nome do app
   */
  private static generatePackageName(appName: string): string {
    const cleanName = appName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ''); // Remove espaços

    return `com.app.${cleanName}`;
  }

  /**
   * Capitaliza palavras
   */
  private static capitalizeWords(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Gera prompt aprimorado para geração de app mobile
   */
  static enhancePromptForMobile(originalPrompt: string, intent: MobileAppIntent): string {
    const enhancements = [
      '🎯 MODO: Aplicativo Mobile Android (WebView)',
      '',
      `📱 App: ${intent.suggestedName}`,
      `📦 Package: ${intent.suggestedPackage}`,
      '',
      '🎨 REQUISITOS MOBILE:',
      '- Design responsivo e otimizado para telas pequenas',
      '- Interface touch-friendly (botões grandes, espaçamento adequado)',
      '- Navegação mobile (bottom navigation ou drawer)',
      '- Feedback visual para interações (ripple effects)',
      '- Suporte a gestos (swipe, long press)',
      '- Meta tags viewport configuradas',
      '- Cores vibrantes e modernas',
      '- Ícones grandes e claros',
      '',
      '🔌 FUNCIONALIDADES NATIVAS:',
      '- window.AndroidInterface.showToast(message) - Notificações',
      '- window.AndroidInterface.vibrate(duration) - Vibração',
      '- window.AndroidInterface.shareText(text) - Compartilhamento',
      '',
      '📐 LAYOUT:',
      '- Viewport: width=device-width, initial-scale=1.0',
      '- Orientação: Portrait (vertical)',
      '- Safe areas para notch/barra de status',
      '- Bottom navigation fixo',
      '',
      '🎨 DESIGN SYSTEM:',
      '- Material Design 3 ou iOS-like',
      '- Cores primária e secundária definidas',
      '- Tipografia legível (16px+ para texto)',
      '- Espaçamento consistente (8px grid)',
      '- Sombras e elevações sutis',
      '',
      '⚡ PERFORMANCE:',
      '- HTML/CSS/JS otimizado',
      '- Imagens comprimidas',
      '- Animações suaves (60fps)',
      '- Carregamento rápido',
      '',
      '📱 PROMPT ORIGINAL:',
      originalPrompt
    ];

    return enhancements.join('\n');
  }

  /**
   * Detecta features específicas do prompt
   */
  static detectFeatures(prompt: string): string[] {
    const features: string[] = [];
    const promptLower = prompt.toLowerCase();

    const featureMap = {
      'Câmera': ['câmera', 'camera', 'foto', 'tirar foto', 'capturar'],
      'GPS/Localização': ['gps', 'localização', 'mapa', 'maps', 'coordenadas', 'onde estou'],
      'Notificações': ['notificação', 'notification', 'push', 'alerta', 'avisar'],
      'Compartilhamento': ['compartilhar', 'share', 'enviar para', 'dividir'],
      'Vibração': ['vibrar', 'vibração', 'haptic', 'feedback tátil'],
      'Armazenamento': ['salvar', 'guardar', 'storage', 'cache', 'offline'],
      'Autenticação': ['login', 'cadastro', 'senha', 'autenticação', 'usuário'],
      'Pagamentos': ['pagar', 'pagamento', 'comprar', 'checkout', 'cartão'],
      'Chat': ['chat', 'mensagem', 'conversa', 'bate-papo'],
      'Áudio': ['áudio', 'som', 'música', 'tocar', 'player'],
      'Vídeo': ['vídeo', 'filme', 'assistir', 'player de vídeo'],
      'Scanner': ['scanner', 'qr code', 'código de barras', 'escanear'],
      'Contatos': ['contatos', 'agenda', 'telefone', 'ligar'],
      'Calendário': ['calendário', 'agenda', 'evento', 'compromisso']
    };

    Object.entries(featureMap).forEach(([feature, keywords]) => {
      if (keywords.some(keyword => promptLower.includes(keyword))) {
        features.push(feature);
      }
    });

    return features;
  }
}

// Instância singleton
export const mobileAppDetector = MobileAppDetector;
