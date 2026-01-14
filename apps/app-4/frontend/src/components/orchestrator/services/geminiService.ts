import { GoogleGenAI, Type } from "@google/genai";
import { Paciente, Medico, MensagemChat, ArquivoAnexo } from "../types";

// Inicialização segura
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const thinkingModel = 'gemini-3-pro-preview';
const fastModel = 'gemini-2.5-flash';

/**
 * Cérebro de Match: Analisa a "Pasta Viva" e uma lista REAL de candidatos fornecida pelo sistema.
 * Não depende mais de mocks internos.
 */
export const realizarMatchInteligente = async (
  paciente: Paciente,
  candidatosDisponiveis: Medico[]
): Promise<{ razao: string, medicosIds: string[] }> => {

  // Se não houver candidatos, falha rápido (fail-fast)
  if (!candidatosDisponiveis || candidatosDisponiveis.length === 0) {
    return {
      razao: "Indisponibilidade crítica de rede: Nenhum médico online no momento.",
      medicosIds: []
    };
  }

  const prompt = `
    ATUE COMO: Sistema Neural de Alocação Médica (SNDT Core).
    
    DADOS DO PACIENTE (PASTA VIVA):
    Nome: ${paciente.nome} | Idade: ${paciente.idade}
    Queixa: ${paciente.queixaPrincipal}
    Histórico: ${paciente.historico.join(', ')}
    Telemetria (Live): FC ${paciente.ultimaTelemetria.fc}, PA ${paciente.ultimaTelemetria.pa}, Sat ${paciente.ultimaTelemetria.spo2}%.
    
    CANDIDATOS DISPONÍVEIS NA REDE:
    ${JSON.stringify(candidatosDisponiveis.map(m => ({ id: m.id, nome: m.nome, especialidade: m.especialidade, tags: m.tags })))}

    MISSÃO CRÍTICA:
    1. Analise a gravidade clínica (Triagem Manchester Lógica).
    2. Realize o "Match" cruzando a necessidade clínica com a especialidade e "tags" de competência dos médicos.
    3. Selecione no MÁXIMO 2 médicos ideais.
    4. Gere uma justificativa técnica e concisa para o Gestor Médico.
    
    Retorne JSON estrito.
  `;

  try {
    const response = await ai.models.generateContent({
      model: thinkingModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            razao: { type: Type.STRING },
            medicosIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        },
        thinkingConfig: { thinkingBudget: 2048 }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta do núcleo neural.");
    return JSON.parse(text);
  } catch (error) {
    console.error("SNDT Error [Match]:", error);
    // Fallback de segurança: retornar lista vazia para tratamento manual
    return { razao: "Erro na inferência neural. Acionando protocolo manual.", medicosIds: [] };
  }
};

/**
 * Copiloto Clínico Multimodal
 * Agora aceita MÚLTIPLOS anexos (Imagens, Áudio) para análise.
 */
export const enviarMensagemCopiloto = async (
  historicoChat: MensagemChat[],
  novaMensagem: string,
  contextoPaciente: Paciente,
  anexos?: ArquivoAnexo[]
): Promise<string> => {

  const systemInstruction = `
    IDENTIDADE: Você é o Copiloto Clínico do SNDT (Versão Multimodal).
    
    CAPACIDADES VISUAIS E AUDITIVAS:
    - Você pode ver exames (RX, ECG, Fotos de lesões) e ouvir áudios do médico.
    - Se receber uma imagem de ECG, analise o ritmo e segmento ST.
    - Se receber uma foto dermatológica, descreva a lesão (ABCDE).
    
    DIRETRIZES:
    1. SEGURANÇA: Jamais sugira dosagens de medicamentos controlados sem disclaimer.
    2. CONTEXTO: Você tem acesso total à telemetria. Se a FC ou PA estiverem instáveis, priorize isso.
    3. TOM: Profissional, conciso, médico-para-médico.
    
    DADOS VIVOS:
    ${JSON.stringify(contextoPaciente)}
  `;

  try {
    // Reconstrói o histórico considerando partes multimídia anteriores
    const chatHistory = historicoChat.map(msg => {
      const parts: any[] = [{ text: msg.conteudo }];

      if (msg.anexos && msg.anexos.length > 0) {
        msg.anexos.forEach(anexo => {
          parts.push({
            inlineData: {
              mimeType: anexo.mimeType,
              data: anexo.dadosBase64
            }
          });
        });
      }

      return {
        role: msg.remetente === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    const chat = ai.chats.create({
      model: fastModel,
      history: chatHistory,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2
      }
    });

    // Prepara a mensagem atual (Multi-Part Content)
    let messageContent: any[] = [{ text: novaMensagem || "Analise os anexos enviados." }];

    if (anexos && anexos.length > 0) {
      anexos.forEach(anexo => {
        messageContent.push({
          inlineData: {
            mimeType: anexo.mimeType,
            data: anexo.dadosBase64
          }
        });
      });
    }

    const result = await chat.sendMessage({ message: messageContent });
    return result.text || "Sem dados.";
  } catch (error) {
    console.error("SNDT Error [Chat]:", error);
    return "Erro de conexão com o sistema central multimídia.";
  }
};

/**
 * Geração de Relatório de Alta / Encerramento (SOAP)
 */
export const gerarRelatorioClinico = async (
  paciente: Paciente,
  historicoChat: MensagemChat[]
): Promise<{ s: string, o: string, a: string, p: string, resumoGeral: string }> => {

  const prompt = `
        TAREFA: Gerar Prontuário Médico Estruturado (Método SOAP).
        
        PACIENTE: ${paciente.nome} (${paciente.idade} anos).
        QUEIXA: ${paciente.queixaPrincipal}
        
        HISTÓRICO DA CONSULTA (CHAT TRANSCRIPT):
        ${historicoChat.map(m => {
    const anexoInfo = m.anexos && m.anexos.length > 0
      ? `[${m.anexos.length} ANEXOS ENVIADOS]`
      : '';
    return `${m.remetente.toUpperCase()}: ${m.conteudo} ${anexoInfo}`;
  }).join('\n')}
        
        TELEMETRIA FINAL:
        FC: ${paciente.ultimaTelemetria.fc}, PA: ${paciente.ultimaTelemetria.pa}, SPO2: ${paciente.ultimaTelemetria.spo2}%
        
        INSTRUÇÕES:
        - Analise toda a conversa entre o Médico (User) e o Copiloto (AI).
        - Se houve envio de imagens (exames), inclua a interpretação feita na seção Objetiva.
        - Extraia as informações relevantes para preencher o SOAP.
        
        SAÍDA JSON OBRIGATÓRIA:
        {
            "s": "Subjetivo (Sintomas relatados)",
            "o": "Objetivo (Sinais vitais, exames citados)",
            "a": "Avaliação (Hipóteses diagnósticas)",
            "p": "Plano (Conduta, medicamentos, retornos)",
            "resumoGeral": "Um parágrafo resumindo o atendimento para o paciente."
        }
    `;

  try {
    const response = await ai.models.generateContent({
      model: thinkingModel, // Usamos o modelo mais inteligente para gerar documentos oficiais
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            s: { type: Type.STRING },
            o: { type: Type.STRING },
            a: { type: Type.STRING },
            p: { type: Type.STRING },
            resumoGeral: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Falha na geração do relatório.");
    return JSON.parse(text);

  } catch (error) {
    console.error("Erro SOAP:", error);
    return {
      s: "Não foi possível extrair.",
      o: "Dados de telemetria preservados no sistema.",
      a: "Revisão manual necessária.",
      p: "Encaminhar para avaliação presencial se necessário.",
      resumoGeral: "Erro na geração automática do documento."
    };
  }
};