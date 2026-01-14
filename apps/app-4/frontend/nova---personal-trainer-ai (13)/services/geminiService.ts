import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_API_KEY, THINKING_MODEL, FAST_MODEL, SYSTEM_INSTRUCTION_ANALYSIS, SYSTEM_INSTRUCTION_PLANNER } from '../constants';
import { AnalysisResult, UserProfile, WeeklyPlan, ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export const analyzeImage = async (
  base64Image: string,
  mimeType: string,
  type: 'food' | 'body'
): Promise<AnalysisResult> => {
  
  const prompt = type === 'food' 
    ? "Analise este prato. Estime calorias (apenas número inteiro), macronutrientes e qualidade nutricional."
    : "Analise a postura ou composição corporal visível nesta imagem. Identifique alinhamento e sugestões de ergonomia. NÃO FAÇA DIAGNÓSTICO MÉDICO.";

  try {
    const response = await ai.models.generateContent({
      model: THINKING_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
        thinkingConfig: { thinkingBudget: 2048 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Resumo executivo da análise." },
            estimatedCalories: { type: Type.INTEGER, description: "Estimativa numérica total de calorias (se aplicável, senão 0)." },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  unit: { type: Type.STRING }
                }
              }
            },
            recommendation: { type: Type.STRING, description: "Ação sugerida baseada nos dados." },
            disclaimer: { type: Type.STRING, description: "Aviso legal de saúde obrigatório." }
          },
          required: ["summary", "metrics", "recommendation", "disclaimer"]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        type,
        timestamp: new Date().toISOString(),
        ...parsed
      };
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
};

export const generateWeeklyPlan = async (profile: UserProfile): Promise<WeeklyPlan> => {
  const prompt = `
    Gere um plano para:
    Nome: ${profile.name}
    Idade: ${profile.age}
    Peso: ${profile.weight}kg
    Altura: ${profile.height}cm
    Objetivo: ${profile.goal}
    Nível: ${profile.level}
  `;

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_PLANNER,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING }, // Monday, Tuesday...
                  focus: { type: Type.STRING },
                  workout: { type: Type.STRING },
                  nutritionFocus: { type: Type.STRING },
                  duration: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...parsed
      };
    }
    throw new Error("Failed to generate plan");

  } catch (error) {
    console.error("Plan generation failed:", error);
    throw error;
  }
};

export const sendNeuralChatMessage = async (
  history: ChatMessage[], 
  userMessage: string, 
  context: string,
  attachment?: { mimeType: string, data: string }
): Promise<string> => {
  
  const systemInstruction = `
    Você é a interface textual do sistema NOVA.
    Responda de forma concisa, tática e motivadora.
    Use os dados do usuário (contexto) para dar respostas precisas.
    Se o usuário enviar uma imagem ou áudio, analise o conteúdo e integre à resposta.
    Se o usuário perguntar sobre treino, consulte o plano ativo no contexto.
    Se o usuário perguntar sobre comida, dê dicas gerais ou baseadas no histórico.
    Mantenha o tom "Sci-Fi Coach".
  `;

  let promptText = `CONTEXTO DO USUÁRIO:\n${context}\n\n`;
  promptText += `HISTÓRICO DA CONVERSA:\n`;
  history.forEach(msg => {
    promptText += `${msg.role === 'user' ? 'Usuário' : 'Nova'}: ${msg.text}\n`;
  });
  
  // If there's an attachment, the user message might be empty or a caption.
  // If text is empty but attachment exists, we label it as "Media Input".
  const finalUserText = userMessage.trim() === '' && attachment ? '[Envio de Mídia]' : userMessage;
  
  promptText += `Usuário Atual: ${finalUserText}\nNova:`;

  const parts: any[] = [{ text: promptText }];

  if (attachment) {
    parts.unshift({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Sem resposta do servidor.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};
