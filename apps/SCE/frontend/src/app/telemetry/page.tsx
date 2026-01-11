"use client";

import { useState, useEffect } from "react";
import { 
  Activity, RefreshCw, Loader2, CheckCircle2, XCircle, 
  AlertTriangle, Clock, Zap, Server
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";

interface TelemetryEvent {
  id: string;
  type: string;
  target_id: string;
  target_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  created_at: string;
  resolved: boolean;
}

export default function TelemetryPage() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      // Buscar do backend do SCE que faz proxy pro Kernel
      const [eventsRes, alertsRes] = await Promise.all([
        fetch('/api/v1/telemetry/events?limit=50'),
        fetch('/api/v1/telemetry/alerts')
      ]);
      
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
      
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch telemetry', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    // Poll a cada 30s
    const interval = setInterval(fetchTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  const getEventIcon = (type: string) => {
    if (type.includes('deploy')) return Zap;
    if (type.includes('container')) return Server;
    if (type.includes('failed') || type.includes('crashed')) return XCircle;
    return Activity;
  };

  const getEventColor = (type: string) => {
    if (type.includes('failed') || type.includes('crashed')) return 'text-red-400';
    if (type.includes('succeeded') || type.includes('healthy')) return 'text-green-400';
    if (type.includes('building') || type.includes('started')) return 'text-blue-400';
    return 'text-gray-400';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            Telemetria
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Eventos e alertas do seu ambiente • Dados do UNO.KERNEL
          </p>
        </div>
        <button
          onClick={fetchTelemetry}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Alerts */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Alertas Ativos
          </h2>
          <div className="space-y-2">
            {alerts.filter(a => !a.resolved).map(alert => (
              <div 
                key={alert.id}
                className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' 
                    ? 'bg-red-500/10 border-red-500/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs font-bold uppercase ${
                      alert.severity === 'critical' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {alert.severity}
                    </span>
                    <p className="text-white font-medium mt-1">{alert.message}</p>
                    <p className="text-gray-400 text-xs mt-1">{formatTime(alert.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          Eventos Recentes
        </h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum evento ainda</h3>
            <p className="text-gray-400">
              Eventos aparecerão aqui quando você fizer deploys
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.map(event => {
              const Icon = getEventIcon(event.type);
              const colorClass = getEventColor(event.type);
              return (
                <div 
                  key={event.id}
                  className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-gray-700 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{event.type}</span>
                        {event.target_type && (
                          <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">
                            {event.target_type}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        {event.target_id && `Target: ${event.target_id.slice(0, 8)}...`}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatTime(event.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info */}
      {!user?.kernelAppId && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 Seus dados de telemetria são armazenados de forma isolada no UNO.KERNEL.
            Apenas você tem acesso aos eventos e alertas do seu ambiente.
          </p>
        </div>
      )}
    </div>
  );
}
