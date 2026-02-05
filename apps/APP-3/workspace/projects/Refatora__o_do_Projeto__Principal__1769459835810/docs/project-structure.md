
# Estrutura do Projeto: LuxeDigital

A elegância reside na simplicidade. Dois arquivos, impacto infinito.

## 1. O Motor (Backend)
**Arquivo:** `server.js`
- **Responsabilidade:** 
  - Inicialização do Servidor HTTP.
  - Orquestração do Banco de Dados SQLite (Criação de tabelas na inicialização).
  - Rotas da API (/api/fleet, /api/concierge).
  - Servir o arquivo estático (index.html).
  - Seed inicial de dados (Para o showroom não estar vazio).

## 2. A Carroceria (Frontend)
**Arquivo:** `index.html`
- **Responsabilidade:**
  - Estrutura DOM Semântica.
  - Styling via Tailwind CSS (CDN).
  - Lógica de Aplicação (SPA - Single Page Application feel).
  - Gestão de Estado (Loading, Success, Error).
  - Fetch API Wrapper para comunicação com o Motor.

## Comandos de Inicialização (Zero-Config)
1. `npm init -y`
2. `npm install express sqlite3 cors`
3. `node server.js`
