# SCE Infrastructure

Configurações de deploy do SCE (Sovereign Cloud Engine) na Google Cloud.

## Servidor

- **IP**: `34.95.249.26`
- **SSH**: `ssh -i ~/.ssh/gcloud_sce_key ubuntu@34.95.249.26`
- **Projeto GCP**: `prostqs-kernel`
- **Região**: `southamerica-east1-a`
- **Máquina**: `e2-standard-2` (2 vCPU, 8GB RAM, 50GB SSD)

## Estrutura

```
infra/sce/
├── docker-compose.yml   # Orquestração dos containers
├── traefik.yml          # Configuração do reverse proxy
├── .env.example         # Template de variáveis de ambiente
├── deploy.sh            # Script de deploy automatizado
├── setup_sce_vm.sh      # Setup inicial da VM
└── README.md
```

## Deploy

```bash
# Dar permissão de execução
chmod +x deploy.sh

# Executar deploy
./deploy.sh
```

## Comandos Úteis

```bash
# Conectar no servidor
ssh -i ~/.ssh/gcloud_sce_key ubuntu@34.95.249.26

# Ver status
cd ~/sce && sudo docker-compose ps

# Ver logs
sudo docker-compose logs -f sce-backend
sudo docker-compose logs -f sce-frontend

# Reiniciar
sudo docker-compose down && sudo docker-compose up -d
```

## DNS Necessário

Configurar no provedor de domínio:

| Registro | Tipo | Valor |
|----------|------|-------|
| `sce.prostqs.com.br` | A | `34.95.249.26` |
| `api.sce.prostqs.com.br` | A | `34.95.249.26` |
| `traefik.sce.prostqs.com.br` | A | `34.95.249.26` |
