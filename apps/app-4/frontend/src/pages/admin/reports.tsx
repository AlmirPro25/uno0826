import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Input } from '@/components/ui/shadcn/Input';
import { Label } from '@/components/ui/shadcn/Label';
import { useAuthStore } from '@/hooks/useAuthStore';
import { statsAPI, ReportByPeriod, DoctorReport } from '@/api/stats';
import {
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Users,
  Stethoscope,
  Download,
  BarChart3,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminReportsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportByPeriod | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!authLoading && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await statsAPI.getReportByPeriod(startDate, endDate);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar relatório');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      loadReport();
    }
  }, [isAuthenticated, user]);

  const exportToCSV = () => {
    if (!report) return;

    const headers = ['Médico', 'Especialidade', 'Consultas', 'Concluídas', 'Canceladas', 'Receita', 'Avaliação'];
    const rows = report.appointmentsByDoctor.map(d => [
      d.doctorName,
      d.specialty || '-',
      d.appointments,
      d.completed,
      d.cancelled,
      `R$ ${d.revenue.toFixed(2)}`,
      d.rating.toFixed(1)
    ]);

    const csvContent = [
      `Relatório MediSync - ${startDate} a ${endDate}`,
      '',
      `Total de Consultas: ${report.totalAppointments}`,
      `Concluídas: ${report.completedAppointments}`,
      `Canceladas: ${report.cancelledAppointments}`,
      `Taxa de Cancelamento: ${report.cancellationRate.toFixed(1)}%`,
      `Receita Total: R$ ${report.totalRevenue.toFixed(2)}`,
      `Avaliação Média: ${report.averageRating.toFixed(1)}`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-medisync-${startDate}-${endDate}.csv`;
    link.click();
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
            <BarChart3 className="h-6 w-6" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Análise detalhada do sistema por período
          </p>
        </div>
        {report && (
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        )}
      </div>

        {/* Date Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Button onClick={loadReport} disabled={loading}>
                {loading ? 'Carregando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Consultas</p>
                      <p className="text-2xl font-bold">{report.totalAppointments}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Concluídas</p>
                      <p className="text-2xl font-bold text-green-600">{report.completedAppointments}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa Cancelamento</p>
                      <p className="text-2xl font-bold text-red-600">{report.cancellationRate.toFixed(1)}%</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        R$ {report.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rating and Reviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avaliação Média</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{report.averageRating.toFixed(1)}</p>
                        <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                      <p className="text-xl font-semibold">{report.totalReviews}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Consultas por Dia (média)</p>
                      <p className="text-2xl font-bold">
                        {report.appointmentsByDay.length > 0
                          ? (report.totalAppointments / report.appointmentsByDay.length).toFixed(1)
                          : 0}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointments by Day Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Consultas por Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1">
                  {report.appointmentsByDay.map((day, index) => {
                    const maxCount = Math.max(...report.appointmentsByDay.map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div
                        key={index}
                        className="flex-1 flex flex-col items-center"
                        title={`${day.date}: ${day.count} consultas`}
                      >
                        <div
                          className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <span className="text-xs text-muted-foreground mt-1 rotate-45 origin-left">
                          {format(new Date(day.date), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Doctors Performance Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Desempenho por Médico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Médico</th>
                        <th className="text-left py-3 px-2">Especialidade</th>
                        <th className="text-center py-3 px-2">Consultas</th>
                        <th className="text-center py-3 px-2">Concluídas</th>
                        <th className="text-center py-3 px-2">Canceladas</th>
                        <th className="text-right py-3 px-2">Receita</th>
                        <th className="text-center py-3 px-2">Avaliação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.appointmentsByDoctor.map((doctor) => (
                        <tr key={doctor.doctorId} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{doctor.doctorName}</td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {doctor.specialty || '-'}
                          </td>
                          <td className="py-3 px-2 text-center">{doctor.appointments}</td>
                          <td className="py-3 px-2 text-center text-green-600">
                            {doctor.completed}
                          </td>
                          <td className="py-3 px-2 text-center text-red-600">
                            {doctor.cancelled}
                          </td>
                          <td className="py-3 px-2 text-right">
                            R$ {doctor.revenue.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {doctor.rating.toFixed(1)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
    </div>
  );
}
