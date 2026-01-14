# 📧 EMAIL MARKETING ENGINE

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Email, Email Marketing, Newsletter, Transactional Email
- Resend, SendGrid, Postmark, AWS SES, Mailgun
- React Email, MJML, Email Template
- SMTP, DKIM, SPF, DMARC, Deliverability
- Welcome Email, Password Reset, Confirmation
- Drip Campaign, Automation, Sequence
- Carrinho Abandonado, Abandoned Cart

## FILOSOFIA
> "Email não morreu. Email mal feito morreu."

### Princípios Invioláveis
1. **Permission-based** - Só envie para quem pediu
2. **Value First** - Cada email deve agregar valor
3. **Mobile First** - 60%+ abrem no celular
4. **Deliverability** - Configure SPF, DKIM, DMARC
5. **Personalization** - Use dados para personalizar
6. **Testing** - A/B teste tudo

## PROVEDORES

### Resend (Recomendado para Devs)
- Free: 3000/mês
- Features: React Email, Webhooks, Analytics
- SDK: `@resend/node`

### SendGrid (Enterprise)
- Free: 100/dia
- Features: Marketing + Transactional
- SDK: `@sendgrid/mail`

### Postmark (Alta Deliverability)
- $15/mês para 10K emails
- Focado em transactional

## REACT EMAIL - TEMPLATE BÁSICO

```tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export const WelcomeEmail = ({ userName }: { userName: string }) => (
  <Html>
    <Head />
    <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc' }}>
      <Container style={{ backgroundColor: '#fff', padding: '20px', maxWidth: '600px' }}>
        <Text style={{ fontSize: '24px' }}>Bem-vindo, {userName}! 🎉</Text>
        <Text>Estamos felizes em ter você conosco.</Text>
        <Button
          href="https://meuapp.com/login"
          style={{ backgroundColor: '#5469d4', color: '#fff', padding: '12px 24px' }}
        >
          Acessar Minha Conta
        </Button>
      </Container>
    </Body>
  </Html>
);
```

## ENVIANDO COM RESEND

```typescript
import { Resend } from 'resend';
import WelcomeEmail from '@/emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'MeuApp <noreply@meuapp.com>',
  to: user.email,
  subject: `Bem-vindo, ${user.name}!`,
  react: WelcomeEmail({ userName: user.name }),
});
```

## DELIVERABILITY

### Configurações DNS Obrigatórias

**SPF** (TXT record):
```
v=spf1 include:_spf.google.com include:sendgrid.net ~all
```

**DKIM**: Gerado pelo provedor, adicionar TXT no DNS

**DMARC** (TXT record):
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@meudominio.com
```

### Métricas Saudáveis
- **Delivery Rate:** > 95%
- **Open Rate:** > 20%
- **Click Rate:** > 3%
- **Bounce Rate:** < 2%
- **Spam Rate:** < 0.1%

## AUTOMAÇÕES

### Onboarding Sequence
- Dia 0: Welcome + Quick Start
- Dia 1: Dica #1 - Configure seu perfil
- Dia 3: 3 recursos incríveis
- Dia 7: Como está sua experiência?
- Dia 14: Upgrade CTA

### Abandoned Cart
- 1h: "Esqueceu algo? 🛒"
- 24h: "Seus itens estão esperando"
- 72h: "10% OFF para finalizar"

### Re-engagement
- 30 dias: "Sentimos sua falta!"
- 45 dias: "Última chance: oferta especial"
- 60 dias: "Devemos remover você?"

## CHECKLIST

### Setup
- [ ] Domínio próprio configurado?
- [ ] SPF configurado?
- [ ] DKIM configurado?
- [ ] DMARC configurado?

### Template
- [ ] Responsivo (mobile-friendly)?
- [ ] Testado em Gmail, Outlook, Apple Mail?
- [ ] Link de unsubscribe visível?
- [ ] Plain text version incluída?

### Compliance
- [ ] Double opt-in implementado?
- [ ] Unsubscribe funciona?
- [ ] Endereço físico no rodapé?
- [ ] LGPD/GDPR compliant?

## ANTI-PATTERNS

❌ **NUNCA** envie sem permissão (spam)
❌ **NUNCA** use assuntos enganosos (clickbait)
❌ **NUNCA** dificulte o descadastro
❌ **NUNCA** envie emails só com imagens
❌ **NUNCA** ignore bounces e complaints
❌ **NUNCA** compre listas de email
