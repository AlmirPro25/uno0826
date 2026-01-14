/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  ⏰ BACKGROUND JOBS SUPREME MASTER - O ARQUITETO DE PROCESSAMENTO           ║
 * ║                                                                              ║
 * ║  "Não faça o usuário esperar. Processe em background."                      ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const BACKGROUND_JOBS_MANIFEST = `
# ⏰ BACKGROUND JOBS SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Background Jobs, Queue, Fila, Job Queue
- BullMQ, Bull, Agenda, Bee-Queue, pg-boss
- Temporal, Inngest, Trigger.dev, Quirrel
- Cron, Scheduled Tasks, Agendamento
- Worker, Job Processing, Task Queue
- Redis Queue, Message Queue, RabbitMQ
- Delayed Jobs, Recurring Jobs, Webhooks

## FILOSOFIA
> "Não faça o usuário esperar. Processe em background."

### Princípios Invioláveis
1. **Idempotency** - Mesma entrada, mesmo resultado (retry-safe)
2. **Reliability** - Jobs não podem ser perdidos
3. **Observability** - Saber o que está acontecendo
4. **Graceful Degradation** - Falhas não quebram o sistema
5. **Scalability** - Escalar workers independentemente
6. **Isolation** - Jobs não afetam uns aos outros

## ARQUITETURA

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    JOB PROCESSING ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRODUCERS                    QUEUE                  CONSUMERS  │
│  ┌─────────┐                ┌─────────┐            ┌─────────┐ │
│  │ API     │ ──── add ────▶ │ Redis/  │ ◀── poll ──│ Worker  │ │
│  │ Webhook │                │ Postgres│            │ Pool    │ │
│  │ Cron    │                │ RabbitMQ│            │         │ │
│  └─────────┘                └─────────┘            └─────────┘ │
│                                  │                      │       │
│                                  ▼                      ▼       │
│                            ┌─────────┐            ┌─────────┐  │
│                            │   DLQ   │            │ Results │  │
│                            │ (Dead   │            │ Store   │  │
│                            │ Letter) │            │         │  │
│                            └─────────┘            └─────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## QUANDO USAR O QUÊ

| Solução | Tipo | Melhor Para |
|---------|------|-------------|
| BullMQ | Redis-based | Node.js, alta performance |
| Temporal | Workflow Engine | Workflows complexos, long-running |
| Inngest | Serverless | Next.js, Vercel, event-driven |
| pg-boss | PostgreSQL | Já usa Postgres, simplicidade |
| Trigger.dev | Serverless | TypeScript-first, observability |
| node-cron | In-process | Cron simples, single instance |

## BULLMQ - PRODUCTION SETUP

### Queue Configuration
\`\`\`typescript
// lib/queue.ts
import { Queue, Worker, Job, QueueEvents, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

// Connection with retry
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

// Queue factory
export function createQueue<T>(name: string) {
  return new Queue<T>(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 24 * 3600,    // Keep for 24 hours
        count: 1000,       // Keep last 1000
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // Keep failed for 7 days
      },
    },
  });
}

// Typed queues
interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
}

interface ImageJobData {
  imageUrl: string;
  operations: Array<{ type: string; params: Record<string, unknown> }>;
  outputPath: string;
}

export const emailQueue = createQueue<EmailJobData>('emails');
export const imageQueue = createQueue<ImageJobData>('images');
export const webhookQueue = createQueue<{ url: string; payload: unknown }>('webhooks');
\`\`\`

### Worker with Error Handling
\`\`\`typescript
// workers/email.worker.ts
import { Worker, Job } from 'bullmq';
import { emailQueue } from '../lib/queue';
import { sendEmail } from '../lib/email';
import { logger } from '../lib/logger';

const worker = new Worker<EmailJobData>(
  'emails',
  async (job: Job<EmailJobData>) => {
    const { to, subject, template, data } = job.data;
    
    // Progress reporting
    await job.updateProgress(10);
    
    // Idempotency check
    const idempotencyKey = \`email:\${job.id}\`;
    const alreadySent = await redis.get(idempotencyKey);
    if (alreadySent) {
      logger.info('Email already sent, skipping', { jobId: job.id });
      return { skipped: true };
    }
    
    await job.updateProgress(30);
    
    // Render template
    const html = await renderTemplate(template, data);
    
    await job.updateProgress(50);
    
    // Send email
    const result = await sendEmail({ to, subject, html });
    
    await job.updateProgress(90);
    
    // Mark as sent (idempotency)
    await redis.setex(idempotencyKey, 86400, 'sent'); // 24h TTL
    
    await job.updateProgress(100);
    
    logger.info('Email sent successfully', { 
      jobId: job.id, 
      to, 
      messageId: result.messageId 
    });
    
    return { messageId: result.messageId };
  },
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 100,
      duration: 1000, // 100 emails per second
    },
  }
);

// Event handlers
worker.on('completed', (job, result) => {
  logger.info('Job completed', { jobId: job.id, result });
});

worker.on('failed', (job, error) => {
  logger.error('Job failed', { 
    jobId: job?.id, 
    error: error.message,
    stack: error.stack,
    attemptsMade: job?.attemptsMade,
  });
  
  // Alert on final failure
  if (job?.attemptsMade === job?.opts.attempts) {
    alerting.send({
      severity: 'high',
      message: \`Job \${job.id} failed after all retries\`,
      error: error.message,
    });
  }
});

worker.on('error', (error) => {
  logger.error('Worker error', { error: error.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

export default worker;
\`\`\`

### Job Scheduling
\`\`\`typescript
// Add immediate job
await emailQueue.add('welcome', {
  to: 'user@example.com',
  subject: 'Welcome!',
  template: 'welcome',
  data: { name: 'João' },
});

// Add delayed job
await emailQueue.add('reminder', data, {
  delay: 24 * 60 * 60 * 1000, // 24 hours
});

// Add scheduled job (specific time)
await emailQueue.add('scheduled', data, {
  delay: new Date('2024-12-25T09:00:00Z').getTime() - Date.now(),
});

// Add recurring job (cron)
await emailQueue.add('daily-digest', { type: 'digest' }, {
  repeat: {
    pattern: '0 9 * * *', // 9 AM daily
    tz: 'America/Sao_Paulo',
  },
});

// Add with priority (lower = higher priority)
await emailQueue.add('urgent', data, { priority: 1 });
await emailQueue.add('normal', data, { priority: 5 });
await emailQueue.add('low', data, { priority: 10 });

// Add with dependencies (job flows)
const parentJob = await emailQueue.add('parent', parentData);
await emailQueue.add('child', childData, {
  parent: {
    id: parentJob.id,
    queue: 'emails',
  },
});
\`\`\`

### Queue Events & Monitoring
\`\`\`typescript
// Queue events for monitoring
const queueEvents = new QueueEvents('emails', { connection });

queueEvents.on('completed', ({ jobId, returnvalue }) => {
  metrics.increment('jobs.completed', { queue: 'emails' });
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  metrics.increment('jobs.failed', { queue: 'emails' });
});

queueEvents.on('progress', ({ jobId, data }) => {
  // Real-time progress updates
  websocket.emit(\`job:\${jobId}:progress\`, data);
});

// Dashboard API
app.get('/api/queues/stats', async (req, res) => {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    emailQueue.getWaitingCount(),
    emailQueue.getActiveCount(),
    emailQueue.getCompletedCount(),
    emailQueue.getFailedCount(),
    emailQueue.getDelayedCount(),
  ]);
  
  res.json({ waiting, active, completed, failed, delayed });
});
\`\`\`

## INNGEST - SERVERLESS WORKFLOWS

### Setup
\`\`\`typescript
// lib/inngest.ts
import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'my-app',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// app/api/inngest/route.ts (Next.js)
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { functions } from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
\`\`\`

### Complex Workflow
\`\`\`typescript
// inngest/functions/onboarding.ts
import { inngest } from '@/lib/inngest';

export const onboardingWorkflow = inngest.createFunction(
  { 
    id: 'user-onboarding',
    retries: 3,
    cancelOn: [{ event: 'user/deleted', match: 'data.userId' }],
  },
  { event: 'user/created' },
  async ({ event, step }) => {
    const { userId, email, name } = event.data;
    
    // Step 1: Send welcome email
    await step.run('send-welcome-email', async () => {
      await resend.emails.send({
        to: email,
        subject: \`Welcome, \${name}!\`,
        react: WelcomeEmail({ name }),
      });
    });
    
    // Step 2: Wait 1 day
    await step.sleep('wait-day-1', '1 day');
    
    // Step 3: Check if user completed profile
    const profile = await step.run('check-profile', async () => {
      return await db.user.findUnique({ where: { id: userId } });
    });
    
    if (!profile?.profileCompleted) {
      // Step 4a: Send reminder
      await step.run('send-profile-reminder', async () => {
        await resend.emails.send({
          to: email,
          subject: 'Complete your profile',
          react: ProfileReminderEmail({ name }),
        });
      });
    }
    
    // Step 5: Wait 3 more days
    await step.sleep('wait-day-4', '3 days');
    
    // Step 6: Send feature highlights
    await step.run('send-features-email', async () => {
      await resend.emails.send({
        to: email,
        subject: 'Discover what you can do',
        react: FeaturesEmail({ name }),
      });
    });
    
    // Step 7: Track completion
    await step.run('track-onboarding-complete', async () => {
      await analytics.track({
        userId,
        event: 'Onboarding Completed',
      });
    });
    
    return { success: true, userId };
  }
);

// Fan-out pattern
export const processOrderItems = inngest.createFunction(
  { id: 'process-order-items' },
  { event: 'order/created' },
  async ({ event, step }) => {
    const { orderId, items } = event.data;
    
    // Process each item in parallel
    const results = await step.run('process-items', async () => {
      return Promise.all(
        items.map(item => processItem(item))
      );
    });
    
    // Or use fan-out for independent processing
    await Promise.all(
      items.map((item, index) =>
        step.run(\`process-item-\${index}\`, () => processItem(item))
      )
    );
    
    return { orderId, processedItems: results.length };
  }
);
\`\`\`

### Trigger Events
\`\`\`typescript
// From API route
export async function POST(req: Request) {
  const user = await createUser(data);
  
  // Trigger async workflow
  await inngest.send({
    name: 'user/created',
    data: {
      userId: user.id,
      email: user.email,
      name: user.name,
    },
  });
  
  return Response.json(user);
}

// Batch events
await inngest.send([
  { name: 'order/created', data: { orderId: '1' } },
  { name: 'order/created', data: { orderId: '2' } },
]);
\`\`\`

## TEMPORAL - DURABLE WORKFLOWS

### Workflow Definition
\`\`\`typescript
// workflows/order.workflow.ts
import { proxyActivities, sleep, condition } from '@temporalio/workflow';
import type * as activities from '../activities';

const { 
  reserveInventory, 
  processPayment, 
  shipOrder, 
  sendNotification,
  releaseInventory,
  refundPayment,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

export async function orderWorkflow(order: Order): Promise<OrderResult> {
  let inventoryReserved = false;
  let paymentProcessed = false;
  
  try {
    // Step 1: Reserve inventory
    await reserveInventory(order.id, order.items);
    inventoryReserved = true;
    
    // Step 2: Process payment
    const paymentResult = await processPayment(order.id, order.total);
    paymentProcessed = true;
    
    if (!paymentResult.success) {
      throw new Error(\`Payment failed: \${paymentResult.error}\`);
    }
    
    // Step 3: Ship order
    const shipmentId = await shipOrder(order.id, order.shippingAddress);
    
    // Step 4: Send confirmation
    await sendNotification(order.userId, {
      type: 'order_confirmed',
      orderId: order.id,
      shipmentId,
    });
    
    return { 
      status: 'completed', 
      orderId: order.id, 
      shipmentId 
    };
    
  } catch (error) {
    // Saga compensation pattern
    if (paymentProcessed) {
      await refundPayment(order.id);
    }
    if (inventoryReserved) {
      await releaseInventory(order.id, order.items);
    }
    
    await sendNotification(order.userId, {
      type: 'order_failed',
      orderId: order.id,
      error: error.message,
    });
    
    throw error;
  }
}

// Long-running workflow with signals
export async function subscriptionWorkflow(
  userId: string,
  plan: string
): Promise<void> {
  let cancelled = false;
  
  // Handle cancellation signal
  setHandler(cancelSignal, () => {
    cancelled = true;
  });
  
  while (!cancelled) {
    // Bill monthly
    await processSubscriptionPayment(userId, plan);
    
    // Wait for next billing cycle or cancellation
    await condition(() => cancelled, '30 days');
  }
  
  // Cleanup on cancellation
  await cancelSubscription(userId);
}
\`\`\`

### Activities
\`\`\`typescript
// activities/index.ts
import { Context } from '@temporalio/activity';

export async function reserveInventory(
  orderId: string, 
  items: OrderItem[]
): Promise<void> {
  const ctx = Context.current();
  
  for (const item of items) {
    // Heartbeat for long operations
    ctx.heartbeat(\`Processing item \${item.id}\`);
    
    await db.inventory.update({
      where: { productId: item.productId },
      data: { reserved: { increment: item.quantity } },
    });
  }
}

export async function processPayment(
  orderId: string, 
  amount: number
): Promise<PaymentResult> {
  // Idempotency key based on order
  const result = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'brl',
    idempotencyKey: \`order-\${orderId}\`,
  });
  
  return {
    success: result.status === 'succeeded',
    paymentId: result.id,
  };
}
\`\`\`

## CRON PATTERNS

\`\`\`typescript
// Cron expression reference
const CRON_PATTERNS = {
  everyMinute: '* * * * *',
  every5Minutes: '*/5 * * * *',
  everyHour: '0 * * * *',
  everyDayAt9AM: '0 9 * * *',
  everyMondayAt9AM: '0 9 * * 1',
  firstDayOfMonth: '0 0 1 * *',
  weekdaysAt9AM: '0 9 * * 1-5',
};

// With node-cron
import cron from 'node-cron';

// Validate before scheduling
if (!cron.validate('0 9 * * *')) {
  throw new Error('Invalid cron expression');
}

const task = cron.schedule('0 9 * * *', async () => {
  try {
    await generateDailyReport();
  } catch (error) {
    logger.error('Daily report failed', { error });
    alerting.send({ message: 'Daily report failed', error });
  }
}, {
  timezone: 'America/Sao_Paulo',
  scheduled: true,
});

// Graceful shutdown
process.on('SIGTERM', () => {
  task.stop();
});
\`\`\`

## DEAD LETTER QUEUE (DLQ)

\`\`\`typescript
// DLQ for failed jobs
const dlqQueue = new Queue('dead-letter', { connection });

// Move to DLQ after all retries
worker.on('failed', async (job, error) => {
  if (job?.attemptsMade === job?.opts.attempts) {
    await dlqQueue.add('failed-job', {
      originalQueue: 'emails',
      originalJobId: job.id,
      originalData: job.data,
      error: error.message,
      stack: error.stack,
      failedAt: new Date().toISOString(),
    });
  }
});

// DLQ processor (manual review/retry)
const dlqWorker = new Worker('dead-letter', async (job) => {
  // Log for manual review
  logger.error('Job in DLQ', {
    originalQueue: job.data.originalQueue,
    originalJobId: job.data.originalJobId,
    error: job.data.error,
  });
  
  // Could implement auto-retry logic here
}, { connection });

// API to retry DLQ jobs
app.post('/api/dlq/:jobId/retry', async (req, res) => {
  const dlqJob = await dlqQueue.getJob(req.params.jobId);
  if (!dlqJob) return res.status(404).json({ error: 'Job not found' });
  
  // Re-add to original queue
  const originalQueue = new Queue(dlqJob.data.originalQueue, { connection });
  await originalQueue.add('retry', dlqJob.data.originalData);
  
  // Remove from DLQ
  await dlqJob.remove();
  
  res.json({ success: true });
});
\`\`\`

## MONITORING & OBSERVABILITY

\`\`\`typescript
// Prometheus metrics
import { Counter, Histogram, Gauge } from 'prom-client';

const jobsProcessed = new Counter({
  name: 'jobs_processed_total',
  help: 'Total jobs processed',
  labelNames: ['queue', 'status'],
});

const jobDuration = new Histogram({
  name: 'job_duration_seconds',
  help: 'Job processing duration',
  labelNames: ['queue', 'job_name'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
});

const queueSize = new Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue', 'state'],
});

// Instrument worker
worker.on('completed', (job) => {
  jobsProcessed.inc({ queue: 'emails', status: 'completed' });
  jobDuration.observe(
    { queue: 'emails', job_name: job.name },
    (Date.now() - job.timestamp) / 1000
  );
});

worker.on('failed', () => {
  jobsProcessed.inc({ queue: 'emails', status: 'failed' });
});

// Periodic queue stats
setInterval(async () => {
  const counts = await emailQueue.getJobCounts();
  queueSize.set({ queue: 'emails', state: 'waiting' }, counts.waiting);
  queueSize.set({ queue: 'emails', state: 'active' }, counts.active);
  queueSize.set({ queue: 'emails', state: 'delayed' }, counts.delayed);
}, 10000);
\`\`\`

## CHECKLIST

### Design
- [ ] Jobs são idempotentes?
- [ ] Retry logic configurado?
- [ ] Dead letter queue implementada?
- [ ] Timeouts definidos?

### Reliability
- [ ] Graceful shutdown implementado?
- [ ] Health checks configurados?
- [ ] Backpressure handling?
- [ ] Rate limiting se necessário?

### Observability
- [ ] Logs estruturados?
- [ ] Métricas expostas?
- [ ] Alertas configurados?
- [ ] Dashboard de monitoramento?

### Security
- [ ] Dados sensíveis não estão no job payload?
- [ ] Conexões Redis/DB seguras?
- [ ] Rate limiting em APIs de trigger?

## ANTI-PATTERNS

❌ **NUNCA** processe jobs sem retry logic
❌ **NUNCA** ignore falhas silenciosamente
❌ **NUNCA** bloqueie a thread principal
❌ **NUNCA** armazene dados sensíveis no job payload
❌ **NUNCA** use jobs sem idempotência
❌ **NUNCA** ignore graceful shutdown
❌ **NUNCA** processe sem observability
`;

export default BACKGROUND_JOBS_MANIFEST;
