/**
 * 🔬 AETHER PRIME - Advanced Code Analysis Engine
 * Provides deep code analysis, refactoring suggestions, and intelligent editing
 */

import { GoogleGenAI, Type } from "@google/genai";
import { VirtualFile } from "../types";
import { useStore } from "../store";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// ============================================================================
// 🔍 CODE ANALYSIS
// ============================================================================

export interface CodeAnalysis {
  complexity: {
    cyclomatic: number;
    cognitive: number;
    linesOfCode: number;
    functions: number;
  };
  codeSmells: Array<{
    type: string;
    location: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;
  structure: {
    imports: string[];
    exports: string[];
    components: string[];
    hooks: string[];
  };
  quality: {
    score: number;
    maintainability: string;
    testability: string;
  };
  suggestions: string[];
}

export const analyzeCode = async (
  code: string,
  filePath: string,
  depth: 'quick' | 'normal' | 'deep' = 'normal',
  modelId: string
): Promise<CodeAnalysis> => {
  const ai = getClient();

  const prompt = `
  Analyze this ${filePath} code with ${depth} depth.
  
  CODE:
  ${code.substring(0, 40000)}
  
  Return JSON with:
  - complexity: { cyclomatic, cognitive, linesOfCode, functions }
  - codeSmells: [{ type, location, severity, suggestion }]
  - structure: { imports, exports, components, hooks }
  - quality: { score (0-100), maintainability, testability }
  - suggestions: [actionable improvements]
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
            complexity: {
              type: Type.OBJECT,
              properties: {
                cyclomatic: { type: Type.NUMBER },
                cognitive: { type: Type.NUMBER },
                linesOfCode: { type: Type.NUMBER },
                functions: { type: Type.NUMBER }
              }
            },
            codeSmells: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  location: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                }
              }
            },
            structure: {
              type: Type.OBJECT,
              properties: {
                imports: { type: Type.ARRAY, items: { type: Type.STRING } },
                exports: { type: Type.ARRAY, items: { type: Type.STRING } },
                components: { type: Type.ARRAY, items: { type: Type.STRING } },
                hooks: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            quality: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER },
                maintainability: { type: Type.STRING },
                testability: { type: Type.STRING }
              }
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}") as CodeAnalysis;
  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      complexity: { cyclomatic: 0, cognitive: 0, linesOfCode: 0, functions: 0 },
      codeSmells: [],
      structure: { imports: [], exports: [], components: [], hooks: [] },
      quality: { score: 75, maintainability: "Unknown", testability: "Unknown" },
      suggestions: []
    };
  }
};

// ============================================================================
// 🔗 DEPENDENCY ANALYSIS
// ============================================================================

export interface DependencyGraph {
  file: string;
  imports: Array<{ source: string; specifiers: string[] }>;
  exports: string[];
  dependents: string[];
  dependencies: string[];
  circular: boolean;
}

export const findDependencies = (
  files: VirtualFile[],
  targetPath: string
): DependencyGraph => {
  const graph: DependencyGraph = {
    file: targetPath,
    imports: [],
    exports: [],
    dependents: [],
    dependencies: [],
    circular: false
  };

  const findFile = (nodes: VirtualFile[], path: string): VirtualFile | null => {
    for (const node of nodes) {
      if (node.path === path) return node;
      if (node.children) {
        const found = findFile(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const targetFile = findFile(files, targetPath);
  if (!targetFile || targetFile.isFolder) return graph;

  // Parse imports
  const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(targetFile.content)) !== null) {
    const specifiers = match[1] 
      ? match[1].split(',').map(s => s.trim())
      : [match[2]];
    graph.imports.push({ source: match[3], specifiers });
    graph.dependencies.push(match[3]);
  }

  // Parse exports
  const exportRegex = /export\s+(?:default\s+)?(?:const|function|class|let|var)?\s*(\w+)/g;
  while ((match = exportRegex.exec(targetFile.content)) !== null) {
    graph.exports.push(match[1]);
  }

  return graph;
};

// ============================================================================
// 🐛 ISSUE DETECTION
// ============================================================================

export interface DetectedIssue {
  type: 'bug' | 'security' | 'performance' | 'accessibility' | 'style';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
  code?: string;
}

export const detectIssues = async (
  code: string,
  filePath: string,
  modelId: string
): Promise<DetectedIssue[]> => {
  const ai = getClient();

  const prompt = `
  Scan this code for issues:
  - Bugs (null refs, race conditions, logic errors)
  - Security (XSS, injection, exposed secrets)
  - Performance (memory leaks, unnecessary renders, heavy computations)
  - Accessibility (missing ARIA, keyboard nav, contrast)
  
  FILE: ${filePath}
  CODE:
  ${code.substring(0, 30000)}
  
  Return JSON array of issues found.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              severity: { type: Type.STRING },
              file: { type: Type.STRING },
              line: { type: Type.NUMBER },
              message: { type: Type.STRING },
              suggestion: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]") as DetectedIssue[];
  } catch {
    return [];
  }
};

