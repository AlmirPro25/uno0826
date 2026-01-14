/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║                    📧 EMAIL SERVICE (Nodemailer)                             ║
 * ║                                                                              ║
 * ║           Serviço de envio de e-mails para notificações MediSync            ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import nodemailer from 'nodemailer';

export class EmailService {
    constructor(config) {
        this.config = config;
        this.transporter = null;
        this.ready = false;

        if (config.user && config.pass) {
            this.transporter = nodemailer.createTransport({
                host: config.host || 'smtp.gmail.com',
                port: config.port || 587,
                secure: config.port === 465,
                auth: {
                    user: config.user,
                    pass: config.pass
                }
            });

            // Verify connection
            this.transporter.verify()
                .then(() => {
                    this.ready = true;
                    console.log('📧 Email Service conectado!');
                })
                .catch(err => {
                    console.error('❌ Erro ao conectar Email Service:', err.message);
                });
        } else {
            console.warn('⚠️ SMTP não configurado - Email Service desativado');
        }
    }

    /**
     * Send a generic email
     */
    async sendEmail(to, subject, html, text = '') {
        if (!this.transporter) {
            throw new Error('Email service não configurado');
        }

        const mailOptions = {
            from: this.config.from || `MediSync <${this.config.user}>`,
            to,
            subject,
            html,
            text: text || this.stripHtml(html)
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`📧 Email enviado para ${to}: ${info.messageId}`);
            return info;
        } catch (error) {
            console.error(`❌ Erro ao enviar email para ${to}:`, error.message);
            throw error;
        }
    }

    /**
     * Send appointment confirmation email
     */
    async sendAppointmentConfirmation(to, appointment) {
        const subject = `✅ Consulta Agendada - ${appointment.date}`;

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🏥 MediSync</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sua consulta foi confirmada!</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Olá, ${appointment.patientName || 'Paciente'}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Sua consulta foi agendada com sucesso. Confira os detalhes abaixo:
            </p>

            <!-- Appointment Card -->
            <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #10B981;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">📅 Data:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${appointment.date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">⏰ Horário:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${appointment.time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">👨‍⚕️ Médico(a):</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">Dr(a). ${appointment.doctorName}</td>
                    </tr>
                    ${appointment.specialty ? `
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">🩺 Especialidade:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${appointment.specialty}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>

            <!-- Video Call Button -->
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${appointment.videoCallUrl || `https://medisync.app/video-call/${appointment.id}`}" 
                   style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    📹 Acessar Consulta Online
                </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                💡 <strong>Dica:</strong> Acesse a sala da consulta alguns minutos antes do horário agendado para testar sua câmera e microfone.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Precisa de ajuda? Responda este email ou acesse nosso suporte.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} MediSync. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>`;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send appointment reminder email
     */
    async sendAppointmentReminder(to, appointment) {
        const subject = `⏰ Lembrete: Consulta em ${appointment.timeUntil || 'breve'}`;

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ Lembrete de Consulta</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sua consulta está chegando!</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Olá, ${appointment.patientName || 'Paciente'}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Este é um lembrete da sua consulta agendada. Não se esqueça!
            </p>

            <!-- Appointment Card -->
            <div style="background-color: #eff6ff; border-radius: 12px; padding: 25px; margin-bottom: 30px; border-left: 4px solid #3B82F6;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">📅 Data:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${appointment.date}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">⏰ Horário:</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${appointment.time}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #6b7280;">👨‍⚕️ Médico(a):</td>
                        <td style="padding: 8px 0; color: #1f2937; font-weight: 600;">Dr(a). ${appointment.doctorName}</td>
                    </tr>
                </table>
            </div>

            <!-- Video Call Button -->
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="${appointment.videoCallUrl || `https://medisync.app/video-call/${appointment.id}`}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    📹 Entrar na Consulta Agora
                </a>
            </div>

            <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                    ⚠️ <strong>Importante:</strong> Certifique-se de estar em um local silencioso com boa conexão de internet.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Não pode comparecer? <a href="https://medisync.app/appointments" style="color: #3B82F6;">Reagende aqui</a>
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} MediSync. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>`;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send verification code email
     */
    async sendVerificationCode(to, code, userName = '') {
        const subject = `🔐 Código de Verificação MediSync: ${code}`;

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Verificação de Conta</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Olá${userName ? `, ${userName}` : ''}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Use o código abaixo para verificar sua conta:
            </p>

            <!-- Code Box -->
            <div style="background-color: #f3f4f6; border-radius: 12px; padding: 30px; margin-bottom: 30px; display: inline-block;">
                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1f2937;">${code}</span>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                ⏱️ Este código expira em <strong>5 minutos</strong>.
            </p>

            <div style="background-color: #fef2f2; border-radius: 8px; padding: 15px; text-align: left;">
                <p style="color: #991b1b; font-size: 14px; margin: 0;">
                    🚫 <strong>Segurança:</strong> Nunca compartilhe este código com ninguém. Nossa equipe nunca pedirá seu código.
                </p>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Não solicitou este código? Ignore este email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} MediSync. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>`;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(to, userName) {
        const subject = `🎉 Bem-vindo ao MediSync, ${userName}!`;

        const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 50px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🏥 MediSync</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 15px 0 0 0; font-size: 18px;">Bem-vindo à sua saúde digital!</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0;">Olá, ${userName}! 🎉</h2>
            
            <p style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 0;">
                Sua conta foi criada com sucesso! Agora você pode agendar consultas online com os melhores médicos, de qualquer lugar.
            </p>

            <!-- Features -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0;">O que você pode fazer:</h3>
                <ul style="color: #4b5563; line-height: 2; padding-left: 20px; margin: 0;">
                    <li>📹 Consultas por vídeo chamada</li>
                    <li>📅 Agendamento online 24 horas</li>
                    <li>📋 Acesso ao seu prontuário digital</li>
                    <li>💊 Receitas e atestados digitais</li>
                    <li>💬 Suporte via WhatsApp</li>
                </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 30px;">
                <a href="https://medisync.app/agendar" 
                   style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Agendar Minha Primeira Consulta
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                Dúvidas? Fale conosco pelo WhatsApp!
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} MediSync. Todos os direitos reservados.
            </p>
        </div>
    </div>
</body>
</html>`;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Strip HTML tags for plain text version
     */
    stripHtml(html) {
        return html
            .replace(/<style[^>]*>.*<\/style>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    isReady() {
        return this.ready;
    }
}
