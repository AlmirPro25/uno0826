# 🛸 UNO KERNEL - MANUAL DE OPERAÇÕES OCI

Este documento contém toda a configuração da infraestrutura de backend na Oracle Cloud Infrastructure (OCI). Ele foi projetado para permitir que qualquer desenvolvedor ou IA continue o trabalho de onde paramos.

---

## 🔑 1. Identidade e Autenticação (OCI CLI)
A infraestrutura é gerenciada via OCI CLI e SDK Python.

*   **User OCID:** `ocid1.user.oc1..aaaaaaaa7myh2ct5jswbcphesifdi7sk7g34pftbxhxotkdnw3wve4wx476q`
*   **Tenancy OCID:** `ocid1.tenancy.oc1..aaaaaaaaeak2g7unxk6sxl4dbamn67bdvv3gqyqvkmd5dcusfqezjx3fa42q`
*   **Região:** `sa-saopaulo-1` (São Paulo)
*   **Fingerprint API:** `6d:64:65:6b:ad:01:81:2a:2f:85:14:cd:0d:4d:d5:a9`
*   **Caminho Config Local:** `~/.oci/config`
*   **Chave Privada API:** `C:\Users\almir\.oci\oci_api_key.pem`

---

## 🖥️ 2. Arquitetura da VM (Virtual Machine)
Optamos pelo nível **Always Free** da Oracle para garantir custo zero com performance superior a planos básicos de PaaS (como Render/Railway).

*   **Instância:** `uno-backend` (OCID: `...tsdltq`)
*   **IP Público:** `64.181.175.25`
*   **Usuário SSH:** `ubuntu`
*   **Chave SSH Privada:** `C:\Users\almir\.ssh\oracle_vm_key`
*   **Shape:** `VM.Standard.E2.1.Micro` (AMD - Always Free)
*   **OS:** `Ubuntu 22.04 LTS`
*   **Recursos:** 1 OCPU / 1GB RAM / 2GB Swap (ativado manualmente).

---

## 🌐 3. Rede e Segurança (VCN)
Configuramos uma **Virtual Cloud Network (VCN)** dedicada para o projeto.

*   **VCN Name:** `uno-vcn`
*   **Subnet:** `uno-public-subnet` (Pública)
*   **Portas Abertas (Ingress):**
    *   `22` (SSH)
    *   `80` (HTTP)
    *   `443` (HTTPS)
    *   `8080` (Backend API)
    *   `3000-5000` (Dev/Test)

---

## 🚀 4. Fluxo de Deploy (Estratégia Turbo)
Devido à memória limitada da VM Micro (1GB), usamos uma estratégia de **Build Local**:

1.  **Compilação:** O código Go é compilado no Windows configurado para Linux (`$env:GOOS="linux"; $env:GOARCH="amd64"`).
2.  **Transporte:** O binário já pronto (`prost-qs-linux`) e o arquivo `.env` são enviados via SFTP (Paramiko).
3.  **Containerização Lite:** Na VM, criamos uma imagem Docker ultra-leve (baseada em Alpine) que apenas executa o binário pronto, sem compilar nada no servidor.
4.  **Persistência:** O banco de dados SQLite fica em um volume montado em `/home/ubuntu/backend/data`.

---

## 🛠️ 5. Comandos de Manutenção

### Acessar a VM via terminal:
```powershell
ssh -i "C:\Users\almir\.ssh\oracle_vm_key" ubuntu@64.181.175.25
```

### Ver Logs do Backend:
```bash
docker logs -f uno-api
```

### Reiniciar o Backend:
```bash
docker restart uno-api
```

---

## 🎯 6. Por que VM Oracle vs Render?
*   **Custo:** Render custa $5/mês por uma instância básica. Oracle é **Gratuito para sempre**.
*   **Controle:** Na VM temos acesso Root, podemos configurar Swap, Docker e múltiplos serviços.
*   **Performance:** A rede da Oracle em São Paulo oferece menor latência para usuários brasileiros.

---

## 📂 7. Scripts de Automação Locais
Na raiz do projeto (`d:\DEV\Desktop\UNO-main`), existem os seguintes utilitários:
*   `deploy_final.py`: Realiza o build local e deploy na nuvem.
*   `fix_firewall.py`: Reabre as portas caso o firewall do Ubuntu resetar.
*   `enable_swap.py`: Garante que a VM tenha memória virtual para não travar.
