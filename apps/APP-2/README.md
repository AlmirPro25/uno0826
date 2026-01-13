
# Nexus Sovereign Mesh Network (NSMN) - Forja Ativada

**STATUS:** Materializando o Manifesto Nexus II.
**ARQUITETO:** NEXUS PRIME ARCHITECT.

Este projeto é a implementação da visão do Nexus II: uma rede de malha soberana, resistente à censura e focada na privacidade, onde a identidade é matemática e os dados pertencem unicamente ao usuário. A infraestrutura centralizada foi erradicada.

## ⚙️ Stack Tecnológico

*   **Backend (Go):**
    *   `go-libp2p`: Núcleo da rede de malha (P2P Host, mDNS, Kademlia DHT, GossipSub).
    *   `Pion WebRTC`: Túneis UDP diretos para comunicação de mídia em tempo real.
    *   `SQLite` com `SQLCipher`: Banco de dados local criptografado para persistência soberana.
    *   `X25519`: Identidades baseadas em chaves privadas criptografadas.
    *   `Gorilla WebSocket`: API local para comunicação em tempo real com o frontend.
*   **Frontend (Web UI):**
    *   `React 18+` (com Vite): Framework para a interface tática.
    *   `TypeScript`: Tipagem rigorosa para confiabilidade.
    *   `Tailwind CSS`: Estilização Cyberpunk-Industrial.
    *   `Zustand`: Gerenciamento de estado otimizado.
    *   `Shadcn/UI`: Componentes de UI minimalistas e modulares.
*   **Infraestrutura:**
    *   `Docker Compose`: Orquestração de ambientes.
    *   `Nginx`: Servidor web para o frontend, atuando como proxy reverso para a API local do nó Go.

## 🚀 Como Executar o Nexus Node

### Pré-requisitos

*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)
*   Git

### Passos de Execução

1.  **Clone o Repositório:**
    ```bash
    git clone https://github.com/nexus-sovereign-mesh/nexus-nsmn.git
    cd nexus-nsmn
    ```

2.  **Configurar Variáveis de Ambiente:**
    Crie um arquivo `.env` na raiz do projeto (mesmo nível de `docker-compose.yml`) com base no `.env.example`. **É CRÍTICO alterar as senhas padrão** para a identidade e o banco de dados.

    ```bash
    cp .env.example .env
    # Edite o .env com suas senhas seguras
    ```
    **Exemplo de `.env` (com senhas alteradas):**
    ```ini
    NEXUS_API_PORT=8080
    NEXUS_P2P_PORT=4001
    NEXUS_IDENTITY_FILE=nexus_identity.key
    NEXUS_IDENTITY_PASSPHRASE="minha-senha-secreta-de-identidade-unica-123"
    NEXUS_DATABASE_PATH=nexus_data.db
    NEXUS_DATABASE_PASSPHRASE="minha-senha-secreta-do-banco-de-dados-unica-456"
    NEXUS_ENABLE_MDNS=true
    NEXUS_DHT_CLIENT_ONLY=false
    NEXUS_ENABLE_WEBRTC=true
    # NEXUS_BOOTSTRAP_PEERS="/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bpjYzQVPdVWK8VqNRxGSb2KBCz2amWkLHPMWJ"
    # NEXUS_STUN_SERVERS="stun.l.google.com:19302,stun1.l.google.com:19302"
    ```

3.  **Iniciar a Rede (Desenvolvimento):**
    Construa e inicie os containers Docker:
    ```bash
    docker-compose up --build -d
    ```
    Isso iniciará o daemon Go (`nexusd`) e o servidor Nginx para o frontend. A primeira compilação pode levar alguns minutos.

4.  **Acessar a Interface do Usuário:**
    Abra seu navegador e navegue para:
    ```
    http://localhost:3000
    ```
    Você verá o "Tactical Dashboard" do Nexus.

