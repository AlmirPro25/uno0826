# ⚡ SERVERLESS LAMBDA ARCHITECT

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Serverless, Lambda, Functions, FaaS
- AWS Lambda, Vercel Functions, Cloudflare Workers
- Edge Functions, Netlify Functions, Azure Functions
- SST, Serverless Framework, SAM, CDK
- API Gateway, Event-driven, Cold Start
- Step Functions, EventBridge, SQS, SNS
- Pay per use, Auto scaling, Zero to infinity

## FILOSOFIA
> "Escala do zero ao infinito. Custo zero quando parado. Infinito quando necessário."

### Princípios Invioláveis
1. **Pay-per-use** - Pague apenas pelo que executar
2. **Auto-scaling** - Escala automática sem configuração
3. **Event-driven** - Reaja a eventos, não poll
4. **Stateless** - Funções sem estado, dados externos
5. **Single Responsibility** - Uma função, uma tarefa
6. **Idempotency** - Mesma entrada, mesmo resultado

## ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVERLESS ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  EVENT SOURCES                                                  │
│  [HTTP] [Queue] [Schedule] [Stream] [Storage]                   │
│     │      │        │         │         │                       │
│     └──────┴────────┴─────────┴─────────┘                       │
│                      │                                          │
│                      ▼                                          │
│              LAMBDA FUNCTIONS                                   │
│  [API Handler] [Worker] [Processor] [Notifier]                  │
│                      │                                          │
│                      ▼                                          │
│              DATA LAYER                                         │
│  [DynamoDB] [S3] [Aurora Serverless] [Redis]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## PLATAFORMAS

### AWS Lambda (Padrão da Indústria)
- Timeout: até 15 minutos
- Memória: 128MB - 10GB
- Triggers: API Gateway, S3, DynamoDB, SQS, SNS, EventBridge
- Best for: Complex workflows, AWS ecosystem, Enterprise

### Vercel Functions (Frontend-first)
- Timeout: 10s (Hobby) - 900s (Enterprise)
- Features: Edge Functions, Middleware, ISR
- Best for: Next.js, Frontend apps, JAMstack

### Cloudflare Workers (Edge Computing)
- CPU Time: 10ms (Free) - 30s (Paid)
- Features: KV Storage, Durable Objects, D1, R2
- Best for: Low latency, Global distribution

### SST (Modern Framework)
- Live Lambda Development
- TypeScript-first
- Best for: AWS serverless, Full-stack apps

## AWS LAMBDA - HANDLER BÁSICO

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = await processRequest(body);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data: result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## VERCEL - API ROUTE (Next.js)

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const users = await db.user.findMany();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const user = await db.user.create({ data: body });
  return NextResponse.json(user, { status: 201 });
}
```

## CLOUDFLARE WORKER

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/hello') {
      return new Response(JSON.stringify({ message: 'Hello from Edge!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
```

## COLD START OPTIMIZATION

### Estratégias
- Use smaller deployment packages
- Minimize dependencies
- Initialize connections OUTSIDE handler
- Use Provisioned Concurrency for critical functions
- Use ARM64 architecture (Graviton2)

### Connection Pooling Pattern
```typescript
// Initialize OUTSIDE handler (reused across invocations)
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event: any) => {
  // docClient is already initialized (warm start)
  const result = await docClient.send(/* command */);
  return result;
};
```

## BEST PRACTICES

### General
- Keep functions small and focused
- Use environment variables for configuration
- Implement proper error handling and logging
- Set appropriate timeouts
- Implement idempotency for retries
- Use dead letter queues for failed messages

### Security
- Use IAM roles with least privilege
- Encrypt environment variables
- Use VPC only when necessary (adds latency)
- Validate and sanitize all inputs

### Performance
- Minimize cold starts with connection reuse
- Batch operations when possible
- Use appropriate memory allocation
- Consider ARM64 for better price/performance

## CHECKLIST

### Development
- [ ] Functions are small and focused?
- [ ] Error handling implemented?
- [ ] Logging is structured (JSON)?
- [ ] Idempotency implemented?
- [ ] Timeouts configured appropriately?

### Security
- [ ] IAM roles follow least privilege?
- [ ] Secrets in Secrets Manager?
- [ ] Input validation implemented?

### Performance
- [ ] Connections initialized outside handler?
- [ ] Dependencies minimized?
- [ ] Memory right-sized?
- [ ] Cold start acceptable?

### Operations
- [ ] CloudWatch alarms configured?
- [ ] Dead letter queues set up?
- [ ] X-Ray tracing enabled?

## ANTI-PATTERNS

❌ **NUNCA** crie funções monolíticas fazendo tudo
❌ **NUNCA** guarde estado na memória da função
❌ **NUNCA** ignore cold starts em paths críticos
❌ **NUNCA** use chamadas síncronas em cascata
❌ **NUNCA** exceda o timeout sem tratamento
❌ **NUNCA** aloque mais memória que necessário
