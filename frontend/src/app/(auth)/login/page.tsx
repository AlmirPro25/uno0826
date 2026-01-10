"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { LoginResponse } from "@/types";
import { Lock, Mail, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // PROST-QS Auth Flow
            const res = await api.post<LoginResponse>("/auth/login", {
                username: email,
                password
            });

            await login(
                res.data.token,
                res.data.refreshToken
            );
        } catch (err: unknown) {
            console.error(err);
            const error = err as { response?: { data?: { error?: string } } };
            setError(
                error.response?.data?.error || "Invalid credentials. Please try again."
            );
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
            <div className="flex flex-col space-y-2 mb-8 uppercase tracking-widest">
                <h1 className="text-3xl font-black text-white leading-none">Acessar <span className="text-indigo-500">Kernel</span></h1>
                <p className="text-xs text-slate-500 font-bold">Autenticação Soberana Requerida</p>
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

                <div className="space-y-4">
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            type="text"
                            placeholder="Seu usuário ou email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all text-white placeholder:text-slate-600"
                        />
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            type="password"
                            placeholder="Sua senha secreta"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all text-white placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all text-white font-bold text-sm uppercase tracking-widest group" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Autenticando...
                        </>
                    ) : (
                        <>
                            Entrar no Sistema <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-8 flex flex-col gap-4 text-center">
                <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                >
                    Esqueceu a senha?
                </Link>
                <div className="h-px bg-white/5 w-full" />
                <p className="text-xs text-slate-500 font-medium">
                    Não tem uma identidade?{" "}
                    <Link
                        href="/register"
                        className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4"
                    >
                        Criar Conta Agora
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
