/**
 * 🎙️ VOICE SERVICE (Síntese de Voz com Gemini TTS)
 * Gera áudios com a voz da persona para parecer 100% humano.
 * Usa Gemini 2.5 TTS para síntese de voz natural.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { LogRepository } from '../repositories/log.repository';
import fs from 'fs';
import path from 'path';

export interface VoiceConfig {
    voiceName: string;      // Nome da voz (ex: "pt-BR-FranciscaNeural")
    speakingRate: number;   // 0.5 a 2.0 (1.0 = normal)
    pitch: number;          // -20 a 20 (0 = normal)
    emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised';
}

export interface AudioResult {
    success: boolean;
    audioData?: Buffer;
    audioBase64?: string;
    mimeType: string;
    duration?: number;
    error?: string;
}

export class VoiceService {
    private genAI: GoogleGenerativeAI;
    private logRepo = new LogRepository();
    private audioDir: string;

    // Default voice config for Brazilian Portuguese female
    private defaultConfig: VoiceConfig = {
        voiceName: 'Kore', // Gemini TTS voice
        speakingRate: 1.0,
        pitch: 0,
        emotion: 'happy'
    };

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.audioDir = path.join(process.cwd(), 'audio-cache');
        this.ensureAudioDir();
    }

    private ensureAudioDir() {
        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
        }
    }

    /**
     * Gera áudio a partir de texto usando Gemini TTS
     */
    async textToSpeech(text: string, config?: Partial<VoiceConfig>): Promise<AudioResult> {
        const voiceConfig = { ...this.defaultConfig, ...config };

        try {
            // Using Gemini 2.5 Flash TTS
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-2.5-flash-preview-tts'
            });

            // Format text for natural speech
            const speechText = this.formatForSpeech(text);

            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [{ text: `Fale este texto em português brasileiro com tom ${voiceConfig.emotion}: "${speechText}"` }]
                }],
                generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voiceConfig.voiceName
                            }
                        }
                    }
                } as any
            });

            const response = result.response;

            // Extract audio from response
            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if ((part as any).inlineData) {
                        const audioData = Buffer.from((part as any).inlineData.data, 'base64');

                        this.logRepo.create('INFO', 'TTS_GENERATED',
                            `Audio generated for: "${text.substring(0, 50)}..."`, undefined);

                        return {
                            success: true,
                            audioData,
                            audioBase64: (part as any).inlineData.data,
                            mimeType: (part as any).inlineData.mimeType || 'audio/mp3'
                        };
                    }
                }
            }

            throw new Error('No audio data in response');

        } catch (error) {
            console.error('TTS Error:', error);
            this.logRepo.create('ERROR', 'TTS_ERROR', (error as Error).message, undefined);

            return {
                success: false,
                mimeType: 'audio/mp3',
                error: (error as Error).message
            };
        }
    }

    /**
     * Gera áudio e salva em arquivo
     */
    async textToSpeechFile(text: string, filename?: string): Promise<string | null> {
        const result = await this.textToSpeech(text);

        if (!result.success || !result.audioData) {
            return null;
        }

        const finalFilename = filename || `audio-${Date.now()}.mp3`;
        const filePath = path.join(this.audioDir, finalFilename);

        fs.writeFileSync(filePath, result.audioData);
        return filePath;
    }

    /**
     * Formata texto para fala natural
     */
    private formatForSpeech(text: string): string {
        // Remove emojis (TTS não lê bem)
        let formatted = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu, '');

        // Expande abreviações comuns
        const expansions: Record<string, string> = {
            'vc': 'você',
            'tb': 'também',
            'pq': 'porque',
            'q': 'que',
            'td': 'tudo',
            'cmg': 'comigo',
            'msg': 'mensagem',
            'obg': 'obrigada',
            'blz': 'beleza',
            'vlw': 'valeu',
            'tmj': 'tamo junto',
            'flw': 'falou',
            'rs': 'risos',
            'kk': 'risos',
            'kkk': 'risos',
            'haha': 'risos'
        };

        for (const [abbr, full] of Object.entries(expansions)) {
            const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
            formatted = formatted.replace(regex, full);
        }

        // Remove pontuação excessiva
        formatted = formatted.replace(/!{2,}/g, '!');
        formatted = formatted.replace(/\?{2,}/g, '?');
        formatted = formatted.replace(/\.{3,}/g, '...');

        return formatted.trim();
    }

    /**
     * Gera resposta por áudio contextual
     */
    async generateVoiceResponse(text: string, intimacyLevel: number): Promise<AudioResult> {
        // Ajusta emoção baseado na intimidade
        let emotion: VoiceConfig['emotion'] = 'neutral';
        if (intimacyLevel > 70) emotion = 'happy';
        if (intimacyLevel > 85) emotion = 'surprised'; // More excited

        // Ajusta velocidade
        const speakingRate = intimacyLevel > 60 ? 1.1 : 1.0; // Fala mais rápido com íntimos

        return this.textToSpeech(text, { emotion, speakingRate });
    }

    /**
     * Limpa cache de áudios antigos
     */
    cleanupCache(olderThanHours: number = 24): number {
        const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
        let cleaned = 0;

        if (fs.existsSync(this.audioDir)) {
            const files = fs.readdirSync(this.audioDir);
            for (const file of files) {
                const filePath = path.join(this.audioDir, file);
                const stats = fs.statSync(filePath);
                if (stats.mtimeMs < cutoff) {
                    fs.unlinkSync(filePath);
                    cleaned++;
                }
            }
        }

        return cleaned;
    }
}
