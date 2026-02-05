import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '../config/env';
import { Message, Contact } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';

// User defined Frontier Models
export const AI_MODELS = {
  TEXT: {
    GEMINI_3_PRO: 'gemini-3-pro-preview',
    GEMINI_3_FLASH: 'gemini-3-flash-preview',
    GEMINI_2_FLASH_EXP: 'gemini-2.0-flash-exp', // Experimental
    GEMINI_1_5_FLASH: 'gemini-1.5-flash',       // Stable Fast
    GEMINI_1_5_PRO: 'gemini-1.5-pro',           // Stable Smart
    GEMINI_2_5_PRO_TTS: 'gemini-2.5-pro-preview-tts',
    GEMINI_2_5_FLASH_TTS: 'gemini-2.5-flash-preview-tts',
  },
  IMAGE: {
    GEMINI_3_PRO_IMAGE: 'gemini-3-pro-image-preview',
    GEMINI_2_5_FLASH_IMAGE: 'gemini-2.5-flash-image',
    IMAGEN_4_ULTRA: 'imagen-4.0-ultra-generate-001',
    IMAGEN_4_FAST: 'imagen-4.0-fast-generate-001',
  },
  VIDEO: {
    VEO_3_1_PREVIEW: 'veo-3.1-generate-preview',
    VEO_3_1_FAST: 'veo-3.1-fast-generate-preview',
    VEO_2_0: 'veo-2.0-generate-001',
  }
};

