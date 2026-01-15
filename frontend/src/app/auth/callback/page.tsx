"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Processando autenticação...");

    useEffect(() => {
        const processCallback = async () => {
            // Pegar dados da URL (vindos do backend após callback do Google)
            const token = searchParams.get("token");
            const refreshToken = searchParams.get("refresh_token");
            const errorParam = searchParams.get("error");
            const email = searchParams.get("email");
            const name = searchParams.get("name");

            // Se houver erro
            if (errorParam) {
                setStatus("error");
                const errorMessages: Record<string, string> = {
                    "missing_params": "Parâmetros de autenticação ausentes",
                    "invalid_state": "Estado de autenticação inválido",
                    "state_not_found": "Sessão de autenticação não encontrada",
                    "state_expired": "Sessão de autenticação expirada",
                    "state_already_used": "Sessão de autenticação já utilizada",
                    "oauth_failed": "Falha na autenticação com Google",
                    "mock_blocked_in_production": "Modo de teste não disponível em produção",
                };
                setMessage(errorMessages[errorParam] || `Erro: ${errorParam}`);
                setTimeout(() => router.push("/login"), 3000);
                return;
            }

            // Se tiver tokens, fazer login
            if (token && refreshToken) {
                try {
                    setMessage(`Bem-vindo${name ? `, ${name}` : ""}!`);
                    await login(token, refreshToken);
                    setStatus("success");
                    // O login já redireciona para o dashboard
                } catch (err) {
                    console.error("Erro ao processar login:", err);
                    setStatus("error");
                    setMessage("Erro ao processar autenticação");
                    setTimeout(() => router.push("/login"), 3000);
                }
            } else {
                setStatus("error");
                setMessage("Dados de autenticação não encontrados");
                setTimeout(() => router.push("/login"), 3000);
            }
        };

        processCallback();
    }, [searchParams, login, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                {status === "loading" && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-500 mx-auto" />
                        <p className="text-muted-foreground">{message}</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                        <p className="text-foreground font-medium">{message}</p>
                        <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <p className="text-red-400 font-medium">{message}</p>
                        <p className="text-sm text-muted-foreground">Redirecionando para login...</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
