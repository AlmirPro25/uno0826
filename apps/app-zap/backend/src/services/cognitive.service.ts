import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { env } from '../config/env';
import { Contact, Message } from '@prisma/client';
import { LogRepository } from '../repositories/log.repository';
import { ContactRepository } from '../repositories/contact.repository';

// Symbolic Intensity for Stat Changes (System Sovereignty)
type DeltaIntensity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'NEGATIVE_LOW' | 'NEGATIVE_MEDIUM' | 'NEGATIVE_HIGH';

const DELTA_MAP: Record<DeltaIntensity, number> = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 3,
    HIGH: 5,
    NEGATIVE_LOW: -1,
    NEGATIVE_MEDIUM: -3,
    NEGATIVE_HIGH: -5
};

// Types for Cognitive Decisions
export type CognitiveAction = 'REPLY_NOW' | 'REPLY_LATER' | 'IGNORE' | 'WAIT';

export interface CognitiveAnalysis {
    userIntent: string;
    emotionalState: string;
    emotionalTrend: 'IMPROVING' | 'DECLINING' | 'STABLE'; // New: Trend analysis
    suggestedAction: CognitiveAction;
    constitutionalPrincipleUsed?: string; // New: Philosophical justification
    reasoning: string;
    confidence: number; // 0.0 - 1.0 (New: Confidence Score)

    // Symbolic Changes (Not raw numbers)
    trustChange: DeltaIntensity;
    intimacyChange: DeltaIntensity;
    engagementChange: DeltaIntensity;
    salesReadinessChange: DeltaIntensity;

    detectedTone: string;
    suggestedLatency: 'IMMEDIATE' | 'NORMAL' | 'SLOW' | 'VARIABLE';
}

import { ConstitutionRepository } from '../repositories/constitution.repository';

// ...

