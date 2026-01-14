/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      ⚡ SERVERLESS LAMBDA ARCHITECT - O ARQUITETO DO INFINITO ⚡             ║
 * ║                                                                              ║
 * ║         "Escala do zero ao infinito. Pague apenas pelo que usar."           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Manifesto completo para arquiteturas Serverless e Functions as a Service.
 * Suporta: AWS Lambda, Vercel Functions, Cloudflare Workers, SST, Serverless Framework
 * 
 * @author Micro SaaS Factory
 * @version 1.0.0
 */

export const SERVERLESS_LAMBDA_ARCHITECT_MANIFEST = {
  id: 'serverless-lambda-architect',
  name: 'Serverless Lambda Architect',
  version: '1.0.0',
  description: 'Especialista em arquiteturas Serverless que escalam do zero ao infinito',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PALAVRAS-CHAVE PARA ATIVAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════
  keywords: [
    'serverless', 'lambda', 'functions', 'faas', 'function as a service',
    'aws lambda', 'vercel functions', 'cloudflare workers', 'edge functions',
    'netlify functions', 'azure functions', 'google cloud functions',
    'sst', 'serverless framework', 'sam', 'cdk',
    'api gateway', 'event-driven', 'cold start', 'warm start',
    'step functions', 'eventbridge', 'sqs', 'sns', 'dynamodb streams',
    'pay per use', 'auto scaling', 'zero to infinity',
    'edge computing', 'durable objects', 'kv storage'
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILOSOFIA
  // ═══════════════════════════════════════════════════════════════════════════════
  philosophy: {
    core: 'Escala do zero ao infinito. Custo zero quando parado. Infinito quando necessário.',
    principles: [
      'Pay-per-use - Pague apenas pelo que executar',
      'Auto-scaling - Escala automática sem configuração',
      'Event-driven - Reaja a eventos, não poll',
      'Stateless - Funções sem estado, dados externos',
      'Single Responsibility - Uma função, uma tarefa',
      'Idempotency - Mesma entrada, mesmo resultado',
      'Graceful Degradation - Falhe elegantemente'
    ],
    antiPatterns: [
      'Monolithic functions - Funções gigantes fazendo tudo',
      'Synchronous chains - Chamadas síncronas em cascata',
      'Cold start ignorance - Ignorar tempo de inicialização',
      'State in memory - Guardar estado na função',
      'Long-running tasks - Tarefas que excedem timeout',
      'Over-provisioning - Alocar mais memória que necessário'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ARQUITETURA
  // ═══════════════════════════════════════════════════════════════════════════════
  architecture: `
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      SERVERLESS ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         EVENT SOURCES                                   │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │   │
│  │  │  HTTP   │  │  Queue  │  │ Schedule│  │ Stream  │  │ Storage │       │   │
│  │  │API Gate │  │SQS/SNS  │  │CloudWatch│ │DynamoDB │  │   S3    │       │   │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘       │   │
│  └───────┼────────────┼────────────┼────────────┼────────────┼────────────┘   │
│          │            │            │            │            │                │
│          └────────────┴────────────┴────────────┴────────────┘                │
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         LAMBDA FUNCTIONS                                │   │
│  │                                                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  API        │  │  Worker     │  │  Processor  │  │  Notifier   │    │   │
│  │  │  Handler    │  │  Function   │  │  Function   │  │  Function   │    │   │
│  │  │  (REST)     │  │  (Queue)    │  │  (Stream)   │  │  (Event)    │    │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │   │
│  └─────────┼────────────────┼────────────────┼────────────────┼───────────┘   │
│            │                │                │                │               │
│            └────────────────┴────────────────┴────────────────┘               │
│                                    │                                          │
│                                    ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  DynamoDB   │  │    S3       │  │   Aurora    │  │   Redis     │    │   │
│  │  │  (NoSQL)    │  │  (Objects)  │  │ Serverless  │  │ (ElastiCache│    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    ORCHESTRATION (Step Functions)                       │   │
│  │                                                                         │   │
│  │  [Start] ──▶ [Validate] ──▶ [Process] ──▶ [Notify] ──▶ [End]           │   │
│  │                  │              │                                       │   │
│  │                  ▼              ▼                                       │   │
│  │              [Error]        [Retry]                                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
`,

  // ═══════════════════════════════════════════════════════════════════════════════
  // PLATAFORMAS SERVERLESS
  // ═══════════════════════════════════════════════════════════════════════════════
  platforms: {
    awsLambda: {
      name: 'AWS Lambda',
      description: 'O padrão da indústria para serverless',
      limits: {
        timeout: '15 minutes',
        memory: '128MB - 10GB',
        payload: '6MB sync, 256KB async',
        concurrency: '1000 default (can increase)',
        deploymentPackage: '50MB zipped, 250MB unzipped'
      },
      triggers: [
        'API Gateway', 'ALB', 'S3', 'DynamoDB Streams', 'Kinesis',
        'SQS', 'SNS', 'EventBridge', 'CloudWatch Events', 'Cognito',
        'IoT', 'Alexa', 'Step Functions'
      ],
      runtimes: ['nodejs20.x', 'python3.12', 'java21', 'dotnet8', 'go1.x', 'ruby3.3', 'custom'],
      pricing: '$0.20 per 1M requests + $0.0000166667 per GB-second',
      bestFor: ['Complex workflows', 'AWS ecosystem', 'Enterprise']
    },
    vercelFunctions: {
      name: 'Vercel Functions',
      description: 'Serverless otimizado para frontend',
      limits: {
        timeout: '10s (Hobby), 60s (Pro), 900s (Enterprise)',
        memory: '1024MB default',
        payload: '4.5MB',
        regions: 'Multiple edge regions'
      },
      features: ['Edge Functions', 'Middleware', 'ISR', 'Image Optimization'],
      runtimes: ['Node.js', 'Go', 'Python', 'Ruby'],
      pricing: 'Free tier generous, then usage-based',
      bestFor: ['Next.js', 'Frontend apps', 'JAMstack']
    },
    cloudflareWorkers: {
      name: 'Cloudflare Workers',
      description: 'Edge computing ultrarrápido',
      limits: {
        cpuTime: '10ms (Free), 30s (Paid)',
        memory: '128MB',
        scriptSize: '1MB (Free), 10MB (Paid)',
        subrequests: '50 (Free), 1000 (Paid)'
      },
      features: ['KV Storage', 'Durable Objects', 'R2 Storage', 'D1 Database', 'Queues'],
      runtime: 'V8 Isolates (not Node.js)',
      pricing: 'Free: 100K requests/day, Paid: $5/month + usage',
      bestFor: ['Edge computing', 'Low latency', 'Global distribution']
    },
    sst: {
      name: 'SST (Serverless Stack)',
      description: 'Framework moderno para AWS serverless',
      features: [
        'Live Lambda Development',
        'TypeScript-first',
        'Constructs for common patterns',
        'Console for debugging',
        'OpenNext for Next.js'
      ],
      constructs: ['Api', 'Function', 'Cron', 'Queue', 'Topic', 'Table', 'Bucket', 'Auth'],
      bestFor: ['AWS serverless', 'TypeScript projects', 'Full-stack apps']
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // AWS LAMBDA TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════════
  awsLambdaTemplates: {
    basicHandler: `// ═══════════════════════════════════════════════════════════════
// AWS LAMBDA - Basic Handler (TypeScript)
// ═══════════════════════════════════════════════════════════════
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Log for debugging (goes to CloudWatch)
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    
    // Your business logic here
    const result = await processRequest(body);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: result,
        requestId: context.awsRequestId,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal Server Error',
      }),
    };
  }
};

async function processRequest(body: any): Promise<any> {
  // Implement your logic
  return { processed: true };
}`,

    sqsHandler: `// ═══════════════════════════════════════════════════════════════
// AWS LAMBDA - SQS Queue Handler
// ═══════════════════════════════════════════════════════════════
import { SQSEvent, SQSRecord, Context } from 'aws-lambda';

interface QueueMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export const handler = async (event: SQSEvent, context: Context): Promise<void> => {
  console.log(\`Processing \${event.Records.length} messages\`);
  
  // Process messages in parallel with error handling
  const results = await Promise.allSettled(
    event.Records.map(record => processMessage(record))
  );
  
  // Check for failures (for partial batch failure)
  const failures = results.filter(r => r.status === 'rejected');
  
  if (failures.length > 0) {
    console.error(\`\${failures.length} messages failed\`);
    // With partial batch failure enabled, throw to retry failed messages
    throw new Error(\`Failed to process \${failures.length} messages\`);
  }
  
  console.log('All messages processed successfully');
};

async function processMessage(record: SQSRecord): Promise<void> {
  const message: QueueMessage = JSON.parse(record.body);
  
  console.log(\`Processing message: \${message.type}\`);
  
  switch (message.type) {
    case 'ORDER_CREATED':
      await handleOrderCreated(message.payload);
      break;
    case 'USER_REGISTERED':
      await handleUserRegistered(message.payload);
      break;
    default:
      console.warn(\`Unknown message type: \${message.type}\`);
  }
}

async function handleOrderCreated(payload: any): Promise<void> {
  // Process order
}

async function handleUserRegistered(payload: any): Promise<void> {
  // Send welcome email, etc.
}`,

    dynamoDBStream: `// ═══════════════════════════════════════════════════════════════
// AWS LAMBDA - DynamoDB Stream Handler
// ═══════════════════════════════════════════════════════════════
import { DynamoDBStreamEvent, DynamoDBRecord, Context } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context
): Promise<void> => {
  console.log(\`Processing \${event.Records.length} stream records\`);
  
  for (const record of event.Records) {
    await processRecord(record);
  }
};

async function processRecord(record: DynamoDBRecord): Promise<void> {
  const eventName = record.eventName; // INSERT, MODIFY, REMOVE
  
  // Unmarshall DynamoDB format to regular JS objects
  const newImage = record.dynamodb?.NewImage 
    ? unmarshall(record.dynamodb.NewImage as any) 
    : null;
  const oldImage = record.dynamodb?.OldImage 
    ? unmarshall(record.dynamodb.OldImage as any) 
    : null;
  
  console.log(\`Event: \${eventName}\`, { newImage, oldImage });
  
  switch (eventName) {
    case 'INSERT':
      await handleInsert(newImage);
      break;
    case 'MODIFY':
      await handleModify(oldImage, newImage);
      break;
    case 'REMOVE':
      await handleRemove(oldImage);
      break;
  }
}

async function handleInsert(item: any): Promise<void> {
  // Sync to Elasticsearch, send notification, etc.
}

async function handleModify(oldItem: any, newItem: any): Promise<void> {
  // Detect changes and react
}

async function handleRemove(item: any): Promise<void> {
  // Cleanup related data
}`,

    scheduledCron: `// ═══════════════════════════════════════════════════════════════
// AWS LAMBDA - Scheduled/Cron Handler
// ═══════════════════════════════════════════════════════════════
import { ScheduledEvent, Context } from 'aws-lambda';

export const handler = async (
  event: ScheduledEvent,
  context: Context
): Promise<void> => {
  console.log('Scheduled task started:', event.time);
  
  try {
    // Run your scheduled tasks
    await Promise.all([
      cleanupExpiredSessions(),
      sendDailyReports(),
      syncExternalData(),
    ]);
    
    console.log('Scheduled task completed successfully');
  } catch (error) {
    console.error('Scheduled task failed:', error);
    // Optionally send alert to SNS/Slack
    throw error;
  }
};

async function cleanupExpiredSessions(): Promise<void> {
  console.log('Cleaning up expired sessions...');
  // Delete sessions older than 24 hours
}

async function sendDailyReports(): Promise<void> {
  console.log('Sending daily reports...');
  // Generate and email reports
}

async function syncExternalData(): Promise<void> {
  console.log('Syncing external data...');
  // Fetch and update from external APIs
}`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // VERCEL FUNCTIONS TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════════
  vercelTemplates: {
    apiRoute: `// ═══════════════════════════════════════════════════════════════
// VERCEL - API Route (Next.js App Router)
// ═══════════════════════════════════════════════════════════════
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  
  try {
    const users = await db.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return NextResponse.json({ users, page, limit });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateUserSchema.parse(body);
    
    const user = await db.user.create({
      data: validated,
    });
    
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}`,

    edgeFunction: `// ═══════════════════════════════════════════════════════════════
// VERCEL - Edge Function (Ultra-low latency)
// ═══════════════════════════════════════════════════════════════
// app/api/geo/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Run on edge network

export async function GET(request: NextRequest) {
  // Access geo data from edge
  const country = request.geo?.country || 'Unknown';
  const city = request.geo?.city || 'Unknown';
  const region = request.geo?.region || 'Unknown';
  
  // Access IP
  const ip = request.ip || 'Unknown';
  
  return NextResponse.json({
    ip,
    location: { country, city, region },
    timestamp: new Date().toISOString(),
  });
}`,

    middleware: `// ═══════════════════════════════════════════════════════════════
// VERCEL - Middleware (Edge)
// ═══════════════════════════════════════════════════════════════
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get pathname
  const pathname = request.nextUrl.pathname;
  
  // Auth check for protected routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth-token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Geo-based routing
  const country = request.geo?.country || 'US';
  if (pathname === '/' && country === 'BR') {
    return NextResponse.redirect(new URL('/br', request.url));
  }
  
  // Add custom headers
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'my-value');
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLOUDFLARE WORKERS TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════════
  cloudflareTemplates: {
    basicWorker: `// ═══════════════════════════════════════════════════════════════
// CLOUDFLARE WORKER - Basic Handler
// ═══════════════════════════════════════════════════════════════
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Router
    if (url.pathname === '/api/hello') {
      return handleHello(request);
    }
    
    if (url.pathname.startsWith('/api/users')) {
      return handleUsers(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  },
};

async function handleHello(request: Request): Promise<Response> {
  return new Response(JSON.stringify({ message: 'Hello from the Edge!' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleUsers(request: Request, env: Env): Promise<Response> {
  // Use KV storage
  const users = await env.USERS_KV.get('all-users', 'json');
  
  return new Response(JSON.stringify(users || []), {
    headers: { 'Content-Type': 'application/json' },
  });
}

interface Env {
  USERS_KV: KVNamespace;
  DB: D1Database;
}`,

    durableObject: `// ═══════════════════════════════════════════════════════════════
// CLOUDFLARE - Durable Object (Stateful Edge)
// ═══════════════════════════════════════════════════════════════
export class Counter {
  private state: DurableObjectState;
  private value: number = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    // Load persisted value
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<number>('value');
      this.value = stored || 0;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/increment':
        this.value++;
        await this.state.storage.put('value', this.value);
        break;
      case '/decrement':
        this.value--;
        await this.state.storage.put('value', this.value);
        break;
    }
    
    return new Response(JSON.stringify({ value: this.value }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Worker that uses the Durable Object
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const id = env.COUNTER.idFromName('global-counter');
    const counter = env.COUNTER.get(id);
    return counter.fetch(request);
  },
};`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SST (SERVERLESS STACK) TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════════
  sstTemplates: {
    sstConfig: `// ═══════════════════════════════════════════════════════════════
// SST - Configuration (sst.config.ts)
// ═══════════════════════════════════════════════════════════════
import { SSTConfig } from 'sst';
import { API } from './stacks/API';
import { Database } from './stacks/Database';
import { Auth } from './stacks/Auth';

export default {
  config(_input) {
    return {
      name: 'my-serverless-app',
      region: 'us-east-1',
    };
  },
  stacks(app) {
    // Order matters - dependencies first
    app.stack(Database);
    app.stack(Auth);
    app.stack(API);
  },
} satisfies SSTConfig;`,

    apiStack: `// ═══════════════════════════════════════════════════════════════
// SST - API Stack
// ═══════════════════════════════════════════════════════════════
import { Api, StackContext, use } from 'sst/constructs';
import { Database } from './Database';

export function API({ stack }: StackContext) {
  const { table } = use(Database);

  const api = new Api(stack, 'Api', {
    defaults: {
      function: {
        bind: [table],
        environment: {
          TABLE_NAME: table.tableName,
        },
      },
    },
    routes: {
      'GET /users': 'packages/functions/src/users/list.handler',
      'GET /users/{id}': 'packages/functions/src/users/get.handler',
      'POST /users': 'packages/functions/src/users/create.handler',
      'PUT /users/{id}': 'packages/functions/src/users/update.handler',
      'DELETE /users/{id}': 'packages/functions/src/users/delete.handler',
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });

  return { api };
}`,

    databaseStack: `// ═══════════════════════════════════════════════════════════════
// SST - Database Stack (DynamoDB)
// ═══════════════════════════════════════════════════════════════
import { Table, StackContext } from 'sst/constructs';

export function Database({ stack }: StackContext) {
  const table = new Table(stack, 'Users', {
    fields: {
      pk: 'string',
      sk: 'string',
      gsi1pk: 'string',
      gsi1sk: 'string',
    },
    primaryIndex: { partitionKey: 'pk', sortKey: 'sk' },
    globalIndexes: {
      gsi1: { partitionKey: 'gsi1pk', sortKey: 'gsi1sk' },
    },
    stream: 'new_and_old_images',
  });

  return { table };
}`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // COLD START OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════════════════
  coldStartOptimization: {
    strategies: [
      'Use smaller deployment packages',
      'Minimize dependencies',
      'Use Provisioned Concurrency for critical functions',
      'Initialize connections outside handler',
      'Use Lambda SnapStart (Java)',
      'Choose appropriate memory size',
      'Use ARM64 architecture (Graviton2)'
    ],
    
    connectionPooling: `// ═══════════════════════════════════════════════════════════════
// COLD START - Connection Pooling Pattern
// ═══════════════════════════════════════════════════════════════
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize OUTSIDE handler (reused across invocations)
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Handler reuses the connection
export const handler = async (event: any) => {
  // docClient is already initialized (warm start)
  const result = await docClient.send(/* command */);
  return result;
};`,

    provisionedConcurrency: `# ═══════════════════════════════════════════════════════════════
# COLD START - Provisioned Concurrency (SAM template)
# ═══════════════════════════════════════════════════════════════
Resources:
  CriticalFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs20.x
      AutoPublishAlias: live
      ProvisionedConcurrencyConfig:
        ProvisionedConcurrentExecutions: 5`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // BEST PRACTICES
  // ═══════════════════════════════════════════════════════════════════════════════
  bestPractices: {
    general: [
      'Keep functions small and focused (Single Responsibility)',
      'Use environment variables for configuration',
      'Implement proper error handling and logging',
      'Use structured logging (JSON)',
      'Set appropriate timeouts',
      'Implement idempotency for retries',
      'Use dead letter queues for failed messages'
    ],
    security: [
      'Use IAM roles with least privilege',
      'Encrypt environment variables',
      'Use VPC only when necessary (adds latency)',
      'Validate and sanitize all inputs',
      'Use AWS Secrets Manager for sensitive data'
    ],
    performance: [
      'Minimize cold starts with connection reuse',
      'Use async/await properly',
      'Batch operations when possible',
      'Use appropriate memory allocation',
      'Consider ARM64 for better price/performance'
    ],
    cost: [
      'Right-size memory allocation',
      'Use reserved concurrency to limit costs',
      'Monitor with AWS Cost Explorer',
      'Use Savings Plans for predictable workloads',
      'Clean up unused functions and versions'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════════════
  checklist: {
    development: [
      'Functions are small and focused?',
      'Error handling implemented?',
      'Logging is structured (JSON)?',
      'Environment variables for config?',
      'Idempotency implemented?',
      'Timeouts configured appropriately?'
    ],
    security: [
      'IAM roles follow least privilege?',
      'Secrets in Secrets Manager (not env vars)?',
      'Input validation with Zod/Joi?',
      'VPC only if necessary?'
    ],
    performance: [
      'Connections initialized outside handler?',
      'Dependencies minimized?',
      'Memory right-sized?',
      'Cold start acceptable?',
      'Provisioned concurrency for critical paths?'
    ],
    operations: [
      'CloudWatch alarms configured?',
      'Dead letter queues set up?',
      'X-Ray tracing enabled?',
      'Cost monitoring in place?'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TROUBLESHOOTING
  // ═══════════════════════════════════════════════════════════════════════════════
  troubleshooting: {
    coldStarts: {
      symptoms: ['High latency on first request', 'Inconsistent response times'],
      solutions: [
        'Use Provisioned Concurrency',
        'Reduce package size',
        'Initialize outside handler',
        'Use Lambda SnapStart (Java)',
        'Consider edge functions for latency-critical'
      ]
    },
    timeouts: {
      symptoms: ['Function times out', 'Task timed out after X seconds'],
      solutions: [
        'Increase timeout setting',
        'Optimize code performance',
        'Use async patterns',
        'Break into smaller functions',
        'Use Step Functions for long workflows'
      ]
    },
    memoryErrors: {
      symptoms: ['Out of memory', 'Process exited before completing'],
      solutions: [
        'Increase memory allocation',
        'Stream large files instead of loading',
        'Process in batches',
        'Check for memory leaks'
      ]
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
export interface ServerlessConfig {
  platform: 'aws-lambda' | 'vercel' | 'cloudflare' | 'netlify';
  runtime: string;
  memory?: number;
  timeout?: number;
  environment?: Record<string, string>;
}

export interface FunctionConfig {
  name: string;
  handler: string;
  trigger: 'http' | 'queue' | 'schedule' | 'stream' | 'storage';
  memory?: number;
  timeout?: number;
}

export default SERVERLESS_LAMBDA_ARCHITECT_MANIFEST;
