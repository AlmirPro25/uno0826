
# INSTRUÇÕES PARA A FASE DE EXECUÇÃO (CODIFICAÇÃO)

ATENÇÃO, OPERADOR. Ao iniciar a Fase 2, siga estritamente:

## 1. FRONTEND (index.html)
- **Estética:** O fundo deve ser `#0F0F12`. Bordas devem ser finas (`1px`) na cor `#333`. Texto ativo em `#39FF14` ou `#FF5F1F`.
- **Mapa:** Inicialize o Leaflet com tiles escuros (ex: CartoDB DarkMatter). Remova controles de zoom padrão para um visual mais limpo.
- **Interatividade:** Clicar em um ativo na lista deve focar o mapa nele e atualizar o painel de telemetria lateral.
- **Logs:** A área de logs deve ter um efeito de rolagem automática e fonte monospace.

## 2. BACKEND (server.js)
- **Auto-Boot:** O script deve verificar se o arquivo `sentinel.db` existe. Se não, deve executar as migrations do Prisma programaticamente ou usar SQL raw para criar tabelas e popular os dados iniciais. *Prioridade: Robustez.*
- **Simulação:** Crie um `setInterval` que roda a cada 3-5 segundos para:
    1.  Mover ligeiramente as coordenadas dos ativos em direção ao destino.
    2.  Variar a temperatura e bateria.
    3.  Emitir os novos dados via WebSocket para todos os clientes conectados.
- **API:** Implemente as rotas REST definidas no OpenAPI para ações estáticas (detalhes, lockdown).

## 3. INTEGRAÇÃO
- O frontend deve tentar reconectar ao WebSocket automaticamente se a conexão cair (Redundância).
- O botão "LOCKDOWN" deve enviar uma requisição POST e, ao receber sucesso, mudar o status visual do ativo para VERMELHO PISCANTE instantaneamente.

**FIM DA TRANSMISSÃO.**
