
# PROTOCOLO DE SÍNTESE: FASE 2 & 3 (ATUALIZADO)

## PARA O BACKEND (Fase 2 - O Motor)
1.  **Autenticação e Autorização (CRÍTICO):**
    *   Implementar rotas `/api/auth/register` e `/api/auth/login`.
    *   Gerar e validar JWTs.
    *   Proteger todos os endpoints táticos (`/status`, `/fabricate`, `/deploy`, `/purge`) com middleware de autenticação.
    *   Usar `bcryptjs` para hash de senhas de usuário.
2.  **Persistência Aprimorada (CRÍTICO):**
    *   Configurar `Prisma Client` para interagir com PostgreSQL (via `DATABASE_URL`).
    *   Remover DDL manual; o esquema é gerenciado via `prisma/schema.prisma` e `prisma migrate deploy`.
    *   Traduzir todas as operações `sqlite3` para `Prisma Client` (e.g., `prisma.commandCenter.update`, `prisma.tacticalUnit.create`).
3.  **Loop de Simulação:** Implementar um `setInterval` no servidor que roda a cada 1 segundo (Tick).
    *   Regeneração passiva de `Bandwidth`.
    *   Verificar operações em andamento.
    *   Se `Operation.end_time < now`: Completar missão, adicionar recursos (CPU, BW, Crypto), liberar unidade (`status: IDLE`), remover operação, gerar log (`SUCCESS`).
4.  **Tratamento de Erro Militar:** Todo `try/catch` deve logar no console do servidor com prefixo `[SYSTEM_FAILURE]` e retornar `500 Internal Server Error` na API. Erros de validação (incluindo autenticação/autorização) devem retornar `400 Bad Request` ou `401 Unauthorized`.
5.  **Validação de Entrada Reforçada:** Implementar `express-validator` para todos os payloads de entrada (`fabricate`, `deploy`, `register`, `login`), garantindo sanitização e conformidade com o esquema.

## PARA O FRONTEND (Fase 3 - O Visor)
1.  **Autenticação UI:**
    *   Criar telas de `Login` e `Register` no frontend.
    *   Gerenciar o token JWT e o estado de autenticação no `useTacticalStore` e `localStorage`.
    *   Configurar `axios` para enviar o token JWT nos headers `Authorization`.
    *   Proteger as rotas do dashboard, redirecionando para o login se não autenticado.
2.  **Estética CRT:** Implementar overlay CSS com `pointer-events: none` contendo scanlines e vignette. (`App.tsx` e `index.css`)
3.  **Polling Tático:** JavaScript (via `useTacticalLoop`) deve fazer fetch em `/api/status` a cada 1s para atualizar a UI sem recarregar a página.
4.  **Feedback Sonoro REAL:** Implementar reprodução de sons reais (referenciando arquivos em `/public/sounds`) para eventos críticos (erro), logs e ações (fabricação/deploy). Tratar bloqueios de autoplay do navegador.
5.  **Log Terminal:** A área de logs (`ConsoleLog.tsx`) deve sempre scrollar para baixo automaticamente (`scrollTop = scrollHeight`).
6.  **Barra de Progresso Real:** A `OperationCard` no `TacticalMap.tsx` deve exibir uma barra de progresso dinâmica baseada no `start_time` e `end_time` da operação.

## OBJETIVO FINAL
O usuário deve sentir que está operando um terminal de hacker militar em um bunker subterrâneo, com um sistema totalmente funcional, seguro e responsivo, capaz de gerenciar seus ativos digitais em tempo real.
