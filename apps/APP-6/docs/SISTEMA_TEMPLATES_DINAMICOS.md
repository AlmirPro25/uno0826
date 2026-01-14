# Sistema de Templates Dinâmicos Inteligentes

## Visão Geral

Sistema que transforma o fundo do chat em um canvas HTML dinâmico, onde templates inteligentes são escolhidos e preenchidos automaticamente baseado no contexto da conversa.

## Arquitetura

```
Usuário faz pergunta
    ↓
Sistema gera resposta (Gemini)
    ↓
Template Maestro analisa contexto
    ↓
Escolhe template apropriado
    ↓
Preenche template com dados
    ↓
Renderiza no canvas de fundo
```

## Templates Disponíveis

### 1. Template de Notícias
- Layout de cards de notícias
- Imagens destacadas
- Títulos, descrições, fontes
- Links para leitura completa

### 2. Template de Produtos
- Grid de produtos
- Preços, imagens, avaliações
- Botões de compra
- Comparação de preços

### 3. Template de Tabelas
- Dados estruturados
- Comparações
- Estatísticas

### 4. Template de Mídia
- Galeria de imagens
- Vídeos embutidos
- Carrosséis

### 5. Template de Texto Rico
- Artigos longos
- Formatação rica
- Citações, listas

## Componentes

### TemplateMaestro
Orquestrador inteligente que:
- Analisa o tipo de consulta
- Detecta intenção do usuário
- Escolhe template apropriado
- Extrai dados estruturados
- Mapeia dados para template

### CanvasRenderer
Renderizador de canvas que:
- Gerencia o canvas de fundo
- Aplica templates
- Anima transições
- Mantém histórico visual

### TemplateEngine
Motor de templates que:
- Define estrutura de cada template
- Valida dados
- Renderiza HTML/CSS
- Gerencia responsividade

## Fluxo de Dados

1. **Análise**: Maestro analisa resposta do Gemini
2. **Classificação**: Identifica tipo de conteúdo
3. **Extração**: Extrai dados estruturados
4. **Mapeamento**: Mapeia para template
5. **Renderização**: Renderiza no canvas
6. **Sincronização**: Sincroniza com chat

## Benefícios

- Interface mais rica e intuitiva
- Melhor visualização de dados
- Experiência mais imersiva
- Separação clara entre chat e visualização
- Reutilização de templates
