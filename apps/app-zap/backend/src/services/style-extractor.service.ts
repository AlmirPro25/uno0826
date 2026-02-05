/**
 * 🧬 STYLE EXTRACTOR SERVICE
 * Extrai o "DNA de Escrita" do operador humano.
 * Analisa padrões de linguagem, gírias, emojis, timing e estilo.
 * Permite que a IA mimetize perfeitamente o comportamento do humano.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient, Message } from '@prisma/client';
import { env } from '../config/env';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface StyleDNA {
    avgWordCount: number;
    avgSentenceLength: number;
    emojiFrequency: number;
    commonEmojis: string[];
    punctuationStyle: 'FORMAL' | 'INFORMAL' | 'NONE';
    capitalizationStyle: 'UPPER' | 'LOWER' | 'MIXED' | 'PROPER';
    frequentPhrases: string[];
    regionalExpressions: string[];
    intentionalErrors: string[];
    closingPhrases: string[];
    objectionHandlers: string[];
}

export class StyleExtractorService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private logRepo = new LogRepository();

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: { responseMimeType: 'application/json' }
        });
    }

    /**
     * Extrai o DNA de escrita do operador baseado nas últimas N mensagens enviadas por humano
     */
    async extractOperatorDNA(limit: number = 200): Promise<StyleDNA> {
        try {
            // 1. Buscar mensagens do operador (não da IA)
            const operatorMessages = await prisma.message.findMany({
                where: {
                    fromMe: true,
                    isOperator: true
                },
                orderBy: { timestamp: 'desc' },
                take: limit
            });

            if (operatorMessages.length < 10) {
                this.logRepo.create('WARN', 'STYLE_EXTRACTION', `Insufficient operator messages: ${operatorMessages.length}. Need at least 10.`, undefined);
                return this.getDefaultStyle();
            }

            // 2. Análise Estatística Local (Rápida)
            const localAnalysis = this.analyzeLocally(operatorMessages);

            // 3. Análise Semântica com Gemini (Profunda)
            const semanticAnalysis = await this.analyzeWithAI(operatorMessages.map(m => m.body));

            // 4. Merge os resultados
            const finalDNA: StyleDNA = {
                avgWordCount: localAnalysis.avgWordCount ?? 8,
                avgSentenceLength: localAnalysis.avgSentenceLength ?? 30,
                emojiFrequency: localAnalysis.emojiFrequency ?? 0.3,
                commonEmojis: localAnalysis.commonEmojis ?? ['😂', '❤️', '🔥'],
                punctuationStyle: localAnalysis.punctuationStyle ?? 'INFORMAL',
                capitalizationStyle: localAnalysis.capitalizationStyle ?? 'MIXED',
                frequentPhrases: semanticAnalysis.frequentPhrases ?? [],
                regionalExpressions: semanticAnalysis.regionalExpressions ?? [],
                intentionalErrors: localAnalysis.intentionalErrors ?? ['vc', 'tb', 'pq'],
                closingPhrases: semanticAnalysis.closingPhrases ?? [],
                objectionHandlers: semanticAnalysis.objectionHandlers ?? []
            };

            // 5. Persistir no banco
            await this.saveOperatorStyle(finalDNA, operatorMessages.length);

            this.logRepo.create('INFO', 'STYLE_EXTRACTION_COMPLETE', `Analyzed ${operatorMessages.length} messages. DNA extracted.`, undefined);

            return finalDNA;

        } catch (error) {
            console.error('Style Extraction Error:', error);
            this.logRepo.create('ERROR', 'STYLE_EXTRACTION_ERROR', (error as Error).message, undefined);
            return this.getDefaultStyle();
        }
    }

    /**
     * Análise local rápida sem IA
     */
    private analyzeLocally(messages: Message[]): Partial<StyleDNA> {
        const bodies = messages.map(m => m.body);

        // Contagem de palavras
        const wordCounts = bodies.map(b => b.split(/\s+/).filter(w => w.length > 0).length);
        const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;

        // Contagem de caracteres por frase
        const sentenceLengths = bodies.flatMap(b =>
            b.split(/[.!?]+/).filter(s => s.trim().length > 0).map(s => s.trim().length)
        );
        const avgSentenceLength = sentenceLengths.length > 0
            ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
            : 20;

        // Frequência de emojis
        const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
        const messagesWithEmoji = bodies.filter(b => emojiRegex.test(b)).length;
        const emojiFrequency = messagesWithEmoji / bodies.length;

        // Emojis mais comuns
        const allEmojis = bodies.join(' ').match(emojiRegex) || [];
        const emojiCount: Record<string, number> = {};
        allEmojis.forEach(e => { emojiCount[e] = (emojiCount[e] || 0) + 1; });
        const commonEmojis = Object.entries(emojiCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([emoji]) => emoji);

        // Estilo de pontuação
        const punctuatedMessages = bodies.filter(b => /[.!?,;:]/.test(b)).length;
        const punctuationRatio = punctuatedMessages / bodies.length;
        let punctuationStyle: 'FORMAL' | 'INFORMAL' | 'NONE' = 'INFORMAL';
        if (punctuationRatio > 0.7) punctuationStyle = 'FORMAL';
        if (punctuationRatio < 0.2) punctuationStyle = 'NONE';

        // Estilo de capitalização
        const upperMessages = bodies.filter(b => b === b.toUpperCase() && b.length > 3).length;
        const lowerMessages = bodies.filter(b => b === b.toLowerCase()).length;
        let capitalizationStyle: 'UPPER' | 'LOWER' | 'MIXED' | 'PROPER' = 'MIXED';
        if (upperMessages / bodies.length > 0.3) capitalizationStyle = 'UPPER';
        else if (lowerMessages / bodies.length > 0.7) capitalizationStyle = 'LOWER';

        // Erros intencionais comuns em pt-br
        const intentionalErrors: string[] = [];
        const errorPatterns = ['vc', 'tb', 'pq', 'q', 'n', 'cmg', 'blz', 'flw', 'vlw', 'tmj', 'slc', 'mn', 'mds'];
        const allText = bodies.join(' ').toLowerCase();
        errorPatterns.forEach(pattern => {
            const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
            if ((allText.match(regex) || []).length > 2) {
                intentionalErrors.push(pattern);
            }
        });

        return {
            avgWordCount,
            avgSentenceLength,
            emojiFrequency,
            commonEmojis,
            punctuationStyle,
            capitalizationStyle,
            intentionalErrors
        };
    }

    /**
     * Análise semântica profunda com IA
     */
    private async analyzeWithAI(messages: string[]): Promise<Partial<StyleDNA>> {
        const sampleMessages = messages.slice(0, 50).join('\n---\n');

        const prompt = `
Você é um linguista forense analisando o estilo de escrita de uma pessoa.
Analise as mensagens abaixo e extraia PADRÕES DE LINGUAGEM.

MENSAGENS DO OPERADOR:
${sampleMessages}

Retorne um JSON com:
{
  "frequentPhrases": ["array de frases/expressões que aparecem frequentemente"],
  "regionalExpressions": ["gírias regionais do Brasil, se houver"],
  "closingPhrases": ["frases usadas para fechar vendas ou encerrar conversas"],
  "objectionHandlers": ["como a pessoa responde a objeções de preço, tempo, etc"]
}

Seja PRECISO. Extraia APENAS o que aparece nas mensagens.
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const analysis = JSON.parse(result.response.text());
            return analysis;
        } catch (error) {
            console.error('AI Style Analysis Error:', error);
            return {
                frequentPhrases: [],
                regionalExpressions: [],
                closingPhrases: [],
                objectionHandlers: []
            };
        }
    }

    /**
     * Salva o estilo extraído no banco
     */
    private async saveOperatorStyle(dna: StyleDNA, messagesAnalyzed: number): Promise<void> {
        const existing = await prisma.operatorStyle.findFirst();

        const data = {
            avgWordCount: dna.avgWordCount,
            avgSentenceLength: dna.avgSentenceLength,
            emojiFrequency: dna.emojiFrequency,
            commonEmojis: JSON.stringify(dna.commonEmojis),
            punctuationStyle: dna.punctuationStyle,
            capitalizationStyle: dna.capitalizationStyle,
            frequentPhrases: JSON.stringify(dna.frequentPhrases),
            regionalExpressions: JSON.stringify(dna.regionalExpressions),
            intentionalErrors: JSON.stringify(dna.intentionalErrors),
            closingPhrases: JSON.stringify(dna.closingPhrases),
            objectionHandlers: JSON.stringify(dna.objectionHandlers),
            messagesAnalyzed,
            lastExtraction: new Date()
        };

        if (existing) {
            await prisma.operatorStyle.update({
                where: { id: existing.id },
                data
            });
        } else {
            await prisma.operatorStyle.create({ data });
        }
    }

    /**
     * Retorna o estilo do operador do banco (para uso nos prompts)
     */
    async getOperatorStyle(): Promise<StyleDNA | null> {
        const style = await prisma.operatorStyle.findFirst();
        if (!style) return null;

        return {
            avgWordCount: style.avgWordCount,
            avgSentenceLength: style.avgSentenceLength,
            emojiFrequency: style.emojiFrequency,
            commonEmojis: JSON.parse(style.commonEmojis),
            punctuationStyle: style.punctuationStyle as any,
            capitalizationStyle: style.capitalizationStyle as any,
            frequentPhrases: JSON.parse(style.frequentPhrases),
            regionalExpressions: JSON.parse(style.regionalExpressions),
            intentionalErrors: JSON.parse(style.intentionalErrors),
            closingPhrases: JSON.parse(style.closingPhrases),
            objectionHandlers: JSON.parse(style.objectionHandlers)
        };
    }

    /**
     * Gera um prompt de estilo para injetar no sistema
     */
    async generateStylePrompt(): Promise<string> {
        const style = await this.getOperatorStyle();
        if (!style) return '';

        return `
INSTRUÇÕES DE ESTILO (DNA DO OPERADOR - MIMETIZE EXATAMENTE):
- Média de palavras por mensagem: ${Math.round(style.avgWordCount)} palavras
- Estilo de pontuação: ${style.punctuationStyle === 'NONE' ? 'Não use pontuação' : style.punctuationStyle === 'INFORMAL' ? 'Pontuação mínima e casual' : 'Pontuação normal'}
- Capitalização: ${style.capitalizationStyle === 'LOWER' ? 'Tudo em minúsculo' : style.capitalizationStyle === 'UPPER' ? 'Ocasionalmente CAPS para ênfase' : 'Natural'}
- Emojis: ${style.emojiFrequency > 0.5 ? `Use frequentemente. Favoritos: ${style.commonEmojis.slice(0, 5).join(' ')}` : style.emojiFrequency > 0.2 ? 'Use moderadamente' : 'Raramente use emojis'}
- Abreviações que você USA: ${style.intentionalErrors.join(', ') || 'você, porque, também'}
- Expressões frequentes suas: ${style.frequentPhrases.slice(0, 5).join(', ') || 'nenhuma específica'}
- Gírias regionais: ${style.regionalExpressions.slice(0, 5).join(', ') || 'nenhuma'}

IMPORTANTE: Sua escrita DEVE parecer que foi digitada pelo operador original. Copie o estilo EXATAMENTE.
    `;
    }

    private getDefaultStyle(): StyleDNA {
        return {
            avgWordCount: 8,
            avgSentenceLength: 30,
            emojiFrequency: 0.3,
            commonEmojis: ['😂', '❤️', '🔥'],
            punctuationStyle: 'INFORMAL',
            capitalizationStyle: 'MIXED',
            frequentPhrases: [],
            regionalExpressions: [],
            intentionalErrors: ['vc', 'tb', 'pq'],
            closingPhrases: [],
            objectionHandlers: []
        };
    }
}
