'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { useToast, ConfirmModal, Skeleton, EmptyState } from '@/components/ui';
import { backupAPI, BackupInfo } from '@/api/backup';
import { 
  Database, 
  Download, 
  Trash2, 
  RefreshCw, 
  Plus, 
  HardDrive,
  Clock,
  FileArchive,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const toast = useToast();

  const loadBackups = async () => {
    try {
      const data = await backupAPI.listBackups();
      setBackups(data.backups || []);
    } catch (error) {
      toast.error('Erro ao carregar backups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const result = await backupAPI.createBackup('full');
      toast.success(result.message);
      loadBackups();
    } catch (error) {
      toast.error('Erro ao criar backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      await backupAPI.downloadBackup(filename);
      toast.success('Download iniciado');
    } catch (error) {
      toast.error('Erro ao baixar backup');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await backupAPI.deleteBackup(deleteTarget);
      toast.success('Backup deletado');
      setDeleteTarget(null);
      loadBackups();
    } catch (error) {
      toast.error('Erro ao deletar backup');
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      const result = await backupAPI.restoreBackup(restoreTarget);
      toast.success(`Backup restaurado! Tabelas: ${result.restoredTables.join(', ')}`);
      setRestoreTarget(null);
    } catch (error) {
      toast.error('Erro ao restaurar backup');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              Backups do Sistema
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie os backups do banco de dados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBackups} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={handleCreateBackup} disabled={creating}>
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Backup
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Backups</p>
                  <p className="text-2xl font-bold">{backups.length}</p>
                </div>
                <FileArchive className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Espaço Utilizado</p>
                  <p className="text-2xl font-bold">{formatFileSize(totalSize)}</p>
                </div>
                <HardDrive className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Último Backup</p>
                  <p className="text-2xl font-bold">
                    {backups.length > 0 
                      ? format(new Date(backups[0].createdAt), 'dd/MM', { locale: ptBR })
                      : '-'
                    }
                  </p>
                </div>
                <Clock className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup List */}
        <Card>
          <CardHeader>
            <CardTitle>Backups Disponíveis</CardTitle>
            <CardDescription>
              Clique para baixar ou restaurar um backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : backups.length === 0 ? (
              <EmptyState
                icon={Database}
                title="Nenhum backup encontrado"
                description="Crie seu primeiro backup para proteger seus dados"
                action={{
                  label: "Criar Backup",
                  onClick: handleCreateBackup
                }}
              />
            ) : (
              <div className="space-y-3">
                {backups.map((backup, index) => (
                  <motion.div
                    key={backup.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileArchive className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{backup.filename}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatFileSize(backup.size)}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(backup.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{backup.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(backup.filename)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRestoreTarget(backup.filename)}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(backup.filename)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Importante sobre Backups
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                  <li>• Recomendamos fazer backups diários em produção</li>
                  <li>• Armazene backups em local seguro fora do servidor</li>
                  <li>• Teste a restauração periodicamente</li>
                  <li>• Backups antigos são automaticamente removidos após 30 dias</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deletar Backup"
        message="Tem certeza que deseja deletar este backup? Esta ação não pode ser desfeita."
        confirmText="Deletar"
        variant="destructive"
      />

      {/* Restore Confirmation */}
      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restaurar Backup"
        message="Tem certeza que deseja restaurar este backup? Os dados atuais serão substituídos."
        confirmText="Restaurar"
        variant="destructive"
      />
    </>
  );
}
