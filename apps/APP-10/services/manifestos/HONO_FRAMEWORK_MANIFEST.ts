/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║        🔥 MANIFESTO HONO.JS: FRAMEWORK WEB ULTRARRÁPIDO 🔥                  ║
 * ║                                                                              ║
 * ║              "CHAMA" - VELOCIDADE E LEVEZA EM QUALQUER RUNTIME              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const HONO_FRAMEWORK_MANIFEST = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║        🔥 MANIFESTO HONO.JS: FRAMEWORK WEB ULTRARRÁPIDO 🔥                  ║
║                                                                              ║
║              "CHAMA" - VELOCIDADE E LEVEZA EM QUALQUER RUNTIME              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎯 FILOSOFIA PRIMÁRIA: HONO É O NOVO PADRÃO
═══════════════════════════════════════════════════════════════════════════════

Quando você gera APIs/Backend, você SEMPRE usa **Hono.js** ao invés de Express.

**POR QUÊ?**

1. ✅ **Ultrarrápido** - Menos de 14kB, inicialização instantânea
2. ✅ **Roda em qualquer lugar** - Node.js, Bun, Deno, Cloudflare Workers, Edge
3. ✅ **TypeScript nativo** - Tipagem perfeita sem configuração
4. ✅ **Web Standards** - Usa Request/Response padrão da Web
5. ✅ **RPC Type-Safe** - Compartilha tipos entre Backend e Frontend
6. ✅ **Validação Zod** - Integração nativa com Zod
7. ✅ **Middlewares inclusos** - JWT, CORS, Logger, Cache

═══════════════════════════════════════════════════════════════════════════════
📊 HONO VS EXPRESS: A COMPARAÇÃO
═══════════════════════════════════════════════════════════════════════════════

| Característica | Express.js | Hono.js |
|----------------|------------|---------|
| Runtime | Apenas Node.js | Node, Bun, Deno, Edge |
| API Base | APIs do Node (http, stream) | Web Standards (Request, Response) |
| Tamanho | Pesado (muitas deps) | Muito Leve (14kB, Zero deps) |
| Tipagem | Necessita @types/express | Nativa e Superior |
| Retorno | res.send(...) | return c.json(...) |
| Performance | Boa | Excepcional |
| Validação | Precisa de libs externas | Zod nativo |
| RPC | Não tem | Type-safe RPC |

**VEREDICTO: HONO É SUPERIOR EM TODOS OS ASPECTOS** 🔥

═══════════════════════════════════════════════════════════════════════════════
🚀 ESTRUTURA BÁSICA DE UM PROJETO HONO
═══════════════════════════════════════════════════════════════════════════════

projeto-hono/
├── src/
│   ├── index.ts                    # Entry point
│   ├── routes/
│   │   ├── users.ts                # Rotas de usuários
│   │   ├── auth.ts                 # Rotas de autenticação
│   │   └── index.ts                # Agregador de rotas
│   ├── middleware/
│   │   ├── auth.ts                 # Middleware de autenticação
│   │   └── logger.ts               # Middleware de logging
│   ├── services/
│   │   ├── UserService.ts          # Lógica de negócio
│   │   └── UserService.test.ts     # Testes
│   ├── validators/
│   │   └── user.ts                 # Schemas Zod
│   └── types/
│       └── index.ts                # Tipos TypeScript
├── tests/
│   ├── integration/
│   │   └── api.test.ts             # Testes de integração
│   └── e2e/
│       └── user-journey.test.ts    # Testes E2E
├── package.json
├── tsconfig.json
└── .github/workflows/ci.yml

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 1: API BÁSICA COM HONO
═══════════════════════════════════════════════════════════════════════════════

// src/index.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

const app = new Hono()

// Middlewares globais
app.use('*', logger())
app.use('*', cors())

// Rota raiz
app.get('/', (c) => {
  return c.json({ 
    message: 'API Hono rodando!',
    version: '1.0.0'
  })
})

