# 📐 DEPLOY DE GUERRA: ARQUITETURA TRIÂNGULO

Este guia configura o Backend do PROST-QS para rodar no **Modo Triângulo**:
- **Velocidade**: SQLite Local para todas as leituras/escritas imediatas.
- **Verdade**: Sincronização Assíncrona para o Banco Central Neon (Postgres).
- **Resiliência**: Aplicações sobrevivem a partições de rede.

---

## 🏗️ Visão Geral da Arquitetura

```
       [VM ORACLE]                    [VM GOOGLE]
      (SQLite Local)                 (SQLite Local)
            │                              │
            │ (Sync Assíncrono)            │ (Sync Assíncrono)
            └──────────────► 🧠 ◄──────────┘
                        CÉREBRO CENTRAL
                       (Neon Postgres)
```

---

## 🔧 Configuração (Variáveis de Ambiente)

Aplique estas configurações tanto na **VM Oracle Cloud** quanto na **VM Google Cloud**.

### 1. Configuração do Banco de Dados
**Esta é a mágica que habilita o Triângulo.**

| Variável | Valor | Descrição |
|----------|-------|-------------|
| `DATABASE_URL` | *(Deixe Vazio)* | **CRÍTICO**: Força o backend a usar SQLite Local como DB principal. |
| `SQLITE_DB_PATH` | `/data/prostqs.db` | Caminho de armazenamento persistente na VM. |
| `SYNC_DATABASE_URL` | `postgres://<user>:<pass>@<host>/<dbname>?sslmode=require` | **NOVO**: Aponte para sua String de Conexão do Neon DB. |

### 2. Configuração do LocalStore
Habilita o motor de sincronização.

| Variável | Valor | Descrição |
|----------|-------|-------------|
| `LOCAL_STORE_ENABLED` | `true` | Ativa o módulo Local Store. |
| `LOCAL_STORE_PATH` | `/data/localstore.db` | DB separado para fila de sync (WAL). |
| `LOCAL_STORE_SYNC_INTERVAL` | `2s` | Sync agressivo para sensação de "Tempo Real". |
| `LOCAL_STORE_BATCH_SIZE` | `50` | Número de eventos por lote de sync. |

### 3. Identidade da Aplicação
Garanta que ambas as VMs compartilhem os mesmos secrets para gerar tokens válidos.

| Variável | Valor | Descrição |
|----------|-------|-------------|
| `JWT_SECRET` | *(Mesmo da Produção)* | Deve corresponder ao secret remoto/central. |
| `AES_SECRET_KEY` | *(Mesmo da Produção)* | Chave de 32 bytes para criptografia. |
| `SECRETS_MASTER_KEY` | *(Mesmo da Produção)* | Chave de 32 bytes para o cofre de Secrets. |

---

## 🚀 Como Funciona (Por Baixo do Capô)

1. **Escrita**: Quando ocorre um evento (ex: `session.start`), ele é gravado em `/data/prostqs.db` (rápido) E `/data/localstore.db` (fila).
2. **Servir**: Queries do Dashboard na VM leem de `/data/prostqs.db` (latência zero).
3. **Sync**: Um worker em background acorda a cada 2s, pega métricas do `localstore.db`, e empurra para `SYNC_DATABASE_URL` (Neon).
4. **Visão Central**: O Cérebro Central (Neon) recebe eventos da Oracle e da Google, dando uma visão unificada da guerra.

---

## 🛡️ Verificação

Para checar se o sync está funcionando:
1. Faça SSH na VM.
2. Verifique os logs: `docker logs prostqs-backend`
3. Procure por: `✅ Remote Sync DB conectado via SYNC_DATABASE_URL`
4. Procure por: `[LocalStore] X eventos sincronizados com sucesso`

---

## 📝 Exemplo de Arquivo `.env`

```bash
# Servidor
SERVER_PORT=8080
GIN_MODE=release

# Arq: Triângulo (SQLite Local + Sync Remoto)
# DATABASE_URL=  <-- COMENTADO PARA USAR SQLITE
SQLITE_DB_PATH=/data/prostqs.db
SYNC_DATABASE_URL=postgres://neondb_owner:*******@ep-morning-rain.sa-east-1.aws.neon.tech/neondb?sslmode=require

# Motor de Sync
LOCAL_STORE_ENABLED=true
LOCAL_STORE_PATH=/data/localstore.db
LOCAL_STORE_SYNC_INTERVAL=2s

# Identidade (DEVE COMBINAR COM CENTRAL)
JWT_SECRET=seu_jwt_secret_aqui
AES_SECRET_KEY=sua_chave_aes_32_bytes_aqui
SECRETS_MASTER_KEY=sua_chave_secrets_32_bytes_aqui

# CORS
ALLOWED_ORIGINS=https://prostqs.com.br,https://uno0826.onrender.com
```
