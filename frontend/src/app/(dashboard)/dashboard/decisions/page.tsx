"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Zap,
  RefreshCw,
  Loader2,
  ServerCrash
} from 'lucide-react';
import { api } from '@/lib/api';
import { Tooltip } from "@/components/ui/tooltip";

interface Decision {
  id: string;
  type: string;
  outcome: 'allowed' | 'blocked' | 'deferred' | 'escalated' | 'retry';
  reason: string;
  reason_code?: string;
  user_id?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_type?: string;
  decided_at: string;
}

interface DecisionStats {
  by_outcome: Record<string, number>;
  total: number;
}

const outcomeConfig = {
  allowed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  blocked: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  deferred: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  escalated: { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  retry: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

const severityConfig = {
  low: { color: 'bg-gray-500', label: 'Baixa' },
  medium: { color: 'bg-yellow-500', label: 'Média' },
  high: { color: 'bg-orange-500', label: 'Alta' },
  critical: { color: 'bg-red-500', label: 'Crítica' },
};

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/decisions').catch(() => ({ data: [] }));
      const rawData = res.data?.decisions || res.data || [];
      const decisionsList: Decision[] = Array.isArray(rawData) ? rawData : [];

      setDecisions(decisionsList);

      if (decisionsList.length > 0) {
        const outcomes: Record<string, number> = {};
        decisionsList.forEach(d => {
          const out = d.outcome || 'unknown';
          outcomes[out] = (outcomes[out] || 0) + 1;
        });
        setStats({
          by_outcome: outcomes,
          total: decisionsList.length,
        });
      }

    } catch (error) {
      console.error('Error fetching decisions:', error);
      setError("Falha ao comunicar com o log de decisões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'access.allowed': 'Acesso Permitido',
      'access.denied': 'Acesso Negado',
      'payment.allowed': 'Pagamento Permitido',
      'payment.blocked': 'Pagamento Bloqueado',
      'rule.triggered': 'Regra da IA',
      'killswitch.block': 'Kill Switch',
      'ratelimit.block': 'Rate Limit',
    };
    return labels[type] || type;
  };

  const hasCritical = decisions.some(d => d.severity === 'critical');

  if (loading && decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 text-sm font-medium uppercase tracking-widest animate-pulse">Auditando decisões...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <ServerCrash className="w-12 h-12 text-rose-500" />
        <h3 className="text-xl font-bold text-white uppercase">Conexão Perdida</h3>
        <p className="text-slate-400 max-w-md">{error}</p>
        <Button onClick={fetchData} variant="outline" className="mt-4 border-white/10 hover:bg-white/5">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Decisões do Sistema</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Log imutável de governança algorítmica.
          </p>
        </div>
        <Tooltip content="Atualizar lista de decisões em tempo real" side="left">
          <Button onClick={fetchData} variant="outline" size="sm" className="bg-white/5 hover:bg-white/10 border-white/10 text-slate-300">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </Tooltip>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Tooltip content="Volume total de decisões processadas">
            <Card className="bg-white/[0.02] border-white/5 cursor-help transition-colors hover:bg-white/[0.04]">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Auditado</CardDescription>
                <CardTitle className="text-3xl text-white font-black">{stats.total}</CardTitle>
              </CardHeader>
            </Card>
          </Tooltip>

          <Tooltip content="Decisões onde a ação foi autorizada">
            <Card className="bg-white/[0.02] border-white/5 cursor-help transition-colors hover:bg-green-500/[0.02] hover:border-green-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-green-400">Permitidas</CardDescription>
                <CardTitle className="text-3xl text-emerald-500 font-black">
                  {stats.by_outcome.allowed || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </Tooltip>

          <Tooltip content="Decisões onde a ação foi impedida">
            <Card className="bg-white/[0.02] border-white/5 cursor-help transition-colors hover:bg-red-500/[0.02] hover:border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-red-400">Bloqueadas</CardDescription>
                <CardTitle className="text-3xl text-rose-500 font-black">
                  {stats.by_outcome.blocked || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </Tooltip>

          <Tooltip content="Decisões que exigiram atenção extra ou retry">
            <Card className="bg-white/[0.02] border-white/5 cursor-help transition-colors hover:bg-amber-500/[0.02] hover:border-amber-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-500 group-hover:text-amber-400">Alertas</CardDescription>
                <CardTitle className="text-3xl text-amber-500 font-black">
                  {(stats.by_outcome.escalated || 0) + (stats.by_outcome.deferred || 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </Tooltip>
        </div>
      )}

      {/* Critical Alert Banner */}
      {hasCritical && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-4 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-500 uppercase tracking-wide">Decisões Críticas Detectadas</h4>
            <p className="text-xs text-rose-200/60 mt-1">Existem registros de severidade crítica na lista recente.</p>
          </div>
        </div>
      )}

      {/* Decisions List */}
      <Card className="bg-white/[0.02] border-white/5 rounded-2xl overflow-hidden">
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-black/40 border border-white/5 p-1 h-auto rounded-xl">
              <Tooltip content="Ver todas as decisões">
                <TabsTrigger value="all" className="data-[state=active]:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wide">Todas</TabsTrigger>
              </Tooltip>
              <Tooltip content="Filtrar apenas bloqueios">
                <TabsTrigger value="blocked" className="data-[state=active]:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wide text-rose-400">Bloqueadas</TabsTrigger>
              </Tooltip>
              <Tooltip content="Filtros de segurança e acesso">
                <TabsTrigger value="security" className="data-[state=active]:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wide">Segurança</TabsTrigger>
              </Tooltip>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <DecisionsList decisions={decisions} />
            </TabsContent>

            <TabsContent value="blocked" className="mt-6">
              <DecisionsList
                decisions={decisions.filter(d => d.outcome === 'blocked')}
              />
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <DecisionsList
                decisions={decisions.filter(d => d.type.startsWith('security') || d.type.startsWith('access') || d.type.startsWith('killswitch'))}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionsList({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-white/[0.01] rounded-2xl border border-dashed border-white/10">
        <Zap className="w-8 h-8 opacity-20 mb-3" />
        <p className="text-sm font-medium uppercase tracking-widest opacity-50">Nenhum registro encontrado</p>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'access.allowed': 'Acesso Permitido',
      'access.denied': 'Acesso Negado',
      'payment.allowed': 'Pagamento Permitido',
      'payment.blocked': 'Pagamento Bloqueado',
      'rule.triggered': 'Regra Acionada',
      'killswitch.block': 'Kill Switch',
      'security.block': 'Sec Block',
      'ratelimit.block': 'Rate Limit',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      {decisions.map((decision) => {
        const outcomeInfo = outcomeConfig[decision.outcome] || outcomeConfig['allowed'];
        const severityInfo = severityConfig[decision.severity] || severityConfig['low'];
        const OutcomeIcon = outcomeInfo.icon;

        return (
          <Tooltip key={decision.id} content={`Decisão ID: ${decision.id} | ${new Date(decision.decided_at).toLocaleTimeString()}`} side="top">
            <div
              className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${outcomeInfo.bg.replace('bg-', 'border-').replace('/10', '/20')} bg-white/[0.01] gap-4 md:gap-0 cursor-default`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${outcomeInfo.bg} mt-1 md:mt-0`}>
                  <OutcomeIcon className={`h-5 w-5 ${outcomeInfo.color}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">{getTypeLabel(decision.type)}</span>
                    <Tooltip content={`Nível de severidade: ${severityInfo.label}`}>
                      <Badge variant="outline" className={severityInfo.color + ' text-white text-[10px] border-none px-1.5 uppercase font-bold tracking-wider cursor-help'}>
                        {severityInfo.label}
                      </Badge>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2 md:line-clamp-1">
                    {decision.reason}
                  </p>
                  {decision.reason_code && (
                    <div className="mt-1.5">
                      <code className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-indigo-300 inline-block font-mono">
                        {decision.reason_code}
                      </code>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-left md:text-right pl-[52px] md:pl-0">
                <span className="text-xs text-slate-500 font-mono block">
                  {new Date(decision.decided_at).toLocaleString('pt-BR')}
                </span>
                {decision.trigger_type && (
                  <span className="text-[9px] text-slate-600 mt-1 inline-block uppercase tracking-widest font-bold">
                    VIA {decision.trigger_type}
                  </span>
                )}
              </div>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