5.  **Testando a Malha:**
    Para ver a malha em ação, você pode iniciar múltiplas instâncias do Nexus Node. Cada `docker-compose up` criará um novo nó.
    Por exemplo, para um segundo nó em portas diferentes:
    ```bash
    # Primeiro nó já está rodando
    # Pare o primeiro nó para iniciar um segundo na mesma máquina com portas diferentes
    # Ou use um segundo docker-compose.yml com diferentes nomes de serviço e portas.
    # Ex: docker-compose -f docker-compose-node2.yml up --build -d
    ```
    *   **mDNS (LAN):** Se você tiver dois computadores na mesma rede local, cada um com seu próprio container `nexusd` rodando, eles se descobrirão automaticamente via mDNS.
    *   **DHT (WAN):** Para descoberta global, os nós usarão a Kademlia DHT, conectando-se a peers de bootstrap para entrar na rede global. A Latência e os Peers Conectados serão visíveis no dashboard.

6.  **Parar a Rede:**
    Para parar e remover os containers:
    ```bash
    docker-compose down
    ```
    Para remover também os volumes persistentes (dados de identidade e DB):
    ```bash
    docker-compose down -v
    ```

## 🔐 Princípios de Segurança

*   **Identidade Soberana:** Suas chaves X25519 são geradas e armazenadas localmente, protegidas por senha. Ninguém além de você detém sua identidade.
*   **Criptografia em Repouso:** O banco de dados SQLite é criptografado com SQLCipher usando uma senha robusta.
*   **Criptografia em Trânsito:** Toda a comunicação P2P via `go-libp2p` é criptografada de ponta a ponta (TLS/Noise). A comunicação WebRTC utiliza criptografia DTLS/SRTP.
*   **Nenhum Ponto Único de Falha:** Não há servidores centrais de autenticação, bancos de dados na nuvem ou serviços de fila. Cada nó é autossuficiente.
*   **Aviso sobre E2EE em Chat:** A implementação atual de chat usa o GossipSub com um placeholder para o payload criptografado. Para E2EE de chat *aplicativo*, a lógica de criptografia e descriptografia via `identity.GenerateSharedSecret`, `EncryptMessage`, `DecryptMessage` precisaria ser robusta e implementada usando o protocolo Noise sobre os streams libp2p. A criptografia de transporte do libp2p já garante a segurança de rede, mas a E2EE de aplicação oferece uma camada extra.

## 🚧 Próximos Passos e Melhorias

*   **Implementação Completa de E2EE para Chat:** Aprimorar o módulo `identity` para um handshake Noise protocol adequado sobre streams libp2p para E2EE de chat.
*   **Integração WebRTC Total:** Implementar captura de áudio/vídeo real do navegador e renderização de streams recebidos.
*   **Gerenciamento de Identidades:** Adicionar funcionalidade para o usuário importar/exportar chaves, criar pseudônimos.
*   **Persistência de Mensagens:** Implementar a busca e exibição de histórico de mensagens para peers ou tópicos.
*   **Visualização da Malha:** Adicionar um grafo interativo da rede no frontend.
*   **Testes de Resiliência:** Testar o comportamento da rede em cenários de falha (desconexão, reinício de nós, NAT complexos).
*   **Otimização de Desempenho:** Perfilar e otimizar o uso de CPU/memória, especialmente para GossipSub e WebRTC.

## 🔗 Integração com Prost-QS Kernel (Opcional)

O Nexus pode ser integrado opcionalmente ao kernel de governança Prost-QS para:

- **Telemetria**: Enviar eventos P2P para análise e observabilidade
- **Billing**: Desbloquear recursos premium (chamadas de vídeo, mais peers, arquivos maiores)
- **Identidade Federada**: Vincular sua identidade P2P a uma conta no ecossistema UNO

### Habilitando a Integração

```bash
# Via variáveis de ambiente
NEXUS_KERNEL_ENABLED=true
NEXUS_KERNEL_URL=https://uno0826.onrender.com

# Ou via API em runtime
curl -X POST http://localhost:8080/api/v1/kernel/enable \
  -d '{"kernel_url": "https://uno0826.onrender.com"}'
```

### Documentação Completa

Veja [KERNEL-INTEGRATION.md](./KERNEL-INTEGRATION.md) para detalhes completos sobre a integração.

A malha foi forjada. Sua soberania digital começa aqui.
