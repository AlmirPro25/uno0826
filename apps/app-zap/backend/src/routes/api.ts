import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { SystemController } from '../controllers/system.controller';
import { CognitiveController } from '../controllers/cognitive.controller';
import { OperationsController } from '../controllers/operations.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { MediaController } from '../controllers/media.controller';
import { AdvancedController } from '../controllers/advanced.controller';
import { SovereignChatController } from '../controllers/sovereign-chat.controller';
import leadsController from '../controllers/leads.controller';
import backupController from '../controllers/backup.controller';
import metricsController from '../controllers/metrics.controller';
import { AuthController } from '../auth/auth.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

// Public Auth Route (no authentication required for login)
router.post('/auth/login', AuthController.login);

// Apply authentication middleware to all routes below this line
router.use(authMiddleware);

// System
router.get('/system/status', SystemController.getStatus);
router.get('/system/logs', SystemController.getLogs);
router.get('/system/health', SystemController.getHealth);

// Contacts
router.get('/contacts', ContactController.list);
router.get('/contacts/:phone/history', ContactController.getHistory);
router.post('/contacts/:phone/control', ContactController.control);
router.post('/contacts/:phone/directive', ContactController.injectDirective);
router.post('/contacts/:phone/message', ContactController.sendMessage);

// 🧠 COGNITIVE API (Hyper-Cognition System)
// DNA Style Style Extraction
router.get('/cognitive/style', CognitiveController.getOperatorStyle);
router.post('/cognitive/style/extract', CognitiveController.extractStyle);
router.get('/cognitive/style/prompt', CognitiveController.getStylePrompt);

// Long-term Memory
router.post('/cognitive/memory/daily-summary', CognitiveController.generateDailySummary);
router.get('/cognitive/memory/contact/:contactId', CognitiveController.getContactProfile);
router.get('/cognitive/memory/relevant/:contactId', CognitiveController.getRelevantMemories);

// Objection Learning (Sales IQ)
router.post('/cognitive/objections/learn', CognitiveController.learnObjections);
router.get('/cognitive/objections/prompt', CognitiveController.getObjectionPrompt);
router.post('/cognitive/objections/detect', CognitiveController.detectObjection);
router.post('/cognitive/objections/:patternId/success', CognitiveController.markObjectionSuccess);

// Cognitive Dashboard
router.get('/cognitive/dashboard', CognitiveController.getCognitiveDashboard);

// 🎯 OPERATIONS API (Hunter, Watchdog, Presence)

// Hunter - Proactive Outreach
router.get('/operations/hunter/targets', OperationsController.getHuntingTargets);
router.get('/operations/hunter/campaigns', OperationsController.getHuntingCampaigns);
router.post('/operations/hunter/execute', OperationsController.executeHuntingCampaign);
router.get('/operations/hunter/stats', OperationsController.getHuntingStats);
router.post('/operations/hunter/generate-opener', OperationsController.generateOpener);

// Watchdog - Risk Monitoring
router.post('/operations/watchdog/analyze', OperationsController.analyzeMessage);
router.get('/operations/watchdog/alerts', OperationsController.getAlerts);
router.post('/operations/watchdog/alerts/:alertId/acknowledge', OperationsController.acknowledgeAlert);
router.get('/operations/watchdog/stats', OperationsController.getRiskStats);
router.delete('/operations/watchdog/alerts/old', OperationsController.clearOldAlerts);

// Presence - Activity Management
router.get('/operations/presence/state', OperationsController.getPresenceState);
router.get('/operations/presence/profile', OperationsController.getPresenceProfile);
router.put('/operations/presence/profile', OperationsController.updatePresenceProfile);
router.get('/operations/presence/can-respond', OperationsController.canRespondNow);
router.post('/operations/presence/adjust-delay', OperationsController.adjustDelay);
router.get('/operations/presence/stats', OperationsController.getPresenceStats);
router.get('/operations/presence/busy-message', OperationsController.getBusyMessage);

