import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Video, Phone, MessageSquare, Clock, Star, ChevronRight,
    X, Loader2, CheckCircle, Calendar, Stethoscope, Shield,
    Wifi, WifiOff, Mic, MicOff, Camera, CameraOff
} from 'lucide-react';
import Link from 'next/link';

interface AvailableDoctor {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    reviewCount: number;
    avatar?: string;
    waitTime: number;
    price: number;
    available: boolean;
}

interface QuickConsultationProps {
    onClose?: () => void;
    compact?: boolean;
}

export function QuickConsultation({ onClose, compact = false }: QuickConsultationProps) {
    const [step, setStep] = useState<'select' | 'waiting' | 'ready'>('select');
    const [selectedType, setSelectedType] = useState<'video' | 'audio' | 'chat' | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<AvailableDoctor | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionReady, setConnectionReady] = useState(false);
    const [devices, setDevices] = useState({ camera: true, mic: true });

    const availableDoctors: AvailableDoctor[] = [
        {
            id: '1',
            name: 'Dra. Maria Santos',
            specialty: 'Clínica Geral',
            rating: 4.9,
            reviewCount: 234,
            waitTime: 5,
            price: 89.90,
            available: true
        },
        {
            id: '2',
            name: 'Dr. João Silva',
            specialty: 'Cardiologia',
            rating: 4.8,
            reviewCount: 189,
            waitTime: 15,
            price: 149.90,
            available: true
        },
        {
            id: '3',
            name: 'Dra. Ana Costa',
            specialty: 'Dermatologia',
            rating: 4.7,
            reviewCount: 156,
            waitTime: 10,
            price: 129.90,
            available: true
        },
        {
            id: '4',
            name: 'Dr. Pedro Lima',
            specialty: 'Ortopedia',
            rating: 4.9,
            reviewCount: 201,
            waitTime: 20,
            price: 139.90,
            available: false
        }
    ];

    const consultationTypes = [
        { id: 'video', name: 'Videochamada', icon: Video, color: 'from-blue-500 to-cyan-500', desc: 'Consulta face a face' },
        { id: 'audio', name: 'Ligação', icon: Phone, color: 'from-green-500 to-emerald-500', desc: 'Apenas áudio' },
        { id: 'chat', name: 'Chat', icon: MessageSquare, color: 'from-purple-500 to-pink-500', desc: 'Mensagens de texto' },
    ];

    const startConsultation = async () => {
        if (!selectedDoctor || !selectedType) return;
        
        setIsConnecting(true);
        setStep('waiting');
        
        // Simulate connection
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        setIsConnecting(false);
        setConnectionReady(true);
        setStep('ready');
    };

    if (compact) {
        const availableCount = availableDoctors.filter(d => d.available).length;
        
        return (
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Consulta Rápida</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {availableCount} médicos disponíveis
                            </p>
                        </div>
                    </div>
                    <Link href="/telemedicine" className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg">
                        <ChevronRight className="w-5 h-5 text-blue-500" />
                    </Link>
                </div>
            </div>
        );
    }


    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900 dark:text-white">Consulta Rápida</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Telemedicina 24/7</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Select Type & Doctor */}
                    {step === 'select' && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Consultation Type */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Tipo de Consulta
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {consultationTypes.map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setSelectedType(type.id as any)}
                                            className={`p-4 rounded-xl text-center transition-all ${
                                                selectedType === type.id
                                                    ? `bg-gradient-to-br ${type.color} text-white shadow-lg`
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            <type.icon className="w-6 h-6 mx-auto mb-2" />
                                            <p className="font-medium text-sm">{type.name}</p>
                                            <p className={`text-xs mt-1 ${selectedType === type.id ? 'text-white/80' : 'text-gray-500'}`}>
                                                {type.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Available Doctors */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Médicos Disponíveis
                                </h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {availableDoctors.map(doctor => (
                                        <button
                                            key={doctor.id}
                                            onClick={() => doctor.available && setSelectedDoctor(doctor)}
                                            disabled={!doctor.available}
                                            className={`w-full p-4 rounded-xl text-left transition-all ${
                                                selectedDoctor?.id === doctor.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                                                    : doctor.available
                                                        ? 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-blue-300'
                                                        : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed border-2 border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-gray-900 dark:text-white">{doctor.name}</p>
                                                        {!doctor.available && (
                                                            <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded">Indisponível</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">{doctor.specialty}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="flex items-center gap-1 text-xs text-amber-500">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            {doctor.rating} ({doctor.reviewCount})
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Clock className="w-3 h-3" />
                                                            ~{doctor.waitTime} min
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        R$ {doctor.price.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Start Button */}
                            <button
                                onClick={startConsultation}
                                disabled={!selectedType || !selectedDoctor}
                                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Video className="w-5 h-5" />
                                Iniciar Consulta
                            </button>

                            {/* Security Note */}
                            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                                <Shield className="w-3 h-3" />
                                Consulta criptografada e segura
                            </p>
                        </motion.div>
                    )}


                    {/* Step 2: Waiting/Connecting */}
                    {step === 'waiting' && (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-12"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                {isConnecting ? (
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                ) : (
                                    <Wifi className="w-10 h-10 text-blue-500" />
                                )}
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {isConnecting ? 'Conectando...' : 'Aguardando médico'}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {selectedDoctor?.name} será notificado(a)
                            </p>
                            
                            {/* Device Check */}
                            <div className="flex justify-center gap-4 mb-6">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                    devices.camera ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {devices.camera ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                                    <span className="text-sm">Câmera</span>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                    devices.mic ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {devices.mic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                    <span className="text-sm">Microfone</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setStep('select'); setSelectedDoctor(null); }}
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    )}

                    {/* Step 3: Ready */}
                    {step === 'ready' && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                            >
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Consulta Pronta!
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                {selectedDoctor?.name} está aguardando você
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {selectedDoctor?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedDoctor?.name}</p>
                                        <p className="text-sm text-gray-500">{selectedDoctor?.specialty}</p>
                                    </div>
                                </div>
                            </div>

                            <Link href={`/video-call/quick-${selectedDoctor?.id}`}>
                                <button className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2">
                                    <Video className="w-5 h-5" />
                                    Entrar na Consulta
                                </button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default QuickConsultation;