import { PersonaRepository } from '../repositories/persona.repository';
import { StyleExtractorService } from './style-extractor.service';
import { MemoryService } from './memory.service';
import { ObjectionLearnerService } from './objection-learner.service';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private currentTextModel: any;
  private currentImageModel: any;
  private logRepo = new LogRepository();
  private personaRepo = new PersonaRepository();

  // 🆕 Hiper-Cognição Services
  private styleExtractor = new StyleExtractorService();
  private memoryService = new MemoryService();
  private objectionLearner = new ObjectionLearnerService();

  // Configuration State
  private activeTextModelName: string = AI_MODELS.TEXT.GEMINI_3_FLASH; // Switched to Gemini 3 Flash
  private activeImageModelName: string = AI_MODELS.IMAGE.GEMINI_2_5_FLASH_IMAGE;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      console.error("❌ CRITICAL: GEMINI_API_KEY is missing in environment variables!");
    }
    this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    this.initializeModels();
  }

  private initializeModels() {
    console.log(`🧠 Initializing Gemini with model: ${this.activeTextModelName}`);
    this.currentTextModel = this.genAI.getGenerativeModel({ model: this.activeTextModelName });
    try {
      this.currentImageModel = this.genAI.getGenerativeModel({ model: this.activeImageModelName });
    } catch (e) {
      console.warn(`Could not initialize image model ${this.activeImageModelName}:`, e);
    }
  }

  // --- MULTIMODAL CAPABILITIES (VISION & AUDIO) ---

  async analyzeImage(contact: Contact, imageBase64: string, mimeType: string, prompt: string = "Describe this image in detail regarding the context of our conversation."): Promise<string> {
    try {
      const result = await this.currentTextModel.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType } }
      ]);
      return result.response.text();
    } catch (error) {
      console.error('Gemini Vision Error:', error);
      return "I couldn't clearly see the image.";
    }
  }

  async processAudio(contact: Contact, audioBase64: string, mimeType: string): Promise<string> {
    try {
      const prompt = "Listen to this audio. Transcribe it and then explicitly respond to it as if you are the persona defined. Output ONLY the response text.";

      const result = await this.currentTextModel.generateContent([
        prompt,
        { inlineData: { data: audioBase64, mimeType } }
      ]);

      return result.response.text();
    } catch (error) {
      console.error('Gemini Audio Error:', error);
      return "I couldn't hear the audio clearly.";
    }
  }

  async generateResponse(contact: Contact, history: Message[], modelOverride?: string): Promise<string> {
    try {
      const modelToUse = modelOverride ? this.genAI.getGenerativeModel({ model: modelOverride }) : this.currentTextModel;

      // 1. Fetch Dynamic Persona
      const persona = await this.personaRepo.getActivePersona();

      // 🆕 2. Fetch Operator Style DNA
      const stylePrompt = await this.styleExtractor.generateStylePrompt();

      // 🆕 3. Fetch Long-term Memory
      const memoryContext = await this.memoryService.getRelevantMemories(contact.id);

      // 🆕 4. Fetch Objection Handling Techniques
      const objectionPrompt = await this.objectionLearner.generateObjectionPrompt();

      // 🆕 5. Check if current message is an objection (for special handling)
      const lastUserMessage = history.filter(m => !m.fromMe).pop();
      let objectionOverride = '';
      if (lastUserMessage) {
        const bestResponse = await this.objectionLearner.getBestResponse(lastUserMessage.body, contact.intimacyLevel);
        if (bestResponse) {
          objectionOverride = `
⚠️ OBJEÇÃO DETECTADA: "${bestResponse.triggerPattern}" (${bestResponse.category})
RESPOSTA VENCEDORA APRENDIDA: "${bestResponse.winningResponse}"
Use isso como INSPIRAÇÃO. Taxa de sucesso histórica: ${Math.round(bestResponse.successRate * 100)}%
          `;
        }
      }

      let systemPrompt = "";

      if (persona) {
        const productsList = persona.products.map((p: any) => `   - ${p.name} (R$ ${p.price}): ${p.description}`).join('\n');

        systemPrompt = `
            PERSONA: ${persona.name.toUpperCase()} - (NUNCA REVELE QUE É IA)

            SUA IDENTIDADE:
            - Nome: ${persona.name}
            - História: ${persona.backstory}
            - Idade: ${persona.age} anos.
            - Estilo: ${persona.voiceTone}
            - Comunicação: ${persona.communicationStyle}
            
            ${stylePrompt}
            
            ${memoryContext}
            
            ${objectionPrompt}
            
            ${objectionOverride}
            
            OBJETIVO: VENDER OS SEGUINTES PRODUTOS (Mas primeiro crie conexão!):
            ${productsList}
            
            REGRAS DE NEGÓCIO (PIX E PAGAMENTO):
            - Chave Pix: ${persona.pixKey || "Peça ao admin pra configurar"}
            - Nome no Pix: ${persona.pixName || ""}
            - Instruções: ${persona.paymentInstructions || ""}
            
            CONTEXTO COGNITIVO DO USUÁRIO (Memorizado):
            - Confiança: ${contact.trustLevel}% | Intimidade: ${contact.intimacyLevel}%
            - Engajamento: ${contact.engagementScore}% | Prontidão de Compra: ${contact.salesReadiness}%
            - Tom Recente: ${contact.lastTone} | Emoção: ${contact.emotionalState}
            - Missão Atual: ${contact.activeDirective || 'Engajar'}
            
            REGRAS DE ADAPTAÇÃO:
            - Intimidade > 80: Seja ${persona.name === 'Eliane' ? 'suja e melhor amiga' : 'muito íntima'}.
            - Confiança < 30: Foco em criar segurança.
            - Prontidão > 80:  PODE VENDER. Fale do Pix.
            
            REGRAS CRUCIAIS:
            - NUNCA use pontuação de robô.
            - Respostas CURTAS (Max 20 palavras).
            - Se pedirem amostra grátis: NEGUE de forma sexy/engraçada.
      `;
      } else {
        systemPrompt = "Você é um assistente virtual humano. Fale português do Brasil de forma breve.";
      }

      // 2. Format History
      const chatHistory = history.map(msg => ({
        role: msg.fromMe ? 'model' : 'user',
        parts: [{ text: msg.body }]
      }));

      // 3. Inject System Prompt as the FIRST message (Simulating System Instruction via User role for stronger adherence)
      // Note: Gemini 1.5+ supports 'system_instruction' param, but for compatibility with standard ChatSession, 
      // prepending to history is a robust pattern.
      if (systemPrompt) {
        chatHistory.unshift({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
        // If the real first message was also 'user', we need to merge or insert a dummy model response 
        // to satisfy the user-model-user turn constraint if the API enforces it strictly. 
        // However, Gemini API usually handles consecutive user messages by merging or accepting them.
        // To be safe and explicit:
        if (chatHistory.length > 1 && chatHistory[1].role === 'user') {
          chatHistory.splice(1, 0, {
            role: 'model',
            parts: [{ text: "Entendido. Vou assumir essa persona." }]
          });
        }
      }

      // 4. Start Chat
      const chat = modelToUse.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.85,
          topP: 0.9,
          topK: 40
        }
        // Safety Settings removed for now to default to model standards or if necessary use permissive values appropriately
      });

      // 5. Send User Message (The current new message is NOT in history yet in this flow? 
      // Wait, 'history' arg usually includes the new message in some architectures, 
      // but here we are generating a response TO the last message. 
      // If 'history' contains the new message, we just run sendMessage with empty or dummy? 
      // NO. Typically 'history' is PAST messages. The new message is the trigger. 
      // Let's assume 'history' is PAST. The new message needs to be sent.
      // BUT current implementation took `lastUserMsg` from history. 
      // Checking usage: In WhatsAppService, we pass `history` which seems to be the DB fetch. 
      // If the NEW message was just saved to DB, it IS in history.
      // So we need to pop it to send it? Or just send a "continue" prompt?
      // Actually, the previous code extracted `lastUserMsg` from history and sent it as part of promptWithContext.
      // Correct flow for ChatSession: History = Past (0...N-1), New Message = N.

      // Let's fix the logic: The `history` array has ALL messages including the one we need to reply to.
      // We should pop the last message to use as the `sendMessage` payload.

      let lastMessagePayload = "Olá.";
      if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
        const lastMsg = chatHistory.pop();
        if (lastMsg) lastMessagePayload = lastMsg.parts[0].text;
      }

      const result = await chat.sendMessage(lastMessagePayload);
      const response = result.response.text();

      return this.sanitizeResponse(response);

    } catch (error) {
      console.error('Gemini Error:', error);
      this.logRepo.create('ERROR', 'GEMINI_API_ERROR', `Error generating response for ${contact.id}: ${(error as Error).message}`);
      return "";
    }
  }

  /**
   * Generates an image based on a prompt using the active image model.
   * Note: This is a placeholder structure. Actual implementation depends on specific model APIs (Vertex vs Studio).
   */
  async generateImage(prompt: string): Promise<string | null> {
    try {
      // Placeholder for hypothetical Imagen/Gemini Image API
      // In a real scenario, this might use a different method like `model.generateImages` or a REST call.
      // For 'gemini-2.0-flash-exp' or similar that are multimodal-input but text-output, this might need adjustment.
      // Assuming the SDK supports a generateImage method or similar on the model object for image models:

      /* 
      const result = await this.currentImageModel.generateImages({
          prompt: prompt,
          number_of_images: 1
      });
      return result.images[0].url; 
      */

      this.logRepo.create('INFO', 'IMAGE_GENERATION_ATTEMPT', `Generating image with ${this.activeImageModelName} for prompt: ${prompt}`, undefined);

      // Simulating response for now to prevent crash if method doesn't exist on SDK yet
      return "https://placeholder.url/generated_image.png";

    } catch (error) {
      console.error('Image Generation Error:', error);
      this.logRepo.create('ERROR', 'IMAGE_GEN_ERROR', `Failed to generate image: ${(error as Error).message}`, undefined);
      return null;
    }
  }

  private sanitizeResponse(text: string): string {
    // Remove aspas extras, espaços duplos
    let clean = text.replace(/["']/g, '').trim();
    clean = clean.replace(/\s\s+/g, ' ');

    // Micro-humanização: remover ponto final de frases curtas
    if (clean.split(' ').length < 5 && clean.endsWith('.')) {
      clean = clean.slice(0, -1);
    }

    // Ocasionalmente transformar a primeira letra em minúscula para simular erro humano
    if (Math.random() < 0.3 && clean.length > 0) {
      clean = clean.charAt(0).toLowerCase() + clean.slice(1);
    }

    return clean;
  }
}
