# 🧪 Testes - prox ai studio

Arquivos de teste e fixtures do projeto.

## 📁 Estrutura

```
tests/
├── README.md           # Este arquivo
└── fixtures/           # Dados de teste (JSON)
```

## 🔧 Fixtures Disponíveis

### Testes de Navegação
- `test-navigate.json` - Testes de navegação web
- `test-playwright.json` - Testes com Playwright
- `test-screenshot.json` - Testes de captura de tela

### Testes de Busca
- `test-search.json` - Testes de busca
- `test-extract.json` - Testes de extração de dados

### Testes de Produtos
- `test-products.json` - Testes de busca de produtos
- `test-phone.json` - Testes de produtos específicos
- `test-laptop.json` - Testes de produtos específicos

### Testes de Integração
- `test-github.json` - Testes de integração GitHub

### Configurações
- `LISTA_URLS_NAVEGACAO.json` - Lista de URLs para navegação

## 🚀 Como Usar

### Executar Testes de Navegação

```bash
cd backend
node test-navegacao-autonoma.js
```

### Executar Testes de Agentes

```bash
cd backend
node test-agentes.js
```

## 📝 Formato dos Fixtures

Os arquivos JSON seguem o padrão:

```json
{
  "test_name": "Nome do teste",
  "input": {
    // Dados de entrada
  },
  "expected": {
    // Resultado esperado
  }
}
```

## 🔍 Documentação de Testes

Para documentação detalhada sobre testes, veja:

- [Teste Sistema de Busca](../docs/dev/TESTE_SISTEMA_BUSCA.md)
- [Teste Sistema de Voz](../docs/dev/TESTE_SISTEMA_VOZ.md)
- [Teste Navegação V2](../docs/dev/TESTE_NAVEGACAO_V2.md)
- [Guia de Teste de Navegação](../docs/guides/GUIA_TESTE_NAVEGACAO.md)

## 🎯 Próximos Passos

- [ ] Adicionar testes unitários
- [ ] Configurar CI/CD
- [ ] Adicionar coverage reports
- [ ] Criar testes E2E

---

**Versão:** 1.0.0
