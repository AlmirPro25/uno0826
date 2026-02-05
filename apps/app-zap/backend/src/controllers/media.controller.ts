/**
 * 🎨 MEDIA CONTROLLER
 * API para geração de mídia (áudio e imagens)
 */

import { Request, Response } from 'express';
import { VoiceService } from '../services/voice.service';
import { ImageService } from '../services/image.service';
import { LogRepository } from '../repositories/log.repository';

const voiceService = new VoiceService();
const imageService = new ImageService();
const logRepo = new LogRepository();

export class MediaController {

    // ==================== VOICE (TTS) ====================

    /**
     * POST /media/voice/generate
     * Gera áudio a partir de texto
     */
    static async generateVoice(req: Request, res: Response) {
        try {
            const { text, emotion, speakingRate } = req.body;

            if (!text) {
                return res.status(400).json({ success: false, error: 'text is required' });
            }

            const result = await voiceService.textToSpeech(text, {
                emotion,
                speakingRate
            });

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error });
            }

            res.json({
                success: true,
                audio: {
                    base64: result.audioBase64,
                    mimeType: result.mimeType
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /media/voice/contextual
     * Gera áudio contextual baseado na intimidade
     */
    static async generateContextualVoice(req: Request, res: Response) {
        try {
            const { text, intimacyLevel = 50 } = req.body;

            if (!text) {
                return res.status(400).json({ success: false, error: 'text is required' });
            }

            const result = await voiceService.generateVoiceResponse(text, intimacyLevel);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error });
            }

            res.json({
                success: true,
                audio: {
                    base64: result.audioBase64,
                    mimeType: result.mimeType
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * DELETE /media/voice/cache
     * Limpa cache de áudios
     */
    static async cleanVoiceCache(req: Request, res: Response) {
        try {
            const { olderThanHours = 24 } = req.query;
            const cleaned = voiceService.cleanupCache(Number(olderThanHours));

            res.json({
                success: true,
                cleaned,
                message: `Cleaned ${cleaned} audio files`
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    // ==================== IMAGES ====================

    /**
     * POST /media/image/generate
     * Gera imagem a partir de prompt
     */
    static async generateImage(req: Request, res: Response) {
        try {
            const { prompt, style, aspectRatio, mood } = req.body;

            if (!prompt) {
                return res.status(400).json({ success: false, error: 'prompt is required' });
            }

            const result = await imageService.generateImage(prompt, {
                style,
                aspectRatio,
                mood
            });

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error });
            }

            res.json({
                success: true,
                image: {
                    base64: result.imageBase64,
                    mimeType: result.mimeType,
                    prompt: result.prompt
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /media/image/selfie
     * Gera selfie da persona
     */
    static async generateSelfie(req: Request, res: Response) {
        try {
            const { mood, setting } = req.body;

            const result = await imageService.generateSelfie(mood, setting);

            if (!result.success) {
                return res.status(500).json({ success: false, error: result.error });
            }

            res.json({
                success: true,
                image: {
                    base64: result.imageBase64,
                    mimeType: result.mimeType,
                    prompt: result.prompt
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * POST /media/image/variations
     * Gera múltiplas variações
     */
    static async generateVariations(req: Request, res: Response) {
        try {
            const { prompt, count = 3 } = req.body;

            if (!prompt) {
                return res.status(400).json({ success: false, error: 'prompt is required' });
            }

            const results = await imageService.generateVariations(prompt, Math.min(count, 5));

            res.json({
                success: true,
                images: results.map(r => ({
                    success: r.success,
                    base64: r.imageBase64,
                    mimeType: r.mimeType,
                    error: r.error
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * DELETE /media/image/cache
     * Limpa cache de imagens
     */
    static async cleanImageCache(req: Request, res: Response) {
        try {
            const { olderThanHours = 72 } = req.query;
            const cleaned = imageService.cleanupCache(Number(olderThanHours));

            res.json({
                success: true,
                cleaned,
                message: `Cleaned ${cleaned} image files`
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }

    /**
     * PUT /media/image/persona
     * Atualiza descrição da persona
     */
    static async updatePersona(req: Request, res: Response) {
        try {
            imageService.updatePersonaDescription(req.body);

            res.json({
                success: true,
                message: 'Persona description updated'
            });
        } catch (error) {
            res.status(500).json({ success: false, error: (error as Error).message });
        }
    }
}
