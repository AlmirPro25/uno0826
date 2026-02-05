
# 🚀 Protocolo de Implantação (Deployment Protocol)

Este documento descreve os procedimentos operacionais padrão para colocar o **Ghost Protocol** em ambiente hostil (Produção).

## 📋 Pré-requisitos
- Servidor VPS (Ubuntu 20.04+ recomendado) com pelo menos 2GB RAM.
- Docker & Docker Compose instalados.
- Domínio configurado (A Record apontando para o IP do VPS).

## 🛠️ Instalação Rápida (Quickstart)

1. **Clone o Repositório no Servidor**
   ```bash
   git clone https://github.com/seu-repo/ghost-protocol.git /opt/ghost-protocol
   cd /opt/ghost-protocol
   ```

2. **Configuração de Ambiente**
   ```bash
   cp .env.example .env
   # Edite as chaves (Gemini API Key é crítica)
   nano .env
   ```

3. **Inicialização dos Containers**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. **Verificação de Saúde**
   ```bash
   docker ps
   # Verifique logs se algo falhar
   docker logs ghost_brain_prod -f
   ```

## 🔄 Pipeline de Atualização (CI/CD)

O sistema utiliza GitHub Actions para deploy contínuo.
Para disparar um deploy automático:
1. Crie uma **Tag** no formato `v1.x.x`.
2. O pipeline fará build das imagens Docker.
3. O pipeline enviará comandos via SSH para o servidor atualizar os containers.

**Secrets necessários no GitHub:**
- `HOST`: IP do servidor.
- `USERNAME`: Usuário SSH (root/ubuntu).
- `SSH_KEY`: Chave privada SSH.
- `GEMINI_API_KEY`: Para injeção no build (opcional).

## ⚠️ Recuperação de Desastres

**Cenário: Sessão do WhatsApp Quebrada**
Se o "Kernel" travar ou desconectar:
1. Acesse o dashboard.
2. Se o QR Code aparecer, leia novamente.
3. Se falhar, reinicie o container backend para limpar sessão corrompida:
   ```bash
   docker restart ghost_brain_prod
   ```
