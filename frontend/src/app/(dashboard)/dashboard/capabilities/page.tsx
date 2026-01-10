"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
    Zap, Crown, CheckCircle2, Loader2, 
    ArrowRight, Package, Shield, Users, Box,
    Activity, Database, RefreshCw
} from "lucide-react";
import { api } from "@/lib/api";
import { useApp } from "@/contexts/app-context";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";

interface Capability {
    name: string;
    limit: number;
    used: number;
    unlimited: boolean;
}

interface AddOn {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    capabilities: Record<string, number>;
    active?: boolean;
}

interface Entitlements {
    plan: string;
    plan_name: string;
    capabilities: Capability[];
    add_ons: AddOn[];
}

export default function CapabilitiesPage() {
    const { activeApp } = useApp();
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const fetchEntitlements = async () => {
        try {
            const res = await api.get("/entitlements/effective");
            setEntitlements(res.data);
        } catch (error) {
            console.error("Failed to fetch entitlements", error);
            // Mock data
            setEntitlements({
                plan: "free",
                plan_name: "Free Tier",
                capabilities: [
                    { name: "apps", limit: 1, used: 1, unlimited: false },
                    { name: "credentials_per_app", limit: 2, used: 1, unlimited: false },
                    { name: "users_per_app", limit: 100, used: 45, unlimited: false },
                    { name: "events_per_month", limit: 10000, used: 3421, unlimited: false },
                    { name: "rules", limit: 5, used: 2, unlimited: false },
                ],
                add_ons: []
            });
        }
    };

    const fetchAddOns = async () => {
        try {
            const res = await api.get("/addons");
            setAvailableAddOns(res.data.addons || res.data || []);
        } catch (error) {
            console.error("Failed to fetch add-ons", error);
            // Mock data
            setAvailableAddOns([
                {
                    id: "addon_extra_apps",
                    name: "+5 Apps",
                    description: "Adicione 5 aplicações extras ao seu plano",
                    price: 2900,
                    currency: "BRL",
                    capabilities: { apps: 5 }
                },
                {
                    id: "addon_extra_users",
                    name: "+1000 Usuários",
                    description: "Aumente o limite de usuários por app",
                    price: 4900,
                    currency: "BRL",
                    capabilities: { users_per_app: 1000 }
                },
                {
                    id: "addon_unlimited_events",
                    name: "Eventos Ilimitados",
                    description: "Remova o limite de eventos mensais",
                    price: 9900,
                    currency: "BRL",
                    capabilities: { events_per_month: -1 }
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEntitlements();
        fetchAddOns();
    }, []);

    const purchaseAddOn = async (addonId: string) => {
        setPurchasing(addonId);
        try {
            await api.post(`/addons/${addonId}/purchase`);
            toast.success("Add-on adquirido com sucesso!");
            fetchEntitlements();
        } catch (error) {
            toast.error("Falha ao adquirir add-on");
        } finally {
            setPurchasing(null);
        }
    };

    const getCapabilityIcon = (name: string) => {
        switch (name) {
            case "apps": return Box;
            case "credentials_per_app": return Shield;
            case "users_per_app": return Users;
            case "events_per_month": return Activity;
            case "rules": return Zap;
            default: return Database;
        }
    };

    const getCapabilityLabel = (name: string) => {
        switch (name) {
            case "apps": return "Aplicações";
            case "credentials_per_app": return "Credenciais por App";
            case "users_per_app": return "Usuários por App";
            case "events_per_month": return "Eventos por Mês";
            case "rules": return "Regras de Automação";
            default: return name;
        }
    };

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency 
        }).format(price / 100);
    };

    const isPro = entitlements?.plan === "pro";

    return (
        <div className="space-y-8 pb-12">
            {/* App Context Header */}
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Capacidades {activeApp ? `de ${activeApp.name}` : "do Kernel"}
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Limites do seu plano e add-ons disponíveis
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => { fetchEntitlements(); fetchAddOns(); }}
                    disabled={loading}
                    className="h-10 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                >
                    <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                    Atualizar
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : (
                <>
                    {/* Current Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "p-8 rounded-3xl border relative overflow-hidden",
                            isPro 
                                ? "bg-gradient-to-br from-amber-600/10 to-amber-600/5 border-amber-500/20"
                                : "bg-gradient-to-br from-indigo-600/10 to-indigo-600/5 border-indigo-500/20"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className={cn(
                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4",
                                    isPro 
                                        ? "bg-amber-500/20 text-amber-400"
                                        : "bg-indigo-500/20 text-indigo-400"
                                )}>
                                    {isPro ? <Crown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                                    {entitlements?.plan_name}
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2">
                                    {isPro ? "Você tem acesso PRO" : "Plano Gratuito"}
                                </h2>
                                <p className="text-slate-400 max-w-md">
                                    {isPro 
                                        ? "Aproveite todos os recursos premium do kernel."
                                        : "Faça upgrade para desbloquear mais capacidades e remover limites."
                                    }
                                </p>
                            </div>
                            {!isPro && (
                                <Link href="/dashboard/billing">
                                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold">
                                        <Crown className="w-4 h-4 mr-2" /> Upgrade PRO
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </motion.div>

                    {/* Capabilities Grid */}
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-4">Seus Limites</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {entitlements?.capabilities.map((cap, i) => {
                                const Icon = getCapabilityIcon(cap.name);
                                const percentage = cap.unlimited ? 0 : (cap.used / cap.limit) * 100;
                                const isNearLimit = percentage > 80;
                                
                                return (
                                    <motion.div
                                        key={cap.name}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                isNearLimit ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/20 text-indigo-400"
                                            )}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{getCapabilityLabel(cap.name)}</p>
                                                <p className="text-xs text-slate-500">
                                                    {cap.unlimited ? "Ilimitado" : `${cap.used} / ${cap.limit}`}
                                                </p>
                                            </div>
                                        </div>
                                        {!cap.unlimited && (
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        isNearLimit ? "bg-amber-500" : "bg-indigo-500"
                                                    )}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                        )}
                                        {cap.unlimited && (
                                            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Sem limites
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add-ons */}
                    <div>
                        <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-4">Add-ons Disponíveis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableAddOns.map((addon, i) => (
                                <motion.div
                                    key={addon.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.05 }}
                                    className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <span className="text-lg font-black text-white">
                                            {formatPrice(addon.price, addon.currency)}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-white mb-1">{addon.name}</h4>
                                    <p className="text-sm text-slate-500 mb-4">{addon.description}</p>
                                    <Button
                                        onClick={() => purchaseAddOn(addon.id)}
                                        disabled={purchasing === addon.id || addon.active}
                                        className={cn(
                                            "w-full h-10 rounded-xl font-bold text-xs",
                                            addon.active 
                                                ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                        )}
                                    >
                                        {purchasing === addon.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : addon.active ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Ativo
                                            </>
                                        ) : (
                                            <>
                                                Adquirir <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* My Add-ons */}
                    {entitlements?.add_ons && entitlements.add_ons.length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-4">Meus Add-ons</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {entitlements.add_ons.map((addon, i) => (
                                    <motion.div
                                        key={addon.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            <div>
                                                <p className="font-bold text-white">{addon.name}</p>
                                                <p className="text-xs text-emerald-400">Ativo</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
