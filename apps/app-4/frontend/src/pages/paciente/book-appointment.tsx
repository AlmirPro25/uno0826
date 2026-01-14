'use client';

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/shadcn/Card";
import { Button } from "@/components/ui/shadcn/Button";
import { Label } from "@/components/ui/shadcn/Label";
import { Input } from "@/components/ui/shadcn/Input";
import { Alert, AlertDescription } from "@/components/ui/shadcn/Alert";
import { appointmentsAPI } from "@/api/appointments";
import { usersAPI } from "@/api/users";
import { getDoctorRating } from "@/api/reviews";
import { User } from "@/types/auth";
import { AlertCircle, CheckCircle, Calendar, Clock, User as UserIcon, Search, Loader2, Stethoscope, Star } from "lucide-react";
import { format, addDays, setHours, setMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingPage, Skeleton } from "@/components/ui/Loading";
import { SearchInput } from "@/components/ui/Filters";

interface BookForm {
    doctorId: number;
    startTime: string;
}

interface TimeSlot {
    time: Date;
    available: boolean;
}

interface DoctorWithRating extends User {
    averageRating?: number;
    totalReviews?: number;
}

export default function BookAppointmentPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BookForm>();

    const [doctors, setDoctors] = useState<DoctorWithRating[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<DoctorWithRating[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithRating | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

    const [booking, setBooking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Fetch doctors on mount with ratings
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await usersAPI.listDoctors();
                // Fetch ratings for each doctor
                const doctorsWithRatings = await Promise.all(
                    data.map(async (doctor) => {
                        try {
                            const rating = await getDoctorRating(doctor.id);
                            return { ...doctor, averageRating: rating.averageRating, totalReviews: rating.totalReviews };
                        } catch {
                            return { ...doctor, averageRating: 0, totalReviews: 0 };
                        }
                    })
                );
                // Sort by rating (highest first)
                doctorsWithRatings.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                setDoctors(doctorsWithRatings);
                setFilteredDoctors(doctorsWithRatings);
            } catch (err) {
                setError("Falha ao carregar médicos");
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    // Filter doctors by search
    useEffect(() => {
        if (!searchQuery) {
            setFilteredDoctors(doctors);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredDoctors(
                doctors.filter(d => d.fullName.toLowerCase().includes(query))
            );
        }
    }, [searchQuery, doctors]);

    // Fetch available slots when doctor and date are selected
    useEffect(() => {
        if (!selectedDoctor || !selectedDate) {
            setAvailableSlots([]);
            return;
        }

        const fetchSlots = async () => {
            setLoadingSlots(true);
            try {
                const slots = await appointmentsAPI.getAvailableSlots(selectedDoctor.id, selectedDate);
                // slots is an array of ISO date strings
                const timeSlots: TimeSlot[] = slots.map((slot: string) => ({
                    time: new Date(slot),
                    available: true,
                }));
                setAvailableSlots(timeSlots);
            } catch (err) {
                console.error(err);
                setAvailableSlots([]);
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchSlots();
    }, [selectedDoctor, selectedDate]);

    const handleDoctorSelect = (doctor: DoctorWithRating) => {
        setSelectedDoctor(doctor);
        setValue('doctorId', doctor.id);
        setSelectedSlot(null);
        setError(null);
    };

    const handleSlotSelect = (slot: TimeSlot) => {
        if (!slot.available) return;
        setSelectedSlot(slot.time);
        setValue('startTime', slot.time.toISOString());
        setError(null);
    };

    const onSubmit = async () => {
        if (!selectedDoctor || !selectedSlot) {
            setError("Selecione um médico e um horário");
            return;
        }

        setBooking(true);
        setError(null);

        try {
            const endTime = new Date(selectedSlot.getTime() + 30 * 60000);

            await appointmentsAPI.bookAppointment({
                doctorId: selectedDoctor.id,
                startTime: selectedSlot.toISOString(),
                endTime: endTime.toISOString(),
            });

            setSuccess(true);

            // Redirect to appointments after 2 seconds
            setTimeout(() => {
                router.push('/paciente/my-appointments');
            }, 2000);

        } catch (err: any) {
            setError(err.response?.data?.error || "Falha ao agendar consulta");
        } finally {
            setBooking(false);
        }
    };

    // Generate next 7 days for date selection
    const dateOptions = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(), i);
        return {
            value: format(date, 'yyyy-MM-dd'),
            label: format(date, "EEE, dd 'de' MMM", { locale: ptBR }),
            isToday: i === 0,
        };
    });

    if (loadingDoctors) {
        return <LoadingPage text="Carregando médicos disponíveis..." />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-primary" />
                    Agendar Consulta
                </h1>
                <p className="text-muted-foreground mt-2">
                    Escolha um médico, data e horário disponível
                </p>
            </div>

            {/* Success Message */}
            {success && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Alert className="border-green-500 bg-green-500/10">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <AlertDescription className="text-green-600 dark:text-green-400 ml-2 text-base">
                            <strong>Consulta agendada com sucesso!</strong>
                            <br />
                            Redirecionando para seus agendamentos...
                        </AlertDescription>
                    </Alert>
                </motion.div>
            )}

            {/* Error Message */}
            {error && (
                <Alert className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Step 1: Select Doctor */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Card className={selectedDoctor ? 'ring-2 ring-primary' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                                Escolha o Médico
                            </CardTitle>
                            <CardDescription>Selecione o profissional para sua consulta</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SearchInput
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Buscar médico..."
                            />

                            <div className="max-h-[300px] overflow-y-auto space-y-2">
                                {filteredDoctors.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Nenhum médico encontrado
                                    </p>
                                ) : (
                                    filteredDoctors.map((doctor) => (
                                        <motion.button
                                            key={doctor.id}
                                            type="button"
                                            onClick={() => handleDoctorSelect(doctor)}
                                            className={`w-full p-3 rounded-lg border text-left transition-all hover:shadow-md ${selectedDoctor?.id === doctor.id
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : 'border-border hover:border-primary/50'
                                                }`}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Stethoscope className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{doctor.fullName}</p>
                                                    {doctor.specialty && (
                                                        <p className="text-xs text-primary font-medium">{doctor.specialty}</p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {doctor.totalReviews && doctor.totalReviews > 0 ? (
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                <span className="text-sm font-medium">{doctor.averageRating?.toFixed(1)}</span>
                                                                <span className="text-xs text-muted-foreground">({doctor.totalReviews})</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">Sem avaliações</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Step 2: Select Date & Time */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className={selectedSlot ? 'ring-2 ring-primary' : ''}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                                Escolha o Horário
                            </CardTitle>
                            <CardDescription>
                                {selectedDoctor
                                    ? `Horários disponíveis para ${selectedDoctor.fullName}`
                                    : 'Selecione um médico primeiro'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Date Selection */}
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <div className="flex flex-wrap gap-2">
                                    {dateOptions.map((date) => (
                                        <Button
                                            key={date.value}
                                            type="button"
                                            variant={selectedDate === date.value ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => {
                                                setSelectedDate(date.value);
                                                setSelectedSlot(null);
                                            }}
                                            disabled={!selectedDoctor}
                                            className="text-xs"
                                        >
                                            {date.isToday && '🗓️ '}
                                            {date.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Horários Disponíveis
                                </Label>

                                {!selectedDoctor ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        Selecione um médico para ver os horários
                                    </p>
                                ) : !selectedDate ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center">
                                        Selecione uma data para ver os horários
                                    </p>
                                ) : loadingSlots ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                            <Skeleton key={i} className="h-10 w-full" />
                                        ))}
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="text-center py-4 space-y-3">
                                        <p className="text-sm text-muted-foreground">
                                            Nenhum horário disponível nesta data
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                // Find next available date
                                                const currentIndex = dateOptions.findIndex(d => d.value === selectedDate);
                                                if (currentIndex < dateOptions.length - 1) {
                                                    setSelectedDate(dateOptions[currentIndex + 1].value);
                                                    setSelectedSlot(null);
                                                }
                                            }}
                                        >
                                            Tentar próximo dia →
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                                        {availableSlots.map((slot, index) => (
                                            <Button
                                                key={index}
                                                type="button"
                                                variant={selectedSlot?.getTime() === slot.time.getTime() ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleSlotSelect(slot)}
                                                disabled={!slot.available}
                                                className="text-sm"
                                            >
                                                {format(slot.time, 'HH:mm')}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Confirmation Section */}
            {selectedDoctor && selectedSlot && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="border-primary/50 bg-primary/5">
                        <CardHeader>
                            <CardTitle>Confirmar Agendamento</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <Stethoscope className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Médico</p>
                                        <p className="font-medium">{selectedDoctor.fullName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Data</p>
                                        <p className="font-medium">
                                            {format(selectedSlot, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Horário</p>
                                        <p className="font-medium">{format(selectedSlot, 'HH:mm')} - {format(new Date(selectedSlot.getTime() + 30 * 60000), 'HH:mm')}</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={onSubmit}
                                className="w-full"
                                size="lg"
                                disabled={booking || success}
                            >
                                {booking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Agendando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Confirmar Agendamento
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </div>
    );
}
