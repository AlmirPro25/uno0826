/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║  🔄 NO-CODE AUTOMATION SUPREME MASTER - O Arquiteto de Workflows          ║
 * ║                                                                           ║
 * ║  "Automatize o repetitivo. Foque no criativo."                            ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export const NOCODE_AUTOMATION_MANIFEST = `
# 🔄 NO-CODE AUTOMATION SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- No-Code, Low-Code, Automation, Automação
- Zapier, Make, Integromat, n8n, Pipedream
- Workflow, Integration, iPaaS
- Trigger, Action, Webhook, Event-driven
- IFTTT, Automate.io, Tray.io, Workato
- Temporal, Inngest, Trigger.dev

## FILOSOFIA
> "Automatize o repetitivo. Foque no criativo."

### Princípios Invioláveis
1. **Idempotency** - Rodar duas vezes = mesmo resultado
2. **Retry Logic** - Falhas são esperadas, retries são obrigatórios
3. **Observability** - Log tudo, monitore tudo
4. **Security First** - Secrets seguros, webhooks verificados
5. **Graceful Degradation** - Falha parcial não quebra tudo
6. **Rate Limiting** - Respeite limites de APIs externas

## ARQUITETURA DE AUTOMAÇÃO

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AUTOMATION ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  TRIGGERS                    PROCESSING                  ACTIONS           │
│  ┌─────────┐                ┌─────────┐                ┌─────────┐         │
│  │ Webhook │                │ Filter  │                │ API Call│         │
│  │ Schedule│ ─────────────▶ │Transform│ ─────────────▶ │ Email   │         │
│  │ Event   │                │ Branch  │                │ Database│         │
│  │ Poll    │                │ Loop    │                │ Notify  │         │
│  └─────────┘                └─────────┘                └─────────┘         │
│                                                                             │
│  WORKFLOW PATTERNS                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  Sequential:    A ──▶ B ──▶ C ──▶ D                                │   │
│  │                                                                     │   │
│  │  Parallel:      A ──┬──▶ B ──┬──▶ D                                │   │
│  │                     └──▶ C ──┘                                      │   │
│  │                                                                     │   │
│  │  Conditional:   A ──▶ [if X] ──▶ B                                 │   │
│  │                       [else] ──▶ C                                  │   │
│  │                                                                     │   │
│  │  Loop:          A ──▶ [for each] ──▶ B ──▶ [end] ──▶ C            │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## COMPARATIVO DE PLATAFORMAS

| Plataforma | Tipo | Melhor Para | Preço |
|------------|------|-------------|-------|
| Zapier | Cloud | Simplicidade, muitas integrações | $$ |
| Make | Cloud | Workflows visuais complexos | $ |
| n8n | Self-hosted | Controle total, open source | Free |
| Pipedream | Cloud | Developers, código custom | Free tier |
| Temporal | Code | Workflows críticos, durável | Enterprise |
| Inngest | Cloud | Serverless, event-driven | Free tier |

## ZAPIER INTEGRATION

### Webhook Trigger
\`\`\`typescript
// Your API endpoint for Zapier
app.post('/api/zapier/subscribe', async (req, res) => {
  const { hookUrl, event } = req.body;
  
  // Store webhook URL
  await db.webhooks.create({
    url: hookUrl,
    event,
    active: true,
  });
  
  res.json({ success: true });
});

// Trigger webhook when event occurs
async function triggerZapierWebhook(event: string, data: any) {
  const webhooks = await db.webhooks.findMany({ where: { event, active: true } });
  
  await Promise.all(
    webhooks.map((webhook) =>
      fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    )
  );
}

// Usage
await triggerZapierWebhook('order.created', { orderId: '123', total: 99.99 });
\`\`\`

## N8N (Self-Hosted)

### Custom Node
\`\`\`typescript
// nodes/MyNode/MyNode.node.ts
import { IExecuteFunctions, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class MyNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Node',
    name: 'myNode',
    group: ['transform'],
    version: 1,
    description: 'Does something awesome',
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        default: '',
        required: true,
      },
    ],
  };

  async execute(this: IExecuteFunctions) {
    const items = this.getInputData();
    const apiKey = this.getNodeParameter('apiKey', 0) as string;
    
    const results = await Promise.all(
      items.map(async (item) => {
        const response = await fetch('https://api.example.com/data', {
          headers: { Authorization: \`Bearer \${apiKey}\` },
        });
        return { json: await response.json() };
      })
    );
    
    return [results];
  }
}
\`\`\`

## WEBHOOK PATTERNS

### Incoming Webhook
\`\`\`typescript
// Receive data from external services
app.post('/api/webhooks/incoming', async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  
  // Verify signature
  if (!verifySignature(req.body, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  await processWebhook(req.body);
  
  res.json({ received: true });
});
\`\`\`

### Outgoing Webhook
\`\`\`typescript
// Send data to external services
async function sendWebhook(url: string, data: any, secret: string) {
  const payload = JSON.stringify(data);
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
    },
    body: payload,
  });
  
  if (!response.ok) {
    // Retry logic
    await retryWebhook(url, data, secret);
  }
}
\`\`\`

## COMMON AUTOMATIONS

\`\`\`yaml
# Examples of useful automations

New User Signup:
  trigger: user.created
  actions:
    - Send welcome email (SendGrid)
    - Add to CRM (HubSpot)
    - Create Slack notification
    - Add to email list (Mailchimp)

New Order:
  trigger: order.created
  actions:
    - Send confirmation email
    - Update inventory
    - Create invoice (Stripe)
    - Notify warehouse (Slack)

Support Ticket:
  trigger: ticket.created
  actions:
    - Assign to team member
    - Send acknowledgment email
    - Create Trello card
    - Log in spreadsheet
\`\`\`

## INNGEST (Modern Event-Driven)

\`\`\`typescript
import { Inngest } from 'inngest';
import { serve } from 'inngest/next';

const inngest = new Inngest({ id: 'my-app' });

// Define function with retries and steps
const processOrder = inngest.createFunction(
  { id: 'process-order', retries: 3 },
  { event: 'order/created' },
  async ({ event, step }) => {
    // Step 1: Validate order
    const validated = await step.run('validate-order', async () => {
      return validateOrder(event.data.orderId);
    });
    
    // Step 2: Process payment (with automatic retry)
    const payment = await step.run('process-payment', async () => {
      return processPayment(validated.orderId, validated.amount);
    });
    
    // Step 3: Send confirmation (parallel)
    await Promise.all([
      step.run('send-email', () => sendConfirmationEmail(event.data.email)),
      step.run('send-sms', () => sendConfirmationSMS(event.data.phone)),
    ]);
    
    // Step 4: Wait for fulfillment (sleep)
    await step.sleep('wait-for-fulfillment', '1h');
    
    // Step 5: Check status
    await step.run('check-fulfillment', async () => {
      return checkFulfillmentStatus(event.data.orderId);
    });
    
    return { success: true, orderId: event.data.orderId };
  }
);

// Trigger from anywhere
await inngest.send({
  name: 'order/created',
  data: { orderId: '123', email: 'user@example.com', amount: 99.99 },
});
\`\`\`

## TEMPORAL (Durable Workflows)

\`\`\`typescript
// workflows/orderWorkflow.ts
import { proxyActivities, sleep } from '@temporalio/workflow';
import type * as activities from './activities';

const { validateOrder, processPayment, sendNotification } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1s',
    backoffCoefficient: 2,
  },
});

export async function orderWorkflow(orderId: string): Promise<void> {
  // Durable execution - survives crashes
  await validateOrder(orderId);
  await processPayment(orderId);
  
  // Wait for external event or timeout
  await sleep('24 hours');
  
  await sendNotification(orderId, 'Order shipped!');
}

// Start workflow
const handle = await client.workflow.start(orderWorkflow, {
  taskQueue: 'orders',
  workflowId: \`order-\${orderId}\`,
  args: [orderId],
});
\`\`\`

## WEBHOOK SECURITY

\`\`\`typescript
import crypto from 'crypto';

// Verify webhook signature (HMAC)
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(\`sha256=\${expectedSignature}\`)
  );
}

// Webhook handler with verification
app.post('/api/webhooks/:provider', async (req, res) => {
  const { provider } = req.params;
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = JSON.stringify(req.body);
  
  // Get secret for provider
  const secret = await getWebhookSecret(provider);
  
  if (!verifyWebhookSignature(payload, signature, secret)) {
    console.error('Invalid webhook signature', { provider });
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Idempotency check
  const eventId = req.headers['x-event-id'] as string;
  if (await isEventProcessed(eventId)) {
    return res.json({ status: 'already_processed' });
  }
  
  // Process webhook
  await processWebhook(provider, req.body);
  await markEventProcessed(eventId);
  
  res.json({ status: 'processed' });
});
\`\`\`

## RETRY PATTERNS

\`\`\`typescript
// Exponential backoff with jitter
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxRetries - 1) break;
      
      // Calculate delay with exponential backoff + jitter
      const baseDelay = options.initialDelay * Math.pow(options.backoffFactor, attempt);
      const jitter = Math.random() * 0.3 * baseDelay;
      const delay = Math.min(baseDelay + jitter, options.maxDelay);
      
      console.log(\`Retry \${attempt + 1}/\${options.maxRetries} after \${delay}ms\`);
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

// Usage
await retryWithBackoff(
  () => sendWebhook(url, data),
  { maxRetries: 5, initialDelay: 1000, maxDelay: 30000, backoffFactor: 2 }
);
\`\`\`

## CHECKLIST

### Webhook Setup
- [ ] Signature verification implementada?
- [ ] Idempotency keys para evitar duplicatas?
- [ ] Retry logic com exponential backoff?
- [ ] Dead letter queue para falhas?

### Security
- [ ] Secrets em variáveis de ambiente?
- [ ] HTTPS obrigatório?
- [ ] Rate limiting configurado?
- [ ] IP allowlist se possível?

### Observability
- [ ] Logging de todas as execuções?
- [ ] Métricas de sucesso/falha?
- [ ] Alertas para falhas repetidas?
- [ ] Dashboard de monitoramento?

### Reliability
- [ ] Timeouts configurados?
- [ ] Circuit breaker para APIs externas?
- [ ] Graceful degradation?
- [ ] Testes de integração?

## ANTI-PATTERNS

❌ **NUNCA** confie em webhooks sem verificação de assinatura
❌ **NUNCA** ignore falhas de webhook - implemente retries
❌ **NUNCA** crie loops infinitos - use circuit breakers
❌ **NUNCA** exponha secrets em logs ou respostas
❌ **NUNCA** processe webhooks sem idempotency
❌ **NUNCA** ignore rate limits de APIs externas
❌ **NUNCA** faça workflows síncronos longos - use queues
❌ **NUNCA** dependa de ordem de eventos sem garantia
`;

export default NOCODE_AUTOMATION_MANIFEST;
