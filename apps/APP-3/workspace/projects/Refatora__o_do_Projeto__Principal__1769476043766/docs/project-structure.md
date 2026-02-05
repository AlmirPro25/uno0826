
# ESTRUTURA DO PROJETO PULMÃO RUBRO (AEROSPHERE OS)

Devido às restrições de ambiente hostil (e solicitação de arquivo duplo), a estrutura física será condensada, mas a arquitetura lógica permanece segregada.

## 1. Núcleo Executivo (`server.js`)
Este arquivo conterá todo o backend.
- **Bootloader:** Inicialização e verificação de integridade do SQLite.
- **Middleware Cortex:** Tratamento de JSON, CORS (restrito à colônia), Logs.
- **Controladores de Homeostase:** Lógica de negócio para calcular O2, Pressão, etc.
- **Rotas Neurais (API):** Implementação dos contratos OpenAPI.
- **Simulation Engine:** Um loop interno (`setInterval`) que simula a flutuação natural do ambiente marciano (tempestades, consumo de O2) para dar vida aos dados.

## 2. Interface Retinal (`index.html`)
Este arquivo conterá todo o frontend.
- **Document Structure:** HTML5 Semântico otimizado para leitores de tela e AR.
- **Embedded Styles:** Tailwind CSS via CDN (para não depender de build steps, mas mantendo design system atômico).
- **Holographic Logic (JS):** 
  - `class BioMonitor`: Gerencia o estado local.
  - `class CanvasRenderer`: Desenha partículas de poeira e gráficos de onda.
  - `async syncPulse()`: Comunicação com o backend.

## 3. Memória Persistente (`aerosphere.db`)
Arquivo SQLite gerado automaticamente pelo `server.js` na primeira execução.
