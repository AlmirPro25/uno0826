/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║                   📢 NOTIFICATION ROUTES API                                 ║
 * ║                                                                              ║
 * ║              Endpoints para envio de notificações multicanal                ║
 * ║                       (WhatsApp + Email)                                     ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { Router } from 'express';

export function NotificationRouter(whatsappService, emailService) {
    const router = Router();

    /**
     * POST /api/notifications/send
     * Send notification via WhatsApp and/or Email
     */
    router.post('/send', async (req, res) => {
        try {
            const {
                type,
                channels = ['whatsapp', 'email'],
                recipient,
                data
            } = req.body;

            // Validate request
            if (!type || !recipient) {
                return res.status(400).json({
                    error: 'Missing required fields: type, recipient'
                });
            }

            const results = {
                whatsapp: null,
                email: null
            };

            // Send via WhatsApp
            if (channels.includes('whatsapp') && recipient.phone) {
                try {
                    if (whatsappService.isReady()) {
                        switch (type) {
                            case 'appointment_confirmation':
                                await whatsappService.sendAppointmentConfirmation(
                                    recipient.phone,
                                    data
                                );
                                break;
                            case 'appointment_reminder':
                                await whatsappService.sendAppointmentReminder(
                                    recipient.phone,
                                    data
                                );
                                break;
                            case 'verification_code':
                                await whatsappService.sendVerificationCode(
                                    recipient.phone,
                                    data.code
                                );
                                break;
                            case 'generic':
                                await whatsappService.sendMessage(
                                    recipient.phone,
                                    data.message
                                );
                                break;
                            default:
                                throw new Error(`Unknown notification type: ${type}`);
                        }
                        results.whatsapp = { success: true };
                    } else {
                        results.whatsapp = { success: false, error: 'WhatsApp not connected' };
                    }
                } catch (error) {
                    results.whatsapp = { success: false, error: error.message };
                }
            }

            // Send via Email
            if (channels.includes('email') && recipient.email) {
                try {
                    if (emailService.isReady()) {
                        switch (type) {
                            case 'appointment_confirmation':
                                await emailService.sendAppointmentConfirmation(
                                    recipient.email,
                                    { ...data, patientName: recipient.name }
                                );
                                break;
                            case 'appointment_reminder':
                                await emailService.sendAppointmentReminder(
                                    recipient.email,
                                    { ...data, patientName: recipient.name }
                                );
                                break;
                            case 'verification_code':
                                await emailService.sendVerificationCode(
                                    recipient.email,
                                    data.code,
                                    recipient.name
                                );
                                break;
                            case 'welcome':
                                await emailService.sendWelcomeEmail(
                                    recipient.email,
                                    recipient.name
                                );
                                break;
                            case 'generic':
                                await emailService.sendEmail(
                                    recipient.email,
                                    data.subject || 'MediSync',
                                    data.html || data.message
                                );
                                break;
                            default:
                                throw new Error(`Unknown notification type: ${type}`);
                        }
                        results.email = { success: true };
                    } else {
                        results.email = { success: false, error: 'Email service not configured' };
                    }
                } catch (error) {
                    results.email = { success: false, error: error.message };
                }
            }

            // Determine overall status
            const hasSuccess =
                (results.whatsapp?.success === true) ||
                (results.email?.success === true);

            const statusCode = hasSuccess ? 200 : 500;

            res.status(statusCode).json({
                success: hasSuccess,
                results,
                message: hasSuccess
                    ? 'Notification sent successfully'
                    : 'Failed to send notification'
            });

        } catch (error) {
            console.error('❌ Error sending notification:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });

    /**
     * POST /api/notifications/appointment/confirm
     * Send appointment confirmation
     */
    router.post('/appointment/confirm', async (req, res) => {
        try {
            const { recipient, appointment } = req.body;

            if (!recipient || !appointment) {
                return res.status(400).json({
                    error: 'Missing required fields: recipient, appointment'
                });
            }

            const results = { whatsapp: null, email: null };

            // WhatsApp
            if (recipient.phone && whatsappService.isReady()) {
                try {
                    await whatsappService.sendAppointmentConfirmation(
                        recipient.phone,
                        appointment
                    );
                    results.whatsapp = { success: true };
                } catch (error) {
                    results.whatsapp = { success: false, error: error.message };
                }
            }

            // Email
            if (recipient.email && emailService.isReady()) {
                try {
                    await emailService.sendAppointmentConfirmation(
                        recipient.email,
                        { ...appointment, patientName: recipient.name }
                    );
                    results.email = { success: true };
                } catch (error) {
                    results.email = { success: false, error: error.message };
                }
            }

            res.json({ success: true, results });

        } catch (error) {
            console.error('❌ Error sending confirmation:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/notifications/appointment/reminder
     * Send appointment reminder
     */
    router.post('/appointment/reminder', async (req, res) => {
        try {
            const { recipient, appointment } = req.body;

            if (!recipient || !appointment) {
                return res.status(400).json({
                    error: 'Missing required fields: recipient, appointment'
                });
            }

            const results = { whatsapp: null, email: null };

            // WhatsApp
            if (recipient.phone && whatsappService.isReady()) {
                try {
                    await whatsappService.sendAppointmentReminder(
                        recipient.phone,
                        appointment
                    );
                    results.whatsapp = { success: true };
                } catch (error) {
                    results.whatsapp = { success: false, error: error.message };
                }
            }

            // Email
            if (recipient.email && emailService.isReady()) {
                try {
                    await emailService.sendAppointmentReminder(
                        recipient.email,
                        { ...appointment, patientName: recipient.name }
                    );
                    results.email = { success: true };
                } catch (error) {
                    results.email = { success: false, error: error.message };
                }
            }

            res.json({ success: true, results });

        } catch (error) {
            console.error('❌ Error sending reminder:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/notifications/verification
     * Send verification code
     */
    router.post('/verification', async (req, res) => {
        try {
            const { recipient, code, channel = 'whatsapp' } = req.body;

            if (!recipient || !code) {
                return res.status(400).json({
                    error: 'Missing required fields: recipient, code'
                });
            }

            let result = { success: false };

            if (channel === 'whatsapp' && recipient.phone) {
                if (!whatsappService.isReady()) {
                    return res.status(503).json({ error: 'WhatsApp not connected' });
                }
                await whatsappService.sendVerificationCode(recipient.phone, code);
                result = { success: true, channel: 'whatsapp' };
            } else if (channel === 'email' && recipient.email) {
                if (!emailService.isReady()) {
                    return res.status(503).json({ error: 'Email service not configured' });
                }
                await emailService.sendVerificationCode(
                    recipient.email,
                    code,
                    recipient.name
                );
                result = { success: true, channel: 'email' };
            } else {
                return res.status(400).json({ error: 'Invalid channel or missing contact info' });
            }

            res.json(result);

        } catch (error) {
            console.error('❌ Error sending verification:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/notifications/welcome
     * Send welcome email to new user
     */
    router.post('/welcome', async (req, res) => {
        try {
            const { email, name } = req.body;

            if (!email || !name) {
                return res.status(400).json({
                    error: 'Missing required fields: email, name'
                });
            }

            if (!emailService.isReady()) {
                return res.status(503).json({ error: 'Email service not configured' });
            }

            await emailService.sendWelcomeEmail(email, name);
            res.json({ success: true });

        } catch (error) {
            console.error('❌ Error sending welcome email:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * POST /api/notifications/broadcast
     * Send notification to multiple recipients (admin only)
     */
    router.post('/broadcast', async (req, res) => {
        try {
            const { recipients, message, channels = ['whatsapp'] } = req.body;

            if (!recipients || !Array.isArray(recipients) || !message) {
                return res.status(400).json({
                    error: 'Missing required fields: recipients (array), message'
                });
            }

            const results = [];
            let successCount = 0;
            let failCount = 0;

            for (const recipient of recipients) {
                const result = { recipient, whatsapp: null, email: null };

                // WhatsApp
                if (channels.includes('whatsapp') && recipient.phone && whatsappService.isReady()) {
                    try {
                        await whatsappService.sendMessage(recipient.phone, message);
                        result.whatsapp = { success: true };
                        successCount++;
                    } catch (error) {
                        result.whatsapp = { success: false, error: error.message };
                        failCount++;
                    }
                }

                // Email
                if (channels.includes('email') && recipient.email && emailService.isReady()) {
                    try {
                        await emailService.sendEmail(
                            recipient.email,
                            'Comunicado MediSync',
                            `<div style="font-family: sans-serif; padding: 20px;">${message}</div>`
                        );
                        result.email = { success: true };
                        successCount++;
                    } catch (error) {
                        result.email = { success: false, error: error.message };
                        failCount++;
                    }
                }

                results.push(result);

                // Rate limiting - wait 1 second between messages
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            res.json({
                success: successCount > 0,
                total: recipients.length,
                successCount,
                failCount,
                results
            });

        } catch (error) {
            console.error('❌ Error sending broadcast:', error);
            res.status(500).json({ error: error.message });
        }
    });

    /**
     * GET /api/notifications/status
     * Get notification services status
     */
    router.get('/status', (req, res) => {
        res.json({
            whatsapp: {
                connected: whatsappService.isReady(),
                phoneNumber: whatsappService.getPhoneNumber()
            },
            email: {
                configured: emailService.isReady()
            }
        });
    });

    return router;
}
