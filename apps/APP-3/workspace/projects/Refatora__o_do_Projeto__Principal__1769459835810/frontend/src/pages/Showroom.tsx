
import { useEffect, useState } from 'react';
import { useFleetStore } from '@/store/useFleetStore';
import { CarCard } from '@/components/CarCard';
import { InquiryModal } from '@/components/InquiryModal';
import { Machine } from '@/types';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { motion } from 'framer-motion';

export const Showroom = () => {
    const { fleet, isLoading, error, fetchFleet } = useFleetStore();
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

    useEffect(() => {
        fetchFleet();
    }, [fetchFleet]);

    return (
        <div className="min-h-screen bg-background text-slate-300">
            <Navbar />
            
            {/* Hero Section */}
            <header className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center">
                    <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
                </div>
                
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gold-500 font-bold tracking-[0.3em] uppercase text-sm"
                    >
                        Excelência Automotiva
                    </motion.p>
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-6xl md:text-8xl font-serif text-white leading-tight"
                    >
                        Além da <span className="italic font-light text-slate-400">Máquina</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-lg text-slate-400 font-light max-w-lg mx-auto"
                    >
                        Uma curadoria de engenharia sem compromissos. Onde a performance encontra a arte absoluta.
                    </motion.p>
                </div>
            </header>

            {/* Content */}
            <main id="showroom" className="max-w-7xl mx-auto px-6 py-24">
                <div className="flex items-end justify-between mb-16">
                    <div>
                        <h2 className="text-3xl font-serif text-white">Inventário Exclusivo</h2>
                        <div className="h-0.5 w-24 bg-gold-500 mt-4" />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-20 border border-red-500/20 bg-red-900/10 rounded-sm">
                        <p className="text-red-400">{error}</p>
                        <button onClick={() => fetchFleet()} className="mt-4 text-sm underline hover:text-white">Tentar novamente</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {fleet.map((machine, idx) => (
                            <CarCard 
                                key={machine.id} 
                                machine={machine} 
                                index={idx}
                                onInquire={setSelectedMachine} 
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 text-center">
                <p className="text-slate-600 text-sm tracking-wider uppercase">LuxeDigital &copy; 2024 • All Rights Reserved</p>
            </footer>

            <InquiryModal 
                isOpen={!!selectedMachine} 
                onClose={() => setSelectedMachine(null)} 
                machine={selectedMachine} 
            />
        </div>
    );
};

===FILE: frontend/src/App.tsx===
LANGUAGE: typescript