// Operations Dashboard
router.get('/operations/dashboard', OperationsController.getOperationalDashboard);

// 📊 ANALYTICS API
router.get('/analytics/today', AnalyticsController.getTodayMetrics);
router.get('/analytics/conversion', AnalyticsController.getConversionMetrics);
router.get('/analytics/performance', AnalyticsController.getPerformanceMetrics);
router.get('/analytics/contacts/ranking', AnalyticsController.getContactRanking);
router.get('/analytics/peak-hours', AnalyticsController.getPeakHours);
router.get('/analytics/keywords', AnalyticsController.getTopKeywords);
router.get('/analytics/dashboard', AnalyticsController.getFullDashboard);
router.get('/analytics/export', AnalyticsController.exportMetrics);

// 🎙️ MEDIA API (Voice & Image Generation)
// Voice (TTS)
router.post('/media/voice/generate', MediaController.generateVoice);
router.post('/media/voice/contextual', MediaController.generateContextualVoice);
router.delete('/media/voice/cache', MediaController.cleanVoiceCache);

// Images (Imagen 4)
router.post('/media/image/generate', MediaController.generateImage);
router.post('/media/image/selfie', MediaController.generateSelfie);
router.post('/media/image/variations', MediaController.generateVariations);
router.delete('/media/image/cache', MediaController.cleanImageCache);
router.put('/media/image/persona', MediaController.updatePersona);

// ⚙️ ADVANCED API (Scheduler, Webhooks, A/B Testing)
// Scheduler
router.get('/advanced/scheduler/tasks', AdvancedController.getSchedulerTasks);
router.post('/advanced/scheduler/start', AdvancedController.startScheduler);
router.post('/advanced/scheduler/stop', AdvancedController.stopScheduler);
router.post('/advanced/scheduler/tasks/:taskId/run', AdvancedController.runTask);
router.put('/advanced/scheduler/tasks/:taskId/toggle', AdvancedController.toggleTask);

// Webhooks
router.get('/advanced/webhooks', AdvancedController.listWebhooks);
router.post('/advanced/webhooks', AdvancedController.upsertWebhook);
router.delete('/advanced/webhooks/:webhookId', AdvancedController.deleteWebhook);
router.put('/advanced/webhooks/:webhookId/toggle', AdvancedController.toggleWebhook);
router.post('/advanced/webhooks/:webhookId/test', AdvancedController.testWebhook);

// A/B Testing
router.get('/advanced/abtests', AdvancedController.listABTests);
router.get('/advanced/abtests/stats', AdvancedController.getABTestStats);
router.get('/advanced/abtests/:testId', AdvancedController.getABTest);
router.post('/advanced/abtests/:testId/select', AdvancedController.selectVariant);
router.post('/advanced/abtests/:testId/impression', AdvancedController.recordImpression);
router.post('/advanced/abtests/:testId/conversion', AdvancedController.recordConversion);
router.put('/advanced/abtests/:testId/toggle', AdvancedController.toggleABTest);
router.post('/advanced/abtests/:testId/reset', AdvancedController.resetABTest);
router.get('/advanced/abtests/:testId/winner', AdvancedController.getWinner);

// Advanced Dashboard
router.get('/advanced/dashboard', AdvancedController.getAdvancedDashboard);

// 💎 LEADS API
router.use('/leads', leadsController);

// 💾 BACKUP API
router.use('/backup', backupController);

// 📈 METRICS API
router.use('/metrics', metricsController);

// 👑 SOVEREIGN CHAT API (Natural Language Command Interface)
router.post('/sovereign/chat', SovereignChatController.chat);
router.get('/sovereign/history', SovereignChatController.getHistory);
router.delete('/sovereign/session', SovereignChatController.clearSession);
router.get('/sovereign/status', SovereignChatController.getStatus);
router.post('/sovereign/quick-action', SovereignChatController.quickAction);

export default router;




