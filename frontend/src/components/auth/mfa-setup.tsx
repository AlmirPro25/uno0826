"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Shield, ShieldCheck, ShieldOff, Copy, Check, AlertTriangle } from "lucide-react";

interface MFAStatus {
  enabled: boolean;
  setup_id?: string;
  verified_at?: string;
  backup_codes_remaining: number;
}

interface MFASetupResponse {
  success: boolean;
  setup_id: string;
  secret: string;
  qr_code_uri: string;
  backup_codes: string[];
  message: string;
}

export function MFASetup({ userEmail }: { userEmail: string }) {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [setupData, setSetupData] = useState<MFASetupResponse | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"status" | "setup" | "verify" | "disable">("status");

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/mfa/status");
      setStatus(res.data);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Erro ao verificar status do MFA");
    } finally {
      setLoading(false);
    }
  };

  const startSetup = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post("/auth/mfa/setup", { email: userEmail });
      setSetupData(res.data);
      setStep("setup");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Erro ao iniciar setup do MFA");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (verifyCode.length !== 6) {
      setError("Código deve ter 6 dígitos");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.post("/auth/mfa/verify", { code: verifyCode });
      setSuccess("MFA habilitado com sucesso!");
      setStep("status");
      setSetupData(null);
      fetchStatus();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const disableMFA = async () => {
    if (disableCode.length !== 6) {
      setError("Código deve ter 6 dígitos");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.delete("/auth/mfa", { data: { code: disableCode } });
      setSuccess("MFA desabilitado");
      setStep("status");
      fetchStatus();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load status on mount
  useState(() => {
    fetchStatus();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autenticação de Dois Fatores (MFA)
        </CardTitle>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {step === "status" && status && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {status.enabled ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span>MFA Habilitado</span>
                    <Badge variant="default">Ativo</Badge>
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-5 w-5 text-yellow-500" />
                    <span>MFA Desabilitado</span>
                    <Badge variant="secondary">Inativo</Badge>
                  </>
                )}
              </div>
            </div>

            {status.enabled && (
              <div className="text-sm text-muted-foreground">
                <p>Códigos de backup restantes: {status.backup_codes_remaining}</p>
                {status.verified_at && (
                  <p>Habilitado em: {new Date(status.verified_at).toLocaleDateString()}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {!status.enabled ? (
                <Button onClick={startSetup} disabled={loading}>
                  Habilitar MFA
                </Button>
              ) : (
                <Button variant="destructive" onClick={() => setStep("disable")} disabled={loading}>
                  Desabilitar MFA
                </Button>
              )}
            </div>
          </div>
        )}

        {step === "setup" && setupData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Escaneie o QR code com seu app autenticador (Google Authenticator, Authy, etc.)
              </p>
              <div className="bg-white p-4 rounded-lg inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qr_code_uri)}`}
                  alt="QR Code MFA"
                  className="mx-auto"
                  width={200}
                  height={200}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Ou insira manualmente:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                  {setupData.secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(setupData.secret)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Códigos de Backup (guarde em local seguro):</p>
              <div className="grid grid-cols-2 gap-2">
                {setupData.backup_codes.map((code, i) => (
                  <code key={i} className="p-2 bg-muted rounded text-sm text-center">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Digite o código do app para confirmar:</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest"
                />
                <Button onClick={verifyAndEnable} disabled={loading || verifyCode.length !== 6}>
                  Verificar
                </Button>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setStep("status")}>
              Cancelar
            </Button>
          </div>
        )}

        {step === "disable" && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Desabilitar MFA reduz a segurança da sua conta. Tem certeza?
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm font-medium">Digite o código do app para confirmar:</p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest"
                />
                <Button
                  variant="destructive"
                  onClick={disableMFA}
                  disabled={loading || disableCode.length !== 6}
                >
                  Desabilitar
                </Button>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setStep("status")}>
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
