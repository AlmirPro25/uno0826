/**
 * LIVE AGENT COM FUNCTION CALLING
 * 
 * Usa o Function Calling nativo do Gemini para executar ferramentas
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { executorService } from './executorService';
import { visionService } from './visionService';
import { roboticsVisionService } from './roboticsVisionService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Definição das ferramentas para o Gemini
const tools = [
  {
    functionDeclarations: [
      {
        name: 'move_mouse',
        description: 'Move o cursor do mouse para coordenadas específicas na tela',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            x: {
              type: 'NUMBER' as const,
              description: 'Coordenada X (horizontal) na tela'
            },
            y: {
              type: 'NUMBER' as const,
              description: 'Coordenada Y (vertical) na tela'
            }
          },
          required: ['x', 'y']
        }
      },
      {
        name: 'click_mouse',
        description: 'Clica o mouse na posição atual ou em coordenadas específicas',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            button: {
              type: 'STRING' as const,
              description: 'Botão do mouse: left, right ou middle',
              enum: ['left', 'right', 'middle']
            },
            x: {
              type: 'NUMBER' as const,
              description: 'Coordenada X (opcional)'
            },
            y: {
              type: 'NUMBER' as const,
              description: 'Coordenada Y (opcional)'
            }
          },
          required: []
        }
      },
      {
        name: 'type_text',
        description: 'Digita texto no campo atualmente focado',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            text: {
              type: 'STRING' as const,
              description: 'Texto a ser digitado'
            }
          },
          required: ['text']
        }
      },
      {
        name: 'press_key',
        description: 'Pressiona uma tecla especial (enter, tab, esc, etc)',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            key: {
              type: 'STRING' as const,
              description: 'Nome da tecla: enter, tab, esc, space, backspace, delete, etc'
            }
          },
          required: ['key']
        }
      },
      {
        name: 'hotkey',
        description: 'Executa combinação de teclas (ctrl+c, alt+tab, win+r, etc)',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            keys: {
              type: 'ARRAY' as const,
              description: 'Array de teclas da combinação. Ex: ["ctrl", "c"] ou ["win", "r"]',
              items: {
                type: 'STRING' as const
              }
            }
          },
          required: ['keys']
        }
      },
      {
        name: 'scroll',
        description: 'Rola a página para cima ou para baixo',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            amount: {
              type: 'NUMBER' as const,
              description: 'Quantidade de scroll. Positivo = baixo, Negativo = cima. Ex: 300 ou -300'
            }
          },
          required: ['amount']
        }
      },
      {
        name: 'open_application',
        description: 'Abre um aplicativo ou URL usando Win+R',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            command: {
              type: 'STRING' as const,
              description: 'Comando ou URL. Ex: "chrome youtube.com" ou "notepad"'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'analyze_screen',
        description: 'Analisa o que está na tela usando visão computacional',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            query: {
              type: 'STRING' as const,
              description: 'Pergunta específica sobre a tela (opcional)'
            }
          },
          required: []
        }
      },
      {
        name: 'find_and_click',
        description: 'Encontra e clica em um elemento visual na tela (botão, ícone, texto). Usa visão computacional para localizar o elemento.',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            target: {
              type: 'STRING' as const,
              description: 'Descrição do elemento a clicar. Ex: "botão OK", "ícone do YouTube", "primeiro vídeo", "botão de configurações"'
            }
          },
          required: ['target']
        }
      },
      {
        name: 'find_elements',
        description: 'Encontra todos os elementos visuais de um tipo na tela (botões, ícones, links, etc)',
        parameters: {
          type: 'OBJECT' as const,
          properties: {
            target: {
              type: 'STRING' as const,
              description: 'Tipo de elementos a encontrar. Ex: "botões", "ícones", "links", "vídeos"'
            },
            max_items: {
              type: 'NUMBER' as const,
              description: 'Número máximo de elementos a retornar (padrão: 10)'
            }
          },
          required: ['target']
        }
      }
    ]
  }
];

// Modelo com function calling
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash'
} as any);

/**
 * Executa uma função chamada pelo Gemini
 */
