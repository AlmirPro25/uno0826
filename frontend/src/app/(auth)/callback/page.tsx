"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Processando autenticação...");

    useEffect(() => {
        const processCallback = async () => {
            const error = searchParams.get("error");
            if (error) {
                setStatus("error");
                const errorMessages: Record<string, string> = {
                    "state_not_found": "Sessão expirada. Tente novamente.",
                    "state_expired": "Sessão expirada. Tente novamente.",
                    "state_already_used": "Link já utilizado. Faça login novamente.",
                    "oauth_failed": "Falha na autenticação com Google.",
                    "missing_params": "Parâmetros inválidos.",
                    "invalid_state": "Estado inválido.",
                };
                setMessage(errorMessages[error] || "Erro desconhecido na autenticação.");
                setTimeout(() => router.push("/login"), 3000);
                return;
            }

            const token = searchParams.get("token");
            const refreshToken = searchParams.get("refresh_token");

            if (!token || !refreshToken) {
                setStatus("error");
                setMessage("Tokens não recebidos. Tente novamente.");
                setTimeout(() => router.push("/login"), 3000);
                return;
            }

            try {
                await login(token, refreshToken);
                setStatus("success");
                setMessage("Autenticação bem-sucedida! Redirecionando...");
                // login() já faz o redirect, não precisa fazer aqui
            } catch (err) {
                console.error("OAuth callback error:", err);
                setStatus("error");
                setMessage("Erro ao processar autenticação.");
                setTimeout(() => router.push("/login"), 3000);
            }
        };

        processCallback();
    }, [searchParams, login, router]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] text-center"
        >
            {status === "loading" && (
                <>
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Autenticando...</h2>
                    <p className="text-muted-foreground">{message}</p>
                </>
            )}
            {status === "success" && (
                <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Bem-vindo!</h2>
                    <p className="text-muted-foreground">{message}</p>
                </>
            )}
            {status === "error" && (
                <>
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                        <XCircle className="w-16 h-16 text-rose-500 mb-6" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-foreground mb-2">Erro na Autenticação</h2>
                    <p className="text-muted-foreground mb-4">{message}</p>
                    <p className="text-xs text-muted-foreground">Redirecionando para login...</p>
                </>
            )}
        </motion.div>
    );
}

function LoadingFallback() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-2">Carregando...</h2>
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CallbackContent />
        </Suspense>
    );
}
