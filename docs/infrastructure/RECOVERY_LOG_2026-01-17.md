# Log de Recuperação de Infraestrutura - 17/01/2026

## 1. Incidente
**Problema:** Incapacidade de conexão entre o Frontend (local e Cloudflare) e o Backend hospedado na Oracle Cloud Infrastructure (OCI).
**Sintomas:**
- Erros de Timeout (522) no Cloudflare.
- Comandos `curl` e `Test-NetConnection` pendurados/travados na máquina local.
- Script de automação Python falhando por timeout de conexão.

## 2. Diagnóstico
Identificado que as **Security Lists** (firewall de rede da OCI) na VCN `uno-vcn` não possuíam regras de entrada (Ingress Rules) permitindo tráfego nas portas públicas.

## 3. Solução Aplicada
**Ação:** Configuração Manual no Console Oracle Cloud.
**Local:** Networking > Virtual Cloud Networks > uno-vcn > Security Lists > Default Security List.

**Regras Adicionadas:**
| Origem (CIDR) | Porta Destino | Protocolo | Ação |
|---------------|---------------|-----------|------|
| 0.0.0.0/0     | 80            | TCP       | Permitir tráfego HTTP |
| 0.0.0.0/0     | 443           | TCP       | Permitir tráfego HTTPS |

## 4. Validação
Após a aplicação das regras, a conectividade foi restabelecida e validada via terminal:

```bash
# Teste de conectividade HTTP (Porta 80)
curl http://64.181.175.25/health
# Resultado: 404 Not Found (Esperado - Nginx/Traefik respondendo, firewall aberto)

# Teste de conectividade HTTPS (Porta 443 via Domínio)
curl https://api.prostqs.com.br/api/v1/health
# Resultado: 200 OK - JSON Healthy
```

**Status do Backend:**
```json
{
  "status": "healthy",
  "services": {
    "auth": "healthy",
    "billing": "healthy",
    "database": "healthy",
    "policy_engine": "healthy"
  }
}
```

## 5. Próximos Passos
- Sistema estável.
- Retomar desenvolvimento e refinamento do Frontend.
