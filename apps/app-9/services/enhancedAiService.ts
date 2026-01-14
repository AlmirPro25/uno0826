// Enhanced AI Service - Integração com múltiplos providers
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { multiAI, AI_PROVIDERS, type AIProvider } from './multiAiService';
import type { GeminiResponse, UICode, SimulationFile } from '../types';

// Schema de resposta para todos os providers
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    pythonCode: {
      type: Type.STRING,
      description: "O código Python completo para construir e treinar o modelo de rede neural usando TensorFlow/Keras.",
    },
    explanation: {
      type: Type.STRING,
      description: "Uma explicação detalhada do código, da arquitetura e de como ele funciona. Formate-o usando markdown.",
    },
    architecture: {
      type: Type.OBJECT,
      properties: {
        layers: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "O nome exclusivo da camada." },
              type: { type: Type.STRING, description: "O tipo de camada (por exemplo, 'Dense', 'Conv2D', 'Input')." },
              inputs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Lista de nomes de camadas de entrada." },
              neurons: { type: Type.INTEGER, description: "Número de neurônios (para camadas Dense)." },
              shape: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Forma da saída da camada." },
              activation: { type: Type.STRING, description: "Função de ativação usada." },
              rate: { type: Type.NUMBER, description: "Taxa de dropout (se aplicável)." },
              filters: { type: Type.INTEGER, description: "Número de filtros (para camadas convolucionais)." },
              kernel_size: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Tamanho do kernel." },
              pool_size: { type: Type.ARRAY, items: { type: Type.INTEGER }, description: "Tamanho do pool." },
              max_tokens: { type: Type.INTEGER, description: "Tamanho máximo do vocabulário." },
              output_dim: { type: Type.INTEGER, description: "Dimensão de saída do embedding." },
              output_sequence_length: { type: Type.INTEGER, description: "Comprimento da sequência de saída." }
            },
            required: ["name", "type", "inputs"]
          }
        }
      },
      required: ["layers"]
    }
  },
  required: ["pythonCode", "explanation", "architecture"]
};

// Prompt base para todos os providers
const BASE_SYSTEM_PROMPT = `Você é um especialista em redes neurais e deep learning. Sua tarefa é gerar código Python completo usando TensorFlow/Keras para construir e treinar redes neurais.

INSTRUÇÕES IMPORTANTES:
1. Sempre inclua imports necessários
2. Use dados sintéticos se não especificado
3. Inclua compilação e treinamento do modelo
4. Forneça código executável e completo
5. Explique cada parte da arquitetura
6. Use boas práticas de ML

FORMATO DE RESPOSTA:
- pythonCode: Código Python completo e executável
- explanation: Explicação detalhada em markdown
- architecture: Estrutura JSON das camadas da rede

Responda SEMPRE em português brasileiro.`;

class EnhancedAIService {
  private currentProvider: AIProvider = AI_PROVIDERS.GEMINI;
  private geminiAI: GoogleGenAI;

  constructor() {
    this.geminiAI = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  // Define o provider ativo
  setProvider(provider: AIProvider) {
    this.currentProvider = provider;
  }

  // Obtém o provider atual
  getCurrentProvider(): AIProvider {
    return this.currentProvider;
  }

  // Envia mensagem usando o provider atual
  async sendMessage(prompt: string): Promise<GeminiResponse> {
    const fullPrompt = `${BASE_SYSTEM_PROMPT}\n\n${prompt}`;

    try {
      if (this.currentProvider === AI_PROVIDERS.GEMINI) {
        return await this.sendToGemini(fullPrompt);
      } else {
        return await this.sendToOtherProvider(fullPrompt);
      }
    } catch (error) {
      console.error(`Erro no provider ${this.currentProvider}:`, error);
      
      // Fallback para Gemini se outro provider falhar
      if (this.currentProvider !== AI_PROVIDERS.GEMINI) {
        console.log('Tentando fallback para Gemini...');
        return await this.sendToGemini(fullPrompt);
      }
      
      throw error;
    }
  }

  // Envia para Gemini (método original)
  private async sendToGemini(prompt: string): Promise<GeminiResponse> {
    const model = this.geminiAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    try {
      return JSON.parse(text) as GeminiResponse;
    } catch (parseError) {
      console.error('Erro ao parsear resposta do Gemini:', parseError);
      throw new Error('Resposta inválida do Gemini');
    }
  }

  // Envia para outros providers
  private async sendToOtherProvider(prompt: string): Promise<GeminiResponse> {
    const enhancedPrompt = `${prompt}

IMPORTANTE: Responda EXATAMENTE no formato JSON abaixo, sem texto adicional:

{
  "pythonCode": "código python completo aqui",
  "explanation": "explicação em markdown aqui",
  "architecture": {
    "layers": [
      {
        "name": "nome_da_camada",
        "type": "tipo_da_camada",
        "inputs": ["camadas_de_entrada"],
        "neurons": numero_de_neuronios,
        "shape": [formato_da_saida],
        "activation": "funcao_de_ativacao"
      }
    ]
  }
}`;

    const response = await multiAI.sendMessage(this.currentProvider, enhancedPrompt);
    
    try {
      // Tenta extrair JSON da resposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Resposta não contém JSON válido');
      }
      
      const parsed = JSON.parse(jsonMatch[0]) as GeminiResponse;
      
      // Valida se tem os campos obrigatórios
      if (!parsed.pythonCode || !parsed.explanation || !parsed.architecture) {
        throw new Error('Resposta incompleta do provider');
      }
      
      return parsed;
    } catch (parseError) {
      console.error('Erro ao parsear resposta do provider:', parseError);
      
      // Se não conseguir parsear, cria uma resposta básica
      return this.createFallbackResponse(response);
    }
  }

