# 🤝 Contribuindo para o Projeto

Obrigado por considerar contribuir! Este documento fornece diretrizes e instruções para contribuir.

## 📋 Código de Conduta

- Seja respeitoso com todos os contribuidores
- Forneça feedback construtivo
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

## 🚀 Como Começar

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
# Atualize a main
git fetch upstream
git checkout main
git merge upstream/main

# Crie sua branch de feature
git checkout -b feature/sua-feature
# ou para bugfix
git checkout -b fix/seu-bugfix
```

### 3. Faça suas Mudanças

Siga os padrões do projeto:

- **TypeScript**: Use tipos explícitos, evite `any`
- **React**: Use hooks funcionais, siga padrões de componentes
- **Código**: Siga o padrão Enterprise Code Standards
- **Commits**: Use Conventional Commits

### 4. Commits Semânticos

```bash
# Feature
git commit -m "feat: adiciona nova funcionalidade"

# Bugfix
git commit -m "fix: corrige problema em X"

# Documentação
git commit -m "docs: atualiza README"

# Refatoração
git commit -m "refactor: melhora estrutura de X"

# Testes
git commit -m "test: adiciona testes para X"

# Performance
git commit -m "perf: otimiza X"
```

## 📝 Padrões de Código

### TypeScript

```typescript
// ✅ BOM - Tipos explícitos
interface UserRequest {
  email: string;
  password: string;
}

async function createUser(req: UserRequest): Promise<User> {
  // implementação
}

// ❌ RUIM - Tipos implícitos
async function createUser(req: any): any {
  // implementação
}
```

### React Components

```typescript
// ✅ BOM - Componente funcional com tipos
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false 
}) => (
  <button onClick={onClick} disabled={disabled}>
    {label}
  </button>
);

// ❌ RUIM - Sem tipos
export const Button = ({ label, onClick }) => (
  <button onClick={onClick}>{label}</button>
);
```

### Tratamento de Erros

```typescript
// ✅ BOM - Erros tipados
class ValidationError extends Error {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

try {
  // operação
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Campo ${error.field}: ${error.message}`);
  }
}

// ❌ RUIM - Erros genéricos
try {
  // operação
} catch (error) {
  console.error('Erro:', error);
}
```

## 🧪 Testes

Adicione testes para novas funcionalidades:

```bash
# Rodar testes
npm run test

# Rodar com coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Exemplo de Teste

```typescript
describe('ExcellenceCore', () => {
  it('deve avaliar código HTML corretamente', () => {
    const html = '<html><head><title>Test</title></head></html>';
    const report = ExcellenceEngine.evaluate(html, HTML_EXCELLENCE_CRITERIA);
    
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });
});
```

## 📚 Documentação

Atualize a documentação quando necessário:

- Adicione comentários em código complexo
- Atualize `docs/` para mudanças significativas
- Mantenha o `README.md` atualizado
- Documente APIs públicas

## 🔍 Checklist Antes de Submeter PR

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Commits são semânticos
- [ ] Sem console.log ou debug code
- [ ] Sem secrets ou API keys
- [ ] TypeScript compila sem erros
- [ ] Testes passam localmente

## 📤 Submeter Pull Request

1. **Push sua branch**
   ```bash
   git push origin feature/sua-feature
   ```

2. **Abra um PR no GitHub**
   - Título claro e descritivo
   - Descrição detalhada das mudanças
   - Referência a issues relacionadas (#123)
   - Screenshots se aplicável

3. **Exemplo de PR Description**
   ```markdown
   ## Descrição
   Adiciona validação de email no formulário de cadastro.

   ## Tipo de Mudança
   - [x] Bug fix
   - [ ] Nova feature
   - [ ] Breaking change

   ## Como Testar
   1. Abra a página de cadastro
   2. Tente enviar email inválido
   3. Deve mostrar erro de validação

   ## Checklist
   - [x] Testes adicionados
   - [x] Documentação atualizada
   - [x] Sem breaking changes
   ```

## 🐛 Reportando Bugs

Use a template de issue:

```markdown
## Descrição do Bug
Descrição clara do problema.

## Passos para Reproduzir
1. Vá para...
2. Clique em...
3. Veja o erro...

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo.

## Ambiente
- OS: Windows/Mac/Linux
- Node: v18.0.0
- npm: v9.0.0

## Screenshots
Se aplicável, adicione screenshots.
```

## 💡 Sugestões de Features

Abra uma issue com o label `enhancement`:

```markdown
## Descrição
Breve descrição da feature.

## Motivação
Por que isso seria útil?

## Solução Proposta
Como você imagina que funcionaria?

## Alternativas
Outras abordagens consideradas.
```

## 📖 Recursos Úteis

- [Documentação Completa](./docs/INDICE_DOCUMENTACAO.md)
- [Excellence Core](./docs/EXCELLENCE_CORE_INTEGRADO.md)
- [Padrões Enterprise](./docs/ARQUITETURA_ENTERPRISE_ITAU.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)

## 🎓 Aprendendo o Projeto

1. Leia o `README.md`
2. Explore a estrutura em `docs/ESTRUTURA_PROJETO.md`
3. Entenda o Excellence Core
4. Rode os exemplos em `tests/`
5. Comece com issues marcadas como `good first issue`

## ❓ Dúvidas?

- Abra uma discussion no GitHub
- Verifique issues existentes
- Consulte a documentação em `docs/`

## 📜 Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a MIT License.

---

**Obrigado por contribuir! 🙏**

Suas contribuições fazem este projeto melhor para todos.
