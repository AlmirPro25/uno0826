/**
 * 🖼️ IMAGE SERVICE (Geração de Imagens com Imagen 4)
 * Gera "selfies" e imagens personalizadas da persona.
 * Cria conteúdo visual único para engajamento.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { LogRepository } from '../repositories/log.repository';
import fs from 'fs';
import path from 'path';

export interface ImageGenerationOptions {
    style?: 'selfie' | 'professional' | 'casual' | 'artistic' | 'provocative';
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
    mood?: 'happy' | 'flirty' | 'mysterious' | 'professional' | 'playful';
    setting?: string; // e.g., "beach", "bedroom", "office"
    outfit?: string;  // e.g., "casual dress", "lingerie", "business"
}

export interface ImageResult {
    success: boolean;
    imageData?: Buffer;
    imageBase64?: string;
    mimeType: string;
    prompt?: string;
    error?: string;
}

export class ImageService {
    private genAI: GoogleGenerativeAI;
    private logRepo = new LogRepository();
    private imageDir: string;

    // Persona description for consistent image generation
    private personaDescription = {
        name: 'Eliane',
        age: 23,
        ethnicity: 'Brazilian woman, morena',
        hair: 'long dark brown wavy hair',
        eyes: 'brown eyes',
        body: 'curvy, fit',
        style: 'casual, sensual but tasteful'
    };

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.imageDir = path.join(process.cwd(), 'image-cache');
        this.ensureImageDir();
    }

    private ensureImageDir() {
        if (!fs.existsSync(this.imageDir)) {
            fs.mkdirSync(this.imageDir, { recursive: true });
        }
    }

    /**
     * Gera uma imagem usando Imagen 4
     */
    async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<ImageResult> {
        try {
            // Using Imagen 4 Fast for quick generation
            const model = this.genAI.getGenerativeModel({
                model: 'imagen-4.0-fast-generate-001'
            });

            const enhancedPrompt = this.enhancePrompt(prompt, options);

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{ text: enhancedPrompt }]
                }],
                generationConfig: {
                    responseModalities: ['IMAGE'],
                    imagenConfig: {
                        aspectRatio: options?.aspectRatio || '1:1',
                        numberOfImages: 1,
                        safetyFilterLevel: 'BLOCK_ONLY_HIGH'
                    }
                } as any
            });

            const response = result.response;

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if ((part as any).inlineData) {
                        const imageData = Buffer.from((part as any).inlineData.data, 'base64');

                        this.logRepo.create('INFO', 'IMAGE_GENERATED',
                            `Image generated: "${prompt.substring(0, 50)}..."`, undefined);

                        return {
                            success: true,
                            imageData,
                            imageBase64: (part as any).inlineData.data,
                            mimeType: (part as any).inlineData.mimeType || 'image/png',
                            prompt: enhancedPrompt
                        };
                    }
                }
            }

            throw new Error('No image data in response');

        } catch (error) {
            console.error('Image Generation Error:', error);
            this.logRepo.create('ERROR', 'IMAGE_ERROR', (error as Error).message, undefined);

            return {
                success: false,
                mimeType: 'image/png',
                error: (error as Error).message
            };
        }
    }

    /**
     * Gera uma selfie da persona
     */
    async generateSelfie(mood?: string, setting?: string): Promise<ImageResult> {
        const { name, age, ethnicity, hair, eyes, body, style } = this.personaDescription;

        const moodDescriptions: Record<string, string> = {
            happy: 'smiling warmly, genuine happy expression',
            flirty: 'playful smile, slightly tilted head, seductive look',
            mysterious: 'subtle smile, enigmatic expression',
            professional: 'confident, professional demeanor',
            playful: 'fun, energetic expression, laughing'
        };

        const settingDescriptions: Record<string, string> = {
            beach: 'at the beach, sunset background, golden hour lighting',
            bedroom: 'in a cozy bedroom, soft warm lighting',
            bathroom: 'bathroom mirror selfie, natural lighting',
            outdoor: 'outdoor setting, natural daylight',
            club: 'nightclub ambiance, colorful lights'
        };

        const moodText = mood ? moodDescriptions[mood] || mood : 'natural expression';
        const settingText = setting ? settingDescriptions[setting] || setting : '';

        const prompt = `
Photorealistic selfie portrait of ${name}, a ${age} year old ${ethnicity}.
Physical features: ${hair}, ${eyes}, ${body}.
Expression: ${moodText}.
${settingText ? `Setting: ${settingText}.` : ''}
Style: ${style}. High quality smartphone selfie, natural pose.
Ultra realistic, 8K quality, professional photography lighting.
    `.trim();

        return this.generateImage(prompt, { style: 'selfie', aspectRatio: '9:16' });
    }

    /**
     * Gera imagem e salva em arquivo
     */
    async generateAndSave(prompt: string, filename?: string, options?: ImageGenerationOptions): Promise<string | null> {
        const result = await this.generateImage(prompt, options);

        if (!result.success || !result.imageData) {
            return null;
        }

        const ext = result.mimeType.split('/')[1] || 'png';
        const finalFilename = filename || `image-${Date.now()}.${ext}`;
        const filePath = path.join(this.imageDir, finalFilename);

        fs.writeFileSync(filePath, result.imageData);
        return filePath;
    }

    /**
     * Melhora o prompt para geração
     */
    private enhancePrompt(prompt: string, options?: ImageGenerationOptions): string {
        const style = options?.style || 'casual';
        const mood = options?.mood || 'natural';

        const styleEnhancements: Record<string, string> = {
            selfie: 'smartphone selfie, natural lighting, genuine expression',
            professional: 'professional photography, studio lighting, polished look',
            casual: 'casual photography, natural daylight, relaxed atmosphere',
            artistic: 'artistic photography, creative lighting, dramatic composition',
            provocative: 'sensual but tasteful, suggestive pose, intimate lighting'
        };

        return `${prompt}. ${styleEnhancements[style] || ''}. Photorealistic, high quality, 8K resolution.`;
    }

    /**
     * Gera múltiplas variações
     */
    async generateVariations(basePrompt: string, count: number = 3): Promise<ImageResult[]> {
        const variations: ImageResult[] = [];
        const moods = ['happy', 'flirty', 'mysterious', 'playful'];

        for (let i = 0; i < count; i++) {
            const mood = moods[i % moods.length];
            const result = await this.generateImage(basePrompt, { mood: mood as any });
            variations.push(result);

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        return variations;
    }

    /**
     * Limpa cache de imagens antigas
     */
    cleanupCache(olderThanHours: number = 72): number {
        const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
        let cleaned = 0;

        if (fs.existsSync(this.imageDir)) {
            const files = fs.readdirSync(this.imageDir);
            for (const file of files) {
                const filePath = path.join(this.imageDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtimeMs < cutoff) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            }
        }

        return cleaned;
    }

    /**
     * Atualiza descrição da persona
     */
    updatePersonaDescription(updates: Partial<typeof this.personaDescription>): void {
        this.personaDescription = { ...this.personaDescription, ...updates };
    }
}
