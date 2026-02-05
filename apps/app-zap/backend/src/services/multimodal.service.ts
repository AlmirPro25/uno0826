/**
 * 🎭 MULTIMODAL SERVICE
 * Decide quando enviar texto, áudio ou imagem.
 * Gerencia a comunicação multimodal com o contato.
 */

import { VoiceService, AudioResult } from './voice.service';
import { ImageService, ImageResult } from './image.service';
import { LogRepository } from '../repositories/log.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type MessageType = 'TEXT' | 'AUDIO' | 'IMAGE' | 'TEXT_WITH_AUDIO';

export interface MultimodalDecision {
    preferredType: MessageType;
    reason: string;
    shouldGenerateAudio: boolean;
    shouldGenerateImage: boolean;
    audioEmotion?: 'neutral' | 'happy' | 'sad' | 'angry';
    imagePrompt?: string;
}

export interface MultimodalResponse {
    text: string;
    audio?: AudioResult;
    image?: ImageResult;
    messageTypes: MessageType[];
}

export class MultimodalService {
    private voiceService = new VoiceService();
    private imageService = new ImageService();
    private logRepo = new LogRepository();

    /**
     * Decide qual tipo de mídia usar baseado no contexto
     */
    decideMediaType(
        messageText: string,
        intimacyLevel: number,
        recentMessagesFromContact: number,
        lastContactMessageType: 'text' | 'audio' | 'image' | 'video',
        hourOfDay: number
    ): MultimodalDecision {
        // Default: text only
        let decision: MultimodalDecision = {
            preferredType: 'TEXT',
            reason: 'Default text response',
            shouldGenerateAudio: false,
            shouldGenerateImage: false
        };

        // Se contato mandou áudio, responder com áudio tem maior chance
        if (lastContactMessageType === 'audio' && intimacyLevel > 40) {
            decision = {
                preferredType: 'AUDIO',
                reason: 'Contact sent audio, reciprocating',
                shouldGenerateAudio: true,
                shouldGenerateImage: false,
                audioEmotion: 'happy'
            };
        }

        // Se intimidade muito alta, ocasionalmente mandar áudio espontâneo
        if (intimacyLevel > 80 && Math.random() < 0.2) {
            decision = {
                preferredType: 'TEXT_WITH_AUDIO',
                reason: 'High intimacy, adding personal touch with audio',
                shouldGenerateAudio: true,
                shouldGenerateImage: false,
                audioEmotion: 'happy'
            };
        }

        // Se mensagem é curta e íntima, considerar áudio
        if (messageText.length < 50 && intimacyLevel > 60 && Math.random() < 0.15) {
            decision = {
                preferredType: 'AUDIO',
                reason: 'Short intimate message, audio feels more personal',
                shouldGenerateAudio: true,
                shouldGenerateImage: false,
                audioEmotion: this.detectEmotion(messageText)
            };
        }

        // Se contato pediu foto/selfie, gerar imagem
        const imageRequestPatterns = [
            /manda.*foto/i,
            /quero.*te.*ver/i,
            /selfie/i,
            /mostra.*você/i,
            /foto.*sua/i,
            /como.*você.*é/i
        ];

        if (imageRequestPatterns.some(p => p.test(messageText))) {
            decision = {
                preferredType: 'IMAGE',
                reason: 'Contact requested photo',
                shouldGenerateAudio: false,
                shouldGenerateImage: true,
                imagePrompt: 'selfie'
            };
        }

        // Noite (22h-6h): mais áudios curtos
        if (hourOfDay >= 22 || hourOfDay < 6) {
            if (Math.random() < 0.25 && intimacyLevel > 50) {
                decision = {
                    preferredType: 'AUDIO',
                    reason: 'Late night, audio feels more intimate',
                    shouldGenerateAudio: true,
                    shouldGenerateImage: false,
                    audioEmotion: 'neutral'
                };
            }
        }

        return decision;
    }

