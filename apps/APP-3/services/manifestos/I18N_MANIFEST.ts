/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║  🌍 INTERNATIONALIZATION (I18N) SUPREME MASTER - O Arquiteto Global       ║
 * ║                                                                           ║
 * ║  "Fale a língua do seu usuário. Literalmente."                            ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export const I18N_MANIFEST = `
# 🌍 INTERNATIONALIZATION (I18N) SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- i18n, Internationalization, Internacionalização
- Translation, Tradução, Locale, Localization
- next-intl, react-i18next, i18next, FormatJS
- RTL, Right-to-Left, Arabic, Hebrew, Bidirectional
- Currency, Date Format, Number Format, Timezone
- Pluralization, ICU Message Format, CLDR

## FILOSOFIA
> "Fale a língua do seu usuário. Literalmente."

### Princípios Invioláveis
1. **Externalize Everything** - Nenhuma string hardcoded
2. **Context Matters** - Mesma palavra, contextos diferentes
3. **Plural Rules** - Cada idioma tem regras próprias
4. **Format Locally** - Datas, números, moedas locais
5. **RTL Support** - Não é opcional para mercados árabes/hebraicos
6. **SEO Friendly** - URLs e meta tags localizados

## ARQUITETURA I18N

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         I18N ARCHITECTURE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  URL STRUCTURE                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Option 1: Path prefix     → example.com/pt/products                │   │
│  │  Option 2: Subdomain       → pt.example.com/products                │   │
│  │  Option 3: Domain          → example.com.br/products                │   │
│  │  Option 4: Query param     → example.com/products?lang=pt (❌)      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  DETECTION FLOW                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐              │
│  │ URL     │ → │ Cookie  │ → │ Header  │ → │ Default │              │
│  │ /pt/... │    │ locale  │    │ Accept- │    │ en      │              │
│  │         │    │         │    │ Language│    │         │              │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘              │
│                                                                             │
│  FILE STRUCTURE                                                             │
│  messages/                                                                  │
│  ├── en.json          # English (default)                                  │
│  ├── pt.json          # Portuguese                                         │
│  ├── es.json          # Spanish                                            │
│  ├── ar.json          # Arabic (RTL)                                       │
│  └── zh.json          # Chinese                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## NEXT-INTL (Next.js App Router)

### Setup
\`\`\`typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(\`./messages/\${locale}.json\`)).default,
}));

// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'pt', 'es'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
\`\`\`

### Messages
\`\`\`json
// messages/pt.json
{
  "common": {
    "welcome": "Bem-vindo, {name}!",
    "items": "{count, plural, =0 {Nenhum item} one {# item} other {# itens}}"
  },
  "auth": {
    "login": "Entrar",
    "logout": "Sair"
  }
}
\`\`\`

### Usage
\`\`\`typescript
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations('common');
  
  return (
    <div>
      <h1>{t('welcome', { name: 'João' })}</h1>
      <p>{t('items', { count: 5 })}</p>
    </div>
  );
}
\`\`\`

## REACT-I18NEXT

\`\`\`typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { welcome: 'Welcome' } },
    pt: { translation: { welcome: 'Bem-vindo' } },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Component
import { useTranslation } from 'react-i18next';

function Component() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('pt')}>PT</button>
    </div>
  );
}
\`\`\`

## FORMATTING

\`\`\`typescript
import { useFormatter } from 'next-intl';

function PriceDisplay({ amount }: { amount: number }) {
  const format = useFormatter();
  
  return (
    <span>
      {format.number(amount, { style: 'currency', currency: 'BRL' })}
    </span>
  );
}

function DateDisplay({ date }: { date: Date }) {
  const format = useFormatter();
  
  return (
    <time>
      {format.dateTime(date, { dateStyle: 'long', timeStyle: 'short' })}
    </time>
  );
}
\`\`\`

## RTL SUPPORT

\`\`\`typescript
// Detect RTL
const rtlLocales = ['ar', 'he', 'fa'];
const isRTL = rtlLocales.includes(locale);

// Layout
<html lang={locale} dir={isRTL ? 'rtl' : 'ltr'}>

// Tailwind RTL
<div className="ml-4 rtl:mr-4 rtl:ml-0">Content</div>
\`\`\`

## ICU MESSAGE FORMAT (Pluralization)

\`\`\`json
// messages/en.json
{
  "cart": {
    "items": "{count, plural, =0 {No items} one {# item} other {# items}} in cart",
    "total": "Total: {amount, number, ::currency/USD}"
  },
  "notifications": {
    "messages": "You have {count, plural, =0 {no new messages} one {# new message} other {# new messages}}"
  },
  "time": {
    "relative": "{date, date, relative}"
  }
}

// messages/pt.json
{
  "cart": {
    "items": "{count, plural, =0 {Nenhum item} one {# item} other {# itens}} no carrinho",
    "total": "Total: {amount, number, ::currency/BRL}"
  }
}

// messages/ar.json (Arabic - different plural rules)
{
  "cart": {
    "items": "{count, plural, =0 {لا توجد عناصر} one {عنصر واحد} two {عنصران} few {# عناصر} many {# عنصرًا} other {# عنصر}}"
  }
}
\`\`\`

## SEO & HREFLANG

\`\`\`typescript
// app/[locale]/layout.tsx
import { languages } from '@/i18n/settings';

export async function generateMetadata({ params: { locale } }) {
  return {
    alternates: {
      canonical: \`https://example.com/\${locale}\`,
      languages: Object.fromEntries(
        languages.map((lang) => [lang, \`https://example.com/\${lang}\`])
      ),
    },
  };
}

// Output in HTML:
// <link rel="alternate" hreflang="en" href="https://example.com/en" />
// <link rel="alternate" hreflang="pt" href="https://example.com/pt" />
// <link rel="alternate" hreflang="x-default" href="https://example.com/en" />
\`\`\`

## TIMEZONE HANDLING

\`\`\`typescript
import { formatInTimeZone } from 'date-fns-tz';

function formatEventTime(date: Date, userTimezone: string, locale: string) {
  return formatInTimeZone(date, userTimezone, 'PPpp', { locale: getLocale(locale) });
}

// Server Component - detect timezone
import { headers } from 'next/headers';

function getTimezone() {
  const headersList = headers();
  return headersList.get('x-vercel-ip-timezone') || 'UTC';
}
\`\`\`

## TRANSLATION MANAGEMENT

\`\`\`yaml
# Recommended tools for translation workflow

Crowdin:
  - Git integration
  - In-context editing
  - Machine translation
  - Translation memory

Lokalise:
  - Real-time collaboration
  - Screenshots for context
  - API for automation

Phrase:
  - Enterprise features
  - Quality assurance
  - Workflow management

# CI/CD Integration
- Pull translations on build
- Validate missing keys
- Auto-detect new strings
\`\`\`

## CHECKLIST

### Setup
- [ ] Locale detection configurado?
- [ ] Fallback locale definido?
- [ ] URL structure escolhida?
- [ ] Middleware configurado?

### Content
- [ ] Todas as strings externalizadas?
- [ ] Pluralização correta para cada idioma?
- [ ] Contexto fornecido para tradutores?
- [ ] Screenshots/descrições nas chaves?

### Formatting
- [ ] Datas formatadas localmente?
- [ ] Números formatados localmente?
- [ ] Moedas com símbolo correto?
- [ ] Timezones considerados?

### SEO
- [ ] hreflang tags implementadas?
- [ ] URLs localizadas?
- [ ] Meta tags traduzidas?
- [ ] Sitemap multilíngue?

### UX
- [ ] Language switcher acessível?
- [ ] RTL suportado se necessário?
- [ ] Fontes suportam todos os idiomas?
- [ ] Layout flexível para textos longos?

## ANTI-PATTERNS

❌ **NUNCA** hardcode strings - externalize tudo
❌ **NUNCA** concatene strings traduzidas - use interpolação
❌ **NUNCA** ignore pluralização - cada idioma tem regras
❌ **NUNCA** assuma formato de data - use Intl API
❌ **NUNCA** use flags para idiomas - use nomes
❌ **NUNCA** traduza automaticamente sem revisão
❌ **NUNCA** ignore RTL em mercados árabes/hebraicos
❌ **NUNCA** use query params para locale (?lang=pt)
`;

export default I18N_MANIFEST;
