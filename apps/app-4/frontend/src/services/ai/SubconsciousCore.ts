import { GoogleGenAI, Type } from "@google/genai";
import { BrainRegion, LogEntry } from "@/types/neuro";

// This service handles the "Deep Thinking" and "Fast Logic" that happens
// when the Live API (Frontal Cortex) requests a tool call.

export class SubconsciousService {
    private ai: GoogleGenAI;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.ai = new GoogleGenAI({ apiKey });
    }

    // HEMISPHERE RIGHT: Deep Reasoning & Research (Pro Model)
    // Uses Google Search Grounding with strict medical context
    async consultMedicalDatabase(query: string, addLog: (log: LogEntry) => void): Promise<string> {
        addLog({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            region: BrainRegion.RIGHT,
            type: 'research',
            message: `Deep Query: "${query}"`,
        });

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-pro-latest', // Usando modelo estável disponível
                contents: `You are the Medical Research Subsystem (Right Hemisphere). 
        
        TASK: Perform a rigorous clinical search on: "${query}".
        
        SOURCES PRIORITY:
        1. PubMed / NCBI
        2. Merck Manual Professional
        3. Standard Clinical Guidelines (AHA, ADA, etc.)
        4. Reliable Medical Encyclopedias
        
        OUTPUT:
        Provide a concise clinical summary including potential differentials, drug interactions, or protocols found. 
        Cite sources explicitly via the grounding tool.`,
                config: {
                    // tools: [{ googleSearch: {} }], // Reativar quando googleSearch estiver disponível na lib
                }
            });

            const result = response.text || "No definitive research found.";

            // Extract grounding metadata if available for display
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

            addLog({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                region: BrainRegion.RIGHT,
                type: 'info',
                message: 'Research Complete',
                metadata: { result, sources }
            });

            return result;

        } catch (error) {
            console.error("Subconscious Pro Error", error);
            return "Subconscious Link Failure: Unable to access external medical databases.";
        }
    }

    // HEMISPHERE LEFT: Fast Triage & Protocols (Flash Model)
    async fastSymptomTriage(symptoms: string, addLog: (log: LogEntry) => void): Promise<string> {
        addLog({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            region: BrainRegion.LEFT,
            type: 'tool-call',
            message: `Triage Protocol Initiated: ${symptoms}`,
        });

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-flash-latest',
                contents: `You are the Triage Subsystem (Left Hemisphere).
        Input Symptoms: ${symptoms}
        
        Task:
        1. Identify Red Flags (Emergency signs).
        2. Generate a list of 3 critical follow-up questions to rule out worst-case scenarios.
        3. Rate urgency (1-10) based on Manchester Triage System logic.
        
        Output JSON only.`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            urgency: { type: Type.INTEGER, description: "1 is low, 10 is critical/ER" },
                            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
                            clinicalHypotheses: { type: Type.ARRAY, items: { type: Type.STRING } },
                            nextQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            });

            const resultText = response.text || "{}";
            let structuredData = {};
            try {
                structuredData = JSON.parse(resultText);
            } catch (e) {
                console.warn("Failed to parse Triage JSON", e);
            }

            addLog({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                region: BrainRegion.LEFT,
                type: 'info',
                message: 'Triage Computed',
                metadata: structuredData // Pass the Object, not string
            });

            // We return the text so the LLM can read it naturally
            return resultText;
        } catch (error) {
            return "Triage subsystem unavailable.";
        }
    }

    // SAFETY INTERLOCK: Pharmacovigilance
    async checkDrugInteractions(medication: string, condition: string, addLog: (log: LogEntry) => void): Promise<string> {
        addLog({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            region: BrainRegion.LEFT,
            type: 'warning',
            message: `Safety Protocol: Checking Interactions for ${medication}`,
        });

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-flash-latest',
                contents: `
                ACT AS A PHARMACOVIGILANCE AI.
                Check for contraindications or interactions between:
                Drug/Action: ${medication}
                Patient Condition/Meds: ${condition}

                Output strict warning if dangerous. Output "SAFE" if low risk.
            `
            });

            const result = response.text || "Safety check inconclusive.";

            addLog({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                region: BrainRegion.LEFT,
                type: 'info',
                message: 'Safety Protocol Complete',
                metadata: { result }
            });

            return result;
        } catch (e) {
            return "Safety check failed.";
        }
    }

    // VISUAL CORTEX: Analyzing images sent by user
    async analyzeVisualInput(base64Image: string, prompt: string, addLog: (log: LogEntry) => void): Promise<string> {
        addLog({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            region: BrainRegion.RIGHT,
            type: 'tool-call',
            message: `Visual Cortex Activation: Analyzing frame.`,
        });

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-pro-latest', // High fidelity for medical images
                contents: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    {
                        text: `Clinical Analysis Request: ${prompt}. 
                Describe clinical findings, checking for asymmetry, discoloration, swelling, or specific medical signs. 
                Be purely descriptive and objective.` }
                ]
            });

            const result = response.text;

            addLog({
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                region: BrainRegion.RIGHT,
                type: 'info',
                message: 'Visual Analysis Complete',
                metadata: { result }
            });

            return result || "Visual analysis inconclusive.";
        } catch (e) {
            return "Visual Cortex error.";
        }
    }
}
