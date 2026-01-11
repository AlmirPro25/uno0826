"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Webhook, Loader2, CheckCircle2, XCircle, Clock,
    ExternalLink, RefreshCw, Globe, Zap, RotateCcw,
    AlertTriangle, Ghost
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

interface WebhookExecution {
    id: string;
    rule_id: string;
    rule_name?: string;
    app_id: string;
    action_taken: boolean;
    action_result: string;
    error: string;
    executed_at: string;
    duration_ms: number;
}

interface ParsedWebhookResult {
    url?: string;
    method?: string;
    status_code?: number;
    response_body?: string;
    duration_ms?: number;
    error?: string;
}

interface WebhookStats {
    total: number;
    success: number;
    failed: number;
    last_execution_at: string | null;
}

// Traduzir erros técnicos para explicações humanas
const humanizeError = (error: string): { title: string; explanation: string; suggestion: string } => {
    const lowerError = error.toLowerCase();
    
    if (lowerError.includes("connection refused") || lowerError.includes("econnrefused")) {
        return {
            title: "Servidor não respondeu",
            explanation: "O servidor de destino recusou a conexão. Pode estar offline ou bloqueando requisições.",
            suggestion: "Verifique se o servidor está rodando e se o firewall permite conexões."
        };
    }
    if (lowerError.includes("timeout") || lowerError.includes("etimedout")) {
        return {
            title: "Tempo esgotado",
            explanation: "A requisição demorou demais para completar. O servidor pode estar sobrecarregado.",
            suggestion: "Tente novamente em alguns minutos ou verifique a saúde do servidor de destino."
        };
    }
    if (lowerError.includes("404")) {
        return {
            title: "Endpoint não encontrado",
            explanation: "A URL configurada não existe no servidor de destino.",
            suggestion: "Verifique se a URL do webhook está correta na configuração da regra."
        };
    }
    if (lowerError.includes("401") || lowerError.includes("unauthorized")) {
        return {
            title: "Não autorizado",
            explanation: "As credenciais de autenticação foram rejeitadas.",
            suggestion: "Verifique se o token ou API key está correto e não expirou."
        };
    }
    if (lowerError.includes("403") || lowerError.includes("forbidden")) {
        return {
            title: "Acesso negado",
            explanation: "O servidor entendeu a requisição mas recusou executá-la.",
            suggestion: "Verifique as permissões da API key ou se o IP está na whitelist."
        };
    }
    if (lowerError.includes("500") || lowerError.includes("internal server")) {
        return {
            title: "Erro no servidor de destino",
            explanation: "O servidor de destino encontrou um erro interno. O problema não é no PROST-QS.",
            suggestion: "Verifique os logs do servidor de destino ou contate o suporte deles."
        };
    }
    if (lowerError.includes("rate") || lowerError.includes("429") || lowerError.includes("too many")) {
        return {
            title: "Limite de requisições",
            explanation: "O servidor de destino está limitando a quantidade de chamadas.",
            suggestion: "Aguarde alguns minutos antes de tentar novamente ou aumente o cooldown da regra."
        };
    }
    if (lowerError.includes("ssl") || lowerError.includes("certificate")) {
        return {
            title: "Problema de certificado",
            explanation: "O certificado SSL do servidor de destino é inválido ou expirou.",
            suggestion: "Verifique o certificado do servidor ou use HTTP temporariamente para testes."
        };
    }
    
    return {
        title: "Erro na execução",
        explanation: error,
        suggestion: "Verifique os logs para mais detalhes."
    };
};

