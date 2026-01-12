"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { 
  Monitor, 
  Smartphone, 
  Laptop, 
  Globe, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";

interface Session {
  id: string;
  device_info: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  is_current: boolean;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

interface SessionStats {
  active_sessions: number;
  sessions_last_7_days: number;
  last_activity: string;
  unique_ips: number;
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [sessionsRes, statsRes] = await Promise.all([
        api.get("/auth/sessions"),
        api.get("/auth/sessions/stats")
      ]);
      setSessions(sessionsRes.data.sessions || []);
      setStats(statsRes.data);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Erro ao carregar sessões");
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      setError(null);
      await api.delete(`/auth/sessions/${sessionId}`);
      setSuccess("Sessão revogada com sucesso");
      fetchSessions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Erro ao revogar sessão");
    }
  };

  const revokeOtherSessions = async () => {
    try {
      setError(null);
      const res = await api.delete("/auth/sessions");
      setSuccess(`${res.data.sessions_revoked} sessões revogadas`);
      fetchSessions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Erro ao revogar sessões");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes("android") || info.includes("ios")) {
      return <Smartphone className="h-5 w-5" />;
    }
    if (info.includes("windows") || info.includes("mac") || info.includes("linux")) {
      return <Laptop className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Agora";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h atrás`;
    return date.toLocaleDateString();
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
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sessões Ativas</span>
              </div>
              <p className="text-2xl font-bold">{stats.active_sessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Últimos 7 dias</span>
              </div>
              <p className="text-2xl font-bold">{stats.sessions_last_7_days}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">IPs Únicos</span>
              </div>
              <p className="text-2xl font-bold">{stats.unique_ips}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Última Atividade</span>
              </div>
              <p className="text-lg font-medium">{formatDate(stats.last_activity)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sessões Ativas</CardTitle>
            <CardDescription>
              Dispositivos onde sua conta está conectada
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button variant="destructive" size="sm" onClick={revokeOtherSessions}>
              Encerrar Outras
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma sessão ativa encontrada
              </p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      {getDeviceIcon(session.device_info)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{session.device_info}</span>
                        {session.is_current && (
                          <Badge variant="default" className="text-xs">
                            Esta sessão
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {session.ip_address}
                        </span>
                        {session.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.last_activity)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => revokeSession(session.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
