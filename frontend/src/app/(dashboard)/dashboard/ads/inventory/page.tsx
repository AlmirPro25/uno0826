"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
    Megaphone, Loader2, Plus, Play, Pause, 
    DollarSign, Target, RefreshCw,
    TrendingUp, Eye, MousePointer, X, Check,
    ImageIcon, Save
} from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Campaign {
    id: string;
    name: string;
    objective: string;
    bid_strategy: string;
    bid_amount: number;
    daily_budget: number;
    total_spent: number;
    status: string;
    created_at: string;
}

interface CampaignStats {
    campaign_id: string;
    total_spent: number;
    budget_total: number;
    budget_remaining: number;
    spend_rate: number;
    status: string;
}

interface Creative {
    id: string;
    campaign_id: string;
    name: string;
    format: string;
    content_url: string;
    click_url: string;
    status: string;
}

export default function AdsInventoryPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
    const [campaignStats, setCampaignStats] = useState<CampaignStats | null>(null);
    const [creatives, setCreatives] = useState<Creative[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCreativeModal, setShowCreativeModal] = useState(false);

    // Form states
    const [newCampaign, setNewCampaign] = useState({
        name: "",
        objective: "impressions",
        bid_strategy: "cpm",
        bid_amount: 100, // R$1.00 em centavos
        daily_budget: 10000, // R$100.00 em centavos
    });

    const [newCreative, setNewCreative] = useState({
        name: "",
        format: "banner",
        content_url: "",
        click_url: "",
        title: "",
        description: "",
        cta_text: "Saiba Mais",
    });

    const [creatingCampaign, setCreatingCampaign] = useState(false);
    const [creatingCreative, setCreatingCreative] = useState(false);

    const fetchCampaigns = useCallback(async () => {
        try {
            // TODO: Get ad_account_id from user context
            const res = await api.get("/ads/campaigns?ad_account_id=test");
            setCampaigns(res.data.campaigns || []);
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCampaignStats = async (campaignId: string) => {
        try {
            const res = await api.get(`/ads/campaigns/${campaignId}/stats`);
            setCampaignStats(res.data);
        } catch (error) {
            console.error("Failed to fetch campaign stats", error);
        }
    };

    const fetchCreatives = async (campaignId: string) => {
        try {
            const res = await api.get(`/ads/creatives?campaign_id=${campaignId}`);
            setCreatives(res.data.creatives || []);
        } catch (error) {
            console.error("Failed to fetch creatives", error);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    useEffect(() => {
        if (selectedCampaign) {
            fetchCampaignStats(selectedCampaign.id);
            fetchCreatives(selectedCampaign.id);
        }
    }, [selectedCampaign]);

    const handleActivateCampaign = async (campaignId: string) => {
        try {
            await api.post(`/ads/campaigns/${campaignId}/activate`);
            fetchCampaigns();
        } catch (error) {
            console.error("Failed to activate campaign", error);
        }
    };

    const handlePauseCampaign = async (campaignId: string) => {
        try {
            await api.post(`/ads/campaigns/${campaignId}/pause`);
            fetchCampaigns();
        } catch (error) {
            console.error("Failed to pause campaign", error);
        }
    };

    const handleApproveCreative = async (creativeId: string) => {
        try {
            await api.post(`/ads/creatives/${creativeId}/approve`);
            if (selectedCampaign) {
                fetchCreatives(selectedCampaign.id);
            }
        } catch (error) {
            console.error("Failed to approve creative", error);
        }
    };

    const handleCreateCampaign = async () => {
        setCreatingCampaign(true);
        try {
            await api.post("/ads/campaigns", {
                ...newCampaign,
                ad_account_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", // TODO: from context
            });
            setShowCreateModal(false);
            setNewCampaign({
                name: "",
                objective: "impressions",
                bid_strategy: "cpm",
                bid_amount: 100,
                daily_budget: 10000,
            });
            fetchCampaigns();
        } catch (error) {
            console.error("Failed to create campaign", error);
        } finally {
            setCreatingCampaign(false);
        }
    };

    const handleCreateCreative = async () => {
        if (!selectedCampaign) return;
        setCreatingCreative(true);
        try {
            await api.post("/ads/creatives", {
                ...newCreative,
                campaign_id: selectedCampaign.id,
            });
            setShowCreativeModal(false);
            setNewCreative({
                name: "",
                format: "banner",
                content_url: "",
                click_url: "",
                title: "",
                description: "",
                cta_text: "Saiba Mais",
            });
            fetchCreatives(selectedCampaign.id);
        } catch (error) {
            console.error("Failed to create creative", error);
        } finally {
            setCreatingCreative(false);
        }
    };

    const formatCurrency = (cents: number) => {
        return `R$ ${(cents / 100).toFixed(2)}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "paused": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "draft": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
            case "disputed": return "bg-red-500/10 text-red-400 border-red-500/20";
            default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    };

    return (
        <div className="space-y-6 pb-12">
            <AppHeader />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
                        Inventário de Ads
                    </h1>
                    <p className="text-slate-500 mt-1 font-medium">
                        Campanhas • Criativos • Targeting • Leilão Real
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={fetchCampaigns}
                        disabled={loading}
                        className="h-11 px-4 rounded-xl border-white/10 text-white hover:bg-white/5"
                    >
                        <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="h-11 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nova Campanha
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Campanhas</span>
                        <Megaphone className="w-4 h-4 text-indigo-500" />
                    </div>
                    <p className="text-3xl font-black text-indigo-400 mt-2">{campaigns.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Total cadastradas</p>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ativas</span>
                        <Play className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-black text-emerald-400 mt-2">
                        {campaigns.filter(c => c.status === "active").length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Rodando agora</p>
                </div>
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Gasto Total</span>
                        <DollarSign className="w-4 h-4 text-amber-500" />
                    </div>
                    <p className="text-3xl font-black text-amber-400 mt-2">
                        {formatCurrency(campaigns.reduce((sum, c) => sum + c.total_spent, 0))}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Todas campanhas</p>
                </div>
                <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Pausadas</span>
                        <Pause className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-3xl font-black text-rose-400 mt-2">
                        {campaigns.filter(c => c.status === "paused").length}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Aguardando</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-white">Campanhas</h3>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="p-12 rounded-2xl border border-white/5 bg-white/[0.02] text-center">
                            <Megaphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Nenhuma Campanha</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Crie sua primeira campanha para começar a anunciar.
                            </p>
                            <Button 
                                onClick={() => setShowCreateModal(true)}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Criar Campanha
                            </Button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            <div className="space-y-3">
                                {campaigns.map((campaign, index) => (
                                    <motion.div
                                        key={campaign.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedCampaign(campaign)}
                                        className={cn(
                                            "p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01]",
                                            selectedCampaign?.id === campaign.id
                                                ? "border-indigo-500/50 bg-indigo-500/10"
                                                : "border-white/5 bg-white/[0.02] hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="font-bold text-white">{campaign.name}</h4>
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-lg text-xs font-bold uppercase",
                                                        getStatusColor(campaign.status)
                                                    )}>
                                                        {campaign.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                                    <span className="flex items-center gap-1">
                                                        <Target className="w-3 h-3" />
                                                        {campaign.objective}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <DollarSign className="w-3 h-3" />
                                                        {formatCurrency(campaign.bid_amount)} CPM
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="w-3 h-3" />
                                                        {formatCurrency(campaign.total_spent)} gasto
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {campaign.status === "active" ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePauseCampaign(campaign.id);
                                                        }}
                                                        className="h-8 px-3 rounded-lg border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                                                    >
                                                        <Pause className="w-3 h-3" />
                                                    </Button>
                                                ) : campaign.status === "draft" || campaign.status === "paused" ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleActivateCampaign(campaign.id);
                                                        }}
                                                        className="h-8 px-3 rounded-lg border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                    >
                                                        <Play className="w-3 h-3" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Campaign Details */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Detalhes</h3>
                    
                    {selectedCampaign ? (
                        <div className="space-y-4">
                            {/* Stats Card */}
                            {campaignStats && (
                                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
                                        Performance
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Gasto</span>
                                            <span className="font-bold text-white">
                                                {formatCurrency(campaignStats.total_spent)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Budget Total</span>
                                            <span className="font-bold text-white">
                                                {formatCurrency(campaignStats.budget_total)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Restante</span>
                                            <span className={cn(
                                                "font-bold",
                                                campaignStats.budget_remaining > 0 ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {formatCurrency(campaignStats.budget_remaining)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Taxa/hora</span>
                                            <span className="font-bold text-amber-400">
                                                {formatCurrency(campaignStats.spend_rate)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Creatives */}
                            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                        Criativos
                                    </h4>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setShowCreativeModal(true)}
                                        className="h-7 px-2 text-indigo-400 hover:text-indigo-300"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </Button>
                                </div>
                                
                                {creatives.length === 0 ? (
                                    <p className="text-sm text-slate-500 text-center py-4">
                                        Nenhum criativo cadastrado
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {creatives.map((creative) => (
                                            <div
                                                key={creative.id}
                                                className="p-3 rounded-lg bg-white/5 flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <ImageIcon className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{creative.name}</p>
                                                        <p className="text-xs text-slate-500">{creative.format}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {creative.status === "pending" && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleApproveCreative(creative.id)}
                                                            className="h-6 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-xs font-bold",
                                                        creative.status === "approved" 
                                                            ? "bg-emerald-500/20 text-emerald-400"
                                                            : creative.status === "pending"
                                                            ? "bg-amber-500/20 text-amber-400"
                                                            : "bg-red-500/20 text-red-400"
                                                    )}>
                                                        {creative.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded-xl border border-white/5 bg-white/[0.02] text-center">
                            <Target className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">
                                Selecione uma campanha para ver detalhes
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Auction Info */}
            <div className="p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5">
                <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-500/20">
                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Leilão Second-Price
                        </h3>
                        <p className="text-sm text-slate-400">
                            O PROST-QS usa leilão de segundo preço: o vencedor paga apenas 1 centavo a mais 
                            que o segundo maior lance. Isso incentiva lances honestos e maximiza o valor 
                            para anunciantes e publishers.
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" /> CPM mínimo: R$0.10
                            </span>
                            <span className="flex items-center gap-1">
                                <MousePointer className="w-3 h-3" /> CPC = CPM/10
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Campaign Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg mx-4 p-6 rounded-2xl bg-slate-900 border border-white/10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Nova Campanha</h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreateModal(false)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-slate-400">Nome da Campanha</Label>
                                    <Input
                                        value={newCampaign.name}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                        placeholder="Ex: Campanha Black Friday"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-slate-400">Objetivo</Label>
                                        <select
                                            value={newCampaign.objective}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, objective: e.target.value })}
                                            className="mt-1 w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                                        >
                                            <option value="impressions">Impressões</option>
                                            <option value="clicks">Cliques</option>
                                            <option value="conversions">Conversões</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-slate-400">Estratégia de Bid</Label>
                                        <select
                                            value={newCampaign.bid_strategy}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, bid_strategy: e.target.value })}
                                            className="mt-1 w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                                        >
                                            <option value="cpm">CPM (Custo por Mil)</option>
                                            <option value="cpc">CPC (Custo por Clique)</option>
                                            <option value="target_cost">Target Cost</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-slate-400">Bid (centavos)</Label>
                                        <Input
                                            type="number"
                                            value={newCampaign.bid_amount}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, bid_amount: parseInt(e.target.value) || 0 })}
                                            placeholder="100"
                                            className="mt-1 bg-white/5 border-white/10 text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            = {formatCurrency(newCampaign.bid_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-slate-400">Budget Diário (centavos)</Label>
                                        <Input
                                            type="number"
                                            value={newCampaign.daily_budget}
                                            onChange={(e) => setNewCampaign({ ...newCampaign, daily_budget: parseInt(e.target.value) || 0 })}
                                            placeholder="10000"
                                            className="mt-1 bg-white/5 border-white/10 text-white"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">
                                            = {formatCurrency(newCampaign.daily_budget)}/dia
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                    className="border-white/10 text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateCampaign}
                                    disabled={!newCampaign.name || creatingCampaign}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {creatingCampaign ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Criar Campanha
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create Creative Modal */}
            <AnimatePresence>
                {showCreativeModal && selectedCampaign && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowCreativeModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-lg mx-4 p-6 rounded-2xl bg-slate-900 border border-white/10 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Novo Criativo</h2>
                                    <p className="text-sm text-slate-500">Para: {selectedCampaign.name}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowCreativeModal(false)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-slate-400">Nome do Criativo</Label>
                                    <Input
                                        value={newCreative.name}
                                        onChange={(e) => setNewCreative({ ...newCreative, name: e.target.value })}
                                        placeholder="Ex: Banner Principal 728x90"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                <div>
                                    <Label className="text-slate-400">Formato</Label>
                                    <select
                                        value={newCreative.format}
                                        onChange={(e) => setNewCreative({ ...newCreative, format: e.target.value })}
                                        className="mt-1 w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-white"
                                    >
                                        <option value="banner">Banner</option>
                                        <option value="native">Native</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>

                                <div>
                                    <Label className="text-slate-400">URL do Conteúdo (imagem/video)</Label>
                                    <Input
                                        value={newCreative.content_url}
                                        onChange={(e) => setNewCreative({ ...newCreative, content_url: e.target.value })}
                                        placeholder="https://cdn.example.com/banner.jpg"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                <div>
                                    <Label className="text-slate-400">URL de Destino (click)</Label>
                                    <Input
                                        value={newCreative.click_url}
                                        onChange={(e) => setNewCreative({ ...newCreative, click_url: e.target.value })}
                                        placeholder="https://example.com/landing"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                <div>
                                    <Label className="text-slate-400">Título</Label>
                                    <Input
                                        value={newCreative.title}
                                        onChange={(e) => setNewCreative({ ...newCreative, title: e.target.value })}
                                        placeholder="Título do anúncio"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                <div>
                                    <Label className="text-slate-400">Descrição</Label>
                                    <Input
                                        value={newCreative.description}
                                        onChange={(e) => setNewCreative({ ...newCreative, description: e.target.value })}
                                        placeholder="Descrição curta do anúncio"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>

                                <div>
                                    <Label className="text-slate-400">CTA (Call to Action)</Label>
                                    <Input
                                        value={newCreative.cta_text}
                                        onChange={(e) => setNewCreative({ ...newCreative, cta_text: e.target.value })}
                                        placeholder="Saiba Mais"
                                        className="mt-1 bg-white/5 border-white/10 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreativeModal(false)}
                                    className="border-white/10 text-slate-400 hover:text-white"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateCreative}
                                    disabled={!newCreative.name || !newCreative.content_url || creatingCreative}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {creatingCreative ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-2" />
                                    )}
                                    Criar Criativo
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
