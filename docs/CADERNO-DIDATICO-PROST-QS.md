# CADERNO DIDÁTICO: Sistema PROST-QS
## Guia Completo para Entendimento do Sistema

---

# PARTE 1: O QUE É O PROST-QS?

## Definição Simples
O PROST-QS é um **kernel econômico para SaaS** (Software as a Service). Pense nele como o "motor financeiro e de governança" que fica por trás de qualquer aplicação que você queira monetizar.

## Analogia para Entender
Imagine que você quer abrir uma loja online. Você precisa de:
- Um sistema de login (quem é o cliente?)
- Um sistema de pagamento (como ele paga?)
- Um sistema de permissões (o que ele pode fazer depois de pagar?)
- Um sistema de auditoria (o que aconteceu e quando?)

O PROST-QS é tudo isso junto, pronto para usar. Você não precisa construir do zero.

## O Nome
- **PROST**: Vem de "Prosperity" (prosperidade) - o objetivo é gerar receita
- **QS**: "Quality System" - sistema de qualidade

---

# PARTE 2: ARQUITETURA EM 3 CAMADAS

O sistema é dividido em 3 camadas que NÃO se misturam:

## Camada 1: Identidade (Quem é você?)
**Responsabilidade:** Saber quem está usando o sistema

- Registro de usuários
- Login/Logout
- Tokens JWT (como um crachá digital)
- Sessões ativas

**Importante:** Esta camada NÃO sabe nada sobre dinheiro. Ela só responde: "Esse usuário existe e está autenticado?"

## Camada 2: Econômica / Billing (Quanto você pagou?)
**Responsabilidade:** Registrar fatos financeiros

- Billing Account (conta de cobrança do usuário)
- Ledger (livro-razão com todas as transações)
- Integração com Stripe (processador de pagamentos)
- Webhooks (receber notificações do Stripe)
- State Machine de pagamentos (pendente → pago → cancelado)

**Importante:** Esta camada NÃO decide o que o usuário pode fazer. Ela só registra: "Esse usuário pagou R$ X no dia Y"

## Camada 3: Capabilities (O que você pode fazer?)
**Responsabilidade:** Decidir permissões baseado em fatos

- Planos (Free, Pro, Enterprise)
- Add-ons (funcionalidades extras compráveis)
- Limites (quantos apps, quantos usuários)
- Resolver de Entitlements (junta plano + add-ons e diz o que pode)

**Importante:** Esta camada NÃO confia em intenções. Ela só olha para fatos registrados na camada econômica.

---

# PARTE 3: FLUXO DE MONETIZAÇÃO

## Como o dinheiro entra no sistema?

```
1. Usuário se registra (Camada Identidade)
   ↓
2. Usuário cria Billing Account (Camada Econômica)
   ↓
3. Usuário escolhe comprar algo (Add-on ou Plano)
   ↓
4. Sistema cria Checkout Session no Stripe
   ↓
5. Usuário paga no Stripe (cartão de crédito)
   ↓
6. Stripe envia Webhook para o sistema
   ↓
7. Sistema registra pagamento no Ledger
   ↓
8. Sistema concede Capability ao usuário
   ↓
9. Usuário agora pode usar a funcionalidade
```

## Princípio Fundamental
**"Sem evento de pagamento confirmado, não existe direito."**

O sistema NUNCA concede uma funcionalidade baseado em promessa. Só concede quando o Stripe confirma que o dinheiro entrou.

---

# PARTE 4: CATÁLOGO DE ADD-ONS

## O que são Add-ons?
São funcionalidades extras que o usuário pode comprar além do plano base.

## Add-ons Atuais do Sistema

| ID | Nome | Preço | O que faz |
|----|------|-------|-----------|
| export_data | Exportação de Dados | R$ 9,90/mês | Permite exportar dados em CSV, JSON, Excel |
| audit_logs | Logs de Auditoria | R$ 19,90/mês | Acesso completo aos logs de auditoria |
| extra_apps_5 | +5 Apps | R$ 14,90/mês | Adiciona 5 apps ao limite |
| extra_apps_20 | +20 Apps | R$ 49,90/mês | Adiciona 20 apps ao limite |
| extra_users_5000 | +5.000 Usuários | R$ 29,90/mês | Aumenta limite de usuários por app |

## Como funciona a compra?

