/**
 * 💾 BACKUP SERVICE
 * Sistema de backup automático do banco de dados.
 * Exporta conversas, contatos e configurações.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { LogRepository } from '../repositories/log.repository';

const prisma = new PrismaClient();

export interface BackupConfig {
    enabled: boolean;
    intervalHours: number;
    maxBackups: number;
    backupPath: string;
    includeMessages: boolean;
    includeMedia: boolean;
}

export interface BackupResult {
    success: boolean;
    filename?: string;
    size?: number;
    duration?: number;
    error?: string;
    stats?: {
        contacts: number;
        messages: number;
        personas: number;
        logs: number;
    };
}

export interface BackupFile {
    filename: string;
    createdAt: Date;
    size: number;
    stats: BackupResult['stats'];
}

export class BackupService {
    private logRepo = new LogRepository();
    private config: BackupConfig = {
        enabled: true,
        intervalHours: 24,
        maxBackups: 7,
        backupPath: './backups',
        includeMessages: true,
        includeMedia: false
    };

    constructor() {
        this.ensureBackupDirectory();
    }

    private ensureBackupDirectory(): void {
        if (!fs.existsSync(this.config.backupPath)) {
            fs.mkdirSync(this.config.backupPath, { recursive: true });
        }
    }

    /**
     * Configura o serviço de backup
     */
    configure(config: Partial<BackupConfig>): void {
        this.config = { ...this.config, ...config };
        this.ensureBackupDirectory();
    }

    /**
     * Executa backup completo
     */
    async createBackup(): Promise<BackupResult> {
        const startTime = Date.now();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `ghost-backup-${timestamp}.json`;
        const filepath = path.join(this.config.backupPath, filename);

        try {
            this.logRepo.create('INFO', 'BACKUP_STARTED', 'Creating backup...', undefined);

            // Collect all data
            const backup: any = {
                version: '5.0',
                createdAt: new Date().toISOString(),
                type: 'FULL',
                data: {}
            };

            // Contacts
            const contacts = await prisma.contact.findMany();
            backup.data.contacts = contacts;

            // Messages (if enabled)
            let messages: any[] = [];
            if (this.config.includeMessages) {
                messages = await prisma.message.findMany({
                    orderBy: { timestamp: 'desc' },
                    take: 50000 // Limit to last 50k messages
                });
                backup.data.messages = messages;
            }

            // Personas
            const personas = await prisma.persona.findMany();
            backup.data.personas = personas;

            // Operator Styles
            const styles = await prisma.operatorStyle.findMany();
            backup.data.operatorStyles = styles;

            // Memory Summaries
            const memories = await prisma.memorySummary.findMany();
            backup.data.memorySummaries = memories;

            // Objection Patterns
            const objections = await prisma.objectionPattern.findMany();
            backup.data.objectionPatterns = objections;

            // Logs (last 1000)
            const logs = await prisma.systemLog.findMany({
                orderBy: { id: 'desc' },
                take: 1000
            });
            backup.data.logs = logs;

            // Write to file
            const jsonContent = JSON.stringify(backup, null, 2);
            fs.writeFileSync(filepath, jsonContent);

            const stats = fs.statSync(filepath);
            const duration = Date.now() - startTime;

            // Cleanup old backups
            await this.cleanupOldBackups();

            const result: BackupResult = {
                success: true,
                filename,
                size: stats.size,
                duration,
                stats: {
                    contacts: contacts.length,
                    messages: messages.length,
                    personas: personas.length,
                    logs: logs.length
                }
            };

            this.logRepo.create('INFO', 'BACKUP_COMPLETED',
                `Backup created: ${filename} (${this.formatBytes(stats.size)}) in ${duration}ms`, undefined);

            return result;

        } catch (error) {
            const errorMessage = (error as Error).message;
            this.logRepo.create('ERROR', 'BACKUP_FAILED', errorMessage, undefined);

            return {
                success: false,
                error: errorMessage,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * Restaura backup
     */
    async restoreBackup(filename: string): Promise<{
        success: boolean;
        restored?: BackupResult['stats'];
        error?: string;
    }> {
        const filepath = path.join(this.config.backupPath, filename);

        try {
            if (!fs.existsSync(filepath)) {
                throw new Error('Backup file not found');
            }

            this.logRepo.create('INFO', 'RESTORE_STARTED', `Restoring from ${filename}`, undefined);

            const content = fs.readFileSync(filepath, 'utf-8');
            const backup = JSON.parse(content);

            // Restore contacts
            if (backup.data.contacts) {
                for (const contact of backup.data.contacts) {
                    await prisma.contact.upsert({
                        where: { id: contact.id },
                        update: contact,
                        create: contact
                    });
                }
            }

            // Restore personas
            if (backup.data.personas) {
                for (const persona of backup.data.personas) {
                    await prisma.persona.upsert({
                        where: { id: persona.id },
                        update: persona,
                        create: persona
                    });
                }
            }

            // Restore operator styles
            if (backup.data.operatorStyles) {
                for (const style of backup.data.operatorStyles) {
                    await prisma.operatorStyle.upsert({
                        where: { id: style.id },
                        update: style,
                        create: style
                    });
                }
            }

            // Restore memory summaries
            if (backup.data.memorySummaries) {
                for (const memory of backup.data.memorySummaries) {
                    await prisma.memorySummary.upsert({
                        where: { id: memory.id },
                        update: memory,
                        create: memory
                    });
                }
            }

            // Restore objection patterns
            if (backup.data.objectionPatterns) {
                for (const pattern of backup.data.objectionPatterns) {
                    await prisma.objectionPattern.upsert({
                        where: { id: pattern.id },
                        update: pattern,
                        create: pattern
                    });
                }
            }

            this.logRepo.create('INFO', 'RESTORE_COMPLETED', `Restored from ${filename}`, undefined);

            return {
                success: true,
                restored: {
                    contacts: backup.data.contacts?.length || 0,
                    messages: backup.data.messages?.length || 0,
                    personas: backup.data.personas?.length || 0,
                    logs: backup.data.logs?.length || 0
                }
            };

        } catch (error) {
            const errorMessage = (error as Error).message;
            this.logRepo.create('ERROR', 'RESTORE_FAILED', errorMessage, undefined);

            return {
                success: false,
                error: errorMessage
            };
        }
    }

    /**
     * Lista backups disponíveis
     */
    listBackups(): BackupFile[] {
        const files = fs.readdirSync(this.config.backupPath)
            .filter(f => f.startsWith('ghost-backup-') && f.endsWith('.json'));

        return files.map(filename => {
            const filepath = path.join(this.config.backupPath, filename);
            const stats = fs.statSync(filepath);

            // Try to read stats from file
            let backupStats: BackupResult['stats'] | undefined;
            try {
                const content = fs.readFileSync(filepath, 'utf-8');
                const backup = JSON.parse(content);
                backupStats = {
                    contacts: backup.data.contacts?.length || 0,
                    messages: backup.data.messages?.length || 0,
                    personas: backup.data.personas?.length || 0,
                    logs: backup.data.logs?.length || 0
                };
            } catch {
                // Ignore parsing errors
            }

            return {
                filename,
                createdAt: stats.birthtime,
                size: stats.size,
                stats: backupStats
            };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Remove backups antigos
     */
    private async cleanupOldBackups(): Promise<number> {
        const backups = this.listBackups();
        const toDelete = backups.slice(this.config.maxBackups);

        let deleted = 0;
        for (const backup of toDelete) {
            const filepath = path.join(this.config.backupPath, backup.filename);
            try {
                fs.unlinkSync(filepath);
                deleted++;
            } catch (error) {
                console.error(`Failed to delete old backup: ${backup.filename}`);
            }
        }

        if (deleted > 0) {
            this.logRepo.create('INFO', 'BACKUP_CLEANUP',
                `Cleaned up ${deleted} old backups`, undefined);
        }

        return deleted;
    }

    /**
     * Exporta apenas conversas de um contato
     */
    async exportContactConversation(contactId: string): Promise<string> {
        const contact = await prisma.contact.findUnique({
            where: { id: contactId },
            include: { messages: true }
        });

        if (!contact) throw new Error('Contact not found');

        const export_data = {
            contact: {
                name: contact.name,
                phone: contact.id, // id is the phone (e.g., 551199999999@c.us)
                intimacyLevel: contact.intimacyLevel,
                totalMessages: contact.messages.length
            },
            messages: contact.messages.map(m => ({
                body: m.body,
                fromMe: m.fromMe,
                timestamp: m.timestamp
            })),
            exportedAt: new Date().toISOString()
        };

        const filename = `conversation-${contact.id.replace('@c.us', '')}-${Date.now()}.json`;
        const filepath = path.join(this.config.backupPath, filename);

        fs.writeFileSync(filepath, JSON.stringify(export_data, null, 2));

        return filename;
    }

    /**
     * Deleta um backup específico
     */
    deleteBackup(filename: string): boolean {
        const filepath = path.join(this.config.backupPath, filename);

        if (!fs.existsSync(filepath)) return false;

        try {
            fs.unlinkSync(filepath);
            this.logRepo.create('INFO', 'BACKUP_DELETED', `Deleted backup: ${filename}`, undefined);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Obtém última hora de backup
     */
    getLastBackupTime(): Date | null {
        const backups = this.listBackups();
        if (backups.length === 0) return null;
        return backups[0].createdAt;
    }

    /**
     * Verifica se precisa de backup
     */
    needsBackup(): boolean {
        const lastBackup = this.getLastBackupTime();
        if (!lastBackup) return true;

        const hoursSinceLast = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
        return hoursSinceLast >= this.config.intervalHours;
    }

    /**
     * Obtém configuração atual
     */
    getConfig(): BackupConfig {
        return { ...this.config };
    }

    /**
     * Formata bytes para leitura
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Estatísticas do sistema de backup
     */
    getStats(): {
        enabled: boolean;
        totalBackups: number;
        totalSize: number;
        lastBackup: Date | null;
        needsBackup: boolean;
        storageUsed: string;
    } {
        const backups = this.listBackups();
        const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

        return {
            enabled: this.config.enabled,
            totalBackups: backups.length,
            totalSize,
            lastBackup: this.getLastBackupTime(),
            needsBackup: this.needsBackup(),
            storageUsed: this.formatBytes(totalSize)
        };
    }
}
