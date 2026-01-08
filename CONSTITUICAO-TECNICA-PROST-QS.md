# CONSTITUIÇÃO TÉCNICA DO PROST-QS

## SOVEREIGN KERNEL - DOCUMENTO FUNDAMENTAL

> "Este documento define o que o sistema se recusa a fazer, independentemente de quem peça."

**Versão**: 1.0  
**Data de Ratificação**: 28/12/2025  
**Status**: VIGENTE  
**Última Revisão**: —

---

## PREÂMBULO

O PROST-QS é um Kernel Soberano de governança institucional.

Este documento estabelece os **limites invioláveis** do sistema — regras que:
- Nenhuma feature pode contornar
- Nenhuma refatoração pode violar
- Nenhum administrador pode suspender sem declarar exceção formal
- Nenhuma evolução futura pode ignorar

**Se algo neste documento for quebrado, o sistema está errado — não o documento.**

---

## PARTE I — DEFINIÇÕES FUNDAMENTAIS

### Artigo 1 — Termos Canônicos

Os seguintes termos têm significado preciso e imutável neste sistema:

**§1.1 EXECUÇÃO**
> Ato de produzir efeito real no mundo a partir de uma decisão aprovada.
> Execução não é tentativa. Execução não é simulação. Execução altera estado.

**§1.2 DECISÃO**
> Registro formal de intenção que passou por aprovação humana.
> Decisão não é proposta. Decisão não é sugestão. Decisão tem autor identificável.

**§1.3 AUTORIDADE**
> Capacidade limitada, escopada e rastreável de aprovar decisões.
> Autoridade não é cargo. Autoridade não é hierarquia. Autoridade é poder delegado com limites.

**§1.4 AGENTE**
> Entidade não-humana que propõe ações ao sistema.
> Agente não decide. Agente não executa. Agente propõe e aguarda.

**§1.5 SIMULAÇÃO (Shadow Mode)**
> Execução hipotética que não altera estado real.
> Simulação informa. Simulação não autoriza. Simulação não cria precedente.

**§1.6 CONFLITO**
> Estado em que duas ou mais decisões ativas são mutuamente exclusivas.
> Conflito bloqueia. Conflito não se resolve sozinho. Conflito exige humano.

**§1.7 PRECEDENTE**
> Registro histórico de decisão encerrada, apresentado como memória.
> Precedente informa. Precedente não autoriza. Precedente não decide.

**§1.8 LIFECYCLE**
> Estado temporal de uma decisão (active, expired, revoked, superseded, under_review).
> Lifecycle governa validade. Lifecycle não é opcional. Lifecycle tem expiração obrigatória.

---

## PARTE II — INVARIANTES FUNDAMENTAIS

### Artigo 2 — Os Seis Invariantes

Estas são as leis fundamentais do PROST-QS. Violá-las é bug constitucional.

**§2.1 INVARIANTE DE EXECUÇÃO**
```
NENHUMA EXECUÇÃO SEM CanExecute() = true
```
> Toda execução DEVE passar pela verificação `CanExecute()`.
> Não existe atalho. Não existe bypass. Não existe "execução direta".
> Se executou sem `CanExecute()`, o sistema falhou.

**§2.2 INVARIANTE DE EXPIRAÇÃO**
```
NENHUMA DECISÃO SEM expires_at OU expires_on_condition OU review_required_every
```
> Toda decisão DEVE declarar quando deixa de valer.
> Não existe decisão eterna. Não existe "válido até segunda ordem".
> Se entrou na memória sem expiração, o sistema falhou.

**§2.3 INVARIANTE DE CONFLITO**
```
NENHUM CONFLITO COM RESOLUÇÃO AUTOMÁTICA
```
> Conflitos DEVEM ser resolvidos por humano com autoridade.
> O sistema não escolhe lados. O sistema não pondera. O sistema não otimiza.
> Se conflito se resolveu sozinho, o sistema falhou.

**§2.4 INVARIANTE DE REVISÃO**
```
NENHUMA REVISÃO SEM SUSPENSÃO DE EFEITOS
```
> Decisão em revisão (under_review) NÃO PODE produzir efeitos.
> Revisão suspende. Revisão não "continua enquanto analisa".
> Se decisão em revisão executou, o sistema falhou.

