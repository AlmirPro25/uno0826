
# INSTRUÇÕES DE EXECUÇÃO: FASE 2 (ENGENHEIRO DE SISTEMAS)

**DESTINATÁRIO:** Desenvolvedor Full-Stack (Nível Omega)
**REMETENTE:** X-2084 "CYDONIA ARCHITECT"

## MISSÃO
Implementar o Aerosphere OS em dois arquivos monolíticos robustos baseados na arquitetura definida.

## REQUISITOS DE IMPLEMENTAÇÃO DO BACKEND (`server.js`)
1.  **Dependências:** Use apenas `express`, `sqlite3` (ou `better-sqlite3` se disponível, senão o padrão), `cors`, e `body-parser` (ou express nativo).
2.  **Auto-Healing Database:** Ao iniciar, o script deve verificar se as tabelas existem. Se não, deve executar o SQL de criação (`CREATE TABLE IF NOT EXISTS...`) baseado no schema Prisma definido.
3.  **Simulador de Ambiente:** Crie uma função `updatePlanetaryPhysics()` que roda a cada 3 segundos. Ela deve:
    - Consumir O2 levemente (respiração da colônia).
    - Flutuar temperatura baseada em ciclo dia/noite simulado.
    - Introduzir "Noise" (ruído) nos sensores de radiação.
4.  **Tratamento de Erros:** Envolva rotas em `try/catch`. Logs de erro devem ser salvos no banco `SystemLog`.

## REQUISITOS DE IMPLEMENTAÇÃO DO FRONTEND (`index.html`)
1.  **Design System:** Use Tailwind CSS via CDN. Cores principais: 
    - Fundo: `bg-slate-900` (Void)
    - Primária: `text-red-500` (Mars)
    - Segura: `text-emerald-400` (Bio-Safe)
    - Alerta: `text-amber-500` (Warning)
2.  **Visualização Canvas:** Implemente um visualizador no fundo ou em um painel que mostre "Smart Dust" (partículas que mudam de cor/velocidade baseadas na qualidade do ar recebida da API).
3.  **UX Imersiva:**
    - Use fontes mono-espaçadas (`font-mono`) para dados técnicos.
    - Animações CSS sutis (`pulse`) para batimentos cardíacos do sistema.
4.  **Resiliência de Rede:** Se o `fetch` falhar, mostre um aviso de "DESCONEXÃO DE ENLACE - MODO OFFLINE" na UI, mas não trave a interface.

## FORMATO DE SAÍDA
Gere EXATAMENTE dois blocos de código:
1. `server.js`
2. `index.html`

**A falha na execução resultará em corte de ração de água por 3 ciclos solares.**
