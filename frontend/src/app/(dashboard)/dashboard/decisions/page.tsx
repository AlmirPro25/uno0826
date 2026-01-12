'use client';

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
  RefreshCw
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API calls
      const mockDecisions: Decision[] = [
        {
          id: '1',
          type: 'access.allowed',
          outcome: 'allowed',
          reason: 'Usuário autenticado com sucesso',
          severity: 'low',
          trigger_type: 'automatic',
          decided_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'payment.blocked',
          outcome: 'blocked',
          reason: 'Kill switch de billing ativo',
          reason_code: 'KILLSWITCH_ACTIVE',
          severity: 'high',
          trigger_type: 'killswitch',
          decided_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'rule.triggered',
          outcome: 'blocked',
          reason: 'Regra de rate limit acionada',
          severity: 'medium',
          trigger_type: 'rule',
          decided_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          type: 'security.block',
          outcome: 'blocked',
          reason: 'Tentativa de acesso suspeita detectada',
          reason_code: 'SUSPICIOUS_ACCESS',
          severity: 'critical',
          trigger_type: 'automatic',
          decided_at: new Date(Date.now() - 1800000).toISOString(),
        },
      ];

      setDecisions(mockDecisions);
      setCriticalDecisions(mockDecisions.filter(d => d.severity === 'critical'));
      setStats({
        by_outcome: {
          allowed: 150,
          blocked: 23,
          deferred: 5,
          escalated: 2,
        },
        total: 180,
      });
    } catch (error) {
      console.error('Error fetching decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Decisões do Sistema</h1>
          <p className="text-muted-foreground">
            O que o sistema decidiu, não só o que aconteceu
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total (24h)</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Permitidas</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {stats?.by_outcome?.allowed || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bloqueadas</CardDescription>
            <CardTitle className="text-3xl text-red-500">
              {stats?.by_outcome?.blocked || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
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
            <CardDescription>
              {criticalDecisions.length} decisão(ões) crítica(s) nas últimas 24h
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {criticalDecisions.map((decision) => (
                <div
                  key={decision.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">{getTypeLabel(decision.type)}</p>
                      <p className="text-sm text-muted-foreground">{decision.reason}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(decision.decided_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decisions List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Decisões</CardTitle>
          <CardDescription>
            Todas as decisões tomadas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
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
                decisions={decisions.filter(d => d.type.startsWith('security.'))} 
              />
            </TabsContent>

            <TabsContent value="rules" className="mt-4">
              <DecisionsList 
                decisions={decisions.filter(d => d.type.startsWith('rule.'))} 
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
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma decisão encontrada
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        const outcomeInfo = outcomeConfig[decision.outcome];
        const severityInfo = severityConfig[decision.severity];
        const OutcomeIcon = outcomeInfo.icon;

        return (
          <div
            key={decision.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${outcomeInfo.bg}`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${outcomeInfo.bg}`}>
                <OutcomeIcon className={`h-5 w-5 ${outcomeInfo.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getTypeLabel(decision.type)}</span>
                  <Badge variant="outline" className={severityInfo.color + ' text-white text-xs'}>
                    {severityInfo.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {decision.reason}
                </p>
                {decision.reason_code && (
                  <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                    {decision.reason_code}
                  </code>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm text-muted-foreground">
                {formatDate(decision.decided_at)}
              </span>
              {decision.trigger_type && (
                <p className="text-xs text-muted-foreground mt-1">
                  via {decision.trigger_type}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
