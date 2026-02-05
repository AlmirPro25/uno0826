/**
 * ⏰ SCHEDULER SERVICE (Cron Jobs Inteligentes)
 * Automatiza tarefas cruciais do Ghost Protocol.
 * Executa em horários estratégicos sem intervenção humana.
 */

import * as cron from 'node-cron';
import { MemoryService } from './memory.service';
import { StyleExtractorService } from './style-extractor.service';
import { ObjectionLearnerService } from './objection-learner.service';
import { HunterService } from './hunter.service';
import { WatchdogService } from './watchdog.service';
import { AnalyticsService } from './analytics.service';
import { LogRepository } from '../repositories/log.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ScheduledTask {
    id: string;
    name: string;
    schedule: string; // Cron expression
    description: string;
    lastRun?: Date;
    nextRun?: Date;
    isActive: boolean;
    executionCount: number;
}

export interface TaskResult {
    taskId: string;
    success: boolean;
    duration: number;
    result?: any;
    error?: string;
}

export class SchedulerService {
    private logRepo = new LogRepository();
    private memoryService = new MemoryService();
    private styleExtractor = new StyleExtractorService();
    private objectionLearner = new ObjectionLearnerService();
    private hunterService = new HunterService();
    private watchdogService = new WatchdogService();
    private analyticsService = new AnalyticsService();

    private tasks: Map<string, ScheduledTask> = new Map();
    private cronJobs: Map<string, any> = new Map(); // node-cron ScheduledTask
    private isRunning = false;

    constructor() {
        this.initializeTasks();
    }

    private initializeTasks() {
        // Define all scheduled tasks
        const defaultTasks: ScheduledTask[] = [
            {
                id: 'daily-summary',
                name: 'Resumo Diário',
                schedule: '0 23 * * *', // 23:00 every day
                description: 'Gera resumo diário de todas as conversas do dia',
                isActive: true,
                executionCount: 0
            },
            {
                id: 'style-extraction',
                name: 'Extração de Estilo',
                schedule: '0 3 * * *', // 03:00 every day
                description: 'Atualiza o DNA de escrita do operador',
                isActive: true,
                executionCount: 0
            },
            {
                id: 'objection-learning',
                name: 'Aprendizado de Objeções',
                schedule: '0 4 * * *', // 04:00 every day
                description: 'Analisa conversas e aprende técnicas de vendas',
                isActive: true,
                executionCount: 0
            },
            {
                id: 'cold-reactivation',
                name: 'Reativação de Contatos Frios',
                schedule: '0 10 * * 1-5', // 10:00 Monday-Friday
                description: 'Identifica e envia mensagens para contatos frios',
                isActive: false, // Disabled by default - requires manual activation
                executionCount: 0
            },
            {
                id: 'hot-followup',
                name: 'Follow-up de Leads Quentes',
                schedule: '0 14 * * *', // 14:00 every day
                description: 'Segue contatos com alta prontidão de compra',
                isActive: false,
                executionCount: 0
            },
            {
                id: 'cleanup-alerts',
                name: 'Limpeza de Alertas',
                schedule: '0 5 * * *', // 05:00 every day
                description: 'Remove alertas de risco antigos',
                isActive: true,
                executionCount: 0
            },
            {
                id: 'metrics-export',
                name: 'Exportação de Métricas',
                schedule: '0 0 * * 0', // Sunday at midnight
                description: 'Exporta métricas semanais para backup',
                isActive: true,
                executionCount: 0
            },
            {
                id: 'contact-profiling',
                name: 'Profiling de Contatos',
                schedule: '0 2 * * 0', // Sunday at 02:00
                description: 'Atualiza perfis psicológicos de contatos ativos',
                isActive: true,
                executionCount: 0
            }
        ];

        defaultTasks.forEach(task => this.tasks.set(task.id, task));
    }

    /**
     * Inicia o scheduler
     */
    start(): void {
        if (this.isRunning) return;

        this.logRepo.create('INFO', 'SCHEDULER_STARTED', 'Ghost Protocol Scheduler initialized', undefined);
        console.log('⏰ SCHEDULER: Sistema de tarefas automáticas iniciado');

        this.tasks.forEach((task, id) => {
            if (task.isActive) {
                this.scheduleTask(id);
            }
        });

        this.isRunning = true;
    }

