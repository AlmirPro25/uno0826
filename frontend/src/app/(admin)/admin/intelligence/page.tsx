"use client";

import { useState, useEffect } from "react";
import { Brain, Sparkles, MessageSquare, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Narrative {
    text: string;
    timestamp: string;
}

export default function IntelligencePage() {
    const [narrative, setNarrative] = useState<Narrative | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchNarrative = async () => {
        setLoading(true);
        setError(false);
        try {
            const res = await api.get("/admin/narrator/interpret");
            // Validação forte: só aceita se vier texto real
            if (res.data && res.data.text) {
                setNarrative(res.data);
            } else {
                setNarrative(null);
            }
        } catch (err) {
            console.error("Narrator fetch error", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNarrative();
    }, []);

    return (
        <div className="max-w-7xl space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                        CENTRO DE <span className="text-indigo-500">INTELIGÊNCIA</span>
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Narrativa cognitiva do sistema.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchNarrative}
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-slate-400 hover:text-white"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Atualizar Análise
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-10">

                {/* Cognitive Narrator - Main Window */}
                <div className="col-span-1 space-y-6">
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[40px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                        <div className="relative bg-[#020617] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="flex items-center justify-between px-10 py-6 border-b border-white/5 bg-white/[0.01]">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Brain className="w-5 h-5 text-indigo-500" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Cognitive Narrator v1.0</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    {loading ? (
                                        <>
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Processando...</span>
                                        </>
                                    ) : error ? (
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Erro de Conexão</span>
                                    ) : (
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
                                    )}
                                </div>
                            </div>

                            <div className="p-10 min-h-[300px] flex flex-col justify-center">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                                        <p className="text-sm font-medium text-slate-500 animate-pulse">Consultando oráculo neural...</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <AlertTriangle className="w-8 h-8 text-rose-500" />
                                        <p className="text-sm font-medium text-rose-500">Não foi possível conectar ao subsistema de inteligência.</p>
                                        <Button variant="outline" size="sm" onClick={fetchNarrative}>Tentar Novamente</Button>
                                    </div>
                                ) : narrative ? (
                                    <div className="flex gap-6 max-w-4xl mx-auto">
                                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="prose prose-invert prose-p:text-slate-300 prose-p:text-lg prose-p:leading-relaxed max-w-none">
                                                <p className="whitespace-pre-wrap font-medium indent-0 italic">
                                                    "{narrative.text}"
                                                </p>
                                            </div>
                                            <div className="pt-4 flex items-center gap-2">
                                                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-widest">Gerado em:</span>
                                                <span className="text-[10px] font-mono text-indigo-400">{new Date(narrative.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 font-medium">O narrador não gerou nenhum insight para o momento atual.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seções de Timeline e Matriz removidas por serem mocks sem endpoint real */}

            </div>
        </div>
    );
}
