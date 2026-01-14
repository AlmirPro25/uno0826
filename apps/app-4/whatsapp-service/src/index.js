/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║               🤖 MEDISYNC WHATSAPP SERVICE + GEMINI AI 🤖                   ║
 * ║                                                                              ║
 * ║                   Atendente Inteligente de Saúde                            ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { WhatsAppService } from './services/WhatsAppService.js';
import { GeminiAssistant } from './services/GeminiAssistant.js';
import { EmailService } from './services/EmailService.js';
import { NotificationRouter } from './routes/notifications.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Services
console.log('🚀 Iniciando MediSync WhatsApp Service...');

// Gemini Assistant
const geminiAssistant = new GeminiAssistant(process.env.GEMINI_API_KEY);

// WhatsApp Service
const whatsappService = new WhatsAppService(geminiAssistant);

// Email Service
const emailService = new EmailService({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
});

// Routes
app.use('/api/notifications', NotificationRouter(whatsappService, emailService));

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        whatsapp: whatsappService.isReady() ? 'connected' : 'disconnected',
        gemini: geminiAssistant.isReady() ? 'ready' : 'not configured',
        timestamp: new Date().toISOString()
    });
});

// Get QR Code for WhatsApp Authentication
app.get('/api/whatsapp/qr', async (req, res) => {
    const qr = whatsappService.getQRCode();
    if (qr) {
        res.json({ qr });
    } else if (whatsappService.isReady()) {
        res.json({ status: 'already_authenticated' });
    } else {
        res.json({ status: 'waiting_for_qr' });
    }
});

// WhatsApp Status
app.get('/api/whatsapp/status', (req, res) => {
    res.json({
        connected: whatsappService.isReady(),
        phoneNumber: whatsappService.getPhoneNumber()
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏥 MediSync WhatsApp Service                               ║
║                                                              ║
║   📍 API:       http://localhost:${PORT}                       ║
║   💚 WhatsApp:  Aguardando QR Code...                        ║
║   🤖 Gemini:    ${geminiAssistant.isReady() ? 'Configurado' : 'Não configurado'}                             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Initialize WhatsApp (after server starts)
whatsappService.initialize().catch(err => {
    console.error('❌ Erro ao inicializar WhatsApp:', err.message);
});

export { app, whatsappService, geminiAssistant, emailService };
