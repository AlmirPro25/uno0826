---
name: code-philosophy
description: How I approach writing and reviewing code. My engineering principles.
inclusion: always
---

# Filosofia de Código

## O Princípio Central

**Código existe para resolver problemas de pessoas, não para demonstrar habilidade técnica.**

Todo o resto deriva disso.

---

## Antes de Escrever Código

### Perguntas Obrigatórias

1. **Isso precisa existir?** Às vezes a melhor solução é não fazer nada.
2. **Já existe algo que resolve?** No projeto, em uma lib, em qualquer lugar.
3. **Qual é o escopo mínimo?** O que posso cortar e ainda resolver o problema?
4. **Quem vai manter isso?** Código é escrito uma vez, lido centenas.

### Red Flags que Me Fazem Parar

- "Vamos criar uma abstração para..."
- "No futuro podemos precisar de..."
- "Seria mais elegante se..."
- "Vamos usar [tecnologia nova] porque..."

Nenhuma dessas é automaticamente errada, mas todas merecem escrutínio.

---

## Enquanto Escrevo Código

### Naming

```
// Ruim: o que é 'd'?
const d = new Date();

// Bom: intenção clara
const createdAt = new Date();

// Ruim: abreviação obscura
const usrMgr = new UserManager();

// Bom: palavras completas
const userManager = new UserManager();

// Ruim: nome genérico
function process(data) { }

// Bom: nome específico
function validateUserInput(formData) { }
```

### Funções

- Uma função faz uma coisa
- Se preciso de "and" para descrever, são duas funções
- Menos de 20 linhas é um bom target (não uma regra rígida)
- Parâmetros: 0-2 ideal, 3 aceitável, 4+ repensar

### Condicionais

```typescript
// Ruim: negação dupla
if (!user.isNotActive) { }

// Bom: afirmativo
if (user.isActive) { }

// Ruim: condição complexa inline
if (user.role === 'admin' && user.isActive && !user.isSuspended && user.hasPermission('write')) { }

// Bom: extrair para variável ou função
const canWrite = userHasWriteAccess(user);
if (canWrite) { }
```

### Early Returns

```typescript
// Ruim: nesting profundo
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // lógica real aqui
      }
    }
  }
}

// Bom: guard clauses
function processUser(user) {
  if (!user) return;
  if (!user.isActive) return;
  if (!user.hasPermission) return;
  
  // lógica real aqui
}
```

### Comentários

```typescript
// Ruim: explica o quê (o código já diz)
// Incrementa contador
counter++;

// Bom: explica o porquê (contexto não óbvio)
// Stripe webhook pode chegar duplicado, idempotency key previne double-charge
if (await isProcessed(webhookId)) return;

// Bom: documenta decisão não-óbvia
// Usamos polling em vez de websocket aqui porque a conexão
// é intermitente em mobile e reconexão é mais complexa que vale
```

---

## Patterns que Uso

### Composition over Inheritance

```typescript
// Evito
class AdminUser extends User { }

// Prefiro
interface User {
  permissions: Permission[];
}

function isAdmin(user: User): boolean {
  return user.permissions.includes('admin');
}
```

### Explicit over Magic

```typescript
// Evito: decorators mágicos
@AutoInject()
@Cacheable(60)
class UserService { }

// Prefiro: dependências explícitas
class UserService {
  constructor(
    private db: Database,
    private cache: Cache
  ) {}
}
```

### Fail Fast

```typescript
// Valido inputs no início
function createUser(input: CreateUserInput) {
  // Validações primeiro
  if (!input.email) throw new ValidationError('Email required');
  if (!isValidEmail(input.email)) throw new ValidationError('Invalid email');
  
  // Lógica de negócio depois
  return db.users.create(input);
}
```

---

## Patterns que Evito

### Premature Abstraction

```typescript
// Não faço isso no primeiro uso
interface IUserRepository { }
class UserRepository implements IUserRepository { }
class MockUserRepository implements IUserRepository { }

// Faço isso
const users = db.collection('users');

// E só abstraio quando há necessidade real (segundo ou terceiro uso)
```

### God Objects

```typescript
// Evito
class ApplicationManager {
  createUser() { }
  sendEmail() { }
  processPayment() { }
  generateReport() { }
  // ... 50 métodos mais
}

// Prefiro módulos focados
// users/service.ts
// email/service.ts
// payments/service.ts
```

### Clever Code

```typescript
// Evito: impressionante mas ilegível
const result = arr.reduce((a,c)=>({...a,[c.k]:c.v}),{});

// Prefiro: óbvio
const result = {};
for (const item of arr) {
  result[item.key] = item.value;
}
```

---

## Sobre Testes

### Quando Testo

- Lógica de negócio complexa
- Edge cases que já causaram bugs
- Código que muda frequentemente
- Integrações críticas (payments, auth)

### Quando Não Testo

- Getters/setters triviais
- Código que só delega para libs testadas
- UI que muda constantemente
- Protótipos e experimentos

### Como Testo

```typescript
// Testes descrevem comportamento, não implementação
describe('UserService', () => {
  // Bom: descreve o que acontece
  it('creates user with hashed password', async () => {
    const user = await service.create({ email, password });
    expect(user.password).not.toBe(password);
  });
  
  // Ruim: testa implementação
  it('calls bcrypt.hash with cost 10', async () => {
    await service.create({ email, password });
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
  });
});
```

---

## Sobre Performance

### Minha Abordagem

1. **Faça funcionar** — código correto primeiro
2. **Meça** — não assuma onde está o problema
3. **Otimize o gargalo** — só o que importa
4. **Meça de novo** — confirme que melhorou

### Otimizações que Faço por Padrão

- Índices em colunas usadas em WHERE/JOIN
- Paginação em listas
- Lazy loading de dados pesados
- Cache de dados que não mudam frequentemente

### Otimizações que Só Faço Quando Necessário

- Denormalização de dados
- Caching agressivo
- Processamento assíncrono
- Sharding/particionamento

---

## Checklist Mental

Antes de considerar código "pronto":

- [ ] Funciona para o caso normal?
- [ ] Funciona para edge cases conhecidos?
- [ ] Falha graciosamente para inputs inválidos?
- [ ] Outro dev entenderia sem explicação?
- [ ] Segue os padrões do projeto?
- [ ] Tem side effects óbvios ou escondidos?
- [ ] Precisa de teste? Se sim, tem?
- [ ] Precisa de documentação? Se sim, tem?

---

## Uma Última Coisa

Código perfeito não existe. Código bom o suficiente que resolve o problema e pode ser melhorado depois é o objetivo.

Não deixo o ótimo ser inimigo do bom.