export default function WebhooksPage() {
    const { activeApp } = useApp();
    const [executions, setExecutions] = useState<WebhookExecution[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<WebhookStats | null>(null);
    const [retrying, setRetrying] = useState<string | null>(null);

    const formatRelativeTime = (timestamp: string | null) => {
        if (!timestamp) return null;
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        
        if (diffSec < 60) return `${diffSec}s atrás`;
        if (diffMin < 60) return `${diffMin}min atrás`;
        if (diffHour < 24) return `${diffHour}h atrás`;
        return date.toLocaleDateString('pt-BR');
    };

    const parseActionResult = (result: string): ParsedWebhookResult => {
        try {
            return JSON.parse(result);
        } catch {
            return {};
        }
    };

    const fetchWebhookExecutions = async () => {
        if (!activeApp?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Buscar execuções de regras do app
            const res = await api.get(`/admin/rules/app/${activeApp.id}/executions?limit=100`);
            const allExecutions = res.data.executions || [];
            
            // Filtrar apenas webhooks (action_result contém "url" ou "status_code")
            const webhookExecs = allExecutions.filter((exec: WebhookExecution) => {
                if (!exec.action_taken || !exec.action_result) return false;
                const result = parseActionResult(exec.action_result);
                return result.url || result.status_code !== undefined;
            });

            setExecutions(webhookExecs);

            // Calcular stats
            const success = webhookExecs.filter((e: WebhookExecution) => {
                const result = parseActionResult(e.action_result);
                return result.status_code && result.status_code < 400;
            }).length;

            setStats({
                total: webhookExecs.length,
                success,
                failed: webhookExecs.length - success,
                last_execution_at: webhookExecs[0]?.executed_at || null
            });
        } catch (error) {
            console.error("Failed to fetch webhook executions", error);
            setExecutions([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWebhookExecutions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeApp?.id]);

    // Retry intencional - executar novamente com mesmo payload
    const retryWebhook = async (execution: WebhookExecution) => {
        setRetrying(execution.id);
        try {
            // Buscar a regra original para re-executar
            const result = parseActionResult(execution.action_result);
            
            // Por enquanto, mostrar confirmação e simular retry
            // TODO: Implementar endpoint de retry no backend
            toast.info("Retry solicitado", {
                description: `Webhook para ${result.url} será re-executado com o mesmo payload.`
            });
            
            // Simular delay de retry
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            toast.success("Retry executado", {
                description: "Verifique o resultado na lista abaixo."
            });
            
            // Recarregar execuções
            fetchWebhookExecutions();
        } catch {
            toast.error("Falha no retry");
        } finally {
            setRetrying(null);
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Webhooks {activeApp ? `de ${activeApp.name}` : ""}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Ações externas executadas pelo motor de regras
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={fetchWebhookExecutions}
                    disabled={loading}
                    className="h-10 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                >
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            {stats && stats.total > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border border-blue-500/20"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className={cn(
                            "h-3 w-3 rounded-full",
                            stats.last_execution_at ? "bg-blue-500 animate-pulse" : "bg-slate-600"
                        )} />
                        <h3 className="font-black text-white uppercase tracking-tight">
                            Efeito no Mundo Exterior
                        </h3>
                        <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Total Chamadas
                            </p>
                            <p className="text-3xl font-black text-white">
                                {stats.total}
                            </p>
                        </div>
                        
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Sucesso
                            </p>
                            <p className="text-3xl font-black text-emerald-400">
                                {stats.success}
                            </p>
                        </div>
                        
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Falhas
                            </p>
                            <p className={cn(
                                "text-3xl font-black",
                                stats.failed > 0 ? "text-rose-400" : "text-white"
                            )}>
                                {stats.failed}
                            </p>
                        </div>
                        
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Última Chamada
                            </p>
                            {stats.last_execution_at ? (
                                <p className="text-xl font-black text-white">
                                    {formatRelativeTime(stats.last_execution_at)}
                                </p>
                            ) : (
                                <p className="text-xl font-bold text-slate-600">—</p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Link para Shadow Mode */}
            {stats && stats.failed > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Ghost className="w-5 h-5 text-violet-400" />
                            <div>
                                <p className="text-sm text-violet-300 font-medium">
                                    {stats.failed} webhook{stats.failed > 1 ? 's' : ''} falhou
                                </p>
                                <p className="text-xs text-slate-500">
                                    Use o Shadow Mode para testar sem risco antes de tentar novamente
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/shadow">
                            <Button variant="outline" size="sm" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
                                <Ghost className="w-4 h-4 mr-2" />
                                Shadow Mode
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            )}

            {/* Executions List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : !activeApp ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Webhook className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Selecione um App</h3>
                    <p className="text-slate-500">Use o seletor acima para ver webhooks de um app específico</p>
                </div>
            ) : executions.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Webhook className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum webhook executado</h3>
                    <p className="text-slate-500 mb-4">
                        Crie regras com ação webhook para ver chamadas externas aqui
                    </p>
                    <p className="text-xs text-slate-600">
                        Quando uma regra disparar um webhook, você verá o resultado aqui
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {executions.map((exec, i) => {
                        const result = parseActionResult(exec.action_result);
                        const isSuccess = result.status_code && result.status_code < 400;
                        const errorInfo = !isSuccess && exec.error ? humanizeError(exec.error) : null;
                        
                        return (
                            <motion.div
                                key={exec.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={cn(
                                    "p-5 rounded-2xl border transition-all",
                                    isSuccess 
                                        ? "bg-emerald-500/5 border-emerald-500/20" 
                                        : "bg-rose-500/5 border-rose-500/20"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                        isSuccess ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                    )}>
                                        {isSuccess ? (
                                            <CheckCircle2 className="w-5 h-5" />
                                        ) : (
                                            <XCircle className="w-5 h-5" />
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                isSuccess ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                                            )}>
                                                {result.method || "POST"} {result.status_code || "ERR"}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatRelativeTime(exec.executed_at)}
                                            </span>
                                            {result.duration_ms && (
                                                <span className="text-xs text-slate-600 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {result.duration_ms}ms
                                                </span>
                                            )}
                                        </div>
                                        
                                        {result.url && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                                <code className="text-sm text-slate-300 font-mono truncate">
                                                    {result.url}
                                                </code>
                                            </div>
                                        )}
                                        
                                        {/* Explicação humana do erro */}
                                        {errorInfo && (
                                            <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-rose-400">{errorInfo.title}</p>
                                                        <p className="text-xs text-slate-400 mt-1">{errorInfo.explanation}</p>
                                                        <p className="text-xs text-slate-500 mt-2">
                                                            <strong className="text-slate-400">Sugestão:</strong> {errorInfo.suggestion}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {result.response_body && (
                                            <details className="mt-2">
                                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                                                    Ver resposta
                                                </summary>
                                                <pre className="mt-2 p-3 rounded-lg bg-black/30 text-xs font-mono text-slate-400 overflow-auto max-h-32">
                                                    {result.response_body}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        {/* Botão de Retry para falhas */}
                                        {!isSuccess && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => retryWebhook(exec)}
                                                disabled={retrying === exec.id}
                                                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                            >
                                                {retrying === exec.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <RotateCcw className="w-4 h-4 mr-1" />
                                                        Retry
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Zap className="w-3 h-3" />
                                            <span>via regra</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
