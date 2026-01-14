/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║                    💬 WHATSAPP SERVICE (whatsapp-web.js)                     ║
 * ║                                                                              ║
 * ║     Engenharia reversa do WhatsApp Web para notificações e atendimento      ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';

export class WhatsAppService {
    constructor(geminiAssistant) {
        this.client = null;
        this.qrCode = null;
        this.ready = false;
        this.phoneNumber = null;
        this.geminiAssistant = geminiAssistant;

        // Conversation history per user (for context)
        this.conversations = new Map();
    }

    async initialize() {
        console.log('📱 Inicializando WhatsApp Client...');

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: process.env.SESSION_PATH || './.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            }
        });

        // QR Code Event
        this.client.on('qr', (qr) => {
            this.qrCode = qr;
            console.log('\n📲 ESCANEIE O QR CODE ABAIXO COM O WHATSAPP:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n💡 Ou acesse: http://localhost:3001/api/whatsapp/qr\n');
        });

        // Ready Event
        this.client.on('ready', async () => {
            this.ready = true;
            this.qrCode = null;
            const info = this.client.info;
            this.phoneNumber = info?.wid?.user || 'unknown';
            console.log(`\n✅ WhatsApp conectado! Número: ${this.phoneNumber}\n`);
        });

        // Message Event - AI Assistant
        this.client.on('message', async (message) => {
            await this.handleIncomingMessage(message);
        });

        // Disconnected Event
        this.client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp desconectado:', reason);
            this.ready = false;
        });

        // Authentication Failure
        this.client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação:', msg);
            this.ready = false;
        });

        await this.client.initialize();
    }

    /**
     * Handle incoming messages with Gemini AI
     */
    async handleIncomingMessage(message) {
        // Ignore group messages and status updates
        if (message.from.includes('@g.us') || message.from === 'status@broadcast') {
            return;
        }

        const userPhone = message.from.replace('@c.us', '');
        const userMessage = message.body;

        console.log(`📩 Mensagem de ${userPhone}: ${userMessage}`);

        // Get or create conversation history
        if (!this.conversations.has(userPhone)) {
            this.conversations.set(userPhone, []);
        }
        const history = this.conversations.get(userPhone);

        // Add user message to history
        history.push({ role: 'user', content: userMessage });

        // Keep only last 10 messages for context
        if (history.length > 20) {
            history.splice(0, 2);
        }

        try {
            // Get AI response
            const aiResponse = await this.geminiAssistant.chat(userMessage, history, userPhone);

            // Add AI response to history
            history.push({ role: 'assistant', content: aiResponse });

            // Send response
            await message.reply(aiResponse);
            console.log(`🤖 Resposta enviada para ${userPhone}`);

        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
            await message.reply(
                '⚠️ Desculpe, estou com dificuldades técnicas no momento. ' +
                'Por favor, tente novamente em alguns instantes ou entre em contato pelo nosso site.'
            );
        }
    }

    /**
     * Send notification message
     */
    async sendMessage(phoneNumber, message) {
        if (!this.ready) {
            throw new Error('WhatsApp não está conectado');
        }

        // Format phone number (Brazil format)
        let formattedNumber = phoneNumber.replace(/\D/g, '');
        if (!formattedNumber.startsWith('55')) {
            formattedNumber = '55' + formattedNumber;
        }
        formattedNumber = formattedNumber + '@c.us';

        try {
            // Check if number is registered on WhatsApp
            const isRegistered = await this.client.isRegisteredUser(formattedNumber);
            if (!isRegistered) {
                throw new Error('Número não está registrado no WhatsApp');
            }

            await this.client.sendMessage(formattedNumber, message);
            console.log(`📤 Mensagem enviada para ${phoneNumber}`);
            return true;
        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para ${phoneNumber}:`, error);
            throw error;
        }
    }

    /**
     * Send appointment reminder
     */
    async sendAppointmentReminder(phoneNumber, appointment) {
        const message =
            `🏥 *MediSync - Lembrete de Consulta*

Olá! Lembrete da sua consulta:

📅 *Data:* ${appointment.date}
⏰ *Horário:* ${appointment.time}
👨‍⚕️ *Médico(a):* Dr(a). ${appointment.doctorName}
${appointment.specialty ? `🩺 *Especialidade:* ${appointment.specialty}` : ''}

📍 Acesse sua consulta online pelo link:
${appointment.videoCallUrl || 'https://medisync.app/video-call/' + appointment.id}

_Responda esta mensagem se precisar de ajuda!_

💚 Equipe MediSync`;

        return this.sendMessage(phoneNumber, message);
    }

    /**
     * Send appointment confirmation
     */
    async sendAppointmentConfirmation(phoneNumber, appointment) {
        const message =
            `✅ *MediSync - Consulta Agendada*

Sua consulta foi agendada com sucesso!

📅 *Data:* ${appointment.date}
⏰ *Horário:* ${appointment.time}
👨‍⚕️ *Médico(a):* Dr(a). ${appointment.doctorName}

Você receberá um lembrete antes da consulta.

_Responda "CANCELAR" se precisar cancelar._

💚 Equipe MediSync`;

        return this.sendMessage(phoneNumber, message);
    }

    /**
     * Send verification code (for future 2FA)
     */
    async sendVerificationCode(phoneNumber, code) {
        const message =
            `🔐 *MediSync - Código de Verificação*

Seu código de verificação é:

*${code}*

⚠️ Este código expira em 5 minutos.
❌ Não compartilhe este código com ninguém.

Se você não solicitou este código, ignore esta mensagem.

💚 Equipe MediSync`;

        return this.sendMessage(phoneNumber, message);
    }

    isReady() {
        return this.ready;
    }

    getQRCode() {
        return this.qrCode;
    }

    getPhoneNumber() {
        return this.phoneNumber;
    }
}
