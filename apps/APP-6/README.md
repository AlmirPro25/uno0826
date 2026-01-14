# 🤖 Prox AI Studio

> Assistente de IA com Busca Visual Inteligente e Navegação Autônoma

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

---

## 📋 Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Documentação](#documentação)
- [Estrutura do Projeto](#estrutura-do-projeto)

---

## 🎯 Sobre

**Prox AI Studio** é um assistente de IA avançado que combina conversação natural com capacidades únicas de busca visual e navegação autônoma na web.

### Diferenciais:

- 🔍 **Busca Visual Inteligente** - Navega em sites reais, captura screenshots e analisa visualmente
- 🧠 **Visão Multimodal** - Usa Gemini Vision para entender texto + imagens
- 💬 **Respostas Naturais** - Tom conversacional e profissional
- 📸 **Screenshots Clicáveis** - Mostra as páginas analisadas
- 🚀 **Próximos Passos** - Checklists acionáveis
- 📞 **Contatos Úteis** - Informações práticas diretas

---

## ✨ Funcionalidades

### 1. Chat com IA (Gemini)
- Conversação natural e contextual
- Suporte a múltiplos modelos Gemini
- Modo de pensamento (thinking mode)
- Histórico de conversas
- Personas customizáveis

### 2. Busca Visual Inteligente
- Navegação real em 5+ sites simultaneamente
- Captura de screenshots automática
- Análise visual com Gemini Vision
- Síntese inteligente de resultados
- Links clicáveis e fontes verificáveis

### 3. Geração de Conteúdo
- Geração de imagens (Gemini + Imagen)
- Geração de vídeos (Veo)
- Transcrição de áudio
- Text-to-Speech
- Código interativo

### 4. Busca Especializada
- Busca de produtos com comparação de preços
- Busca de notícias em tempo real
- Busca geral com múltiplas fontes
- Detecção automática de intenção

---

## 🛠️ Tecnologias

### Frontend
- **React** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Marked** - Renderização Markdown

### Backend
- **Node.js** + Express
- **Playwright** - Automação de navegador
- **Socket.io** - Comunicação real-time
- **Google Gemini API** - IA e visão

### Serviços
- Google Gemini 2.0 Flash
- Gemini Vision (multimodal)
- Imagen 4.0 (geração de imagens)
- Veo 3.1 (geração de vídeos)

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Chave API do Google Gemini

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/prox-ai-studio.git
cd prox-ai-studio
```

2. **Instale as dependências**
```bash
# Raiz (frontend)
npm install

# Backend
cd backend
npm install
cd ..
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na pasta `backend`:
```env
GEMINI_API_KEY=sua_chave_aqui
PORT=3002
FRONTEND_URL=http://localhost:3000
```

Crie um arquivo `.env` na raiz:
```env
VITE_GEMINI_API_KEY=sua_chave_aqui
```

4. **Inicie o sistema**

**Opção 1: Automático (Windows)**
```bash
INICIAR.bat
```

**Opção 2: Manual**
```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

5. **Acesse o sistema**
```
http://localhost:3000
```

---

## 🚀 Como Usar

### Busca Visual Inteligente

Digite no chat:
```
Busque iPhone 13
```

O sistema vai:
1. Detectar que é busca de produtos
2. Navegar em Mercado Livre, Amazon, Magazine Luiza, etc
3. Capturar screenshots das páginas
4. Analisar visualmente os produtos
5. Gerar resposta natural com:
   - Comparação de preços
   - Links diretos
   - Screenshots clicáveis
   - Próximos passos

### Busca de Informações

```
Como abrir uma startup em Salvador sendo pobre?
```

Resposta incluirá:
- Informações completas
- Programas governamentais
- Contatos úteis (telefones, endereços)
- Próximos passos acionáveis
- Screenshots dos sites oficiais

### Busca de Notícias

```
Busque notícias sobre inteligência artificial
```

Resultado:
- Resumo das principais notícias
- Links para matérias completas
- Screenshots dos portais
- Fontes verificáveis

---

## 📚 Documentação

### Documentação Principal

- [Sistema de Busca Visual Inteligente](docs/SISTEMA_BUSCA_VISUAL_INTELIGENTE.md)
- [Guia de Teste](docs/GUIA_TESTE_BUSCA_VISUAL.md)
- [Melhorias Implementadas](docs/RESUMO_MELHORIAS_IMPLEMENTADAS.md)

### Documentação Técnica

- [Arquitetura do Sistema](docs/ARQUITETURA_COMPLETA_UI_IA.md)
- [Configuração de Busca](docs/CONFIGURACAO_BUSCA.md)
- [API Reference](docs/API_REFERENCE.md)

### Guias

- [Como Testar](docs/COMO_TESTAR.md)
- [Guia Rápido](docs/GUIA_RAPIDO_IMPLEMENTACAO.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

---

## 📁 Estrutura do Projeto

```
prox-ai-studio/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # Componentes React
│   │   ├── ChatView.tsx         # Interface de chat
│   │   ├── Message.tsx          # Renderização de mensagens
│   │   ├── ProductGrid.tsx      # Grid de produtos
│   │   └── ...
│   ├── services/                # Serviços do frontend
│   │   ├── geminiService.ts     # Integração Gemini
│   │   ├── browserService.ts    # Serviço de navegação
│   │   └── ...
│   ├── types.ts                 # Tipos TypeScript
│   └── App.tsx                  # Componente principal
│
├── backend/                      # Backend (Node.js + Express)
│   ├── services/                # Serviços do backend
│   │   ├── visualIntelligentSearch.js  # Busca visual
│   │   ├── browserService.js           # Playwright
│   │   ├── massiveSearchService.js     # Busca paralela
│   │   └── ...
│   ├── data/                    # Dados estáticos
│   │   └── trusted-sites.json   # Sites confiáveis
│   ├── config/                  # Configurações
│   │   └── search-config.js     # Config de busca
│   └── server.js                # Servidor Express
│
├── docs/                         # Documentação
│   ├── SISTEMA_BUSCA_VISUAL_INTELIGENTE.md
│   ├── GUIA_TESTE_BUSCA_VISUAL.md
│   └── ...
│
├── README.md                     # Este arquivo
├── package.json                  # Dependências frontend
└── INICIAR.bat                   # Script de inicialização
```

---

## 🎯 Casos de Uso

### 1. Pesquisa de Produtos
```
Busque notebook gamer até R$ 5000
```
**Resultado:** Comparação de preços, melhores ofertas, links diretos

### 2. Informações Governamentais
```
Como conseguir financiamento do governo para minha empresa?
```
**Resultado:** Programas disponíveis, contatos, próximos passos

### 3. Notícias Atualizadas
```
Busque últimas notícias sobre tecnologia
```
**Resultado:** Resumo de notícias, links, screenshots dos portais

### 4. Pesquisa Acadêmica
```
Busque informações sobre computação quântica
```
**Resultado:** Síntese de múltiplas fontes, links acadêmicos

---

## 🔧 Configuração Avançada

### Ajustar Número de Sites

Edite `backend/services/visualIntelligentSearch.js`:
```javascript
maxSites: 5 // Padrão: 5 (recomendado 3-7)
```

### Ajustar Timeout

Edite `backend/config/search-config.js`:
```javascript
DEFAULT_TIMEOUT: 30000 // 30 segundos
```

### Adicionar Sites Customizados

Edite `backend/data/trusted-sites.json`:
```json
{
  "custom_category": [
    {
      "name": "Meu Site",
      "url": "https://meusite.com",
      "priority": 1
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Verificar se a porta 3002 está livre
netstat -ano | findstr :3002

# Reinstalar dependências
cd backend
rm -rf node_modules
npm install
```

### Frontend não conecta
```bash
# Verificar variáveis de ambiente
cat .env

# Verificar se backend está rodando
curl http://localhost:3002/health
```

### Busca visual falha
```bash
# Verificar Playwright
cd backend
npx playwright install

# Verificar API Key
echo $GEMINI_API_KEY
```

---

## 📊 Performance

- **Tempo de busca:** 15-30 segundos
- **Sites navegados:** 5 simultâneos
- **Screenshots:** 5 capturas (PNG)
- **Tokens Gemini:** ~10.000-20.000 por busca
- **Custo estimado:** ~$0.01-0.02 por busca

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu-email@exemplo.com

---

## 🙏 Agradecimentos

- Google Gemini API
- Playwright Team
- React Community
- Todos os contribuidores

---

## 📞 Suporte

Encontrou um bug ou tem uma sugestão?

- 🐛 [Reportar Bug](https://github.com/seu-usuario/prox-ai-studio/issues)
- 💡 [Sugerir Feature](https://github.com/seu-usuario/prox-ai-studio/issues)
- 📧 Email: suporte@exemplo.com

---

<div align="center">

**Feito com ❤️ e ☕**

[⬆ Voltar ao topo](#-prox-ai-studio)

</div>
