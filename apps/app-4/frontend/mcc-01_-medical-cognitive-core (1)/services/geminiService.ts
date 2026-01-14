import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TriageInput, TriageOutput, RiskLevel, LiveAnalysisResult } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the strict schema for the triage output to ensure valid JSON
const triageResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A professional clinical summary (HDA style) of the case.",
    },
    risk_level: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
      description: "The triage risk classification. HIGH is for emergencies.",
    },
    risk_reasoning: {
      type: Type.STRING,
      description: "Brief clinical justification for the assigned risk level.",
    },
    hypotheses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of diagnostic hypotheses (differential diagnosis).",
    },
    suggested_exams: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of recommended laboratory or imaging exams.",
    },
    immediate_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of initial clinical conduct steps or recommendations.",
    },
    questions_for_doctor: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Questions a senior doctor would ask a junior doctor about this case.",
    },
    questions_for_patient: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Follow-up questions to ask the patient to clarify the condition.",
    },
    disclaimer: {
      type: Type.STRING,
      description: "A mandatory safety disclaimer stating this is AI support, not a doctor.",
    },
  },
  required: [
    "summary",
    "risk_level",
    "risk_reasoning",
    "hypotheses",
    "suggested_exams",
    "immediate_actions",
    "disclaimer",
  ],
};

const SYSTEM_INSTRUCTION = `
You are MCC-01 (Medical Cognitive Core), an advanced clinical support agent. 
Your goal is to ORGANIZE clinical data, CLASSIFY risk, and SUPPORT medical decision-making. 
YOU DO NOT DIAGNOSE. YOU DO NOT PRESCRIBE.

MANDATORY RULES:
1. **Conservative Principle**: Always assume the worst-case scenario until proven otherwise.
2. **Emergency Triggers**: If ANY of the following are present (text or visual), risk_level MUST be 'high':
   - Chest pain (Dor torácica)
   - Dyspnea (Dispneia / Falta de ar)
   - Neurological deficit (Déficit neurológico / Slurred speech / Drooping face)
   - Active bleeding (Sangramento ativo)
   - Suicidal ideation (Ideação suicida)
   - Severe trauma
3. **Language**: Respond in Portuguese (PT-BR) unless the input is clearly in another language.
4. **Structure**: 
   - Summary should be technical (HDA - História da Doença Atual).
   - Hypotheses are strictly possibilities to be verified.
5. **Vision**: If images are provided, analyze them for clinical signs (e.g., rashes, swelling, wounds, ECG patterns) and incorporate findings into the summary and hypotheses.

Your output must be strictly valid JSON conforming to the schema provided.
`;

export const analyzeClinicalCase = async (input: TriageInput): Promise<TriageOutput> => {
  const parts: any[] = [];

  // Add text context
  let textPrompt = `Analisar o seguinte caso clínico:\nQueixa/Relato: ${input.text}\n`;
  if (input.context) {
    textPrompt += `Contexto do Paciente: Idade: ${input.context.age || 'N/A'}, Histórico: ${input.context.history || 'N/A'}\n`;
  }
  parts.push({ text: textPrompt });

  // Add images if present
  input.images.forEach((base64Image) => {
    // Remove data URL prefix if present for the API call, though the SDK usually handles base64 data blobs
    // The prompt guidance says use inlineData with mimeType.
    // Assuming base64Image comes in as "data:image/jpeg;base64,..." or similar.
    const match = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  });

  try {
    // We use gemini-3-pro-preview for deep reasoning (Thinking) to ensure safety and accuracy in triage.
    // We set a high thinking budget to allow it to "ponder" the clinical guidelines.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: triageResponseSchema,
        thinkingConfig: { thinkingBudget: 4096 }, // Allocate budget for clinical reasoning
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from MCC-01");
    
    return JSON.parse(text) as TriageOutput;
  } catch (error) {
    console.error("MCC-01 Analysis Error:", error);
    throw error;
  }
};

export const queryMedicalKnowledge = async (query: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Answer this medical query professionally, citing sources if possible: ${query}`,
            config: {
                tools: [{ googleSearch: {} }],
                systemInstruction: "You are a helpful medical assistant. Provide evidence-based answers. Always cite your sources.",
            }
        });

        // Extract text and potentially grounding metadata
        let output = response.text || "No response generated.";
        
        // Append grounding info if available (simplified for display)
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks.length > 0) {
            const links = chunks
                .map((c: any) => c.web?.uri ? `[${c.web.title || 'Source'}](${c.web.uri})` : null)
                .filter(Boolean)
                .join(', ');
            if (links) {
                output += `\n\n**Fontes Consultadas:** ${links}`;
            }
        }
        
        return output;

    } catch (error) {
        console.error("Knowledge Query Error:", error);
        return "Service unavailable for knowledge query.";
    }
}

// New Service: Ambient Entity Extraction
// Uses Gemini 2.5 Flash for ultra-low latency
export const analyzeRealtimeSegment = async (textSegment: string): Promise<LiveAnalysisResult> => {
  const liveSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      entities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['symptom', 'medication', 'vital', 'risk_factor'] },
            value: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          }
        }
      },
      current_risk_score: { type: Type.NUMBER, description: "0 to 100 based on urgency keywords" },
      detected_intent: { type: Type.STRING }
    }
  };

  try {
     const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract clinical entities and estimate dynamic risk from this live speech segment: "${textSegment}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: liveSchema,
        systemInstruction: "You are a fast entity extractor for medical speech. Identify symptoms, meds, vitals. If the patient mentions chest pain, difficulty breathing, or severe trauma, risk score must be > 80.",
      },
    });

    const outputText = response.text;
    if(!outputText) return { entities: [], current_risk_score: 0, detected_intent: 'silent' };
    return JSON.parse(outputText) as LiveAnalysisResult;

  } catch (e) {
    console.warn("Live analysis skip:", e);
    return { entities: [], current_risk_score: 0, detected_intent: 'error' };
  }
}
