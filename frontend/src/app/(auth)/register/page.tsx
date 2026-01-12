"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { User, Mail, Lock, ArrowRight, Loader2, Check } from "lucide-react";

export default function RegisterPage() {
    const { login } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.post("/auth/register", {
                username: email,
                name,
                email,
                password
            });

            const loginRes = await api.post("/auth/login", {
                username: email,
                password,
                applicationScope: "prost-qs"
            });

            await login(
                loginRes.data.token,
                loginRes.data.refreshToken
            );
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(
                err.response?.data?.error || "Falha no registro. Tente novamente."
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
                    Criar Identidade
                </h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Inicie sua soberania no kernel em segundos.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                type="text"
                                placeholder="Satoshi Nakamoto"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoComplete="name"
                                className="bg-white/[0.03] border-border rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-foreground placeholder:text-muted-foreground/50 font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                type="email"
                                placeholder="satoshi@bitcoin.org"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                                className="bg-white/[0.03] border-border rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-foreground placeholder:text-muted-foreground/50 font-medium"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                className="bg-white/[0.03] border-border rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all text-foreground placeholder:text-muted-foreground/50 font-medium"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-white text-black hover:bg-slate-200 font-black text-xs uppercase tracking-widest shadow-lg shadow-white/10 hover:shadow-white/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px] group"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Inicializando...
                            </>
                        ) : (
                            <>
                                Iniciar Jornada <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </Button>
                </div>
            </form>

            <div className="mt-8 text-center pt-8 border-t border-border/50">
                <p className="text-xs text-muted-foreground font-medium">
                    Já possui acesso?{" "}
                    <Link
                        href="/login"
                        className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                    >
                        Entrar Agora
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