1. `GET /api/v1/addons` - Lista add-ons disponíveis para o plano do usuário
2. `POST /api/v1/addons/{id}/purchase` - Inicia compra, retorna URL do Stripe
3. Usuário paga no Stripe
4. Webhook processa e concede o add-on
5. `GET /api/v1/entitlements/effective` - Mostra capabilities atuais

---

# PARTE 5: SISTEMA DE CAPABILITIES

## O que são Capabilities?
São "poderes" que o usuário tem no sistema. Exemplos:

- `CAN_EXPORT_DATA` - Pode exportar dados
- `CAN_VIEW_AUDIT_LOGS` - Pode ver logs de auditoria
- `CAN_CREATE_APP` - Pode criar aplicações
- `CAN_INVITE_USERS` - Pode convidar usuários

## De onde vêm as Capabilities?

1. **Do Plano Base** - Plano Pro dá certas capabilities automaticamente
2. **De Add-ons** - Comprar add-on adiciona capabilities
3. **De Trials** - Admin pode conceder trial temporário
4. **De Promoções** - Sistema pode conceder por campanha

## O Resolver de Entitlements

É o "juiz" que decide o que o usuário pode fazer:

```
Entitlements Efetivos = Plano Base + Add-ons Ativos + Trials + Promoções
```

Ele também calcula limites:
```
Limite de Apps = Limite do Plano + Bônus de Add-ons
```

---

# PARTE 6: GOVERNANÇA E AUDITORIA

## Kill Switch
O sistema tem um "botão de emergência" que pode:
- Bloquear operações específicas
- Bloquear usuários específicos
- Bloquear o sistema inteiro

Usado em casos de fraude ou problemas críticos.

## Policy Engine
Motor de políticas que avalia regras antes de permitir operações:
- Limites de valor por transação
- Limites por período
- Regras de compliance

## Audit Trail
Tudo é registrado:
- Quem fez
- O que fez
- Quando fez
- De onde fez (IP, User-Agent)
- Resultado da operação

---

# PARTE 7: INTEGRAÇÕES EXTERNAS

## Stripe (Pagamentos)
- **Secret Key**: Autenticação da API
- **Webhook Secret**: Validação de eventos
- **Price IDs**: Identificadores dos produtos/preços
- **Checkout Session**: Página de pagamento hospedada pelo Stripe

## Render (Hospedagem Backend)
- Deploy automático via GitHub
- Variáveis de ambiente para secrets
- Logs em tempo real

## Vercel (Hospedagem Frontend)
- Deploy automático via GitHub
- CDN global
- HTTPS automático

---

# PARTE 8: ESTADO ATUAL DO SISTEMA

## O que está 100% pronto no código:

✅ Autenticação JWT completa
✅ Registro e login de usuários
✅ Billing Account (conta de cobrança)
✅ Ledger (livro-razão)
✅ Catálogo de Add-ons
✅ Compra de Add-ons via Stripe Checkout
✅ Webhook Handler para processar pagamentos
✅ Capability Resolver (decide permissões)
✅ Fail-fast validation (sistema não sobe sem configuração correta)
✅ Auditoria de grants (registro de concessões)
✅ Kill Switch
✅ Policy Engine

## O que está pendente (configuração externa):

🟡 Stripe em modo LIVE aguardando aprovação de "Cartões"
🟡 Webhook endpoint precisa ser configurado no Stripe Dashboard

---

# PARTE 9: FASE ATUAL DO PROJETO

## Onde estamos?
**Fase: Ativação de Produção**

O código está 100% pronto. O sistema está em deploy. O que falta é:

1. Stripe aprovar os métodos de pagamento (status "Pendente")
2. Configurar webhook endpoint no Stripe
3. Fazer primeira venda real

## O que NÃO precisa mais ser feito no código:
- Não precisa refatorar
- Não precisa adicionar features
- Não precisa corrigir bugs estruturais

O sistema está em estado de "ligar a chave".

---

# PARTE 10: PRÓXIMOS PASSOS

## Imediato (quando Stripe aprovar):
1. Testar compra real de add-on
2. Verificar webhook processando
3. Confirmar capability concedida
4. Registrar como marco de produção

## Curto Prazo (30 dias):
1. Monitorar primeiras vendas
2. Criar bundles (pacotes de add-ons com desconto)
3. Implementar trials estratégicos
4. Observar métricas de conversão

