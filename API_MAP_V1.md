# 🗺️ PROST-QS API Endpoints Map (v1)

Este documento contém o mapeamento completo das rotas disponíveis no Kernel do PROST-QS. Todas as rotas estão sob o prefixo `/api/v1`.

---

## 🔐 1. Autenticação & Identidade Soberana
Responsável pelo fluxo de entrada, segurança de acesso e identidade global.

| Endpoint | Método | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| `/auth/login` | POST | 🔓 | Login tradicional (Username/Password) |
| `/auth/logout` | POST | 🔐 | Encerra a sessão atual |
| `/auth/logout-all` | POST | 🔐 | Encerra TODAS as sessões do usuário |
| `/auth/refresh` | POST | 🔓 | Renovação de Access Token |
| `/auth/mfa/setup` | POST | 🔐 | Configura Segundo Fator (TOTP) |
| `/auth/mfa/verify` | POST | 🔐 | Verifica código MFA |
| `/auth/sessions` | GET | 🔐 | Lista sessões ativas do usuário |
| `/verification/otp/request` | POST | 🔓 | Solicita código via Telefone/Email |
| `/verification/otp/verify` | POST | 🔓 | Verifica código e retorna Token temporário |
| `/identity/implicit-login` | POST | 🔑 | Login invisível via API Key de App |
| `/identity/login` | POST | 🔓 | Login Multi-App (Global) |
| `/identity/register` | POST | 🔓 | Registro Multi-App |

---

## 👤 2. Usuários & Perfis
Gestão de dados do usuário e histórico.

| Endpoint | Método | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| `/users/me` | GET | 🔐 | Retorna perfil do usuário logado |
| `/users/me/profile` | PUT | 🔐 | Atualiza dados do perfil |
| `/users/me/login-history` | GET | 🔐 | Histórico de acessos do próprio usuário |
| `/identity/profile` | GET | 🔐 | Perfil global unificado |

---

## 🧠 3. IA & Inteligência (AI HUB)
Onde as IAs interagem com o sistema e geram narrativas.

| Endpoint | Método | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| `/ai/chat` | POST | 🔐 | Chat interativo com o Kernel |
| `/ai/chat/stream` | POST | 🔐 | Stream de resposta da IA (SSE) |
| `/ai/conversations` | GET | 🔐 | Lista conversas salvas |
| `/ai/providers` | GET | 🔐 | Provedores de IA ativos (Gemini, OpenAI) |
| `/narratives/explain/:id` | GET | 🔐 | Explicação humana para uma falha/evento |
| `/admin/narrator/generate`| POST | 👮 | Gera análise narrativa do estado do sistema |

---

## 📈 4. Telemetria & Observabilidade
Monitoramento de guerra, métricas e alertas.

| Endpoint | Método | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| `/telemetry/ingest` | POST | 🔑 | Ingestão de eventos de Apps externos |
| `/warobs/dashboard` | GET | 👮 | Visão geral de pressão e RED Metrics |
| `/warobs/metrics` | GET | 👮 | Métricas detalhadas por endpoint |
| `/alerts/active` | GET | 👮 | Alertas que precisam de atenção agora |
| `/alerts/history` | GET | 👮 | Histórico de incidentes |
| `/observability/health` | GET | 🔓 | Health check rápido |
| `/observability/ready` | GET | 🔓 | Verifica se dependências (DB) estão prontas |
| `/admin/invariants` | GET | 👮 | Status dos guardiões de integridade |

---

## 💰 5. Sistema Econômico & Ads
Faturamento, planos e motor de anúncios.

| Endpoint | Método | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| `/billing/checkout` | POST | 🔐 | Cria sessão do Stripe para pagamento |
| `/billing/subscription`| GET | 🔐 | Status da assinatura do app |
| `/ads/decide` | POST | 🔓 | Motor de Decisão (Qual anúncio mostrar?) |
| `/ads/campaigns` | POST | 👮 | Cria nova campanha publicitária |
| `/ads/inventory` | GET | 👮 | Dashboard de inventário e saldo |
| `/kernel/plans` | GET | 🔓 | Planos disponíveis na plataforma |

---

## 🛡️ 6. Governança & Segurança (Admin Only)
Controle total sobre as regras do sistema.

| Endpoint | Método | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| `/admin/policies` | GET/POST | 👮 | Regras de governança e compliance |
| `/admin/killswitch` | POST | 🚨 | Botão de pânico (Desliga módulos/apps) |
| `/admin/audit` | GET | 👮 | Trilha de auditoria completa |
| `/admin/approvals` | GET/POST | 👮 | Console de aprovação humana (HITL) |
| `/immunity/status` | GET | 👮 | Estado do sistema imunológico |

---

## 🛠️ 7. Infraestrutura & Integrações

| Endpoint | Método | Auth | Descrição |
| :--- | :--- | :--- | :--- |
| `/webhooks` | POST/GET | 🔐 | Gerenciamento de webhooks de saída |
| `/apikeys` | POST/GET | 🔐 | Gerenciamento de chaves para desenvolvedores |
| `/lighthouse/peers` | GET | 🔓 | Descoberta de nós da rede (P2P) |
| `/events/history` | GET | 👮 | Log de eventos de sistema |

---

### **Legenda de Autenticação:**
- 🔓 **Público**: Acesso sem token.
- 🔐 **User Auth**: Requer Token JWT (`Bearer`).
- 🔑 **App Key**: Requer headers `X-App-Key` e `X-App-Secret`.
- 👮 **Admin Only**: Requer User Auth + role de Admin.
- 🚨 **Super Admin**: Requer permissões de nível máximo.
