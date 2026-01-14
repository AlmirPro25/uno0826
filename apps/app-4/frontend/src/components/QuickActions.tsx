import { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, X, FileText, Pill, Calendar, Activity,
    Video, MessageSquare, Users, Stethoscope,
    ClipboardList, Award, Bell, Settings
} from 'lucide-react';

interface QuickAction {
    id: string;
    icon: any;
    label: string;
    description?: string;
    href?: string;
    onClick?: () => void;
    color: string;
    bgColor: string;
}

interface QuickActionsProps {
    userRole: 'doctor' | 'patient' | 'admin';
    patientId?: number;
    onAction?: (actionId: string) => void;
}

const doctorActions: QuickAction[] = [
    {
        id: 'new-prescription',
        icon: Pill,
        label: 'Nova Receita',
        description: 'Criar receita médica',
        href: '/medico/prescriptions/new',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
        id: 'new-record',
        icon: FileText,
        label: 'Novo Prontuário',
        description: 'Registrar atendimento',
        href: '/medico/medical-records/new',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
        id: 'new-certificate',
        icon: Award,
        label: 'Novo Atestado',
        description: 'Emitir atestado médico',
        href: '/medico/certificates/new',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
        id: 'triages',
        icon: Activity,
        label: 'Triagens IA',
        description: 'Ver triagens pendentes',
        href: '/medico/triagens',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
        id: 'queue',
        icon: Users,
        label: 'Painel de Fila',
        description: 'Gerenciar atendimentos',
        href: '/queue/panel',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
    },
    {
        id: 'waiting-room',
        icon: ClipboardList,
        label: 'Sala de Espera',
        description: 'Consultas do dia',
        href: '/medico/waiting-room',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30'
    }
];

const patientActions: QuickAction[] = [
    {
        id: 'triage-voice',
        icon: Stethoscope,
        label: 'Triagem por Voz',
        description: 'Falar com IA Sarah',
        href: '/ai/medicore',
        color: 'text-cyan-600',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
    },
    {
        id: 'triage-text',
        icon: Activity,
        label: 'Triagem por Texto',
        description: 'Descrever sintomas',
        href: '/ai/triage',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
    },
    {
        id: 'appointments',
        icon: Calendar,
        label: 'Agendar Consulta',
        description: 'Marcar atendimento',
        href: '/clinics',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
        id: 'telemedicine',
        icon: Video,
        label: 'Telemedicina',
        description: 'Consulta online',
        href: '/telemedicine',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
        id: 'chat',
        icon: MessageSquare,
        label: 'Mensagens',
        description: 'Falar com médico',
        href: '/chat',
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30'
    },
    {
        id: 'queue-join',
        icon: Users,
        label: 'Entrar na Fila',
        description: 'Retirar senha',
        href: '/queue/join',
        color: 'text-rose-600',
        bgColor: 'bg-rose-100 dark:bg-rose-900/30'
    }
];

export function QuickActions({ userRole, patientId, onAction }: QuickActionsProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const actions = userRole === 'doctor' ? doctorActions : patientActions;

    const handleAction = (action: QuickAction) => {
        setIsOpen(false);
        onAction?.(action.id);
        
        if (action.href) {
            let href = action.href;
            if (patientId && (action.id === 'new-prescription' || action.id === 'new-record' || action.id === 'new-certificate')) {
                href += `?patient_id=${patientId}`;
            }
            router.push(href);
        } else if (action.onClick) {
            action.onClick();
        }
    };

    return (
        <>
            {/* FAB Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors ${
                    isOpen 
                        ? 'bg-gray-800 dark:bg-gray-200' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {isOpen ? (
                        <X className="w-6 h-6 text-white dark:text-gray-800" />
                    ) : (
                        <Plus className="w-6 h-6 text-white" />
                    )}
                </motion.div>
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/50 z-40"
                    />
                )}
            </AnimatePresence>

            {/* Actions Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-50 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Ações Rápidas
                            </h3>
                            <p className="text-sm text-gray-500">
                                {userRole === 'doctor' ? 'Ferramentas do médico' : 'O que você precisa?'}
                            </p>
                        </div>

                        <div className="p-2 max-h-80 overflow-y-auto">
                            {actions.map((action, index) => {
                                const Icon = action.icon;
                                return (
                                    <motion.button
                                        key={action.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleAction(action)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${action.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {action.label}
                                            </p>
                                            {action.description && (
                                                <p className="text-xs text-gray-500 truncate">
                                                    {action.description}
                                                </p>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default QuickActions;
