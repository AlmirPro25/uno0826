/**
 * 👻 GHOST PROTOCOL API SERVICE
 * Serviço completo para comunicação com o backend.
 * Todas as APIs do sistema em um só lugar.
 */

import { api } from '@/lib/api';

// ==================== TYPES ====================

export interface Contact {
    id: string;
    name: string | null;
    pushName: string | null;
    profilePicUrl: string | null;
    isPaused: boolean;
    lastInteraction: string;

    // Cognitive fields
    semanticProfile: string | null;
    avgResponseTime: number;
    trustLevel: number;
    intimacyLevel: number;
    emotionalState: string;
    engagementScore: number;
    salesReadiness: number;
    lastTone: string;
    replyLatencyProfile: string;

    // Directive fields
    activeDirective: string | null;
    directiveStatus: string;

    // Extra metrics
    totalMessages?: number;
}

export interface Message {
    id: string;
    body: string;
    fromMe: boolean;
    isOperator: boolean;
    timestamp: string;
}

export interface RiskAlert {
    id: string;
    contactId: string;
    contactName: string | null;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskCategory: string;
    detectedPatterns: string[];
    messagePreview: string;
    timestamp: string;
    acknowledged: boolean;
}

export interface ScheduledTask {
    id: string;
    name: string;
    schedule: string;
    description: string;
    lastRun?: string;
    isActive: boolean;
    executionCount: number;
}

export interface ABTest {
    id: string;
    name: string;
    description: string;
    type: string;
    variants: ABTestVariant[];
    isActive: boolean;
    winningVariant?: string;
}

export interface ABTestVariant {
    id: string;
    name: string;
    content: string;
    impressions: number;
    conversions: number;
    conversionRate: number;
}

export interface Webhook {
    id: string;
    name: string;
    url: string;
    type: 'TELEGRAM' | 'DISCORD' | 'SLACK' | 'CUSTOM';
    events: string[];
    isActive: boolean;
}

export interface PresenceState {
    currentMode: string;
    canRespond: boolean;
    responseDelayMultiplier: number;
    suggestedStatus: string;
    nextStateChange?: string;
}

export interface DailyMetrics {
    date: string;
    messagesReceived: number;
    messagesSent: number;
    aiResponses: number;
    humanInterventions: number;
    contactsActive: number;
    riskAlertsCount: number;
}

export interface ConversionMetrics {
    totalContacts: number;
    byStage: {
        cold: number;
        warm: number;
        hot: number;
        converted: number;
    };
    conversionRate: number;
}

