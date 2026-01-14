import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    MapPin,
    Star,
    Loader2,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    AlertCircle,
    Stethoscope,
    Building2
} from 'lucide-react';
import { findNearbyClinics, Clinic } from '@/api/clinics';
import { axiosInstance } from '@/api/axios';

interface SmartSchedulerProps {
    specialty: string;
    priority: string;
    patientLocation?: { lat: number; lng: number };
    triageReportId?: number;
    onScheduled?: (appointmentId: number) => void;
    onClose?: () => void;
}

interface Doctor {
    id: number;
    full_name: string;
    specialty: string;
    rating?: number;
    clinic?: Clinic;
}

interface TimeSlot {
    date: string;
    time: string;
    doctorId: number;
    doctorName: string;
    clinicId?: number;
    clinicName?: string;
    available: boolean;
}

export function SmartScheduler({
    specialty,
    priority,
    patientLocation,
    triageReportId,
    onScheduled,
    onClose
}: SmartSchedulerProps) {
    const [step, setStep] = useState<'clinic' | 'doctor' | 'time' | 'confirm'>('clinic');
    const [loading, setLoading] = useState(true);
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [scheduling, setScheduling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load nearby clinics on mount
    useEffect(() => {
        loadClinics();
    }, []);

    const loadClinics = async () => {
        setLoading(true);
        try {
            if (patientLocation) {
                const data = await findNearbyClinics(
                    patientLocation.lat,
                    patientLocation.lng,
                    20, // 20km radius
                    specialty,
                    10
                );
                setClinics(data || []);
            } else {
                // Fallback: search by specialty
                const response = await axiosInstance.get(`/clinics/specialty/${encodeURIComponent(specialty)}`);
                setClinics(response.data?.clinics || response.data || []);
            }
        } catch (err) {
            console.error('Error loading clinics:', err);
            setError('Erro ao carregar clínicas');
        } finally {
            setLoading(false);
        }
    };

    const loadDoctors = async (clinicId?: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ specialty });
            if (clinicId) params.append('clinic_id', clinicId.toString());
            
            const response = await axiosInstance.get(`/doctors?${params}`);
            setDoctors(response.data || []);
        } catch (err) {
            console.error('Error loading doctors:', err);
            // Mock doctors for demo
            setDoctors([
                { id: 1, full_name: 'Dr. João Silva', specialty, rating: 4.8 },
                { id: 2, full_name: 'Dra. Maria Santos', specialty, rating: 4.9 },
                { id: 3, full_name: 'Dr. Pedro Oliveira', specialty, rating: 4.7 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadSlots = async (doctorId: number, date: Date) => {
        setLoading(true);
        try {
            const dateStr = date.toISOString().split('T')[0];
            const response = await axiosInstance.get(`/appointments/available-slots?doctor_id=${doctorId}&date=${dateStr}`);
            
            const availableSlots = (response.data || []).map((slot: any) => ({
                date: dateStr,
                time: slot.time || slot,
                doctorId,
                doctorName: selectedDoctor?.full_name || '',
                clinicId: selectedClinic?.id,
                clinicName: selectedClinic?.name,
                available: true
            }));
            
            setSlots(availableSlots);
        } catch (err) {
            console.error('Error loading slots:', err);
            // Generate mock slots
            const mockSlots: TimeSlot[] = [];
            const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
            const dateStr = date.toISOString().split('T')[0];
            
            times.forEach(time => {
                if (Math.random() > 0.3) { // 70% availability
                    mockSlots.push({
                        date: dateStr,
                        time,
                        doctorId,
                        doctorName: selectedDoctor?.full_name || '',
                        clinicId: selectedClinic?.id,
                        clinicName: selectedClinic?.name,
                        available: true
                    });
                }
            });
            
            setSlots(mockSlots);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClinic = (clinic: Clinic) => {
        setSelectedClinic(clinic);
        loadDoctors(clinic.id);
        setStep('doctor');
    };

    const handleSelectDoctor = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        loadSlots(doctor.id, selectedDate);
        setStep('time');
    };

    const handleSelectSlot = (slot: TimeSlot) => {
        setSelectedSlot(slot);
        setStep('confirm');
    };

    const handleDateChange = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        if (newDate >= new Date()) {
            setSelectedDate(newDate);
            if (selectedDoctor) {
                loadSlots(selectedDoctor.id, newDate);
            }
        }
    };

    const handleSchedule = async () => {
        if (!selectedSlot || !selectedDoctor) return;
        
        setScheduling(true);
        setError(null);
        
        try {
            const response = await axiosInstance.post('/appointments/book', {
                doctor_id: selectedDoctor.id,
                date: selectedSlot.date,
                time: selectedSlot.time,
                triage_report_id: triageReportId,
                notes: `Agendamento via triagem IA - Prioridade: ${priority}`
            });
            
            if (onScheduled) {
                onScheduled(response.data.id);
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao agendar consulta');
        } finally {
            setScheduling(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long'
        });
    };

    const getPriorityMessage = () => {
        switch (priority) {
            case 'Emergência':
                return 'Procure atendimento de emergência imediatamente!';
            case 'Muito Urgente':
                return 'Recomendamos agendamento para hoje ou amanhã.';
            case 'Urgente':
                return 'Recomendamos agendamento nos próximos 3 dias.';
            default:
                return 'Agende sua consulta no horário mais conveniente.';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden max-w-2xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Calendar className="w-6 h-6" />
                            Agendamento Inteligente
                        </h2>
                        <p className="text-cyan-100 text-sm mt-1">
                            Especialidade: {specialty}
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Priority Alert */}
            {(priority === 'Emergência' || priority === 'Muito Urgente') && (
                <div className={`px-6 py-3 flex items-center gap-2 ${
                    priority === 'Emergência' 
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200' 
                        : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-200'
                }`}>
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{getPriorityMessage()}</span>
                </div>
            )}

            {/* Steps Indicator */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    {['clinic', 'doctor', 'time', 'confirm'].map((s, i) => (
                        <React.Fragment key={s}>
                            <div className={`flex items-center gap-2 ${
                                step === s ? 'text-cyan-600' : 
                                ['clinic', 'doctor', 'time', 'confirm'].indexOf(step) > i 
                                    ? 'text-emerald-600' 
                                    : 'text-gray-400'
                            }`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    step === s ? 'bg-cyan-100 dark:bg-cyan-900/30' :
                                    ['clinic', 'doctor', 'time', 'confirm'].indexOf(step) > i
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                        : 'bg-gray-100 dark:bg-gray-700'
                                }`}>
                                    {['clinic', 'doctor', 'time', 'confirm'].indexOf(step) > i ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        i + 1
                                    )}
                                </div>
                                <span className="hidden sm:inline text-sm font-medium capitalize">
                                    {s === 'clinic' ? 'Clínica' : s === 'doctor' ? 'Médico' : s === 'time' ? 'Horário' : 'Confirmar'}
                                </span>
                            </div>
                            {i < 3 && <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={() => { setError(null); loadClinics(); }}
                            className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Step 1: Select Clinic */}
                        {step === 'clinic' && (
                            <div className="space-y-3">
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Selecione uma clínica próxima:
                                </p>
                                {clinics.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Nenhuma clínica encontrada para esta especialidade</p>
                                        <button
                                            onClick={() => { setSelectedClinic(null); loadDoctors(); setStep('doctor'); }}
                                            className="mt-4 text-cyan-600 hover:underline"
                                        >
                                            Buscar médicos diretamente
                                        </button>
                                    </div>
                                ) : (
                                    clinics.map((clinic) => (
                                        <button
                                            key={clinic.id}
                                            onClick={() => handleSelectClinic(clinic)}
                                            className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl border border-gray-200 dark:border-gray-600 text-left transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                                        {clinic.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {clinic.address}, {clinic.city}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <Star className="w-4 h-4 fill-current" />
                                                    <span className="text-sm font-medium">
                                                        {clinic.average_rating?.toFixed(1) || '0.0'}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Step 2: Select Doctor */}
                        {step === 'doctor' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Selecione um médico:
                                    </p>
                                    <button
                                        onClick={() => setStep('clinic')}
                                        className="text-sm text-cyan-600 hover:underline"
                                    >
                                        ← Voltar
                                    </button>
                                </div>
                                {doctors.map((doctor) => (
                                    <button
                                        key={doctor.id}
                                        onClick={() => handleSelectDoctor(doctor)}
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-xl border border-gray-200 dark:border-gray-600 text-left transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {doctor.full_name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {doctor.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {doctor.specialty}
                                                </p>
                                            </div>
                                            {doctor.rating && (
                                                <div className="flex items-center gap-1 text-amber-500">
                                                    <Star className="w-4 h-4 fill-current" />
                                                    <span className="text-sm font-medium">{doctor.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Step 3: Select Time */}
                        {step === 'time' && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => setStep('doctor')}
                                        className="text-sm text-cyan-600 hover:underline"
                                    >
                                        ← Voltar
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleDateChange(-1)}
                                            disabled={selectedDate <= new Date()}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[200px] text-center capitalize">
                                            {formatDate(selectedDate)}
                                        </span>
                                        <button
                                            onClick={() => handleDateChange(1)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-4 gap-2">
                                    {slots.length === 0 ? (
                                        <div className="col-span-4 text-center py-8 text-gray-500">
                                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>Nenhum horário disponível nesta data</p>
                                        </div>
                                    ) : (
                                        slots.map((slot, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSelectSlot(slot)}
                                                className="p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-lg border border-gray-200 dark:border-gray-600 text-center font-medium transition-colors"
                                            >
                                                {slot.time}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Confirm */}
                        {step === 'confirm' && selectedSlot && selectedDoctor && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setStep('time')}
                                    className="text-sm text-cyan-600 hover:underline"
                                >
                                    ← Voltar
                                </button>
                                
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 space-y-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                        Confirme seu agendamento
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Stethoscope className="w-5 h-5 text-cyan-600" />
                                            <div>
                                                <p className="text-sm text-gray-500">Médico</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {selectedDoctor.full_name}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {selectedClinic && (
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-5 h-5 text-cyan-600" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Clínica</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {selectedClinic.name}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-cyan-600" />
                                            <div>
                                                <p className="text-sm text-gray-500">Data e Horário</p>
                                                <p className="font-medium text-gray-900 dark:text-white capitalize">
                                                    {formatDate(new Date(selectedSlot.date))} às {selectedSlot.time}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSchedule}
                                    disabled={scheduling}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg transition-all"
                                >
                                    {scheduling ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5" />
                                    )}
                                    {scheduling ? 'Agendando...' : 'Confirmar Agendamento'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
