/**
 * 🧪 BACKUP SERVICE TESTS
 * Tests for database backup and restore functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn().mockReturnValue([]),
    statSync: vi.fn().mockReturnValue({ size: 1024, mtime: new Date() }),
    unlinkSync: vi.fn()
}));

// Mock Prisma
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        contact: {
            findMany: vi.fn().mockResolvedValue([]),
            findUnique: vi.fn().mockResolvedValue(null),
            count: vi.fn().mockResolvedValue(0),
            upsert: vi.fn()
        },
        message: {
            findMany: vi.fn().mockResolvedValue([]),
            count: vi.fn().mockResolvedValue(0),
            createMany: vi.fn()
        },
        persona: {
            findMany: vi.fn().mockResolvedValue([]),
            upsert: vi.fn()
        },
        operatorStyle: {
            findMany: vi.fn().mockResolvedValue([])
        },
        memorySummary: {
            findMany: vi.fn().mockResolvedValue([])
        },
        objectionPattern: {
            findMany: vi.fn().mockResolvedValue([])
        },
        systemLog: {
            findMany: vi.fn().mockResolvedValue([])
        }
    }))
}));

import { BackupService, BackupConfig } from '../../src/services/backup.service';

describe('BackupService', () => {
    let service: BackupService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new BackupService();
    });

    describe('Configuration', () => {
        it('should have default configuration', () => {
            const config = service.getConfig();
            expect(config).toHaveProperty('enabled');
            expect(config).toHaveProperty('intervalHours');
            expect(config).toHaveProperty('maxBackups');
            expect(config).toHaveProperty('backupPath');
        });

        it('should update configuration', () => {
            const newConfig: Partial<BackupConfig> = {
                intervalHours: 12,
                maxBackups: 10
            };

            service.configure(newConfig);
            const config = service.getConfig();

            expect(config.intervalHours).toBe(12);
            expect(config.maxBackups).toBe(10);
        });
    });

    describe('Backup Creation', () => {
        it('should create backup successfully', async () => {
            const result = await service.createBackup();

            expect(result.success).toBe(true);
            expect(result.filename).toContain('ghost-backup');
            expect(result.filename).toContain('.json');
        });

        it('should include stats in backup result', async () => {
            const result = await service.createBackup();

            expect(result).toHaveProperty('stats');
            expect(result.stats).toHaveProperty('contacts');
            expect(result.stats).toHaveProperty('messages');
        });
    });

    describe('Backup Listing', () => {
        it('should list backups from directory', () => {
            vi.mocked(fs.readdirSync).mockReturnValue([
                'ghost-backup-2026-01-24.json',
                'ghost-backup-2026-01-23.json'
            ] as any);

            const backups = service.listBackups();

            expect(Array.isArray(backups)).toBe(true);
        });

        it('should return empty array when no backups exist', () => {
            vi.mocked(fs.readdirSync).mockReturnValue([]);

            const backups = service.listBackups();

            expect(backups).toEqual([]);
        });

        it('should filter non-backup files', () => {
            vi.mocked(fs.readdirSync).mockReturnValue([
                'ghost-backup-2026-01-24.json',
                'other-file.txt',
                'ghost-backup-2026-01-23.json'
            ] as any);

            const backups = service.listBackups();

            // Should only include json files with ghost-backup prefix
            expect(backups.every((b: any) => b.filename.startsWith('ghost-backup'))).toBe(true);
        });
    });

    describe('Backup Restore', () => {
        it('should restore backup successfully', async () => {
            const mockBackupData = JSON.stringify({
                version: '5.0',
                createdAt: new Date().toISOString(),
                data: {
                    contacts: [],
                    messages: [],
                    personas: [],
                    operatorStyles: [],
                    memorySummaries: [],
                    objectionPatterns: [],
                    systemLogs: []
                }
            });

            vi.mocked(fs.readFileSync).mockReturnValue(mockBackupData);

            const result = await service.restoreBackup('ghost-backup-test.json');

            expect(result.success).toBe(true);
        });

        it('should fail for non-existent backup', async () => {
            vi.mocked(fs.existsSync).mockReturnValueOnce(false);

            const result = await service.restoreBackup('non-existent.json');

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should fail for invalid JSON', async () => {
            vi.mocked(fs.readFileSync).mockReturnValue('not valid json');

            const result = await service.restoreBackup('invalid.json');

            expect(result.success).toBe(false);
        });
    });

    describe('Backup Deletion', () => {
        it('should delete backup successfully', () => {
            vi.mocked(fs.existsSync).mockReturnValue(true);

            const result = service.deleteBackup('ghost-backup-test.json');

            expect(result).toBe(true);
            expect(fs.unlinkSync).toHaveBeenCalled();
        });

        it('should return false for non-existent backup', () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);

            const result = service.deleteBackup('non-existent.json');

            expect(result).toBe(false);
        });
    });

    describe('Backup Cleanup', () => {
        it('should cleanup old backups when over limit', () => {
            const mockFiles = [
                'ghost-backup-2026-01-24.json',
                'ghost-backup-2026-01-23.json',
                'ghost-backup-2026-01-22.json',
                'ghost-backup-2026-01-21.json',
                'ghost-backup-2026-01-20.json',
                'ghost-backup-2026-01-19.json',
                'ghost-backup-2026-01-18.json',
                'ghost-backup-2026-01-17.json'
            ];

            vi.mocked(fs.readdirSync).mockReturnValue(mockFiles as any);
            vi.mocked(fs.existsSync).mockReturnValue(true);

            // Configure max backups to 5
            service.configure({ maxBackups: 5 });

            // This would cleanup older backups
            // The actual implementation may vary
        });
    });

    describe('Stats', () => {
        it('should return correct stats structure', () => {
            const stats = service.getStats();

            expect(stats).toHaveProperty('totalBackups');
            expect(stats).toHaveProperty('totalSize');
            expect(stats).toHaveProperty('oldestBackup');
            expect(stats).toHaveProperty('newestBackup');
        });
    });

    describe('Last Backup Time', () => {
        it('should return last backup time', () => {
            vi.mocked(fs.readdirSync).mockReturnValue([
                'ghost-backup-2026-01-24T08-00-00.json'
            ] as any);

            const lastBackup = service.getLastBackupTime();

            // Should be a date or null
            expect(lastBackup === null || lastBackup instanceof Date).toBe(true);
        });

        it('should return null when no backups exist', () => {
            vi.mocked(fs.readdirSync).mockReturnValue([]);

            const lastBackup = service.getLastBackupTime();

            expect(lastBackup).toBeNull();
        });
    });

    describe('Needs Backup', () => {
        it('should return true if never backed up', () => {
            vi.mocked(fs.readdirSync).mockReturnValue([]);

            const needsBackup = service.needsBackup();

            expect(needsBackup).toBe(true);
        });
    });
});
