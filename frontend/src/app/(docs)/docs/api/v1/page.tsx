"use client";

import { useState } from "react";
import { Box, Copy, CheckCircle, ChevronRight, Lock } from "lucide-react";

interface Endpoint {
    method: "GET" | "POST" | "PUT" | "DELETE";
    path: string;
    description: string;
    auth: boolean;
}

const endpoints: Record<string, Endpoint[]> = {
    "Identity": [
        { method: "POST", path: "/api/v1/identity/register", description: "Registrar novo usuário", auth: false },
        { method: "POST", path: "/api/v1/identity/login", description: "Login com email/senha", auth: false },
        { method: "GET", path: "/api/v1/identity/me", description: "Obter perfil do usuário", auth: true },
        { method: "PUT", path: "/api/v1/identity/me", description: "Atualizar perfil", auth: true },
        { method: "POST", path: "/api/v1/identity/link-app", description: "Vincular usuário a um app", auth: true },
    ],
    "Applications": [
        { method: "GET", path: "/api/v1/apps", description: "Listar aplicações", auth: true },
        { method: "POST", path: "/api/v1/apps", description: "Criar nova aplicação", auth: true },
        { method: "GET", path: "/api/v1/apps/:id", description: "Obter detalhes da aplicação", auth: true },
        { method: "PUT", path: "/api/v1/apps/:id", description: "Atualizar aplicação", auth: true },
        { method: "DELETE", path: "/api/v1/apps/:id", description: "Deletar aplicação", auth: true },
        { method: "POST", path: "/api/v1/apps/:id/rotate-secret", description: "Rotacionar secret key", auth: true },
    ],
    "Events": [
        { method: "POST", path: "/api/v1/events", description: "Emitir evento", auth: true },
        { method: "GET", path: "/api/v1/events", description: "Listar eventos", auth: true },
        { method: "GET", path: "/api/v1/events/:id", description: "Obter evento específico", auth: true },
    ],
    "Telemetry": [
        { method: "POST", path: "/api/v1/telemetry/ingest", description: "Ingerir métricas", auth: true },
        { method: "GET", path: "/api/v1/telemetry/metrics", description: "Obter métricas agregadas", auth: true },
        { method: "GET", path: "/api/v1/telemetry/alerts", description: "Listar alertas ativos", auth: true },
    ],
    "Billing": [
        { method: "GET", path: "/api/v1/billing/account", description: "Obter conta de billing", auth: true },
        { method: "GET", path: "/api/v1/billing/subscriptions/status", description: "Status da assinatura", auth: true },
        { method: "POST", path: "/api/v1/billing/checkout/pro", description: "Iniciar checkout Pro", auth: true },
        { method: "POST", path: "/api/v1/billing/portal", description: "Abrir portal Stripe", auth: true },
    ],
};

const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PUT: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    DELETE: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

export default function ApiReferencePage() {
    const [copied, setCopied] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string>("Identity");

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-12 max-w-4xl">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm tracking-widest uppercase">
                    <Box className="w-4 h-4" />
                    API Reference
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                    API <span className="text-emerald-500">v1</span>
                </h1>
                <p className="text-lg text-slate-400">
                    Referência completa dos endpoints REST do PROST-QS.
                </p>
            </div>

            {/* Base URL */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Base URL</p>
                        <code className="text-emerald-400 font-mono">https://api.prostqs.com</code>
                    </div>
                    <button
                        onClick={() => copyToClipboard("https://api.prostqs.com")}
                        className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        {copied === "https://api.prostqs.com" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Auth Header */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Autenticação</p>
                <code className="text-slate-300 font-mono text-sm">Authorization: Bearer {"<token>"}</code>
                <p className="text-xs text-slate-500 mt-2">
                    Endpoints marcados com <Lock className="w-3 h-3 inline text-amber-400" /> requerem autenticação.
                </p>
            </div>

            {/* Endpoints */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Endpoints</h2>
                
                {Object.entries(endpoints).map(([category, items]) => (
                    <div key={category} className="border border-white/5 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setExpanded(expanded === category ? "" : category)}
                            className="w-full p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                        >
                            <span className="font-bold text-white">{category}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">{items.length} endpoints</span>
                                <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${expanded === category ? "rotate-90" : ""}`} />
                            </div>
                        </button>
                        
                        {expanded === category && (
                            <div className="divide-y divide-white/5">
                                {items.map((endpoint) => (
                                    <div key={endpoint.path} className="p-4 flex items-center gap-4 hover:bg-white/[0.02]">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded border ${methodColors[endpoint.method]}`}>
                                            {endpoint.method}
                                        </span>
                                        <div className="flex-1">
                                            <code className="text-sm text-white font-mono">{endpoint.path}</code>
                                            <p className="text-xs text-slate-500 mt-1">{endpoint.description}</p>
                                        </div>
                                        {endpoint.auth && <Lock className="w-4 h-4 text-amber-400" />}
                                        <button
                                            onClick={() => copyToClipboard(endpoint.path)}
                                            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            {copied === endpoint.path ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Example Request */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Exemplo de Request</h2>
                <div className="bg-black/30 border border-white/10 rounded-xl p-4 font-mono text-sm">
                    <pre className="text-slate-300">{`curl -X POST https://api.prostqs.com/api/v1/events \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "user.action.completed",
    "data": { "action": "purchase" }
  }'`}</pre>
                </div>
            </div>
        </div>
    );
}