## Médio Prazo (60-90 dias):
1. Ajustar preços baseado em dados
2. Criar plano Enterprise
3. Implementar upsell guiado
4. Expandir catálogo de add-ons

---

# PARTE 11: ENDPOINTS PRINCIPAIS DA API

## Autenticação
```
POST /api/v1/auth/register - Criar conta
POST /api/v1/auth/login - Fazer login
POST /api/v1/auth/refresh - Renovar token
```

## Billing
```
POST /api/v1/billing/account - Criar conta de cobrança
GET /api/v1/billing/account - Ver conta de cobrança
POST /api/v1/billing/checkout - Criar checkout para plano
```

## Add-ons
```
GET /api/v1/addons - Listar add-ons disponíveis
GET /api/v1/addons/mine - Listar meus add-ons
POST /api/v1/addons/{id}/purchase - Comprar add-on
DELETE /api/v1/addons/{id} - Cancelar add-on
```

## Entitlements
```
GET /api/v1/entitlements/effective - Ver capabilities efetivas
GET /api/v1/capabilities/{cap}/explain - Explicar origem de uma capability
```

## Admin
```
POST /api/v1/admin/addons/grant-trial - Conceder trial
GET /api/v1/admin/addons/grants - Ver grants recentes
DELETE /api/v1/admin/addons/users/{userId}/addons/{addonId} - Revogar add-on
```

---

# PARTE 12: CONCEITOS-CHAVE PARA LEMBRAR

## 1. Separação de Domínios
Identidade, Economia e Capabilities são independentes. Isso permite:
- Trocar o processador de pagamento sem mexer em permissões
- Mudar regras de permissão sem mexer em pagamentos
- Escalar cada parte independentemente

## 2. Fatos, não Promessas
O sistema só concede direitos baseado em eventos confirmados. Nunca em intenções.

## 3. Auditoria Total
Tudo é registrado. Qualquer pergunta sobre "por que esse usuário tem isso?" pode ser respondida.

## 4. Fail-Fast
Se algo está mal configurado, o sistema não sobe. Melhor falhar no deploy do que falhar em produção.

## 5. Idempotência
Processar o mesmo evento duas vezes não causa problema. O sistema detecta duplicatas.

---

# PARTE 13: GLOSSÁRIO

| Termo | Significado |
|-------|-------------|
| **JWT** | JSON Web Token - "crachá digital" do usuário |
| **Billing Account** | Conta de cobrança associada ao usuário |
| **Ledger** | Livro-razão com todas as transações |
| **Webhook** | Notificação que o Stripe envia quando algo acontece |
| **Checkout Session** | Página de pagamento do Stripe |
| **Price ID** | Identificador único de um preço no Stripe |
| **Capability** | Permissão/poder que o usuário tem |
| **Entitlement** | Direito efetivo (capability + origem + validade) |
| **Add-on** | Funcionalidade extra comprável |
| **Grant** | Ato de conceder uma capability |
| **Kill Switch** | Mecanismo de emergência para bloquear operações |
| **Policy Engine** | Motor que avalia regras antes de permitir ações |

---

# PARTE 14: URLS DO SISTEMA

| Ambiente | URL |
|----------|-----|
| Backend (API) | https://uno0826.onrender.com |
| Frontend | https://uno0826.vercel.app |
| GitHub | https://github.com/AlmirPro25/uno0826 |
| Stripe Dashboard | https://dashboard.stripe.com |

---

# PARTE 15: RESUMO EXECUTIVO

## O que é?
PROST-QS é um kernel de monetização para SaaS, com identidade, billing, capabilities e governança integrados.

## Para que serve?
Para você criar aplicações que cobram dos usuários, sem precisar construir toda a infraestrutura de pagamentos e permissões do zero.

## Qual o estado atual?
Código 100% pronto, em produção, aguardando apenas aprovação do Stripe para processar pagamentos reais.

## Qual o próximo passo?
Quando o Stripe aprovar os métodos de pagamento, fazer a primeira venda real e confirmar que o ciclo completo funciona.

## Qual a visão de futuro?
Um sistema que permite criar, monetizar e escalar aplicações SaaS com confiança, sabendo que a infraestrutura econômica é sólida e auditável.

---

*Documento gerado em Janeiro/2026*
*Sistema PROST-QS v1.0*
