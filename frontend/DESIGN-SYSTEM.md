# Sistema de Design - UNO.KERNEL

## Princípio Fundamental

**Mesma cor + mesmo ícone = mesmo significado em qualquer lugar.**

Este documento define os contratos visuais e semânticos do sistema. Qualquer página que mostre estados DEVE usar estas definições.

---

## Vocabulário Semântico

### Termos para Ações

| Termo | Significado | Quando usar |
|-------|-------------|-------------|
| **Avaliação** | Regra foi verificada | Condition checked |
| **Disparo** | Regra decidiu agir | Condition met, action triggered |
| **Execução** | Ação foi realizada | Webhook sent, alert created |
| **Simulação** | Ação calculada mas não realizada | Shadow mode |
| **Bloqueio** | Ação impedida intencionalmente | Policy, authority |
| **Falha** | Ação tentou mas não conseguiu | Error, timeout |
| **Retry** | Ação será tentada novamente | Explicit retry |

### Termos Proibidos

Não use estes termos pois são ambíguos:
- "Tentativa" (pode ser execução ou simulação)
- "Processado" (não diz se teve sucesso)
- "Completo" (não diz o resultado)

---

## Cores Semânticas

### Mapeamento de Cores

| Cor | Significado | Uso |
|-----|-------------|-----|
| **Emerald** | Sucesso, executado, ativo, saudável | Ações bem-sucedidas |
| **Rose** | Falha, erro, crítico, kill switch | Erros e estados críticos |
| **Amber** | Aviso, atenção, pendente | Bloqueios intencionais |
| **Violet** | Simulação, shadow mode, hipotético | Tudo que é "teria acontecido" |
| **Indigo** | Neutro, informação, padrão | Estados normais |
| **Slate** | Inativo, desabilitado, histórico | Estados passivos |

### Classes CSS

```tsx
// Sucesso
bg-emerald-500/10 border-emerald-500/20 text-emerald-400

// Falha
bg-rose-500/10 border-rose-500/20 text-rose-400

// Aviso
bg-amber-500/10 border-amber-500/20 text-amber-400

// Simulação
bg-violet-500/10 border-violet-500/20 text-violet-400

// Neutro
bg-indigo-500/10 border-indigo-500/20 text-indigo-400

// Inativo
bg-slate-500/10 border-slate-500/20 text-slate-500
```

---

## Ícones Semânticos

### Mapeamento de Ícones

| Ícone | Significado | Quando usar |
|-------|-------------|-------------|
| `CheckCircle2` | Sucesso, executado, aprovado | Ações bem-sucedidas |
| `XCircle` | Falha, erro, rejeitado | Erros |
| `AlertTriangle` | Aviso, atenção, bloqueado | Bloqueios intencionais |
| `Ghost` | Simulação, shadow mode | Tudo hipotético |
| `Clock` | Pendente, aguardando, tempo | Estados de espera |
| `Power` | Kill switch, controle crítico | Controle de emergência |
| `Shield` | Proteção, segurança, normal | Estado saudável |
| `Brain` | Cognição, regra, decisão | Motor de regras |
| `Zap` | Ação, disparo, execução | Ações executadas |
| `Activity` | Pulso, vida, telemetria | Métricas de vida |
| `Eye` | Observando, shadow ativo | Shadow mode ativo |
| `EyeOff` | Não observando | Shadow mode inativo |
| `RotateCcw` | Retry, tentar novamente | Ações de retry |

---

## Componentes Reutilizáveis

### StateBadge

Badge para estados do sistema.

```tsx
import { StateBadge, HttpStatusBadge, SystemModeBadge } from "@/components/ui/state-badge";

// Badge genérico
<StateBadge state="success" label="Executado" />

// Badge de status HTTP
<HttpStatusBadge method="POST" statusCode={200} />

// Badge de modo do sistema
<SystemModeBadge mode="shadow" />
```

### StateCard

Card para métricas.

```tsx
import { StateCard, EventsCard, RulesCard } from "@/components/ui/state-card";

// Card genérico
<StateCard 
  state="success" 
  title="Eventos" 
  value={1234} 
  subtitle="nas últimas 24h"
  pulse
/>

// Cards pré-configurados
<EventsCard value={1234} />
<RulesCard active={5} total={8} />
```

### LoadingState

Indicadores de carregamento.

```tsx
import { 
  LoadingSpinner, 
  LoadingOverlay, 
  PulseIndicator,
  SkeletonCard 
} from "@/components/ui/loading-state";

// Spinner
<LoadingSpinner size="lg" color="indigo" />

// Overlay de carregamento
<LoadingOverlay message="Carregando regras..." />

// Indicador de pulso
<PulseIndicator active color="emerald" />

// Skeleton
<SkeletonCard />
```

