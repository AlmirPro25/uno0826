/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║               🤖 GEMINI AI ASSISTANT - ATENDENTE DE SAÚDE 🤖                ║
 * ║                                                                              ║
 * ║     Powered by Google Gemini 2.0 Flash (1000+ free API calls/day)           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// System prompt for the healthcare assistant
const SYSTEM_PROMPT = `Você é a ARIA (Assistente de Relacionamento Inteligente em Atendimento), a assistente virtual do MediSync, uma plataforma de telemedicina.

🎯 SUA MISSÃO:
- Ajudar pacientes a agendar consultas
- Fornecer informações sobre médicos e especialidades
- Responder dúvidas sobre a plataforma
- Orientar sobre procedimentos
- NUNCA dar diagnósticos ou prescrições médicas

📋 REGRAS IMPORTANTES:
1. Seja sempre empática, acolhedora e profissional
2. Use linguagem clara e acessível
3. Para urgências, oriente a procurar emergência (SAMU 192)
4. Não colete dados sensíveis (cartão de crédito, senhas)
5. Mantenha respostas concisas (máximo 500 caracteres)
6. Use emojis moderadamente para tornar a conversa mais humana
7. Se não souber algo, diga que vai verificar ou peça para entrar em contato pelo site

🏥 SERVIÇOS DISPONÍVEIS:
- Consultas por vídeo chamada
- Agendamento online 24h
- Prontuário eletrônico
- Emissão de receitas digitais
- Atestados médicos

👨‍⚕️ ESPECIALIDADES:
- Clínica Geral
- Cardiologia
- Dermatologia
- Psiquiatria
- Pediatria
- Ginecologia
- Ortopedia
- E outras...

💬 COMANDOS ESPECIAIS (se o usuário digitar):
- "AGENDAR" → Inicie o fluxo de agendamento
- "CANCELAR" → Ajude a cancelar uma consulta
- "FALAR COM HUMANO" → Informe que um atendente entrará em contato
- "HORARIOS" → Liste horários disponíveis

📍 INFORMAÇÕES DE CONTATO:
- Site: medisync.app
- Email: contato@medisync.app
- Horário: 24h por WhatsApp, atendimento humano das 8h às 18h`;

