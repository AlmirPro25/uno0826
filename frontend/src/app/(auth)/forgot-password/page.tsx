"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post("/auth/forgot-password", { email });
            setSubmitted(true);
            toast.success("Email enviado com sucesso!");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            // Mesmo se o email não existir, mostramos sucesso por segurança
            if (error.response?.data?.error?.includes("not found")) {
                setSubmitted(true);
            } else {
                setError(error.response?.data?.error || "Falha ao enviar email. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl shadow-2xl shadow-black/50"
        >
            {!submitted ? (
                <>
                    <Link href="/login" className="mb-8 flex items-center text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Login
                    </Link>
                    
                    <div className="flex flex-col space-y-2 mb-8 uppercase tracking-widest">
                        <h1 className="text-3xl font-black text-white leading-none">Recuperar <span className="text-indigo-500">Acesso</span></h1>
                        <p className="text-xs text-slate-500 font-bold">Enviaremos um link de recuperação</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-4 text-sm text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                type="email"
                                placeholder="Seu email cadastrado"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="bg-white/5 border-white/10 rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all text-white placeholder:text-slate-600"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-white font-bold text-sm uppercase tracking-widest group" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    Enviar Link <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Verifique seu Email</h1>
                    <p className="text-slate-400 mb-8">
                        Enviamos um link de recuperação para{" "}
                        <span className="font-bold text-white">{email}</span>
                    </p>
                    <p className="text-xs text-slate-500 mb-6">
                        Não recebeu? Verifique a pasta de spam ou tente novamente em alguns minutos.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button 
                            variant="outline" 
                            className="w-full h-12 rounded-xl border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                            onClick={() => setSubmitted(false)}
                        >
                            Tentar outro email
                        </Button>
                        <Link href="/login">
                            <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs">
                                Voltar ao Login
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
