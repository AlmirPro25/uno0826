/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║      🔧 ADMIN INTERNAL TOOLS MANIFEST - FERRAMENTAS INTERNAS 🔧             ║
 * ║                                                                              ║
 * ║    "Ferramenta interna mal feita vira arma."                                ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ESPECIALISTA GERADO: Internal Tools & Automation Architect
 */

export const ADMIN_INTERNAL_TOOLS_MANIFEST = {
  id: 'admin-internal-tools',
  name: 'Admin Internal Tools Manifest',
  version: '1.0.0',
  category: 'admin-satellite',
  parent: 'admin-system-supreme',
  
  activation: {
    keywords: [
      'ferramentas internas', 'internal tools', 'backoffice',
      'automação', 'automation', 'scripts', 'bulk operations',
      'admin ui', 'painel interno', 'operações em massa',
      'retool', 'appsmith', 'tooljet', 'low-code admin'
    ],
    contextTriggers: [
      'criar ferramenta interna', 'automatizar operação',
      'painel para operadores', 'bulk update'
    ]
  },

  philosophy: {
    core: `
      Ferramentas internas são PRODUTOS.
      Operadores são USUÁRIOS.
      
      A diferença:
      - Ferramenta ruim: "Funciona, mas é perigoso"
      - Ferramenta boa: "Impossível fazer errado"
      
      Guardrails > Velocidade
    `
  },

  designPrinciples: {
    safeByDefault: {
      description: 'Impossível causar dano acidentalmente',
      examples: [
        'Confirmação para ações destrutivas',
        'Preview antes de executar',
        'Limites de batch size',
        'Dry-run obrigatório'
      ]
    },
    undoable: {
      description: 'Toda ação pode ser revertida',
      examples: [
        'Soft delete sempre',
        'Histórico de mudanças',
        'Rollback com um clique'
      ]
    },
    auditable: {
      description: 'Toda ação é rastreável',
      examples: [
        'Log de quem fez o quê',
        'Motivo obrigatório',
        'Timestamp imutável'
      ]
    },
    accessible: {
      description: 'Qualquer operador consegue usar',
      examples: [
        'UI clara e consistente',
        'Documentação inline',
        'Mensagens de erro úteis'
      ]
    }
  },

  bulkOperations: {
    guardrails: [
      'Limite máximo de registros por operação',
      'Preview obrigatório dos afetados',
      'Dry-run antes de executar',
      'Aprovação para operações grandes',
      'Rate limiting para não derrubar sistema',
      'Rollback automático se erro > threshold'
    ],
    template: `
      async function safeBulkOperation<T>(
        items: T[],
        operation: (item: T) => Promise<void>,
        config: BulkConfig
      ): Promise<BulkResult> {
        // 1. Validar limite
        if (items.length > config.maxItems) {
          throw new Error(\`Max \${config.maxItems} items allowed\`);
        }
        
        // 2. Dry run se configurado
        if (config.dryRun) {
          return { affected: items.length, executed: false };
        }
        
        // 3. Executar com rate limiting
        const results = { success: 0, failed: 0, errors: [] };
        
        for (const batch of chunk(items, config.batchSize)) {
          await Promise.all(batch.map(async (item) => {
            try {
              await operation(item);
              results.success++;
            } catch (error) {
              results.failed++;
              results.errors.push({ item, error });
              
              // Abort se muitos erros
              if (results.failed / items.length > config.errorThreshold) {
                throw new Error('Too many errors, aborting');
              }
            }
          }));
          
          // Rate limit entre batches
          await sleep(config.delayBetweenBatches);
        }
        
        return results;
      }
    `
  },

  dangerousScripts: {
    rules: [
      'NUNCA rodar direto em produção',
      'SEMPRE ter dry-run',
      'SEMPRE ter rollback',
      'SEMPRE logar execução',
      'SEMPRE requerer aprovação'
    ],
    safeWrapper: `
      // Wrapper para scripts perigosos
      async function runDangerousScript(
        script: () => Promise<void>,
        context: ScriptContext
      ): Promise<void> {
        // 1. Verificar aprovação
        if (!context.approvedBy) {
          throw new Error('Script requires approval');
        }
        
        // 2. Logar início
        await auditLog.create({
          action: 'DANGEROUS_SCRIPT_START',
          script: context.scriptName,
          executedBy: context.executedBy,
          approvedBy: context.approvedBy
        });
        
        // 3. Criar snapshot para rollback
        const snapshotId = await createSnapshot(context.affectedTables);
        
        try {
          // 4. Executar
          await script();
          
          // 5. Logar sucesso
          await auditLog.create({
            action: 'DANGEROUS_SCRIPT_SUCCESS',
            script: context.scriptName,
            snapshotId
          });
        } catch (error) {
          // 6. Rollback automático
          await restoreSnapshot(snapshotId);
          
          // 7. Logar falha
          await auditLog.create({
            action: 'DANGEROUS_SCRIPT_FAILED',
            script: context.scriptName,
            error: error.message,
            rolledBack: true
          });
          
          throw error;
        }
      }
    `
  },

  checklist: {
    safety: ['Confirmação para ações destrutivas?', 'Preview antes de executar?', 'Limites de batch?'],
    undo: ['Soft delete implementado?', 'Histórico de mudanças?', 'Rollback disponível?'],
    audit: ['Todas as ações logadas?', 'Motivo obrigatório?', 'Quem fez rastreável?'],
    ux: ['UI clara?', 'Mensagens de erro úteis?', 'Documentação inline?']
  },

  antiPatterns: [
    'NUNCA permita bulk delete sem confirmação',
    'NUNCA execute scripts sem dry-run',
    'NUNCA ignore rate limiting',
    'NUNCA faça hard delete',
    'NUNCA confie em "eu sei o que estou fazendo"'
  ],

  goldenRule: `
    ╔═══════════════════════════════════════════════════════════════════╗
    ║   Se um operador pode destruir dados com um clique,              ║
    ║   a ferramenta está errada, não o operador.                      ║
    ╚═══════════════════════════════════════════════════════════════════╝
  `
};

export default ADMIN_INTERNAL_TOOLS_MANIFEST;
