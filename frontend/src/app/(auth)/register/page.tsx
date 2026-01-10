"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { User, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

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
            // 1. Register
            await api.post("/auth/register", {
                username: email,
                name,
                email,
                password
            });

            // 2. Login
            const loginRes = await api.post("/auth/login", {
                username: email,
                password,
                applicationScope: "prost-qs"
            });

            // 3. Set Auth State
            await login(
                loginRes.data.token,
                loginRes.data.refreshToken
            );
        } catch (err: any) {
            console.error("Registration error:", err);
            setError(
                err.response?.data?.error || "Registration failed. Please try again."
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
            <div className="flex flex-col space-y-2 mb-8 uppercase tracking-widest text-left">
                <h1 className="text-3xl font-black text-white leading-none">Criar <span className="text-indigo-500">Identidade</span></h1>
                <p className="text-xs text-slate-500 font-bold">Inicie sua soberania no kernel</p>
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
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            type="text"
                            placeholder="Seu nome completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all text-white placeholder:text-slate-600"
                        />
                    </div>

                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            type="email"
                            placeholder="Seu melhor email"
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
                            placeholder="Uma senha forte"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all text-white placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-white font-bold text-sm uppercase tracking-widest group" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando Identidade...
                        </>
                    ) : (
                        <>
                            Iniciar Jornada <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-8 flex flex-col gap-4 text-center border-t border-white/5 pt-8">
                <p className="text-xs text-slate-500 font-medium">
                    Já possui uma identidade?{" "}
                    <Link
                        href="/login"
                        className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-4"
                    >
                        Entrar Agora
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
