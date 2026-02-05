'use client';

import { useEffect, useState } from 'react';
import { ghostApi } from '@/services/ghost-api';
import {
    Database, Download, Upload, Trash2, RefreshCw,
    Clock, HardDrive, CheckCircle, XCircle, AlertCircle,
    FileText, Users, MessageSquare, Calendar
} from 'lucide-react';

interface Backup {
    filename: string;
    createdAt: string;
    size: number;
    stats?: {
        contacts: number;
        messages: number;
        personas: number;
        logs: number;
    };
}

interface BackupStats {
    enabled: boolean;
    totalBackups: number;
    totalSize: number;
    lastBackup: string | null;
    needsBackup: boolean;
    storageUsed: string;
}

export default function BackupsPage() {
    const [backups, setBackups] = useState<Backup[]>([]);
    const [stats, setStats] = useState<BackupStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [restoring, setRestoring] = useState<string | null>(null);

    useEffect(() => {
        loadBackups();
    }, []);

    const loadBackups = async () => {
        setLoading(true);
        try {
            // In production this would call the API
            // const res = await ghostApi.backup.list();

            // Mock data
            setBackups([
                {
                    filename: 'ghost-backup-2026-01-24T08-00-00.json',
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    size: 2548000,
                    stats: { contacts: 25, messages: 1200, personas: 3, logs: 500 }
                },
                {
                    filename: 'ghost-backup-2026-01-23T08-00-00.json',
                    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
                    size: 2340000,
                    stats: { contacts: 24, messages: 1150, personas: 3, logs: 450 }
                },
                {
                    filename: 'ghost-backup-2026-01-22T08-00-00.json',
                    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
                    size: 2100000,
                    stats: { contacts: 22, messages: 980, personas: 3, logs: 400 }
                }
            ]);

            setStats({
                enabled: true,
                totalBackups: 3,
                totalSize: 6988000,
                lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                needsBackup: false,
                storageUsed: '6.67 MB'
            });
        } catch (error) {
            console.error('Failed to load backups:', error);
        } finally {
            setLoading(false);
        }
    };

    const createBackup = async () => {
        setCreating(true);
        try {
            // await ghostApi.backup.create();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate

            const newBackup: Backup = {
                filename: `ghost-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
                createdAt: new Date().toISOString(),
                size: 2600000,
                stats: { contacts: 26, messages: 1250, personas: 3, logs: 520 }
            };

            setBackups(prev => [newBackup, ...prev]);
        } catch (error) {
            console.error('Failed to create backup:', error);
        } finally {
            setCreating(false);
        }
    };

    const restoreBackup = async (filename: string) => {
        if (!confirm('Are you sure you want to restore this backup? Current data will be overwritten.')) {
            return;
        }

        setRestoring(filename);
        try {
            // await ghostApi.backup.restore(filename);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate
            alert('Backup restored successfully!');
        } catch (error) {
            console.error('Failed to restore backup:', error);
            alert('Failed to restore backup');
        } finally {
            setRestoring(null);
        }
    };

    const deleteBackup = async (filename: string) => {
        if (!confirm('Are you sure you want to delete this backup?')) {
            return;
        }

        try {
            // await ghostApi.backup.delete(filename);
            setBackups(prev => prev.filter(b => b.filename !== filename));
        } catch (error) {
            console.error('Failed to delete backup:', error);
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeSince = (dateStr: string): string => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return 'Just now';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <Database className="w-8 h-8 text-emerald-400" />
                            Backups
                        </h1>
                        <p className="text-gray-400 mt-1">Database backup and recovery</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={loadBackups}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={createBackup}
                            disabled={creating}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 rounded-lg text-white font-medium transition-colors"
                        >
                            {creating ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</>
                            ) : (
                                <><Download className="w-4 h-4" /> Create Backup</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            icon={Database}
                            label="Total Backups"
                            value={stats.totalBackups.toString()}
                            color="emerald"
                        />
                        <StatCard
                            icon={HardDrive}
                            label="Storage Used"
                            value={stats.storageUsed}
                            color="blue"
                        />
                        <StatCard
                            icon={Clock}
                            label="Last Backup"
                            value={stats.lastBackup ? getTimeSince(stats.lastBackup) : 'Never'}
                            color="purple"
                        />
                        <StatCard
                            icon={stats.needsBackup ? AlertCircle : CheckCircle}
                            label="Backup Status"
                            value={stats.needsBackup ? 'Needed' : 'Up to date'}
                            color={stats.needsBackup ? 'yellow' : 'green'}
                        />
                    </div>
                )}

                {/* Backups List */}
                <div className="space-y-4">
                    {backups.length === 0 ? (
                        <div className="text-center py-12 bg-black/40 rounded-xl border border-gray-700">
                            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl text-white mb-2">No backups yet</h3>
                            <p className="text-gray-500 mb-4">Create your first backup to protect your data</p>
                            <button
                                onClick={createBackup}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium"
                            >
                                Create First Backup
                            </button>
                        </div>
                    ) : (
                        backups.map((backup, i) => (
                            <div
                                key={backup.filename}
                                className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-xl p-5"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-emerald-500/20' : 'bg-gray-700'
                                            }`}>
                                            <FileText className={`w-6 h-6 ${i === 0 ? 'text-emerald-400' : 'text-gray-400'}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium flex items-center gap-2">
                                                {backup.filename}
                                                {i === 0 && (
                                                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                                                        LATEST
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-4 text-gray-500 text-sm mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(backup.createdAt)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <HardDrive className="w-3 h-3" />
                                                    {formatBytes(backup.size)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => restoreBackup(backup.filename)}
                                            disabled={restoring === backup.filename}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 transition-colors disabled:opacity-50"
                                        >
                                            {restoring === backup.filename ? (
                                                <><RefreshCw className="w-4 h-4 animate-spin" /> Restoring...</>
                                            ) : (
                                                <><Upload className="w-4 h-4" /> Restore</>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteBackup(backup.filename)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Stats */}
                                {backup.stats && (
                                    <div className="flex gap-6 mt-4 pt-4 border-t border-gray-700/50">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <Users className="w-4 h-4" />
                                            <span>{backup.stats.contacts} contacts</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{backup.stats.messages.toLocaleString()} messages</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <FileText className="w-4 h-4" />
                                            <span>{backup.stats.logs} logs</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Auto Backup Settings */}
                <div className="mt-8 bg-black/40 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                    <h3 className="text-white font-semibold mb-4">Automatic Backup Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Backup Interval</label>
                            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                                <option value="6">Every 6 hours</option>
                                <option value="12">Every 12 hours</option>
                                <option value="24" selected>Every 24 hours</option>
                                <option value="48">Every 48 hours</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Keep Last N Backups</label>
                            <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                                <option value="3">3 backups</option>
                                <option value="5">5 backups</option>
                                <option value="7" selected>7 backups</option>
                                <option value="14">14 backups</option>
                            </select>
                        </div>
                    </div>
                    <button className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: {
    icon: any;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className={`bg-${color}-500/10 border border-${color}-500/30 rounded-xl p-4`}>
            <Icon className={`w-5 h-5 text-${color}-400 mb-2`} />
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-gray-500 text-sm">{label}</div>
        </div>
    );
}