// ============================================================================
// 🔧 SMART EDITING
// ============================================================================

export const smartEdit = async (
  code: string,
  filePath: string,
  instruction: string,
  modelId: string
): Promise<string> => {
  const ai = getClient();

  const prompt = `
  You are a precise code editor. Apply this instruction to the code:
  
  INSTRUCTION: ${instruction}
  
  FILE: ${filePath}
  CODE:
  ${code}
  
  Return ONLY the modified code. No explanations. Preserve formatting and style.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt
    });
    
    let result = response.text?.trim() || code;
    // Strip markdown fences
    if (result.startsWith('```')) {
      const match = result.match(/^```\w*\n?([\s\S]*?)\n?```$/);
      if (match) result = match[1];
    }
    return result;
  } catch {
    return code;
  }
};

export const insertCode = (
  code: string,
  line: number,
  newCode: string
): string => {
  const lines = code.split('\n');
  lines.splice(line - 1, 0, newCode);
  return lines.join('\n');
};

export const wrapCode = (
  code: string,
  startLine: number,
  endLine: number,
  wrapper: string
): string => {
  const lines = code.split('\n');
  const toWrap = lines.slice(startLine - 1, endLine).join('\n');
  
  const wrappers: Record<string, (c: string) => string> = {
    'try-catch': (c) => `try {\n  ${c.split('\n').join('\n  ')}\n} catch (error) {\n  console.error(error);\n}`,
    'if': (c) => `if (condition) {\n  ${c.split('\n').join('\n  ')}\n}`,
    'async': (c) => `(async () => {\n  ${c.split('\n').join('\n  ')}\n})();`,
    'function': (c) => `function newFunction() {\n  ${c.split('\n').join('\n  ')}\n}`,
    'useEffect': (c) => `useEffect(() => {\n  ${c.split('\n').join('\n  ')}\n}, []);`,
    'useMemo': (c) => `useMemo(() => {\n  ${c.split('\n').join('\n  ')}\n}, []);`
  };

  const wrapped = wrappers[wrapper]?.(toWrap) || toWrap;
  lines.splice(startLine - 1, endLine - startLine + 1, wrapped);
  return lines.join('\n');
};

export const extractFunction = (
  code: string,
  startLine: number,
  endLine: number,
  functionName: string
): string => {
  const lines = code.split('\n');
  const extracted = lines.slice(startLine - 1, endLine).join('\n');
  
  const newFunction = `\nfunction ${functionName}() {\n  ${extracted.split('\n').join('\n  ')}\n}\n`;
  lines.splice(startLine - 1, endLine - startLine + 1, `${functionName}();`);
  
  // Insert function at top of file (after imports)
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('import') && lines[i].trim() !== '') {
      insertIndex = i;
      break;
    }
  }
  lines.splice(insertIndex, 0, newFunction);
  
  return lines.join('\n');
};

export const renameSymbol = (
  code: string,
  oldName: string,
  newName: string
): string => {
  // Smart rename that avoids partial matches
  const regex = new RegExp(`\\b${oldName}\\b`, 'g');
  return code.replace(regex, newName);
};

