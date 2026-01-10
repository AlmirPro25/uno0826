"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Rocket, 
    Box, 
    Key, 
    ArrowRight, 
    ArrowLeft,
    Check,
    Copy,
    Shield,
    Cpu,
    Eye,
    Loader2,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Objective = "create_app" | "govern_agents" | "explore" | null;

interface CreatedApp {
    id: string;
    name: string;
    slug: string;
    api_key: string;
    api_secret: string;
}

const objectives = [
    {
        id: "create_app" as const,
        icon: Box,
        title: "Criar um App",
        description: "Registrar uma aplicação e obter credenciais de API",
        color: "indigo"
    },
    {
        id: "govern_agents" as const,
        icon: Cpu,
        title: "Governar Agentes",
        description: "Configurar guardrails para sistemas de IA",
        color: "emerald"
    },
    {
        id: "explore" as const,
        icon: Eye,
        title: "Explorar o Sistema",
        description: "Conhecer as capacidades do kernel primeiro",
        color: "amber"
    }
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    const [step, setStep] = useState(1);
    const [objective, setObjective] = useState<Objective>(null);
    const [appName, setAppName] = useState("");
    const [appSlug, setAppSlug] = useState("");
    const [creating, setCreating] = useState(false);
    const [createdApp, setCreatedApp] = useState<CreatedApp | null>(null);
    const [copied, setCopied] = useState<"key" | "secret" | null>(null);

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    // Auto-generate slug from name
    useEffect(() => {
        if (appName) {
            setAppSlug(appName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
        }
    }, [appName]);

    const handleCreateApp = async () => {
        if (!appName.trim()) return;
        
        setCreating(true);
        try {
            const res = await api.post("/apps", {
                name: appName,
                slug: appSlug || appName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                description: `App criado durante onboarding`
            });

            // Get credentials
            const credRes = await api.get(`/apps/${res.data.id}/credentials`);
            
            setCreatedApp({
                id: res.data.id,
                name: res.data.name,
                slug: res.data.slug,
                api_key: credRes.data.api_key,
                api_secret: credRes.data.api_secret
            });
            
            setStep(3);
            toast.success("App criado com sucesso!");
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            const msg = error.response?.data?.error || "Falha ao criar aplicação";
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    };

    const handleCopy = async (type: "key" | "secret", value: string) => {
        await navigator.clipboard.writeText(value);
        setCopied(type);
        toast.success("Copiado para a área de transferência!");
        setTimeout(() => setCopied(null), 2000);
    };

    const handleFinish = () => {
        // Mark onboarding as complete
        localStorage.setItem("onboarding_complete", "true");
        router.push("/dashboard");
    };

    const handleSkipToExplore = () => {
        localStorage.setItem("onboarding_complete", "true");
        router.push("/dashboard");
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Progress Bar */}
            <div className="flex items-center justify-center gap-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300",
                            step >= s 
                                ? "bg-indigo-600 text-white" 
                                : "bg-white/5 text-slate-600 border border-white/10"
                        )}>
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={cn(
                                "w-16 h-0.5 mx-2 transition-all duration-300",
                                step > s ? "bg-indigo-600" : "bg-white/10"
                            )} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                {/* STEP 1: Objective */}
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                                Bem-vindo, <span className="text-indigo-500">{user?.name || "Operador"}</span>
                            </h1>
                            <p className="text-slate-400 font-medium">
                                O que você quer fazer primeiro?
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {objectives.map((obj) => (
                                <button
                                    key={obj.id}
                                    onClick={() => setObjective(obj.id)}
                                    className={cn(
                                        "p-6 rounded-2xl border text-left transition-all duration-300 group",
                                        objective === obj.id
                                            ? "bg-indigo-600/10 border-indigo-500/50"
                                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                            objective === obj.id
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white/5 text-slate-400 group-hover:bg-white/10"
                                        )}>
                                            <obj.icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-1">{obj.title}</h3>
                                            <p className="text-sm text-slate-500">{obj.description}</p>
                                        </div>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                            objective === obj.id
                                                ? "border-indigo-500 bg-indigo-500"
                                                : "border-white/20"
                                        )}>
                                            {objective === obj.id && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={() => {
                                    if (objective === "explore") {
                                        handleSkipToExplore();
                                    } else {
                                        setStep(2);
                                    }
                                }}
                                disabled={!objective}
                                className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continuar <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: Create App */}
                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-4">
                                <Box className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                                Crie seu <span className="text-indigo-500">Primeiro App</span>
                            </h1>
                            <p className="text-slate-400 font-medium">
                                Dê um nome para sua aplicação. Você poderá alterar depois.
                            </p>
                        </div>

                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Nome da Aplicação
                                </label>
                                <Input
                                    placeholder="Ex: Meu App Incrível"
                                    value={appName}
                                    onChange={(e) => setAppName(e.target.value)}
                                    className="h-14 bg-white/[0.02] border-white/10 focus:border-indigo-500/50 rounded-2xl text-white font-medium text-lg"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                                    Identificador (slug)
                                </label>
                                <Input
                                    placeholder="meu-app-incrivel"
                                    value={appSlug}
                                    onChange={(e) => setAppSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                    className="h-14 bg-white/[0.02] border-white/10 focus:border-emerald-500/50 rounded-2xl text-emerald-400 font-mono"
                                />
                                <p className="text-[10px] text-slate-600 ml-1">
                                    Usado para identificar seu app na API
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="h-14 px-6 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-xs"
                            >
                                <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
                            </Button>
                            <Button
                                onClick={handleCreateApp}
                                disabled={!appName.trim() || creating}
                                className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-xs disabled:opacity-50"
                            >
                                {creating ? (
                                    <>
                                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        Criar App <Rocket className="ml-2 w-4 h-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* STEP 3: Credentials */}
                {step === 3 && createdApp && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
                                App <span className="text-emerald-500">Criado!</span>
                            </h1>
                            <p className="text-slate-400 font-medium">
                                Guarde suas credenciais em um lugar seguro. O secret não será mostrado novamente.
                            </p>
                        </div>

                        <div className="space-y-4 max-w-lg mx-auto">
                            {/* App Info */}
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black">
                                        {createdApp.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{createdApp.name}</p>
                                        <p className="text-xs text-slate-500 font-mono">{createdApp.slug}</p>
                                    </div>
                                </div>
                            </div>

                            {/* API Key */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Key className="w-3 h-3" /> API Key (pública)
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-12 px-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center font-mono text-sm text-indigo-400 overflow-hidden">
                                        <span className="truncate">{createdApp.api_key}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopy("key", createdApp.api_key)}
                                        className={cn(
                                            "h-12 w-12 rounded-xl border-white/10 transition-all",
                                            copied === "key" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "hover:bg-white/5"
                                        )}
                                    >
                                        {copied === "key" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* API Secret */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> API Secret (privada)
                                </label>
                                <div className="flex gap-2">
                                    <div className="flex-1 h-12 px-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center font-mono text-sm text-rose-400 overflow-hidden">
                                        <span className="truncate">{createdApp.api_secret}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopy("secret", createdApp.api_secret)}
                                        className={cn(
                                            "h-12 w-12 rounded-xl border-white/10 transition-all",
                                            copied === "secret" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "hover:bg-white/5"
                                        )}
                                    >
                                        {copied === "secret" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-amber-200/80">
                                    <p className="font-bold text-amber-400 mb-1">Importante</p>
                                    <p>O API Secret só é exibido uma vez. Copie e guarde em um local seguro antes de continuar.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={handleFinish}
                                className="h-16 px-12 rounded-2xl bg-white text-black hover:bg-slate-200 font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
                            >
                                Ir para o Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
