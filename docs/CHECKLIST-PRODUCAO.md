# CHECKLIST DE PRODUÇÃO — PROST-QS / UNO.KERNEL

> O que verificar antes de ir para produção real.

---

## 🔐 Segurança

### Autenticação
- [x] JWT com expiração configurada
- [x] Refresh tokens implementados
- [x] Rate limiting por IP/usuário
- [x] Senhas com hash bcrypt
- [ ] 2FA (Two-Factor Authentication)
- [ ] Bloqueio após tentativas falhas

### Autorização
- [x] Middleware de autenticação em todas as rotas protegidas
- [x] Verificação de ownership (app pertence ao usuário)
- [x] Roles e permissões (user, admin, super_admin)
- [x] Policy Engine para ações sensíveis

### Dados
- [x] Isolamento multi-tenant por app_id
- [x] Criptografia AES-256 para secrets
- [x] API Keys com prefixo identificável (pq_pk_, pq_sk_)
- [ ] Backup automático do banco
- [ ] Criptografia em repouso (database)
- [ ] Logs sem dados sensíveis

### Infraestrutura
- [x] HTTPS obrigatório
- [x] CORS configurado corretamente
- [ ] Headers de segurança (CSP, HSTS, etc.)
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection

---

## 🏗️ Infraestrutura

### Backend
- [x] Health check endpoint (/health)
- [x] Ready check endpoint (/ready)
- [x] Graceful shutdown
- [ ] Horizontal scaling configurado
- [ ] Auto-scaling rules
- [ ] Load balancer

### Database
- [x] PostgreSQL em produção (Neon)
- [x] Connection pooling
- [x] Migrations automáticas
- [ ] Read replicas
- [ ] Backup diário
- [ ] Point-in-time recovery

### Cache
- [ ] Redis para sessões
- [ ] Cache de queries frequentes
- [ ] Rate limit distribuído

---

## 📊 Observabilidade

### Logs
- [x] Logs estruturados (JSON)
- [x] Request ID em todas as requisições
- [ ] Log aggregation (ELK/Loki)
- [ ] Log retention policy
- [ ] Alertas em erros críticos

### Métricas
- [x] Métricas básicas (/metrics/basic)
- [x] Uptime tracking
- [ ] APM (Application Performance Monitoring)
- [ ] Dashboards Grafana
- [ ] Alertas de threshold

### Tracing
- [ ] Distributed tracing (Jaeger/Zipkin)
- [ ] Correlation IDs
- [ ] Span tracking

---

## 🧪 Testes

### Backend
- [ ] Unit tests (>70% coverage)
- [ ] Integration tests
- [ ] API contract tests
- [ ] Load tests (k6/Artillery)

### Frontend
- [ ] Unit tests (Jest/Vitest)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Visual regression tests
- [ ] Accessibility tests

### Segurança
- [ ] Penetration testing
- [ ] Dependency vulnerability scan
- [ ] OWASP Top 10 checklist

---

## 🚀 Deploy

### CI/CD
- [ ] GitHub Actions configurado
- [ ] Build automático em PR
- [ ] Testes em PR
- [ ] Deploy automático staging
- [ ] Deploy manual produção
- [ ] Rollback automático

### Ambientes
- [x] Produção (Render)
- [ ] Staging (clone de produção)
- [ ] Preview environments (por PR)

### Releases
- [ ] Semantic versioning
- [ ] Changelog automático
- [ ] Release notes
- [ ] Feature flags

---

## 📝 Documentação

### Técnica
- [x] README.md atualizado
- [x] Arquitetura documentada
- [x] API documentada
- [x] Glossário técnico
- [ ] Runbook de operações
- [ ] Disaster recovery plan

### Usuário
- [ ] Guia de início rápido
- [ ] Tutoriais por feature
- [ ] FAQ
- [ ] Changelog público

---

## 💰 Billing

### Stripe
- [x] Integração configurada
- [x] Webhooks registrados
- [x] Idempotência implementada
- [ ] Produtos criados
- [ ] Preços definidos
- [ ] Teste de cobrança real

### Medição
- [x] Usage tracking implementado
- [x] Métricas por tenant
- [ ] Relatórios de uso
- [ ] Alertas de limite

---

## 🆘 Suporte

### Incidentes
- [x] Kill Switch implementado
- [x] Audit Log completo
- [ ] Runbook de incidentes
- [ ] Escalation policy
- [ ] Post-mortem template

### Comunicação
- [ ] Status page pública
- [ ] Email de suporte
- [ ] Canal de emergência
- [ ] SLA documentado

---

## ✅ Checklist Final

### Antes do Launch
- [ ] Todos os testes passando
- [ ] Sem vulnerabilidades críticas
- [ ] Backup testado
- [ ] Rollback testado
- [ ] Documentação revisada
- [ ] Equipe treinada

### No Dia do Launch
- [ ] Monitoramento ativo
- [ ] Equipe de plantão
- [ ] Canais de comunicação abertos
- [ ] Plano de rollback pronto

### Após o Launch
- [ ] Métricas sendo coletadas
- [ ] Alertas funcionando
- [ ] Feedback sendo coletado
- [ ] Bugs sendo triados

---

## 📊 Status Atual

| Categoria | Completo | Total | % |
|-----------|----------|-------|---|
| Segurança | 10 | 16 | 62% |
| Infraestrutura | 6 | 12 | 50% |
| Observabilidade | 4 | 12 | 33% |
| Testes | 0 | 12 | 0% |
| Deploy | 1 | 10 | 10% |
| Documentação | 5 | 10 | 50% |
| Billing | 4 | 8 | 50% |
| Suporte | 2 | 8 | 25% |
| **TOTAL** | **32** | **88** | **36%** |

### Prioridades
1. **Testes** — Maior gap, maior risco
2. **Observabilidade** — Essencial para produção
3. **Deploy/CI** — Automatização reduz erros
4. **Segurança** — Completar itens faltantes

---

*Documento atualizado em 11/01/2026*
