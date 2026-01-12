"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Key, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Activity
} from "lucide-react";

interface APIKey {
  id: string;
  app_id: string;
  name: string;
  key_prefix: string;
  scopes: string;
  description: string;
  status: string;
  last_used_at?: string;
  last_used_ip?: string;
  expires_at?: string;
  created_at: string;
}

interface Scope {
  scope: string;
  description: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formScopes, setFormScopes] = useState<string[]>([]);
  const [formExpiresIn, setFormExpiresIn] = useState<number | null>(null);

  useEffect(() => {
    fetchKeys();
    fetchScopes();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/apikeys`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Falha ao carregar API keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const fetchScopes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/apikeys/scopes`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setScopes(data.scopes || []);
    } catch {
      // Ignore
    }
  };

  const createKey = async () => {
    if (!formName || formScopes.length === 0) {
      setError("Nome e pelo menos um scope são obrigatórios");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/apikeys`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formName,
          scopes: formScopes,
          description: formDescription,
          expires_in_days: formExpiresIn,
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar API key");
      
      const data = await res.json();
      setNewKey(data.api_key);
      setSuccess("API key criada! Guarde a chave abaixo.");
      setShowCreate(false);
      setFormName("");
      setFormDescription("");
      setFormScopes([]);
      setFormExpiresIn(null);
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar API key");
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Tem certeza que deseja revogar esta API key? Esta ação não pode ser desfeita.")) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/apikeys/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Falha ao revogar API key");
      
      setSuccess("API key revogada");
      fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao revogar API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copiado para a área de transferência!");
  };

  const toggleScope = (scope: string) => {
    setFormScopes(prev => 
      prev.includes(scope) 
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const parseScopes = (scopesJson: string): string[] => {
    try {
      return JSON.parse(scopesJson);
    } catch {
      return [];
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge className="bg-green-500">Ativa</Badge>;
    }
    if (status === "revoked") {
      return <Badge variant="destructive">Revogada</Badge>;
    }
    if (status === "expired") {
      return <Badge variant="secondary">Expirada</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Carregando API keys...
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

      {newKey && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Guarde esta API key! Ela não será mostrada novamente.</p>
              <div className="flex items-center gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm flex-1 font-mono">
                  {showKey ? newKey : "pqs_••••••••••••••••••••••••••••••••"}
                </code>
                <Button size="sm" variant="ghost" onClick={() => setShowKey(!showKey)}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newKey)}>
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
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Gerencie chaves de API para integração de apps externos
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova API Key
            </Button>
          </div>
        </CardHeader>

        {showCreate && (
          <CardContent className="border-t">
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Nome da Key</label>
                <Input
                  placeholder="Ex: Produção, Staging, CI/CD"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Descrição (opcional)</label>
                <Input
                  placeholder="Para que será usada esta key"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Scopes (Permissões)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {scopes.map((scope) => (
                    <label
                      key={scope.scope}
                      className={`flex items-center gap-2 p-2 rounded border cursor-pointer ${
                        formScopes.includes(scope.scope) ? "bg-blue-50 border-blue-300" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formScopes.includes(scope.scope)}
                        onChange={() => toggleScope(scope.scope)}
                        className="rounded"
                      />
                      <div>
                        <span className="text-sm font-medium">{scope.scope}</span>
                        <p className="text-xs text-muted-foreground">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Expiração (opcional)</label>
                <select
                  className="w-full mt-1 p-2 border rounded"
                  value={formExpiresIn || ""}
                  onChange={(e) => setFormExpiresIn(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Nunca expira</option>
                  <option value="30">30 dias</option>
                  <option value="90">90 dias</option>
                  <option value="180">180 dias</option>
                  <option value="365">1 ano</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={createKey}>Criar API Key</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma API key criada</p>
              <p className="text-sm">Crie uma API key para integrar apps externos</p>
            </div>
          ) : (
            <div className="space-y-4">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.name}</span>
                        {getStatusBadge(key.status)}
                      </div>
                      <code className="text-sm text-muted-foreground">
                        pqs_{key.key_prefix}••••••••
                      </code>
                      {key.description && (
                        <p className="text-sm text-muted-foreground">
                          {key.description}
                        </p>
                      )}
                    </div>

                    {key.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => revokeKey(key.id)}
                        title="Revogar"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {parseScopes(key.scopes).map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        {scope}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {key.last_used_at && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Último uso: {new Date(key.last_used_at).toLocaleString()}
                      </span>
                    )}
                    {key.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expira: {new Date(key.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Criada: {new Date(key.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