**§2.5 INVARIANTE DE JUSTIFICATIVA**
```
NENHUMA APROVAÇÃO SEM JUSTIFICATIVA HUMANA
```
> Toda aprovação DEVE ter justificativa textual (mínimo 10 caracteres).
> Não existe aprovação silenciosa. Não existe "ok" sem razão.
> Se aprovou sem justificativa, o sistema falhou.

**§2.6 INVARIANTE DE SIMULAÇÃO**
```
NENHUMA SIMULAÇÃO ALTERA ESTADO REAL
```
> Shadow Mode NUNCA modifica dados reais.
> Simulação é read-only no mundo. Simulação é write-only no log.
> Se simulação alterou estado, o sistema falhou.


---

## PARTE III — AXIOMAS DE AUTORIDADE

### Artigo 3 — Natureza da Autoridade

**§3.1 AUTORIDADE É DELEGADA, NÃO INERENTE**
> Ninguém nasce com autoridade no sistema.
> Autoridade é concedida, escopada e pode ser revogada.
> Cargo não é autoridade. Título não é autoridade.

**§3.2 AUTORIDADE TEM LIMITES EXPLÍCITOS**
> Toda autoridade declara:
> - Domínios onde pode atuar
> - Impacto máximo que pode aprovar
> - Ações específicas permitidas

**§3.3 AUTORIDADE NÃO SE HERDA DO PASSADO**
> Ter aprovado antes não aumenta poder de aprovar agora.
> Histórico "limpo" não habilita autonomia.
> Frequência não legitima.

**§3.4 AUTO-APROVAÇÃO É PROIBIDA**
> Quem solicita não pode aprovar a própria solicitação.
> Isso é inviolável. Não existe exceção.

**§3.5 ESCALAÇÃO É OBRIGATÓRIA QUANDO NECESSÁRIA**
> Se nenhuma autoridade disponível tem escopo suficiente, a decisão escala.
> O sistema não "dá um jeito". O sistema escala ou bloqueia.

---

## PARTE IV — AXIOMAS DE MEMÓRIA

### Artigo 4 — Natureza da Memória Institucional

**§4.1 MEMÓRIA INFORMA, NÃO DECIDE**
> A memória responde: "isso já aconteceu?"
> A memória NÃO responde: "então pode fazer de novo"

**§4.2 PRECEDENTE NÃO AUTORIZA**
> Precedente é descrição do passado, não permissão para o futuro.
> "Foi aprovado antes" não é justificativa válida.

**§4.3 FREQUÊNCIA NÃO LEGITIMA**
> Fazer algo muitas vezes não torna esse algo correto.
> O sistema não aprende padrões decisórios.
> O sistema não sugere baseado em histórico.

**§4.4 SIMILARIDADE NÃO DECIDE**
> Casos parecidos não herdam aprovação.
> Cada decisão é avaliada por si mesma.

**§4.5 MEMÓRIA NÃO CRIA AUTORIDADE NOVA**
> Nenhum registro histórico aumenta o poder de ninguém.
> Memória é contexto, não promoção.

---

## PARTE V — AXIOMAS DE TEMPO

### Artigo 5 — Natureza da Validade Temporal

**§5.1 TODA DECISÃO TEM FIM**
> Não existe decisão eterna.
> Toda decisão declara: data de expiração, condição de expiração, ou intervalo de revisão.

**§5.2 EXPIRAÇÃO NÃO É ERRO**
> Decisão expirada não é decisão errada.
> É decisão que cumpriu seu tempo.
> Nova aprovação é necessária, não correção.

**§5.3 TEMPO VENCE AUTORIDADE**
> Mesmo quem aprovou não "mantém" decisão viva sem renovação.
> Autoridade passada não estende validade presente.

**§5.4 REVOGAÇÃO É TERMINAL**
> Decisão revogada não volta a ser ativa.
> Não existe "des-revogar".
> Nova decisão é necessária, não restauração.

**§5.5 SUPERSESSÃO É EXPLÍCITA**
> Decisão substituída aponta para sua sucessora.
> Não existe substituição implícita.
> A cadeia de sucessão é rastreável.

---

## PARTE VI — AXIOMAS DE EMERGÊNCIA

