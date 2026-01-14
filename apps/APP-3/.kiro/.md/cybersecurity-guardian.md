# 🛡️ CYBERSECURITY GUARDIAN

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Security, Segurança, Cybersecurity, Infosec
- OWASP, OWASP Top 10, Vulnerabilidade
- XSS, Cross-Site Scripting, CSRF
- SQL Injection, Injection, Sanitização
- Rate Limiting, Brute Force, DDoS
- Zod, Validation, Validação, Input Validation
- Helmet, CORS, CSP, Content Security Policy
- Encryption, Criptografia, Hashing, Bcrypt

## FILOSOFIA
> "Assuma que todo input é malicioso. Valide tudo. Confie em nada."

### Princípios Invioláveis
1. **Defense in Depth** - Múltiplas camadas de proteção
2. **Least Privilege** - Mínimo acesso necessário
3. **Fail Secure** - Na dúvida, bloqueie
4. **Input Validation** - Valide TUDO no servidor
5. **Output Encoding** - Escape antes de renderizar
6. **Secure by Default** - Configurações seguras por padrão

## OWASP TOP 10 (2021)

| # | Vulnerabilidade | Prevenção |
|---|-----------------|-----------|
| A01 | Broken Access Control | RBAC, validate ownership |
| A02 | Cryptographic Failures | TLS, bcrypt, encrypt at rest |
| A03 | Injection | Parameterized queries, ORMs |
| A07 | XSS | Escape output, CSP |

## ZOD VALIDATION

```typescript
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  name: z.string().min(2).max(100),
});

// API route
app.post('/api/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() });
  }
  // Safe to use result.data
});
```

## HELMET SETUP

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));
```

## RATE LIMITING

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  skipSuccessfulRequests: true,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
```

## PASSWORD HASHING

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

## SQL INJECTION PREVENTION

```typescript
// ❌ VULNERABLE
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SAFE - Parameterized
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✅ SAFE - ORM
const user = await prisma.user.findUnique({ where: { email } });
```

## CHECKLIST

### Authentication
- [ ] Passwords hashed with bcrypt (cost 12+)?
- [ ] MFA available?
- [ ] Sessions expire and can be revoked?

### Authorization
- [ ] Every endpoint checks permissions?
- [ ] Users can only access their own data?

### Input Validation
- [ ] All input validated on server?
- [ ] SQL queries parameterized?
- [ ] File uploads validated?

### Infrastructure
- [ ] HTTPS everywhere?
- [ ] Security headers configured?
- [ ] Rate limiting enabled?
- [ ] Secrets in environment variables?

## ANTI-PATTERNS

❌ **NUNCA** concatene strings em SQL
❌ **NUNCA** armazene senhas em texto plano
❌ **NUNCA** confie em dados do cliente
❌ **NUNCA** exponha stack traces em produção
❌ **NUNCA** use HTTP em produção
❌ **NUNCA** commite secrets no git
