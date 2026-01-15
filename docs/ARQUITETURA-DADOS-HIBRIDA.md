# Arquitetura de Dados Híbrida: SQLite Local + PostgreSQL Remoto

## Visão Geral

O PROST-QS implementa uma arquitetura de dados híbrida chamada **"Local-First with Remote Sync"**, combinando a velocidade do SQLite local com a durabilidade do PostgreSQL (Neon) na nuvem.

```
┌─────────────────────────────────────────────────────────────────┐
│                        PROST-QS KERNEL                          │
│                                                                 │
│   ┌─────────────┐                                               │
│   │   Request   │                                               │
│   └──────┬──────┘                                               │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────┐     ┌─────────────────────────────────────┐  │
│   │   Handler   │────►│         LocalStore (SQLite)         │  │
│   └─────────────┘     │                                     │  │
│                       │  • Escrita instantânea (2-5ms)      │  │
│                       │  • Arquivo local no servidor        │  │
│                       │  • Dados de telemetria/audit/logs   │  │
│                       └──────────────┬──────────────────────┘  │
│                                      │                          │
│                                      │ Background Sync          │
│                                      │ (a cada 5 segundos)      │
│                                      │                          │
│                                      ▼                          │
│                       ┌─────────────────────────────────────┐  │
│                       │      PostgreSQL (Neon Cloud)        │  │
│                       │                                     │  │
│                       │  • Dados persistentes               │  │
│                       │  • Source of truth                  │  │
│                       │  • Queries complexas                │  │
│                       └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Por Que Essa Arquitetura?

### O Problema
Operações de escrita no PostgreSQL remoto (Neon) têm latência de 50-100ms devido à rede. Para dados de alta frequência como telemetria, isso cria gargalos.

### A Solução
Gravar primeiro no SQLite local (2-5ms) e sincronizar em background com o Neon.

### Comparação de Performance

| Operação | Só PostgreSQL | SQLite + Sync |
|----------|---------------|---------------|
| Gravar telemetria | 50-100ms | **2-5ms** |
| Gravar audit log | 50-100ms | **2-5ms** |
| Gravar evento | 50-100ms | **2-5ms** |
| Throughput | ~100 ops/s | **~5000 ops/s** |

## Empresas que Usam Esse Padrão

| Empresa | Implementação |
|---------|---------------|
| **Linear** | SQLite local + sync para cloud |
| **Figma** | Cache local + sync em tempo real |
| **Notion** | Local-first com sync eventual |
| **Obsidian** | Arquivos locais + sync opcional |
| **Cloudflare D1** | SQLite distribuído globalmente |
| **Turso** | SQLite replicado na edge |

## Arquitetura Detalhada

### Camadas do Sistema

```
┌────────────────────────────────────────────────────────────────┐
│                      CAMADA DE APLICAÇÃO                       │
│                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │Telemetry │  │  Audit   │  │  Events  │  │   Logs   │       │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
│       │             │             │             │              │
│       └─────────────┴──────┬──────┴─────────────┘              │
│                            │                                   │
│                            ▼                                   │
├────────────────────────────────────────────────────────────────┤
│                    CAMADA DE ABSTRAÇÃO                         │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   LocalStore Provider                    │  │
│  │                                                          │  │
│  │  • Decide onde gravar (local vs remoto)                 │  │
│  │  • Gerencia conexões                                    │  │
│  │  • Controla sync                                        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                   │
├────────────────────────────┼───────────────────────────────────┤
│                            │                                   │
│         ┌──────────────────┴──────────────────┐               │
│         │                                      │               │
│         ▼                                      ▼               │
│  ┌─────────────────┐                ┌─────────────────┐       │
│  │  SQLite Local   │                │  PostgreSQL     │       │
│  │                 │   ──────────►  │  (Neon Cloud)   │       │
│  │  /data/local.db │   Background   │                 │       │
│  │                 │     Sync       │  prostqs-prod   │       │
│  └─────────────────┘                └─────────────────┘       │
│                                                                │
│        ESCRITA RÁPIDA                    PERSISTÊNCIA          │
│        (2-5ms)                           DURÁVEL               │
└────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
1. REQUEST CHEGA
   │
   ▼
2. HANDLER PROCESSA
   │
   ▼
3. LOCALSTORE RECEBE ────────────────────────────────────┐
   │                                                      │
   ▼                                                      │
4. GRAVA NO SQLITE LOCAL                                  │
   │  • Latência: 2-5ms                                   │
   │  • Status: "pending_sync"                            │
   │                                                      │
   ▼                                                      │
5. RETORNA SUCESSO AO CLIENTE                             │
   (request completo!)                                    │
                                                          │
   ════════════════════════════════════════════════════   │
   BACKGROUND (assíncrono)                                │
   ════════════════════════════════════════════════════   │
                                                          │
6. SYNC WORKER (a cada 5s) ◄──────────────────────────────┘
   │
   ▼
7. LÊ EVENTOS "pending_sync"
   │
   ▼
8. ENVIA BATCH PARA NEON
   │  • Batch de 100 eventos
   │  • Retry automático em falha
   │
   ▼
