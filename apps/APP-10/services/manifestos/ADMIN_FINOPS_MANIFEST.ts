/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      💰 ADMIN FINANCIAL OPERATIONS MANIFEST - O DINHEIRO INVISÍVEL 💰       ║
 * ║                                                                              ║
 * ║    "Todo sistema sangra dinheiro em silêncio."                              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ESPECIALISTA GERADO: FinOps & Revenue Control Architect
 */

export const ADMIN_FINOPS_MANIFEST = {
  id: 'admin-finops',
  name: 'Admin Financial Operations Manifest',
  version: '1.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',
  
  activation: {
    keywords: [
      'finops', 'financial operations', 'reconciliação', 'reconciliation',
      'fraude interna', 'internal fraud', 'chargeback', 'estorno',
      'fluxo de caixa', 'cash flow', 'margem', 'margin',
      'billing', 'cobrança', 'faturamento', 'revenue leakage',
      'custo cloud', 'cloud cost', 'otimização de custos'
    ],
    contextTriggers: [
      'quanto estamos perdendo', 'reconciliar pagamentos', 'fraude interna',
      'otimizar custos', 'margem real', 'vazamento de receita'
    ]
  },

  philosophy: {
    core: `
      Dinheiro que você não vê saindo é dinheiro perdido.
      
      Vazamentos comuns:
      - Cobranças que falharam silenciosamente
      - Refunds não contabilizados
      - Custos de cloud descontrolados
      - Fraude interna não detectada
      - Taxas de gateway ignoradas
      
      FinOps não é contabilidade. É visibilidade financeira em tempo real.
    `
  },

  reconciliation: {
    principle: 'Todo centavo deve ser rastreável',
    checks: {
      daily: ['Gateway vs Database', 'Refunds processados', 'Chargebacks recebidos'],
      weekly: ['Margem por produto', 'Custo de aquisição', 'LTV realizado'],
      monthly: ['Reconciliação bancária', 'Impostos devidos', 'Comissões pagas']
    }
  },

  revenueLeakage: {
    sources: [
      { type: 'failed_charges', description: 'Cobranças que falharam sem retry' },
      { type: 'untracked_refunds', description: 'Refunds manuais não logados' },
      { type: 'pricing_errors', description: 'Preços errados em produção' },
      { type: 'free_tier_abuse', description: 'Usuários abusando do free tier' },
      { type: 'gateway_fees', description: 'Taxas não contabilizadas' }
    ],
    detection: `
      // Detectar vazamento de receita
      async function detectRevenueLeakage(): Promise<LeakageReport> {
        const [gatewayTotal, dbTotal] = await Promise.all([
          gateway.getSettledAmount(period),
          db.query('SELECT SUM(amount) FROM payments WHERE status = paid')
        ]);
        
        const discrepancy = gatewayTotal - dbTotal;
        
        if (Math.abs(discrepancy) > threshold) {
          await alertFinanceTeam({ discrepancy, period });
        }
        
        return { gatewayTotal, dbTotal, discrepancy };
      }
    `
  },

  cloudCostOptimization: {
    strategies: [
      'Reserved instances para workloads previsíveis',
      'Spot instances para jobs batch',
      'Right-sizing de recursos',
      'Desligar ambientes de dev à noite',
      'Alertas de budget por serviço'
    ],
    metrics: ['cost_per_user', 'cost_per_transaction', 'cost_per_request']
  },

  internalFraudPrevention: {
    risks: [
      'Admin criando refunds para si mesmo',
      'Funcionário acessando dados de pagamento',
      'Manipulação de preços',
      'Criação de cupons não autorizados'
    ],
    controls: [
      'Segregação de funções (quem cria não aprova)',
      'Limites de alçada por role',
      'Auditoria de todas as operações financeiras',
      'Alertas para padrões suspeitos'
    ]
  },

  checklist: {
    reconciliation: ['Reconciliação diária automatizada?', 'Discrepâncias alertadas?', 'Audit trail completo?'],
    leakage: ['Cobranças falhadas monitoradas?', 'Refunds rastreados?', 'Taxas contabilizadas?'],
    cloudCosts: ['Budget por serviço?', 'Alertas de overspend?', 'Otimização mensal?'],
    fraud: ['SoD implementado?', 'Limites de alçada?', 'Auditoria de operações?']
  },

  antiPatterns: [
    'NUNCA ignore discrepâncias pequenas',
    'NUNCA permita refunds sem aprovação',
    'NUNCA deixe cloud costs sem budget',
    'NUNCA confie em "sempre foi assim"',
    'NUNCA permita acesso financeiro sem auditoria'
  ],

  goldenRule: `
    ╔═══════════════════════════════════════════════════════════════════╗
    ║   Se você não sabe onde cada centavo está,                       ║
    ║   você não sabe quanto está perdendo.                            ║
    ╚═══════════════════════════════════════════════════════════════════╝
  `
};

export default ADMIN_FINOPS_MANIFEST;
