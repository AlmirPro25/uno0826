/**
 * 📬 MESSAGE QUEUES MANIFEST
 * 
 * O Arquiteto de Filas - Mestre Supremo de Message Queues
 * RabbitMQ, SQS, Bull, BullMQ, Dead Letter Queues, Retry Patterns
 * 
 * "Sistemas desacoplados são sistemas resilientes.
 * Filas são a cola que mantém microsserviços unidos."
 */

export const MESSAGE_QUEUES_MANIFEST = {
  metadata: {
    id: 'message-queues-master',
    name: 'Message Queues Supreme Master',
    version: '1.0.0',
    description: 'Conhecimento completo sobre filas de mensagens, RabbitMQ, SQS, Bull/BullMQ, patterns de retry e DLQ',
    category: 'infrastructure-messaging',
    level: 16,
    tags: ['queue', 'rabbitmq', 'sqs', 'bull', 'bullmq', 'kafka', 'messaging', 'async', 'dlq'],
    activationKeywords: [
      'queue', 'fila', 'message queue', 'mensageria',
      'rabbitmq', 'rabbit', 'amqp', 'sqs', 'amazon sqs',
      'bull', 'bullmq', 'bee-queue', 'agenda',
      'kafka', 'pulsar', 'nats', 'redis queue',
      'dead letter', 'dlq', 'retry', 'backoff',
      'pub/sub', 'fanout', 'topic', 'exchange',
      'worker', 'job', 'background job', 'async processing'
    ]
  },

  philosophy: {
    core: 'Processamento assíncrono é a chave para sistemas escaláveis e resilientes.',
    principles: [
      'Desacople produtores de consumidores',
      'Idempotência é obrigatória',
      'Sempre tenha Dead Letter Queue',
      'Retry com exponential backoff',
      'Monitore lag e throughput',
      'Mensagens devem ser pequenas e serializáveis'
    ],
    quotes: [
      '"A queue is a buffer between intention and execution."',
      '"If you can\'t process it now, queue it for later."'
    ]
  },

  comparison: {
    table: `
| Feature          | RabbitMQ    | SQS         | Bull/BullMQ | Kafka       |
|------------------|-------------|-------------|-------------|-------------|
| Type             | Broker      | Managed     | Redis-based | Log-based   |
| Ordering         | Per-queue   | Best-effort | FIFO        | Per-partition|
| Persistence      | Yes         | Yes         | Redis       | Yes         |
| Throughput       | Medium      | High        | High        | Very High   |
| Complexity       | Medium      | Low         | Low         | High        |
| Best For         | Enterprise  | AWS apps    | Node.js     | Event stream|
`,
    recommendations: {
      simpleJobs: 'BullMQ (Node.js) ou SQS (AWS)',
      enterprise: 'RabbitMQ',
      eventStreaming: 'Kafka',
      serverless: 'SQS + Lambda'
    }
  },

  bullmq: {
    description: 'Fila de jobs baseada em Redis para Node.js',
    features: ['Delayed jobs', 'Rate limiting', 'Retries', 'Priorities', 'Repeatable jobs'],
    setup: `
import { Queue, Worker, QueueScheduler } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: null
});

// Criar fila
const emailQueue = new Queue('emails', { connection });

// Scheduler para delayed jobs
const scheduler = new QueueScheduler('emails', { connection });
`,
    producer: `
// Adicionar job simples
await emailQueue.add('send-welcome', {
  to: 'user@example.com',
  template: 'welcome',
  data: { name: 'John' }
});

// Job com opções
await emailQueue.add('send-newsletter', payload, {
  delay: 60000,           // Delay de 1 minuto
  attempts: 3,            // 3 tentativas
  backoff: {
    type: 'exponential',
    delay: 1000           // 1s, 2s, 4s
  },
  priority: 1,            // Maior prioridade
  removeOnComplete: 100,  // Manter últimos 100
  removeOnFail: 1000      // Manter últimos 1000 falhos
});

// Job repetitivo (cron)
await emailQueue.add('daily-digest', {}, {
  repeat: {
    pattern: '0 9 * * *'  // Todo dia às 9h
  }
});
`,
    worker: `
const worker = new Worker('emails', async (job) => {
  console.log(\`Processing job \${job.id}: \${job.name}\`);
  
  switch (job.name) {
    case 'send-welcome':
      await sendWelcomeEmail(job.data);
      break;
    case 'send-newsletter':
      await sendNewsletter(job.data);
      break;
  }
  
  return { sent: true, timestamp: Date.now() };
}, {
  connection,
  concurrency: 5,           // 5 jobs simultâneos
  limiter: {
    max: 100,               // Máximo 100 jobs
    duration: 60000         // Por minuto
  }
});

// Event handlers
worker.on('completed', (job, result) => {
  console.log(\`Job \${job.id} completed:\`, result);
});

worker.on('failed', (job, err) => {
  console.error(\`Job \${job.id} failed:\`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});
`,
    events: `
import { QueueEvents } from 'bullmq';

const queueEvents = new QueueEvents('emails', { connection });

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  console.log(\`Job \${jobId} completed with:\`, returnvalue);
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(\`Job \${jobId} failed:\`, failedReason);
});

queueEvents.on('progress', ({ jobId, data }) => {
  console.log(\`Job \${jobId} progress:\`, data);
});
`
  },

  rabbitmq: {
    description: 'Message broker enterprise com AMQP',
    concepts: {
      exchange: 'Recebe mensagens e roteia para filas',
      queue: 'Armazena mensagens até serem consumidas',
      binding: 'Regra que conecta exchange a queue',
      routingKey: 'Chave usada para roteamento'
    },
    exchangeTypes: {
      direct: 'Roteia por routing key exata',
      fanout: 'Broadcast para todas as filas',
      topic: 'Roteia por padrão (*.logs, user.#)',
      headers: 'Roteia por headers da mensagem'
    },
    setup: `
import amqp from 'amqplib';

async function connect() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  
  // Declarar exchange
  await channel.assertExchange('orders', 'topic', { durable: true });
  
  // Declarar fila
  await channel.assertQueue('order-processing', {
    durable: true,
    deadLetterExchange: 'orders-dlx',
    deadLetterRoutingKey: 'failed'
  });
  
  // Bind
  await channel.bindQueue('order-processing', 'orders', 'order.created');
  
  return { connection, channel };
}
`,
    producer: `
async function publishOrder(channel: Channel, order: Order) {
  const message = Buffer.from(JSON.stringify(order));
  
  channel.publish('orders', 'order.created', message, {
    persistent: true,           // Sobrevive restart
    contentType: 'application/json',
    messageId: order.id,
    timestamp: Date.now(),
    headers: {
      'x-retry-count': 0
    }
  });
}
`,
    consumer: `
async function consumeOrders(channel: Channel) {
  await channel.prefetch(10);  // Processar 10 por vez
  
  channel.consume('order-processing', async (msg) => {
    if (!msg) return;
    
    try {
      const order = JSON.parse(msg.content.toString());
      await processOrder(order);
      
      channel.ack(msg);  // Confirmar processamento
    } catch (error) {
      const retryCount = (msg.properties.headers['x-retry-count'] || 0) + 1;
      
      if (retryCount < 3) {
        // Requeue com retry count
        channel.publish('orders', 'order.created', msg.content, {
          ...msg.properties,
          headers: { ...msg.properties.headers, 'x-retry-count': retryCount }
        });
        channel.ack(msg);
      } else {
        // Enviar para DLQ
        channel.nack(msg, false, false);
      }
    }
  });
}
`
  },

  sqs: {
    description: 'Serviço de filas gerenciado da AWS',
    types: {
      standard: 'At-least-once, best-effort ordering, unlimited throughput',
      fifo: 'Exactly-once, strict ordering, 300 msg/s (3000 com batching)'
    },
    setup: `
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: 'us-east-1' });
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789/my-queue';
`,
    producer: `
async function sendMessage(payload: any) {
  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(payload),
    DelaySeconds: 0,
    MessageAttributes: {
      'Type': {
        DataType: 'String',
        StringValue: 'ORDER_CREATED'
      }
    },
    // Para FIFO queues:
    // MessageGroupId: 'order-group',
    // MessageDeduplicationId: orderId
  });
  
  const response = await sqs.send(command);
  return response.MessageId;
}
`,
    consumer: `
async function pollMessages() {
  const command = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,        // Long polling
    VisibilityTimeout: 30,      // Tempo para processar
    MessageAttributeNames: ['All']
  });
  
  const response = await sqs.send(command);
  
  for (const message of response.Messages || []) {
    try {
      const payload = JSON.parse(message.Body!);
      await processMessage(payload);
      
      // Deletar após sucesso
      await sqs.send(new DeleteMessageCommand({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle!
      }));
    } catch (error) {
      console.error('Failed to process:', error);
      // Mensagem volta para fila após VisibilityTimeout
    }
  }
}

// Loop de polling
async function startConsumer() {
  while (true) {
    await pollMessages();
  }
}
`,
    dlq: `
// Configurar DLQ no console AWS ou via CloudFormation:
// RedrivePolicy: {
//   deadLetterTargetArn: dlqArn,
//   maxReceiveCount: 3
// }

// Processar DLQ
async function processDLQ() {
  const messages = await receiveFromDLQ();
  
  for (const msg of messages) {
    // Analisar falha
    console.log('Failed message:', msg);
    
    // Opções:
    // 1. Corrigir e reprocessar
    // 2. Mover para storage permanente
    // 3. Alertar equipe
  }
}
`
  },

  patterns: {
    retryWithBackoff: {
      description: 'Retry com delay exponencial',
      example: `
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * Math.pow(config.multiplier, attempt - 1);
  return Math.min(delay, config.maxDelay);
}

// BullMQ config
const jobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000  // 1s, 2s, 4s, 8s, 16s
  }
};
`
    },
    deadLetterQueue: {
      description: 'Fila para mensagens que falharam múltiplas vezes',
      flow: '1. Mensagem falha N vezes → 2. Move para DLQ → 3. Análise manual/automática',
      example: `
// BullMQ - Processar jobs falhos
const failedJobs = await queue.getFailed(0, 100);

for (const job of failedJobs) {
  console.log({
    id: job.id,
    name: job.name,
    data: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade
  });
  
  // Retry manual
  await job.retry();
  
  // Ou remover
  await job.remove();
}
`
    },
    idempotency: {
      description: 'Garantir que processar a mesma mensagem múltiplas vezes tem o mesmo efeito',
      example: `
async function processOrderIdempotent(order: Order) {
  const idempotencyKey = \`order:\${order.id}\`;
  
  // Verificar se já processou
  const processed = await redis.get(idempotencyKey);
  if (processed) {
    console.log(\`Order \${order.id} already processed\`);
    return JSON.parse(processed);
  }
  
  // Processar
  const result = await processOrder(order);
  
  // Marcar como processado (com TTL)
  await redis.setex(idempotencyKey, 86400, JSON.stringify(result));
  
  return result;
}
`
    },
    priorityQueue: {
      description: 'Processar mensagens por prioridade',
      example: `
// BullMQ - Prioridade (menor número = maior prioridade)
await queue.add('urgent-task', data, { priority: 1 });
await queue.add('normal-task', data, { priority: 5 });
await queue.add('low-priority', data, { priority: 10 });

// RabbitMQ - Priority Queue
await channel.assertQueue('tasks', {
  durable: true,
  maxPriority: 10
});

channel.sendToQueue('tasks', buffer, { priority: 9 });
`
    },
    rateLimiting: {
      description: 'Limitar taxa de processamento',
      example: `
// BullMQ - Rate Limiter
const worker = new Worker('api-calls', processor, {
  limiter: {
    max: 100,        // Máximo 100 jobs
    duration: 60000  // Por minuto
  }
});

// Por grupo
const worker = new Worker('api-calls', processor, {
  limiter: {
    max: 10,
    duration: 1000,
    groupKey: 'apiKey'  // Limite por API key
  }
});
`
    }
  },

  monitoring: {
    metrics: [
      'Queue depth (mensagens pendentes)',
      'Processing rate (msg/s)',
      'Error rate (%)',
      'Average processing time',
      'Consumer lag',
      'DLQ size'
    ],
    bullmqDashboard: `
// Bull Board - Dashboard visual
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    new BullMQAdapter(orderQueue)
  ],
  serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());
`,
    healthCheck: `
async function queueHealthCheck() {
  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount()
  ]);
  
  return {
    healthy: failed < waiting * 0.1,  // <10% failure rate
    metrics: { waiting, active, completed, failed }
  };
}
`
  },

  antiPatterns: [
    'Mensagens muito grandes (>256KB)',
    'Não implementar idempotência',
    'Ignorar Dead Letter Queue',
    'Retry infinito sem backoff',
    'Não monitorar queue depth',
    'Processar sem acknowledgment',
    'Acoplamento forte entre producer/consumer',
    'Não serializar/deserializar corretamente'
  ],

  checklist: {
    design: [
      'Mensagens são idempotentes?',
      'DLQ configurada?',
      'Retry com backoff?',
      'Mensagens pequenas e serializáveis?'
    ],
    reliability: [
      'Persistence habilitada?',
      'Acknowledgment implementado?',
      'Error handling robusto?',
      'Graceful shutdown?'
    ],
    monitoring: [
      'Queue depth monitorado?',
      'Alertas para DLQ?',
      'Métricas de latência?',
      'Dashboard disponível?'
    ]
  }
};

export default MESSAGE_QUEUES_MANIFEST;
