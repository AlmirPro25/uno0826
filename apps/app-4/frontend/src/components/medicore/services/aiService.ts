import { GoogleGenAI, Type } from "@google/genai";
import { TriageReport } from "../types";

// Model for report generation
const MODEL_NAME = "models/gemini-robotics-er-1.5-preview";

// Helper to get API Key safely
const getApiKey = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
};

export async function generateNurseAvatar(): Promise<string> {
    // Return a static professional avatar to avoid complex image generation dependencies
    // and ensure immediate load.
    return "https://images.unsplash.com/photo-1594824476969-2319bf141e80?q=80&w=1000&auto=format&fit=crop";
}

export async function generateMedicalReport(transcript: string): Promise<TriageReport> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API Key not found. Please configure it in Settings.");
    }

    console.log("Generating report for transcript:", transcript.substring(0, 200) + "...");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Você é um Auditor Médico Sênior e Especialista em Diagnóstico Diferencial.

TAREFA:
Analise a transcrição da triagem e gere um relatório médico estruturado.

TRANSCRICAO:
"${transcript}"

INSTRUÇÕES:
1. Extraia a queixa principal do paciente
2. Resuma a história da moléstia atual
3. Note observações visuais mencionadas
4. Liste hipóteses diagnósticas
5. Recomende especialidade médica
6. Classifique a prioridade pelo Protocolo de Manchester
7. Justifique a classificação

Responda APENAS com JSON válido no formato especificado.
`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: prompt,
            config: {
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
                        reasoning: { type: Type.STRING, description: "Justificativa clínica" },
                    },
                    required: ["patientComplaint", "priority", "recommendedSpecialty", "suspectedDiagnosis", "reasoning"]
                }
            }
        });

        console.log("API Response received");
        
        // Get text from response
        const responseText = response.text || "";
        console.log("Response text:", responseText.substring(0, 500));
        
        const reportData = JSON.parse(responseText);

        // Ensure all required fields have defaults
        return {
            patientComplaint: reportData.patientComplaint || "Não especificado",
            historyOfPresentIllness: reportData.historyOfPresentIllness || "Não informado",
            vitalSignsNote: reportData.vitalSignsNote || "Não avaliado",
            suspectedDiagnosis: reportData.suspectedDiagnosis || ["A definir"],
            recommendedSpecialty: reportData.recommendedSpecialty || "Clínica Geral",
            priority: reportData.priority || "Pouco Urgente (Verde)",
            reasoning: reportData.reasoning || "Avaliação pendente",
            externalReferences: []
        };

    } catch (error) {
        console.error("Error generating medical report:", error);
        throw error;
    }
}
