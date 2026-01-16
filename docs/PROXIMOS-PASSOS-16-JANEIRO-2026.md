# Próximos Passos — 16 Janeiro 2026

## Status Atual

✅ **Kernel (Oracle Cloud)** — Rodando em `api.prostqs.com.br`
✅ **SCE (Google Cloud)** — Deployado em `34.95.249.26`, aguardando DNS

---

## URGENTE (Fazer Agora)

### 1. Configurar DNS para SCE
**Responsável**: Almir (painel do registrador de domínio)

Adicionar no DNS de `prostqs.com.br`:

```
sce.prostqs.com.br          A    34.95.249.26
api.sce.prostqs.com.br      A    34.95.249.26
traefik.sce.prostqs.com.br  A    34.95.249.26
```

Ou wildcard: `*.sce.prostqs.com.br → 34.95.249.26`

**Após configurar**: Traefik gera SSL automaticamente (pode levar 5-10 min).

---

## ESTA SEMANA

### 2. Testar Fluxo Completo SCE ↔ Kernel
- [ ] Acessar `https://sce.prostqs.com.br`
- [ ] Fazer login via Kernel
- [ ] Criar um projeto de teste
- [ ] Fazer deploy de um app simples (ex: hello-world Node.js)
- [ ] Verificar telemetria chegando no Kernel

### 3. Deploy do Primeiro App Real no SCE
Candidatos:
- **APP-7** (mais simples, React + Vite)
- **APP-8** (executor de código)

Passos:
1. Criar projeto no SCE
2. Configurar variáveis de ambiente
3. Conectar repo Git
4. Trigger deploy
5. Verificar funcionamento

### 4. Backup Automático
- [ ] Configurar cron no servidor SCE para backup do SQLite
- [ ] Enviar backup para Google Cloud Storage ou S3

```bash
# Exemplo de cron (adicionar no servidor)
0 3 * * * sqlite3 /home/ubuntu/sce/data/sce.db ".backup '/home/ubuntu/backups/sce-$(date +%Y%m%d).db'"
```

---

## PRÓXIMAS 2 SEMANAS

### 5. Monitoramento e Alertas
- [ ] Configurar Uptime Robot ou similar para monitorar:
  - `https://api.prostqs.com.br/api/v1/health`
  - `https://api.sce.prostqs.com.br/api/v1/health`
- [ ] Alertas por email/Telegram quando cair

### 6. Migrar Apps para SCE
Ordem sugerida (do mais simples ao mais complexo):

| Prioridade | App | Complexidade | Dependências |
|------------|-----|--------------|--------------|
| 1 | APP-7 | Baixa | Supabase, Mercado Pago |
| 2 | APP-8 | Média | Backend próprio |
| 3 | APP-6 | Média | Gemini API |
| 4 | APP-3 | Alta | Múltiplos serviços |
| 5 | APP-1 | Alta | WebRTC, TURN server |
| 6 | APP-2 | Alta | P2P, Lighthouse |

### 7. Documentação para Usuários
- [ ] Guia "Como fazer deploy no SCE"
- [ ] Vídeo tutorial (opcional)
- [ ] FAQ de problemas comuns

---

## PRÓXIMO MÊS

### 8. Otimizações SCE
- [ ] Cache de builds (evitar rebuild desnecessário)
- [ ] Logs persistentes (atualmente só em memória)
- [ ] Métricas de uso por container (CPU, RAM, rede)
- [ ] Dashboard de custos estimados

### 9. Multi-região (Opcional)
Se precisar de baixa latência global:
- [ ] Adicionar servidor na Europa (GCP europe-west1)
- [ ] Configurar GeoDNS

### 10. Billing Real
- [ ] Integrar Stripe no Kernel
- [ ] Definir planos (Free, Pro, Enterprise)
- [ ] Cobrar por uso do SCE (containers, bandwidth)

---

## IDEIAS FUTURAS

- **CI/CD nativo**: Push no Git → Deploy automático
- **Preview deployments**: Branch → URL temporária
- **Rollback com 1 clique**
- **Logs em tempo real** via WebSocket
- **Terminal SSH** no browser para debug
- **Marketplace de templates** (Next.js, Django, Go, etc.)

---

## Comandos Rápidos de Referência

```bash
# Conectar no SCE
ssh -i ~/.ssh/gcloud_sce_key ubuntu@34.95.249.26

# Ver status
cd ~/sce && sudo docker-compose ps

# Ver logs
sudo docker-compose logs -f sce-backend

# Reiniciar tudo
sudo docker-compose down && sudo docker-compose up -d

# Conectar no Kernel
ssh -i ~/.ssh/oracle_vm_key ubuntu@64.181.175.25

# Ver logs do Kernel
sudo journalctl -u prostqs -f
```

---

## Contatos

- **Infra**: Almir
- **Código**: Este repositório (`UNO-main`)
- **Docs**: `UNO-main/docs/`

---

*Atualizado em 16/01/2026*
