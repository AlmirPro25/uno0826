/**
 * 📞 TWILIO COMMUNICATIONS SUPREME MANIFEST
 * 
 * Domínio: SMS, Voice, Video, WhatsApp, Email (SendGrid)
 * Especialidade: Comunicação omnichannel em escala
 * 
 * @version 1.0.0
 * @author Micro-SaaS Factory
 */

export const TWILIO_COMMUNICATIONS_MANIFEST = {
  id: 'twilio-communications-supreme',
  name: 'Twilio Communications Supreme Master',
  version: '1.0.0',
  category: 'communications',
  
  activation: {
    keywords: [
      'twilio', 'sms', 'voice', 'video call', 'whatsapp api',
      'sendgrid', 'programmable voice', 'programmable sms',
      'verify', 'otp', 'two-factor', '2fa sms',
      'call center', 'ivr', 'voicemail', 'conference call',
      'video rooms', 'webrtc', 'conversations api',
      'flex', 'contact center', 'messaging api'
    ],
    patterns: [
      /twilio/i, /send\s*sms/i, /voice\s*call/i,
      /whatsapp\s*api/i, /sendgrid/i, /otp\s*sms/i
    ]
  },

  philosophy: {
    core: "Comunicação é a ponte entre sistemas e pessoas. Faça-a confiável, escalável e humana.",
    principles: [
      "Omnichannel First - Usuário escolhe o canal",
      "Deliverability - Mensagem que não chega não existe",
      "Compliance - Respeite regulamentações (TCPA, GDPR)",
      "Fallback Strategy - Sempre tenha plano B",
      "Cost Optimization - SMS custa, otimize",
      "Security - Nunca exponha credenciais"
    ]
  },

  products: {
    messaging: {
      sms: {
        description: "SMS programático global",
        pricing: "$0.0079/msg (US), varia por país",
        features: ["Delivery receipts", "Unicode", "Concatenation", "Alphanumeric sender"]
      },
      whatsapp: {
        description: "WhatsApp Business API",
        pricing: "Conversation-based pricing",
        features: ["Templates", "Media", "Interactive buttons", "24h session"]
      },
      conversations: {
        description: "API unificada multi-canal",
        features: ["SMS + WhatsApp + Chat", "Unified inbox", "Webhooks"]
      }
    },
    voice: {
      programmableVoice: {
        description: "Chamadas programáticas",
        pricing: "$0.0085/min (US outbound)",
        features: ["TwiML", "Recording", "Transcription", "Conference"]
      },
      elasticSip: {
        description: "SIP trunking",
        features: ["Bring your own carrier", "Global reach"]
      }
    },
    video: {
      programmableVideo: {
        description: "Video rooms WebRTC",
        pricing: "$0.004/participant-minute",
        features: ["P2P", "Group rooms", "Recording", "Screen share"]
      }
    },
    verify: {
      description: "Verificação de identidade",
      pricing: "$0.05/verification",
      channels: ["SMS", "Voice", "Email", "WhatsApp", "TOTP"]
    },
    sendgrid: {
      description: "Email em escala",
      pricing: "Free tier: 100/day",
      features: ["Templates", "Analytics", "Deliverability tools"]
    }
  },

  templates: {
    smsService: `
// services/TwilioSMSService.ts
import twilio from 'twilio';

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  messagingServiceSid?: string;
}

interface SendSMSParams {
  to: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
}

interface SMSResult {
  sid: string;
  status: string;
  to: string;
  dateCreated: Date;
  price?: string;
  errorCode?: number;
  errorMessage?: string;
}

export class TwilioSMSService {
  private client: twilio.Twilio;
  private config: SMSConfig;

  constructor(config: SMSConfig) {
    this.config = config;
    this.client = twilio(config.accountSid, config.authToken);
  }

  async sendSMS(params: SendSMSParams): Promise<SMSResult> {
    try {
      const message = await this.client.messages.create({
        to: params.to,
        from: this.config.fromNumber,
        body: params.body,
        mediaUrl: params.mediaUrl,
        statusCallback: params.statusCallback,
        // Use Messaging Service for better deliverability
        ...(this.config.messagingServiceSid && {
          messagingServiceSid: this.config.messagingServiceSid
        })
      });

      return {
        sid: message.sid,
        status: message.status,
        to: message.to,
        dateCreated: message.dateCreated,
        price: message.price,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error: any) {
      console.error('SMS send failed:', error.message);
      throw new SMSError(error.code, error.message);
    }
  }

  async sendBulkSMS(
    recipients: string[], 
    body: string,
    options?: { batchSize?: number; delayMs?: number }
  ): Promise<SMSResult[]> {
    const { batchSize = 100, delayMs = 100 } = options || {};
    const results: SMSResult[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(to => this.sendSMS({ to, body }))
      );

      results.push(
        ...batchResults.map((r, idx) => 
          r.status === 'fulfilled' 
            ? r.value 
            : { sid: '', status: 'failed', to: batch[idx], dateCreated: new Date(), errorMessage: r.reason.message }
        )
      );

      // Rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  async getMessageStatus(sid: string): Promise<SMSResult> {
    const message = await this.client.messages(sid).fetch();
    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      dateCreated: message.dateCreated,
      price: message.price,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  }
}

class SMSError extends Error {
  constructor(public code: number, message: string) {
    super(message);
    this.name = 'SMSError';
  }
}
`,

    verifyService: `
// services/TwilioVerifyService.ts
import twilio from 'twilio';

interface VerifyConfig {
  accountSid: string;
  authToken: string;
  serviceSid: string; // Verify Service SID
}

type VerifyChannel = 'sms' | 'call' | 'email' | 'whatsapp';

interface VerificationResult {
  sid: string;
  to: string;
  channel: string;
  status: 'pending' | 'approved' | 'canceled';
  valid: boolean;
}

export class TwilioVerifyService {
  private client: twilio.Twilio;
  private serviceSid: string;

  constructor(config: VerifyConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.serviceSid = config.serviceSid;
  }

  /**
   * Envia código de verificação
   */
  async sendVerification(
    to: string, 
    channel: VerifyChannel = 'sms'
  ): Promise<VerificationResult> {
    const verification = await this.client.verify.v2
      .services(this.serviceSid)
      .verifications
      .create({
        to,
        channel,
        // Customização opcional
        locale: 'pt-BR',
      });

    return {
      sid: verification.sid,
      to: verification.to,
      channel: verification.channel,
      status: verification.status as any,
      valid: verification.valid
    };
  }

  /**
   * Verifica código inserido pelo usuário
   */
  async checkVerification(to: string, code: string): Promise<VerificationResult> {
    try {
      const check = await this.client.verify.v2
        .services(this.serviceSid)
        .verificationChecks
        .create({ to, code });

      return {
        sid: check.sid,
        to: check.to,
        channel: check.channel,
        status: check.status as any,
        valid: check.valid
      };
    } catch (error: any) {
      // Código inválido ou expirado
      if (error.code === 20404) {
        return {
          sid: '',
          to,
          channel: '',
          status: 'canceled',
          valid: false
        };
      }
      throw error;
    }
  }

  /**
   * Cancela verificação pendente
   */
  async cancelVerification(sid: string): Promise<void> {
    await this.client.verify.v2
      .services(this.serviceSid)
      .verifications(sid)
      .update({ status: 'canceled' });
  }
}
`,

    voiceService: `
// services/TwilioVoiceService.ts
import twilio from 'twilio';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';

interface VoiceConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface CallParams {
  to: string;
  twimlUrl?: string;
  twiml?: string;
  statusCallback?: string;
  record?: boolean;
  timeout?: number;
}

interface CallResult {
  sid: string;
  status: string;
  to: string;
  from: string;
  duration?: string;
  price?: string;
}

export class TwilioVoiceService {
  private client: twilio.Twilio;
  private config: VoiceConfig;

  constructor(config: VoiceConfig) {
    this.config = config;
    this.client = twilio(config.accountSid, config.authToken);
  }

  /**
   * Inicia chamada de voz
   */
  async makeCall(params: CallParams): Promise<CallResult> {
    const callOptions: any = {
      to: params.to,
      from: this.config.fromNumber,
      statusCallback: params.statusCallback,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: params.record,
      timeout: params.timeout || 30
    };

    if (params.twimlUrl) {
      callOptions.url = params.twimlUrl;
    } else if (params.twiml) {
      callOptions.twiml = params.twiml;
    }

    const call = await this.client.calls.create(callOptions);

    return {
      sid: call.sid,
      status: call.status,
      to: call.to,
      from: call.from,
      duration: call.duration,
      price: call.price
    };
  }

  /**
   * Gera TwiML para IVR simples
   */
  generateIVRTwiML(options: {
    greeting: string;
    options: { digit: string; action: string; say: string }[];
    timeout?: number;
  }): string {
    const response = new VoiceResponse();
    
    const gather = response.gather({
      numDigits: 1,
      action: '/api/voice/handle-input',
      method: 'POST',
      timeout: options.timeout || 5
    });

    gather.say({ language: 'pt-BR' }, options.greeting);
    
    options.options.forEach(opt => {
      gather.say({ language: 'pt-BR' }, \`Pressione \${opt.digit} para \${opt.say}\`);
    });

    // Se não pressionar nada, repetir
    response.redirect('/api/voice/ivr');

    return response.toString();
  }

  /**
   * Gera TwiML para text-to-speech
   */
  generateSayTwiML(message: string, voice: string = 'Polly.Camila'): string {
    const response = new VoiceResponse();
    response.say({ voice, language: 'pt-BR' }, message);
    return response.toString();
  }

  /**
   * Gera TwiML para conferência
   */
  generateConferenceTwiML(
    conferenceName: string,
    options?: { 
      muted?: boolean; 
      startOnEnter?: boolean;
      endOnExit?: boolean;
      waitUrl?: string;
    }
  ): string {
    const response = new VoiceResponse();
    
    const dial = response.dial();
    dial.conference({
      muted: options?.muted,
      startConferenceOnEnter: options?.startOnEnter ?? true,
      endConferenceOnExit: options?.endOnExit ?? false,
      waitUrl: options?.waitUrl || 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.classical'
    }, conferenceName);

    return response.toString();
  }

  /**
   * Busca gravação de chamada
   */
  async getRecording(callSid: string): Promise<{ url: string; duration: number } | null> {
    const recordings = await this.client.recordings.list({ callSid, limit: 1 });
    
    if (recordings.length === 0) return null;

    const recording = recordings[0];
    return {
      url: \`https://api.twilio.com\${recording.uri.replace('.json', '.mp3')}\`,
      duration: parseInt(recording.duration)
    };
  }
}
`,

    whatsappService: `
// services/TwilioWhatsAppService.ts
import twilio from 'twilio';

interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string; // formato: whatsapp:+14155238886
}

interface WhatsAppMessage {
  to: string;
  body?: string;
  mediaUrl?: string[];
  templateSid?: string;
  templateVariables?: Record<string, string>;
}

interface WhatsAppResult {
  sid: string;
  status: string;
  to: string;
  dateCreated: Date;
}

export class TwilioWhatsAppService {
  private client: twilio.Twilio;
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
    this.client = twilio(config.accountSid, config.authToken);
  }

  /**
   * Envia mensagem WhatsApp (dentro da janela de 24h)
   */
  async sendMessage(params: WhatsAppMessage): Promise<WhatsAppResult> {
    const to = params.to.startsWith('whatsapp:') 
      ? params.to 
      : \`whatsapp:\${params.to}\`;

    const message = await this.client.messages.create({
      to,
      from: this.config.whatsappNumber,
      body: params.body,
      mediaUrl: params.mediaUrl
    });

    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      dateCreated: message.dateCreated
    };
  }

  /**
   * Envia template aprovado (fora da janela de 24h)
   */
  async sendTemplate(
    to: string,
    contentSid: string,
    variables?: Record<string, string>
  ): Promise<WhatsAppResult> {
    const toFormatted = to.startsWith('whatsapp:') ? to : \`whatsapp:\${to}\`;

    const message = await this.client.messages.create({
      to: toFormatted,
      from: this.config.whatsappNumber,
      contentSid,
      contentVariables: variables ? JSON.stringify(variables) : undefined
    });

    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      dateCreated: message.dateCreated
    };
  }

  /**
   * Envia mensagem interativa com botões
   */
  async sendInteractiveButtons(
    to: string,
    body: string,
    buttons: { id: string; title: string }[]
  ): Promise<WhatsAppResult> {
    // Requer Content API do Twilio
    // Buttons devem ser pré-aprovados como template
    const toFormatted = to.startsWith('whatsapp:') ? to : \`whatsapp:\${to}\`;

    const message = await this.client.messages.create({
      to: toFormatted,
      from: this.config.whatsappNumber,
      body,
      // Interactive messages require approved templates
    });

    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      dateCreated: message.dateCreated
    };
  }
}
`,

    webhookHandler: `
// api/webhooks/twilio.ts
import { Request, Response } from 'express';
import twilio from 'twilio';

const { validateRequest } = twilio;

interface TwilioWebhookBody {
  MessageSid?: string;
  CallSid?: string;
  From: string;
  To: string;
  Body?: string;
  MessageStatus?: string;
  CallStatus?: string;
  RecordingUrl?: string;
  TranscriptionText?: string;
  Digits?: string;
}

/**
 * Middleware para validar requests do Twilio
 */
export function validateTwilioRequest(
  req: Request, 
  res: Response, 
  next: Function
) {
  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const url = \`\${req.protocol}://\${req.get('host')}\${req.originalUrl}\`;

  const isValid = validateRequest(
    authToken,
    twilioSignature,
    url,
    req.body
  );

  if (!isValid) {
    return res.status(403).json({ error: 'Invalid Twilio signature' });
  }

  next();
}

/**
 * Handler para status de SMS
 */
export async function handleSMSStatus(req: Request, res: Response) {
  const { MessageSid, MessageStatus, To, ErrorCode } = req.body as TwilioWebhookBody;

  console.log(\`SMS \${MessageSid} to \${To}: \${MessageStatus}\`);

  // Atualizar status no banco
  await updateMessageStatus(MessageSid!, MessageStatus!, ErrorCode);

  // Twilio espera 200 OK
  res.status(200).send('OK');
}

/**
 * Handler para SMS recebido
 */
export async function handleIncomingSMS(req: Request, res: Response) {
  const { From, Body, MessageSid } = req.body as TwilioWebhookBody;

  console.log(\`SMS received from \${From}: \${Body}\`);

  // Processar mensagem (chatbot, suporte, etc)
  const response = await processIncomingMessage(From, Body!);

  // Responder com TwiML
  const twiml = new twilio.twiml.MessagingResponse();
  if (response) {
    twiml.message(response);
  }

  res.type('text/xml').send(twiml.toString());
}

/**
 * Handler para chamada recebida
 */
export async function handleIncomingCall(req: Request, res: Response) {
  const { From, CallSid } = req.body as TwilioWebhookBody;

  console.log(\`Call received from \${From}\`);

  // Gerar IVR
  const twiml = new twilio.twiml.VoiceResponse();
  
  twiml.say({ language: 'pt-BR', voice: 'Polly.Camila' }, 
    'Bem-vindo ao nosso atendimento.');
  
  const gather = twiml.gather({
    numDigits: 1,
    action: '/api/webhooks/twilio/voice-input',
    method: 'POST'
  });
  
  gather.say({ language: 'pt-BR' }, 
    'Pressione 1 para vendas. Pressione 2 para suporte.');

  res.type('text/xml').send(twiml.toString());
}

/**
 * Handler para input de voz (DTMF)
 */
export async function handleVoiceInput(req: Request, res: Response) {
  const { Digits, CallSid } = req.body as TwilioWebhookBody;

  const twiml = new twilio.twiml.VoiceResponse();

  switch (Digits) {
    case '1':
      twiml.say({ language: 'pt-BR' }, 'Transferindo para vendas.');
      twiml.dial('+5511999999999'); // Número de vendas
      break;
    case '2':
      twiml.say({ language: 'pt-BR' }, 'Transferindo para suporte.');
      twiml.dial('+5511888888888'); // Número de suporte
      break;
    default:
      twiml.say({ language: 'pt-BR' }, 'Opção inválida.');
      twiml.redirect('/api/webhooks/twilio/voice');
  }

  res.type('text/xml').send(twiml.toString());
}

// Funções auxiliares (implementar conforme necessidade)
async function updateMessageStatus(sid: string, status: string, errorCode?: string) {
  // Atualizar no banco de dados
}

async function processIncomingMessage(from: string, body: string): Promise<string | null> {
  // Lógica de chatbot ou roteamento
  return 'Obrigado pela mensagem! Responderemos em breve.';
}
`
  },

  bestPractices: {
    deliverability: [
      "Use Messaging Service para melhor deliverability",
      "Implemente opt-in/opt-out (STOP para cancelar)",
      "Monitore métricas de entrega",
      "Use números locais para cada país",
      "Evite links encurtados (spam filters)"
    ],
    compliance: [
      "TCPA (US): Consentimento prévio obrigatório",
      "GDPR (EU): Base legal para comunicação",
      "LGPD (BR): Consentimento explícito",
      "Horários permitidos (8h-21h geralmente)",
      "Opt-out fácil e imediato"
    ],
    costOptimization: [
      "Use Messaging Service para roteamento inteligente",
      "Batch messages quando possível",
      "Considere WhatsApp para conversas longas",
      "Use Verify ao invés de SMS manual para OTP",
      "Monitore custos por país/canal"
    ],
    security: [
      "Nunca exponha Account SID/Auth Token",
      "Valide webhooks com assinatura",
      "Use subaccounts para isolamento",
      "Implemente rate limiting",
      "Monitore uso anômalo"
    ]
  },

  pricing: {
    sms: {
      us: { outbound: 0.0079, inbound: 0.0075 },
      br: { outbound: 0.0500, inbound: 0.0050 },
      note: "Preços variam por país e volume"
    },
    voice: {
      us: { outbound: 0.0140, inbound: 0.0085 },
      br: { outbound: 0.0500, inbound: 0.0100 }
    },
    whatsapp: {
      conversation: {
        marketing: 0.0625,
        utility: 0.0200,
        service: 0.0088
      },
      note: "Preços por conversa de 24h"
    },
    verify: {
      sms: 0.05,
      voice: 0.05,
      email: 0.03
    }
  },

  antiPatterns: [
    "NUNCA envie SMS sem consentimento",
    "NUNCA exponha credenciais no frontend",
    "NUNCA ignore webhooks de status",
    "NUNCA use SMS para dados sensíveis sem criptografia",
    "NUNCA ignore rate limits do Twilio",
    "NUNCA hardcode números de telefone"
  ],

  checklist: {
    setup: [
      "Account SID e Auth Token configurados?",
      "Números de telefone provisionados?",
      "Messaging Service criado?",
      "Webhooks configurados?",
      "Verify Service criado (se usar OTP)?"
    ],
    compliance: [
      "Opt-in implementado?",
      "Opt-out (STOP) funcionando?",
      "Política de privacidade atualizada?",
      "Horários de envio respeitados?",
      "Logs de consentimento mantidos?"
    ],
    production: [
      "Validação de webhook ativa?",
      "Rate limiting implementado?",
      "Monitoramento de custos?",
      "Alertas de falha configurados?",
      "Fallback para canais alternativos?"
    ]
  }
};

export default TWILIO_COMMUNICATIONS_MANIFEST;
