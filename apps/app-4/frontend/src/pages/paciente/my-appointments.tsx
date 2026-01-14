'use client';

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Button } from "@/components/ui/shadcn/Button";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { appointmentsAPI } from "@/api/appointments";
import { Appointment } from "@/types/appointments";
import { AlertCircle, X, Video, Calendar, Clock, User, CheckCircle, XCircle, RefreshCw, Star, Zap, ChevronRight } from "lucide-react";
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingPage, SkeletonCard } from "@/components/ui/Loading";
import { Pagination, PageSizeSelector } from "@/components/ui/Pagination";
import { AppointmentFilters } from "@/components/ui/Filters";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/shadcn/Dialog";
import { getAppointmentReview, createReview, Review } from "@/api/reviews";
import { useRouter } from "next/router";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/components/ui/Toast";

// Pro Status Config with Glassy Feel
const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    pending: {
        label: 'Pendente',
        className: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50',
        icon: Clock
    },
    booked: {
        label: 'Agendado',
        className: 'bg-primary/10 text-primary border-primary/20',
        icon: Calendar
    },
    completed: {
        label: 'Concluído',
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-900/50',
        icon: CheckCircle
    },
    cancelled: {
        label: 'Cancelado',
        className: 'bg-destructive/10 text-destructive border-destructive/20',
        icon: XCircle
    },
};

