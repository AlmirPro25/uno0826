# 📈 SEO GROWTH HACKER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- SEO, Search Engine Optimization, Google, Ranking
- Meta tags, Title, Description, OG Tags, Open Graph
- Schema.org, JSON-LD, Structured Data, Rich Snippets
- Sitemap, Robots.txt, Canonical, Hreflang
- Core Web Vitals, LCP, FID, CLS, INP, TTFB
- Page Speed, Lighthouse, Performance
- Analytics, GA4, Google Analytics, PostHog

## FILOSOFIA
> "SEO não é magia negra. É código bem escrito + conteúdo relevante + performance."

### Princípios Invioláveis
1. **Technical SEO First** - Fundação técnica perfeita
2. **Content is King** - Conteúdo relevante e único
3. **User Experience** - Google mede o que usuários sentem
4. **Mobile First** - Google indexa mobile primeiro
5. **Speed Matters** - Cada segundo conta
6. **Structured Data** - Ajude o Google a entender
7. **Measure Everything** - Dados guiam decisões

## CORE WEB VITALS

### LCP (Largest Contentful Paint)
- **Bom:** ≤ 2.5s
- **Melhorar:** Otimizar imagens, preload recursos críticos, usar CDN

### INP (Interaction to Next Paint)
- **Bom:** ≤ 200ms
- **Melhorar:** Quebrar long tasks, usar web workers, otimizar JS

### CLS (Cumulative Layout Shift)
- **Bom:** ≤ 0.1
- **Melhorar:** Definir width/height em imagens, reservar espaço para ads

### TTFB (Time to First Byte)
- **Bom:** ≤ 800ms
- **Melhorar:** Usar CDN, otimizar queries, implementar caching

## META TAGS (Next.js)

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Meu Site',
    template: '%s | Meu Site',
  },
  description: 'Descrição com 150-160 caracteres.',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
};
```

## SCHEMA.ORG (JSON-LD)

### Organization
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nome da Empresa",
  "url": "https://meusite.com",
  "logo": "https://meusite.com/logo.png"
}
```

### Product (E-commerce)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Nome do Produto",
  "offers": {
    "@type": "Offer",
    "price": "199.90",
    "priceCurrency": "BRL",
    "availability": "https://schema.org/InStock"
  }
}
```

### Article (Blog)
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Título do Artigo",
  "datePublished": "2024-01-15",
  "author": { "@type": "Person", "name": "Autor" }
}
```

## SITEMAP (Next.js)

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  
  return [
    { url: 'https://meusite.com', changeFrequency: 'daily', priority: 1 },
    ...posts.map((post) => ({
      url: `https://meusite.com/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  ];
}
```

## ROBOTS.TXT

```typescript
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    ],
    sitemap: 'https://meusite.com/sitemap.xml',
  };
}
```

## ANALYTICS (GA4)

```typescript
// Track events
gtag('event', 'sign_up', { method: 'email' });
gtag('event', 'purchase', { transaction_id: '123', value: 99.90 });
gtag('event', 'generate_lead', { source: 'landing_page' });
```

## IMAGE OPTIMIZATION

```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Descrição"
  width={800}
  height={600}
  priority // para above-the-fold
  placeholder="blur"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

## CHECKLIST

### Technical SEO
- [ ] Title tag único (50-60 chars)?
- [ ] Meta description (150-160 chars)?
- [ ] Canonical URL definida?
- [ ] Sitemap.xml gerado?
- [ ] Robots.txt configurado?
- [ ] HTTPS em todas as páginas?
- [ ] Mobile-friendly?

### Performance
- [ ] LCP ≤ 2.5s?
- [ ] INP ≤ 200ms?
- [ ] CLS ≤ 0.1?
- [ ] Imagens otimizadas (WebP/AVIF)?
- [ ] Lazy loading implementado?

### Structured Data
- [ ] Schema.org implementado?
- [ ] JSON-LD válido?
- [ ] Testado no Rich Results Test?

### Analytics
- [ ] GA4 configurado?
- [ ] Search Console verificado?
- [ ] Conversões configuradas?

## FERRAMENTAS

- **PageSpeed Insights:** https://pagespeed.web.dev/
- **Rich Results Test:** https://search.google.com/test/rich-results
- **Schema Validator:** https://validator.schema.org/
- **Search Console:** https://search.google.com/search-console

## ANTI-PATTERNS

❌ **NUNCA** faça keyword stuffing
❌ **NUNCA** use texto escondido
❌ **NUNCA** copie conteúdo de outros sites
❌ **NUNCA** compre ou troque links artificialmente
❌ **NUNCA** ignore mobile
❌ **NUNCA** ignore Core Web Vitals
