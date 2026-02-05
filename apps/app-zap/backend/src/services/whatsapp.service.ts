import { Client, LocalAuth, Message as WpMessage, ClientInfo, WAState } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import { Server as SocketServer } from 'socket.io';
import { ContactRepository } from '../repositories/contact.repository';
import { MessageRepository } from '../repositories/message.repository';
import { LogRepository } from '../repositories/log.repository';
import { GeminiService } from './gemini.service';
import { RhythmService } from './rhythm.service';
import { CognitiveService } from './cognitive.service';
import { WatchdogService } from './watchdog.service'; // 🆕 Risk Monitoring
import { PresenceService } from './presence.service'; // 🆕 Activity Management
import { WebSocketEvent, DirectiveStatus } from '../models/types';

export class WhatsAppService {
  private client: Client;
  private io: SocketServer;
  private currentQrCode: string | null = null;
  private clientState: WAState = WAState.UNLAUNCHED;

  // Repositories
  private contactRepo = new ContactRepository();
  private messageRepo = new MessageRepository();
  private logRepo = new LogRepository();

  // Services
  private gemini = new GeminiService();
  private rhythm = new RhythmService();
  private cognitive = new CognitiveService();
  private watchdog: WatchdogService; // 🆕
  private presence = new PresenceService(); // 🆕

