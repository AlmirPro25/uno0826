
# ESTRUTURA OPERACIONAL DO SENTINEL NEXUS

Para conformidade com o Protocolo de Entrega Rápida (2 arquivos principais), a estrutura lógica interna será compilada, mas o ambiente de desenvolvimento deve refletir:

## 1. NÚCLEO (Backend - server.js)
- **Init:** Configuração do servidor Express e WebSocket.
- **Database:** Instância do PrismaClient.
- **Controllers:** Lógica de negócios para Ativos e Segurança.
- **Simulation Engine:** Loop de eventos que atualiza coordenadas e sensores aleatoriamente.
- **Seeding:** Função de auto-população que insere as 3 rotas obrigatórias se o banco estiver vazio.

## 2. INTERFACE (Frontend - index.html)
- **Head:** Carregamento de CSS Tático, Fontes, Leaflet CSS.
- **Body:**
    - **Header:** Status Global, Relógio UTC.
    - **Main Grid:**
        - **Map Sector:** Visualização Leaflet com marcadores customizados.
        - **Asset List:** Tabela dinâmica de ativos.
        - **Telemetry Panel:** Gráficos Chart.js e detalhes do ativo selecionado.
        - **Log Console:** Stream de eventos de segurança.
- **Script:**
    - Lógica de WebSocket para receber updates.
    - Renderização reativa da UI.
    - Manipulação do Mapa.

## 3. DADOS DE INICIALIZAÇÃO (Hardcoded Seeds)
As seguintes rotas serão injetadas na inicialização:
1.  **AÉREO:** Dubai (DXB) -> Londres (LHR). Carga: Componentes de Servidor.
2.  **TERRESTRE:** Mônaco -> Genebra. Carga: Obras de Arte (Vault High Value).
3.  **MARÍTIMO:** Hong Kong -> Nova York. Carga: Microchips Industriais.

## 4. DEPENDÊNCIAS CRÍTICAS
- `express`: Servidor HTTP.
- `prisma` + `@prisma/client`: ORM.
- `ws`: WebSocket Server.
- `cors`: Segurança de origem.
- `body-parser`: Parsing de payloads.
