# 🛒 ECOMMERCE SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Ecommerce, loja virtual, vendas online
- Stripe, checkout, pagamento, payment
- Carrinho, cart, assinatura, subscription
- SaaS billing, marketplace, pedidos
- Webhook, PCI compliance, gateway
- Mercado Pago, Pagar.me, Lemon Squeezy, PIX
- Chargeback, refund, estoque, inventory

## FILOSOFIA
> "A conversão é rainha, mas a segurança é o rei."

### Princípios Invioláveis
1. **Fricção Zero**: O caminho entre "Eu quero" e "Comprei" deve ser o menor possível
2. **Segurança PCI**: Nunca toque nos dados do cartão diretamente
3. **Idempotência**: Cobranças duplicadas destroem a confiança
4. **Transparência**: Usuário sempre sabe o que está pagando
5. **Server-Side Truth**: Preços são SEMPRE calculados no backend
6. **Atomic Transactions**: Pagamento e estoque devem ser atômicos

## ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  [Product Catalog] [Cart/Zustand] [Checkout] [Account Portal]   │
│                    Stripe Elements / Hosted Checkout            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│  /products  /cart  /checkout  /webhooks  /subscriptions         │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│ PostgreSQL  │       │   Redis     │       │  Payment    │
│ (Orders,    │       │ (Cart,      │       │  Gateway    │
│  Products)  │       │  Locks)     │       │  (Stripe)   │
└─────────────┘       └─────────────┘       └─────────────┘
```

## PAYMENT GATEWAYS

### Stripe (Global)
- Cards, Subscriptions, Invoices, Connect, Checkout
- Fees: 2.9% + $0.30
- Best for: SaaS, Global, Subscriptions, Marketplaces

### Mercado Pago (Brasil/LATAM)
- PIX, Boleto, Cards, Wallet
- Fees: 4.99%
- Best for: Brazilian market, PIX payments

### Lemon Squeezy (Digital Products)
- Subscriptions, License Keys, Tax Handling
- Merchant of Record (handles VAT/GST)
- Best for: Digital products, SaaS, Indie developers

## BUSINESS MODELS

### One-Time Payment
```typescript
mode: 'payment'
// Stripe Checkout, One-time Prices
```

### Subscription (SaaS)
```typescript
mode: 'subscription'
// Stripe Products, Recurring Prices, Customer Portal
```

### Marketplace
```typescript
// Stripe Connect (Standard/Express/Custom)
// Split payments, Platform fees
```

## STACK RECOMENDADA

### Pagamentos
- **Primary**: Stripe
- **Brasil**: Mercado Pago / Pagar.me
- **SaaS Global**: Lemon Squeezy

### Database
- **Produtos/Orders**: PostgreSQL (consistência obrigatória)
- **Cart/Locks**: Redis (tempo real)

### Frontend
- **State**: Zustand (React) ou Pinia (Vue)
- **UI de Cartão**: Stripe Elements (seguro)

## PADRÕES DE ARQUITETURA

### 1. Optimistic UI Cart
```typescript
const addToCart = (item) => {
  updateUIInstantly(item);  // Feedback imediato
  syncWithBackend(item);    // Validar depois
};
```

### 2. Idempotent Webhook
```typescript
async function handleWebhook(event) {
  // 1. Verificar assinatura
  const verified = stripe.webhooks.constructEvent(body, sig, secret);
  
  // 2. Checar se já processou (idempotency)
  const existing = await db.transactionLog.findFirst({
    where: { gatewayId: event.id }
  });
  if (existing) return { received: true };
  
  // 3. Processar evento
  // 4. Logar para auditoria
}
```

### 3. Server-Side Pricing
```typescript
// NUNCA confiar no preço do frontend
const session = await stripe.checkout.sessions.create({
  line_items: items.map(item => ({
    price_data: {
      unit_amount: await getServerPrice(item.id), // Backend calcula
    }
  }))
});
```

### 4. Inventory Lock (Redis)
```typescript
async function reserveInventory(items, sessionId) {
  const lockKey = `inventory:lock:${sessionId}`;
  // Check availability
  // Create lock with TTL
  await redis.setex(lockKey, 600, JSON.stringify(items));
}
```

## TEMPLATES DE CÓDIGO

### Stripe Setup (lib/stripe.ts)
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const formatAmountForStripe = (amount: number, currency: string) => {
  const zeroDecimal = ['JPY', 'KRW', 'CLP'];
  return zeroDecimal.includes(currency.toUpperCase()) 
    ? Math.round(amount) 
    : Math.round(amount * 100);
};
```

