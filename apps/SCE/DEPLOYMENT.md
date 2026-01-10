
# 🚢 Guia de Deploy em Produção

Este guia detalha o provisionamento do **Sovereign Cloud Engine** em um ambiente de produção endurecido.

## 1. Preparação do Servidor (Linux Ubuntu 22.04+)
Atualize o sistema e instale as dependências core:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose git-all -y
```

## 2. Configuração de DNS (O Super Domínio)
Para que o sistema de hospedagem ilimitada funcione, você deve configurar um registro **Wildcard DNS**:
- `A Record`: `*.seu-dominio.com` -> `IP_DO_SERVIDOR`
- `A Record`: `api.seu-dominio.com` -> `IP_DO_SERVIDOR`

## 3. Segurança do Host
Recomendamos o uso de UFW (Uncomplicated Firewall):
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 4. Deploy via Docker Compose Prod
1. Preencha o arquivo `.env` com chaves fortes.
2. Execute a orquestração:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 5. SSL Automático
O SCE utiliza internamente um container auxiliar de Traefik ou Nginx Proxy Manager (opcional) para gerenciar certificados Let's Encrypt. Certifique-se de que a porta 80 está aberta para o desafio ACME.
