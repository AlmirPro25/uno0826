/**
 * 🛒 ECOMMERCE SUPREME MANIFEST
 * 
 * Manifesto definitivo para arquitetura de vendas online, pagamentos e checkout.
 * Suporta: Stripe, Mercado Pago, Lemon Squeezy, Subscriptions, Marketplace
 * 
 * @author Micro SaaS Factory
 * @version 2.0.0
 */

export const ECOMMERCE_SUPREME_MANIFEST = {
  id: 'ecommerce-supreme',
  name: 'Ecommerce Supreme Architect',
  version: '2.0.0',
  description: 'Especialista em fluxos de pagamento, checkout, subscriptions e arquitetura de vendas online',

  // Palavras-chave para ativação
  keywords: [
    'ecommerce', 'loja virtual', 'vendas', 'stripe', 'checkout',
    'pagamento', 'payment', 'cart', 'carrinho', 'assinatura',
    'subscription', 'saas billing', 'marketplace', 'pedidos',
    'webhook', 'pci compliance', 'gateway', 'faturamento',
    'mercado pago', 'pagar.me', 'lemon squeezy', 'pix',
    'chargeback', 'refund', 'estoque', 'inventory', 'order',
    'recurring', 'invoice', 'customer portal', 'pricing'
  ],

  // ============================================
  // FILOSOFIA CENTRAL
  // ============================================
  philosophy: {
    core: "A conversão é rainha, mas a segurança é o rei.",
    principles: [
      "Fricção Zero: O caminho entre 'Eu quero' e 'Comprei' deve ser o menor possível.",
      "Segurança PCI: Nunca toque nos dados do cartão de crédito diretamente.",
      "Idempotência: Cobranças duplicadas destroem a confiança. Webhooks devem ser à prova de falhas.",
      "Transparência: O usuário deve sempre saber o que está pagando e quando.",
      "Server-Side Truth: Preços, descontos e totais são SEMPRE calculados no backend.",
      "Atomic Transactions: Pagamento e atualização de estoque devem ser atômicos."
    ],
    antiPatterns: [
      "❌ NUNCA armazenar número de cartão",
      "❌ NUNCA confiar no preço enviado pelo frontend",
      "❌ NUNCA processar pagamento sem webhook de confirmação",
      "❌ NUNCA ignorar idempotência em webhooks",
      "❌ NUNCA expor STRIPE_SECRET_KEY no frontend",
      "❌ NUNCA decrementar estoque antes do pagamento confirmado",
      "❌ NUNCA usar transações financeiras sem logs de auditoria"
    ]
  },


  // ============================================
  // ARQUITETURA DE ECOMMERCE
  // ============================================
  architecture: {
    diagram: `
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITETURA ECOMMERCE COMPLETA                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         FRONTEND                                    │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │ Product   │  │ Cart      │  │ Checkout  │  │ Account   │        │   │
│  │  │ Catalog   │  │ (Zustand) │  │ Flow      │  │ Portal    │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  │       │              │              │              │               │   │
│  │       └──────────────┴──────────────┴──────────────┘               │   │
│  │                              │                                      │   │
│  │                    Stripe Elements / Hosted Checkout                │   │
│  └──────────────────────────────┼──────────────────────────────────────┘   │
│                                 │                                          │
│                                 ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API LAYER                                   │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │ /products │  │ /cart     │  │ /checkout │  │ /webhooks │        │   │
│  │  │ /orders   │  │ /payments │  │ /subscriptions │ /refunds │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └──────────────────────────────┼──────────────────────────────────────┘   │
│                                 │                                          │
│         ┌───────────────────────┼───────────────────────┐                  │
│         ▼                       ▼                       ▼                  │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐          │
│  │ PostgreSQL  │         │   Redis     │         │ Payment     │          │
│  │ (Orders,    │         │ (Cart,      │         │ Gateway     │          │
│  │  Products,  │         │  Sessions,  │         │ (Stripe/    │          │
│  │  Users)     │         │  Inventory  │         │  MercadoPago)│          │
│  │             │         │  Locks)     │         │             │          │
│  └─────────────┘         └─────────────┘         └─────────────┘          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    BACKGROUND JOBS                                  │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │ Webhook   │  │ Email     │  │ Inventory │  │ Analytics │        │   │
│  │  │ Processor │  │ Sender    │  │ Sync      │  │ Tracker   │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
`,
    layers: {
      frontend: {
        responsibilities: ['UI/UX', 'Cart State', 'Checkout Flow', 'Payment Form'],
        technologies: ['React/Next.js', 'Zustand/Redux', 'Stripe Elements'],
        rules: ['Never handle raw card data', 'Optimistic UI updates', 'Persist cart locally']
      },
      api: {
        responsibilities: ['Price Calculation', 'Order Management', 'Payment Processing', 'Webhook Handling'],
        technologies: ['Next.js API Routes', 'Express', 'tRPC'],
        rules: ['Always validate prices server-side', 'Idempotent operations', 'Atomic transactions']
      },
      database: {
        responsibilities: ['Order Storage', 'Product Catalog', 'User Data', 'Audit Logs'],
        technologies: ['PostgreSQL', 'Prisma/Drizzle'],
        rules: ['ACID compliance', 'Soft deletes for orders', 'Immutable transaction logs']
      },
      cache: {
        responsibilities: ['Cart Sessions', 'Inventory Locks', 'Rate Limiting'],
        technologies: ['Redis', 'Upstash'],
        rules: ['TTL for cart sessions', 'Distributed locks for inventory', 'Atomic operations']
      }
    }
  },


  // ============================================
  // PAYMENT GATEWAYS
  // ============================================
  paymentGateways: {
    stripe: {
      name: 'Stripe',
      regions: ['Global', 'US', 'EU', 'LATAM'],
      features: ['Cards', 'Subscriptions', 'Invoices', 'Connect', 'Checkout', 'Elements'],
      fees: { percentage: 2.9, fixed: 0.30, currency: 'USD' },
      docs: 'https://stripe.com/docs',
      bestFor: ['SaaS', 'Global businesses', 'Subscriptions', 'Marketplaces'],
      sdk: {
        server: 'stripe',
        client: '@stripe/stripe-js',
        react: '@stripe/react-stripe-js'
      },
      webhookEvents: [
        'checkout.session.completed',
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'invoice.paid',
        'invoice.payment_failed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted'
      ]
    },
    mercadoPago: {
      name: 'Mercado Pago',
      regions: ['Brazil', 'Argentina', 'Mexico', 'LATAM'],
      features: ['PIX', 'Boleto', 'Cards', 'Wallet', 'Subscriptions'],
      fees: { percentage: 4.99, fixed: 0.00, currency: 'BRL' },
      docs: 'https://www.mercadopago.com.br/developers',
      bestFor: ['Brazilian market', 'PIX payments', 'Boleto'],
      sdk: {
        server: 'mercadopago',
        client: '@mercadopago/sdk-js'
      },
      webhookEvents: [
        'payment.created',
        'payment.approved',
        'payment.rejected',
        'payment.refunded'
      ]
    },
    lemonSqueezy: {
      name: 'Lemon Squeezy',
      regions: ['Global'],
      features: ['Subscriptions', 'License Keys', 'Tax Handling', 'Merchant of Record'],
      fees: { percentage: 5, fixed: 0.50, currency: 'USD' },
      docs: 'https://docs.lemonsqueezy.com',
      bestFor: ['Digital products', 'SaaS', 'Software licenses', 'Indie developers'],
      advantage: 'Handles VAT/GST automatically as Merchant of Record',
      sdk: {
        server: '@lemonsqueezy/lemonsqueezy.js'
      },
      webhookEvents: [
        'order_created',
        'subscription_created',
        'subscription_updated',
        'subscription_cancelled',
        'license_key_created'
      ]
    },
    pagarme: {
      name: 'Pagar.me',
      regions: ['Brazil'],
      features: ['PIX', 'Boleto', 'Cards', 'Split Payments'],
      fees: { percentage: 3.99, fixed: 0.00, currency: 'BRL' },
      docs: 'https://docs.pagar.me',
      bestFor: ['Brazilian market', 'Marketplaces with split']
    }
  },

  // ============================================
  // BUSINESS MODELS
  // ============================================
  businessModels: {
    oneTimePayment: {
      name: 'One-Time Payment',
      description: 'Single purchase, no recurring charges',
      stripeMode: 'payment',
      useCases: ['Physical products', 'Digital downloads', 'Services'],
      implementation: {
        stripe: 'Checkout Session with mode: "payment"',
        mercadoPago: 'Payment API with single charge'
      }
    },
    subscription: {
      name: 'Subscription / SaaS',
      description: 'Recurring payments at fixed intervals',
      stripeMode: 'subscription',
      useCases: ['SaaS', 'Memberships', 'Content subscriptions'],
      features: ['Free trials', 'Proration', 'Upgrades/Downgrades', 'Cancellation'],
      implementation: {
        stripe: 'Products + Prices (recurring) + Customer Portal',
        lemonSqueezy: 'Products + Variants + Checkout'
      },
      billingCycles: ['monthly', 'yearly', 'weekly', 'custom']
    },
    usageBased: {
      name: 'Usage-Based / Metered',
      description: 'Pay for what you use',
      stripeMode: 'subscription',
      useCases: ['API services', 'Cloud computing', 'Storage'],
      implementation: {
        stripe: 'Metered billing with usage records'
      }
    },
    marketplace: {
      name: 'Marketplace',
      description: 'Platform connecting buyers and sellers',
      stripeMode: 'payment',
      useCases: ['Multi-vendor stores', 'Service marketplaces'],
      features: ['Split payments', 'Seller onboarding', 'Platform fees'],
      implementation: {
        stripe: 'Stripe Connect (Standard/Express/Custom)',
        pagarme: 'Split Payments API'
      }
    },
    freemium: {
      name: 'Freemium',
      description: 'Free tier with paid upgrades',
      useCases: ['SaaS', 'Apps', 'Games'],
      implementation: 'Free plan + Subscription tiers'
    }
  },


  // ============================================
  // DATABASE SCHEMAS
  // ============================================
  databaseSchemas: {
    prisma: `
// schema.prisma - Ecommerce Complete Schema

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  stripeCustomerId String? @unique
  
  orders        Order[]
  subscriptions Subscription[]
  addresses     Address[]
  cart          CartItem[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Product {
  id            String    @id @default(cuid())
  name          String
  description   String?
  slug          String    @unique
  
  // Pricing
  price         Decimal   @db.Decimal(10, 2)
  compareAtPrice Decimal? @db.Decimal(10, 2)
  currency      String    @default("BRL")
  
  // Inventory
  sku           String?   @unique
  inventory     Int       @default(0)
  trackInventory Boolean  @default(true)
  
  // Status
  status        ProductStatus @default(DRAFT)
  
  // Relations
  images        ProductImage[]
  variants      ProductVariant[]
  categories    Category[]
  orderItems    OrderItem[]
  cartItems     CartItem[]
  
  // Stripe
  stripePriceId String?
  stripeProductId String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([status])
  @@index([slug])
}

enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model ProductVariant {
  id            String    @id @default(cuid())
  productId     String
  product       Product   @relation(fields: [productId], references: [id])
  
  name          String    // e.g., "Size: M, Color: Blue"
  sku           String?   @unique
  price         Decimal   @db.Decimal(10, 2)
  inventory     Int       @default(0)
  
  options       Json      // { size: "M", color: "Blue" }
  
  stripePriceId String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Order {
  id            String    @id @default(cuid())
  orderNumber   String    @unique @default(cuid())
  
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  // Amounts (stored in cents)
  subtotal      Int
  discount      Int       @default(0)
  shipping      Int       @default(0)
  tax           Int       @default(0)
  total         Int
  currency      String    @default("BRL")
  
  // Status
  status        OrderStatus @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  fulfillmentStatus FulfillmentStatus @default(UNFULFILLED)
  
  // Payment
  paymentMethod String?
  paymentIntentId String? @unique
  
  // Addresses
  shippingAddress Json?
  billingAddress  Json?
  
  // Items
  items         OrderItem[]
  
  // Metadata
  notes         String?
  metadata      Json?
  
  // Idempotency
  idempotencyKey String? @unique
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
  @@index([paymentStatus])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

enum FulfillmentStatus {
  UNFULFILLED
  PARTIALLY_FULFILLED
  FULFILLED
}

model OrderItem {
  id            String    @id @default(cuid())
  orderId       String
  order         Order     @relation(fields: [orderId], references: [id])
  
  productId     String
  product       Product   @relation(fields: [productId], references: [id])
  
  variantId     String?
  
  name          String    // Snapshot at time of order
  sku           String?
  quantity      Int
  unitPrice     Int       // In cents
  total         Int       // In cents
  
  createdAt     DateTime  @default(now())
}

model Subscription {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  // Stripe
  stripeSubscriptionId String @unique
  stripePriceId String
  stripeCustomerId String
  
  // Status
  status        SubscriptionStatus @default(ACTIVE)
  
  // Billing
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
  canceledAt         DateTime?
  
  // Plan info
  planName      String
  planInterval  String    // monthly, yearly
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  TRIALING
  PAUSED
}

model CartItem {
  id            String    @id @default(cuid())
  userId        String?
  user          User?     @relation(fields: [userId], references: [id])
  
  sessionId     String?   // For guest carts
  
  productId     String
  product       Product   @relation(fields: [productId], references: [id])
  
  variantId     String?
  quantity      Int       @default(1)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@unique([userId, productId, variantId])
  @@unique([sessionId, productId, variantId])
}

model Address {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  
  type          AddressType @default(SHIPPING)
  isDefault     Boolean   @default(false)
  
  firstName     String
  lastName      String
  company       String?
  address1      String
  address2      String?
  city          String
  state         String
  postalCode    String
  country       String    @default("BR")
  phone         String?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum AddressType {
  SHIPPING
  BILLING
}

// Audit log for financial transactions
model TransactionLog {
  id            String    @id @default(cuid())
  
  type          String    // payment, refund, subscription
  action        String    // created, updated, failed
  
  orderId       String?
  subscriptionId String?
  userId        String?
  
  amount        Int?
  currency      String?
  
  gatewayEvent  String?   // Stripe event type
  gatewayId     String?   // Payment intent ID, etc
  
  metadata      Json?
  
  createdAt     DateTime  @default(now())
  
  @@index([orderId])
  @@index([userId])
  @@index([type])
}
`,
    indexes: [
      'CREATE INDEX idx_orders_user_status ON orders(user_id, status);',
      'CREATE INDEX idx_products_status_slug ON products(status, slug);',
      'CREATE INDEX idx_transaction_log_created ON transaction_log(created_at DESC);'
    ]
  },


  // ============================================
  // CODE TEMPLATES
  // ============================================
  codeTemplates: {
    // 1. Stripe Setup
    stripeSetup: {
      filename: 'lib/stripe.ts',
      content: `import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

// Format amount for Stripe (converts to cents)
export function formatAmountForStripe(amount: number, currency: string): number {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'CLP', 'VND'];
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

// Format amount for display (converts from cents)
export function formatAmountForDisplay(amount: number, currency: string): string {
  const zeroDecimalCurrencies = ['JPY', 'KRW', 'CLP', 'VND'];
  const divisor = zeroDecimalCurrencies.includes(currency.toUpperCase()) ? 1 : 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency,
  }).format(amount / divisor);
}`
    },

    // 2. Checkout Session API
    checkoutSession: {
      filename: 'app/api/checkout/route.ts',
      content: `import { NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, shippingAddress } = await req.json();
    
    // Generate idempotency key
    const idempotencyKey = nanoid();

    // CRITICAL: Validate and recalculate prices server-side
    const validatedItems = await Promise.all(
      items.map(async (item: any) => {
        const product = await db.product.findUnique({
          where: { id: item.productId },
        });
        
        if (!product || product.status !== 'ACTIVE') {
          throw new Error(\`Product \${item.productId} not available\`);
        }
        
        // Check inventory
        if (product.trackInventory && product.inventory < item.quantity) {
          throw new Error(\`Insufficient inventory for \${product.name}\`);
        }
        
        return {
          price_data: {
            currency: 'brl',
            product_data: {
              name: product.name,
              description: product.description || undefined,
              images: product.images?.map(i => i.url) || [],
            },
            unit_amount: formatAmountForStripe(Number(product.price), 'BRL'),
          },
          quantity: item.quantity,
        };
      })
    );

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: validatedItems,
      mode: 'payment',
      success_url: \`\${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_URL}/checkout/cancel\`,
      customer_email: session.user.email!,
      metadata: {
        userId: session.user.id,
        idempotencyKey,
      },
      shipping_address_collection: {
        allowed_countries: ['BR'],
      },
    }, {
      idempotencyKey, // Prevent duplicate charges
    });

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id 
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed' }, 
      { status: 500 }
    );
  }
}`
    },

    // 3. Webhook Handler (CRITICAL)
    webhookHandler: {
      filename: 'app/api/webhooks/stripe/route.ts',
      content: `import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new NextResponse('Webhook Error', { status: 400 });
  }

  // CRITICAL: Check if event was already processed (idempotency)
  const existingLog = await db.transactionLog.findFirst({
    where: { gatewayId: event.id },
  });

  if (existingLog) {
    console.log('Event already processed:', event.id);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }

    // Log the event
    await db.transactionLog.create({
      data: {
        type: 'webhook',
        action: event.type,
        gatewayEvent: event.type,
        gatewayId: event.id,
        metadata: event.data.object as any,
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, idempotencyKey } = session.metadata || {};
  
  // Create order in database
  await db.$transaction(async (tx) => {
    // Check idempotency
    const existingOrder = await tx.order.findFirst({
      where: { idempotencyKey },
    });
    
    if (existingOrder) {
      console.log('Order already exists:', existingOrder.id);
      return;
    }

    // Get line items from Stripe
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
    
    // Calculate totals
    const subtotal = session.amount_subtotal || 0;
    const total = session.amount_total || 0;
    
    // Create order
    const order = await tx.order.create({
      data: {
        userId: userId!,
        subtotal,
        total,
        currency: session.currency?.toUpperCase() || 'BRL',
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paymentIntentId: session.payment_intent as string,
        idempotencyKey,
        shippingAddress: session.shipping_details as any,
        items: {
          create: lineItems.data.map((item) => ({
            productId: item.price?.product as string,
            name: item.description || 'Product',
            quantity: item.quantity || 1,
            unitPrice: item.price?.unit_amount || 0,
            total: (item.price?.unit_amount || 0) * (item.quantity || 1),
          })),
        },
      },
    });

    // Update inventory
    for (const item of lineItems.data) {
      await tx.product.update({
        where: { stripeProductId: item.price?.product as string },
        data: {
          inventory: { decrement: item.quantity || 1 },
        },
      });
    }

    console.log('Order created:', order.id);
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  await db.order.updateMany({
    where: { paymentIntentId: paymentIntent.id },
    data: { paymentStatus: 'PAID' },
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  await db.order.updateMany({
    where: { paymentIntentId: paymentIntent.id },
    data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Handle subscription invoice payment
  if (invoice.subscription) {
    await db.subscription.update({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: { status: 'ACTIVE' },
    });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await db.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    update: {
      status: subscription.status.toUpperCase() as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    create: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price.id,
      userId: subscription.metadata.userId,
      status: subscription.status.toUpperCase() as any,
      planName: subscription.items.data[0]?.price.nickname || 'Plan',
      planInterval: subscription.items.data[0]?.price.recurring?.interval || 'month',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
    },
  });
}`
    },


    // 4. Cart Store (Zustand)
    cartStore: {
      filename: 'stores/useCart.ts',
      content: `import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity?: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  
  // Computed
  itemCount: () => number;
  subtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const items = get().items;
        const itemId = \`\${newItem.productId}-\${newItem.variantId || 'default'}\`;
        const existingItem = items.find((item) => item.id === itemId);

        if (existingItem) {
          // Check max quantity
          const newQuantity = existingItem.quantity + (newItem.quantity || 1);
          if (newItem.maxQuantity && newQuantity > newItem.maxQuantity) {
            return; // Don't exceed max
          }
          
          set({
            items: items.map((item) =>
              item.id === itemId
                ? { ...item, quantity: newQuantity }
                : item
            ),
          });
        } else {
          set({
            items: [...items, { ...newItem, id: itemId, quantity: newItem.quantity || 1 }],
          });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),
      
      toggleCart: () => set({ isOpen: !get().isOpen }),

      itemCount: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      
      subtotal: () => get().items.reduce(
        (acc, item) => acc + item.price * item.quantity, 
        0
      ),
    }),
    {
      name: 'shopping-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);`
    },

    // 5. Subscription Management
    subscriptionManagement: {
      filename: 'app/api/subscriptions/route.ts',
      content: `import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

// Create subscription checkout
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, successUrl, cancelUrl } = await req.json();

    // Get or create Stripe customer
    let user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: { userId: session.user.id },
      });
      
      customerId = customer.id;
      
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session for subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl || \`\${process.env.NEXT_PUBLIC_URL}/dashboard?success=true\`,
      cancel_url: cancelUrl || \`\${process.env.NEXT_PUBLIC_URL}/pricing\`,
      subscription_data: {
        metadata: { userId: session.user.id },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get user's subscriptions
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscriptions = await db.subscription.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`
    },

    // 6. Customer Portal
    customerPortal: {
      filename: 'app/api/billing/portal/route.ts',
      content: `import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No billing account found' }, 
        { status: 400 }
      );
    }

    // Create Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: \`\${process.env.NEXT_PUBLIC_URL}/dashboard\`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`
    },

    // 7. Inventory Lock (Redis)
    inventoryLock: {
      filename: 'lib/inventory.ts',
      content: `import { Redis } from '@upstash/redis';
import { db } from '@/lib/db';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const LOCK_TTL = 600; // 10 minutes

interface InventoryLock {
  productId: string;
  variantId?: string;
  quantity: number;
  sessionId: string;
  expiresAt: number;
}

export async function reserveInventory(
  items: { productId: string; variantId?: string; quantity: number }[],
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const lockKey = \`inventory:lock:\${sessionId}\`;
  
  try {
    // Check availability for all items
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId },
        select: { inventory: true, trackInventory: true },
      });

      if (!product) {
        return { success: false, error: \`Product \${item.productId} not found\` };
      }

      if (product.trackInventory && product.inventory < item.quantity) {
        return { success: false, error: \`Insufficient inventory\` };
      }
    }

    // Create lock
    const lock: InventoryLock[] = items.map((item) => ({
      ...item,
      sessionId,
      expiresAt: Date.now() + LOCK_TTL * 1000,
    }));

    await redis.setex(lockKey, LOCK_TTL, JSON.stringify(lock));

    return { success: true };
  } catch (error: any) {
    console.error('Inventory lock error:', error);
    return { success: false, error: error.message };
  }
}

export async function releaseInventory(sessionId: string): Promise<void> {
  const lockKey = \`inventory:lock:\${sessionId}\`;
  await redis.del(lockKey);
}

export async function commitInventory(sessionId: string): Promise<boolean> {
  const lockKey = \`inventory:lock:\${sessionId}\`;
  const lockData = await redis.get<string>(lockKey);

  if (!lockData) {
    return false;
  }

  const locks: InventoryLock[] = JSON.parse(lockData);

  // Decrement inventory in database
  await db.$transaction(
    locks.map((lock) =>
      db.product.update({
        where: { id: lock.productId },
        data: { inventory: { decrement: lock.quantity } },
      })
    )
  );

  // Release lock
  await redis.del(lockKey);

  return true;
}`
    },


    // 8. Mercado Pago Integration (Brazil)
    mercadoPago: {
      filename: 'lib/mercadopago.ts',
      content: `import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export const mercadoPago = {
  payment: new Payment(client),
  preference: new Preference(client),
};

// Create PIX payment
export async function createPixPayment(data: {
  amount: number;
  description: string;
  email: string;
  externalReference: string;
}) {
  const payment = await mercadoPago.payment.create({
    body: {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: 'pix',
      payer: {
        email: data.email,
      },
      external_reference: data.externalReference,
    },
  });

  return {
    id: payment.id,
    status: payment.status,
    pixQrCode: payment.point_of_interaction?.transaction_data?.qr_code,
    pixQrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
    expirationDate: payment.date_of_expiration,
  };
}

// Create checkout preference (redirect)
export async function createPreference(data: {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
  }>;
  externalReference: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
}) {
  const preference = await mercadoPago.preference.create({
    body: {
      items: data.items.map((item) => ({
        ...item,
        currency_id: 'BRL',
      })),
      external_reference: data.externalReference,
      back_urls: {
        success: data.successUrl,
        failure: data.failureUrl,
        pending: data.pendingUrl,
      },
      auto_return: 'approved',
    },
  });

  return {
    id: preference.id,
    initPoint: preference.init_point,
    sandboxInitPoint: preference.sandbox_init_point,
  };
}`
    },

    // 9. Refund Handler
    refundHandler: {
      filename: 'app/api/orders/[orderId]/refund/route.ts',
      content: `import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, amount } = await req.json();

    // Get order
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Order is not paid' }, 
        { status: 400 }
      );
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentIntentId!,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full
      reason: reason || 'requested_by_customer',
    });

    // Update order status
    const isFullRefund = !amount || amount >= order.total / 100;
    
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          status: isFullRefund ? 'REFUNDED' : order.status,
        },
      }),
      // Restore inventory
      ...order.items.map((item) =>
        db.product.update({
          where: { id: item.productId },
          data: { inventory: { increment: item.quantity } },
        })
      ),
      // Log transaction
      db.transactionLog.create({
        data: {
          type: 'refund',
          action: isFullRefund ? 'full_refund' : 'partial_refund',
          orderId: order.id,
          userId: order.userId,
          amount: refund.amount,
          currency: refund.currency,
          gatewayId: refund.id,
          metadata: { reason },
        },
      }),
    ]);

    return NextResponse.json({ 
      success: true, 
      refundId: refund.id,
      amount: refund.amount / 100,
    });
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}`
    },

    // 10. Order State Machine
    orderStateMachine: {
      filename: 'lib/order-state-machine.ts',
      content: `import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@prisma/client';

type OrderState = {
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
};

type OrderEvent =
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUNDED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PROCESSING'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'FULFILLMENT_STARTED'
  | 'FULFILLMENT_COMPLETED';

const transitions: Record<string, Partial<OrderState>> = {
  'PENDING:PAYMENT_RECEIVED': {
    status: 'CONFIRMED',
    paymentStatus: 'PAID',
  },
  'PENDING:PAYMENT_FAILED': {
    status: 'CANCELLED',
    paymentStatus: 'FAILED',
  },
  'CONFIRMED:ORDER_PROCESSING': {
    status: 'PROCESSING',
  },
  'PROCESSING:ORDER_SHIPPED': {
    status: 'SHIPPED',
    fulfillmentStatus: 'FULFILLED',
  },
  'SHIPPED:ORDER_DELIVERED': {
    status: 'DELIVERED',
  },
  'CONFIRMED:ORDER_CANCELLED': {
    status: 'CANCELLED',
  },
  'PROCESSING:ORDER_CANCELLED': {
    status: 'CANCELLED',
  },
  'PAID:PAYMENT_REFUNDED': {
    paymentStatus: 'REFUNDED',
    status: 'REFUNDED',
  },
};

export function canTransition(
  currentState: OrderState,
  event: OrderEvent
): boolean {
  const key = \`\${currentState.status}:\${event}\`;
  return key in transitions;
}

export function getNextState(
  currentState: OrderState,
  event: OrderEvent
): OrderState | null {
  const key = \`\${currentState.status}:\${event}\`;
  const transition = transitions[key];
  
  if (!transition) {
    return null;
  }
  
  return {
    ...currentState,
    ...transition,
  };
}

export function getAvailableTransitions(currentState: OrderState): OrderEvent[] {
  const available: OrderEvent[] = [];
  
  for (const key of Object.keys(transitions)) {
    const [status] = key.split(':');
    if (status === currentState.status) {
      available.push(key.split(':')[1] as OrderEvent);
    }
  }
  
  return available;
}`
    },
  },


  // ============================================
  // CHECKOUT FLOWS
  // ============================================
  checkoutFlows: {
    standard: {
      name: 'Standard Checkout',
      description: 'Redirect to Stripe Checkout',
      steps: [
        '1. User adds items to cart (localStorage/Zustand)',
        '2. User clicks "Checkout"',
        '3. Frontend sends cart items to API',
        '4. Backend VALIDATES and RECALCULATES prices',
        '5. Backend creates Stripe Checkout Session',
        '6. User is redirected to Stripe hosted page',
        '7. User completes payment on Stripe',
        '8. Stripe sends webhook to backend',
        '9. Backend creates order and updates inventory',
        '10. User is redirected to success page'
      ],
      pros: ['PCI compliant', 'No card handling', 'Built-in fraud protection'],
      cons: ['User leaves your site', 'Less customization']
    },
    embedded: {
      name: 'Embedded Checkout',
      description: 'Stripe Elements in your UI',
      steps: [
        '1. User adds items to cart',
        '2. User enters shipping info on your site',
        '3. Backend creates PaymentIntent',
        '4. Frontend renders Stripe Elements',
        '5. User enters card details in Elements',
        '6. Frontend confirms payment with Stripe',
        '7. Stripe sends webhook to backend',
        '8. Backend creates order'
      ],
      pros: ['User stays on your site', 'Full UI control'],
      cons: ['More complex', 'Must handle more edge cases']
    },
    subscription: {
      name: 'Subscription Checkout',
      description: 'Recurring billing setup',
      steps: [
        '1. User selects plan',
        '2. Backend gets/creates Stripe Customer',
        '3. Backend creates Checkout Session (mode: subscription)',
        '4. User completes payment',
        '5. Webhook creates subscription record',
        '6. User can manage via Customer Portal'
      ]
    }
  },

  // ============================================
  // FRAUD PREVENTION
  // ============================================
  fraudPrevention: {
    strategies: [
      {
        name: 'Stripe Radar',
        description: 'Built-in ML fraud detection',
        implementation: 'Enabled by default with Stripe',
        effectiveness: 'High'
      },
      {
        name: 'Velocity Checks',
        description: 'Limit orders per user/IP/card',
        implementation: 'Redis rate limiting',
        rules: [
          'Max 5 orders per hour per user',
          'Max 10 orders per hour per IP',
          'Max 3 failed payments per card per day'
        ]
      },
      {
        name: 'Address Verification (AVS)',
        description: 'Verify billing address matches card',
        implementation: 'Stripe handles automatically'
      },
      {
        name: 'CVV Verification',
        description: 'Require CVV for all transactions',
        implementation: 'Stripe Elements requires by default'
      },
      {
        name: 'Amount Limits',
        description: 'Flag unusually large orders',
        rules: [
          'Orders > $1000 require manual review',
          'First order > $500 requires verification'
        ]
      },
      {
        name: 'Device Fingerprinting',
        description: 'Track device characteristics',
        implementation: 'Stripe.js collects automatically'
      }
    ],
    redFlags: [
      'Multiple failed payment attempts',
      'Mismatched billing/shipping addresses',
      'High-risk countries',
      'Proxy/VPN usage',
      'Multiple cards from same IP',
      'Rush shipping on high-value orders',
      'New account with large order'
    ]
  },

  // ============================================
  // METRICS & ANALYTICS
  // ============================================
  metrics: {
    conversion: {
      cartAbandonmentRate: {
        formula: '(Carts Created - Orders Completed) / Carts Created',
        benchmark: '70-80%',
        improvement: ['Simplify checkout', 'Add trust badges', 'Offer guest checkout']
      },
      checkoutConversionRate: {
        formula: 'Orders Completed / Checkout Started',
        benchmark: '30-50%',
        improvement: ['Reduce form fields', 'Show progress', 'Multiple payment options']
      },
      paymentSuccessRate: {
        formula: 'Successful Payments / Payment Attempts',
        benchmark: '95%+',
        improvement: ['Retry logic', 'Card update reminders', 'Alternative payment methods']
      }
    },
    revenue: {
      averageOrderValue: {
        formula: 'Total Revenue / Number of Orders',
        improvement: ['Upsells', 'Bundles', 'Free shipping threshold']
      },
      customerLifetimeValue: {
        formula: 'Average Order Value × Purchase Frequency × Customer Lifespan',
        improvement: ['Loyalty programs', 'Subscriptions', 'Email marketing']
      },
      monthlyRecurringRevenue: {
        formula: 'Sum of all active subscription amounts',
        forSubscriptions: true
      }
    },
    operational: {
      refundRate: {
        formula: 'Refunds / Total Orders',
        benchmark: '<2%',
        alert: '>5%'
      },
      chargebackRate: {
        formula: 'Chargebacks / Total Transactions',
        benchmark: '<0.5%',
        alert: '>1% (Stripe may suspend)'
      },
      fulfillmentTime: {
        formula: 'Average time from order to shipment',
        benchmark: '<24 hours'
      }
    }
  },

  // ============================================
  // SECURITY CHECKLIST
  // ============================================
  securityChecklist: {
    environment: [
      '✅ STRIPE_SECRET_KEY in environment variables (never in code)',
      '✅ STRIPE_WEBHOOK_SECRET configured',
      '✅ STRIPE_PUBLISHABLE_KEY for frontend only',
      '✅ Different keys for test/production',
      '✅ Keys rotated periodically'
    ],
    api: [
      '✅ HTTPS on all endpoints',
      '✅ Webhook signature verification',
      '✅ Idempotency keys for all mutations',
      '✅ Rate limiting on checkout endpoints',
      '✅ Input validation on all requests',
      '✅ Server-side price calculation'
    ],
    data: [
      '✅ Never store raw card numbers',
      '✅ Use Stripe tokens/PaymentMethods',
      '✅ Encrypt sensitive data at rest',
      '✅ Audit logs for all transactions',
      '✅ PII handling compliant with LGPD/GDPR'
    ],
    monitoring: [
      '✅ Alert on failed webhooks',
      '✅ Alert on high refund rate',
      '✅ Alert on unusual order patterns',
      '✅ Log all payment events',
      '✅ Monitor Stripe Dashboard'
    ]
  },


  // ============================================
  // TROUBLESHOOTING
  // ============================================
  troubleshooting: {
    webhookNotReceived: {
      symptoms: ['Orders not created', 'Payments show in Stripe but not in app'],
      causes: [
        'Webhook URL not configured in Stripe',
        'Webhook secret mismatch',
        'Server not accessible (firewall, localhost)',
        'Endpoint returning non-200 status'
      ],
      solutions: [
        'Use Stripe CLI for local testing: stripe listen --forward-to localhost:3000/api/webhooks/stripe',
        'Verify webhook secret matches environment variable',
        'Check server logs for errors',
        'Ensure endpoint returns 200 quickly (process async)',
        'Use ngrok for local development'
      ]
    },
    duplicateCharges: {
      symptoms: ['Customer charged multiple times', 'Multiple orders for same purchase'],
      causes: [
        'Missing idempotency key',
        'Webhook processed multiple times',
        'Frontend retry without idempotency'
      ],
      solutions: [
        'Always use idempotency keys in Stripe API calls',
        'Check for existing order before creating new one',
        'Store webhook event IDs and skip duplicates',
        'Use database unique constraints'
      ]
    },
    paymentFailed: {
      symptoms: ['Payment declined', 'Card errors'],
      causes: [
        'Insufficient funds',
        'Card expired',
        'Fraud detection triggered',
        'Invalid card details'
      ],
      solutions: [
        'Show clear error messages to user',
        'Suggest trying different card',
        'Check Stripe Dashboard for decline reason',
        'Implement retry with exponential backoff for network errors'
      ]
    },
    inventoryMismatch: {
      symptoms: ['Overselling', 'Negative inventory'],
      causes: [
        'Race condition in checkout',
        'Inventory not decremented atomically',
        'Webhook processing delay'
      ],
      solutions: [
        'Use Redis locks for inventory reservation',
        'Decrement inventory in same transaction as order creation',
        'Implement inventory reservation with TTL',
        'Use database transactions with row locking'
      ]
    },
    subscriptionIssues: {
      symptoms: ['Subscription not created', 'Wrong plan assigned'],
      causes: [
        'Customer not created in Stripe',
        'Price ID mismatch',
        'Webhook not handling subscription events'
      ],
      solutions: [
        'Ensure customer exists before creating subscription',
        'Verify price IDs match between environments',
        'Handle all subscription webhook events',
        'Use Customer Portal for user self-service'
      ]
    }
  },

  // ============================================
  // IMPLEMENTATION CHECKLIST
  // ============================================
  implementationChecklist: {
    setup: [
      'Create Stripe account and get API keys',
      'Install Stripe SDK (stripe, @stripe/stripe-js)',
      'Configure environment variables',
      'Set up webhook endpoint',
      'Configure webhook in Stripe Dashboard'
    ],
    database: [
      'Create products table',
      'Create orders table with proper indexes',
      'Create order_items table',
      'Create subscriptions table (if needed)',
      'Create transaction_log table for audit',
      'Set up proper foreign keys and constraints'
    ],
    backend: [
      'Implement product catalog API',
      'Implement cart validation endpoint',
      'Implement checkout session creation',
      'Implement webhook handler with idempotency',
      'Implement order management APIs',
      'Implement refund handling',
      'Add proper error handling and logging'
    ],
    frontend: [
      'Implement cart state management',
      'Implement product listing and detail pages',
      'Implement checkout flow',
      'Handle payment success/failure redirects',
      'Implement order history page',
      'Add loading states and error handling'
    ],
    testing: [
      'Test with Stripe test cards',
      'Test webhook handling locally with Stripe CLI',
      'Test edge cases (failed payments, refunds)',
      'Test inventory management',
      'Test subscription lifecycle',
      'Load test checkout flow'
    ],
    production: [
      'Switch to production API keys',
      'Configure production webhook URL',
      'Set up monitoring and alerts',
      'Configure backup and recovery',
      'Document runbooks for common issues'
    ]
  },

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  actions: {
    getSystemPrompt: () => {
      return `VOCÊ É O ECOMMERCE SUPREME ARCHITECT.

Sua missão é criar sistemas de vendas online seguros, escaláveis e de alta conversão.

DIRETRIZES TÉCNICAS INVIOLÁVEIS:
1. SEGURANÇA: Nunca armazene números de cartão. Use Stripe Elements ou Checkout.
2. IDEMPOTÊNCIA: Toda operação financeira deve ser idempotente. Use idempotency keys.
3. WEBHOOKS: Todo pagamento deve ser confirmado via webhook, não apenas no frontend.
4. SERVER-SIDE: Preços são SEMPRE calculados no backend. Nunca confie no frontend.
5. TRANSAÇÕES: Pagamento e atualização de estoque devem ser atômicos.
6. AUDITORIA: Toda transação financeira deve ser logada para auditoria.

STACK PADRÃO:
- Frontend: Next.js + Zustand + Stripe Elements
- Backend: Next.js API Routes + Prisma
- Database: PostgreSQL (orders, products) + Redis (cart, locks)
- Payments: Stripe (global) ou Mercado Pago (Brasil)

FLUXO DE CHECKOUT:
1. Usuário adiciona ao carrinho (localStorage)
2. Frontend envia items para API
3. Backend RECALCULA preços (segurança)
4. Backend cria Stripe Checkout Session
5. Usuário completa pagamento no Stripe
6. Webhook confirma pagamento
7. Backend cria pedido e atualiza estoque (transação atômica)
8. Usuário recebe confirmação

Se o usuário pedir "loja", "ecommerce", "pagamento" ou "checkout", use os templates deste manifesto.`;
    },

    determinePaymentModel: (businessType: string) => {
      if (businessType.includes('saas') || businessType.includes('assinatura') || businessType.includes('subscription')) {
        return {
          mode: 'subscription',
          gateway: 'Stripe ou Lemon Squeezy',
          resources: ['Stripe Products', 'Stripe Prices (Recurring)', 'Customer Portal', 'Webhooks']
        };
      }
      if (businessType.includes('marketplace')) {
        return {
          mode: 'payment',
          gateway: 'Stripe Connect',
          resources: ['Connected Accounts', 'Split Payments', 'Platform Fees']
        };
      }
      if (businessType.includes('brasil') || businessType.includes('pix')) {
        return {
          mode: 'payment',
          gateway: 'Mercado Pago',
          resources: ['PIX', 'Boleto', 'Cartão de Crédito']
        };
      }
      return {
        mode: 'payment',
        gateway: 'Stripe',
        resources: ['Stripe Checkout', 'One-time Prices', 'Webhooks']
      };
    },

    getSecurityChecklist: () => [
      "✅ STRIPE_SECRET_KEY em variáveis de ambiente (nunca no código)",
      "✅ STRIPE_WEBHOOK_SECRET configurado e validado",
      "✅ HTTPS ativado em todas as rotas",
      "✅ Idempotency keys em todas as operações de pagamento",
      "✅ Preços validados e recalculados no backend",
      "✅ Webhook signature verification implementado",
      "✅ Logging de todas as transações financeiras",
      "✅ Rate limiting em endpoints de checkout",
      "✅ Transações atômicas para pagamento + estoque"
    ],

    getTestCards: () => ({
      success: '4242424242424242',
      decline: '4000000000000002',
      insufficientFunds: '4000000000009995',
      expiredCard: '4000000000000069',
      incorrectCvc: '4000000000000127',
      processingError: '4000000000000119',
      threeDSecure: '4000002500003155',
      threeDSecureFail: '4000008260003178'
    })
  }
};

// ============================================
// TYPE DEFINITIONS
// ============================================
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CheckoutRequest {
  items: CartItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  couponCode?: string;
}

export interface Address {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type FulfillmentStatus = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED';

export default ECOMMERCE_SUPREME_MANIFEST;