  // Cria resposta de fallback quando parsing falha
  private createFallbackResponse(rawResponse: string): GeminiResponse {
    return {
      pythonCode: `# Código gerado pelo ${this.currentProvider.toUpperCase()}
# Resposta original não pôde ser parseada corretamente

import tensorflow as tf
from tensorflow import keras
import numpy as np

# Código básico de rede neural
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(10,)),
    keras.layers.Dense(32, activation='relu'),
    keras.layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

# Dados sintéticos para demonstração
X = np.random.random((1000, 10))
y = np.random.randint(2, size=(1000, 1))

model.fit(X, y, epochs=10, batch_size=32, validation_split=0.2)

print("Modelo treinado com sucesso!")`,
      
      explanation: `# Resposta do ${this.currentProvider.toUpperCase()}

⚠️ **Nota**: A resposta original não pôde ser parseada corretamente. Aqui está o conteúdo bruto:

\`\`\`
${rawResponse}
\`\`\`

## Código de Fallback

Foi gerado um código básico de rede neural como fallback. Para melhores resultados, considere:

1. Verificar a configuração da API key
2. Testar com prompts mais simples
3. Usar outro provider como alternativa`,

      architecture: {
        layers: [
          {
            name: "input_layer",
            type: "Dense",
            inputs: [],
            neurons: 64,
            shape: [64],
            activation: "relu"
          },
          {
            name: "hidden_layer",
            type: "Dense", 
            inputs: ["input_layer"],
            neurons: 32,
            shape: [32],
            activation: "relu"
          },
          {
            name: "output_layer",
            type: "Dense",
            inputs: ["hidden_layer"], 
            neurons: 1,
            shape: [1],
            activation: "sigmoid"
          }
        ]
      }
    };
  }

  // Inicia sessão de chat (compatibilidade com código existente)
  startChatSession(model?: string): Chat | null {
    if (this.currentProvider === AI_PROVIDERS.GEMINI) {
      const geminiModel = this.geminiAI.getGenerativeModel({
        model: model || "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });
      return geminiModel.startChat();
    }
    
    // Para outros providers, retorna null (não suportam chat contínuo)
    return null;
  }

  // Envia mensagem para chat (compatibilidade)
  async sendMessageToChat(chat: Chat | null, message: string): Promise<GeminiResponse> {
    if (chat && this.currentProvider === AI_PROVIDERS.GEMINI) {
      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();
      return JSON.parse(text) as GeminiResponse;
    }
    
    // Para outros providers, usa sendMessage normal
    return await this.sendMessage(message);
  }

  // Lista providers disponíveis
  getAvailableProviders(): AIProvider[] {
    return multiAI.getConfiguredProviders();
  }

  // Testa se provider está funcionando
  async testProvider(provider: AIProvider): Promise<boolean> {
    try {
      const oldProvider = this.currentProvider;
      this.setProvider(provider);
      
      const response = await this.sendMessage('Crie uma rede neural simples com 2 camadas Dense');
      const isValid = response.pythonCode && response.architecture && response.architecture.layers.length > 0;
      
      this.setProvider(oldProvider);
      return isValid;
    } catch (error) {
      return false;
    }
  }
}

// Instância global do serviço aprimorado
export const enhancedAI = new EnhancedAIService();

// Funções de conveniência (compatibilidade com código existente)
export const startChatSession = (model?: string) => enhancedAI.startChatSession(model);
export const sendMessageToChat = (chat: Chat | null, message: string) => enhancedAI.sendMessageToChat(chat, message);
export const sendMessage = (message: string) => enhancedAI.sendMessage(message);

// Novas funções para múltiplos providers
export const setAIProvider = (provider: AIProvider) => enhancedAI.setProvider(provider);
export const getCurrentProvider = () => enhancedAI.getCurrentProvider();
export const getAvailableProviders = () => enhancedAI.getAvailableProviders();
export const testAIProvider = (provider: AIProvider) => enhancedAI.testProvider(provider);

// Função para traduzir para JS (mantida para compatibilidade)
export const translatePythonToJs = async (pythonCode: string, explanation: string, originalPrompt: string): Promise<string> => {
  const prompt = `Traduza este código Python de rede neural para TensorFlow.js:

${pythonCode}

Contexto original: ${originalPrompt}

Forneça apenas o código JavaScript/TensorFlow.js equivalente, completo e executável.`;

  const response = await enhancedAI.sendMessage(prompt);
  return response.pythonCode; // Reutiliza o campo pythonCode para o JS
};
