# 🔐 PROST-QS INFRASTRUCTURE ACCESS KEYS & CHEAT SHEET
**Data:** 27 de Janeiro de 2026
**Confidencialidade:** CRÍTICA (Contém credenciais reais de produção)

---

## ☁️ 1. VM ORACLE (Kernel & Backend)
O "Cérebro" do sistema. Onde roda o container Docker `uno-api`.

- **Provedor:** Oracle Cloud Infrastructure (OCI)
- **IP Público:** `64.181.175.25`
- **Usuário SSH:** `ubuntu`
- **Chave SSH (Local):** `$env:USERPROFILE\.ssh\oracle_vm_key` (Windows)
- **Diretório App:** `/home/ubuntu/apps/uno0826/backend`
- **Arquivo de Config:** `/home/ubuntu/backend/.env`

### 🚀 Comando de Acesso Rápido (PowerShell)
```powershell
ssh -i "$env:USERPROFILE\.ssh\oracle_vm_key" -o StrictHostKeyChecking=no ubuntu@64.181.175.25
```

---

## 🗄️ 2. VM GOOGLE (Banco de Dados Principal)
A "Memória" do sistema. PostgreSQL Real.

- **Provedor:** Google Cloud Platform (GCP)
- **IP Público:** `136.113.71.36`
- **Porta:** `5432`
- **Database:** `prostqs`
- **Usuário:** `postgres`
- **Senha:** `prostqs_secure_pass`

### 🔌 String de Conexão (Production)
```env
DATABASE_URL=postgresql://postgres:prostqs_secure_pass@136.113.71.36:5432/prostqs?sslmode=disable
```

### ⚠️ Nota de Firewall
Para o Backend conectar aqui, o IP da Oracle (`64.181.175.25`) DEVE estar autorizado na aba "Connections > Networking" do Google Cloud SQL.

---

## 🛠️ 3. COMANDOS ÚTEIS (Backend Ops)
Rode estes comandos via SSH na VM Oracle.

### Ver Logs em Tempo Real
```bash
sudo docker logs -f --tail 100 uno-api
```

### Reiniciar Backend
```bash
sudo docker restart uno-api
```

### Alternar entre Banco LOCAL (SQLite) e REAL (Postgres)
Edite o arquivo `.env`:
```bash
nano /home/ubuntu/backend/.env
```

**Para usar SQLite (Contingência/Local):**
```env
SQLITE_DB_PATH=/app/data/prostqs.db
# DATABASE_URL=... (comentado)
```

**Para usar Google Cloud (Produção Real):**
```env
# SQLITE_DB_PATH=... (comentado)
DATABASE_URL=postgresql://postgres:prostqs_secure_pass@136.113.71.36:5432/prostqs?sslmode=disable
```

### Recriar Container (Reset de Fábrica)
Se der conflito de porta ou erro estranho, apague e recrie em modo `host`:
```bash
sudo docker rm -f uno-api
sudo docker run -d --name uno-api --restart always --network host --env-file /home/ubuntu/backend/.env -v /home/ubuntu/prostqs.db:/app/data/prostqs.db uno-backend /app/prost-qs-linux
```

---

## 👤 4. CREDENCIAIS DE APLICAÇÃO (Admin)
Usuário injetado via Emergency Script.

- **URL:** [https://prostqs.com.br](https://prostqs.com.br)
- **Login:** `almirroj@gmail.com`
- **Senha:** `415263456a` (ou seu hash padrão)
- **Role:** `super_admin`

---
*Documento gerado automaticamente por Antigravity. Mantenha seguro.*
