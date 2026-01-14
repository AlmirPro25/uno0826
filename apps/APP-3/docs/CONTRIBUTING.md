# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o AI Web Weaver! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Código de Conduta

Este projeto adere a um código de conduta. Ao participar, você concorda em manter um ambiente respeitoso e inclusivo.

## 🚀 Como Contribuir

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/ai-web-weaver.git
cd ai-web-weaver

# Adicione o repositório original como upstream
git remote add upstream https://github.com/original-usuario/ai-web-weaver.git
```

### 2. Crie uma Branch

```bash
# Atualize sua main
git checkout main
git pull upstream main

# Crie uma branch para sua feature
git checkout -b feature/nome-da-feature
```

### 3. Faça suas Mudanças

- Escreva código limpo e bem documentado
- Siga os padrões do projeto
- Adicione testes quando aplicável
- Atualize a documentação

### 4. Teste suas Mudanças

```bash
# Execute os testes
npm test

# Verifique o build
npm run build

# Teste localmente
npm run dev
```

### 5. Commit

Use commits semânticos:

```bash
# Formato: tipo(escopo): descrição

git commit -m "feat(excellence-core): adiciona critério de performance"
git commit -m "fix(gemini-service): corrige erro de timeout"
git commit -m "docs(readme): atualiza exemplos de uso"
```

**Tipos de commit:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### 6. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Abra um Pull Request no GitHub
```

## ✅ Checklist do Pull Request

Antes de submeter, verifique:

- [ ] Código passa no Excellence Core (score ≥ 85/100)
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Commits seguem padrão semântico
- [ ] Build passa sem erros
- [ ] Sem conflitos com main
- [ ] Descrição clara do PR

## 📝 Padrões de Código

### TypeScript

```typescript
// ✅ BOM
export interface ExcellenceReport {
  domain: string;
  overallScore: number;
  passed: boolean;
}

// ❌ RUIM
export interface report {
  d: string;
  s: number;
  p: boolean;
}
```

### Nomenclatura

- **Arquivos:** PascalCase para componentes, camelCase para utils
  - `ExcellenceCore.ts`
  - `geminiService.ts`

- **Variáveis:** camelCase
  - `const overallScore = 85;`

- **Constantes:** UPPER_SNAKE_CASE
  - `const CORE_PRINCIPLE = "...";`

- **Componentes:** PascalCase
  - `function ExcellencePanel() { ... }`

### Comentários

```typescript
// ✅ BOM - Explica o "porquê"
// Usar reduce ao invés de forEach para melhor performance
const total = items.reduce((sum, item) => sum + item.value, 0);

// ❌ RUIM - Explica o "o quê" (óbvio)
// Somar os valores
const total = items.reduce((sum, item) => sum + item.value, 0);
```

## 🎯 Áreas para Contribuir

### Prioridade Alta
- [ ] Testes automatizados
- [ ] Critérios de excelência para JavaScript/TypeScript
- [ ] Auto-fix para problemas simples
- [ ] Documentação de APIs

### Prioridade Média
- [ ] Novos templates de apps
- [ ] Melhorias de performance
- [ ] Suporte a mais modelos de IA
- [ ] Internacionalização (i18n)

### Prioridade Baixa
- [ ] Temas customizáveis
- [ ] Plugins para editores
- [ ] Dashboard de métricas
- [ ] Marketplace de componentes

## 🐛 Reportando Bugs

Use o template de issue do GitHub e inclua:

1. **Descrição clara** do problema
2. **Passos para reproduzir**
3. **Comportamento esperado**
4. **Comportamento atual**
5. **Screenshots** (se aplicável)
6. **Ambiente:**
   - OS: [ex: Windows 11]
   - Node: [ex: 18.17.0]
   - Browser: [ex: Chrome 120]

## 💡 Sugerindo Features

Use o template de feature request e inclua:

1. **Problema que resolve**
2. **Solução proposta**
3. **Alternativas consideradas**
4. **Contexto adicional**

## 📚 Recursos

- [Documentação do Gemini](https://ai.google.dev/)
- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

## ❓ Dúvidas

- Abra uma [Discussion](https://github.com/seu-usuario/ai-web-weaver/discussions)
- Entre no nosso [Discord](#) (se houver)
- Envie um email para [contato@exemplo.com]

## 🙏 Agradecimentos

Toda contribuição é valiosa! Obrigado por ajudar a tornar o AI Web Weaver melhor.

---

**Lembre-se:** A mediocridade é inaceitável. Buscar excelência é obrigatório. ⚡
