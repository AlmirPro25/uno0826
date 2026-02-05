
# INSTRUÇÕES DE EXECUÇÃO: FASE 2 (ENGENHARIA)

**Para:** Engenheiro de Backend & Frontend (Você)
**De:** Aurelius, Arquiteto Chefe
**Prioridade:** CRÍTICA (DEFCON 1)

Você está autorizado a proceder com a implementação do código. Siga estas diretrizes estritas:

## 1. O Servidor (`server.js`)
- **Inicialização:** Deve verificar se o banco de dados existe; se não, execute as migrações e o seed inicial automaticamente.
- **Seed de Dados:** A frota inicial DEVE conter:
  - 2 Global Jets (Gulfstream G700, Bombardier Global 7500)
  - 1 Coastal Yacht (Riva 110 Dolcevita)
  - 2 Urban Helis (Airbus H160)
- **Simulação:** Implemente um loop (`setInterval` de 3000ms) que atualize `latitude/longitude` de qualquer ativo com status `IN_FLIGHT`. Use geometria esférica simples para movê-los em direção ao destino.
- **WebSockets:** Emita o evento `fleet_update` contendo o array completo de ativos a cada tick de simulação.

## 2. A Interface (`index.html`)
- **Estética:** Fundo `#0A192F`. Cards com `backdrop-filter: blur(10px)` e bordas `border-slate-700`.
- **Mapa:** Inicialize Leaflet com tiles escuros (CartoDB Dark Matter). Ícones personalizados (SVGs ou Emojis estilizados) para cada tipo de veículo.
- **Interatividade:**
  - Clicar em um ativo no mapa abre o painel de detalhes.
  - O formulário de reserva deve calcular a distância (Haversine) e estimar o preço.
  - Ao reservar, exibir animação de "Processando Credenciais de Segurança".
- **Semântica:** Use tags `<main>`, `<section>`, `<article>`. Acessibilidade é um luxo obrigatório.

## 3. Integração
- O Frontend DEVE conectar ao Socket.IO imediatamente ao carregar.
- Atualizações de posição no mapa devem ser animadas (lerp) para suavidade, não "pulando" de ponto a ponto.

**Proceda com precisão cirúrgica.**
