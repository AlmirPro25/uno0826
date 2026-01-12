"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
    {
        text: "O UNO transformou nossa infraestrutura de billing e auth em algo invisível. Ganhamos meses de produtividade focando no que importa.",
        author: "Almir Miranda",
        role: "Lead Developer, Intelligent Systems Inc.",
        avatar: "AM"
    },
    {
        text: "A capacidade de orquestrar agentes de IA com guardrails financeiros nativos é algo que não vimos em nenhum outro kernel do mercado.",
        author: "Sarah Connor",
        role: "CTO, Skynet Corp",
        avatar: "SC"
    },
    {
        text: "Simplesmente a melhor DX para sistemas distribuídos. A soberania de dados finalmente se tornou acessível para startups.",
        author: "Neo Anderson",
        role: "Architect, Matrix Solutions",
        avatar: "NA"
    }
];

export function TestimonialCarousel() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative h-40">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden group hover:bg-white/[0.07] transition-colors">
                        <Quote className="absolute top-4 right-4 w-8 h-8 text-indigo-500/20 rotate-12" />

                        <p className="text-slate-300 text-sm italic mb-6 leading-relaxed">
                            "{TESTIMONIALS[index].text}"
                        </p>

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-indigo-500/20">
                                {TESTIMONIALS[index].avatar}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-white">{TESTIMONIALS[index].author}</p>
                                <p className="text-[10px] text-indigo-300 font-medium uppercase tracking-wide">{TESTIMONIALS[index].role}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
