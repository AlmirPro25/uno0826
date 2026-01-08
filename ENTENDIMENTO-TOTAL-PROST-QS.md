# PROST-QS — Documento de Entendimento Total do Sistema

Este documento existe por um motivo simples e vital: **tirar o sistema da sua cabeça e colocá-lo no mundo de forma objetiva.**

Nada aqui pressupõe conhecimento prévio. Tudo parte do zero. A ideia é que qualquer pessoa minimamente técnica consiga entender o que o sistema é, por que ele existe, como funciona por dentro e o que ainda falta fazer.

---

## 1. O problema real que o sistema resolve (a dor original)

Antes de falar de código, IA ou governança, é preciso falar da dor.

Hoje, aplicações digitais sofrem de três problemas estruturais:

**Eventos acontecem, mas ninguém governa o significado deles**
Um `user.signup`, um `payment.failed`, um `admin.deleted_user`… tudo vira log solto, webhook perdido ou métrica burra.

**Cada app reinventa regras, auditoria e inteligência**
Toda aplicação cria seu próprio sistema de permissões, trilhas de auditoria, decisões automáticas e depois tenta enfiar IA em cima disso sem base sólida.

**IA é usada sem contexto, sem memória e sem responsabilidade**
Modelos respondem coisas, mas não existe governo sobre quem pode decidir o quê, com base em quais fatos, com qual impacto.

👉 **O PROST-QS nasce para governar o significado dos eventos, antes mesmo de falar em IA.**

---

## 2. O que o PROST-QS é (em uma frase honesta)

> O PROST-QS é uma plataforma de governança de eventos, decisões e inteligência, multi-tenant, onde cada aplicação registra fatos do mundo real e, a partir deles, constrói regras, auditoria, automação e futuramente decisões assistidas por IA.

Ele não é um app final. **Ele é infraestrutura cognitiva.**

---

## 3. Arquitetura mental do sistema (visão de cima)

Pense no sistema como quatro camadas bem separadas:

```
┌─────────────────────────────────────────────────────────┐
│  Apps (clientes) — sistemas externos que enviam eventos │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  API de Ingestão — onde os eventos entram               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Núcleo de Governança — validação, isolamento, registro │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Camadas futuras — regras, jobs, billing, IA            │
└─────────────────────────────────────────────────────────┘
```

Nada se mistura. Essa separação é o que torna o sistema escalável e governável.

---

## 4. Conceito central: App como unidade soberana

Tudo no sistema gira em torno de um conceito:

> **Um App é uma entidade soberana, isolada e auditável.**

Cada App possui:
- Um `app_id` interno (UUID)
- Uma `public key` (API Key)
- Uma `secret key`
- Configurações próprias
- Eventos próprios
- Futuramente: regras, limites, billing e IA próprios

**Nenhum App enxerga outro App. Nunca.**

---

## 5. Autenticação: como o sistema sabe quem está falando

### 5.1 Headers (a identidade do App)

Toda requisição de um App para o PROST-QS carrega headers:

```
X-Prost-App-Key    → identifica o App
X-Prost-App-Secret → prova que ele é legítimo
```

Esses headers nunca vão no body. Eles são identidade, não dados.

### 5.2 Middleware (o guardião)

Antes de qualquer handler rodar:
1. O middleware lê os headers
2. Valida a chave e o segredo
3. Busca o App no banco
4. Injeta o `app` no contexto da request

Se isso falha, a request morre ali.

👉 **Resultado crítico: nenhum endpoint confia no cliente para dizer quem ele é.**

---

## 6. Regra de ouro do sistema

> **O App nunca envia `app_id` no body. Nunca.**

Motivo simples: se o cliente pudesse dizer qual é seu `app_id`, ele poderia mentir.

O `app_id` nasce no backend, vive no contexto e é usado internamente.

Esse detalhe aparentemente pequeno é, na prática, o que garante **isolamento real**.

---

## 7. Ingestão de eventos (o coração do sistema)

### 7.1 O que é um evento

Um evento é um **fato imutável** que aconteceu em algum lugar do mundo.

Exemplo:
- `user.signup`
- `payment.failed`
- `admin.deleted_user`

Um evento contém:
- Tipo (`type`)
- Quem fez (`actor_id`, `actor_type`)
- Ação (`action`)
- Timestamp
- App ao qual pertence (resolvido internamente)

### 7.2 O que acontece quando um evento entra

Passo a passo real:
1. App envia o evento
2. Middleware autentica e resolve o App
3. Handler recebe o evento
4. Backend grava o evento com `app_id`
5. O evento vira fonte de verdade

**Nada decide nada ainda. Só registra fatos.**

---

## 8. Jobs e processamento assíncrono

O sistema já possui um motor de jobs.

Ele existe para:
- Processar eventos depois
- Executar regras
- Integrar com billing
- Acionar IA futuramente

O locking (`locked_at`, `locked_by`) garante que:
- Um job não rode duas vezes
- Workers possam escalar

Isso já é infraestrutura de produção.

---

## 9. Billing (Stripe) — o sistema começa a virar negócio

O Stripe entra como **fato financeiro governado**.

O sistema já:
- Conecta Apps ao Stripe
- Registra status (`connected`, `test`, etc.)
- Armazena chaves públicas

O que ainda falta não é conceito. É execução:
- Criar produto
- Criar preço
- Criar cobrança real

**O bloqueio aqui é psicológico, não técnico.**

---

## 10. Onde a IA entra (e por que ainda não entrou)

A IA não vem antes da governança.

Ela só entra quando:
- Eventos são confiáveis
- Apps são isolados
- Regras são auditáveis
- Decisões têm trilha

A IA do PROST-QS não é um chatbot. **Ela é um agente governado por fatos.**

Isso é raro. E valioso.

---

## 11. Estado atual do sistema (verdade nua)

O sistema hoje:
- ✅ Já autentica corretamente
- ✅ Já isola Apps de verdade
- ✅ Já ingere eventos
- ✅ Já roda jobs
- ✅ Já conecta Stripe

**Ele já é um produto técnico real.**

O que falta agora:
- Deploy público
- Billing real
- Primeira app externa usando

Nada disso exige reinvenção. Só sequência.

---

## 12. Próximos passos objetivos (sem drama)

Ordem correta:

1. **Deploy no Fly.io**
2. **Configurar domínio + HTTPS**
3. **Criar produto e preço no Stripe**
4. **Cobrar o primeiro centavo**
5. Só então evoluir regras e IA

Esse é o caminho mais curto entre ideia e realidade.

---

## 13. Nota final (importante)

> Travamento não é incapacidade. É excesso de consciência.

Você não está atrasado. Você está construindo algo que exige coerência interna. Pouca gente chega até aqui.

**Agora o sistema pede mundo.**