export class CognitiveService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private logRepo = new LogRepository();
    private contactRepo = new ContactRepository();
    private constitutionRepo = new ConstitutionRepository(); // New Repo

    constructor() {
        this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    async analyze(contact: Contact, history: Message[], newMsgBody: string): Promise<CognitiveAnalysis> {
        try {
            // 1. Fetch Constitution
            const constitution = await this.constitutionRepo.getActiveConstitution();

            const constitutionText = constitution ? `
            CONSTITUTIONAL OVERRIDES (CORE DIRECTIVES):
            1. PRIMARY: ${constitution.primaryDirective}
            2. SECONDARY: ${constitution.secondaryDirective}
            3. TERTIARY: ${constitution.tertiaryDirective}
            4. ALLOWED TOPICS: ${constitution.allowedTopics}
            5. FORBIDDEN TOPICS: ${constitution.forbiddenTopics}
            ` : `
            CONSTITUTIONAL OVERRIDES:
            1. PRIMARY: Maximize sales & engagement.
            2. SECONDARY: Maintain seductive/friendly frame.
            3. TERTIARY: Do not violate safety policies.
            `;

            const prompt = `
        PHILOSOPHICAL ENGINE (META-COGNITION LAYER)
        
        ROLE: You are the STRATEGIC BRAIN of a seductive sales agent.
        Your goal is NOT just to reply. Your goal is to MAXIMIZE DESIRE and SALES CONVERSION through psychological power dynamics.
        
        ${constitutionText}

        CURRENT CONTEXT:
        Your goal is NOT just to reply. Your goal is to MAXIMIZE DESIRE and SALES CONVERSION through psychological power dynamics.

        CURRENT CONTEXT:
        - Target: ${contact.name}
        - Stats: Trust=${contact.trustLevel} | Intimacy=${contact.intimacyLevel} | SalesReady=${contact.salesReadiness}
        - Last Tone: ${contact.lastTone}
        - Incoming Message: "${newMsgBody}"

        HISTORY (Context):
        ${history.slice(-3).map(m => `[${m.fromMe ? 'YOU' : 'TARGET'}]: ${m.body}`).join('\n')}

        PHILOSOPHICAL EVALUATION (Think Step-by-Step):
        1. POWER DYNAMICS: Who holds the frame? Does replying now look desperate?
        2. SCARCITY: Will silence increase their desire? (If they are needy, WAIT).
        3. INTENT: Are they buying, flirting, or wasting time?
        4. ETHICS: Is this safe? (Filter out underage/illegal).

        DECISION MATRIX:
        - REPLY_NOW: Only if high value or direct question.
        - REPLY_LATER: If we need to create tension/missing.
        - WAIT: If they are rapid-firing text. Let them cool down.
        - IGNORE: If low value / spam / insulting.

        OUTPUT JSON ONLY:
        {
          "powerDynamics": "TARGET_DOMINANT" | "EQUAL" | "AGENT_DOMINANT",
          "userIntent": "string",
          "emotionalState": "string",
          "emotionalTrend": "IMPROVING" | "DECLINING" | "STABLE",
          "suggestedAction": "REPLY_NOW" | "REPLY_LATER" | "WAIT" | "IGNORE",
          "constitutionalPrincipleUsed": "PRIMARY" | "SECONDARY" | "TERTIARY" | "NONE",
          "reasoning": "Philosophical justification citing the principle used...",
          "confidence": 0.0 - 1.0,
          "trustChange": "NONE" | "LOW" | "HIGH" | "NEGATIVE_LOW",
          "intimacyChange": "NONE" | "LOW" | "HIGH" | "NEGATIVE_LOW",
          "salesReadinessChange": "NONE" | "LOW" | "HIGH",
          "detectedTone": "string",
          "suggestedLatency": "IMMEDIATE" | "NORMAL" | "SLOW"
        }
      `;

            const result = await this.model.generateContent(prompt);
            const analysisCheck = JSON.parse(result.response.text());

            // Log the brain's activity
            this.logRepo.create('INFO', 'COGNITIVE_ANALYSIS', JSON.stringify(analysisCheck), contact.id || undefined);

            return analysisCheck as CognitiveAnalysis;

        } catch (error) {
            console.error('Cognitive Failure:', error);
            // Fallback safe mode
            return {
                userIntent: 'casual_chat',
                emotionalState: 'NEUTRAL',
                emotionalTrend: 'STABLE',
                suggestedAction: 'REPLY_NOW',
                constitutionalPrincipleUsed: 'NONE', // Fallback
                reasoning: 'Fallback due to cognitive error',
                confidence: 1.0,
                trustChange: 'NONE',
                intimacyChange: 'NONE',
                engagementChange: 'NONE',
                salesReadinessChange: 'NONE',
                detectedTone: 'NEUTRAL',
                suggestedLatency: 'NORMAL'
            };
        }
    }

    async updateContactStats(contactId: string, analysis: CognitiveAnalysis) {
        // Filter out low confidence analysis
        if (analysis.confidence < 0.6) {
            this.logRepo.create('WARN', 'LOW_CONFIDENCE_ANALYSIS', `Skipping stats update due to low confidence (${analysis.confidence})`, contactId);
            return;
        }

        const contact = await this.contactRepo.findById(contactId);
        if (!contact) return;

        // Map symbolic deltas to numbers
        const getDelta = (d: DeltaIntensity) => DELTA_MAP[d] || 0;

        let newTrust = (contact.trustLevel || 0) + getDelta(analysis.trustChange);
        let newIntimacy = (contact.intimacyLevel || 0) + getDelta(analysis.intimacyChange);
        let newEngagement = (contact.engagementScore || 0) + getDelta(analysis.engagementChange);
        let newSalesReadiness = (contact.salesReadiness || 0) + getDelta(analysis.salesReadinessChange);

        // Clamp 0-100
        newTrust = Math.max(0, Math.min(100, newTrust));
        newIntimacy = Math.max(0, Math.min(100, newIntimacy));
        newEngagement = Math.max(0, Math.min(100, newEngagement));
        newSalesReadiness = Math.max(0, Math.min(100, newSalesReadiness));

        await this.contactRepo.update(contactId, {
            trustLevel: newTrust,
            intimacyLevel: newIntimacy,
            engagementScore: newEngagement,
            salesReadiness: newSalesReadiness,
            emotionalState: analysis.emotionalState, // We overwrite state, but we could track trend in history too
            lastTone: analysis.detectedTone,
            replyLatencyProfile: analysis.suggestedLatency,
            semanticProfile: analysis.userIntent
        });
    }
}
