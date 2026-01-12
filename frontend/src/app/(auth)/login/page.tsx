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
                error.response?.data?.error || "Credenciais inválidas. Tente novamente."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
        >
            <div className="flex flex-col space-y-2 mb-10">
                <h1 className="text-3xl font-black text-foreground tracking-tighter">
                    Bem-vindo de volta
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Acesse seu kernel soberano para continuar
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 text-xs md:text-sm font-medium text-rose-400 bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-2"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Corporativo</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                type="text"
                                placeholder="nome@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="username"
                                className="bg-white/[0.03] border-border rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-foreground placeholder:text-muted-foreground/50 font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Senha</label>
                            <Link
                                href="/forgot-password"
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                            >
                                Esqueceu?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                className="bg-white/[0.03] border-border rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-foreground placeholder:text-muted-foreground/50 font-medium"
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Autenticando...
                        </>
                    ) : (
                        <>
                            Acessar Dashboard
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-xs text-muted-foreground font-medium">
                    Ainda não possui uma instância?{" "}
                    <Link
                        href="/register"
                        className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                    >
                        Deploy Kernel
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
