"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function PaymentSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshUser } = useAuth();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

    // Pega session_id da URL (padrão Stripe)
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        const verifyPayment = async () => {
            // Se já for PRO e não tiver session_id para validar, assume sucesso (navegação interna)
            // Mas por segurança, se tiver session_id, sempre valida no backend
            // Sempre validar sessão se existir
            /* 
            if (user?.plan === "pro" && !sessionId) {
                setStatus("success");
                triggerConfetti();
                return;
            }
            */

            try {
                // Se tiver session_id, chama endpoint de callback do billing
                if (sessionId) {
                    await api.post("/billing/verify-session", { session_id: sessionId });
                    await refreshUser(); // Atualiza contexto local para refletir PRO
                    setStatus("success");
                    triggerConfetti();
                } else {
                    // Sem ID e sem ser PRO? Algo errado. Force check.
                    await refreshUser();
                    // Pequeno delay para garantir que o refresh terminou
                    setTimeout(() => {
                        // Como removemos user.plan, assumimos que se chegou aqui sem erro do refresh, está ok ou inválido.
                        // Mas idealmente deveria ter session_id.
                        setStatus("error");
                    }, 1000);
                }
            } catch (error) {
                console.error("Payment verification failed", error);
                setStatus("error");
            }
        };

        // Pequeno delay inicial para UX
        const timer = setTimeout(verifyPayment, 1000);
        return () => clearTimeout(timer);
    }, [sessionId, user, refreshUser]);

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    };

    if (status === "verifying") {
        return (
            <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500 animate-pulse" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">Confirmando Transação</h2>
                    <p className="text-slate-500 text-sm mt-2">Aguardando confirmação segura do gateway...</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center space-y-6"
            >
                <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                    <XCircle className="w-12 h-12 text-rose-500" />
                </div>

                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Pagamento não confirmado</h1>
                    <p className="text-slate-400 mt-4">
                        Não conseguimos validar sua transação automaticamente. Se o valor foi debitado, entre em contato com o suporte.
                    </p>
                </div>

                <div className="pt-6 grid gap-3">
                    <Button size="lg" variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={() => window.location.reload()}>
                        Tentar Novamente
                    </Button>
                    <Button size="lg" className="w-full bg-rose-600 hover:bg-rose-500 text-white" onClick={() => window.location.href = '/dashboard/billing'}>
                        Voltar para Billing
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6"
        >
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)]">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
            </div>

            <div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Pagamento Confirmado!</h1>
                <p className="text-indigo-300 font-bold uppercase tracking-widest text-xs mt-2 bg-indigo-500/10 py-1 px-3 rounded-full inline-block">
                    Upgrade Realizado com Sucesso
                </p>
                <p className="text-slate-400 mt-6 text-sm leading-relaxed">
                    Bem-vindo à elite do UNO.KERNEL. Todos os limites foram removidos e as ferramentas de inteligência avançada já estão ativas na sua conta.
                </p>
            </div>

            <div className="pt-8">
                <Button
                    size="lg"
                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 text-sm rounded-xl"
                    onClick={() => router.push('/dashboard')}
                >
                    Acessar Dashboard Agora
                </Button>
            </div>
        </motion.div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505] to-[#050505]">
            <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-white/20" />}>
                <PaymentSuccessContent />
            </Suspense>
        </div>
    );
}
