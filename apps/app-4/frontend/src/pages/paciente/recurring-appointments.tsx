import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/Card';
import { Button } from '@/components/ui/shadcn/Button';
import { Input } from '@/components/ui/shadcn/Input';
import { Label } from '@/components/ui/shadcn/Label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/shadcn/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/Select';
import { useAuthStore } from '@/hooks/useAuthStore';
import { usersAPI } from '@/api/users';
import {
  RecurringAppointment,
  getMyRecurringAppointments,
  createRecurringAppointment,
  getUpcomingOccurrences,
  bookFromRecurring,
  cancelRecurringAppointment,
  getFrequencyLabel,
  getDayOfWeekLabel,
} from '@/api/recurringAppointments';
import { User } from '@/types/auth';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  Stethoscope,
  CalendarPlus,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RecurringAppointmentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  const [recurrings, setRecurrings] = useState<RecurringAppointment[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringAppointment | null>(null);
  const [formData, setFormData] = useState({
    doctorId: '',
    startTime: '09:00',
    frequency: 'weekly',
    dayOfWeek: '1',
    startDate: '',
    endDate: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!authLoading && user?.role !== 'PACIENTE') {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'PACIENTE') {
      loadData();
    }
  }, [isAuthenticated, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recurringData, doctorsData] = await Promise.all([
        getMyRecurringAppointments(),
        usersAPI.listDoctors(),
      ]);
      setRecurrings(recurringData || []);
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setFormData({
      doctorId: '',
      startTime: '09:00',
      frequency: 'weekly',
      dayOfWeek: '1',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      notes: '',
    });
    setError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setError('');

      if (!formData.doctorId || !formData.startDate) {
        setError('Selecione um médico e data de início');
        return;
      }

      await createRecurringAppointment({
        doctorId: parseInt(formData.doctorId),
        startTime: formData.startTime,
        frequency: formData.frequency as 'weekly' | 'biweekly' | 'monthly',
        dayOfWeek: parseInt(formData.dayOfWeek),
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        notes: formData.notes || undefined,
      });

      setSuccess('Consulta recorrente criada com sucesso!');
      setIsDialogOpen(false);
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar consulta recorrente');
    }
  };

  const handlePreview = async (recurring: RecurringAppointment) => {
    try {
      const data = await getUpcomingOccurrences(recurring.id, 10);
      setPreviewDates(data.occurrences || []);
      setSelectedRecurring(recurring);
      setIsPreviewOpen(true);
    } catch (err) {
      console.error('Error loading preview:', err);
    }
  };

  const handleBook = async (recurring: RecurringAppointment) => {
    if (!confirm('Deseja agendar as próximas 4 consultas desta série?')) return;

    try {
      const result = await bookFromRecurring(recurring.id, 4);
      setSuccess(`${result.booked} consultas agendadas com sucesso!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao agendar consultas');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Tem certeza que deseja cancelar esta consulta recorrente?')) return;

    try {
      await cancelRecurringAppointment(id);
      setSuccess('Consulta recorrente cancelada!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao cancelar');
    }
  };

  if (authLoading || loading) {
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
              <RefreshCw className="h-6 w-6" />
              Consultas Recorrentes
            </h1>
            <p className="text-muted-foreground">
              Configure consultas que se repetem automaticamente
            </p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Recorrência
          </Button>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {recurrings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma consulta recorrente</h3>
              <p className="text-muted-foreground mb-4">
                Configure consultas que se repetem semanalmente, quinzenalmente ou mensalmente.
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Recorrência
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recurrings.map((recurring) => (
              <Card key={recurring.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      {recurring.doctor?.fullName}
                    </div>
                    <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                      {getFrequencyLabel(recurring.frequency)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{getDayOfWeekLabel(recurring.dayOfWeek)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{recurring.startTime.substring(11, 16)}</span>
                    </div>
                    {recurring.notes && (
                      <p className="text-muted-foreground">{recurring.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(recurring)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Datas
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleBook(recurring)}
                    >
                      <CalendarPlus className="h-3 w-3 mr-1" />
                      Agendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleCancel(recurring.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Consulta Recorrente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Médico</Label>
                <Select
                  value={formData.doctorId}
                  onValueChange={(value) => setFormData({ ...formData, doctorId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.fullName} {doctor.specialty && `- ${doctor.specialty}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dia da Semana</Label>
                  <Select
                    value={formData.dayOfWeek}
                    onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Segunda-feira</SelectItem>
                      <SelectItem value="2">Terça-feira</SelectItem>
                      <SelectItem value="3">Quarta-feira</SelectItem>
                      <SelectItem value="4">Quinta-feira</SelectItem>
                      <SelectItem value="5">Sexta-feira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quinzenal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Acompanhamento mensal"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>Criar Recorrência</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Próximas Datas</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {previewDates.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma data disponível</p>
              ) : (
                <ul className="space-y-2">
                  {previewDates.map((date, index) => (
                    <li key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Calendar className="h-4 w-4 text-primary" />
                      {format(new Date(date), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                Fechar
              </Button>
              {selectedRecurring && (
                <Button onClick={() => {
                  setIsPreviewOpen(false);
                  handleBook(selectedRecurring);
                }}>
                  Agendar Próximas 4
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