### Checkout Session (API Route)
```typescript
export async function POST(req: Request) {
  const session = await getServerSession();
  const { items } = await req.json();
  const idempotencyKey = nanoid();

  // CRITICAL: Validate and recalculate prices server-side
  const validatedItems = await Promise.all(
    items.map(async (item) => {
      const product = await db.product.findUnique({ where: { id: item.productId } });
      if (!product || product.status !== 'ACTIVE') throw new Error('Product not available');
      
      return {
        price_data: {
          currency: 'brl',
          product_data: { name: product.name },
          unit_amount: formatAmountForStripe(Number(product.price), 'BRL'),
        },
        quantity: item.quantity,
      };
    })
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: validatedItems,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/cancel`,
    metadata: { userId: session.user.id, idempotencyKey },
  }, { idempotencyKey });

  return NextResponse.json({ url: checkoutSession.url });
}
```

### Webhook Handler (CRÍTICO)
```typescript
export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  // Check idempotency
  const existingLog = await db.transactionLog.findFirst({
    where: { gatewayId: event.id },
  });
  if (existingLog) return NextResponse.json({ received: true });

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
  }

  // Log event
  await db.transactionLog.create({
    data: { type: 'webhook', action: event.type, gatewayId: event.id }
  });

  return NextResponse.json({ received: true });
}
```

### Cart Store (Zustand)
```typescript
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        const items = get().items;
        const itemId = `${newItem.productId}-${newItem.variantId || 'default'}`;
        const existing = items.find(i => i.id === itemId);
        
        if (existing) {
          set({ items: items.map(i => i.id === itemId 
            ? { ...i, quantity: i.quantity + 1 } : i) });
        } else {
          set({ items: [...items, { ...newItem, id: itemId, quantity: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
      clearCart: () => set({ items: [] }),
      subtotal: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
    }),
    { name: 'shopping-cart', storage: createJSONStorage(() => localStorage) }
  )
);
```

## CHECKLIST DE SEGURANÇA

### Environment
- [ ] STRIPE_SECRET_KEY em variáveis de ambiente (nunca no código)
- [ ] STRIPE_WEBHOOK_SECRET configurado
- [ ] STRIPE_PUBLISHABLE_KEY apenas no frontend
- [ ] Keys diferentes para test/production

### API
- [ ] HTTPS em todas as rotas
- [ ] Webhook signature verification
- [ ] Idempotency keys em todas as mutations
- [ ] Rate limiting em endpoints de checkout
- [ ] Preços validados no backend

### Data
- [ ] Nunca armazenar números de cartão
- [ ] Usar Stripe tokens/PaymentMethods
- [ ] Audit logs para todas as transações
- [ ] Compliance com LGPD/GDPR

### Monitoring
- [ ] Alertas para webhooks falhando
- [ ] Alertas para alta taxa de refund
- [ ] Logging de todos os eventos de pagamento

## FLUXO DE CHECKOUT

```
1. Usuário adiciona ao carrinho (localStorage/Zustand)
2. Clica em "Finalizar Compra"
3. Frontend envia items para API
4. Backend RECALCULA preços (segurança)
5. Backend cria Stripe Checkout Session
6. Usuário é redirecionado para Stripe
7. Stripe processa pagamento
8. Webhook confirma pagamento
9. Backend cria pedido e atualiza estoque (transação atômica)
10. Usuário recebe confirmação
```

## FRAUD PREVENTION

### Estratégias
- **Stripe Radar**: ML fraud detection (built-in)
- **Velocity Checks**: Max 5 orders/hour per user
- **AVS**: Address Verification System
- **CVV**: Always required
- **Amount Limits**: Flag orders > $1000

### Red Flags
- Multiple failed payment attempts
- Mismatched billing/shipping addresses
- High-risk countries
- Proxy/VPN usage
- Multiple cards from same IP

## MÉTRICAS

### Conversão
- **Cart Abandonment Rate**: (Carts - Orders) / Carts → Benchmark: 70-80%
- **Checkout Conversion**: Orders / Checkout Started → Benchmark: 30-50%
- **Payment Success Rate**: Successful / Attempts → Benchmark: 95%+

### Operacional
- **Refund Rate**: < 2% (alert > 5%)
- **Chargeback Rate**: < 0.5% (alert > 1%)
- **Fulfillment Time**: < 24 hours

## ANTI-PATTERNS

❌ **NUNCA** armazenar número de cartão
❌ **NUNCA** confiar no preço enviado pelo frontend
❌ **NUNCA** processar pagamento sem webhook de confirmação
❌ **NUNCA** ignorar idempotência em webhooks
❌ **NUNCA** expor STRIPE_SECRET_KEY no frontend
❌ **NUNCA** decrementar estoque antes do pagamento confirmado
❌ **NUNCA** usar transações financeiras sem logs de auditoria

## TEST CARDS (Stripe)

```typescript
const testCards = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficientFunds: '4000000000009995',
  expiredCard: '4000000000000069',
  threeDSecure: '4000002500003155',
};
```

## TROUBLESHOOTING

### Webhook não recebido
- Verificar URL configurada no Stripe Dashboard
- Verificar webhook secret
- Usar Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Cobranças duplicadas
- Implementar idempotency keys
- Verificar evento já processado antes de criar order
- Usar unique constraints no banco

### Inventory mismatch
- Usar Redis locks para reserva
- Decrementar estoque na mesma transação do pedido
- Implementar TTL para reservas

## FILOSOFIA FINAL

> "Cada centavo perdido por bug é confiança destruída.
> Cada segundo de fricção é conversão perdida.
> Segurança e UX não são opostos - são aliados."