### EmptyState

Estados vazios.

```tsx
import { 
  EmptyState, 
  NoRulesState, 
  NoEventsState 
} from "@/components/ui/empty-state";

// Genérico
<EmptyState 
  title="Nenhum dado" 
  description="Descrição do que fazer"
  action={{ label: "Criar", onClick: () => {} }}
/>

// Pré-configurados
<NoRulesState onCreateRule={() => {}} />
<NoEventsState />
```

---

## Helpers de Formatação

```tsx
import { 
  formatRelativeTime, 
  formatDuration, 
  formatNumber 
} from "@/lib/system-states";

// Tempo relativo
formatRelativeTime("2026-01-10T10:00:00Z") // "5min atrás"

// Duração
formatDuration(1500) // "1.5s"

// Números grandes
formatNumber(1234567) // "1.2M"
```

---

## Estados do Sistema

### Modos Globais

| Modo | Cor | Descrição |
|------|-----|-----------|
| **Normal** | Emerald | Sistema operando normalmente |
| **Shadow** | Violet | Ações simuladas, não executadas |
| **Kill Switch** | Rose | Todas as ações pausadas |

### Estados de Execução

| Estado | Cor | Descrição |
|--------|-----|-----------|
| **Executado com sucesso** | Emerald | Ação realizada |
| **Falhou** | Rose | Ação tentou mas não conseguiu |
| **Teria executado** | Violet | Em modo real, seria realizada |
| **Teria bloqueado** | Amber | Em modo real, seria impedida |
| **Bloqueado** | Amber | Impedido por política |
| **Não disparou** | Slate | Condição não atendida |

### Estados de Aprovação (LOOP 6)

| Estado | Cor | Descrição |
|--------|-----|-----------|
| **Pendente** | Amber | Aguardando decisão humana |
| **Aprovado** | Emerald | Ação autorizada por humano |
| **Rejeitado** | Rose | Ação negada por humano |
| **Expirado** | Slate | Tempo de aprovação esgotado |

### Níveis de Autoridade

| Nível | Rank | Cor | Descrição |
|-------|------|-----|-----------|
| **Observador** | 1 | Slate | Pode ver, não pode agir |
| **Sugestor** | 2 | Violet | Pode sugerir ações (shadow mode) |
| **Operador** | 3 | Indigo | Pode executar ações operacionais |
| **Gerente** | 4 | Amber | Pode mudar regras e configs |
| **Governador** | 5 | Emerald | Pode mudar políticas |
| **Soberano** | 6 | Rose | Pode desligar o sistema |

---

## Ícones de Delegação (LOOP 6)

| Ícone | Significado | Quando usar |
|-------|-------------|-------------|
| `Crown` | Autoridade, soberania | Níveis de poder |
| `UserCheck` | Aprovação, confirmação | Aprovações pendentes |
| `GitBranch` | Hierarquia, delegação | Estrutura de autoridade |
| `Layers` | Domínio, escopo | Domínios de ação |

---

## Componente SystemStatus

Mostra o estado de todos os loops do sistema em uma visualização compacta.

```tsx
import { SystemStatus } from "@/components/dashboard/system-status";

// Visualização completa
<SystemStatus appId={activeApp.id} />

// Visualização compacta (apenas ícones)
<SystemStatus appId={activeApp.id} compact />
```

### Loops Monitorados

| Loop | Nome | Descrição | Cor |
|------|------|-----------|-----|
| 1 | Pulso | Telemetria e eventos | Emerald |
| 2 | Cognição | Motor de regras | Purple |
| 3 | Ação | Webhooks e execuções | Indigo |
| 4 | Confiança | Shadow Mode e Kill Switch | Violet |
| 6 | Delegação | Autoridade e aprovações | Amber |

### Estados do Loop

| Estado | Cor | Significado |
|--------|-----|-------------|
| Healthy | Emerald | Operando normalmente |
| Warning | Amber | Atenção necessária |
| Error | Rose | Problema crítico |

---

## Regras de Ouro

1. **Nunca misture cores** - Se algo é simulação, use violet. Se é erro, use rose. Nunca use rose para simulação de erro.

2. **Ícones são contratos** - Ghost SEMPRE significa simulação. Power SEMPRE significa kill switch.

3. **Texto é secundário** - O usuário deve entender o estado pela cor/ícone antes de ler.

4. **Latência perceptiva** - Mesmo quando rápido, mostre que algo está acontecendo.

5. **Empty states são úteis** - Não deixe telas vazias sem explicação.
