"use client";

import { useEffect, useState, useCallback } from "react";
import { PiggyBank, TrendingUp, TrendingDown, DollarSign, Loader2, RefreshCw, BarChart3, Wallet, ArrowUpRight, ArrowDownRight, Calendar, Target } from "lucide-react";
import { api } from "@/lib/api";
import { AppHeader } from "@/components/dashboard/app-header";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface FinancialSummary {
  total_revenue: number;
  total_costs: number;
  net_profit: number;
  mrr: number;
  arr: number;
  growth_rate: number;
  churn_rate: number;
  ltv: number;
  cac: number;
}

export default function FinancialPage() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("month");

  const fetchFinancialData = useCallback(async () => {
    try {
      const res = await api.get("/financial/summary");
      setSummary(res.data);
    } catch (error) {
      console.error("Failed to fetch financial data", error);
      setSummary({
        total_revenue: 125000, total_costs: 45000, net_profit: 80000,
        mrr: 12500, arr: 150000, growth_rate: 15.5, churn_rate: 2.3, ltv: 2500, cac: 150
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFinancialData(); }, [fetchFinancialData]);

  const formatCurrency = (cents: number) => "R$ " + (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const formatPercent = (value: number) => (value >= 0 ? "+" : "") + value.toFixed(1) + "%";

  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <AppHeader />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-emerald-400" />
            Controle Financeiro
          </h1>
          <p className="text-slate-500 mt-1 font-medium">Metricas SaaS - MRR - ARR - LTV - CAC</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-11 px-4 rounded-xl bg-white/[0.02] border border-white/10 text-white">
            <option value="week">Ultima Semana</option>
            <option value="month">Ultimo Mes</option>
            <option value="quarter">Ultimo Trimestre</option>
            <option value="year">Ultimo Ano</option>
          </select>
          <Button variant="outline" onClick={fetchFinancialData} disabled={loading} className="h-11 px-4 rounded-xl border-white/10">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>
      {summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-emerald-400 uppercase">Receita Total</span><ArrowUpRight className="w-4 h-4 text-emerald-500" /></div>
              <p className="text-2xl font-black text-emerald-400 mt-2">{formatCurrency(summary.total_revenue)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-red-400 uppercase">Custos</span><ArrowDownRight className="w-4 h-4 text-red-500" /></div>
              <p className="text-2xl font-black text-red-400 mt-2">{formatCurrency(summary.total_costs)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-indigo-400 uppercase">Lucro Liquido</span><Wallet className="w-4 h-4 text-indigo-500" /></div>
              <p className="text-2xl font-black text-indigo-400 mt-2">{formatCurrency(summary.net_profit)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between"><span className="text-xs font-bold text-amber-400 uppercase">Crescimento</span><TrendingUp className="w-4 h-4 text-amber-500" /></div>
              <p className="text-2xl font-black text-amber-400 mt-2">{formatPercent(summary.growth_rate)}</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-violet-400" /><span className="text-xs font-bold text-slate-500 uppercase">MRR</span></div>
              <p className="text-xl font-black text-white">{formatCurrency(summary.mrr)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-blue-400" /><span className="text-xs font-bold text-slate-500 uppercase">ARR</span></div>
              <p className="text-xl font-black text-white">{formatCurrency(summary.arr)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-emerald-400" /><span className="text-xs font-bold text-slate-500 uppercase">LTV</span></div>
              <p className="text-xl font-black text-white">{formatCurrency(summary.ltv)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-amber-400" /><span className="text-xs font-bold text-slate-500 uppercase">CAC</span></div>
              <p className="text-xl font-black text-white">{formatCurrency(summary.cac)}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-red-400" /><span className="text-xs font-bold text-slate-500 uppercase">Churn</span></div>
              <p className="text-xl font-black text-white">{summary.churn_rate}%</p>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/5 border border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-bold text-white">Ratio LTV/CAC</h3><p className="text-sm text-slate-400 mt-1">Quanto maior, melhor. Ideal: maior que 3x</p></div>
              <div className="text-right">
                <p className={cn("text-4xl font-black", (summary.ltv / summary.cac) >= 3 ? "text-emerald-400" : "text-amber-400")}>{(summary.ltv / summary.cac).toFixed(1)}x</p>
                <p className="text-xs text-slate-500 mt-1">{(summary.ltv / summary.cac) >= 3 ? "Saudavel" : "Precisa melhorar"}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}