
# AI Web Weaver: Guia de Implantação para Produção

Este documento detalha o processo de implantação do sistema fullstack AI Web Weaver em um ambiente de produção usando Docker e Docker Compose, alinhado com as melhores práticas de segurança e escalabilidade.

## 1. Visão Geral da Implantação
O AI Web Weaver é um aplicativo conteinerizado que pode ser implantado em qualquer servidor que suporte Docker e Docker Compose. A implantação seguirá os passos de:
1.  Preparação do servidor.
2.  Configuração de variáveis de ambiente seguras.
3.  Utilização do `docker-compose.prod.yml` para orquestrar os serviços.
4.  Configuração de um proxy reverso (como Nginx) para SSL/TLS e roteamento.
5.  Configuração de firewall e monitoramento.

## 2. Pré-requisitos do Servidor de Produção
Antes de iniciar, certifique-se de que seu servidor de produção atenda aos seguintes requisitos:

*   **Sistema Operacional:** Linux (Ubuntu Server, CentOS, Debian recomendados).
*   **Recursos:** Mínimo de 2 vCPUs, 4GB RAM (recomendado: 4 vCPUs, 8GB RAM para um início).
*   **Docker:** Instalado e configurado.
*   **Docker Compose:** Instalado (plugin ou binário).
*   **Domínio:** Um domínio registrado (ex: `aiwebweaver.com`) e configurado para apontar para o IP do seu servidor.
*   **SSH Key:** Acesso SSH com chave privada para o servidor (para automação CI/CD).
*   **Firewall:** Ferramenta de firewall (ex: UFW, `firewalld`) configurada.

## 3. Configuração de Variáveis de Ambiente Seguras
Em produção, variáveis de ambiente devem ser gerenciadas com segurança. Utilizaremos um arquivo `.env.prod` referenciado pelo `docker-compose.prod.yml`. Este arquivo NÃO DEVE ser versionado no Git.

Crie um arquivo `.env.prod` no diretório raiz do projeto no seu servidor:

```env
#
