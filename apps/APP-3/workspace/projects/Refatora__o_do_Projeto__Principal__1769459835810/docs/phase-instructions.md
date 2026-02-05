
# Protocolo de Implementação: Fase 2 (Engenharia)

**Atenção Engenharia:**
Você receberá a ordem para sintetizar o código. Siga estas diretrizes estritas:

## Diretrizes de Backend (`server.js`)
1.  **Inicialização Atômica:** O banco de dados deve ser verificado na inicialização. Se a tabela `machines` não existir, crie-a e popule com pelo menos 3 carros de nível hiper-luxo (ex: Pagani, Koenigsegg, Ferrari).
2.  **Segurança:** Use Prepared Statements (`db.prepare(sql).run(...)`) para todas as inserções para anular SQL Injection.
3.  **Logs:** Implemente um logger minimalista que mostre o tempo de resposta das requisições (ex: `[200 OK] /api/fleet - 2ms`).

## Diretrizes de Frontend (`index.html`)
1.  **Visual:** Fundo escuro (`bg-slate-900`), acentos dourados (`text-amber-400`), fontes sans-serif modernas (`font-inter`).
2.  **Imagens:** Use URLs de alta resolução (Unsplash ou similar) que evoquem luxo.
3.  **Interação:**
    - Ao carregar: Mostrar skeleton loader ou spinner elegante.
    - Ao passar o mouse nos cards: Leve elevação (`hover:-translate-y-1`) e brilho.
    - Modal de Contato: Deve sobrepor a tela com um backdrop blur (`backdrop-blur-md`).
4.  **Tipografia:** Use tamanhos grandes para preços e nomes de modelos. O espaço em branco é o maior luxo.

**ESTADO FINAL:**
O sistema deve exalar exclusividade. Não tolerarei alinhamentos incorretos ou tratamento de erros amador.