// ============================================================================
// 🧪 TEST GENERATION
// ============================================================================

export const generateTests = async (
  code: string,
  filePath: string,
  framework: 'jest' | 'vitest' | 'mocha' = 'vitest',
  modelId: string
): Promise<string> => {
  const ai = getClient();

  const prompt = `
  Generate comprehensive unit tests for this code using ${framework}.
  
  FILE: ${filePath}
  CODE:
  ${code.substring(0, 20000)}
  
  Requirements:
  - Test all exported functions/components
  - Include edge cases
  - Use descriptive test names
  - Mock external dependencies
  - Return ONLY the test code
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt
    });
    
    let result = response.text?.trim() || '';
    if (result.startsWith('```')) {
      const match = result.match(/^```\w*\n?([\s\S]*?)\n?```$/);
      if (match) result = match[1];
    }
    return result;
  } catch {
    return `// Test generation failed for ${filePath}`;
  }
};

// ============================================================================
// 🔒 SECURITY SCANNING
// ============================================================================

export interface SecurityIssue {
  type: 'xss' | 'injection' | 'secret' | 'unsafe' | 'dependency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  fix: string;
}

export const securityScan = async (
  code: string,
  filePath: string,
  modelId: string
): Promise<SecurityIssue[]> => {
  const ai = getClient();

  // Quick pattern-based scan first
  const quickIssues: SecurityIssue[] = [];
  
  // Check for exposed secrets
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,
    /token\s*[:=]\s*['"][^'"]+['"]/gi
  ];
  
  secretPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      quickIssues.push({
        type: 'secret',
        severity: 'critical',
        location: filePath,
        description: 'Potential hardcoded secret detected',
        fix: 'Move secrets to environment variables'
      });
    }
  });

  // Check for dangerous patterns
  if (/dangerouslySetInnerHTML/i.test(code)) {
    quickIssues.push({
      type: 'xss',
      severity: 'high',
      location: filePath,
      description: 'dangerouslySetInnerHTML usage detected',
      fix: 'Sanitize HTML content before rendering'
    });
  }

  if (/eval\s*\(/i.test(code)) {
    quickIssues.push({
      type: 'injection',
      severity: 'critical',
      location: filePath,
      description: 'eval() usage detected',
      fix: 'Avoid eval() - use safer alternatives'
    });
  }

  return quickIssues;
};

// ============================================================================
// 📝 DOCUMENTATION GENERATION
// ============================================================================

export const documentCode = async (
  code: string,
  filePath: string,
  modelId: string
): Promise<string> => {
  const ai = getClient();

  const prompt = `
  Add JSDoc/TSDoc comments to all functions, classes, and complex logic in this code.
  
  FILE: ${filePath}
  CODE:
  ${code.substring(0, 25000)}
  
  Requirements:
  - Add @param, @returns, @throws where applicable
  - Add @example for complex functions
  - Keep existing comments
  - Return the FULL code with added documentation
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt
    });
    
    let result = response.text?.trim() || code;
    if (result.startsWith('```')) {
      const match = result.match(/^```\w*\n?([\s\S]*?)\n?```$/);
      if (match) result = match[1];
    }
    return result;
  } catch {
    return code;
  }
};

// ============================================================================
// 📋 PLAN GENERATION
// ============================================================================

export interface ImplementationPlan {
  goal: string;
  steps: Array<{
    order: number;
    description: string;
    files: string[];
    commands?: string[];
  }>;
  estimatedTime: string;
  risks: string[];
}