export class GeminiAssistant {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.genAI = null;
        this.model = null;
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';

        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            // Using Gemini 2.0 Flash - 1000+ free calls/day
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-exp',
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 500,
                }
            });
            console.log('🤖 Gemini Assistant inicializado com modelo gemini-2.0-flash-exp');
        } else {
            console.warn('⚠️ GEMINI_API_KEY não configurada - Assistente IA desativado');
        }
    }

    /**
     * Main chat function - processes user messages and returns AI response
     */
    async chat(userMessage, conversationHistory = [], userPhone = '') {
        if (!this.model) {
            return '⚠️ O assistente IA não está disponível no momento. Por favor, acesse nosso site medisync.app para atendimento.';
        }

        try {
            // Check for special commands first
            const specialResponse = this.handleSpecialCommands(userMessage.toUpperCase().trim());
            if (specialResponse) {
                return specialResponse;
            }

            // Build conversation context
            const conversationContext = this.buildConversationContext(conversationHistory);

            // Create the prompt with system instructions + context + user message
            const fullPrompt = `${SYSTEM_PROMPT}

=== HISTÓRICO DA CONVERSA ===
${conversationContext}

=== MENSAGEM DO USUÁRIO ===
${userMessage}

=== SUA RESPOSTA (máximo 500 caracteres, seja concisa e útil) ===`;

            // Call Gemini API
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            let text = response.text();

            // Ensure response is not too long for WhatsApp
            if (text.length > 1000) {
                text = text.substring(0, 997) + '...';
            }

            return text.trim();

        } catch (error) {
            console.error('❌ Erro no Gemini:', error.message);

            // Handle specific errors
            if (error.message.includes('quota')) {
                return '⚠️ Nosso assistente está muito ocupado. Por favor, tente novamente em alguns minutos ou acesse medisync.app';
            }

            return '⚠️ Desculpe, tive um problema técnico. Por favor, tente novamente ou acesse nosso site medisync.app';
        }
    }

    /**
     * Handle special commands from users
     */
    handleSpecialCommands(message) {
        const commands = {
            'AGENDAR': `📅 *Vamos agendar sua consulta!*

Para agendar, preciso de algumas informações:

1️⃣ Qual especialidade você precisa?
   (Ex: Clínica Geral, Cardiologia, etc.)

2️⃣ Tem preferência de data/horário?

3️⃣ É sua primeira consulta conosco?

_Ou acesse diretamente:_
🔗 medisync.app/agendar`,

            'CANCELAR': `❌ *Cancelamento de Consulta*

Para cancelar sua consulta:

1️⃣ Acesse: medisync.app
2️⃣ Faça login na sua conta
3️⃣ Vá em "Minhas Consultas"
4️⃣ Clique em "Cancelar"

⚠️ Cancelamentos devem ser feitos com pelo menos 2h de antecedência.

_Precisa de ajuda? Digite "FALAR COM HUMANO"_`,

            'FALAR COM HUMANO': `👤 *Atendimento Humano*

Vou transferir você para um atendente!

⏰ Horário de atendimento: 8h às 18h (dias úteis)

📞 Em breve um de nossos atendentes entrará em contato.

_Se for urgente, ligue: (11) 3456-7890_`,

            'HORARIOS': `⏰ *Horários Disponíveis*

Nossas consultas estão disponíveis:

📅 Segunda a Sexta: 7h às 22h
📅 Sábados: 8h às 18h
📅 Domingos: 9h às 14h

🔗 Veja disponibilidade em tempo real:
medisync.app/agendar

_Digite "AGENDAR" para iniciar um agendamento!_`,

            'OI': null,
            'OLA': null,
            'OLAA': null,
            'OLÁ': null,
            'BOM DIA': null,
            'BOA TARDE': null,
            'BOA NOITE': null,
        };

        // Check for greetings (return null to let AI handle it naturally)
        const greetings = ['OI', 'OLA', 'OLAA', 'OLÁ', 'BOM DIA', 'BOA TARDE', 'BOA NOITE', 'E AI', 'HELLO', 'HI'];
        if (greetings.some(g => message.startsWith(g))) {
            return null;
        }

        return commands[message] || null;
    }

    /**
     * Build conversation context from history
     */
    buildConversationContext(history) {
        if (!history || history.length === 0) {
            return '(Início da conversa)';
        }

        return history
            .slice(-6) // Last 6 messages for context
            .map(msg => `${msg.role === 'user' ? '👤 Usuário' : '🤖 ARIA'}: ${msg.content}`)
            .join('\n');
    }

    /**
     * Generate appointment scheduling response with available slots
     */
    async generateSchedulingResponse(specialty, preferredDate) {
        try {
            // Call backend to get available slots
            const response = await axios.get(`${this.backendUrl}/api/appointments/available`, {
                params: { specialty, date: preferredDate }
            });

            if (response.data && response.data.slots && response.data.slots.length > 0) {
                const slots = response.data.slots.slice(0, 5);
                let message = `📅 *Horários Disponíveis para ${specialty}*\n\n`;

                slots.forEach((slot, i) => {
                    message += `${i + 1}️⃣ ${slot.date} às ${slot.time} - Dr(a). ${slot.doctorName}\n`;
                });

                message += `\n_Digite o número para escolher ou acesse medisync.app_`;
                return message;
            }

            return `😔 Não encontrei horários disponíveis para ${specialty} nessa data. Quer tentar outra data?`;

        } catch (error) {
            console.error('Erro ao buscar horários:', error.message);
            return `📅 Para ver horários disponíveis de ${specialty}, acesse:\n🔗 medisync.app/agendar`;
        }
    }

    /**
     * Generate health tips (non-diagnostic)
     */
    async generateHealthTip(topic) {
        if (!this.model) {
            return null;
        }

        try {
            const prompt = `Gere uma dica de saúde GERAL e EDUCATIVA sobre "${topic}". 
            
REGRAS:
- NÃO dê diagnósticos
- NÃO recomende medicamentos específicos
- Seja informativo e preventivo
- Máximo 200 caracteres
- Use 1 emoji no início`;

            const result = await this.model.generateContent(prompt);
            return result.response.text().trim();
        } catch {
            return null;
        }
    }

    /**
     * Analyze user intent for better routing
     */
    async analyzeIntent(message) {
        const intents = {
            SCHEDULING: ['agendar', 'consulta', 'marcar', 'horário', 'disponível'],
            CANCELLATION: ['cancelar', 'desmarcar', 'remarcar'],
            INFORMATION: ['como funciona', 'preço', 'valor', 'quanto custa'],
            EMERGENCY: ['urgente', 'emergência', 'dor forte', 'grave'],
            SUPPORT: ['ajuda', 'problema', 'erro', 'não consigo'],
            GREETING: ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite']
        };

        const lowerMessage = message.toLowerCase();

        for (const [intent, keywords] of Object.entries(intents)) {
            if (keywords.some(kw => lowerMessage.includes(kw))) {
                return intent;
            }
        }

        return 'GENERAL';
    }

    isReady() {
        return this.model !== null;
    }
}
