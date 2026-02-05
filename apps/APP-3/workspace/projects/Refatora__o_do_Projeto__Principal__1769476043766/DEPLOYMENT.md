
# MANUAL DE OPERAÇÕES DE CAMPO: DEPLOY

## 1. Topologia de Servidor
O sistema Aerosphere foi projetado para rodar em clusters de computação de borda (Edge Computing) situados em bunkers subterrâneos.
- **OS:** Linux (Alpine ou Debian Slim)
- **Recursos Mínimos:** 1 vCPU, 512MB RAM (Graças à eficiência do SQLite).

## 2. Implantação Zero-Downtime
Não podemos parar a produção de oxigênio para um update.
Utilize a estratégia **Blue/Green** ou **Rolling Update** via Docker Swarm/K8s se disponível.

Para deploy simples via `docker-compose`:
1. Puxe as novas imagens: `docker-compose -f docker-compose.prod.yml pull`
2. Reinicie: `docker-compose -f docker-compose.prod.yml up -d`

## 3. Gestão de Dados (Persistência)
O arquivo `aerosphere_core.db` é o coração do sistema.
- **Backup:** Rotina diária de snapshot do arquivo `.db` para armazenamento frio (off-site/Terra).
- **Recuperação:** Em caso de corrupção, restaure o último snapshot e aplique os logs binários.

## 4. Variáveis de Ambiente (Segredos)
Em produção, injete:
- `JWT_SECRET`: Chave 256-bit gerada quanticamente.
- `NODE_ENV`: "production".

## 5. Procedimento de Emergência (Fail-Safe)
Se o sistema travar:
1. Acesse o terminal via SSH.
2. Execute `./scripts/emergency-flush.sh` (Reseta conexões).
3. Verifique logs: `docker logs aerosphere-backend --tail 100`.