    /**
     * Para o scheduler
     */
    stop(): void {
        this.cronJobs.forEach((job, id) => {
            job.stop();
            console.log(`⏹️ Task stopped: ${id}`);
        });
        this.cronJobs.clear();
        this.isRunning = false;
        this.logRepo.create('INFO', 'SCHEDULER_STOPPED', 'Ghost Protocol Scheduler stopped', undefined);
    }

    /**
     * Agenda uma tarefa
     */
    private scheduleTask(taskId: string): void {
        const task = this.tasks.get(taskId);
        if (!task) return;

        const job = cron.schedule(task.schedule, async () => {
            await this.executeTask(taskId);
        });

        this.cronJobs.set(taskId, job);
        console.log(`✅ Scheduled: ${task.name} (${task.schedule})`);
    }

    /**
     * Executa uma tarefa
     */
    async executeTask(taskId: string): Promise<TaskResult> {
        const task = this.tasks.get(taskId);
        if (!task) {
            return { taskId, success: false, duration: 0, error: 'Task not found' };
        }

        const startTime = Date.now();
        this.logRepo.create('INFO', 'TASK_STARTED', `Executing: ${task.name}`, undefined);

        try {
            let result: any;

            switch (taskId) {
                case 'daily-summary':
                    result = await this.memoryService.generateDailySummary();
                    break;

                case 'style-extraction':
                    result = await this.styleExtractor.extractOperatorDNA();
                    break;

                case 'objection-learning':
                    result = await this.objectionLearner.analyzeAndLearn();
                    break;

                case 'cold-reactivation':
                    result = await this.hunterService.executeCampaign('cold-reactivation', false);
                    break;

                case 'hot-followup':
                    result = await this.hunterService.executeCampaign('hot-followup', false);
                    break;

                case 'cleanup-alerts':
                    result = this.watchdogService.clearOldAlerts(48);
                    break;

                case 'metrics-export':
                    result = await this.analyticsService.exportMetrics();
                    // TODO: Save to file or send to external service
                    break;

                case 'contact-profiling':
                    result = await this.profileActiveContacts();
                    break;

                default:
                    throw new Error(`Unknown task: ${taskId}`);
            }

            const duration = Date.now() - startTime;
            task.lastRun = new Date();
            task.executionCount++;

            this.logRepo.create('INFO', 'TASK_COMPLETED',
                `${task.name} completed in ${duration}ms`, undefined);

            return { taskId, success: true, duration, result };

        } catch (error) {
            const duration = Date.now() - startTime;
            this.logRepo.create('ERROR', 'TASK_FAILED',
                `${task.name} failed: ${(error as Error).message}`, undefined);

            return { taskId, success: false, duration, error: (error as Error).message };
        }
    }

    /**
     * Perfila contatos ativos
     */
    private async profileActiveContacts(): Promise<number> {
        const contacts = await prisma.contact.findMany({
            where: {
                isPaused: false,
                lastInteraction: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            },
            take: 20
        });

        let profiled = 0;
        for (const contact of contacts) {
            await this.memoryService.generateContactProfile(contact.id);
            profiled++;
        }

        return profiled;
    }

    /**
     * Ativa/desativa uma tarefa
     */
    toggleTask(taskId: string, active: boolean): boolean {
        const task = this.tasks.get(taskId);
        if (!task) return false;

        task.isActive = active;

        if (active && this.isRunning) {
            this.scheduleTask(taskId);
        } else {
            const job = this.cronJobs.get(taskId);
            if (job) {
                job.stop();
                this.cronJobs.delete(taskId);
            }
        }

        return true;
    }

    /**
     * Retorna status de todas as tarefas
     */
    getTasksStatus(): ScheduledTask[] {
        return Array.from(this.tasks.values());
    }

    /**
     * Executa tarefa manualmente
     */
    async runNow(taskId: string): Promise<TaskResult> {
        return this.executeTask(taskId);
    }
}

// Singleton instance
let schedulerInstance: SchedulerService | null = null;

export function getScheduler(): SchedulerService {
    if (!schedulerInstance) {
        schedulerInstance = new SchedulerService();
    }
    return schedulerInstance;
}
