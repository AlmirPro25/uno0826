// Serviço de IA - MCC-01 Medical Cognitive Core
// Usando Gemini Robotics (melhor para visão) e Gemini Live (tempo real)
import { TriageInput, TriageOutput, RiskLevel } from '@/types/ai';

// Modelos do Gemini
const MODELS = {
  ROBOTICS: 'gemini-robotics-er-1.5-preview', // Melhor para visão e análise
  LIVE: 'gemini-2.5-flash-native-audio-preview-12-2025', // Para conversa em tempo real
  FLASH: 'gemini-2.5-flash', // Fallback rápido
};

// Pegar API key (prioridade: localStorage > env)
function getApiKey(): string | null {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('gemini_api_key');
    if (userKey) return userKey;
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
}

// Salvar API key do usuário
export function setUserApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', key);
  }
}

// Remover API key do usuário
export function clearUserApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gemini_api_key');
  }
}

// Verificar se tem API key configurada
export function hasApiKey(): boolean {
  return !!getApiKey();
}

// Verificar se é key do usuário ou do sistema
export function isUserApiKey(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('gemini_api_key');
  }
  return false;
}

const SYSTEM_INSTRUCTION = `
Você é o MCC-01 (Medical Cognitive Core), um agente avançado de suporte clínico.
Seu objetivo é ORGANIZAR dados clínicos, CLASSIFICAR risco e APOIAR a decisão médica.
VOCÊ NÃO DIAGNOSTICA. VOCÊ NÃO PRESCREVE.

REGRAS OBRIGATÓRIAS:
1. **Princípio Conservador**: Sempre assuma o pior cenário até prova em contrário.
2. **Gatilhos de Emergência**: Se QUALQUER um dos seguintes estiver presente, risk_level DEVE ser 'high':
   - Dor torácica / Dor no peito
   - Dispneia / Falta de ar
   - Déficit neurológico / Fala arrastada / Face caída
   - Sangramento ativo
   - Ideação suicida
   - Trauma grave
3. **Idioma**: Responda em Português (PT-BR).
4. **Estrutura**: O resumo deve ser técnico (HDA - História da Doença Atual).
5. **Visão**: Se imagens forem fornecidas, analise-as para sinais clínicos.

Sua saída deve ser JSON válido com estes campos:
- summary: string (resumo clínico)
- risk_level: "low" | "medium" | "high"
- risk_reasoning: string (justificativa)
- hypotheses: string[] (diagnóstico diferencial)
- suggested_exams: string[] (exames recomendados)
- immediate_actions: string[] (conduta inicial)
- disclaimer: string (aviso de segurança)
`;

export async function analyzeClinicalCase(input: TriageInput): Promise<TriageOutput> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return simulateAnalysis(input);
  }

  try {
    const parts: any[] = [];
    
    // Adicionar texto
    let textPrompt = `Analisar o seguinte caso clínico:\n\nQueixa/Relato: ${input.text}\n`;
    if (input.context) {
      if (input.context.age) textPrompt += `Idade: ${input.context.age}\n`;
      if (input.context.history) textPrompt += `Histórico: ${input.context.history}\n`;
    }
    parts.push({ text: textPrompt });

    // Adicionar imagens se houver
    for (const base64Image of input.images) {
      const match = base64Image.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    // Usar modelo Robotics para análise com visão
    const model = input.images.length > 0 ? MODELS.ROBOTICS : MODELS.FLASH;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro Gemini:', errorData);
      throw new Error('Falha na API do Gemini');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Resposta vazia do Gemini');
    }

    return JSON.parse(text) as TriageOutput;
  } catch (error) {
    console.error('Erro na análise:', error);
    return simulateAnalysis(input);
  }
}

// Simulação para quando não tem API key ou erro
function simulateAnalysis(input: TriageInput): TriageOutput {
  const text = input.text.toLowerCase();
  
  const isEmergency = 
    text.includes('dor no peito') ||
    text.includes('dor torácica') ||
    text.includes('falta de ar') ||
    text.includes('dispneia') ||
    text.includes('sangramento') ||
    text.includes('desmaio') ||
    text.includes('convulsão') ||
    text.includes('suicid');

  const isMedium = 
    text.includes('febre') ||
    text.includes('dor forte') ||
    text.includes('vômito') ||
    text.includes('tontura') ||
    text.includes('dor de cabeça');

  let risk_level: RiskLevel = RiskLevel.LOW;
  let risk_reasoning = 'Sintomas leves, sem sinais de alarme identificados.';

  if (isEmergency) {
    risk_level = RiskLevel.HIGH;
    risk_reasoning = 'ATENÇÃO: Sintomas sugestivos de emergência médica identificados. Procure atendimento imediato.';
  } else if (isMedium) {
    risk_level = RiskLevel.MEDIUM;
    risk_reasoning = 'Sintomas moderados que requerem avaliação médica em breve.';
  }

  return {
    summary: `Paciente ${input.context?.age || 'adulto'} apresenta: ${input.text}. ${input.context?.history ? `Histórico relevante: ${input.context.history}.` : 'Sem histórico informado.'}`,
    risk_level,
    risk_reasoning,
    hypotheses: [
      'Hipótese 1 - A ser avaliada pelo médico',
      'Hipótese 2 - Diagnóstico diferencial pendente',
      'Hipótese 3 - Necessita exames complementares'
    ],
    suggested_exams: [
      'Hemograma completo',
      'Exames de imagem conforme avaliação clínica',
      'Outros exames a critério médico'
    ],
    immediate_actions: [
      'Avaliação médica presencial recomendada',
      'Monitorar sinais vitais',
      'Retornar se houver piora dos sintomas'
    ],
    disclaimer: '⚠️ MODO SIMULAÇÃO - Configure sua API Key do Gemini para análise real. Este é um sistema de apoio à decisão clínica (MCC-01). NÃO substitui avaliação médica profissional.'
  };
}

// Consulta à base de conhecimento médico
export async function queryMedicalKnowledge(query: string): Promise<string> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return '⚠️ Configure sua API Key do Gemini para usar a base de conhecimento médico.';
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.FLASH}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Responda esta pergunta médica de forma profissional em português brasileiro: ${query}` }] }],
          generationConfig: { temperature: 0.5 }
        })
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta disponível.';
  } catch (error) {
    console.error('Erro na consulta:', error);
    return 'Erro ao consultar base de conhecimento.';
  }
}