export const createPlan = async (
  goal: string,
  constraints: string,
  currentFiles: VirtualFile[],
  modelId: string
): Promise<ImplementationPlan> => {
  const ai = getClient();

  const fileList = currentFiles.map(f => f.path).join('\n');

  const prompt = `
  Create a detailed implementation plan for: ${goal}
  ${constraints ? `Constraints: ${constraints}` : ''}
  
  Current project files:
  ${fileList}
  
  Return a step-by-step plan with files to create/modify and commands to run.
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
            goal: { type: Type.STRING },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  order: { type: Type.NUMBER },
                  description: { type: Type.STRING },
                  files: { type: Type.ARRAY, items: { type: Type.STRING } },
                  commands: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            estimatedTime: { type: Type.STRING },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}") as ImplementationPlan;
  } catch {
    return { goal, steps: [], estimatedTime: "Unknown", risks: [] };
  }
};

// ============================================================================
// 🐛 ERROR DEBUGGING
// ============================================================================

export interface DebugResult {
  errorType: string;
  rootCause: string;
  explanation: string;
  fixes: Array<{
    description: string;
    code?: string;
    file?: string;
  }>;
  prevention: string;
}

export const debugError = async (
  error: string,
  context: string,
  relevantCode: string,
  modelId: string
): Promise<DebugResult> => {
  const ai = getClient();

  const prompt = `
  Debug this error:
  
  ERROR: ${error}
  CONTEXT: ${context || 'Not provided'}
  
  RELEVANT CODE:
  ${relevantCode.substring(0, 15000)}
  
  Provide:
  1. Error type classification
  2. Root cause analysis
  3. Clear explanation
  4. Specific fixes with code
  5. Prevention tips
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
            errorType: { type: Type.STRING },
            rootCause: { type: Type.STRING },
            explanation: { type: Type.STRING },
            fixes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  code: { type: Type.STRING },
                  file: { type: Type.STRING }
                }
              }
            },
            prevention: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}") as DebugResult;
  } catch {
    return {
      errorType: "Unknown",
      rootCause: "Analysis failed",
      explanation: error,
      fixes: [],
      prevention: "Review error logs"
    };
  }
};

// ============================================================================
// 💡 REFACTORING SUGGESTIONS
// ============================================================================

export const suggestRefactor = async (
  code: string,
  filePath: string,
  modelId: string
): Promise<string[]> => {
  const ai = getClient();

  const prompt = `
  Analyze this code and suggest specific refactoring improvements:
  
  FILE: ${filePath}
  CODE:
  ${code.substring(0, 20000)}
  
  Focus on:
  - DRY violations
  - Complex functions that should be split
  - Better naming
  - Modern patterns
  - Performance improvements
  
  Return a JSON array of specific, actionable suggestions.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]") as string[];
  } catch {
    return [];
  }
};

// ============================================================================
// 📖 CODE EXPLANATION
// ============================================================================

export const explainCode = async (
  code: string,
  filePath: string,
  startLine?: number,
  endLine?: number,
  modelId?: string
): Promise<string> => {
  const ai = getClient();
  
  let targetCode = code;
  if (startLine && endLine) {
    const lines = code.split('\n');
    targetCode = lines.slice(startLine - 1, endLine).join('\n');
  }

  const prompt = `
  Explain this code in detail:
  
  FILE: ${filePath}
  ${startLine ? `LINES: ${startLine}-${endLine}` : ''}
  
  CODE:
  ${targetCode.substring(0, 15000)}
  
  Provide:
  1. High-level purpose
  2. Step-by-step flow
  3. Key concepts used
  4. Potential gotchas
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId || 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text || "Explanation unavailable";
  } catch {
    return "Failed to generate explanation";
  }
};

// ============================================================================
// ♿ ACCESSIBILITY AUDIT
// ============================================================================

export interface A11yIssue {
  type: string;
  element: string;
  issue: string;
  fix: string;
  wcag: string;
}

export const checkAccessibility = async (
  code: string,
  filePath: string,
  modelId: string
): Promise<A11yIssue[]> => {
  const ai = getClient();

  const prompt = `
  Audit this React component for accessibility issues:
  
  FILE: ${filePath}
  CODE:
  ${code.substring(0, 20000)}
  
  Check for:
  - Missing ARIA labels
  - Keyboard navigation
  - Color contrast issues
  - Focus management
  - Screen reader compatibility
  
  Return JSON array of issues with WCAG references.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              element: { type: Type.STRING },
              issue: { type: Type.STRING },
              fix: { type: Type.STRING },
              wcag: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]") as A11yIssue[];
  } catch {
    return [];
  }
};
