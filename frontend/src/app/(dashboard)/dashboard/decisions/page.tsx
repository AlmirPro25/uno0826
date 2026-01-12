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
  Filter,
  RefreshCw,
  Loader2,
  ServerCrash
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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
  const [criticalDecisions, setCriticalDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/decisions');
      // Adaptação robusta para diferentes formatos de resposta
      const data = res.data.decisions || res.data || [];
      const decisionsList: Decision[] = Array.isArray(data) ? data : [];

      setDecisions(decisionsList);

      // Filtrar decisões críticas
      setCriticalDecisions(decisionsList.filter(d => d.severity === 'critical'));

      // Calcular estatísticas
      const outcomes: Record<string, number> = {};
      decisionsList.forEach(d => {
        outcomes[d.outcome] = (outcomes[d.outcome] || 0) + 1;
      });

      setStats({
        by_outcome: outcomes,
        total: decisionsList.length,
      });

    } catch (error) {
      console.error('Error fetching decisions:', error);
      setError("Falha ao carregar decisões do sistema.");
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'access.allowed': 'Acesso Permitido',
      'access.denied': 'Acesso Negado',
      'payment.allowed': 'Pagamento Permitido',
      'payment.blocked': 'Pagamento Bloqueado',
      'rule.triggered': 'Regra Acionada',
      'rule.shadow': 'Regra (Shadow)',
      'killswitch.block': 'Kill Switch',
      'security.block': 'Bloqueio de Segurança',
      'invariant.violation': 'Violação de Invariante',
      'ratelimit.block': 'Rate Limit',
    };
    return labels[type] || type;
  };

  if (loading && decisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-slate-400 animate-pulse">Consultando oráculo de decisões...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ServerCrash className="w-12 h-12 text-rose-500" />
        <h3 className="text-xl font-bold text-white">Sistema Indisponível</h3>
        <p className="text-slate-400">{error}</p>
        <Button onClick={fetchData} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Decisões do Sistema</h1>
          <p className="text-muted-foreground">
            Registro imutável de todas as ações tomadas pelo Kernel
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm" className="bg-white/5 hover:bg-white/10 border-white/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="pb-2">
            <CardDescription>Total (24h)</CardDescription>
            <CardTitle className="text-3xl text-white">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="pb-2">
            <CardDescription>Permitidas</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {stats?.by_outcome?.allowed || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="pb-2">
            <CardDescription>Bloqueadas</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {stats?.by_outcome?.blocked || 0}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/[0.02] border-white/5">
          <CardHeader className="pb-2">
            <CardDescription>Escaladas</CardDescription>
            <CardTitle className="text-3xl text-orange-500">
              {stats?.by_outcome?.escalated || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Critical Alert */}
      {criticalDecisions.length > 0 && (
        <Card className="border-red-500/50 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Decisões Críticas Recentes
            </CardTitle>
            <CardDescription className="text-red-400/80">
              {criticalDecisions.length} decisão(ões) crítica(s) requerem atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-red-500/20"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-white">{getTypeLabel(decision.type)}</p>
                      <p className="text-sm text-red-300/80">{decision.reason}</p>
                    </div>
                  </div>
                  <span className="text-sm text-red-300/60">
                    {formatDate(decision.decided_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decisions List */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader>
          <CardTitle>Histórico de Decisões</CardTitle>
          <CardDescription>
            Log completo de auditoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-black/40 border border-white/5">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="blocked">Bloqueadas</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
              <TabsTrigger value="rules">Regras</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <DecisionsList decisions={decisions} />
            </TabsContent>

            <TabsContent value="blocked" className="mt-4">
              <DecisionsList
                decisions={decisions.filter(d => d.outcome === 'blocked')}
              />
            </TabsContent>

            <TabsContent value="security" className="mt-4">
              <DecisionsList
                decisions={decisions.filter(d => d.type.startsWith('security') || d.type.startsWith('access'))}
              />
            </TabsContent>

            <TabsContent value="rules" className="mt-4">
              <DecisionsList
                decisions={decisions.filter(d => d.type.startsWith('rule'))}
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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-white/[0.01] rounded-xl border border-dashed border-white/10">
        <Zap className="w-8 h-8 opacity-20 mb-3" />
        <p>Nenhuma decisão encontrada neste filtro</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'access.allowed': 'Acesso Permitido',
      'access.denied': 'Acesso Negado',
      'payment.allowed': 'Pagamento Permitido',
      'payment.blocked': 'Pagamento Bloqueado',
      'rule.triggered': 'Regra Acionada',
      'rule.shadow': 'Regra (Shadow)',
      'killswitch.block': 'Kill Switch',
      'security.block': 'Bloqueio de Segurança',
      'invariant.violation': 'Violação de Invariante',
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
          <div
            key={decision.id}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${outcomeInfo.bg.replace('bg-', 'border-').replace('/10', '/20')} bg-white/[0.01]`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${outcomeInfo.bg}`}>
                <OutcomeIcon className={`h-5 w-5 ${outcomeInfo.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{getTypeLabel(decision.type)}</span>
                  <Badge variant="outline" className={severityInfo.color + ' text-white text-[10px] border-none px-1.5'}>
                    {severityInfo.label.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {decision.reason}
                </p>
                {decision.reason_code && (
                  <code className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-slate-500 mt-1.5 inline-block font-mono">
                    {decision.reason_code}
                  </code>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-mono block">
                {formatDate(decision.decided_at)}
              </span>
              {decision.trigger_type && (
                <span className="text-[10px] text-slate-600 mt-1 inline-block uppercase tracking-wider">
                  via {decision.trigger_type}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
