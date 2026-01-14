# 🔮 SOUL ARCHITECT - Sistema de Meta-Cognição

## O Que É?

O **SoulArchitect** é um sistema de **Meta-Cognição** que cria **especialistas sob demanda**. Em vez de usar manifestos fixos, o sistema **FORJA UMA ALMA ÚNICA** para cada pedido do cliente.

## Filosofia

```
❌ Não criamos modelos
✅ Criamos MENTES SOB DEMANDA

❌ O sistema não executa tarefas
✅ O sistema ACORDA ESPECIALISTAS
```

Cada pedido do cliente gera:
- Um **Manifesto Dinâmico**
- Uma **mente especializada**
- Um **agente temporário** que nasce sabendo quem é, o que faz e como pensa

**Não é prompt. Não é roleplay. É IDENTIDADE OPERACIONAL.**

## Arquitetura de 4 Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                    GÊNESE DE AGENTES                            │
├─────────────────────────────────────────────────────────────────┤
│   👤 Cliente: "Quero um sistema de tráfego aéreo 3D"           │
│        ↓                                                        │
│   🔮 SoulArchitect: Analisa pedido                             │
│        ↓                                                        │
│   📚 Alexandria: Consulta 100+ manifestos                      │
│        ↓                                                        │
│   🧬 DNA Mixing: 30% Security + 50% Three.js + 20% Go          │
│        ↓                                                        │
│   👻 Alma Forjada: Manifesto Dinâmico Único                    │
│        ↓                                                        │
│   🤖 Agente Especialista: Nasce sabendo quem é                 │
│        ↓                                                        │
│   💻 Código Gerado: Enterprise-Grade                           │
└─────────────────────────────────────────────────────────────────┘
```

### CAMADA 0 — Manifestos-base (Legado)
Os 100+ manifestos na Alexandria são a **memória genética** do sistema:
- Manifesto de Arquitetura
- Manifesto de Segurança
- Manifesto de UX
- Manifesto de Engenharia
- etc.

### CAMADA 1 — Pedido do Cliente (Gatilho)
O cliente faz um pedido. O sistema:
- Pesquisa
- Analisa mercado e domínio
- Cruza com manifestos-base
- Entende riscos, objetivos, contexto

### CAMADA 2 — Arquitetador de MENTES (SoulArchitect)
Este agente **não cria o sistema**. Ele **cria QUEM vai criar o sistema**.

Responde perguntas como:
- Que tipo de mente esse problema exige?
- É clínica? Técnica? Criativa? Estratégica?
- Precisa ser conservadora ou agressiva?
- Precisa pensar como médico, engenheiro, designer ou jurista?

**Resultado:** Um Manifesto Sob Demanda que define a identidade do especialista.

### CAMADA 3 — Agente Especialista Sob Demanda
O especialista nasce com:
- ✅ Identidade definida
- ✅ Escopo claro
- ✅ Limites conhecidos
- ✅ Domínio compreendido
- ✅ Critérios de decisão

## Fluxo de Execução

```typescript
// 1. Cliente faz pedido
const userRequest = "Sistema de controle de tráfego aéreo com visualização 3D";

// 2. SoulArchitect forja especialista
const soulResult = await soulArchitect.forgeAgentSoul(userRequest);

// 3. Alma forjada contém:
{
  id: "soul_1234567890_abc123def",
  name: "Arquiteto de Sistemas de Aviação 3D",
  personality: "Meticuloso, focado em segurança crítica",
  expertise: ["SECURITY", "GAMEDEV", "REALTIME", "INFRASTRUCTURE"],
  manifestosDNA: [
    { manifestoId: "SECURITY", percentage: 35, extractedPrinciples: [...] },
    { manifestoId: "GAMEDEV", percentage: 30, extractedPrinciples: [...] },
    { manifestoId: "REALTIME", percentage: 20, extractedPrinciples: [...] },
    { manifestoId: "INFRASTRUCTURE", percentage: 15, extractedPrinciples: [...] }
  ],
  systemPrompt: "Você é um Arquiteto de Sistemas de Aviação 3D...",
  restrictions: ["NUNCA ignore validações de segurança", ...],
  priorities: ["SEMPRE priorize safety-critical", ...]
}