export interface HuntingTarget {
    contactId: string;
    name: string | null;
    daysSinceContact: number;
    intimacyLevel: number;
    salesReadiness: number;
    reason: string;
    suggestedOpener: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// ==================== API SERVICE ====================

export const ghostApi = {
    // ========== SYSTEM ==========
    system: {
        getStatus: () => api.get('/system/status'),
        getLogs: (limit = 50) => api.get(`/system/logs?limit=${limit}`),
        getHealth: () => api.get('/system/health'),
    },

    // ========== CONTACTS ==========
    contacts: {
        list: () => api.get<{ contacts: Contact[] }>('/contacts'),
        getHistory: (phone: string) => api.get<{ messages: Message[] }>(`/contacts/${phone}/history`),
        control: (phone: string, action: 'pause' | 'resume' | 'terminate') =>
            api.post(`/contacts/${phone}/control`, { action }),
        injectDirective: (phone: string, directive: string) =>
            api.post(`/contacts/${phone}/directive`, { directive }),
        sendMessage: (phone: string, message: string) =>
            api.post(`/contacts/${phone}/message`, { message }),
    },

    // ========== COGNITIVE ==========
    cognitive: {
        getStyle: () => api.get('/cognitive/style'),
        extractStyle: () => api.post('/cognitive/style/extract'),
        getStylePrompt: () => api.get('/cognitive/style/prompt'),
        generateDailySummary: (date?: string) =>
            api.post('/cognitive/memory/daily-summary', { date }),
        getContactProfile: (contactId: string) =>
            api.get(`/cognitive/memory/contact/${contactId}`),
        getRelevantMemories: (contactId: string) =>
            api.get(`/cognitive/memory/relevant/${contactId}`),
        learnObjections: () => api.post('/cognitive/objections/learn'),
        getObjectionPrompt: () => api.get('/cognitive/objections/prompt'),
        detectObjection: (message: string) =>
            api.post('/cognitive/objections/detect', { message }),
        markObjectionSuccess: (patternId: string) =>
            api.post(`/cognitive/objections/${patternId}/success`),
        getDashboard: () => api.get('/cognitive/dashboard'),
    },

    // ========== OPERATIONS ==========
    operations: {
        // Hunter
        getHuntingTargets: (campaignId?: string) =>
            api.get<{ targets: HuntingTarget[] }>(`/operations/hunter/targets${campaignId ? `?campaignId=${campaignId}` : ''}`),
        getCampaigns: () => api.get('/operations/hunter/campaigns'),
        executeHunting: (campaignId: string, dryRun = true) =>
            api.post('/operations/hunter/execute', { campaignId, dryRun }),
        getHuntingStats: () => api.get('/operations/hunter/stats'),
        generateOpener: (contactId: string, contactName: string) =>
            api.post('/operations/hunter/generate-opener', { contactId, contactName }),

        // Watchdog
        analyzeMessage: (contactId: string, contactName: string | null, messageBody: string) =>
            api.post<{ hasRisk: boolean; alert?: RiskAlert }>('/operations/watchdog/analyze', { contactId, contactName, messageBody }),
        getAlerts: () => api.get<{ alerts: RiskAlert[] }>('/operations/watchdog/alerts'),
        acknowledgeAlert: (alertId: string) =>
            api.post(`/operations/watchdog/alerts/${alertId}/acknowledge`),
        getRiskStats: () => api.get('/operations/watchdog/stats'),
        clearOldAlerts: (olderThanHours = 24) =>
            api.delete(`/operations/watchdog/alerts/old?olderThanHours=${olderThanHours}`),

        // Presence
        getPresenceState: () => api.get<{ state: PresenceState }>('/operations/presence/state'),
        getPresenceProfile: () => api.get('/operations/presence/profile'),
        updatePresenceProfile: (profile: any) =>
            api.put('/operations/presence/profile', profile),
        canRespondNow: () => api.get('/operations/presence/can-respond'),
        adjustDelay: (baseDelayMs: number) =>
            api.post('/operations/presence/adjust-delay', { baseDelayMs }),
        getPresenceStats: () => api.get('/operations/presence/stats'),
        getBusyMessage: () => api.get('/operations/presence/busy-message'),

        getDashboard: () => api.get('/operations/dashboard'),
    },

    // ========== ANALYTICS ==========
    analytics: {
        getToday: () => api.get<{ metrics: DailyMetrics }>('/analytics/today'),
        getConversion: () => api.get<{ metrics: ConversionMetrics }>('/analytics/conversion'),
        getPerformance: () => api.get('/analytics/performance'),
        getContactRanking: (limit = 10) =>
            api.get(`/analytics/contacts/ranking?limit=${limit}`),
        getPeakHours: () => api.get('/analytics/peak-hours'),
        getKeywords: (limit = 20) => api.get(`/analytics/keywords?limit=${limit}`),
        getDashboard: () => api.get('/analytics/dashboard'),
        exportMetrics: () => api.get('/analytics/export'),
    },

    // ========== MEDIA ==========
    media: {
        // Voice
        generateVoice: (text: string, emotion?: string) =>
            api.post('/media/voice/generate', { text, emotion }),
        generateContextualVoice: (text: string, intimacyLevel: number) =>
            api.post('/media/voice/contextual', { text, intimacyLevel }),
        cleanVoiceCache: () => api.delete('/media/voice/cache'),

        // Images
        generateImage: (prompt: string, options?: any) =>
            api.post('/media/image/generate', { prompt, ...options }),
        generateSelfie: (mood?: string, setting?: string) =>
            api.post('/media/image/selfie', { mood, setting }),
        generateVariations: (prompt: string, count = 3) =>
            api.post('/media/image/variations', { prompt, count }),
        cleanImageCache: () => api.delete('/media/image/cache'),
        updatePersona: (persona: any) => api.put('/media/image/persona', persona),
    },

    // ========== ADVANCED ==========
    advanced: {
        // Scheduler
        getSchedulerTasks: () => api.get<{ tasks: ScheduledTask[] }>('/advanced/scheduler/tasks'),
        startScheduler: () => api.post('/advanced/scheduler/start'),
        stopScheduler: () => api.post('/advanced/scheduler/stop'),
        runTask: (taskId: string) => api.post(`/advanced/scheduler/tasks/${taskId}/run`),
        toggleTask: (taskId: string, active: boolean) =>
            api.put(`/advanced/scheduler/tasks/${taskId}/toggle`, { active }),

        // Webhooks
        getWebhooks: () => api.get<{ webhooks: Webhook[] }>('/advanced/webhooks'),
        upsertWebhook: (webhook: Webhook) => api.post('/advanced/webhooks', webhook),
        deleteWebhook: (webhookId: string) => api.delete(`/advanced/webhooks/${webhookId}`),
        toggleWebhook: (webhookId: string, active: boolean) =>
            api.put(`/advanced/webhooks/${webhookId}/toggle`, { active }),
        testWebhook: (webhookId: string) => api.post(`/advanced/webhooks/${webhookId}/test`),

        // A/B Testing
        getABTests: () => api.get<{ tests: ABTest[] }>('/advanced/abtests'),
        getABTestStats: () => api.get('/advanced/abtests/stats'),
        getABTest: (testId: string) => api.get<{ test: ABTest }>(`/advanced/abtests/${testId}`),
        selectVariant: (testId: string) => api.post(`/advanced/abtests/${testId}/select`),
        recordImpression: (testId: string, variantId: string) =>
            api.post(`/advanced/abtests/${testId}/impression`, { variantId }),
        recordConversion: (testId: string, variantId: string) =>
            api.post(`/advanced/abtests/${testId}/conversion`, { variantId }),
        toggleABTest: (testId: string, active: boolean) =>
            api.put(`/advanced/abtests/${testId}/toggle`, { active }),
        resetABTest: (testId: string) => api.post(`/advanced/abtests/${testId}/reset`),
        getWinner: (testId: string) => api.get(`/advanced/abtests/${testId}/winner`),

        getDashboard: () => api.get('/advanced/dashboard'),
    },

    // ========== LEADS & CAMPAIGNS ==========
    leads: {
        getScores: () => api.get('/leads/scores'),
        getScore: (id: string) => api.get(`/leads/scores/${id}`),
        getByTier: (tier: string) => api.get(`/leads/tier/${tier}`),
        getHot: () => api.get('/leads/hot'),
        getCampaigns: () => api.get('/leads/campaigns'),
        getCampaign: (id: string) => api.get(`/leads/campaigns/${id}`),
        executeCampaign: (id: string, dryRun = true) => api.post(`/leads/campaigns/${id}/execute`, { dryRun }),
        setCampaignStatus: (id: string, status: string) => api.put(`/leads/campaigns/${id}/status`, { status }),
        getTemplates: (category?: string) => api.get('/leads/templates', { params: { category } }),
        applyTemplate: (id: string, data: any) => api.post(`/leads/templates/${id}/apply`, data),
        getDashboard: () => api.get('/leads/dashboard'),
    },

    // ========== BACKUP & RESTORE ==========
    backup: {
        list: () => api.get('/backup/list'),
        create: () => api.post('/backup/create'),
        restore: (filename: string) => api.post(`/backup/restore/${filename}`),
        delete: (filename: string) => api.delete(`/backup/${filename}`),
        exportContact: (id: string) => api.post(`/backup/export/contact/${id}`),
        getConfig: () => api.get('/backup/config'),
        updateConfig: (config: any) => api.put('/backup/config', config),
        getStats: () => api.get('/backup/stats'),
    },

    // ========== SYSTEM METRICS ==========
    metrics: {
        get: () => api.get('/metrics'),
        getPrometheus: () => api.get('/metrics/prometheus'),
        getHealth: () => api.get('/metrics/health'),
        getRateLimits: () => api.get('/metrics/rate-limits'),
        getSummary: () => api.get('/metrics/summary'),
        getCounters: () => api.get('/metrics/counters'),
        reset: () => api.post('/metrics/reset'),
    },
};

export default ghostApi;
