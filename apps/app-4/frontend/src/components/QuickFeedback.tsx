import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, MessageSquare, ThumbsUp, Send } from 'lucide-react';
import { axiosInstance } from '@/api/axios';

interface QuickFeedbackProps {
    appointmentId?: number;
    doctorId?: number;
    doctorName?: string;
    onClose?: () => void;
    onSubmit?: (rating: number, comment: string) => void;
}

export function QuickFeedback({ 
    appointmentId, 
    doctorId, 
    doctorName,
    onClose,
    onSubmit 
}: QuickFeedbackProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [step, setStep] = useState<'rating' | 'comment' | 'thanks'>('rating');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Check if there's a pending feedback request
        const pendingFeedback = localStorage.getItem('pending_feedback');
        if (pendingFeedback) {
            const data = JSON.parse(pendingFeedback);
            if (data.appointmentId && !data.submitted) {
                setIsOpen(true);
            }
        }
    }, []);

    const handleRatingSelect = (value: number) => {
        setRating(value);
        if (value >= 4) {
            // Good rating, skip to thanks
            handleSubmit(value, '');
        } else {
            // Lower rating, ask for feedback
            setStep('comment');
        }
    };

    const handleSubmit = async (finalRating: number, finalComment: string) => {
        setSubmitting(true);
        try {
            if (appointmentId && doctorId) {
                await axiosInstance.post('/reviews', {
                    appointmentId,
                    doctorId,
                    rating: finalRating,
                    comment: finalComment
                });
            }
            
            // Mark as submitted
            localStorage.removeItem('pending_feedback');
            
            onSubmit?.(finalRating, finalComment);
            setStep('thanks');
            
            // Auto close after 2 seconds
            setTimeout(() => {
                setIsOpen(false);
                onClose?.();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        onClose?.();
    };

    const quickComments = [
        'Atendimento excelente',
        'Médico atencioso',
        'Consulta rápida',
        'Poderia melhorar',
        'Demorou muito',
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl"
                >
                    {step === 'rating' && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Como foi sua consulta?
                                </h3>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {doctorName && (
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    Avalie sua consulta com Dr(a). {doctorName}
                                </p>
                            )}

                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => handleRatingSelect(value)}
                                        onMouseEnter={() => setHoveredRating(value)}
                                        onMouseLeave={() => setHoveredRating(0)}
                                        className="p-2 transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${
                                                value <= (hoveredRating || rating)
                                                    ? 'text-yellow-400 fill-yellow-400'
                                                    : 'text-gray-300 dark:text-gray-600'
                                            }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-center gap-4 text-sm text-gray-500">
                                <span>Ruim</span>
                                <span>Excelente</span>
                            </div>
                        </>
                    )}

                    {step === 'comment' && (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    O que podemos melhorar?
                                </h3>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="flex gap-1 justify-center mb-4">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <Star
                                        key={value}
                                        className={`w-6 h-6 ${
                                            value <= rating
                                                ? 'text-yellow-400 fill-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {quickComments.map((text) => (
                                    <button
                                        key={text}
                                        onClick={() => setComment(text)}
                                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                                            comment === text
                                                ? 'bg-cyan-600 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {text}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Conte-nos mais sobre sua experiência..."
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                rows={3}
                            />

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setStep('rating')}
                                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={() => handleSubmit(rating, comment)}
                                    disabled={submitting}
                                    className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    {submitting ? 'Enviando...' : 'Enviar'}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 'thanks' && (
                        <div className="text-center py-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4"
                            >
                                <ThumbsUp className="w-8 h-8 text-emerald-600" />
                            </motion.div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Obrigado!
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Sua avaliação nos ajuda a melhorar
                            </p>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// Floating feedback button for post-consultation
export function FeedbackTrigger({ appointmentId, doctorId, doctorName }: {
    appointmentId: number;
    doctorId: number;
    doctorName: string;
}) {
    const [showFeedback, setShowFeedback] = useState(false);

    return (
        <>
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setShowFeedback(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
            >
                <MessageSquare className="w-6 h-6" />
            </motion.button>

            {showFeedback && (
                <QuickFeedback
                    appointmentId={appointmentId}
                    doctorId={doctorId}
                    doctorName={doctorName}
                    onClose={() => setShowFeedback(false)}
                />
            )}
        </>
    );
}

export default QuickFeedback;