async function executeFunction(functionCall: any): Promise<any> {
  const { name, args } = functionCall;
  
  console.log(`🔧 Executando função: ${name}`);
  console.log(`📦 Argumentos:`, args);

  try {
    switch (name) {
      case 'move_mouse':
        return await executorService.moveMouse(args.x, args.y);
      
      case 'click_mouse':
        return await executorService.click(args.button || 'left', args.x, args.y);
      
      case 'type_text':
        return await executorService.type(args.text);
      
      case 'press_key':
        return await executorService.press(args.key);
      
      case 'hotkey':
        return await executorService.hotkey(...args.keys);
      
      case 'scroll':
        return await executorService.scroll(args.amount);
      
      case 'open_application':
        // Abre Win+R, digita comando e pressiona Enter
        await executorService.hotkey('win', 'r');
        await new Promise(resolve => setTimeout(resolve, 500));
        await executorService.type(args.command);
        await executorService.press('enter');
        return { status: 'ok', message: `Abrindo: ${args.command}` };
      
      case 'analyze_screen':
        return await visionService.analyzeScreen(args.query);
      
      case 'find_and_click':
        // Usa Robotics Vision para encontrar e clicar no elemento
        const clickResult = await roboticsVisionService.findAndClick(
          args.target,
          '2D bounding boxes',
          false
        );
        
        if (clickResult.success) {
          return {
            status: 'ok',
            message: `Clicado em "${clickResult.label}" na posição (${clickResult.clicked?.x}, ${clickResult.clicked?.y})`,
            element: clickResult.label,
            coordinates: clickResult.clicked
          };
        } else {
          return {
            status: 'fail',
            message: `Não encontrei "${args.target}" na tela`,
            suggestion: 'Tente ser mais específico ou verifique se o elemento está visível'
          };
        }
      
      case 'find_elements':
        // Detecta elementos visuais na tela
        const maxItems = args.max_items || 10;
        const elements = await roboticsVisionService.detect2DBoundingBoxes(
          args.target,
          maxItems,
          false
        );
        
        if (elements.length > 0) {
          return {
            status: 'ok',
            count: elements.length,
            elements: elements.map((el: any) => ({
              label: el.label,
              position: { x: el.x, y: el.y },
              size: { width: el.width, height: el.height }
            })),
            message: `Encontrei ${elements.length} elemento(s): ${elements.map((e: any) => e.label).join(', ')}`
          };
        } else {
          return {
            status: 'fail',
            count: 0,
            elements: [],
            message: `Não encontrei "${args.target}" na tela`
          };
        }
      
      default:
        return { error: `Função desconhecida: ${name}` };
    }
  } catch (error: any) {
    console.error(`❌ Erro ao executar ${name}:`, error.message);
    return { error: error.message };
  }
}

/**
 * Processa comando do usuário com function calling
 */
export async function processCommandWithTools(userMessage: string): Promise<{
  success: boolean;
  response: string;
  toolsUsed: string[];
}> {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 LIVE AGENT COM FUNCTION CALLING');
  console.log('='.repeat(70));
  console.log(`👤 Usuário: "${userMessage}"`);
  console.log('─'.repeat(70));

  const toolsUsed: string[] = [];
  
  try {
    // Verifica se executor está conectado
    if (!executorService.connected) {
      return {
        success: false,
        response: '❌ Executor não está conectado. Inicie o módulo Python primeiro.',
        toolsUsed: []
      };
    }

    // Inicia chat com o modelo (com tools)
    const chat = model.startChat({
      history: [],
      tools
    } as any);

    // Envia mensagem do usuário
    let result = await chat.sendMessage(userMessage);
    let response: any = result.response;

    // Loop de function calling
    while (response.functionCalls && response.functionCalls().length > 0) {
      const calls = response.functionCalls();
      console.log(`\n🔧 Gemini quer usar ${calls.length} ferramenta(s):`);
      
      const functionResponses = [];
      
      for (const functionCall of calls) {
        console.log(`   → ${functionCall.name}(${JSON.stringify(functionCall.args)})`);
        toolsUsed.push(functionCall.name);
        
        // Executa a função
        const functionResult = await executeFunction(functionCall);
        
        functionResponses.push({
          functionResponse: {
            name: functionCall.name,
            response: functionResult
          }
        });
        
        console.log(`   ✅ Resultado:`, functionResult);
      }
      
      // Envia resultados de volta para o Gemini
      result = await chat.sendMessage(functionResponses as any);
      response = result.response;
    }

    // Resposta final do Gemini
    const finalResponse = response.text();
    
    console.log('─'.repeat(70));
    console.log(`✅ Resposta final: "${finalResponse}"`);
    console.log(`🔧 Ferramentas usadas: ${toolsUsed.join(', ') || 'nenhuma'}`);
    console.log('='.repeat(70) + '\n');

    return {
      success: true,
      response: finalResponse,
      toolsUsed
    };

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    console.log('='.repeat(70) + '\n');
    
    return {
      success: false,
      response: `❌ Erro: ${error.message}`,
      toolsUsed
    };
  }
}

/**
 * Serviço exportado
 */
export const liveAgentWithTools = {
  processCommand: processCommandWithTools
};
