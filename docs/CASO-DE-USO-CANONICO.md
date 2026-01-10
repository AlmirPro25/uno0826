# PROST-QS — Caso de Uso Canônico

**O que acontece quando um app se conecta ao PROST-QS**

---

## A História em 7 Dias

### Dia 0: Conexão

```
App: VOX-BRIDGE (video chat aleatório)
Evento: Integração com PROST-QS
Tempo: 15 minutos
```

O desenvolvedor:
1. Cria conta no PROST-QS
2. Registra o app, recebe API keys
3. Adiciona 3 linhas de código no backend:
   - `session.start` quando usuário conecta
   - `session.ping` a cada 30s
   - `session.end` quando desconecta

**Resultado imediato:** Dashboard mostra usuários online em tempo real.

---

### Dia 1-3: Observação Pura

```
Modo: Apenas telemetria
Ações: Nenhuma
Regras: Desativadas
```

O sistema coleta silenciosamente:
- Quantos usuários por hora
- Duração média de sessão
- Taxa de bounce (saiu em <30s)
- Horários de pico
- Distribuição geográfica

**O desenvolvedor não faz nada.** Só observa o dashboard.

Perguntas que o dashboard responde:
- "Quantos usuários tenho agora?" → 47 online
- "Qual horário tem mais gente?" → 21h-23h
- "De onde vêm?" → 60% Brasil, 15% Portugal
- "Quanto tempo ficam?" → Média 8 minutos

---

### Dia 4: Primeira Regra (Shadow Mode)

```
Modo: Shadow (simula sem executar)
Regra: "Se bounce_rate > 60%, criar alerta"
```

O desenvolvedor cria a primeira regra, mas em **shadow mode**.

O sistema:
- Avalia a condição a cada minuto
- Registra quando TERIA disparado
- Mostra no dashboard: "Esta regra teria disparado 3x hoje"
- Não executa nenhuma ação real

**Aprendizado:** O desenvolvedor descobre que bounce rate sobe às 14h (horário de almoço, usuários testam rápido e saem).

Ajuste: Muda threshold para 70% ou adiciona condição `AND online_now > 20`.

---

### Dia 5: Ativação Gradual

```
Modo: Produção (ações reais)
Regra: "Se bounce_rate > 70% AND online_now > 20, criar alerta"
Cooldown: 6 horas
```

A regra sai do shadow mode. Agora executa de verdade.

Primeiro alerta real chega:
```
🔔 Alerta: Bounce Rate Alto
   Severidade: warning
   Valor: 73%
   Horário: 22:15
   Ação: Nenhuma (apenas informativo)
```

O desenvolvedor olha o dashboard, vê o contexto, entende o padrão.

---

### Dia 6: Ação Consequente

```
Nova regra: "Se alerta não for reconhecido em 30min, escalar para critical"
Tipo: escalate
```

Agora o sistema não só alerta — ele **escala**.

Fluxo:
1. Bounce rate alto → alerta warning
2. 30 minutos sem acknowledge → alerta vira critical
3. Critical aparece em vermelho no dashboard

**O sistema está ensinando o desenvolvedor a prestar atenção.**

---

### Dia 7: Governança Visível

O desenvolvedor abre o painel de governança e vê:

```
Kill Switch: ⚪ Inativo
Shadow Mode: ⚪ Inativo
Ações pausadas: Nenhuma

Últimas 24h:
- 12 regras avaliadas
- 3 alertas criados
- 1 escalação
- 0 ações bloqueadas

Auditoria:
- Todas as ações registradas
- Nenhuma ação proibida tentada
```

**Confiança estabelecida.** O sistema faz o que promete, dentro dos limites.

---

## O Que o Desenvolvedor Ganhou

| Antes do PROST-QS | Depois do PROST-QS |
|-------------------|---------------------|
| "Quantos usuários tenho?" → Não sei | → 47 agora, pico às 22h |
| "O app está saudável?" → Acho que sim | → Bounce 45%, dentro do normal |
| "Algo está errado?" → Só descubro depois | → Alerta em 1 minuto |
| "Posso confiar na automação?" → Medo | → Shadow mode + kill switch |

---

## O Que o PROST-QS Provou

1. **Observação funciona** — Dados reais, não estimativas
2. **Decisão é explicável** — Regras declarativas, não caixa-preta
3. **Ação é controlada** — Políticas explícitas, auditoria completa
4. **Governança é visível** — Kill switch, shadow mode, autoridade

---

## Frase Final

> "Em 7 dias, o desenvolvedor passou de 'não sei o que está acontecendo' para 'sei exatamente o que está acontecendo e o sistema me avisa quando algo muda'."

Isso é o PROST-QS.

Não é analytics. Não é automação. É **consciência operacional com limites**.

---

*Documento criado em 10/01/2026*
*Propósito: Narrativa de produto para primeiro contato*
