import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { statsAPI, AdminDashboardStats } from "@/api/stats";
import { AlertCircle, Loader, Users, Calendar, FileText, ClipboardList, UserCheck, Stethoscope, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminStatsPage() {
    const [stats, setStats] = useState<AdminDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const data = await statsAPI.getAdminStats();
            setStats(data);
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao carregar estatísticas");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) {
        return (
            <Alert className="border-destructive bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{error || "Erro ao carregar dados"}</AlertDescription>
            </Alert>
        );
    }

    const statCards = [
        { title: "Total de Consultas", value: stats.totalAppointments, icon: Calendar, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Consultas Hoje", value: stats.todayAppointments, icon: Clock, color: "text-green-500", bg: "bg-green-500/10" },
        { title: "Total de Pacientes", value: stats.totalPatients, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
        { title: "Total de Médicos", value: stats.totalDoctors, icon: Stethoscope, color: "text-cyan-500", bg: "bg-cyan-500/10" },
        { title: "Receitas Emitidas", value: stats.totalPrescriptions, icon: FileText, color: "text-orange-500", bg: "bg-orange-500/10" },
        { title: "Atestados Emitidos", value: stats.totalCertificates, icon: ClipboardList, color: "text-pink-500", bg: "bg-pink-500/10" },
    ];

    const maxCount = Math.max(...stats.appointmentsByDay.map(d => d.count), 1);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard de Estatísticas</h1>
                <p className="text-muted-foreground mt-2">Visão geral do sistema MediSync</p>
            </div>

            {error && (
                <Alert className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
            )}

            {/* Main Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-3xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-full ${stat.bg}`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Status Distribution */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Consultas por Status
                        </CardTitle>
                        <CardDescription>Distribuição atual das consultas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(stats.appointmentsByStatus).map(([status, count]) => {
                                const percentage = stats.totalAppointments > 0 
                                    ? Math.round((count / stats.totalAppointments) * 100) 
                                    : 0;
                                const statusColors: Record<string, string> = {
                                    pending: "bg-yellow-500",
                                    booked: "bg-blue-500",
                                    completed: "bg-green-500",
                                    cancelled: "bg-red-500",
                                };
                                const statusLabels: Record<string, string> = {
                                    pending: "Pendentes",
                                    booked: "Agendadas",
                                    completed: "Concluídas",
                                    cancelled: "Canceladas",
                                };
                                return (
                                    <div key={status}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span>{statusLabels[status] || status}</span>
                                            <span className="text-muted-foreground">{count} ({percentage}%)</span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${statusColors[status] || "bg-gray-500"} transition-all`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Weekly Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Consultas nos Últimos 7 Dias
                        </CardTitle>
                        <CardDescription>Atividade recente do sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between h-40 gap-2">
                            {stats.appointmentsByDay.map((day, index) => (
                                <div key={day.date} className="flex-1 flex flex-col items-center">
                                    <div className="w-full flex flex-col items-center">
                                        <span className="text-xs text-muted-foreground mb-1">{day.count}</span>
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${(day.count / maxCount) * 100}%` }}
                                            transition={{ delay: index * 0.1, duration: 0.5 }}
                                            className="w-full bg-primary rounded-t min-h-[4px]"
                                            style={{ minHeight: day.count > 0 ? '8px' : '4px' }}
                                        />
                                    </div>
                                    <span className="text-xs text-muted-foreground mt-2">
                                        {format(new Date(day.date), "EEE", { locale: ptBR })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumo Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-yellow-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-yellow-600">{stats.pendingAppointments}</p>
                            <p className="text-sm text-muted-foreground">Pendentes</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{stats.appointmentsByStatus.booked || 0}</p>
                            <p className="text-sm text-muted-foreground">Agendadas</p>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{stats.completedAppointments}</p>
                            <p className="text-sm text-muted-foreground">Concluídas</p>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">{stats.cancelledAppointments}</p>
                            <p className="text-sm text-muted-foreground">Canceladas</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
