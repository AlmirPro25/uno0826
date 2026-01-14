
# 🚀 Manifest Finance Manager

Este é um aplicativo de controle de gastos pessoais "mobile-first" desenvolvido com React, TypeScript e Tailwind CSS. Ele utiliza Zustand para gerenciamento de estado e persistência local via LocalStorage.

## Tecnologias Utilizadas

*   **Frontend Framework:** React
*   **Linguagem:** TypeScript
*   **Gerenciamento de Estado:** Zustand (com persistência LocalStorage)
*   **Estilização:** Tailwind CSS (tema escuro)
*   **Gráficos:** Recharts
*   **Ícones:** Lucide React

## Funcionalidades

*   **Dashboard Resumido:** Exibe o total de gastos do mês e o saldo restante da meta.
*   **Meta de Gastos:** Acompanhamento visual do progresso da meta mensal.
*   **Adicionar Despesa:** Formulário para registrar valor, categoria, descrição e data.
*   **Visualização por Categoria:** Gráfico de pizza que mostra a distribuição percentual de gastos.
*   **Histórico de Transações:** Lista detalhada das despesas com opção de exclusão.
*   **Responsividade:** Design adaptável para mobile e desktop.

## ⚙️ Configuração e Execução

Para rodar o projeto localmente, siga os passos abaixo:

1.  **Pré-requisitos:** Certifique-se de ter o Node.js e o npm (ou yarn/pnpm) instalados.

2.  **Instalação das dependências:**
    ```bash
    npm install
    ```

3.  **Executar o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    O aplicativo estará disponível em `http://localhost:5173`.

4.  **Build para produção:**
    ```bash
    npm run build
    ```
    Os arquivos estáticos serão gerados na pasta `dist/`.

## 🎨 Design System

**Paleta de Cores:**

*   Fundo Principal: `#0f172a` (slate-900)
*   Cards e Elementos: `#1e293b` (slate-800)
*   Destaque/Acento: `#10b981` (emerald-500)