    /**
     * Detecta emoção do texto para TTS
     */
    private detectEmotion(text: string): 'neutral' | 'happy' | 'sad' | 'angry' {
        const lowerText = text.toLowerCase();

        // Happy patterns
        if (/😊|😄|🥰|❤|haha|kk|rsrs|amor|lindo|fofo/i.test(lowerText)) {
            return 'happy';
        }

        // Sad patterns
        if (/😢|😭|triste|saudade|falta/i.test(lowerText)) {
            return 'sad';
        }

        // Angry patterns
        if (/😠|😡|raiva|bravo|irritado/i.test(lowerText)) {
            return 'angry';
        }

        return 'neutral';
    }

    /**
     * Gera resposta multimodal completa
     */
    async generateMultimodalResponse(
        textResponse: string,
        decision: MultimodalDecision,
        intimacyLevel: number
    ): Promise<MultimodalResponse> {
        const response: MultimodalResponse = {
            text: textResponse,
            messageTypes: ['TEXT']
        };

        // Gerar áudio se necessário
        if (decision.shouldGenerateAudio) {
            try {
                const audio = await this.voiceService.generateVoiceResponse(
                    textResponse,
                    intimacyLevel
                );
                if (audio.success) {
                    response.audio = audio;
                    response.messageTypes.push('AUDIO');
                    this.logRepo.create('INFO', 'MULTIMODAL_AUDIO',
                        `Generated audio response for intimacy ${intimacyLevel}`, undefined);
                }
            } catch (error) {
                console.error('Audio generation failed:', error);
            }
        }

        // Gerar imagem se necessário
        if (decision.shouldGenerateImage) {
            try {
                let image: ImageResult;
                if (decision.imagePrompt === 'selfie') {
                    image = await this.imageService.generateSelfie('happy', 'outdoor');
                } else {
                    image = await this.imageService.generateImage(decision.imagePrompt || '');
                }

                if (image.success) {
                    response.image = image;
                    response.messageTypes.push('IMAGE');
                    this.logRepo.create('INFO', 'MULTIMODAL_IMAGE',
                        `Generated image response`, undefined);
                }
            } catch (error) {
                console.error('Image generation failed:', error);
            }
        }

        return response;
    }

    /**
     * Prepara mensagens para envio via WhatsApp
     */
    prepareForWhatsApp(response: MultimodalResponse): {
        text?: string;
        audioBase64?: string;
        audioMimeType?: string;
        imageBase64?: string;
        imageMimeType?: string;
    } {
        const prepared: any = {};

        // Sempre inclui texto (pelo menos como caption)
        if (response.text) {
            prepared.text = response.text;
        }

        // Áudio
        if (response.audio?.success && response.audio.audioBase64) {
            prepared.audioBase64 = response.audio.audioBase64;
            prepared.audioMimeType = response.audio.mimeType;
        }

        // Imagem
        if (response.image?.success && response.image.imageBase64) {
            prepared.imageBase64 = response.image.imageBase64;
            prepared.imageMimeType = response.image.mimeType;
        }

        return prepared;
    }

    /**
     * Analisa histórico para decidir frequência de mídia
     */
    async getMediaPreferences(contactId: string): Promise<{
        preferAudio: boolean;
        preferImage: boolean;
        lastAudioSent?: Date;
        lastImageSent?: Date;
    }> {
        // Check recent messages for media usage
        const recentMessages = await prisma.message.findMany({
            where: {
                contactId,
                fromMe: true,
                mediaType: { not: null }
            },
            orderBy: { timestamp: 'desc' },
            take: 20
        });

        const audioMessages = recentMessages.filter(m => m.mediaType === 'audio');
        const imageMessages = recentMessages.filter(m => m.mediaType === 'image');

        return {
            preferAudio: audioMessages.length > 0,
            preferImage: imageMessages.length > 0,
            lastAudioSent: audioMessages[0]?.timestamp,
            lastImageSent: imageMessages[0]?.timestamp
        };
    }

    /**
     * Limpa caches de mídia
     */
    cleanupCaches(olderThanHours: number = 24): { audio: number; image: number } {
        return {
            audio: this.voiceService.cleanupCache(olderThanHours),
            image: this.imageService.cleanupCache(olderThanHours * 3) // Images kept longer
        };
    }
}