### Artigo 6 — Natureza do Kill Switch

**§6.1 KILL SWITCH PARA TUDO**
> Quando ativado, o escopo afetado para completamente.
> Não existe "parar parcialmente".
> Não existe "continuar o que já começou".

**§6.2 KILL SWITCH EXIGE JUSTIFICATIVA**
> Ativação sem razão é proibida.
> A justificativa é registrada e auditável.

**§6.3 KILL SWITCH TEM DONO**
> Apenas super_admin pode ativar.
> Isso é concentração intencional de poder de emergência.

**§6.4 KILL SWITCH PODE EXPIRAR**
> Expiração automática é opcional mas recomendada.
> Evita "ditadura acidental" por esquecimento.

**§6.5 KILL SWITCH NÃO É PUNIÇÃO**
> É proteção do sistema, não sanção a usuários.
> Ativação é ato de prudência, não de autoridade punitiva.

---

## PARTE VII — COMPORTAMENTOS PROIBIDOS

### Artigo 7 — O Que o Sistema Nunca Faz

**§7.1 PROIBIÇÕES DE EXECUÇÃO**
```
❌ Executar sem verificar CanExecute()
❌ Executar decisão expirada
❌ Executar decisão revogada
❌ Executar decisão em revisão
❌ Executar durante conflito aberto
❌ Executar durante Kill Switch ativo
```

**§7.2 PROIBIÇÕES DE APROVAÇÃO**
```
❌ Aprovar sem justificativa
❌ Aprovar a própria solicitação
❌ Aprovar fora do escopo de autoridade
❌ Aprovar acima do limite de impacto
❌ Aprovar automaticamente baseado em histórico
```

**§7.3 PROIBIÇÕES DE MEMÓRIA**
```
❌ Inferir permissão de precedente
❌ Criar precedente automaticamente
❌ Rankear precedentes por "sucesso"
❌ Sugerir decisão baseada em padrão
❌ Aprender comportamento decisório
```

**§7.4 PROIBIÇÕES DE CONFLITO**
```
❌ Resolver conflito automaticamente
❌ Escolher lado em conflito
❌ Ponderar conflito por critério
❌ Expirar conflito por tempo
❌ Executar parcialmente durante conflito
```

**§7.5 PROIBIÇÕES DE SIMULAÇÃO**
```
❌ Alterar estado real em Shadow Mode
❌ Criar decisão a partir de simulação sem aprovação
❌ Usar simulação como justificativa suficiente
❌ Promover automaticamente de shadow para execução
```


---

## PARTE VIII — GARANTIAS DO SISTEMA

### Artigo 8 — O Que o Sistema Sempre Garante

**§8.1 GARANTIAS DE RASTREABILIDADE**
```
✅ Toda execução tem decisão associada
✅ Toda decisão tem autor humano identificável
✅ Toda aprovação tem justificativa registrada
✅ Toda transição de estado tem log imutável
✅ Todo conflito tem ambas as partes visíveis
```

**§8.2 GARANTIAS DE CONTROLE**
```
✅ Kill Switch funciona instantaneamente
✅ Conflito bloqueia execução imediatamente
✅ Expiração invalida decisão automaticamente
✅ Revisão suspende efeitos imediatamente
✅ Revogação é irreversível
```

**§8.3 GARANTIAS DE TRANSPARÊNCIA**
```
✅ Autoridades elegíveis são visíveis antes da decisão
✅ Motivo de bloqueio é sempre informado
✅ Precedentes são apresentados sem viés
✅ Simulações mostram o que teria acontecido
✅ Audit log é consultável por autoridades
```

**§8.4 GARANTIAS DE INTEGRIDADE**
```
✅ Decisões têm hash de integridade
✅ Transições têm hash de integridade
✅ Ledger contábil é append-only
✅ Audit log é append-only
✅ Nenhum registro é deletado, apenas marcado
```

---

## PARTE IX — EXCEÇÕES E EMENDAS

### Artigo 9 — Como Modificar Esta Constituição

**§9.1 EXCEÇÕES TEMPORÁRIAS**
> Exceções a esta Constituição DEVEM ser:
> - Declaradas explicitamente
> - Justificadas por escrito
> - Limitadas no tempo
> - Registradas em audit log
> - Aprovadas por super_admin

