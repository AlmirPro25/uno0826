
# MANUAL DE IMPLANTAÇÃO (DEPLOYMENT)

Este documento descreve os procedimentos para implantar a Luxe Digital em ambiente de produção.

## 1. Requisitos do Servidor

*   **OS:** Ubuntu 20.04 LTS ou superior.
*   **Runtime:** Docker Engine 20.10+ & Docker Compose v2.
*   **Hardware:** 1 vCPU, 2GB RAM (Mínimo).

## 2. Deploy Manual (Via SSH)

Se não estiver usando a pipeline do GitHub Actions:

1.  Transfira os arquivos para o servidor:
    ```bash
    scp docker-compose.prod.yml user@server:/opt/luxe/
    scp -r docker/ user@server:/opt/luxe/
    ```

2.  Crie as variáveis de ambiente:
    ```bash
    cp .env.example .env
    # Edite conforme necessário
    ```

3.  Execute a orquestração:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```

## 3. Persistência de Dados

O banco de dados SQLite é persistido através do volume Docker `luxe_data`.
*   Local no Host: `/var/lib/docker/volumes/luxe_data/_data` (geralmente).
*   **Backup:** Para fazer backup, basta copiar o arquivo `luxe.db` dentro deste volume.

## 4. Monitoramento

Verifique os logs dos containers:
```bash
docker logs -f luxe_backend_prod
docker logs -f luxe_frontend_prod
```

## 5. Troubleshooting Comum

*   **Erro 502 Bad Gateway:** O container de Backend ainda não iniciou ou falhou. Verifique os logs do backend.
*   **Permissão negada (SQLite):** Certifique-se de que o usuário dentro do Docker tem permissão de escrita na pasta `/app/data`. O Dockerfile já trata isso, mas montagens de volume host podem sobrescrever permissões.