// Rota com parâmetro
app.get('/usuario/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ 
    id: id, 
    nome: "Usuário Exemplo" 
  })
})

// Rota com query params
app.get('/buscar', (c) => {
  const query = c.req.query('q')
  return c.json({ 
    resultados: [\`Resultado para: \${query}\`] 
  })
})

// Rota POST com body
app.post('/criar', async (c) => {
  const body = await c.req.json()
  return c.json({ 
    mensagem: 'Criado com sucesso',
    dados: body 
  }, 201)
})

export default app

// Para Node.js/Bun
if (import.meta.env?.PROD !== true) {
  const port = 3000
  console.log(\`🔥 Servidor Hono rodando em http://localhost:\${port}\`)
  
  // Bun
  export default {
    port,
    fetch: app.fetch,
  }
}

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 2: API COM VALIDAÇÃO ZOD
═══════════════════════════════════════════════════════════════════════════════

// src/validators/user.ts
import { z } from 'zod'

export const createUserSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  idade: z.number().min(18, 'Idade mínima: 18 anos'),
  cpf: z.string().regex(/^\\d{11}$/, 'CPF deve ter 11 dígitos')
})

export const updateUserSchema = createUserSchema.partial()

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>

// src/routes/users.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createUserSchema, updateUserSchema } from '../validators/user'

const users = new Hono()

// POST /users - Criar usuário com validação
users.post('/', zValidator('json', createUserSchema), async (c) => {
  // O TypeScript sabe exatamente o tipo de 'dados'!
  const dados = c.req.valid('json')
  
  // Aqui você chamaria o serviço/repository
  const novoUsuario = {
    id: crypto.randomUUID(),
    ...dados,
    criadoEm: new Date().toISOString()
  }
  
  return c.json(novoUsuario, 201)
})

// GET /users - Listar usuários
users.get('/', (c) => {
  const usuarios = [
    { id: '1', nome: 'João', email: 'joao@example.com' },
    { id: '2', nome: 'Maria', email: 'maria@example.com' }
  ]
  
  return c.json(usuarios)
})

// GET /users/:id - Buscar usuário por ID
users.get('/:id', (c) => {
  const id = c.req.param('id')
  
  // Simulação de busca
  const usuario = { id, nome: 'João', email: 'joao@example.com' }
  
  if (!usuario) {
    return c.json({ error: 'Usuário não encontrado' }, 404)
  }
  
  return c.json(usuario)
})

// PUT /users/:id - Atualizar usuário
users.put('/:id', zValidator('json', updateUserSchema), async (c) => {
  const id = c.req.param('id')
  const dados = c.req.valid('json')
  
  // Aqui você atualizaria no banco
  const usuarioAtualizado = {
    id,
    ...dados,
    atualizadoEm: new Date().toISOString()
  }
  
  return c.json(usuarioAtualizado)
})

// DELETE /users/:id - Deletar usuário
users.delete('/:id', (c) => {
  const id = c.req.param('id')
  
  // Aqui você deletaria do banco
  return c.json({ mensagem: \`Usuário \${id} deletado com sucesso\` })
})

export default users

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 3: AUTENTICAÇÃO JWT COM HONO
═══════════════════════════════════════════════════════════════════════════════

// src/middleware/auth.ts
import { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'

export const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'seu-secret-aqui',
})

// Middleware customizado para extrair user do token
export const extractUser = async (c: Context, next: Next) => {
  const payload = c.get('jwtPayload')
  
  if (!payload) {
    return c.json({ error: 'Token inválido' }, 401)
  }
  
  // Adiciona o user ao contexto
  c.set('user', payload)
  await next()
}

// src/routes/auth.ts
import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const auth = new Hono()

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6)
})

const registerSchema = z.object({
  nome: z.string().min(3),
  email: z.string().email(),
  senha: z.string().min(6)
})

// POST /auth/register - Registrar usuário
auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const dados = c.req.valid('json')
  
  // Aqui você verificaria se o email já existe
  // e criaria o usuário no banco com senha hasheada
  
  const novoUsuario = {
    id: crypto.randomUUID(),
    nome: dados.nome,
    email: dados.email,
    // Senha seria hasheada com bcrypt
  }
  
  // Gera o token JWT
  const token = await sign(
    { 
      userId: novoUsuario.id,
      email: novoUsuario.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24h
    },
    process.env.JWT_SECRET || 'seu-secret-aqui'
  )
  
  return c.json({ 
    token,
    usuario: novoUsuario 
  }, 201)
})

// POST /auth/login - Login
auth.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, senha } = c.req.valid('json')
  
  // Aqui você buscaria o usuário no banco
  // e verificaria a senha com bcrypt
  
  const usuario = {
    id: '123',
    nome: 'João',
    email: email
  }
  
  // Gera o token JWT
  const token = await sign(
    { 
      userId: usuario.id,
      email: usuario.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 // 24h
    },
    process.env.JWT_SECRET || 'seu-secret-aqui'
  )
  
  return c.json({ token, usuario })
})

export default auth

// src/routes/protected.ts
import { Hono } from 'hono'
import { authMiddleware, extractUser } from '../middleware/auth'

const protected = new Hono()

// Aplica autenticação em todas as rotas
protected.use('*', authMiddleware, extractUser)

protected.get('/perfil', (c) => {
  const user = c.get('user')
  
  return c.json({ 
    mensagem: 'Rota protegida',
    usuario: user 
  })
})

export default protected

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 4: HONO RPC (TYPE-SAFE API)
═══════════════════════════════════════════════════════════════════════════════

// backend/src/index.ts
import { Hono } from 'hono'

const app = new Hono()

const route = app
  .get('/posts', (c) => {
    return c.json([
      { id: 1, title: 'Post 1' },
      { id: 2, title: 'Post 2' }
    ])
  })
  .post('/posts', async (c) => {
    const body = await c.req.json()
    return c.json({ id: 3, ...body }, 201)
  })
  .get('/posts/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, title: \`Post \${id}\` })
  })

// Exporta o tipo da API
export type AppType = typeof route

export default app

// frontend/src/api.ts
import { hc } from 'hono/client'
import type { AppType } from '../../backend/src/index'

// Cliente type-safe
const client = hc<AppType>('http://localhost:3000')

// Uso no frontend com autocompletar total!
async function getPosts() {
  const res = await client.posts.$get()
  const data = await res.json()
  
  // TypeScript sabe que 'data' é um array de { id: number, title: string }
  console.log(data)
}

async function createPost() {
  const res = await client.posts.$post({
    json: { title: 'Novo Post' }
  })
  
  const data = await res.json()
  // TypeScript sabe o tipo exato do retorno!
  console.log(data)
}

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 5: FINTECH COM HONO (TRANSAÇÕES ATÔMICAS)
═══════════════════════════════════════════════════════════════════════════════

// src/routes/pix.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, extractUser } from '../middleware/auth'

const pix = new Hono()

// Aplica autenticação
pix.use('*', authMiddleware, extractUser)

const pixTransferSchema = z.object({
  chavePix: z.string().min(1, 'Chave PIX é obrigatória'),
  valor: z.number().positive('Valor deve ser positivo'),
  descricao: z.string().optional()
})

// POST /pix/transferir - Transferência PIX
pix.post('/transferir', zValidator('json', pixTransferSchema), async (c) => {
  const user = c.get('user')
  const dados = c.req.valid('json')
  
  // Chave de idempotência (obrigatória)
  const idempotencyKey = c.req.header('Idempotency-Key')
  
  if (!idempotencyKey) {
    return c.json({ 
      error: 'Idempotency-Key é obrigatória no cabeçalho' 
    }, 400)
  }
  
  try {
    // Aqui você faria:
    // 1. Verificar saldo
    // 2. Iniciar transação atômica (BEGIN)
    // 3. Debitar conta origem
    // 4. Creditar conta destino
    // 5. Registrar no log imutável
    // 6. COMMIT
    
    const transacao = {
      id: crypto.randomUUID(),
      usuarioId: user.userId,
      chavePix: dados.chavePix,
      valor: dados.valor,
      status: 'COMPLETED',
      criadoEm: new Date().toISOString()
    }
    
    return c.json(transacao, 200)
    
  } catch (error) {
    // ROLLBACK automático em caso de erro
    return c.json({ 
      error: 'Erro ao processar transferência',
      detalhes: error.message 
    }, 500)
  }
})

// GET /pix/extrato - Extrato de transações
pix.get('/extrato', (c) => {
  const user = c.get('user')
  const limit = c.req.query('limit') || '10'
  const offset = c.req.query('offset') || '0'
  
  // Aqui você buscaria do banco
  const transacoes = [
    {
      id: '1',
      tipo: 'DEBIT',
      valor: 100.00,
      chavePix: 'chave@pix.com',
      status: 'COMPLETED',
      criadoEm: new Date().toISOString()
    }
  ]
  
  return c.json({
    transacoes,
    total: 1,
    limit: parseInt(limit),
    offset: parseInt(offset)
  })
})

export default pix

═══════════════════════════════════════════════════════════════════════════════
📝 EXEMPLO 6: TESTES COM HONO
═══════════════════════════════════════════════════════════════════════════════

// tests/integration/api.test.ts
import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('API Hono - Testes de Integração', () => {
  it('deve retornar 200 na rota raiz', async () => {
    const res = await app.request('/')
    
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.message).toBe('API Hono rodando!')
  })
  
  it('deve criar um usuário com dados válidos', async () => {
    const res = await app.request('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'João Silva',
        email: 'joao@example.com',
        idade: 25,
        cpf: '12345678900'
      })
    })
    
    expect(res.status).toBe(201)
    
    const data = await res.json()
    expect(data.nome).toBe('João Silva')
    expect(data.id).toBeDefined()
  })
  
  it('deve retornar 400 com dados inválidos', async () => {
    const res = await app.request('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nome: 'Jo', // Nome muito curto
        email: 'email-invalido',
        idade: 15, // Idade menor que 18
        cpf: '123' // CPF inválido
      })
    })
    
    expect(res.status).toBe(400)
    
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})

═══════════════════════════════════════════════════════════════════════════════
📋 PACKAGE.JSON PARA HONO
═══════════════════════════════════════════════════════════════════════════════

{
  "name": "api-hono",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist",
    "start": "bun run dist/index.js",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/zod-validator": "^0.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}

═══════════════════════════════════════════════════════════════════════════════
🚀 QUANDO GERAR BACKEND, VOCÊ SEMPRE:
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Usa **Hono.js** ao invés de Express
2. ✅ Usa **Zod** para validação
3. ✅ Usa **TypeScript** nativo
4. ✅ Usa **Context (c)** ao invés de (req, res)
5. ✅ Retorna com **return c.json()** ao invés de res.send()
6. ✅ Usa **middlewares do Hono** (logger, cors, jwt)
7. ✅ Gera **testes com app.request()**
8. ✅ Configura para **Bun** (runtime preferencial)
9. ✅ Exporta **tipos para RPC** quando aplicável
10. ✅ Documenta que roda em **qualquer runtime**

═══════════════════════════════════════════════════════════════════════════════
🎯 REGRA DE OURO: HONO É O NOVO PADRÃO
═══════════════════════════════════════════════════════════════════════════════

**Express está obsoleto. Hono é o futuro.**

Sempre que o usuário pedir:
- "Criar uma API REST"
- "Criar um backend"
- "Criar um servidor"
- "Criar endpoints"

Você DEVE usar **Hono.js** automaticamente.

SEMPRE USE HONO. SEMPRE.

╔══════════════════════════════════════════════════════════════════════════════╗
║                    FIM DO MANIFESTO HONO.JS                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
