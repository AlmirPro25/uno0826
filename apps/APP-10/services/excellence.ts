
import { GoogleGenAI, Type } from "@google/genai";
import { ExcellenceReport } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

// ============================================================================
// 🏅 EXCELLENCE ENGINE
// ============================================================================

export const evaluateCode = async (
  code: string,
  modelId: string
): Promise<ExcellenceReport> => {
  const ai = getClient();

  const prompt = `
  You are a Senior Software Architect and QA Lead.
  Evaluate the following codebase (HTML structure with embedded virtual files).
  
  CRITERIA:
  1. Code Quality (Cleanliness, Structure, DRY)
  2. Security (No exposed secrets, safe HTML practices)
  3. Best Practices (Modern React/JS patterns)
  4. Completeness (Does it look like a functional app?)

  INPUT CODE:
  ${code.substring(0, 50000)} // Limit context if too large

  RETURN JSON ONLY:
  {
      "score": number (0-100),
      "critique": "Short summary of main issues or praise (max 2 sentences)",
      "improvements": ["Specific actionable improvement 1", "Specific actionable improvement 2"],
      "securityLevel": "low" | "medium" | "high"
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            critique: { type: Type.STRING },
            improvements: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            securityLevel: { type: Type.STRING, enum: ["low", "medium", "high"] }
          },
          required: ["score", "critique", "improvements", "securityLevel"]
        }
      }
    });
    
    const json = JSON.parse(response.text || "{}");
    return json as ExcellenceReport;
  } catch (error) {
    console.error("Excellence Evaluation Failed:", error);
    // Return a neutral fallback report so the app doesn't crash
    return {
        score: 75,
        critique: "Automated evaluation unavailable.",
        improvements: [],
        securityLevel: "medium"
    };
  }
};

export const autoRefineCode = async (
  currentCode: string,
  report: ExcellenceReport,
  modelId: string
): Promise<string> => {
    const ai = getClient();
    
    const prompt = `
    You are a Senior Developer tasked with fixing code based on a QA report.
    
    QA REPORT:
    Score: ${report.score}/100
    Critique: ${report.critique}
    Required Improvements:
    ${report.improvements.map(i => `- ${i}`).join('\n')}

    INSTRUCTIONS:
    1. Apply the improvements to the code below.
    2. Ensure the result is the FULL valid HTML with embedded scripts.
    3. Do not remove existing functionality unless it is broken.
    4. Return ONLY the raw HTML code.

    CURRENT CODE:
    ${currentCode.substring(0, 60000)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            // We don't force JSON here because we want the raw HTML string (potentially large)
            // typically returned as text.
        });

        let cleaned = response.text?.trim() || currentCode;
        
        // Strip markdown fences if present
        if (cleaned.startsWith('```')) {
            const match = cleaned.match(/^```(\w*)?\s*\n?([\s\S]*?)\n?\s*```$/);
            if (match && match[2]) {
                cleaned = match[2];
            }
        }

        return cleaned;
    } catch (error) {
        console.error("Auto-Refinement Failed:", error);
        return currentCode; // Fallback to original
    }
};
