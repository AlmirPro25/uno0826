"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Webhook, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Play, 
  Pause, 
  Key,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";

interface WebhookEndpoint {
  id: string;
  app_id: string;
  url: string;
  events: string;
  description: string;
  status: string;
  fail_count: number;
  last_success?: string;
  last_failure?: string;
  last_error?: string;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  endpoint_id: string;
  event_type: string;
  response_code: number;
  duration_ms: number;
  success: boolean;
  attempt: number;
  error?: string;
  created_at: string;
}

interface EventType {
  type: string;
  description: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function WebhookManager() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);

  useEffect(() => {
    fetchEndpoints();
    fetchEventTypes();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchEndpoints = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Falha ao carregar webhooks");
      const data = await res.json();
      setEndpoints(data.endpoints || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks/events`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setEventTypes(data.events || []);
    } catch {
      // Ignore
    }
  };

  const fetchDeliveries = async (endpointId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks/${endpointId}/deliveries`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDeliveries(data.deliveries || []);
      setSelectedEndpoint(endpointId);
    } catch {
      // Ignore
    }
  };

  const createEndpoint = async () => {
    if (!formUrl || formEvents.length === 0) {
      setError("URL e pelo menos um evento são obrigatórios");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          url: formUrl,
          events: formEvents,
          description: formDescription,
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar webhook");
      
      const data = await res.json();
      setNewSecret(data.secret);
      setSuccess("Webhook criado! Guarde o secret abaixo.");
      setShowCreate(false);
      setFormUrl("");
      setFormDescription("");
      setFormEvents([]);
      fetchEndpoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar webhook");
    }
  };

  const deleteEndpoint = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este webhook?")) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Falha ao remover webhook");
      
      setSuccess("Webhook removido");
      fetchEndpoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover webhook");
    }
  };

  const testEndpoint = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks/${id}/test`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Falha ao testar webhook");
      
      const data = await res.json();
      if (data.success) {
        setSuccess("Teste enviado com sucesso!");
      } else {
        setError(`Teste falhou: ${data.delivery?.error || "Erro desconhecido"}`);
      }
      fetchEndpoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao testar webhook");
    }
  };

  const toggleEndpoint = async (id: string, enable: boolean) => {
    try {
      const action = enable ? "enable" : "disable";
      const res = await fetch(`${API_URL}/api/v1/webhooks/${id}/${action}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`Falha ao ${enable ? "habilitar" : "desabilitar"} webhook`);
      
      setSuccess(`Webhook ${enable ? "habilitado" : "desabilitado"}`);
      fetchEndpoints();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status");
    }
  };

  const rotateSecret = async (id: string) => {
    if (!confirm("Tem certeza? O secret atual será invalidado.")) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/webhooks/${id}/rotate`, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Falha ao rotacionar secret");
      
      const data = await res.json();
      setNewSecret(data.secret);
      setSuccess("Secret rotacionado! Guarde o novo secret abaixo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao rotacionar secret");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copiado para a área de transferência!");
  };

  const toggleEvent = (eventType: string) => {
    setFormEvents(prev => 
      prev.includes(eventType) 
        ? prev.filter(e => e !== eventType)
        : [...prev, eventType]
    );
  };

  const getStatusBadge = (status: string, failCount: number) => {
    if (status === "active" && failCount === 0) {
      return <Badge className="bg-green-500">Ativo</Badge>;
    }
    if (status === "active" && failCount > 0) {
      return <Badge className="bg-yellow-500">Ativo ({failCount} falhas)</Badge>;
    }
    if (status === "disabled") {
      return <Badge variant="secondary">Desabilitado</Badge>;
    }
    if (status === "failed") {
      return <Badge variant="destructive">Falhou</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const parseEvents = (eventsJson: string): string[] => {
    try {
      return JSON.parse(eventsJson);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando webhooks...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {newSecret && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Guarde este secret! Ele não será mostrado novamente.</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1">
                  {showSecret ? newSecret : "••••••••••••••••••••••••••••••••"}
                </code>
                <Button size="sm" variant="ghost" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newSecret)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receba notificações em tempo real sobre eventos do sistema
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Webhook
            </Button>
          </div>
        </CardHeader>

        {showCreate && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">URL do Endpoint</label>
                <Input
                  placeholder="https://seu-app.com/webhooks"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição (opcional)</label>
                <Input
                  placeholder="Webhook para notificações de pagamento"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Eventos</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {eventTypes.map((event) => (
                    <label
                      key={event.type}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                        formEvents.includes(event.type) ? "bg-blue-50 border-blue-300" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formEvents.includes(event.type)}
                        onChange={() => toggleEvent(event.type)}
                        className="rounded"
                      />
                      <span className="text-sm">{event.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createEndpoint}>Criar Webhook</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {endpoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum webhook configurado</p>
              <p className="text-sm">Crie um webhook para receber notificações</p>
            </div>
          ) : (
            <div className="space-y-4">
              {endpoints.map((endpoint) => (
                <div
                  key={endpoint.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {endpoint.url}
                        </code>
                        {getStatusBadge(endpoint.status, endpoint.fail_count)}
                      </div>
                      {endpoint.description && (
                        <p className="text-sm text-muted-foreground">
                          {endpoint.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testEndpoint(endpoint.id)}
                        title="Testar"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleEndpoint(endpoint.id, endpoint.status !== "active")}
                        title={endpoint.status === "active" ? "Desabilitar" : "Habilitar"}
                      >
                        {endpoint.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => rotateSecret(endpoint.id)}
                        title="Rotacionar Secret"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEndpoint(endpoint.id)}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {parseEvents(endpoint.events).map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {endpoint.last_success && (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        Último sucesso: {new Date(endpoint.last_success).toLocaleString()}
                      </span>
                    )}
                    {endpoint.last_failure && (
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-red-500" />
                        Última falha: {new Date(endpoint.last_failure).toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Criado: {new Date(endpoint.created_at).toLocaleString()}
                    </span>
                  </div>

                  {endpoint.last_error && (
                    <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
                      Último erro: {endpoint.last_error}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fetchDeliveries(endpoint.id)}
                  >
                    Ver Histórico de Entregas
                  </Button>

                  {selectedEndpoint === endpoint.id && deliveries.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Últimas Entregas</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {deliveries.map((delivery) => (
                          <div
                            key={delivery.id}
                            className={`text-xs p-2 rounded flex items-center justify-between ${
                              delivery.success ? "bg-green-50" : "bg-red-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {delivery.success ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                              <span>{delivery.event_type}</span>
                              <Badge variant="outline" className="text-xs">
                                HTTP {delivery.response_code}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span>{delivery.duration_ms}ms</span>
                              <span>{new Date(delivery.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