**§9.2 EMENDAS PERMANENTES**
> Modificações permanentes a esta Constituição DEVEM:
> - Passar por revisão formal
> - Não violar os 6 Invariantes Fundamentais (Artigo 2)
> - Ser documentadas com data e autor
> - Incrementar a versão do documento

**§9.3 INVARIANTES SÃO IMUTÁVEIS**
> Os 6 Invariantes Fundamentais (Artigo 2) NÃO PODEM ser emendados.
> Eles são a identidade do sistema.
> Violá-los é destruir o sistema, não modificá-lo.

---

## PARTE X — VERIFICAÇÃO DE CONFORMIDADE

### Artigo 10 — Como Verificar Se o Sistema Está Conforme

**§10.1 TESTES OBRIGATÓRIOS**

Para cada invariante, deve existir teste automatizado:

| Invariante | Teste |
|------------|-------|
| §2.1 Execução | Tentar executar sem `CanExecute()` → DEVE falhar |
| §2.2 Expiração | Criar decisão sem expiração → DEVE falhar |
| §2.3 Conflito | Conflito aberto + execução → DEVE bloquear |
| §2.4 Revisão | Decisão under_review + execução → DEVE bloquear |
| §2.5 Justificativa | Aprovar sem justificativa → DEVE falhar |
| §2.6 Simulação | Shadow mode + verificar estado → DEVE estar inalterado |

**§10.2 AUDITORIA PERIÓDICA**

Recomenda-se auditoria trimestral verificando:
- Nenhuma execução sem decisão associada
- Nenhuma decisão sem expiração
- Nenhum conflito resolvido automaticamente
- Nenhuma aprovação sem justificativa
- Integridade de hashes

**§10.3 ALERTAS DE VIOLAÇÃO**

O sistema DEVE alertar imediatamente se detectar:
- Tentativa de execução bloqueada
- Decisão criada sem expiração
- Conflito detectado
- Kill Switch ativado
- Transição de estado inválida

---

## PARTE XI — ASSINATURAS

### Artigo 11 — Ratificação

Este documento entra em vigor na data de sua ratificação.

```
RATIFICADO EM: 28/12/2025

SISTEMA: PROST-QS Sovereign Kernel
VERSÃO: Fase 14 Completa
DOCUMENTO: Constituição Técnica v1.0

TESTEMUNHAS:
- Tech Lead (ChatGPT) - Validação arquitetural
- Desenvolvedor (Kiro) - Implementação técnica
- Proprietário do Sistema - Autoridade final
```

---

## ANEXO A — REFERÊNCIA RÁPIDA DOS INVARIANTES

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    OS 6 INVARIANTES FUNDAMENTAIS                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║  1. NENHUMA EXECUÇÃO SEM CanExecute() = true                                  ║
║                                                                               ║
║  2. NENHUMA DECISÃO SEM expires_at                                            ║
║                                                                               ║
║  3. NENHUM CONFLITO COM RESOLUÇÃO AUTOMÁTICA                                  ║
║                                                                               ║
║  4. NENHUMA REVISÃO SEM SUSPENSÃO DE EFEITOS                                  ║
║                                                                               ║
║  5. NENHUMA APROVAÇÃO SEM JUSTIFICATIVA                                       ║
║                                                                               ║
║  6. NENHUMA SIMULAÇÃO ALTERA ESTADO REAL                                      ║
║                                                                               ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  Se qualquer um destes for violado → BUG CONSTITUCIONAL                       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

---

## ANEXO B — LOCALIZAÇÃO NO CÓDIGO

| Invariante | Arquivo | Função |
|------------|---------|--------|
| §2.1 Execução | `memory/service.go` | `CanExecute()` |
| §2.1 Execução | `agent/governed_service.go` | `ExecuteDecisionGoverned()` |
| §2.2 Expiração | `memory/service.go` | `CreateLifecycle()` |
| §2.3 Conflito | `memory/service.go` | `ResolveConflict()` |
| §2.4 Revisão | `memory/service.go` | `CreateReview()` |
| §2.5 Justificativa | `approval/service.go` | `Decide()` |
| §2.6 Simulação | `shadow/service.go` | `Execute()` |

---

*Fim da Constituição Técnica do PROST-QS*