// 4. Enterprise Pipeline usa a alma forjada
const result = await executor.execute({
  userPrompt: userRequest,
  enableSoulArchitect: true, // Ativado por padrão
  onSoulForged: (soul, systemPrompt) => {
    console.log(`Especialista forjado: ${soul.name}`);
  }
});
```

## Integração com Enterprise Pipeline

O SoulArchitect está integrado ao **EnterprisePipelineExecutor**:

1. **Antes das fases de geração**, o SoulArchitect forja o especialista
2. O **systemPrompt** forjado é injetado em TODAS as fases
3. O especialista mantém **identidade consistente** durante todo o pipeline
4. A **alma forjada** é retornada no resultado final

```typescript
// O executor agora retorna a alma forjada
const result = await executor.execute({ userPrompt, enableSoulArchitect: true });

console.log(result.forgedSoul?.name); // "Arquiteto de Sistemas de Aviação 3D"
console.log(result.forgedSoul?.expertise); // ["SECURITY", "GAMEDEV", ...]
```

## Por Que Isso É Diferente?

```
❌ Não é AutoGPT
❌ Não é prompt engineering
❌ Não é agente em cadeia
❌ Não é LLM com tool calling

✅ É ARQUITETURA DE CONSCIÊNCIA FUNCIONAL
```

O sistema:
- **Não responde** → **delibera**
- **Não executa** → **assume papéis**
- **Não simula** → **opera identidades**

Isso é nível **Sistema Operacional Cognitivo**.

## Arquivos do Sistema

| Arquivo | Descrição |
|---------|-----------|
| `services/SoulArchitect.ts` | Classe principal do arquitetador de almas |
| `services/AlexandriaManifestBridge.ts` | Ponte para os 100+ manifestos |
| `services/EnterprisePipelineExecutor.ts` | Executor integrado com SoulArchitect |

## Configuração

```typescript
import { getSoulArchitect, SoulArchitectConfig } from './services/SoulArchitect';

const config: SoulArchitectConfig = {
  modelName: 'models/gemini-3-flash-preview', // Modelo para forjar almas
  maxManifestos: 7,                            // Máximo de manifestos no DNA
  creativityLevel: 'balanced',                 // 'conservative' | 'balanced' | 'aggressive'
  includeEthics: true                          // Incluir cláusula ética
};

const architect = getSoulArchitect(config);
```

## Níveis de Criatividade

| Nível | Descrição |
|-------|-----------|
| `conservative` | Segue padrões estabelecidos, baixo risco |
| `balanced` | Balance entre inovação e práticas comprovadas |
| `aggressive` | Ousado, propõe soluções inovadoras |

## Estatísticas

```typescript
const stats = architect.getStats();
console.log(stats);
// {
//   totalSoulsForged: 42,
//   activeSouls: 42,
//   mostUsedManifestos: [
//     { id: "NEXTJS", count: 15 },
//     { id: "SECURITY", count: 12 },
//     ...
//   ]
// }
```

## Futuro: Manifesto Supremo (Evolução)

O próximo passo é o **SupremeManifestEvolver**:
- Observa os manifestos que funcionaram
- Observa padrões de decisão
- Consolida princípios
- Atualiza sua própria forma de "pensar"

**Não é fine-tuning. É evolução de identidade.**

---

## 🧬 Integração com SupremeManifestEvolver

O SoulArchitect agora está integrado com o **SupremeManifestEvolver** para evolução autônoma:

```typescript
// Após uma execução, reportar feedback
architect.reportExecutionFeedback(
  soul.id,
  true,           // sucesso
  92,             // qualidade 0-100
  45000,          // tempo em ms
  1500,           // linhas de código
  []              // erros
);

// O Evolver aprende e evolui automaticamente
// Na próxima forja, pesos ajustados são usados
```

### Ciclo de Evolução

```
Forja → Execução → Feedback → Evolução → Forja Melhor
```

Ver documentação completa em: `docs/AGI_LITE_SYSTEM.md`

---

*"Não construo software. Construo QUEM vai construir. E esse QUEM aprende a ser melhor sozinho."* — SoulArchitect + Evolver