  constructor(io: SocketServer) {
    this.io = io;
    this.watchdog = new WatchdogService(io); // 🆕 Initialize with Socket.IO

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: 'ghost-protocol' }),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ],
        headless: true
      }
    });

    this.initializeEvents();
  }

  public start() {
    console.log('🔄 Starting WhatsApp Engine...');
    this.client.initialize();
  }

  // NEW: Method to get client status
  public async getClientStatus(): Promise<{ status: any; qr_code?: string; battery_level?: number; last_scan_time?: Date; message?: string }> {
    try {
      const state = await this.client.getState();
      this.clientState = state;
      // const info: ClientInfo | undefined = this.client.info;
      // getBatteryStatus is not in standard types
      const battery: any = await (this.client as any).getBatteryStatus().catch(() => null);

      return {
        status: state,
        qr_code: state === WAState.CONNECTED ? undefined : (this.currentQrCode || undefined), // Only return QR if not connected
        battery_level: battery?.battery,
        // last_scan_time: ... (if we tracked it)
      };
    } catch (error) {
      // getState() can throw if client is not ready
      return { status: 'UNLAUNCHED', qr_code: this.currentQrCode || undefined, message: (error as Error).message };
    }
  }

  // NEW: Method to send a message programmatically
  public async sendMessage(to: string, message: string): Promise<void> {
    if (this.clientState !== WAState.CONNECTED) {
      throw new Error('WhatsApp client is not connected.');
    }
    await this.client.sendMessage(to, message);
  }


  private initializeEvents() {
    this.client.on('qr', async (qr) => {
      console.log('⚠️ QR Code Received');
      this.currentQrCode = await qrcode.toDataURL(qr); // Store QR code
      this.clientState = 'QR_RECEIVED' as any; // Update state
      this.io.emit('qr_code', { url: this.currentQrCode });
      this.logRepo.create('INFO', 'QR_CODE_GENERATED', 'Awaiting scan', undefined);
    });

    this.client.on('ready', () => {
      console.log('✅ WhatsApp Client is Ready');
      this.currentQrCode = null; // Clear QR code
      this.clientState = WAState.CONNECTED; // Update state
      this.io.emit('ready', {});
      this.logRepo.create('INFO', 'SYSTEM_READY', 'Client connected successfully', undefined);
      this.syncContactsAndInformFrontend(); // NEW: Sync contacts on ready
    });

    this.client.on('message_create', async (msg) => {
      await this.handleIncomingMessage(msg);
    });

    this.client.on('authenticated', () => {
      console.log('🔐 Authenticated');
      this.logRepo.create('INFO', 'WHATSAPP_AUTHENTICATED', 'Client session authenticated.', undefined);
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ AUTH FAILURE', msg);
      this.clientState = 'UNAUTHENTICATED' as any; // Update state
      this.io.emit('auth_failure', { message: msg });
      this.logRepo.create('ERROR', 'WHATSAPP_AUTH_FAILURE', `Authentication failed: ${msg}`, undefined);
      // Consider re-initializing or prompting for new QR
    });

    this.client.on('disconnected', (reason) => {
      console.warn('🔌 WhatsApp Client Disconnected:', reason);
      this.clientState = 'DISCONNECTED' as any; // Update state
      this.io.emit('disconnected', { reason });
      this.logRepo.create('WARN', 'WHATSAPP_DISCONNECTED', `Client disconnected: ${reason}`, undefined);
      // Attempt to re-initialize or signal dashboard for intervention
    });



    // NEW: Handle state changes (like LOADING, CONFLICT etc.)
    this.client.on('change_state', (state) => {
      console.log('WhatsApp State changed to:', state);
      this.clientState = state; // Keep internal state updated
      this.logRepo.create('INFO', 'WHATSAPP_STATE_CHANGE', `State changed to: ${state}`, undefined);
      this.io.emit('system_status_update', { status: state }); // Notify dashboard of state changes
    });
  }

  // NEW: Manual history sync for a specific contact
  public async syncContactHistory(contactId: string, limit: number = 50) {
    if (this.clientState !== WAState.CONNECTED) {
      throw new Error('WhatsApp client is not connected.');
    }

    try {
      const chat = await this.client.getChatById(contactId);
      const messages = await chat.fetchMessages({ limit });

      console.log(`📥 Synced ${messages.length} messages for ${contactId}`);

      for (const msg of messages) {
        try {
          await this.handleIncomingMessage(msg);
        } catch (e) { }
      }

    } catch (error) {
      console.error(`Failed to sync history for ${contactId}`, error);
      this.logRepo.create('ERROR', 'HISTORY_SYNC_FAILED', `Failed to sync: ${(error as Error).message}`, contactId);
    }
  }

  // NEW: Sync all contacts from WhatsApp with our DB and notify frontend
  private async syncContactsAndInformFrontend() {
    const chats = await this.client.getChats();
    for (const chat of chats) {
      if (chat.isGroup) continue; // Skip groups
      const contactInfo = await chat.getContact();
      await this.contactRepo.upsert(chat.id._serialized, {
        name: contactInfo.name || contactInfo.pushname || chat.name,
        pushName: contactInfo.pushname,
        profilePicUrl: await contactInfo.getProfilePicUrl().catch(() => null)
      });
    }
    const updatedContacts = await this.contactRepo.getAll();
    this.io.emit('contact_update', updatedContacts); // Send full list to frontend
  }

  /**
   * O Núcleo do Processamento
   */
  private async handleIncomingMessage(msg: WpMessage) {
    // Ignorar mensagens de status ou grupos (por enquanto)
    if (msg.isStatus || msg.from.includes('@g.us')) return;

    const contactId = msg.fromMe ? msg.to : msg.from;
    const body = msg.body;

    // 1. Persistir Contato
    const chat = await msg.getChat();
    const contactInfo = await chat.getContact();

    const contact = await this.contactRepo.upsert(contactId, {
      name: contactInfo.name || contactInfo.pushname || chat.name,
      pushName: contactInfo.pushname,
      // @ts-ignore - lib types might be outdated, getProfilePicUrl returns Promise<string> or throws
      profilePicUrl: await contactInfo.getProfilePicUrl().catch(() => null)
    });

    // 2. Persistir Mensagem
    // 🆕 Se fromMe=true mas NÃO é a IA, é o operador humano no celular
    const isOperator = msg.fromMe; // Se veio do nosso lado, é operador (a IA chama messageRepo separadamente)
    await this.messageRepo.create(contactId, msg.fromMe, body, isOperator);

    // Emitir para Dashboard
    this.io.emit('message_new', {
      contactId,
      fromMe: msg.fromMe,
      body,
      isOperator,
      timestamp: new Date()
    });

    // SE A MENSAGEM FOI MINHA (Do humano real via celular), é intervenção manual
    // 🆕 Marca como operador para extração de estilo e aprendizado de objeções
    if (msg.fromMe) {
      this.logRepo.create('INFO', 'HUMAN_INTERVENTION', 'Message sent by operator - learning from this', contactId);
      return; // AI should not respond to messages sent by itself or by the human operator
    }

    // 🆕 WATCHDOG: Analyze message for risks BEFORE processing
    const riskAlert = this.watchdog.analyzeMessage(contactId, contact.name, body);
    if (riskAlert) {
      this.logRepo.create('WARN', 'RISK_DETECTED',
        `Risk ${riskAlert.riskLevel}: ${riskAlert.detectedPatterns.join(', ')}`, contactId);

      // Auto-pause on high/critical risk
      if (this.watchdog.shouldPauseAI(riskAlert)) {
        await this.watchdog.autoPauseHighRiskContact(contactId, riskAlert);
        this.logRepo.create('WARN', 'AUTO_PAUSE_RISK',
          `AI auto-paused due to ${riskAlert.riskLevel} risk`, contactId);
        return; // Don't respond to high-risk messages
      }
    }

    // 🆕 PRESENCE: Check if we should respond now (sleep hours, lunch, etc)
    const presenceCheck = this.presence.shouldRespondNow();
    if (!presenceCheck.canRespond) {
      this.logRepo.create('INFO', 'PRESENCE_BLOCK',
        `Response blocked: ${presenceCheck.reason}. Resume at: ${presenceCheck.resumeAt}`, contactId);
      // Optionally send a "busy" message
      // const busyMsg = this.presence.getBusyMessage();
      // await this.client.sendMessage(contactId, busyMsg);
      return;
    }

    // If contact is paused, AI does not respond
    if (contact.isPaused) {
      this.logRepo.create('INFO', 'AI_PAUSED', 'AI skipped response due to pause status', contactId);
      return;
    }

    this.logRepo.create('INFO', 'AI_THINKING_STARTED', 'Cognitive analysis started...', contactId);
    this.io.emit('agent_typing', { contactId, status: true }); // Notify frontend AI is thinking

    // Get chat history for context
    const history = await this.messageRepo.getHistory(contactId, 20); // Last 20 messages

    // 1. COGNITIVE ANALYSIS
    const analysis = await this.cognitive.analyze(contact, history, body);

    // Update contact stats based on analysis
    await this.cognitive.updateContactStats(contactId, analysis);

    this.logRepo.create('INFO', 'COGNITIVE_DECISION', JSON.stringify(analysis), contactId);

    // 2. ACTION EXECUTION
    if (analysis.suggestedAction === 'IGNORE' || analysis.suggestedAction === 'WAIT') {
      this.logRepo.create('INFO', 'AI_SKIPPING', `Brain decided to ${analysis.suggestedAction}. Reason: ${analysis.reasoning}`, contactId);
      this.io.emit('agent_typing', { contactId, status: false });
      return;
    }

    // 3. GENERATE RESPONSE (If Action is REPLY)
    const aiResponse = await this.gemini.generateResponse(contact, history);

    if (!aiResponse) {
      this.logRepo.create('WARN', 'AI_NO_RESPONSE', 'Gemini returned an empty response.', contactId);
      this.io.emit('agent_typing', { contactId, status: false });
      return;
    }

    // 4. CALCULATE TIMING (Humanized)
    let responseDelay = this.rhythm.calculateResponseDelay(contact, analysis);
    const typingDuration = this.rhythm.calculateTypingDuration(aiResponse);

    // 🆕 PRESENCE: Adjust delay based on time of day (slower at night, lunch, etc)
    responseDelay = this.presence.adjustDelayForPresence(responseDelay);

    // Safety Override: If delay is -1 (IGNORE from Governor or Presence), abort.
    if (responseDelay === -1) {
      this.logRepo.create('INFO', 'GOVERNOR_ABORT', 'Rhythm Governor or Presence vetoed response.', contactId);
      this.io.emit('agent_typing', { contactId, status: false });
      return;
    }

    this.logRepo.create('INFO', 'AI_DELAY_CALCULATED', JSON.stringify({ responseDelay, typingDuration, action: analysis.suggestedAction }), contactId);

    // Simulate reading/thinking delay
    await this.rhythm.sleep(responseDelay);

    // Simulate typing
    this.io.emit('agent_typing', { contactId, status: true, duration: typingDuration });
    await this.rhythm.sleep(typingDuration);
    this.io.emit('agent_typing', { contactId, status: false });

    // Send the AI generated message
    await this.client.sendMessage(contactId, aiResponse);
    await this.messageRepo.create(contactId, true, aiResponse, false); // 🆕 fromMe: true, isOperator: false (AI)

    this.logRepo.create('INFO', 'AI_MESSAGE_SENT', `AI responded: "${aiResponse}"`, contactId);
    this.io.emit('message_new', {
      contactId,
      fromMe: true,
      isOperator: false, // 🆕 Explicitly mark as AI
      body: aiResponse,
      timestamp: new Date()
    });

    // Update directive status if one was active and AI responded
    if (contact.activeDirective && contact.directiveStatus === DirectiveStatus.EXECUTING) {
      await this.contactRepo.updateDirectiveStatus(contactId, DirectiveStatus.COMPLETED);
      this.logRepo.create('INFO', 'DIRECTIVE_COMPLETED', 'Active directive marked as completed after AI response', contactId);
      const updatedContact = await this.contactRepo.findById(contactId);
      if (updatedContact) {
        this.io.emit('contact_update', [updatedContact]);
      }
    }
  }
}

// Singleton instance
let wpInstance: WhatsAppService | null = null;

export function getWhatsAppService(io?: SocketServer): WhatsAppService {
  if (!wpInstance) {
    if (!io) {
      throw new Error("WhatsAppService must be initialized with Socket.IO first");
    }
    wpInstance = new WhatsAppService(io);
  }
  return wpInstance;
}

