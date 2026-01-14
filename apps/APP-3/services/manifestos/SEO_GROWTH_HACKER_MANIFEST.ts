/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      📈 SEO GROWTH HACKER MANIFEST - O DOMINADOR DO GOOGLE 📈               ║
 * ║                                                                              ║
 * ║         "Primeira página do Google não é sorte. É engenharia."              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Manifesto completo para SEO Técnico, Schema.org, Core Web Vitals e Analytics.
 * Suporta: Next.js, React, Vue, Nuxt, Astro, HTML estático
 * 
 * @author Micro SaaS Factory
 * @version 1.0.0
 */

export const SEO_GROWTH_HACKER_MANIFEST = {
  id: 'seo-growth-hacker',
  name: 'SEO Growth Hacker',
  version: '1.0.0',
  description: 'Especialista em SEO Técnico, Schema.org, Core Web Vitals e Growth',
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PALAVRAS-CHAVE PARA ATIVAÇÃO
  // ═══════════════════════════════════════════════════════════════════════════════
  keywords: [
    'seo', 'search engine optimization', 'google', 'ranking', 'serp',
    'meta tags', 'title', 'description', 'og tags', 'open graph',
    'schema.org', 'json-ld', 'structured data', 'rich snippets',
    'sitemap', 'robots.txt', 'canonical', 'hreflang',
    'core web vitals', 'lcp', 'fid', 'cls', 'inp', 'ttfb',
    'page speed', 'lighthouse', 'performance', 'web vitals',
    'analytics', 'ga4', 'google analytics', 'posthog', 'plausible',
    'conversion', 'ctr', 'bounce rate', 'organic traffic',
    'keyword research', 'backlinks', 'indexação', 'crawling'
  ],

  // ═══════════════════════════════════════════════════════════════════════════════
  // FILOSOFIA
  // ═══════════════════════════════════════════════════════════════════════════════
  philosophy: {
    core: 'SEO não é magia negra. É código bem escrito + conteúdo relevante + performance.',
    principles: [
      'Technical SEO First - Fundação técnica perfeita',
      'Content is King - Conteúdo relevante e único',
      'User Experience - Google mede o que usuários sentem',
      'Mobile First - Google indexa mobile primeiro',
      'Speed Matters - Cada segundo conta',
      'Structured Data - Ajude o Google a entender',
      'Measure Everything - Dados guiam decisões'
    ],
    antiPatterns: [
      'Keyword stuffing - Repetir palavras-chave excessivamente',
      'Hidden text - Texto invisível para usuários',
      'Cloaking - Mostrar conteúdo diferente para bots',
      'Link schemes - Comprar ou trocar links artificialmente',
      'Duplicate content - Copiar conteúdo de outros sites',
      'Ignoring mobile - Site não responsivo'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CORE WEB VITALS
  // ═══════════════════════════════════════════════════════════════════════════════
  coreWebVitals: {
    metrics: {
      LCP: {
        name: 'Largest Contentful Paint',
        description: 'Tempo para renderizar o maior elemento visível',
        good: '≤ 2.5s',
        needsImprovement: '2.5s - 4s',
        poor: '> 4s',
        howToImprove: [
          'Otimizar imagens (WebP, AVIF, lazy loading)',
          'Preload recursos críticos',
          'Usar CDN para assets',
          'Otimizar server response time',
          'Remover render-blocking resources'
        ]
      },
      INP: {
        name: 'Interaction to Next Paint',
        description: 'Responsividade a interações do usuário',
        good: '≤ 200ms',
        needsImprovement: '200ms - 500ms',
        poor: '> 500ms',
        howToImprove: [
          'Quebrar long tasks (> 50ms)',
          'Usar web workers para tarefas pesadas',
          'Otimizar event handlers',
          'Reduzir JavaScript no main thread',
          'Usar requestIdleCallback para tarefas não-críticas'
        ]
      },
      CLS: {
        name: 'Cumulative Layout Shift',
        description: 'Estabilidade visual (elementos pulando)',
        good: '≤ 0.1',
        needsImprovement: '0.1 - 0.25',
        poor: '> 0.25',
        howToImprove: [
          'Definir width/height em imagens e vídeos',
          'Reservar espaço para ads e embeds',
          'Evitar inserir conteúdo acima do existente',
          'Usar font-display: swap com fallback similar',
          'Evitar animações que causem layout shift'
        ]
      },
      TTFB: {
        name: 'Time to First Byte',
        description: 'Tempo até primeiro byte do servidor',
        good: '≤ 800ms',
        needsImprovement: '800ms - 1800ms',
        poor: '> 1800ms',
        howToImprove: [
          'Usar CDN',
          'Otimizar queries de banco de dados',
          'Implementar caching (Redis, Varnish)',
          'Usar edge computing',
          'Otimizar server-side rendering'
        ]
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // META TAGS TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════════
  metaTags: {
    nextjs: `// ═══════════════════════════════════════════════════════════════
// NEXT.JS - Metadata API (App Router)
// ═══════════════════════════════════════════════════════════════
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://meusite.com'),
  title: {
    default: 'Meu Site - Título Principal',
    template: '%s | Meu Site',
  },
  description: 'Descrição do site com 150-160 caracteres para melhor exibição no Google.',
  keywords: ['palavra-chave1', 'palavra-chave2', 'palavra-chave3'],
  authors: [{ name: 'Autor', url: 'https://meusite.com' }],
  creator: 'Nome da Empresa',
  publisher: 'Nome da Empresa',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://meusite.com',
    siteName: 'Meu Site',
    title: 'Meu Site - Título para Redes Sociais',
    description: 'Descrição para compartilhamento em redes sociais.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Descrição da imagem',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meu Site - Título para Twitter',
    description: 'Descrição para Twitter.',
    creator: '@usuario',
    images: ['/twitter-image.png'],
  },
  verification: {
    google: 'google-site-verification-code',
    yandex: 'yandex-verification-code',
  },
  alternates: {
    canonical: 'https://meusite.com',
    languages: {
      'en-US': 'https://meusite.com/en',
      'pt-BR': 'https://meusite.com',
    },
  },
};

// app/blog/[slug]/page.tsx - Dynamic Metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      images: [{ url: post.coverImage }],
    },
  };
}`,

    html: `<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- HTML - Meta Tags Completas -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <!-- Charset e Viewport -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- SEO Básico -->
  <title>Título da Página | Nome do Site</title>
  <meta name="description" content="Descrição com 150-160 caracteres.">
  <meta name="keywords" content="palavra1, palavra2, palavra3">
  <meta name="author" content="Nome do Autor">
  <meta name="robots" content="index, follow">
  
  <!-- Canonical -->
  <link rel="canonical" href="https://meusite.com/pagina">
  
  <!-- Hreflang (Multi-idioma) -->
  <link rel="alternate" hreflang="pt-BR" href="https://meusite.com/pagina">
  <link rel="alternate" hreflang="en-US" href="https://meusite.com/en/page">
  <link rel="alternate" hreflang="x-default" href="https://meusite.com/pagina">
  
  <!-- Open Graph (Facebook, LinkedIn) -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://meusite.com/pagina">
  <meta property="og:title" content="Título para Redes Sociais">
  <meta property="og:description" content="Descrição para compartilhamento.">
  <meta property="og:image" content="https://meusite.com/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:locale" content="pt_BR">
  <meta property="og:site_name" content="Nome do Site">
  
  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@usuario">
  <meta name="twitter:creator" content="@usuario">
  <meta name="twitter:title" content="Título para Twitter">
  <meta name="twitter:description" content="Descrição para Twitter.">
  <meta name="twitter:image" content="https://meusite.com/twitter-image.png">
  
  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/manifest.json">
  
  <!-- Preconnect para performance -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="https://www.google-analytics.com">
</head>
</html>`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCHEMA.ORG / JSON-LD
  // ═══════════════════════════════════════════════════════════════════════════════
  schemaOrg: {
    description: 'Dados estruturados que ajudam o Google a entender seu conteúdo',
    benefits: [
      'Rich Snippets nos resultados de busca',
      'Knowledge Graph',
      'Voice Search optimization',
      'Melhor CTR nos resultados'
    ],
    
    templates: {
      organization: `// ═══════════════════════════════════════════════════════════════
// SCHEMA.ORG - Organization
// ═══════════════════════════════════════════════════════════════
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nome da Empresa",
  "url": "https://meusite.com",
  "logo": "https://meusite.com/logo.png",
  "description": "Descrição da empresa.",
  "foundingDate": "2020",
  "founders": [
    {
      "@type": "Person",
      "name": "Nome do Fundador"
    }
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Exemplo, 123",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "01234-567",
    "addressCountry": "BR"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+55-11-1234-5678",
    "contactType": "customer service",
    "availableLanguage": ["Portuguese", "English"]
  },
  "sameAs": [
    "https://www.facebook.com/empresa",
    "https://www.instagram.com/empresa",
    "https://www.linkedin.com/company/empresa",
    "https://twitter.com/empresa"
  ]
};`,

      product: `// ═══════════════════════════════════════════════════════════════
// SCHEMA.ORG - Product (E-commerce)
// ═══════════════════════════════════════════════════════════════
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nome do Produto",
  "image": [
    "https://meusite.com/produto-1.jpg",
    "https://meusite.com/produto-2.jpg"
  ],
  "description": "Descrição detalhada do produto.",
  "sku": "SKU123",
  "mpn": "MPN456",
  "brand": {
    "@type": "Brand",
    "name": "Nome da Marca"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://meusite.com/produto",
    "priceCurrency": "BRL",
    "price": "199.90",
    "priceValidUntil": "2025-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Nome da Loja"
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  },
  "review": [
    {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5"
      },
      "author": {
        "@type": "Person",
        "name": "João Silva"
      },
      "reviewBody": "Excelente produto!"
    }
  ]
};`,

      article: `// ═══════════════════════════════════════════════════════════════
// SCHEMA.ORG - Article (Blog)
// ═══════════════════════════════════════════════════════════════
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Título do Artigo",
  "description": "Descrição do artigo.",
  "image": "https://meusite.com/artigo-cover.jpg",
  "datePublished": "2024-01-15T08:00:00+00:00",
  "dateModified": "2024-01-20T10:00:00+00:00",
  "author": {
    "@type": "Person",
    "name": "Nome do Autor",
    "url": "https://meusite.com/autor"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Nome do Site",
    "logo": {
      "@type": "ImageObject",
      "url": "https://meusite.com/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://meusite.com/blog/artigo"
  }
};`,

      faq: `// ═══════════════════════════════════════════════════════════════
// SCHEMA.ORG - FAQ Page
// ═══════════════════════════════════════════════════════════════
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Qual é a pergunta 1?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Esta é a resposta para a pergunta 1."
      }
    },
    {
      "@type": "Question",
      "name": "Qual é a pergunta 2?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Esta é a resposta para a pergunta 2."
      }
    }
  ]
};`,

      breadcrumb: `// ═══════════════════════════════════════════════════════════════
// SCHEMA.ORG - BreadcrumbList
// ═══════════════════════════════════════════════════════════════
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://meusite.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://meusite.com/blog"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Título do Artigo",
      "item": "https://meusite.com/blog/artigo"
    }
  ]
};`,

      localBusiness: `// ═══════════════════════════════════════════════════════════════
// SCHEMA.ORG - LocalBusiness
// ═══════════════════════════════════════════════════════════════
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Nome do Negócio",
  "image": "https://meusite.com/loja.jpg",
  "telephone": "+55-11-1234-5678",
  "email": "contato@meusite.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Exemplo, 123",
    "addressLocality": "São Paulo",
    "addressRegion": "SP",
    "postalCode": "01234-567",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "09:00",
      "closes": "13:00"
    }
  ],
  "priceRange": "$$"
};`
    }
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // SITEMAP E ROBOTS.TXT
  // ═══════════════════════════════════════════════════════════════════════════════
  technicalSeo: {
    sitemap: `// ═══════════════════════════════════════════════════════════════
// NEXT.JS - Dynamic Sitemap
// ═══════════════════════════════════════════════════════════════
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://meusite.com';
  
  // Páginas estáticas
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: \`\${baseUrl}/sobre\`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: \`\${baseUrl}/contato\`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: \`\${baseUrl}/blog\`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];
  
  // Páginas dinâmicas (blog posts)
  const posts = await getPosts();
  const blogPages = posts.map((post) => ({
    url: \`\${baseUrl}/blog/\${post.slug}\`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Páginas de produtos
  const products = await getProducts();
  const productPages = products.map((product) => ({
    url: \`\${baseUrl}/produtos/\${product.slug}\`,
    lastModified: new Date(product.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));
  
  return [...staticPages, ...blogPages, ...productPages];
}`,

    robotsTxt: `// ═══════════════════════════════════════════════════════════════
// NEXT.JS - robots.txt
// ═══════════════════════════════════════════════════════════════
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://meusite.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/private/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/'],
      },
    ],
    sitemap: \`\${baseUrl}/sitemap.xml\`,
  };
}

// Ou arquivo estático: public/robots.txt
/*
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /private/

User-agent: Googlebot
Allow: /

Sitemap: https://meusite.com/sitemap.xml
*/`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════════════════════════════════════════════
  analytics: {
    tools: {
      ga4: {
        name: 'Google Analytics 4',
        type: 'Full analytics suite',
        pricing: 'Free (with limits)',
        features: ['Events', 'Conversions', 'Audiences', 'Explorations', 'BigQuery export']
      },
      posthog: {
        name: 'PostHog',
        type: 'Product analytics',
        pricing: 'Free tier generous, then usage-based',
        features: ['Session recordings', 'Feature flags', 'A/B testing', 'Funnels', 'Self-hosted option']
      },
      plausible: {
        name: 'Plausible',
        type: 'Privacy-focused analytics',
        pricing: 'Paid (affordable)',
        features: ['GDPR compliant', 'No cookies', 'Lightweight', 'Simple dashboard']
      },
      mixpanel: {
        name: 'Mixpanel',
        type: 'Product analytics',
        pricing: 'Free tier, then paid',
        features: ['User analytics', 'Funnels', 'Retention', 'A/B testing']
      }
    },

    ga4Setup: `// ═══════════════════════════════════════════════════════════════
// GOOGLE ANALYTICS 4 - Next.js Setup
// ═══════════════════════════════════════════════════════════════
// lib/gtag.ts
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Log page views
export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

// Log specific events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label: string;
  value?: number;
}) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          strategy="afterInteractive"
          src={\`https://www.googletagmanager.com/gtag/js?id=\${GA_TRACKING_ID}\`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: \`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '\${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            \`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}`,

    conversionTracking: `// ═══════════════════════════════════════════════════════════════
// CONVERSION TRACKING - Events
// ═══════════════════════════════════════════════════════════════
// Track sign up
const trackSignUp = (method: string) => {
  gtag('event', 'sign_up', {
    method: method, // 'email', 'google', 'github'
  });
};

// Track purchase
const trackPurchase = (transaction: {
  transactionId: string;
  value: number;
  currency: string;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
}) => {
  gtag('event', 'purchase', {
    transaction_id: transaction.transactionId,
    value: transaction.value,
    currency: transaction.currency,
    items: transaction.items,
  });
};

// Track lead generation
const trackLead = (source: string) => {
  gtag('event', 'generate_lead', {
    currency: 'BRL',
    value: 50, // Estimated lead value
    source: source,
  });
};

// Track content engagement
const trackContentView = (contentType: string, contentId: string) => {
  gtag('event', 'view_item', {
    content_type: contentType,
    content_id: contentId,
  });
};`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // PERFORMANCE OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════════════════════
  performance: {
    images: `// ═══════════════════════════════════════════════════════════════
// IMAGE OPTIMIZATION - Next.js
// ═══════════════════════════════════════════════════════════════
import Image from 'next/image';

// Optimized image with lazy loading
export function OptimizedImage({ src, alt, priority = false }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      priority={priority} // true for above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
    />
  );
}

// next.config.js - Image optimization config
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['images.example.com'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },
};`,

    fonts: `// ═══════════════════════════════════════════════════════════════
// FONT OPTIMIZATION - Next.js
// ═══════════════════════════════════════════════════════════════
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={\`\${inter.variable} \${robotoMono.variable}\`}>
      <body>{children}</body>
    </html>
  );
}

// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        mono: ['var(--font-roboto-mono)'],
      },
    },
  },
};`,

    preloading: `<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- RESOURCE PRELOADING -->
<!-- ═══════════════════════════════════════════════════════════════ -->
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero-image.webp" as="image">
<link rel="preload" href="/critical.css" as="style">

<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://www.google-analytics.com">

<!-- DNS prefetch for less critical domains -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- Prefetch next page (for likely navigation) -->
<link rel="prefetch" href="/about">`
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHECKLIST
  // ═══════════════════════════════════════════════════════════════════════════════
  checklist: {
    technical: [
      'Title tag único e descritivo (50-60 chars)?',
      'Meta description atraente (150-160 chars)?',
      'Canonical URL definida?',
      'Sitemap.xml gerado e atualizado?',
      'Robots.txt configurado corretamente?',
      'HTTPS em todas as páginas?',
      'Mobile-friendly (responsive)?',
      'URLs amigáveis (sem IDs, com keywords)?'
    ],
    performance: [
      'LCP ≤ 2.5s?',
      'INP ≤ 200ms?',
      'CLS ≤ 0.1?',
      'Imagens otimizadas (WebP/AVIF)?',
      'Lazy loading em imagens below-the-fold?',
      'Fonts otimizadas (display: swap)?',
      'JavaScript minimizado e tree-shaken?',
      'CSS crítico inline?'
    ],
    content: [
      'H1 único por página?',
      'Hierarquia de headings correta (H1 > H2 > H3)?',
      'Alt text em todas as imagens?',
      'Links internos relevantes?',
      'Conteúdo original e valioso?',
      'Palavras-chave naturalmente distribuídas?'
    ],
    structuredData: [
      'Schema.org implementado?',
      'JSON-LD válido (teste no Rich Results Test)?',
      'Organization schema na home?',
      'BreadcrumbList em páginas internas?',
      'Product schema em e-commerce?',
      'Article schema em blog posts?'
    ],
    analytics: [
      'Google Analytics 4 configurado?',
      'Google Search Console verificado?',
      'Conversões configuradas?',
      'Events de engajamento trackados?'
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // TOOLS
  // ═══════════════════════════════════════════════════════════════════════════════
  tools: {
    testing: [
      { name: 'Google PageSpeed Insights', url: 'https://pagespeed.web.dev/' },
      { name: 'Google Rich Results Test', url: 'https://search.google.com/test/rich-results' },
      { name: 'Google Mobile-Friendly Test', url: 'https://search.google.com/test/mobile-friendly' },
      { name: 'Schema Markup Validator', url: 'https://validator.schema.org/' },
      { name: 'Lighthouse (Chrome DevTools)', url: 'Built into Chrome' },
      { name: 'WebPageTest', url: 'https://www.webpagetest.org/' }
    ],
    monitoring: [
      { name: 'Google Search Console', url: 'https://search.google.com/search-console' },
      { name: 'Ahrefs', url: 'https://ahrefs.com/' },
      { name: 'SEMrush', url: 'https://www.semrush.com/' },
      { name: 'Moz', url: 'https://moz.com/' }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: 'website' | 'article' | 'product';
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image';
    site?: string;
    creator?: string;
  };
  structuredData?: object;
}

export interface CoreWebVitalsMetrics {
  LCP: number;
  INP: number;
  CLS: number;
  TTFB: number;
}

export default SEO_GROWTH_HACKER_MANIFEST;
