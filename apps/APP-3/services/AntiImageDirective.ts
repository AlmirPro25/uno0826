/**
 * SISTEMA ANTI-IMAGEM - REGRAS ABSOLUTAS
 * 
 * Este sistema garante que NUNCA sejam geradas imagens, SVGs complexos,
 * ou dados Base64 diretamente no código JavaScript/HTML.
 * 
 * Almir já possui sistema dedicado para geração de imagens.
 */

export class AntiImageDirective {
  // Padrões PROIBIDOS que nunca devem aparecer no código gerado
  private static readonly FORBIDDEN_PATTERNS = [
    // Base64 de imagens
    /data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g,
    
    // SVGs complexos (mais de 200 caracteres)
    /<svg[^>]*>[\s\S]{200,}<\/svg>/gi,
    
    // Strings Base64 longas (mais de 100 caracteres)
    /[A-Za-z0-9+/=]{100,}/g,
    
    // QR codes como Base64
    /qr.*base64.*[A-Za-z0-9+/=]{50,}/gi,
    
    // Canvas toDataURL com Base64
    /toDataURL\(\).*[A-Za-z0-9+/=]{50,}/gi,
    
    // Blob URLs com dados binários
    /blob:.*[A-Za-z0-9+/=]{50,}/gi
  ];

  // Palavras-chave que indicam tentativa de geração de imagem
  private static readonly IMAGE_KEYWORDS = [
    'generateImage', 'createImage', 'drawImage', 'renderImage',
    'qrcode', 'barcode', 'chart', 'graph', 'diagram',
    'canvas.toDataURL', 'getImageData', 'putImageData',
    'createObjectURL', 'readAsDataURL'
  ];

  /**
   * Valida se o código contém elementos proibidos
   */
  static validateCode(code: string): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Verificar padrões proibidos
    this.FORBIDDEN_PATTERNS.forEach((pattern, index) => {
      if (pattern.test(code)) {
        violations.push(`Padrão proibido detectado: ${this.getPatternDescription(index)}`);
      }
    });

    // Verificar palavras-chave suspeitas
    this.IMAGE_KEYWORDS.forEach(keyword => {
      if (code.toLowerCase().includes(keyword.toLowerCase())) {
        violations.push(`Palavra-chave suspeita detectada: ${keyword}`);
      }
    });

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  /**
   * Remove elementos proibidos do código
   */
  static sanitizeCode(code: string): string {
    let sanitized = code;

    // Remover Base64 de imagens e substituir por placeholder
    sanitized = sanitized.replace(
      /data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g,
      '"[IMAGEM_PLACEHOLDER]"'
    );

    // Remover SVGs complexos
    sanitized = sanitized.replace(
      /<svg[^>]*>[\s\S]{200,}<\/svg>/gi,
      '<div class="svg-placeholder">[SVG_PLACEHOLDER]</div>'
    );

    // Remover strings Base64 longas
    sanitized = sanitized.replace(
      /[A-Za-z0-9+/=]{100,}/g,
      '[BASE64_REMOVIDO]'
    );

    return sanitized;
  }

  /**
   * Gera código alternativo correto para casos comuns
   */
  static generateCorrectAlternative(violationType: string): string {
    const alternatives: Record<string, string> = {
      'qrcode': `
// ✅ CORRETO: Referenciar sistema de imagens do Almir
const qrCodeUrl = await imageGenerationService.generateQRCode(data);
appState.whatsapp.qrCode = qrCodeUrl; // URL, não Base64!`,

      'chart': `
// ✅ CORRETO: Usar biblioteca de charts ou sistema de imagens
const chartConfig = { type: 'bar', data: chartData };
const chartUrl = await imageGenerationService.generateChart(chartConfig);`,

      'canvas': `
// ✅ CORRETO: Salvar canvas como arquivo, não Base64 inline
const canvas = document.getElementById('myCanvas');
const blob = await new Promise(resolve => canvas.toBlob(resolve));
const imageUrl = await uploadImageBlob(blob);`,

      'svg': `
// ✅ CORRETO: SVG simples ou referência externa
const iconSvg = '<svg width="24" height="24"><path d="..."/></svg>'; // Apenas ícones simples
// OU
const complexDiagramUrl = await imageGenerationService.generateDiagram(config);`
    };

    return alternatives[violationType] || `
// ✅ CORRETO: Use o sistema de geração de imagens do Almir
const imageUrl = await imageGenerationService.generate(config);`;
  }

  private static getPatternDescription(index: number): string {
    const descriptions = [
      'Base64 de imagem (data:image)',
      'SVG complexo inline',
      'String Base64 longa',
      'QR code como Base64',
      'Canvas toDataURL com Base64',
      'Blob URL com dados binários'
    ];
    return descriptions[index] || 'Padrão desconhecido';
  }

  /**
   * Gera prompt de instrução para a IA
   */
  static getAiInstructions(): string {
    return `
🚨 REGRAS ABSOLUTAS - ANTI-IMAGEM:

NUNCA GERE:
❌ Imagens Base64 (data:image/png;base64,...)
❌ SVGs complexos inline (>200 caracteres)
❌ QR codes como strings Base64
❌ Canvas toDataURL() com dados binários
❌ Qualquer string Base64 longa (>100 chars)
❌ Dados binários de imagem no código

✅ SEMPRE USE:
✅ URLs de imagem: "https://example.com/image.png"
✅ Placeholders: "[IMAGEM_PLACEHOLDER]"
✅ Referências ao sistema de imagens: imageService.generate()
✅ SVGs simples apenas para ícones (<50 chars)
✅ Classes CSS para estilos visuais

LEMBRE-SE: Almir já tem sistema dedicado para geração de imagens!
O código deve ser LIMPO, LEGÍVEL e PERFORMÁTICO.
`;
  }
}

// Middleware para validação automática
export const validateGeneratedCode = (code: string): string => {
  const validation = AntiImageDirective.validateCode(code);
  
  if (!validation.isValid) {
    console.warn('🚨 Código com violações detectadas:', validation.violations);
    return AntiImageDirective.sanitizeCode(code);
  }
  
  return code;
};
