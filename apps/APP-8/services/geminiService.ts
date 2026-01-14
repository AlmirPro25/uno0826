import { GoogleGenAI, Modality, Type } from "@google/genai";

// Ensure API_KEY is available from the environment
const API_KEY = import.meta.env.VITE_API_KEY;
if (!API_KEY) {
    console.warn("VITE_API_KEY environment variable not set. Configure it in .env.local");
}

const getAiClient = () => new GoogleGenAI({ apiKey: API_KEY || '' });

export const geminiService = {
  analyzeImageAndText: async (base64Image: string, mimeType: string, prompt: string) => {
    try {
      const ai = getAiClient();
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      };
      const textPart = { text: prompt };
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [imagePart, textPart] },
        config: {
            systemInstruction: "You are an expert analyst. Provide your response in well-formatted markdown, including code snippets if applicable.",
        }
      });
      return response.text;
    } catch (error) {
      console.error("Error analyzing image and text:", error);
      return "Sorry, I encountered an error while analyzing the image.";
    }
  },

  performDeepThought: async (prompt: string) => {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          systemInstruction: "You are a world-class AI assistant, capable of deep reasoning. Structure your response using clear markdown, including code blocks for any code, lists, and headings.",
          thinkingConfig: { thinkingBudget: 32768 },
        },
      });
      return response.text;
    } catch (error) {
      console.error("Error in deep thought:", error);
      return "Sorry, I couldn't process that complex request.";
    }
  },

  generateSpeech: async (text: string) => {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data received from TTS API.");
      }
      return base64Audio;
    } catch (error) {
      console.error("Error generating speech:", error);
      return null;
    }
  },

  summarizeText: async (text: string) => {
    if (!text) return '';
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Concisely summarize the key points of the following conversation in 2-3 sentences:\n\n${text}`,
            config: {
                systemInstruction: "You are a summarization expert. Identify the main topics and outcomes of the conversation.",
            },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error summarizing text:", error);
        return "Could not summarize the session.";
    }
  },

  extractFacts: async (conversation: string) => {
    try {
      const ai = getAiClient();
      const prompt = `Analise esta conversa e extraia fatos importantes sobre o usuário, suas preferências, habilidades e contexto.

Conversa:
${conversation}

Retorne um JSON array com formato:
[
  {
    "content": "descrição do fato",
    "type": "fact|preference|skill|context",
    "importance": 1-10,
    "tags": ["tag1", "tag2"]
  }
]

Foque em informações que seriam úteis para futuras conversas.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: "You are an expert at extracting structured information from conversations. Return valid JSON only.",
        },
      });

      const text = response.text.trim();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error("Error extracting facts:", error);
      return [];
    }
  },

  generateWithPersonality: async (prompt: string, systemInstruction: string, config?: any) => {
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: config?.useDeepThinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          ...(config?.useDeepThinking && { thinkingConfig: { thinkingBudget: 32768 } }),
          ...config
        },
      });
      return response.text;
    } catch (error) {
      console.error("Error generating with personality:", error);
      return "Desculpe, encontrei um erro ao processar sua solicitação.";
    }
  },
};