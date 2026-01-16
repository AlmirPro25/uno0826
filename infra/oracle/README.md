# Oracle Cloud Infrastructure

Configurações do Kernel PROST-QS na Oracle Cloud (Always Free Tier).

## Servidor

- **IP**: `64.181.175.25`
- **SSH**: `ssh -i ~/.ssh/oracle_vm_key ubuntu@64.181.175.25`
- **API**: `https://api.prostqs.com.br`
- **Dashboard**: `https://prostqs.com.br`

## Comandos Úteis

```bash
# Conectar
ssh -i ~/.ssh/oracle_vm_key ubuntu@64.181.175.25

# Ver logs
sudo journalctl -u prostqs -f

# Reiniciar serviço
sudo systemctl restart prostqs

# Status
sudo systemctl status prostqs
```

## Estrutura

```
infra/oracle/
├── scripts/           # Scripts Python de provisionamento
│   ├── create_infra.py      # Criar VCN, subnet, security list
│   ├── launch_vm.py         # Lançar instância
│   ├── setup_vm_docker.py   # Instalar Docker
│   ├── deploy_backend.py    # Deploy do backend Go
│   └── ...                  # Outros scripts de manutenção
├── install.ps1        # Instalador OCI CLI (Oracle)
├── setup-oci.ps1      # Setup inicial OCI
└── README.md
```

## Custo

**Grátis** - Always Free Tier da Oracle Cloud
