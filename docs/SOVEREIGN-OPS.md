# 🛡️ Sovereign Ops: Manual de Operação do Kernel

Este guia define os protocolos de intervenção humana no **Sovereign Agent Framework**.

## 🔴 Níveis de Resposta (DEFCON)

O sistema ajusta o DEFCON automaticamente via `PolicyAgent` baseado na pressão do `WarObs`, mas o operador pode intervir via **Sovereign Console**.

| Comando Terminal | Ação | Quando usar |
|------------------|------|-------------|
| `policy:defcon:set {"level": 5}` | Restaurar Ordem | Após resolver um incidente. |
| `policy:defcon:set {"level": 3}` | Ativar Blindagem | Sob suspeita de ataque ou carga anômala. |
| `policy:killswitch:activate` | **CONGELAR SISTEMA** | Violação crítica de integridade ou perda de controle. |

---

## 💸 Protocolo Comercial (Sales -> Billing)

O fluxo comercial é autônomo. O Kernel audita a transição de **Proposta Aceita** para **Assinatura Criada**.

1. **Auditoria:** Verifique no `Audit Stream` o evento `billing:subscription:create_from_proposal`.
2. **Traceability:** Cada venda gera um `TraceID` único que vincula a negociação ao faturamento no banco de dados.

---

## 🔍 Verificação de Integridade

O Kernel utiliza um **Integrity Hash Chain** (Blockchain-lite) em cada entrada de log.

- Se um log for deletado ou alterado diretamente no banco de dados, o próximo evento gerado terá um `previous_hash` inválido.
- O sistema detectará a quebra da corrente na próxima auditoria.

---

## 🛠️ Manutenção e Testes

Sempre que realizar alterações no Kernel ou nos Agentes, rode o verificador de sanidade:

```bash
cd backend
./bin/verify.exe
```

O verificador valida:
- [ ] Conectividade base.
- [ ] Fluxo de Vendas (End-to-End).
- [ ] Funcionamento do Kill Switch.
- [ ] **Capacidade de Recuperação (Break-glass bypass).**

---

**THE WATCHER IS ACTIVE. SYSTEM STATUS: SOVEREIGN.**
