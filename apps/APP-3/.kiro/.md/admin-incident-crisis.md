# 🚨 Admin Incident & Crisis Master

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Incident, Incidente, Crise, Crisis
- Outage, Downtime, Falha, Failure
- Postmortem, RCA, Root Cause
- Escalation, Escalação, On-call
- War Room, Comando, Response

## FILOSOFIA
> "Crise não se resolve com código, se resolve com comando."

## SEVERIDADES
| Sev | Impacto | Response Time | Escalation |
|-----|---------|---------------|------------|
| SEV1 | Total outage | 5 min | Imediato |
| SEV2 | Major degradation | 15 min | 30 min |
| SEV3 | Minor impact | 1 hora | 4 horas |
| SEV4 | Low impact | 24 horas | Não |

## PROCESSO DE INCIDENTE
1. **Detect** - Identificar o problema
2. **Triage** - Classificar severidade
3. **Mobilize** - Montar equipe
4. **Mitigate** - Parar o sangramento
5. **Resolve** - Corrigir a causa
6. **Communicate** - Informar stakeholders
7. **Postmortem** - Aprender

## ROLES NO INCIDENTE
- **Incident Commander** - Coordena tudo
- **Tech Lead** - Decisões técnicas
- **Communicator** - Atualiza stakeholders
- **Scribe** - Documenta timeline

## CHECKLIST
- [ ] Runbooks atualizados?
- [ ] Escalation path definido?
- [ ] Comunicação template pronto?
- [ ] Postmortem process?
- [ ] On-call rotation?

## ANTI-PATTERNS
❌ **NUNCA** entre em pânico
❌ **NUNCA** faça mudanças sem documentar
❌ **NUNCA** culpe pessoas no postmortem
❌ **NUNCA** pule o postmortem
