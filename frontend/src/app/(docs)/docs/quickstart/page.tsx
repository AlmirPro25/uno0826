"use client";

import { motion } from "framer-motion";
import { Copy, Check, Zap, Box, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

interface UserApp {
    id: string;
    name: string;
    slug: string;
    api_key?: string;
}

export default function QuickstartPage() {
    const [copied, setCopied] = useState<string | null>(null);
    const [userApp, setUserApp] = useState<UserApp | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        async function loadUserApp() {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            setIsAuthenticated(true);
            try {
                const res = await api.get("/apps/mine?limit=1");
                if (res.data.apps && res.data.apps.length > 0) {
                    const app = res.data.apps[0];
                    // Try to get credentials
                    try {
                        const credRes = await api.get(`/apps/${app.id}/credentials`);
                        setUserApp({ ...app, api_key: credRes.data.api_key });
                    } catch {
                        setUserApp(app);
                    }
                }
            } catch (e) {
                console.log("Could not load user app", e);
            } finally {
                setLoading(false);
            }
        }
        loadUserApp();
    }, []);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        toast.success("Copiado!");
        setTimeout(() => setCopied(null), 2000);
    };

    const apiKey = userApp?.api_key || "YOUR_API_KEY";

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm tracking-widest uppercase">
                        <Zap className="w-4 h-4" />
                        Quickstart
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        Início <span className="text-indigo-500">Rápido</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl">
                        Integre o PROST-QS em 5 minutos. Autenticação, eventos e billing prontos para usar.
                    </p>
                </div>

                {/* User App Context Banner */}
                {loading ? (
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-slate-400 text-sm">Carregando seu app...</span>
                    </div>
                ) : userApp ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                                {userApp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-emerald-400 font-bold">Usando credenciais do seu app</p>
                                <p className="text-white font-bold">{userApp.name}</p>
                            </div>
                            <Link href={`/dashboard/apps/${userApp.id}`}>
                                <button className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1">
                                    Ver app <ArrowRight className="w-3 h-3" />
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                ) : isAuthenticated ? (
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-center gap-4">
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                            <div className="flex-1">
                                <p className="text-amber-400 font-bold text-sm">Você ainda não tem um app</p>
                                <p className="text-slate-400 text-sm">Crie um app para ver suas credenciais aqui.</p>
                            </div>
                            <Link href="/dashboard/apps">
                                <button className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                                    Criar App
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                        <div className="flex items-center gap-4">
                            <Box className="w-6 h-6 text-indigo-400" />
                            <div className="flex-1">
                                <p className="text-indigo-400 font-bold text-sm">Faça login para ver suas credenciais</p>
                                <p className="text-slate-400 text-sm">Os exemplos usarão placeholders até você autenticar.</p>
                            </div>
                            <Link href="/login">
                                <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors">
                                    Entrar
                                </button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Steps */}
                <div className="grid gap-8 mt-12">
                    {/* Step 1: Install */}
                    <section className="space-y-4 relative pl-8 border-l-2 border-indigo-500/20">
                        <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">1</div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Instalar o SDK</h3>
                        <p className="text-slate-400">
                            Adicione o SDK ao seu projeto Node.js ou frontend.
                        </p>
                        <CodeBlock
                            code="npm install @prostqs/sdk"
                            onCopy={() => copyToClipboard("npm install @prostqs/sdk", "install")}
                            copied={copied === "install"}
                        />
                    </section>

                    {/* Step 2: Initialize */}
                    <section className="space-y-4 relative pl-8 border-l-2 border-indigo-500/20">
                        <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">2</div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Inicializar o Cliente</h3>
                        <p className="text-slate-400">
                            Configure com sua API Key para acessar Auth, Events e Billing.
                        </p>
                        <CodeBlock
                            code={`import { ProstQS } from '@prostqs/sdk';

const prost = new ProstQS({
  apiKey: '${apiKey}',
  // environment: 'production' // default
});`}
                            onCopy={() => copyToClipboard(`import { ProstQS } from '@prostqs/sdk';\n\nconst prost = new ProstQS({\n  apiKey: '${apiKey}',\n});`, "init")}
                            copied={copied === "init"}
                            highlight={userApp ? apiKey : undefined}
                        />
                    </section>

                    {/* Step 3: Track Event */}
                    <section className="space-y-4 relative pl-8 border-l-2 border-indigo-500/20">
                        <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">3</div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Emitir Primeiro Evento</h3>
                        <p className="text-slate-400">
                            Rastreie ações do usuário. Eventos são auditados e podem acionar billing.
                        </p>
                        <CodeBlock
                            code={`// Rastrear uma ação do usuário
await prost.events.track({
  type: 'user.action',
  userId: 'user_123',
  metadata: {
    action: 'feature_used',
    feature: 'export_pdf'
  }
});

// Resposta
// { id: 'evt_...', status: 'processed' }`}
                            onCopy={() => copyToClipboard(`await prost.events.track({\n  type: 'user.action',\n  userId: 'user_123',\n  metadata: {\n    action: 'feature_used',\n    feature: 'export_pdf'\n  }\n});`, "event")}
                            copied={copied === "event"}
                        />
                    </section>

                    {/* Step 4: Verify Identity */}
                    <section className="space-y-4 relative pl-8 border-l-2 border-emerald-500/20">
                        <div className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white">4</div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Verificar Identidade (Opcional)</h3>
                        <p className="text-slate-400">
                            Use o sistema de identidade soberana para autenticar usuários no seu app.
                        </p>
                        <CodeBlock
                            code={`// Verificar token de usuário
const identity = await prost.identity.verify(userToken);

if (identity.valid) {
  console.log('User:', identity.userId);
  console.log('Capabilities:', identity.capabilities);
}`}
                            onCopy={() => copyToClipboard(`const identity = await prost.identity.verify(userToken);\n\nif (identity.valid) {\n  console.log('User:', identity.userId);\n}`, "identity")}
                            copied={copied === "identity"}
                        />
                    </section>
                </div>

                {/* API Reference CTA */}
                <div className="mt-12 p-8 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">Próximos Passos</h4>
                            <p className="text-sm text-indigo-300">Explore a API completa, configure webhooks e integre billing.</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/docs/api/v1">
                                <button className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all text-sm">
                                    API Reference
                                </button>
                            </Link>
                            <Link href="/docs/concepts/events">
                                <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm">
                                    Conceitos
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function CodeBlock({ 
    code, 
    onCopy, 
    copied, 
    highlight 
}: { 
    code: string; 
    onCopy: () => void; 
    copied: boolean;
    highlight?: string;
}) {
    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden group">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                </div>
                <button
                    onClick={onCopy}
                    className={cn(
                        "p-1.5 rounded-lg transition-all text-xs flex items-center gap-1",
                        copied 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : "hover:bg-white/5 text-slate-500 hover:text-white"
                    )}
                >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copiado" : "Copiar"}</span>
                </button>
            </div>
            <pre className="p-4 text-sm font-mono overflow-x-auto">
                <code className="text-slate-300">
                    {highlight ? (
                        code.split(highlight).map((part, i, arr) => (
                            <span key={i}>
                                {part}
                                {i < arr.length - 1 && (
                                    <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded">{highlight}</span>
                                )}
                            </span>
                        ))
                    ) : (
                        code
                    )}
                </code>
            </pre>
        </div>
    );
}
