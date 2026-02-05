
# MANUAL DE OPERAÇÕES DE DEPLOY (SOP-500)
**Autor:** Aurelius
**Classificação:** CONFIDENTIAL

## Pré-requisitos de Servidor (VPS)
O servidor de destino deve atender aos seguintes critérios mínimos:
- **CPU:** 2 vCPU (Recomendado para cálculos de rota)
- **RAM:** 4GB (Node.js Heap + Prisma Query Engine)
- **OS:** Ubuntu 22.04 LTS
- **Engine:** Docker 24.0+ & Docker Compose v2

## Procedimento de Instalação (Cold Start)

1. **Preparação do Ambiente:**
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose-plugin -y
   mkdir -p /opt/titan-logistics
   mkdir -p /opt/titan-logistics/data
   ```

2. **Transferência de Configuração:**
   Copie `docker-compose.prod.yml` e `.env` (produção) para `/opt/titan-logistics`.

3. **Configuração de Variáveis:**
   Crie o arquivo `.env` com chaves de criptografia de nível militar:
   ```env
   JWT_SECRET=super_secure_random_string_here_x99
   NODE_ENV=production
   ```

4. **Inicialização:**
   ```bash
   cd /opt/titan-logistics
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Monitoramento
Para verificar a saúde da frota digital:
```bash
docker logs -f titan_backend_prod
```
