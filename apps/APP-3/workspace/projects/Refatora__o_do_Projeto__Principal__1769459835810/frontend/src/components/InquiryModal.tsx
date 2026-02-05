
import { useState } from 'react';
import { X, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from './ui/Button';
import { Machine } from '@/types';

interface InquiryModalProps {
    isOpen: boolean;
    onClose: () => void;
    machine: Machine | null;
}

interface FormData {
    client_name: string;
    contact_info: string;
    message: string;
}

export const InquiryModal = ({ isOpen, onClose, machine }: InquiryModalProps) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const { register, handleSubmit, reset } = useForm<FormData>();

    if (!machine) return null;

    const onSubmit = async (data: FormData) => {
        setStatus('loading');
        try {
            await api.post('/concierge/inquire', {
                machine_id: machine.id,
                ...data
            });
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
                reset();
            }, 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-surface border border-white/10 p-8 rounded-sm shadow-2xl"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>

                        {status === 'success' ? (
                            <div className="text-center py-12">
                                <motion.div 
                                    initial={{ scale: 0 }} 
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </motion.div>
                                <h3 className="text-2xl font-serif text-white">Solicitação Recebida</h3>
                                <p className="text-slate-400 mt-2">Um concierge entrará em contato em breve.</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-8">
                                    <span className="text-gold-500 text-xs font-bold tracking-widest uppercase">Concierge Digital</span>
                                    <h3 className="text-2xl font-serif text-white mt-2">
                                        Interesse: <span className="italic text-slate-300">{machine.marque} {machine.model}</span>
                                    </h3>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-slate-500 tracking-wider">Seu Nome</label>
                                        <input 
                                            {...register("client_name", { required: true })}
                                            className="w-full bg-background border border-white/10 rounded-sm px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                                            placeholder="Ex: Arthur Pendragon"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-slate-500 tracking-wider">Contato</label>
                                        <input 
                                            {...register("contact_info", { required: true })}
                                            className="w-full bg-background border border-white/10 rounded-sm px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors"
                                            placeholder="Email ou Telefone"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs uppercase text-slate-500 tracking-wider">Mensagem (Opcional)</label>
                                        <textarea 
                                            {...register("message")}
                                            rows={3}
                                            className="w-full bg-background border border-white/10 rounded-sm px-4 py-3 text-white focus:border-gold-500 focus:outline-none transition-colors resize-none"
                                        />
                                    </div>

                                    {status === 'error' && (
                                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Erro ao enviar. Tente novamente.</span>
                                        </div>
                                    )}

                                    <Button 
                                        type="submit" 
                                        className="w-full" 
                                        disabled={status === 'loading'}
                                    >
                                        {status === 'loading' ? 'Processando...' : 'Confirmar Interesse'}
                                        {!status && <ArrowRight className="w-4 h-4 ml-2" />}
                                    </Button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

===FILE: frontend/src/components/CarCard.tsx===
LANGUAGE: typescript
