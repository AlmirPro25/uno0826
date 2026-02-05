/**
 * O RITMO É A MENSAGEM.
 * Gerencia delays, "esquecimentos" e tempo de digitação.
 */
export class RhythmService {

  // RITMO HUMANO AVANÇADO (Governor)
  calculateResponseDelay(contact: any, analysis: any): number {

    // 1. Decisão Soberana: Se a ação é IGNORE ou WAIT, o delay é infinito ou muito longo.
    if (analysis.suggestedAction === 'IGNORE') return -1; // Sinal para NÃO responder
    if (analysis.suggestedAction === 'WAIT') return 300000; // 5 minutos de espera mínima

    // 2. Base da Personalidade (Reply Latency Profile)
    let baseDelay = 30000; // 30s padrão
    if (contact.replyLatencyProfile === 'IMMEDIATE') baseDelay = 10000;
    if (contact.replyLatencyProfile === 'SLOW') baseDelay = 120000; // 2 min

    // 3. Modificador de Intimidade (Quanto mais íntimo, mais rápido - ou mais variável)
    // Se Intimidade > 80, responde rápido (amigo/amante ansioso)
    if (contact.intimacyLevel > 80) baseDelay *= 0.4;

    // Se Intimidade < 20, demora mais (indiferença calculada)
    if (contact.intimacyLevel < 20) baseDelay *= 1.5;

    // 4. Modificador de Emoção (Cansaço, Raiva, Tédio)
    // Se detectou tom 'carente' do usuário, demora pra gerar valor (Escassez)
    if (analysis.detectedTone === 'carente') baseDelay *= 2.0;

    // Se usuário está 'irritado', responde rápido para acalmar
    if (analysis.detectedTone === 'irritado') baseDelay *= 0.5;

    // 5. Jitter Humano REAL (Random Walk)
    // Nunca fixo. Varia +/- 30%
    const jitter = baseDelay * (Math.random() * 0.6 - 0.3); // -30% a +30%

    let totalDelay = Math.floor(baseDelay + jitter);

    // Hard Limits (Segurança do Whatsapp)
    if (totalDelay < 5000) totalDelay = 5000; // Mínimo 5s
    if (totalDelay > 300000) totalDelay = 300000; // Máximo 5 min

    return totalDelay;
  }

  calculateTypingDuration(text: string): number {
    const chars = text.length;
    // Média humana: 5 a 8 caracteres por segundo (com erros e correções)
    const speed = 6;

    let duration = (chars / speed) * 1000;

    // Jitter de digitação (pausas pra pensar)
    duration += Math.random() * 2000;

    // Clamping
    return Math.floor(Math.max(2000, Math.min(15000, duration)));
  }

  // Helper para pausas assíncronas
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
