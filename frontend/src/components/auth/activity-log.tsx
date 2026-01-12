"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { 
  Activity as ActivityIcon,
  LogIn,
  LogOut,
  Shield,
  Key,
  AlertTriangle,
  CreditCard,
  Settings,
  Trash2,
  Plus,
  Clock,
  MapPin,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Activity {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  description: string;
  metadata?: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  success: boolean;
  created_at: string;
}

interface ActivityStats {
  total_activities: number;
  activities_last_7_days: number;
  logins_last_30_days: number;
  failed_logins_last_30_days: number;
  last_activity: string;
  by_type: Record<string, number>;
}

export function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activitiesRes, statsRes] = await Promise.all([
          api.get("/activity?limit=20"),
          api.get("/activity/stats")
        ]);
        setActivities(activitiesRes.data.activities || []);
        setStats(statsRes.data);
      } catch (err) {
        console.error("Erro ao carregar atividades:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getActivityIcon = (type: string) => {
    if (type.startsWith("auth.login")) return <LogIn className="h-4 w-4" />;
    if (type.startsWith("auth.logout")) return <LogOut className="h-4 w-4" />;
    if (type.includes("mfa")) return <Shield className="h-4 w-4" />;
    if (type.includes("password") || type.includes("session")) return <Key className="h-4 w-4" />;
    if (type.startsWith("app.")) return <Settings className="h-4 w-4" />;
    if (type.startsWith("billing.")) return <CreditCard className="h-4 w-4" />;
    if (type.includes("delete")) return <Trash2 className="h-4 w-4" />;
    if (type.includes("create")) return <Plus className="h-4 w-4" />;
    return <ActivityIcon className="h-4 w-4" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "warning": return "secondary";
      default: return "default";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h atrás`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} dias atrás`;
    return date.toLocaleDateString();
  };

  const formatActivityType = (type: string) => {
    const parts = type.split(".");
    if (parts.length < 2) return type;
    
    const typeMap: Record<string, string> = {
      "auth.login": "Login",
      "auth.logout": "Logout",
      "auth.login_failed": "Login Falhou",
      "auth.mfa_enabled": "MFA Habilitado",
      "auth.mfa_disabled": "MFA Desabilitado",
      "auth.password_changed": "Senha Alterada",
      "auth.session_revoked": "Sessão Revogada",
      "app.created": "App Criado",
      "app.updated": "App Atualizado",
      "app.deleted": "App Deletado",
      "app.api_key_created": "API Key Criada",
      "app.api_key_revoked": "API Key Revogada",
      "billing.upgrade": "Upgrade de Plano",
      "billing.downgrade": "Downgrade de Plano",
      "billing.canceled": "Assinatura Cancelada",
    };
    
    return typeMap[type] || parts[1].replace(/_/g, " ");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total_activities}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Últimos 7 dias</span>
              </div>
              <p className="text-2xl font-bold">{stats.activities_last_7_days}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LogIn className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Logins (30d)</span>
              </div>
              <p className="text-2xl font-bold">{stats.logins_last_30_days}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Falhas (30d)</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{stats.failed_logins_last_30_days}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Histórico de Atividades
          </CardTitle>
          <CardDescription>
            Suas ações recentes na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma atividade registrada
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 border rounded-lg"
                >
                  <div className={`p-2 rounded-lg ${
                    activity.severity === "critical" ? "bg-destructive/10 text-destructive" :
                    activity.severity === "warning" ? "bg-yellow-500/10 text-yellow-600" :
                    "bg-muted"
                  }`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{formatActivityType(activity.type)}</span>
                      <Badge variant={getSeverityColor(activity.severity)} className="text-xs">
                        {activity.severity}
                      </Badge>
                      {activity.success ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(activity.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.ip_address}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
