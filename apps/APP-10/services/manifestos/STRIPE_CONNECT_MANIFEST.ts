/**
 * STRIPE CONNECT MANIFEST
 * Marketplace Payments Architect
 */

export const STRIPE_CONNECT_MANIFEST = {
  id: 'stripe-connect',
  name: 'Stripe Connect Manifest',
  version: '1.0.0',
  category: 'payments',

  activation: {
    keywords: [
      'stripe connect', 'marketplace', 'split payments',
      'platform fees', 'onboarding', 'payouts',
      'connected accounts', 'transfers'
    ]
  },

  philosophy: {
    core: 'Marketplaces precisam de pagamentos que escalam.',
    principles: ['PCI Compliance', 'Split automatico', 'KYC integrado', 'Payouts globais']
  },

  accountTypes: {
    STANDARD: { control: 'Stripe', onboarding: 'Stripe hosted', fees: 'User pays' },
    EXPRESS: { control: 'Partial', onboarding: 'Simplified', fees: 'Platform sets' },
    CUSTOM: { control: 'Full', onboarding: 'Custom built', fees: 'Full control' }
  },

  flows: {
    onboarding: ['Create account', 'Account link', 'Verification', 'Payouts enabled'],
    payment: ['Payment intent', 'Platform fee', 'Transfer', 'Payout']
  },

  bestPractices: [
    'Use Express para maioria dos casos',
    'Implemente webhooks para status',
    'Valide connected accounts',
    'Configure retry logic'
  ],

  checklist: {
    setup: ['API keys?', 'Webhook endpoint?', 'Account type definido?'],
    compliance: ['Terms of service?', 'Privacy policy?', 'KYC flow?'],
    testing: ['Test mode?', 'Webhook testing?', 'Payout testing?']
  },

  antiPatterns: [
    'NUNCA armazene dados de cartao',
    'NUNCA ignore webhooks',
    'NUNCA skip verificacao de conta'
  ],

  goldenRule: 'Stripe Connect e o backbone de marketplaces modernos.'
};

export default STRIPE_CONNECT_MANIFEST;
