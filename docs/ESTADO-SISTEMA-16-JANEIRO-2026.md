# Estado do Sistema — 16 Janeiro 2026

## 🎉 MARCO: SCE Totalmente Operacional

Hoje completamos a integração completa do SCE (Sovereign Cloud Engine) com o Kernel ProstQS. O sistema está 100% funcional e já hospedou o primeiro app de teste com sucesso.

---

## Infraestrutura Ativa

### Kernel (Oracle Cloud)
| Item | Valor |
|------|-------|
| IP | `64.181.175.25` |
| URL API | `https://api.prostqs.com.br` |
| Health | ✅ Operacional |
| SSH | `ssh -i ~/.ssh/oracle_vm_key ubuntu@64.181.175.25` |

### SCE (Google Cloud)
| Item | Valor |
|------|-------|
| IP | `34.95.249.26` |
| Região | `southamerica-east1-a` |
| Máquina | `e2-standard-2` (2 vCPU, 8GB RAM, 50GB SSD) |
| SSH | `ssh -i ~/.ssh/gcloud_sce_key ubuntu@34.95.249.26` |

---

## URLs Funcionais

| Serviço | URL | Status |
|---------|-----|--------|
| SCE Frontend | https://sce.prostqs.com.br | ✅ Online |
| SCE API | https://api.sce.prostqs.com.br/api/v1/health | ✅ Online |
| Traefik Dashboard | https://traefik.sce.prostqs.com.br | ✅ Online |
| Kernel API | https://api.prostqs.com.br/health | ✅ Online |
| **App Deployado** | https://hello-docker.sce.prostqs.com.br | ✅ Online |

---

## Containers Rodando no SCE

```
NAMES          STATUS
hello-docker   Up (healthy)
sce-backend    Up (healthy)
sce-frontend   Up (healthy)
traefik        Up
```

---

## O Que Foi Feito Hoje

### 1. Correção de CORS no SCE Backend
- Arquivo: `apps/SCE/backend/src/index.ts`
- Adicionado suporte a múltiplas origens (localhost, sce.prostqs.com.br)

### 2. Correção de JWT Secret
- **Problema**: SCE usava `sce-jwt-secret-2026`, Kernel usa outro secret
- **Solução**: Atualizado `.env` no servidor com `PROST_QS_JWT_SECRET=yca5Hlfdsos1u7rxKXFDQTqDN1dMMBd8CsMXyR7i0v4`

### 3. Fix do Healthcheck do Container
- **Problema**: `localhost` não resolvia (IPv6)
- **Solução**: Alterado para `127.0.0.1` no healthcheck

### 4. Criação de Script de Deploy Manual
- Arquivo: `infra/sce/start-backend.sh`
- Necessário porque docker-compose 1.29.2 tem bug com Docker mais novo

### 5. Primeiro Deploy de App no SCE
- **App**: `docker/welcome-to-docker`
- **Subdomain**: `hello-docker`
- **URL**: https://hello-docker.sce.prostqs.com.br
- **Status**: ✅ Funcionando com SSL

### 6. Configuração DNS no Cloudflare
Registros criados:
```
hello-docker.sce  A  34.95.249.26  (DNS only)
sce               A  34.95.249.26  (DNS only)
api.sce           A  34.95.249.26  (DNS only)
traefik.sce       A  34.95.249.26  (DNS only)
```

### 7. Fix das Labels do Traefik
- **Problema**: Backticks não eram escapados corretamente via shell
- **Solução**: Criado script bash no servidor para recriar container com labels corretas

---

## Credenciais de Acesso

### Login SCE/Kernel
- **Email**: `almir@prostqs.com.br`
- **Senha**: `ProstQS@2026!`
- **Role**: `super_admin`

### App ID do SCE no Kernel
- **UUID**: `011c6e88-9556-43ff-ad4e-27e20a5f5ea5`

---

## Arquivos Importantes Modificados

| Arquivo | Descrição |
|---------|-----------|
| `apps/SCE/backend/src/index.ts` | CORS multi-origin |
| `apps/SCE/backend/src/middleware/kernel-auth.middleware.ts` | Validação JWT |
| `infra/sce/start-backend.sh` | Script deploy manual |
| `apps/SCE/backend/src/services/docker.service.ts` | Labels Traefik |
| `backend/cmd/api/main.go` | CORS do Kernel (SCE origins) |

---

## Fluxo de Deploy Testado

```
1. Login via Kernel → Token JWT
2. Criar projeto no SCE → POST /api/v1/projects
3. Trigger deploy → POST /api/v1/projects/:id/deploy
4. SCE clona repo, builda imagem, cria container
5. Traefik detecta container, gera SSL via Let's Encrypt
6. App disponível em https://{subdomain}.sce.prostqs.com.br
```

---

## Problemas Conhecidos

### 1. docker-compose 1.29.2 Bug
- **Erro**: `KeyError: 'ContainerConfig'`
- **Workaround**: Usar comandos docker manuais ou script `start-backend.sh`

### 2. Labels Traefik via Shell
- Backticks precisam de escape especial quando passados via SSH
- Solução: criar script .sh no servidor

---

## Próximos Passos

1. [ ] Configurar wildcard DNS `*.sce.prostqs.com.br` para novos apps
2. [ ] Implementar auto-criação de DNS via Cloudflare API
3. [ ] Adicionar monitoramento (Uptime Robot)
4. [ ] Backup automático do SQLite
5. [ ] Deploy de um app real (APP-7 ou APP-8)

---

## Comandos Úteis

```powershell
# Status dos containers
ssh -i "$env:USERPROFILE\.ssh\gcloud_sce_key" ubuntu@34.95.249.26 "docker ps"

# Logs do backend
ssh -i "$env:USERPROFILE\.ssh\gcloud_sce_key" ubuntu@34.95.249.26 "docker logs sce-backend --tail 50"

# Logs do Traefik
ssh -i "$env:USERPROFILE\.ssh\gcloud_sce_key" ubuntu@34.95.249.26 "docker logs traefik --tail 50"

# Reiniciar container
ssh -i "$env:USERPROFILE\.ssh\gcloud_sce_key" ubuntu@34.95.249.26 "docker restart sce-backend"

# Ver apps deployados
ssh -i "$env:USERPROFILE\.ssh\gcloud_sce_key" ubuntu@34.95.249.26 "docker ps --filter network=sce-network"
```

---

*Documentação gerada em 16/01/2026 às 15:50 BRT*