export default function PatientAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // WebSocket hook
    const { isConnected } = useWebSocket();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        startDate: '',
        endDate: '',
        doctorId: '',
    });

    // Cancel dialog state
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<number | null>(null);
    const [cancelling, setCancelling] = useState(false);

    // Review dialog state
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [appointmentToReview, setAppointmentToReview] = useState<Appointment | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewedAppointments, setReviewedAppointments] = useState<Set<number>>(new Set());

    const router = useRouter();
    const { success, info } = useToast();

    const fetchAppointments = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        try {
            const data = await appointmentsAPI.getMyAppointments();
            setAppointments(data);
            setLastUpdated(new Date());

            // Check which completed appointments have reviews
            const completedAppts = data.filter((a: Appointment) => a.status === 'completed');
            const reviewed = new Set<number>();
            for (const appt of completedAppts) {
                try {
                    await getAppointmentReview(appt.id);
                    reviewed.add(appt.id);
                } catch {
                    // No review exists
                }
            }
            setReviewedAppointments(reviewed);
            setError(null);
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao carregar agendamentos");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    // WebSocket Listener
    useEffect(() => {
        const handleWSMessage = (event: CustomEvent) => {
            const data = event.detail;
            const relevantTypes = [
                'appointment_updated',
                'appointment_status_change',
                'appointment_created',
                'appointment_cancelled'
            ];

            if (data && relevantTypes.includes(data.type)) {
                fetchAppointments(false);
                if (data.message) {
                    info("Atualização", data.message);
                }
            }
        };

        window.addEventListener('medisync-ws-message' as any, handleWSMessage);
        return () => window.removeEventListener('medisync-ws-message' as any, handleWSMessage);
    }, []);

    // Filtered and paginated appointments
    const filteredAppointments = useMemo(() => {
        return appointments.filter((appt) => {
            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const doctorName = appt.doctor?.fullName?.toLowerCase() || '';
                if (!doctorName.includes(searchLower)) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && appt.status !== filters.status) {
                return false;
            }

            // Date range filters
            if (filters.startDate) {
                const apptDate = new Date(appt.startTime);
                const filterDate = new Date(filters.startDate);
                if (isBefore(apptDate, filterDate)) {
                    return false;
                }
            }

            if (filters.endDate) {
                const apptDate = new Date(appt.startTime);
                const filterDate = new Date(filters.endDate);
                filterDate.setHours(23, 59, 59);
                if (isAfter(apptDate, filterDate)) {
                    return false;
                }
            }

            return true;
        });
    }, [appointments, filters]);

    // Pagination calculations
    const totalItems = filteredAppointments.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const paginatedAppointments = filteredAppointments.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters, pageSize]);

    const handleCancel = async () => {
        if (!appointmentToCancel) return;

        setCancelling(true);
        try {
            await appointmentsAPI.cancelAppointment(appointmentToCancel);
            setAppointments(prev => prev.map(a =>
                a.id === appointmentToCancel ? { ...a, status: 'cancelled' as const } : a
            ));
            setCancelDialogOpen(false);
            setAppointmentToCancel(null);
            success("Sucesso", "Consulta cancelada com sucesso.");
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao cancelar agendamento");
        } finally {
            setCancelling(false);
        }
    };

    const openCancelDialog = (appointmentId: number) => {
        setAppointmentToCancel(appointmentId);
        setCancelDialogOpen(true);
    };

    const openReviewDialog = (appointment: Appointment) => {
        setAppointmentToReview(appointment);
        setReviewRating(5);
        setReviewComment('');
        setReviewDialogOpen(true);
    };

    const handleSubmitReview = async () => {
        if (!appointmentToReview) return;
        setSubmittingReview(true);
        try {
            await createReview({
                appointmentId: appointmentToReview.id,
                rating: reviewRating,
                comment: reviewComment
            });
            setReviewedAppointments(prev => new Set([...prev, appointmentToReview.id]));
            setReviewDialogOpen(false);
            setAppointmentToReview(null);
            success("Avaliação Enviada", "Obrigado pelo seu feedback!");
        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao enviar avaliação");
        } finally {
            setSubmittingReview(false);
        }
    };

    const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
        <div className="flex gap-1 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer transition-transform hover:scale-110 ${star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    onClick={() => onChange(star)}
                />
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-8 animate-in-fade">
                <div className="flex flex-col gap-2">
                    <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
                    <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
                </div>
                <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-muted/50 animate-pulse rounded-xl border border-border/50" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in-fade pb-10">
            {/* Pro Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight">
                        <span className="text-gradient">Meus Agendamentos</span>
                    </h1>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5" />
                            Atualizado às {format(lastUpdated, "HH:mm:ss")}
                        </span>
                        {isConnected && (
                            <span className="flex items-center gap-1.5 text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                <Zap className="w-3.5 h-3.5 filled" />
                                Tempo Real Ativo
                            </span>
                        )}
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={() => fetchAppointments(true)}
                    disabled={refreshing}
                    className="hover:bg-primary/5 border-primary/20 text-primary transition-all duration-300"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Atualizar Lista
                </Button>
            </div>

            {/* Error Alert */}
            {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert className="border-destructive/50 bg-destructive/5 backdrop-blur-sm">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <AlertDescription className="text-destructive font-medium">{error}</AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Pro Filters Panel */}
            <div className="glass-card rounded-xl p-1">
                <CardContent className="pt-6">
                    <AppointmentFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </CardContent>
            </div>

            {/* Appointments List */}
            {paginatedAppointments.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center border-dashed border-2 border-muted">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        {appointments.length === 0
                            ? "Você ainda não possui consultas agendadas. Que tal marcar uma agora?"
                            : "Tente ajustar os filtros para encontrar o que procura."
                        }
                    </p>
                    {appointments.length === 0 && (
                        <Button className="mt-6 rounded-full px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                            Agendar Consulta
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {paginatedAppointments.map((appointment, index) => {
                            const status = statusConfig[appointment.status] || statusConfig.pending;
                            const StatusIcon = status.icon;
                            const isPast = isBefore(new Date(appointment.startTime), new Date());
                            const isAppointmentToday = isToday(new Date(appointment.startTime));

                            return (
                                <motion.div
                                    key={appointment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    layout
                                >
                                    <div className={`
                                        group relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm 
                                        hover:shadow-lg hover:border-primary/30 transition-all duration-300
                                        ${isAppointmentToday ? 'ring-1 ring-primary/50 shadow-md shadow-primary/5' : ''}
                                    `}>
                                        {/* Left Accent Bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${appointment.status === 'booked' ? 'bg-primary' : appointment.status === 'completed' ? 'bg-emerald-500' : 'bg-muted'}`} />

                                        <div className="p-5 pl-7">
                                            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${status.className}`}>
                                                            <StatusIcon className="w-3.5 h-3.5" />
                                                            {status.label}
                                                        </div>
                                                        {isAppointmentToday && appointment.status === 'booked' && (
                                                            <span className="flex items-center gap-1 text-xs font-bold text-primary animate-pulse">
                                                                <Zap className="w-3.5 h-3.5 fill-current" />
                                                                HOJE
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-start gap-4">
                                                        <div className="h-12 w-12 rounded-full bg-secondary/80 flex items-center justify-center border border-border">
                                                            <User className="w-6 h-6 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold leading-none mb-1 group-hover:text-primary transition-colors">
                                                                Dr(a). {appointment.doctor?.fullName || 'Médico'}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <span className="font-medium text-foreground/80">
                                                                    {format(new Date(appointment.startTime), "EEEE, d 'de' MMMM", { locale: ptBR })}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{format(new Date(appointment.startTime), "HH:mm", { locale: ptBR })}</span>
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
                                                    {(appointment.status === "booked" || appointment.status === "pending") && !isPast && (
                                                        <>
                                                            <Button
                                                                onClick={() => window.open(`/video-call/${appointment.id}`, '_blank')}
                                                                className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                                                            >
                                                                <Video className="w-4 h-4 mr-2" />
                                                                Entrar na Sala
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => openCancelDialog(appointment.id)}
                                                                className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </>
                                                    )}

                                                    {appointment.status === "completed" && !reviewedAppointments.has(appointment.id) && (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => openReviewDialog(appointment)}
                                                            className="rounded-full border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-900/20 transition-all"
                                                        >
                                                            <Star className="w-4 h-4 mr-2" />
                                                            Avaliar
                                                        </Button>
                                                    )}

                                                    {appointment.status === "completed" && reviewedAppointments.has(appointment.id) && (
                                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-sm font-medium">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Avaliação Enviada
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Compact Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-border/40">
                    <p className="text-sm text-muted-foreground">
                        Mostrando <span className="font-medium text-foreground">{paginatedAppointments.length}</span> de <span className="font-medium text-foreground">{totalItems}</span> resultados
                    </p>
                    <div className="flex items-center gap-4">
                        <PageSizeSelector
                            pageSize={pageSize}
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                        />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            {/* Enhanced Dialogs */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent className="sm:max-w-md glass-card border-destructive/20">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Confirmar Cancelamento
                        </DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja cancelar esta consulta? O horário será liberado para outros pacientes imediatamente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setCancelDialogOpen(false)}
                            disabled={cancelling}
                            className="rounded-full"
                        >
                            Manter Agendamento
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="rounded-full shadow-lg shadow-destructive/20"
                        >
                            {cancelling ? 'Processando...' : 'Confirmar Cancelamento'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogContent className="glass-card">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                            Avaliar Consulta
                        </DialogTitle>
                        <DialogDescription>
                            {appointmentToReview && (
                                <span>
                                    Como foi sua experiência com <strong>Dr(a). {appointmentToReview.doctor?.fullName}</strong>?
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="text-center p-6 bg-secondary/30 rounded-2xl border border-border/50">
                            <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Selecione as estrelas</p>
                            <StarRating value={reviewRating} onChange={setReviewRating} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground ml-1">Comentário (opcional)</label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Conte-nos os detalhes..."
                                rows={4}
                                className="mt-2 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setReviewDialogOpen(false)} className="rounded-full">
                            Cancelar
                        </Button>
                        <Button onClick={handleSubmitReview} disabled={submittingReview} className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-white shadow-lg shadow-orange-500/20 border-0">
                            {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
