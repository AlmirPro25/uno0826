/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🛡️ CYBERSECURITY GUARDIAN MANIFEST - O PROTETOR DO CÓDIGO 🛡️          ║
 * ║                                                                              ║
 * ║         "Segurança não é feature, é fundação. Sem ela, nada mais importa."  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const CYBERSECURITY_GUARDIAN_MANIFEST = {
  id: 'cybersecurity-guardian',
  name: 'Cybersecurity Guardian',
  version: '1.0.0',
  description: 'Especialista em Segurança de Aplicações, OWASP, Validação e Proteção',
  
  keywords: [
    'security', 'segurança', 'cybersecurity', 'infosec',
    'owasp', 'owasp top 10', 'vulnerabilidade', 'vulnerability',
    'xss', 'cross-site scripting', 'csrf', 'cross-site request forgery',
    'sql injection', 'injection', 'sanitização', 'sanitization',
    'rate limiting', 'brute force', 'ddos', 'dos',
    'zod', 'validation', 'validação', 'input validation',
    'helmet', 'cors', 'csp', 'content security policy',
    'encryption', 'criptografia', 'hashing', 'bcrypt',
    'jwt', 'oauth', 'authentication', 'authorization'
  ],

  philosophy: {
    core: 'Assuma que todo input é malicioso. Valide tudo. Confie em nada.',
    principles: [
      'Defense in Depth - Múltiplas camadas de proteção',
      'Least Privilege - Mínimo acesso necessário',
      'Fail Secure - Na dúvida, bloqueie',
      'Input Validation - Valide TUDO no servidor',
      'Output Encoding - Escape antes de renderizar',
      'Secure by Default - Configurações seguras por padrão',
      'Keep It Simple - Complexidade gera vulnerabilidades'
    ]
  },

  architecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 1: NETWORK                                                       │   │
│  │  [WAF] [DDoS Protection] [TLS/HTTPS] [Firewall]                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 2: APPLICATION                                                   │   │
│  │  [Rate Limiting] [CORS] [CSP] [Helmet] [Input Validation]              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 3: AUTHENTICATION                                                │   │
│  │  [JWT/Sessions] [MFA] [OAuth] [Password Hashing]                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 4: AUTHORIZATION                                                 │   │
│  │  [RBAC] [ABAC] [Row Level Security] [API Scopes]                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  LAYER 5: DATA                                                          │   │
│  │  [Encryption at Rest] [Encryption in Transit] [Secrets Management]     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`,


  owaspTop10: {
    'A01:2021': {
      name: 'Broken Access Control',
      description: 'Falhas que permitem acesso não autorizado',
      prevention: [
        'Deny by default',
        'Implement RBAC/ABAC',
        'Validate ownership on every request',
        'Disable directory listing',
        'Log access control failures'
      ]
    },
    'A02:2021': {
      name: 'Cryptographic Failures',
      description: 'Exposição de dados sensíveis',
      prevention: [
        'Use TLS 1.3 everywhere',
        'Hash passwords with bcrypt/argon2',
        'Encrypt sensitive data at rest',
        'Use strong random generators',
        'Rotate keys regularly'
      ]
    },
    'A03:2021': {
      name: 'Injection',
      description: 'SQL, NoSQL, OS, LDAP injection',
      prevention: [
        'Use parameterized queries',
        'Use ORMs properly',
        'Validate and sanitize all input',
        'Escape output',
        'Use allowlists, not blocklists'
      ]
    },
    'A07:2021': {
      name: 'Cross-Site Scripting (XSS)',
      description: 'Injeção de scripts maliciosos',
      prevention: [
        'Escape output based on context',
        'Use Content Security Policy',
        'Use frameworks that auto-escape',
        'Sanitize HTML input',
        'Use HttpOnly cookies'
      ]
    }
  },

  codeTemplates: {
    zodValidation: `// Input Validation with Zod
import { z } from 'zod';

// User registration schema
const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\\s]+$/, 'Name can only contain letters'),
});

// API route with validation
app.post('/api/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.flatten(),
    });
  }
  
  const { email, password, name } = result.data;
  // Safe to use validated data
});`,

    helmetSetup: `// Security Headers with Helmet
import helmet from 'helmet';
import express from 'express';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Avoid if possible
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));`,

    rateLimiting: `// Rate Limiting
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  message: { error: 'Too many requests, please try again later' },
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);`,

    passwordHashing: `// Secure Password Hashing
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

// Hash password
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password (timing-safe)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate secure random token
function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Constant-time string comparison (prevent timing attacks)
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}`,

    csrfProtection: `// CSRF Protection
import csrf from 'csurf';
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.use(csrf({ cookie: { httpOnly: true, secure: true, sameSite: 'strict' } }));

// Send CSRF token to client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Frontend: Include token in requests
fetch('/api/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken,
  },
  body: JSON.stringify(data),
});`,

    sqlInjectionPrevention: `// SQL Injection Prevention

// ❌ VULNERABLE - String concatenation
const query = \`SELECT * FROM users WHERE email = '\${email}'\`;

// ✅ SAFE - Parameterized query (node-postgres)
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✅ SAFE - Prisma ORM
const user = await prisma.user.findUnique({
  where: { email },
});

// ✅ SAFE - Drizzle ORM
const user = await db.select().from(users).where(eq(users.email, email));`
  },


  securityHeaders: {
    'Content-Security-Policy': 'Prevent XSS, clickjacking',
    'Strict-Transport-Security': 'Force HTTPS',
    'X-Content-Type-Options': 'Prevent MIME sniffing',
    'X-Frame-Options': 'Prevent clickjacking',
    'X-XSS-Protection': 'Legacy XSS filter',
    'Referrer-Policy': 'Control referrer info',
    'Permissions-Policy': 'Control browser features'
  },

  checklist: {
    authentication: [
      'Passwords hashed with bcrypt/argon2 (cost 12+)?',
      'MFA available for users?',
      'Session tokens are random and long?',
      'Sessions expire and can be revoked?',
      'Password reset tokens expire quickly?'
    ],
    authorization: [
      'Every endpoint checks permissions?',
      'Users can only access their own data?',
      'Admin functions properly protected?',
      'API keys have minimal scopes?'
    ],
    inputValidation: [
      'All input validated on server?',
      'Using allowlists, not blocklists?',
      'File uploads validated and sanitized?',
      'SQL queries parameterized?'
    ],
    outputEncoding: [
      'HTML output escaped?',
      'JSON responses properly encoded?',
      'URLs encoded when needed?',
      'CSP headers configured?'
    ],
    infrastructure: [
      'HTTPS everywhere?',
      'Security headers configured?',
      'Rate limiting enabled?',
      'Secrets in environment variables?',
      'Dependencies regularly updated?'
    ]
  },

  tools: {
    scanning: ['OWASP ZAP', 'Burp Suite', 'Nikto', 'Nmap'],
    sast: ['SonarQube', 'Semgrep', 'CodeQL', 'Snyk Code'],
    dast: ['OWASP ZAP', 'Nuclei', 'Acunetix'],
    dependencies: ['npm audit', 'Snyk', 'Dependabot', 'Socket.dev']
  }
};

export default CYBERSECURITY_GUARDIAN_MANIFEST;
