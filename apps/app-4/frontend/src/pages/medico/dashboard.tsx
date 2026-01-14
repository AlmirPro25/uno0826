import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Button } from "@/components/ui/shadcn/Button";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { appointmentsAPI } from "@/api/appointments";
import { getPendingTriageReports, TriageReport } from "@/api/triage";
import { Appointment } from "@/types/appointments";
import { useAuthStore } from "@/hooks/useAuthStore";
import { PatientSearch } from "@/components/PatientSearch";
import { DoctorCalendar } from "@/components/DoctorCalendar";
import { DoctorStats } from "@/components/DoctorStats";
import { TodaySchedule } from "@/components/TodaySchedule";
import { QuickActions } from "@/components/QuickActions";
import {
    AlertCircle, Loader2, Video, CheckCircle, Calendar,
    Users, Activity, Clock, ChevronRight, Stethoscope,
    FileText, TrendingUp, Bell, Ticket
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
    todayAppointments: number;
    weekAppointments: number;
    pendingTriages: number;
    completedToday: number;
}

export default function MedicoDashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [triages, setTriages] = useState<TriageReport[]>([]);
    const [stats, setStats] = useState<DashboardStats>({
        todayAppointments: 0,
        weekAppointments: 0,
        pendingTriages: 0,
        completedToday: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [appointmentsData, triagesData] = await Promise.all([
                appointmentsAPI.getMyAppointments().catch(() => []),
                getPendingTriageReports().catch(() => [])
            ]);

            setAppointments(appointmentsData || []);
            setTriages((triagesData || []).slice(0, 5));

            // Calculate stats
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const todayApts = (appointmentsData || []).filter((a: Appointment) => {
                const aptDate = new Date(a.startTime);
                return aptDate.toDateString() === today.toDateString() && 
                       (a.status === 'booked' || a.status === 'pending');
            });

            const completedToday = (appointmentsData || []).filter((a: Appointment) => {
                const aptDate = new Date(a.startTime);
                return aptDate.toDateString() === today.toDateString() && a.status === 'completed';
            });

            setStats({
                todayAppointments: todayApts.length,
                weekAppointments: (appointmentsData || []).filter((a: Appointment) => 
                    a.status === 'booked' || a.status === 'pending'
                ).length,
                pendingTriages: (triagesData || []).length,
                completedToday: completedToday.length
            });
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao carregar dados");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (appointmentId: number) => {
        try {
            await appointmentsAPI.cancelAppointment(appointmentId);
            setAppointments(appointments.filter(a => a.id !== appointmentId));
            loadDashboardData();
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao cancelar agendamento");
        }
    };

    const handleComplete = async (appointmentId: number) => {
        try {
            await appointmentsAPI.completeAppointment(appointmentId);
            setAppointments(appointments.map(a => 
                a.id === appointmentId ? { ...a, status: 'completed' as const } : a
            ));
            loadDashboardData();
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao finalizar consulta");
        }
    };

    const getPriorityColor = (priority: string) => {
        if (priority.includes('Vermelho')) return 'bg-red-500';
        if (priority.includes('Laranja')) return 'bg-orange-500';
        if (priority.includes('Amarelo')) return 'bg-yellow-500';
        if (priority.includes('Verde')) return 'bg-green-500';
        return 'bg-blue-500';
    };

    const todayAppointments = appointments.filter(a => {
        const aptDate = new Date(a.startTime);
        const today = new Date();
        return aptDate.toDateString() === today.toDateString() && 
               (a.status === 'booked' || a.status === 'pending');
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Dashboard Médico | MediSync</title>
            </Head>

            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Bom dia, Dr. {user?.fullName?.split(' ')[0] || 'Médico'}! 👋
                            </h1>
                            <p className="text-cyan-100 mt-1">
                                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </p>
                        </div>
                        <PatientSearch />
                    </div>
                </div>

                {error && (
                    <Alert className="border-destructive bg-destructive/10">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-destructive">{error}</AlertDescription>
                    </Alert>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">Hoje</p>
                                    <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{stats.todayAppointments}</p>
                                    <p className="text-xs text-cyan-500">consultas</p>
                                </div>
                                <Calendar className="w-10 h-10 text-cyan-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Concluídas</p>
                                    <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.completedToday}</p>
                                    <p className="text-xs text-emerald-500">hoje</p>
                                </div>
                                <CheckCircle className="w-10 h-10 text-emerald-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Triagens</p>
                                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.pendingTriages}</p>
                                    <p className="text-xs text-amber-500">pendentes</p>
                                </div>
                                <Activity className="w-10 h-10 text-amber-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Semana</p>
                                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.weekAppointments}</p>
                                    <p className="text-xs text-purple-500">agendadas</p>
                                </div>
                                <TrendingUp className="w-10 h-10 text-purple-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <Link href="/queue/panel" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors group">
                        <Ticket className="w-8 h-8 text-cyan-600 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Painel de Fila</h3>
                    </Link>
                    <Link href="/medico/triagens" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors group">
                        <Activity className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Triagens IA</h3>
                    </Link>
                    <Link href="/medico/medical-records" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors group">
                        <FileText className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Prontuários</h3>
                    </Link>
                    <Link href="/medico/prescriptions" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors group">
                        <Stethoscope className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Receitas</h3>
                    </Link>
                    <Link href="/medico/certificates" className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-cyan-500 transition-colors group">
                        <Bell className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Atestados</h3>
                    </Link>
                </div>

                {/* Doctor Stats */}
                <DoctorStats compact />

                {/* Doctor Calendar */}
                <div className="mb-6">
                    <DoctorCalendar 
                        onSelectAppointment={(apt) => router.push(`/video-call/${apt.id}`)}
                    />
                </div>

                {/* Today Schedule */}
                <TodaySchedule 
                    onStartConsultation={(id) => router.push(`/medico/consultation/${id}`)}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Today's Appointments */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-cyan-600" />
                                    Consultas de Hoje
                                </CardTitle>
                                <Link href="/medico/waiting-room" className="text-sm text-cyan-600 hover:underline flex items-center gap-1">
                                    Ver todas <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {todayAppointments.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma consulta para hoje</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {todayAppointments.slice(0, 5).map((appointment) => (
                                        <motion.div
                                            key={appointment.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-cyan-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {appointment.patient?.fullName || 'Paciente'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(appointment.startTime), "HH:mm")}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() => router.push(`/video-call/${appointment.id}`)}
                                                    className="bg-cyan-600 hover:bg-cyan-700"
                                                >
                                                    <Video className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleComplete(appointment.id)}
                                                    className="text-emerald-600 border-emerald-600"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pending Triages */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-amber-600" />
                                    Triagens Pendentes
                                </CardTitle>
                                <Link href="/medico/triagens" className="text-sm text-cyan-600 hover:underline flex items-center gap-1">
                                    Ver todas <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {triages.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhuma triagem pendente</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {triages.map((triage) => (
                                        <motion.div
                                            key={triage.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                                            onClick={() => router.push(`/medico/triagens/${triage.id}`)}
                                        >
                                            <div className={`w-2 h-10 rounded-full ${getPriorityColor(triage.priority)}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {triage.patient_complaint?.substring(0, 40)}...
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {triage.recommended_specialty}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions FAB */}
                <QuickActions userRole="doctor" />
            </div>
        </>
    );
}
