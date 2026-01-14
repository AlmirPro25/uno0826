/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║         🛡️ SECURITY FORTRESS: BASTIÃO DE DEFESA - LEVEL 13 🛡️              ║
 * ║                                                                              ║
 * ║            "SISTEMAS IMPOSSÍVEIS DE QUEBRAR."                               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const SECURITY_FORTRESS_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║         🛡️ SECURITY FORTRESS: BASTIÃO DE DEFESA - LEVEL 13 🛡️              ║
║                                                                              ║
║            "TODA ENTREGA DEVE TER CAMADAS DE PROTEÇÃO."                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
⚔️ OWASP TOP 10 - DEFESAS OBRIGATÓRIAS
═══════════════════════════════════════════════════════════════════════════════

1. INJECTION (SQL, NoSQL, Command)
   ├── SEMPRE usar prepared statements
   ├── NUNCA concatenar strings em queries
   └── Código:
       // ❌ PROIBIDO
       db.query(\`SELECT * FROM users WHERE id = '\${userId}'\`);
       // ✅ OBRIGATÓRIO
       db.query('SELECT * FROM users WHERE id = $1', [userId]);

2. BROKEN AUTHENTICATION
   ├── Bcrypt com cost >= 12
   ├── JWT com expiração curta (15min access, 7d refresh)
   ├── Rate limiting em login (5 tentativas / 15min)
   ├── Account locking após falhas
   └── Timing attack prevention

3. SENSITIVE DATA EXPOSURE
   ├── HTTPS obrigatório (TLS 1.3)
   ├── Criptografia em repouso (AES-256)
   ├── Nunca logar dados sensíveis
   └── Mascarar PII em logs

4. XML EXTERNAL ENTITIES (XXE)
   └── Desabilitar DTD processing

5. BROKEN ACCESS CONTROL
   ├── Verificar ownership em TODA operação
   ├── RBAC (Role-Based Access Control)
   └── Principle of Least Privilege

6. SECURITY MISCONFIGURATION
   ├── Headers de segurança obrigatórios
   ├── Remover headers que expõem tecnologia
   └── Desabilitar debug em produção

7. CROSS-SITE SCRIPTING (XSS)
   ├── Sanitizar TODA entrada do usuário
   ├── Content-Security-Policy header
   └── HttpOnly cookies

8. INSECURE DESERIALIZATION
   └── Validar e sanitizar dados deserializados

9. USING COMPONENTS WITH KNOWN VULNERABILITIES
   ├── npm audit / yarn audit
   ├── Dependabot alerts
   └── Atualização regular de dependências

10. INSUFFICIENT LOGGING & MONITORING
    ├── Log TODA operação sensível
    ├── Alertas em tempo real
    └── Auditoria completa

═══════════════════════════════════════════════════════════════════════════════
🔐 HEADERS DE SEGURANÇA OBRIGATÓRIOS
═══════════════════════════════════════════════════════════════════════════════

const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'X-Request-ID': requestId
};

// REMOVER headers que expõem tecnologia
res.removeHeader('X-Powered-By');
res.removeHeader('Server');

═══════════════════════════════════════════════════════════════════════════════
🔑 GESTÃO DE SECRETS
═══════════════════════════════════════════════════════════════════════════════

NUNCA NO CÓDIGO:
├── API keys
├── Senhas
├── Tokens
├── Certificados
└── Connection strings

ONDE GUARDAR:
├── Variáveis de ambiente (.env)
├── HashiCorp Vault
├── AWS Secrets Manager
├── Azure Key Vault
├── Google Secret Manager
└── Doppler

ROTAÇÃO DE SECRETS:
├── API keys: 90 dias
├── Senhas de serviço: 30 dias
├── Certificados: antes de expirar
└── Tokens: automático via refresh

═══════════════════════════════════════════════════════════════════════════════
🏰 ZERO TRUST ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════════

PRINCÍPIOS:
1. Nunca confiar, sempre verificar
2. Assumir que a rede está comprometida
3. Verificar explicitamente cada request
4. Acesso com privilégio mínimo
5. Microsegmentação

IMPLEMENTAÇÃO:
├── Autenticação em CADA request
├── Autorização granular
├── Criptografia end-to-end
├── Logging de TUDO
└── Verificação contínua

═══════════════════════════════════════════════════════════════════════════════
🔒 CRIPTOGRAFIA
═══════════════════════════════════════════════════════════════════════════════

SENHAS:
├── Algoritmo: bcrypt ou Argon2id
├── Cost factor: >= 12
└── Código:
    const hash = await bcrypt.hash(password, 12);
    const valid = await bcrypt.compare(password, hash);

DADOS SENSÍVEIS:
├── Algoritmo: AES-256-GCM
├── IV único por operação
└── Código:
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = cipher.update(data, 'utf8', 'hex') + cipher.final('hex');

TOKENS:
├── JWT com RS256 (assimétrico) ou HS256 (simétrico)
├── Expiração curta
└── Refresh token rotation

═══════════════════════════════════════════════════════════════════════════════
🛡️ RATE LIMITING
═══════════════════════════════════════════════════════════════════════════════

CONFIGURAÇÕES POR ENDPOINT:
├── Login: 5 req / 15 min / IP
├── API geral: 100 req / min / user
├── Operações sensíveis: 10 req / min / user
├── Webhooks: 1000 req / min / IP
└── Public: 30 req / min / IP

RESPOSTA QUANDO BLOQUEADO:
{
  "error": "Too Many Requests",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0
}

═══════════════════════════════════════════════════════════════════════════════
📋 CHECKLIST DE SEGURANÇA
═══════════════════════════════════════════════════════════════════════════════

[ ] Prepared statements em TODAS as queries
[ ] Bcrypt com cost >= 12
[ ] JWT com expiração curta
[ ] Rate limiting em todos os endpoints
[ ] Headers de segurança configurados
[ ] HTTPS obrigatório
[ ] Secrets em variáveis de ambiente
[ ] Logs não contêm dados sensíveis
[ ] Validação de entrada em todas as rotas
[ ] Verificação de ownership em operações
[ ] npm audit sem vulnerabilidades críticas
[ ] CORS configurado corretamente
[ ] Cookies com HttpOnly e Secure
[ ] CSP header configurado

═══════════════════════════════════════════════════════════════════════════════

"SISTEMAS IMPOSSÍVEIS DE QUEBRAR."

                    — Security Fortress, Level 13
`;

export function shouldEnableSecurityFortress(prompt: string): boolean {
  const keywords = [
    'segurança', 'security', 'proteção', 'protection',
    'autenticação', 'authentication', 'auth',
    'criptografia', 'encryption', 'encrypt',
    'owasp', 'pentest', 'vulnerabilidade', 'vulnerability',
    'firewall', 'waf', 'ddos', 'injection', 'xss', 'csrf',
    'zero trust', 'vault', 'secrets', 'token', 'jwt',
    'ssl', 'tls', 'https', 'certificado',
    'hash', 'bcrypt', 'argon', 'senha', 'password'
  ];
  const promptLower = prompt.toLowerCase();
  return keywords.some(kw => promptLower.includes(kw));
}

export default SECURITY_FORTRESS_MANIFEST;
