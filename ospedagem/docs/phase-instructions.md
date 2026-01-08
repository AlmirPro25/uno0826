
# 🚀 Instruções para FASE 2: O Núcleo (Backend Go)

Agora que o design está forjado, o próximo passo é construir a **Engine de Execução**.

### Requisitos Técnicos:
1. **Docker SDK:** O Backend deve falar diretamente com `/var/run/docker.sock`.
2. **Hexagonal Implementation:**
    - Criar `ProjectService` para gerenciar o CRUD de aplicações.
    - Criar `DeploymentService` que dispara goroutines para:
        - Clonar o Repo.
        - Gerar um Dockerfile dinâmico (se necessário).
        - Buildar a imagem.
        - Subir o container com limites de CPU/RAM.
3. **SSE Engine:** Implementar um broker de mensagens em memória para fazer o streaming dos logs do `docker build` para o frontend.
4. **Middleware de Segurança:** Validação rigorosa de JWT e sanitização de nomes de subdomínios para evitar ataques de injeção no proxy.

### Desafio de Engenharia:
O sistema deve detectar automaticamente se o app é um **Frontend** (Static Build) ou **Backend** (Long-running process) e ajustar o roteamento do Traefik via labels dinâmicas.

**MANIFEST ARCHITECT: A soberania aguarda sua execução.**
