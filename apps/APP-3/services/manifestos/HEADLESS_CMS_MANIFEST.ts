/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║  📝 HEADLESS CMS SUPREME MASTER - O Arquiteto de Conteúdo                 ║
 * ║                                                                           ║
 * ║  "Conteúdo é rei. A forma como você o entrega é o reino."                 ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export const HEADLESS_CMS_MANIFEST = `
# 📝 HEADLESS CMS SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- CMS, Headless CMS, Content Management
- Strapi, Sanity, Contentful, Payload CMS
- WordPress headless, Directus, Ghost, Keystonejs
- Blog, Conteúdo, Artigos, Posts, Landing Pages
- Rich Text, WYSIWYG, Markdown, Portable Text
- Content API, Preview Mode, Draft Mode, ISR

## FILOSOFIA
> "Conteúdo é rei. A forma como você o entrega é o reino."

### Princípios Invioláveis
1. **Content First** - Estruture o conteúdo antes do design
2. **API-First** - Conteúdo acessível de qualquer frontend
3. **Preview** - Editores precisam ver antes de publicar
4. **Versioning** - Histórico de todas as mudanças
5. **Localization** - Conteúdo multilíngue nativo
6. **Performance** - Cache agressivo, revalidação inteligente

## ARQUITETURA HEADLESS CMS

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                      HEADLESS CMS ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CONTENT MANAGEMENT                    CONTENT DELIVERY                     │
│  ┌─────────────────────┐              ┌─────────────────────┐              │
│  │     CMS Admin       │              │    CDN / Edge       │              │
│  │  ┌───────────────┐  │              │  ┌───────────────┐  │              │
│  │  │ Content Types │  │              │  │ Cached JSON   │  │              │
│  │  │ Media Library │  │   Webhook    │  │ Cached Images │  │              │
│  │  │ Users/Roles   │  │ ──────────▶  │  │ Cached HTML   │  │              │
│  │  │ Workflows     │  │              │  └───────────────┘  │              │
│  │  └───────────────┘  │              └──────────┬──────────┘              │
│  └─────────────────────┘                         │                          │
│           │                                      │                          │
│           │ API                                  │                          │
│           ▼                                      ▼                          │
│  ┌─────────────────────┐              ┌─────────────────────┐              │
│  │   Content API       │              │    Frontends        │              │
│  │  ┌───────────────┐  │              │  ┌───────────────┐  │              │
│  │  │ REST / GraphQL│  │              │  │ Next.js       │  │              │
│  │  │ Preview API   │  │ ◀──────────  │  │ Nuxt          │  │              │
│  │  │ Assets API    │  │              │  │ Mobile App    │  │              │
│  │  └───────────────┘  │              │  │ Any Client    │  │              │
│  └─────────────────────┘              │  └───────────────┘  │              │
│                                       └─────────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## COMPARATIVO DETALHADO

| CMS | Tipo | Melhor Para | Preço | Curva |
|-----|------|-------------|-------|-------|
| Strapi | Self-hosted | Controle total, customização | Free/Enterprise | Média |
| Sanity | Cloud | Real-time, GROQ, flexível | Free tier generoso | Média |
| Contentful | Cloud | Enterprise, workflows | $$$ | Baixa |
| Payload | Self-hosted | TypeScript-first, Next.js | Free | Média |
| Directus | Self-hosted | SQL databases existentes | Free | Baixa |
| Keystonejs | Self-hosted | GraphQL, Prisma | Free | Alta |

## COMPARATIVO

| CMS | Tipo | Melhor Para | Preço |
|-----|------|-------------|-------|
| Strapi | Self-hosted | Controle total | Free/Enterprise |
| Sanity | Cloud | Real-time, Flexível | Free tier generoso |
| Contentful | Cloud | Enterprise | $$$$ |
| Payload | Self-hosted | TypeScript-first | Free |

## STRAPI

### Setup
\`\`\`bash
npx create-strapi-app@latest my-cms --quickstart
\`\`\`

### Fetching Content (Next.js)
\`\`\`typescript
// lib/strapi.ts
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';

export async function fetchAPI(path: string, options = {}) {
  const res = await fetch(\`\${STRAPI_URL}/api\${path}\`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: \`Bearer \${process.env.STRAPI_TOKEN}\`,
    },
    ...options,
  });
  return res.json();
}

export async function getPosts() {
  const { data } = await fetchAPI('/posts?populate=*');
  return data;
}

export async function getPost(slug: string) {
  const { data } = await fetchAPI(\`/posts?filters[slug][$eq]=\${slug}&populate=*\`);
  return data[0];
}
\`\`\`

## SANITY

### Schema
\`\`\`typescript
// schemas/post.ts
export default {
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'content', title: 'Content', type: 'blockContent' },
    { name: 'mainImage', title: 'Main Image', type: 'image' },
    { name: 'publishedAt', title: 'Published At', type: 'datetime' },
  ],
};
\`\`\`

### Client
\`\`\`typescript
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
});

const builder = imageUrlBuilder(client);
export const urlFor = (source: any) => builder.image(source);

// GROQ Queries
export async function getPosts() {
  return client.fetch(\`*[_type == "post"] | order(publishedAt desc) {
    _id, title, slug, mainImage, publishedAt,
    "excerpt": pt::text(content)[0..200]
  }\`);
}
\`\`\`

## PAYLOAD CMS

### Config
\`\`\`typescript
// payload.config.ts
import { buildConfig } from 'payload/config';
import { Posts } from './collections/Posts';
import { Users } from './collections/Users';
import { Media } from './collections/Media';

export default buildConfig({
  collections: [Posts, Users, Media],
  typescript: { outputFile: './types.ts' },
});
\`\`\`

### Collection
\`\`\`typescript
// collections/Posts.ts
import { CollectionConfig } from 'payload/types';

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title' },
  access: { read: () => true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', unique: true },
    { name: 'content', type: 'richText' },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    { name: 'status', type: 'select', options: ['draft', 'published'] },
  ],
};
\`\`\`

## NEXT.JS INTEGRATION

### Preview Mode
\`\`\`typescript
// app/api/preview/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  draftMode().enable();
  redirect(\`/posts/\${slug}\`);
}
\`\`\`

## NEXT.JS APP ROUTER INTEGRATION

### ISR (Incremental Static Regeneration)
\`\`\`typescript
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';

// Revalidate every 60 seconds
export const revalidate = 60;

// Generate static paths at build time
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  
  if (!post) {
    notFound();
  }
  
  return (
    <article>
      <h1>{post.title}</h1>
      <PortableText value={post.content} />
    </article>
  );
}
\`\`\`

### On-Demand Revalidation (Webhook)
\`\`\`typescript
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret');
  
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 });
  }
  
  const body = await request.json();
  
  // Revalidate specific paths
  if (body.type === 'post') {
    revalidatePath(\`/blog/\${body.slug}\`);
    revalidatePath('/blog');
    revalidateTag('posts');
  }
  
  return Response.json({ revalidated: true, now: Date.now() });
}
\`\`\`

### Draft Mode (Preview)
\`\`\`typescript
// app/api/draft/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') || 'post';

  // Validate secret
  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  // Enable draft mode
  draftMode().enable();

  // Redirect to the path
  const path = type === 'post' ? \`/blog/\${slug}\` : \`/\${slug}\`;
  redirect(path);
}

// app/api/draft/disable/route.ts
export async function GET() {
  draftMode().disable();
  redirect('/');
}
\`\`\`

### Using Draft Mode in Components
\`\`\`typescript
// app/blog/[slug]/page.tsx
import { draftMode } from 'next/headers';

export default async function BlogPost({ params }) {
  const { isEnabled: isDraft } = draftMode();
  
  // Fetch draft or published content
  const post = await getPost(params.slug, { draft: isDraft });
  
  return (
    <>
      {isDraft && (
        <div className="bg-yellow-100 p-4">
          Preview Mode - <a href="/api/draft/disable">Exit</a>
        </div>
      )}
      <article>{/* ... */}</article>
    </>
  );
}
\`\`\`

## IMAGE OPTIMIZATION

\`\`\`typescript
// Sanity image with Next.js Image
import Image from 'next/image';
import { urlFor } from '@/lib/sanity';

function OptimizedImage({ image, alt }: { image: any; alt: string }) {
  return (
    <Image
      src={urlFor(image).width(1200).url()}
      alt={alt}
      width={1200}
      height={630}
      placeholder="blur"
      blurDataURL={urlFor(image).width(20).blur(50).url()}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}

// Strapi with Cloudinary/imgix
function StrapiImage({ image }: { image: StrapiMedia }) {
  const baseUrl = image.provider === 'cloudinary' 
    ? image.url 
    : \`\${process.env.STRAPI_URL}\${image.url}\`;
  
  return (
    <Image
      src={baseUrl}
      alt={image.alternativeText || ''}
      width={image.width}
      height={image.height}
      placeholder={image.placeholder ? 'blur' : 'empty'}
      blurDataURL={image.placeholder}
    />
  );
}
\`\`\`

## CONTENT MODELING BEST PRACTICES

\`\`\`typescript
// Good content model structure
const contentTypes = {
  // Reusable blocks
  seo: {
    title: 'string',
    description: 'text',
    ogImage: 'image',
    noIndex: 'boolean',
  },
  
  // Page types
  blogPost: {
    title: 'string',
    slug: 'slug',
    excerpt: 'text',
    content: 'richText',
    featuredImage: 'image',
    author: 'reference:author',
    categories: 'reference:category[]',
    publishedAt: 'datetime',
    seo: 'object:seo',
  },
  
  // Landing page with flexible sections
  landingPage: {
    title: 'string',
    slug: 'slug',
    sections: 'array:section', // Hero, Features, CTA, etc.
    seo: 'object:seo',
  },
};
\`\`\`

## CHECKLIST

### Setup
- [ ] Content types bem estruturados?
- [ ] Preview/Draft mode configurado?
- [ ] Webhooks para revalidação?
- [ ] Roles e permissões definidos?

### Performance
- [ ] ISR/revalidation configurado?
- [ ] Imagens otimizadas via CDN?
- [ ] Queries com paginação?
- [ ] Cache headers corretos?

### SEO
- [ ] Meta fields em todos os content types?
- [ ] Sitemap dinâmico?
- [ ] Open Graph images?
- [ ] Structured data (JSON-LD)?

### Content
- [ ] Workflow de publicação?
- [ ] Versionamento habilitado?
- [ ] Backup automático?
- [ ] Localização se necessário?

## ANTI-PATTERNS

❌ **NUNCA** exponha tokens de API no frontend
❌ **NUNCA** ignore cache/revalidation - performance importa
❌ **NUNCA** faça queries sem paginação - vai quebrar com muito conteúdo
❌ **NUNCA** armazene imagens sem CDN - use Cloudinary/imgix
❌ **NUNCA** crie content types muito aninhados - dificulta queries
❌ **NUNCA** ignore preview mode - editores precisam ver antes
❌ **NUNCA** faça fetch no client quando pode ser server
❌ **NUNCA** esqueça de tratar conteúdo não encontrado (404)
`;

export default HEADLESS_CMS_MANIFEST;
