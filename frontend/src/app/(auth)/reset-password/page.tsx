"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Loader2, CheckCircle2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">Link Inválido</h2>
                <p className="text-slate-500 text-sm">
                    O link de recuperação parece estar incompleto ou expirado.
                </p>
                <Link href="/forgot-password">
                    <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5 text-white">
                        Solicitar novo link
                    </Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        if (password.length < 8) {
            setError("A senha deve ter no mínimo 8 caracteres.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/auth/reset-password", {
                token,
                password,
                password_confirmation: confirmPassword
            });
            setSuccess(true);
            toast.success("Senha atualizada com sucesso!");
            setTimeout(() => router.push("/login"), 3000);
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { error?: string } } };
            setError(errorObj.response?.data?.error || "Falha ao redefinir senha. O link pode ter expirado.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
            >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Senha Atualizada!</h1>
                <p className="text-slate-400 mb-8">
                    Sua senha foi alterada com sucesso. Você será redirecionado para o login em instantes.
                </p>
                <Link href="/login">
                    <Button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs">
                        Ir para Login agora
                    </Button>
                </Link>
            </motion.div>
        );
    }

    return (
        <>
            <div className="flex flex-col space-y-2 mb-8 uppercase tracking-widest">
                <h1 className="text-3xl font-black text-white leading-none">Nova <span className="text-indigo-500">Senha</span></h1>
                <p className="text-xs text-slate-500 font-bold">Defina suas novas credenciais de acesso</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 text-xs font-bold text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20 uppercase tracking-wide"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="space-y-4">
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Nova senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 rounded-xl pl-12 pr-12 h-12 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all text-white placeholder:text-slate-600"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirme a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="bg-white/5 border-white/10 rounded-xl pl-12 h-12 focus:border-indigo-500/50 focus:ring-indigo-500/20 transition-all text-white placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] active:scale-95 transition-all text-white font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Atualizando...
                            </>
                        ) : (
                            "Redefinir Senha"
                        )}
                    </Button>

                    <Link href="/login" className="flex items-center justify-center text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest pt-2">
                        <ArrowLeft className="w-3 h-3 mr-2" /> Cancelar
                    </Link>
                </div>
            </form>
        </>
    );
}

function ResetLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verificando token...</p>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl shadow-2xl shadow-black/50"
        >
            <Suspense fallback={<ResetLoading />}>
                <ResetPasswordForm />
            </Suspense>
        </motion.div>
    );
}
