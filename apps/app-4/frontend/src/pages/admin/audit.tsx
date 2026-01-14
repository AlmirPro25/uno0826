import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Input } from '@/components/ui/shadcn/Input';
import { Label } from '@/components/ui/shadcn/Label';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
  getAuditLogs,
  AuditLog,
  getActionLabel,
  getEntityTypeLabel,
} from '@/api/audit';
import {
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Activity,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuditLogsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {
        limit,
        offset: page * limit,
      };
      if (filters.action) params.action = filters.action;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const data = await getAuditLogs(params);
      setLogs(data.logs || []);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      loadLogs();
    }
  }, [isAuthenticated, user, page]);

  const handleSearch = () => {
    setPage(0);
    loadLogs();
  };

  const totalPages = Math.ceil(total / limit);

  const getActionColor = (action: string): string => {
    if (action.includes('DELETE') || action.includes('CANCEL') || action.includes('FAILED')) {
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    }
    if (action.includes('CREATE') || action.includes('BOOK') || action.includes('COMPLETE')) {
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    }
    if (action.includes('UPDATE') || action.includes('CHANGE')) {
      return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    }
    return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Logs de Auditoria
          </h1>
          <p className="text-muted-foreground">
            Rastreamento de todas as ações no sistema
          </p>
        </div>
      </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="action">Ação</Label>
                <Input
                  id="action"
                  placeholder="Ex: LOGIN, APPOINTMENT_BOOK"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividades ({total} registros)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum log encontrado
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Data/Hora</th>
                        <th className="text-left py-3 px-2">Usuário</th>
                        <th className="text-left py-3 px-2">Ação</th>
                        <th className="text-left py-3 px-2">Entidade</th>
                        <th className="text-left py-3 px-2">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">
                                  {log.user?.fullName || `Usuário #${log.userId}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {log.user?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                              {getActionLabel(log.action)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-sm">
                            {log.entityType && (
                              <span className="text-muted-foreground">
                                {getEntityTypeLabel(log.entityType)}
                                {log.entityId > 0 && ` #${log.entityId}`}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-xs text-muted-foreground">
                            {log.ipAddress || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Página {page + 1} de {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