9. MARCA COMO "synced" NO SQLITE
```

## Implementação no PROST-QS

### Estrutura de Arquivos

```
backend/pkg/localstore/
├── store.go              # Core do SQLite local
├── provider.go           # Gerencia conexões e decisões
├── init.go               # Inicialização e migrations
├── telemetry_adapter.go  # Adapta telemetria pro local
├── telemetry_wrapper.go  # Wrapper com sync automático
├── handler.go            # Endpoints de status/debug
└── store_test.go         # Testes
```

### Configuração

```env
# .env
LOCAL_STORE_ENABLED=true
LOCAL_STORE_PATH=/data/localstore.db
LOCAL_STORE_SYNC_INTERVAL=5s
LOCAL_STORE_BATCH_SIZE=100
LOCAL_STORE_MAX_RETRIES=5
```

### Schema do SQLite Local

```sql
-- Tabela de eventos locais
CREATE TABLE local_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_status TEXT DEFAULT 'pending',
    sync_attempts INTEGER DEFAULT 0,
    synced_at TIMESTAMP,
    error_message TEXT
);

-- Índices para performance
CREATE INDEX idx_local_events_sync_status ON local_events(sync_status);
CREATE INDEX idx_local_events_created_at ON local_events(created_at);
```

## Tipos de Dados por Destino

### SQLite Local (Alta Frequência)
- Telemetria de sessões
- Logs de auditoria
- Métricas de performance
- Eventos de tracking
- Execuções de regras

### PostgreSQL Direto (Dados Críticos)
- Usuários e identidades
- Configurações de apps
- Secrets e credenciais
- Billing e pagamentos
- Dados transacionais

## Garantias do Sistema

### Consistência Eventual
Os dados no SQLite local eventualmente chegam ao Neon. O tempo máximo de atraso é configurável (padrão: 5 segundos).

### Durabilidade
- SQLite usa WAL mode para durabilidade local
- Neon tem backups automáticos
- Retry automático em falhas de sync

### Ordenação
Eventos são sincronizados na ordem de criação (FIFO).

## Cenários de Falha

### Neon Indisponível
```
┌─────────────────────────────────────────────────────────┐
│  NEON OFFLINE                                           │
│                                                         │
│  1. Escritas continuam no SQLite local ✓                │
│  2. Sync worker detecta falha                           │
│  3. Eventos acumulam com status "pending"               │
│  4. Quando Neon volta, sync resume automaticamente      │
│  5. Backlog é processado em batches                     │
└─────────────────────────────────────────────────────────┘
```

### Servidor Reinicia
```
┌─────────────────────────────────────────────────────────┐
│  SERVIDOR REINICIA                                      │
│                                                         │
│  1. SQLite persiste em disco ✓                          │
│  2. Na inicialização, LocalStore carrega                │
│  3. Eventos "pending" são re-sincronizados              │
│  4. Nenhum dado perdido                                 │
└─────────────────────────────────────────────────────────┘
```

## Métricas e Monitoramento

### Endpoints de Status

```
GET /api/v1/localstore/status
```

Resposta:
```json
{
  "enabled": true,
  "sqlite_path": "/data/localstore.db",
  "pending_events": 42,
  "synced_events": 15847,
  "failed_events": 0,
  "last_sync": "2026-01-15T10:30:00Z",
  "sync_interval": "5s"
}
```

### Métricas Prometheus

```
# Eventos pendentes de sync
localstore_pending_events_total

# Latência de escrita local
localstore_write_duration_seconds

# Taxa de sync
localstore_sync_rate_per_second

# Erros de sync
localstore_sync_errors_total
```

## Quando Usar Cada Abordagem

### Use LocalStore Para:
- ✅ Dados de alta frequência (>100 ops/s)
- ✅ Telemetria e métricas
- ✅ Logs e auditoria
- ✅ Dados que podem ter delay de segundos

### Use PostgreSQL Direto Para:
- ✅ Dados transacionais críticos
- ✅ Autenticação e autorização
- ✅ Billing e pagamentos
- ✅ Dados que precisam de consistência imediata

## Evolução Futura

### Fase 1 (Atual)
SQLite local + Neon remoto

### Fase 2 (Planejado)
```
┌─────────────────────────────────────────────────────────┐
│  MULTI-REGIÃO                                           │
│                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐            │
│  │ US-East │    │ EU-West │    │ SA-East │            │
│  │ SQLite  │    │ SQLite  │    │ SQLite  │            │
│  └────┬────┘    └────┬────┘    └────┬────┘            │
│       │              │              │                  │
│       └──────────────┼──────────────┘                  │
│                      │                                 │
│                      ▼                                 │
│              ┌─────────────┐                           │
│              │ Neon Global │                           │
│              └─────────────┘                           │
└─────────────────────────────────────────────────────────┘
```

### Fase 3 (Futuro)
Turso/LiteFS para SQLite distribuído globalmente.

## Conclusão

A arquitetura híbrida SQLite + PostgreSQL oferece:

1. **Performance** - Escritas 10-50x mais rápidas
2. **Resiliência** - Sistema funciona mesmo com Neon offline
3. **Custo** - Menos requests = menos $ no Neon
4. **Escalabilidade** - Cada instância tem seu cache local

Esta é a mesma arquitetura usada por empresas como Linear, Figma e Notion para escalar seus produtos.
