import { GoogleGenAI, Type } from "@google/genai";
import { PatientProfile, CognitiveManifesto, LogEntry, MedicalRecord } from "@/types/neuro";

export class AgentFactory {
    private ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * GENESIS MODULE
     * Uses Gemini Flash to analyze patient data and instantiate a specific clinical persona.
     */
    async createManifesto(profile: PatientProfile): Promise<CognitiveManifesto> {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-flash-latest',
                contents: `
          Analyze this patient intake data and generate a Cognitive Manifesto for a specialized AI Clinical Agent.
          
          Patient: ${JSON.stringify(profile)}
          
          Available Voices:
          - 'Kore': Female, calm, soothing. (Good for Psychiatry, Pediatrics)
          - 'Fenrir': Male, deep, authoritative. (Good for Emergency, Trauma, Surgery)
          - 'Puck': Male, clear, neutral. (Good for General Practice)
          - 'Zephyr': Female, clear, energetic. (Good for Dermatology, Wellness)
          - 'Charon': Male, deep, serious. (Good for Oncology, Serious diagnostics)

          Task:
          1. Determine the most appropriate medical specialty.
          2. Define a persona role name (e.g., "Dr. Nexus Cardio").
          3. Set the tone.
          4. Select the BEST 'voiceName' from the list above matching the specialty.
          5. Create a specific clinical context.
        `,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            agentName: { type: Type.STRING },
                            role: { type: Type.STRING },
                            specialty: { type: Type.STRING },
                            tone: { type: Type.STRING },
                            context: { type: Type.STRING },
                            voiceName: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'] },
                            allowedTools: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING },
                                description: "Suggest which tools this agent should prioritize"
                            }
                        },
                        required: ['agentName', 'role', 'specialty', 'tone', 'context', 'voiceName']
                    }
                }
            });

            if (response.text) {
                return JSON.parse(response.text) as CognitiveManifesto;
            }
            throw new Error("Empty response from Agent Factory");
        } catch (error) {
            console.error("Genesis Failed:", error);
            // Fallback manifesto
            return {
                agentName: "Dr. Nexus Fallback",
                role: "General Emergency Triage",
                specialty: "General Medicine",
                tone: "Safe and conservative",
                context: "System degradation detected. Proceed with standard safety triage.",
                voiceName: 'Puck',
                allowedTools: ['fast_symptom_triage']
            };
        }
    }

    /**
     * MEMORY CONSOLIDATION MODULE
     */
    async generateMedicalReport(profile: PatientProfile, logs: LogEntry[]): Promise<MedicalRecord | null> {
        // Filter pertinent logs to reduce token count and noise
        const narrative = logs
            .filter(l => l.type === 'info' || l.type === 'tool-call' || l.type === 'research')
            .map(l => `[${l.region}] ${l.type.toUpperCase()}: ${l.message} ${l.metadata ? JSON.stringify(l.metadata) : ''}`)
            .join('\n');

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-1.5-pro-latest', // High reasoning capability for synthesis
                contents: `
          Act as a Senior Chief Resident reviewing a session log.
          Generate a formal SOAP Note (Subjective, Objective, Assessment, Plan) based on the interaction.
          
          PATIENT: ${JSON.stringify(profile)}
          
          SESSION LOGS:
          ${narrative}
        `,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            patientId: { type: Type.STRING },
                            timestamp: { type: Type.STRING },
                            subjective: { type: Type.STRING, description: "Patient's stated symptoms and history." },
                            objective: { type: Type.STRING, description: "Observations, vital signs (simulated), visual analysis." },
                            assessment: { type: Type.STRING, description: "Differential diagnosis and synthesis." },
                            plan: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Next steps, recommendations, labs." },
                            riskAssessment: {
                                type: Type.OBJECT,
                                properties: {
                                    level: { type: Type.STRING, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] },
                                    justification: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            });

            if (response.text) {
                return JSON.parse(response.text) as MedicalRecord;
            }
            return null;
        } catch (error) {
            console.error("Report Generation Error", error);
            return null;
        }
    }
}
