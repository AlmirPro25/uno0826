import { GoogleGenAI, Type } from "@google/genai";
import { TriageReport, TriagePriority } from "../types";

// The "Deep Brain" model for analysis and report generation
const MODEL_NAME = "gemini-3-pro-preview";
const IMAGE_MODEL_NAME = "gemini-3-pro-image-preview";

export async function generateNurseAvatar(): Promise<string> {
  if (!process.env.API_KEY) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{
          text: "A professional, hyper-realistic, friendly futuristic female nurse portrait, looking directly at the camera. Soft medical lighting, cyan and white tech aesthetic background, cinematic 8k quality. The nurse should look empathetic and intelligent."
        }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return ""; // Fallback handled in UI
  } catch (e) {
    console.error("Failed to generate avatar:", e);
    return "";
  }
}

export async function generateMedicalReport(transcript: string): Promise<TriageReport> {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Você é um Auditor Médico Sênior e Especialista em Diagnóstico Diferencial.
    
    TAREFA:
    Analise a transcrição da triagem, CRITIQUE as informações baseadas em evidências científicas e gere um relatório.
    
    TRANSCRICAO:
    "${transcript}"
    
    INSTRUÇÕES DE PENSAMENTO CRÍTICO:
    1. **Validação Cruzada:** Compare o relato do paciente com a literatura médica (via Google Search). O paciente relatou algo impossível ou contraditório? Note isso.
    2. **Ceticismo Científico:** Não aceite o autodiagnóstico do paciente. Se ele diz "tenho dengue", verifique se os sintomas batem. Se a pesquisa indicar outra coisa, priorize a evidência clínica.
    3. **Síntese:** Mescle os dados visuais (se mencionados na transcrição), o áudio e a pesquisa externa para uma conclusão robusta.
    
    DIRETRIZES DO RELATÓRIO:
    1. Prioridade: Protocolo de Manchester.
    2. Seja extremamente técnico na "Justificativa", citando se houve discrepância entre o relato e a ciência.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Deep Research
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientComplaint: { type: Type.STRING, description: "Queixa principal do paciente" },
            historyOfPresentIllness: { type: Type.STRING, description: "História da moléstia atual (HMA) detalhada" },
            vitalSignsNote: { type: Type.STRING, description: "Observações visuais (aparência) e sinais vitais estimados" },
            suspectedDiagnosis: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Hipóteses diagnósticas baseadas em evidência"
            },
            recommendedSpecialty: { type: Type.STRING, description: "Especialidade médica" },
            priority: { 
              type: Type.STRING, 
              enum: [
                'Emergência (Vermelho)',
                'Muito Urgente (Laranja)',
                'Urgente (Amarelo)',
                'Pouco Urgente (Verde)',
                'Não Urgente (Azul)'
              ] 
            },
            reasoning: { type: Type.STRING, description: "Justificativa clínica complexa, citando fontes e conflitos de informação." },
          },
          required: ["patientComplaint", "priority", "recommendedSpecialty", "suspectedDiagnosis", "reasoning"]
        }
      }
    });

    const reportData = JSON.parse(response.text || "{}");
    
    // Extract grounding metadata (sources)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const externalReferences = groundingChunks
      .map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
      .filter((item: any) => item !== null);

    return {
      ...reportData,
      externalReferences
    };

  } catch (error) {
    console.error("Error generating medical report:", error);
    throw error;
  }
}