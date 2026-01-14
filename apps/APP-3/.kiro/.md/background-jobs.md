# ⏰ Background Jobs Supreme Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Background Jobs, Queue, Fila
- BullMQ, Bull, Agenda, Bee-Queue
- Temporal, Inngest, Trigger.dev
- Cron, Scheduled Tasks, Agendamento

## FILOSOFIA
> "Não faça o usuário esperar. Processe em background."

## STACK RECOMENDADA
| Caso | Solução |
|------|---------|
| Jobs simples | BullMQ + Redis |
| Serverless | Inngest, Trigger.dev |
| Workflows complexos | Temporal |
| Cron simples | node-cron |

## BOAS PRÁTICAS
- Sempre configure retry logic
- Use dead letter queue para falhas
- Garanta idempotência
- Implemente graceful shutdown
- Monitore e alerte

## ANTI-PATTERNS
❌ **NUNCA** processe jobs sem retry
❌ **NUNCA** ignore falhas silenciosamente
❌ **NUNCA** bloqueie a thread principal
