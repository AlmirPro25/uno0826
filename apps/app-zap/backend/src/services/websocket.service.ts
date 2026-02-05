/**
 * 🔌 WEBSOCKET SERVICE
 * Real-time updates via Socket.IO
 * Broadcasts events to all connected clients
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { LogRepository } from '../repositories/log.repository';

export interface WebSocketEvent {
    type: string;
    data: any;
    timestamp: Date;
}

export interface ConnectedClient {
    id: string;
    connectedAt: Date;
    subscriptions: string[];
}

export class WebSocketService {
    private io: SocketServer | null = null;
    private logRepo = new LogRepository();
    private clients: Map<string, ConnectedClient> = new Map();

    // Event types
    static readonly EVENTS = {
        // Messages
        MESSAGE_RECEIVED: 'message:received',
        MESSAGE_SENT: 'message:sent',

        // Contacts
        CONTACT_UPDATED: 'contact:updated',
        CONTACT_PAUSED: 'contact:paused',
        CONTACT_RESUMED: 'contact:resumed',

        // Alerts
        RISK_DETECTED: 'risk:detected',
        RISK_RESOLVED: 'risk:resolved',

        // Operations
        HUNTER_EXECUTED: 'hunter:executed',
        WATCHDOG_ALERT: 'watchdog:alert',

        // System
        METRICS_UPDATE: 'metrics:update',
        TASK_COMPLETED: 'task:completed',
        BACKUP_CREATED: 'backup:created',

        // Leads
        LEAD_SCORE_UPDATED: 'lead:score_updated',
        CONVERSION: 'lead:conversion'
    };

    /**
     * Initialize WebSocket server
     */
    initialize(httpServer: HttpServer): void {
        this.io = new SocketServer(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupConnectionHandlers();
        this.logRepo.create('INFO', 'WEBSOCKET_STARTED', 'WebSocket server initialized', undefined);
        console.log('🔌 WebSocket server initialized');
    }

    /**
     * Setup connection handlers
     */
    private setupConnectionHandlers(): void {
        if (!this.io) return;

        this.io.on('connection', (socket: Socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            // Register client
            this.clients.set(socket.id, {
                id: socket.id,
                connectedAt: new Date(),
                subscriptions: []
            });

            // Send welcome message
            socket.emit('connected', {
                clientId: socket.id,
                serverTime: new Date(),
                message: 'Connected to Ghost Protocol WebSocket'
            });

            // Handle subscriptions
            socket.on('subscribe', (channels: string[]) => {
                const client = this.clients.get(socket.id);
                if (client) {
                    channels.forEach(channel => {
                        socket.join(channel);
                        if (!client.subscriptions.includes(channel)) {
                            client.subscriptions.push(channel);
                        }
                    });
                    console.log(`📡 Client ${socket.id} subscribed to: ${channels.join(', ')}`);
                }
            });

            socket.on('unsubscribe', (channels: string[]) => {
                const client = this.clients.get(socket.id);
                if (client) {
                    channels.forEach(channel => {
                        socket.leave(channel);
                        client.subscriptions = client.subscriptions.filter(c => c !== channel);
                    });
                }
            });

            // Handle ping/pong for connection health
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: Date.now() });
            });

            // Handle disconnection
            socket.on('disconnect', (reason) => {
                console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
                this.clients.delete(socket.id);
            });

            // Handle errors
            socket.on('error', (error) => {
                console.error(`🔌 Socket error for ${socket.id}:`, error);
            });
        });
    }

    /**
     * Broadcast event to all clients
     */
    broadcast(eventType: string, data: any): void {
        if (!this.io) return;

        const event: WebSocketEvent = {
            type: eventType,
            data,
            timestamp: new Date()
        };

        this.io.emit(eventType, event);
    }

    /**
     * Emit to specific room/channel
     */
    emitToRoom(room: string, eventType: string, data: any): void {
        if (!this.io) return;

        const event: WebSocketEvent = {
            type: eventType,
            data,
            timestamp: new Date()
        };

        this.io.to(room).emit(eventType, event);
    }

    /**
     * Emit to specific client
     */
    emitToClient(clientId: string, eventType: string, data: any): void {
        if (!this.io) return;

        const event: WebSocketEvent = {
            type: eventType,
            data,
            timestamp: new Date()
        };

        this.io.to(clientId).emit(eventType, event);
    }

    // ==================== CONVENIENCE METHODS ====================

    /**
     * Notify new message received
     */
    notifyMessageReceived(contactId: string, message: {
        id: string;
        body: string;
        fromMe: boolean;
        timestamp: Date;
    }): void {
        this.broadcast(WebSocketService.EVENTS.MESSAGE_RECEIVED, {
            contactId,
            message
        });

        // Also emit to contact-specific room
        this.emitToRoom(`contact:${contactId}`, WebSocketService.EVENTS.MESSAGE_RECEIVED, {
            contactId,
            message
        });
    }

    /**
     * Notify message sent
     */
    notifyMessageSent(contactId: string, message: {
        id: string;
        body: string;
        isAI: boolean;
        timestamp: Date;
    }): void {
        this.broadcast(WebSocketService.EVENTS.MESSAGE_SENT, {
            contactId,
            message
        });
    }

    /**
     * Notify contact updated
     */
    notifyContactUpdated(contact: {
        id: string;
        name: string | null;
        isPaused: boolean;
        intimacyLevel: number;
        salesReadiness: number;
    }): void {
        this.broadcast(WebSocketService.EVENTS.CONTACT_UPDATED, { contact });
    }

    /**
     * Notify risk detected
     */
    notifyRiskDetected(alert: {
        contactId: string;
        contactName: string;
        level: string;
        category: string;
        message: string;
    }): void {
        this.broadcast(WebSocketService.EVENTS.RISK_DETECTED, { alert });
    }

    /**
     * Notify metrics update (periodic)
     */
    notifyMetricsUpdate(metrics: {
        messagesReceived: number;
        messagesSent: number;
        activeContacts: number;
        aiResponseRate: number;
    }): void {
        this.broadcast(WebSocketService.EVENTS.METRICS_UPDATE, { metrics });
    }

    /**
     * Notify lead score updated
     */
    notifyLeadScoreUpdated(lead: {
        contactId: string;
        contactName: string;
        oldScore: number;
        newScore: number;
        tier: string;
    }): void {
        this.broadcast(WebSocketService.EVENTS.LEAD_SCORE_UPDATED, { lead });
    }

    /**
     * Notify conversion
     */
    notifyConversion(conversion: {
        contactId: string;
        contactName: string;
        value?: number;
    }): void {
        this.broadcast(WebSocketService.EVENTS.CONVERSION, { conversion });
    }

    // ==================== STATUS METHODS ====================

    /**
     * Get connected clients count
     */
    getConnectedCount(): number {
        return this.clients.size;
    }

    /**
     * Get all connected clients info
     */
    getConnectedClients(): ConnectedClient[] {
        return Array.from(this.clients.values());
    }

    /**
     * Check if service is running
     */
    isRunning(): boolean {
        return this.io !== null;
    }

    /**
     * Get service status
     */
    getStatus(): {
        running: boolean;
        connectedClients: number;
        uptime: number;
    } {
        return {
            running: this.isRunning(),
            connectedClients: this.getConnectedCount(),
            uptime: process.uptime()
        };
    }
    /**
     * Get the Socket.IO server instance
     */
    getIO(): SocketServer | null {
        return this.io;
    }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
    if (!wsInstance) {
        wsInstance = new WebSocketService();
    }
    return wsInstance;
}
