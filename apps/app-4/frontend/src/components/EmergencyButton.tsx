import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, MapPin, AlertTriangle, X, Loader2, Shield,
    Heart, Ambulance, Building2, Users, CheckCircle
} from 'lucide-react';

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relationship: string;
}

interface EmergencyButtonProps {
    contacts?: EmergencyContact[];
    onEmergencyTriggered?: (location: GeolocationPosition | null) => void;
}

export function EmergencyButton({ contacts = [], onEmergencyTriggered }: EmergencyButtonProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTriggering, setIsTriggering] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [location, setLocation] = useState<GeolocationPosition | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [emergencyType, setEmergencyType] = useState<string | null>(null);
    const [emergencySent, setEmergencySent] = useState(false);

    const defaultContacts: EmergencyContact[] = [
        { id: '1', name: 'SAMU', phone: '192', relationship: 'Emergência Médica' },
        { id: '2', name: 'Bombeiros', phone: '193', relationship: 'Resgate' },
        { id: '3', name: 'Polícia', phone: '190', relationship: 'Segurança' },
    ];

    const allContacts = [...defaultContacts, ...contacts];

    const emergencyTypes = [
        { id: 'medical', name: 'Emergência Médica', icon: Heart, color: 'bg-red-500' },
        { id: 'accident', name: 'Acidente', icon: Ambulance, color: 'bg-orange-500' },
        { id: 'hospital', name: 'Preciso de Hospital', icon: Building2, color: 'bg-blue-500' },
        { id: 'help', name: 'Preciso de Ajuda', icon: Users, color: 'bg-purple-500' },
    ];

    useEffect(() => {
        if (isExpanded && !location) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation(pos),
                (err) => setLocationError(err.message),
                { enableHighAccuracy: true, timeout: 10000 }
            );
        }
    }, [isExpanded, location]);

    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            triggerEmergency();
        }
    }, [countdown]);

    const triggerEmergency = useCallback(async () => {
        setIsTriggering(true);
        
        // Simulate sending emergency alert
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (onEmergencyTriggered) {
            onEmergencyTriggered(location);
        }

        setEmergencySent(true);
        setIsTriggering(false);
        setCountdown(null);
    }, [location, onEmergencyTriggered]);

    const startEmergency = (type: string) => {
        setEmergencyType(type);
        setCountdown(5);
    };

    const cancelEmergency = () => {
        setCountdown(null);
        setEmergencyType(null);
    };

    const resetEmergency = () => {
        setEmergencySent(false);
        setEmergencyType(null);
        setIsExpanded(false);
    };


    if (!isExpanded) {
        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center z-50 group"
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-red-500 rounded-full opacity-30"
                />
                <Phone className="w-7 h-7 text-white relative z-10" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                </span>
            </motion.button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Emergência</h2>
                                    <p className="text-red-100 text-sm">Ajuda rápida quando você precisa</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Location Status */}
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${
                            location ? 'bg-emerald-50 dark:bg-emerald-900/20' : 
                            locationError ? 'bg-red-50 dark:bg-red-900/20' : 
                            'bg-gray-50 dark:bg-gray-700/50'
                        }`}>
                            <MapPin className={`w-5 h-5 ${
                                location ? 'text-emerald-500' : 
                                locationError ? 'text-red-500' : 
                                'text-gray-400'
                            }`} />
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                    location ? 'text-emerald-700 dark:text-emerald-300' : 
                                    locationError ? 'text-red-700 dark:text-red-300' : 
                                    'text-gray-600 dark:text-gray-300'
                                }`}>
                                    {location ? 'Localização obtida' : 
                                     locationError ? 'Erro ao obter localização' : 
                                     'Obtendo localização...'}
                                </p>
                                {location && (
                                    <p className="text-xs text-gray-500">
                                        {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                                    </p>
                                )}
                            </div>
                            {!location && !locationError && (
                                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                            )}
                        </div>

                        {/* Emergency Sent Confirmation */}
                        {emergencySent ? (
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    Alerta Enviado!
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Seus contatos de emergência foram notificados com sua localização.
                                </p>
                                <button
                                    onClick={resetEmergency}
                                    className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Fechar
                                </button>
                            </motion.div>
                        ) : countdown !== null ? (
                            /* Countdown */
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                className="text-center py-8"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <span className="text-4xl font-bold text-red-500">{countdown}</span>
                                </motion.div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    Enviando alerta de {emergencyTypes.find(t => t.id === emergencyType)?.name}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">
                                    Toque para cancelar
                                </p>
                                <button
                                    onClick={cancelEmergency}
                                    className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                                >
                                    Cancelar
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Emergency Types */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Tipo de Emergência
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {emergencyTypes.map(type => (
                                            <motion.button
                                                key={type.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => startEmergency(type.id)}
                                                className={`p-4 rounded-xl ${type.color} text-white text-left`}
                                            >
                                                <type.icon className="w-6 h-6 mb-2" />
                                                <p className="font-medium text-sm">{type.name}</p>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Contacts */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Ligar Diretamente
                                    </h3>
                                    <div className="space-y-2">
                                        {allContacts.map(contact => (
                                            <a
                                                key={contact.id}
                                                href={`tel:${contact.phone}`}
                                                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center">
                                                    <Phone className="w-5 h-5 text-cyan-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
                                                    <p className="text-sm text-gray-500">{contact.relationship}</p>
                                                </div>
                                                <span className="text-cyan-600 font-bold">{contact.phone}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default EmergencyButton;
