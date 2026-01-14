/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║              🚦 PROST-QS CI GATE - POLICY ENFORCEMENT 🚦                    ║
 * ║                                                                              ║
 * ║                    "PR não passa se REJECT. Histórico vira IA."             ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * FASE 3: Policy Elevation & CI Enforcement
 * 
 * Este módulo implementa o gate de CI/CD que:
 * 1. Bloqueia PRs com código não-conforme
 * 2. Gera warnings para scores baixos
 * 3. Mantém histórico de conformidade
 * 4. Alimenta inteligência do sistema
 */

import { ProstQSAuditor, AuditResult } from './ProstQSAuditor';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CIGateConfig {
  // Thresholds
  rejectThreshold: number;      // Score < X → REJECT (default: 50)
  warningThreshold: number;     // Score < X → WARNING (default: 80)
  approveThreshold: number;     // Score >= X → APPROVE (default: 80)
  
  // Comportamento
  strictMode: boolean;          // Se true, rejeita qualquer violação crítica
  allowWarnings: boolean;       // Se true, permite merge com warnings
  requireApproval: boolean;     // Se true, requer aprovação manual
  
  // Histórico
  enableHistory: boolean;       // Se true, mantém histórico
  historyPath: string;          // Caminho para arquivo de histórico
  
  // Notificações
  enableNotifications: boolean; // Se true, envia notificações
  slackWebhook?: string;        // Webhook do Slack (opcional)
}

export interface CIGateResult {
  passed: boolean;
  decision: 'APPROVE' | 'WARNING' | 'REJECT';
  score: number;
  violations: Array<{
    type: 'CRITICAL' | 'SEVERE' | 'WARNING';
    code: string;
    message: string;
  }>;
  recommendation: string;
  timestamp: number;
  prNumber?: string;
  branch?: string;
}

export interface ConformityHistory {
  timestamp: number;
  prNumber?: string;
  branch?: string;
  score: number;
  decision: 'APPROVE' | 'WARNING' | 'REJECT';
  violations: number;
  author?: string;
}

// ============================================================================
// CONFIGURAÇÃO PADRÃO
// ============================================================================

const DEFAULT_CONFIG: CIGateConfig = {
  rejectThreshold: 50,
  warningThreshold: 80,
  approveThreshold: 80,
  strictMode: false,
  allowWarnings: true,
  requireApproval: false,
  enableHistory: true,
  historyPath: '.prost-qs/conformity-history.json',
  enableNotifications: false,
};

// ============================================================================
// CLASSE PRINCIPAL: PROST-QS CI GATE
// ============================================================================

export class ProstQSCIGate {
  private config: CIGateConfig;
  private auditor: ProstQSAuditor;
  private history: ConformityHistory[] = [];

  constructor(config: Partial<CIGateConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.auditor = new ProstQSAuditor();
    this.loadHistory();
  }

  /**
   * 🚦 GATE PRINCIPAL: Valida código para CI/CD
   */
  public gate(
    code: string,
    prNumber?: string,
    branch?: string,
    author?: string
  ): CIGateResult {
    // 1. Auditar código
    const auditResult = this.auditor.audit(code);

    // 2. Calcular decisão
    const decision = this.calculateDecision(auditResult);

    // 3. Preparar resultado
    const result: CIGateResult = {
      passed: decision !== 'REJECT',
      decision,
      score: auditResult.score,
      violations: auditResult.violations.map(v => ({
        type: v.type,
        code: v.code,
        message: v.message,
      })),
      recommendation: this.generateRecommendation(decision, auditResult),
      timestamp: Date.now(),
      prNumber,
      branch,
    };

    // 4. Registrar no histórico
    if (this.config.enableHistory) {
      this.recordHistory({
        timestamp: result.timestamp,
        prNumber,
        branch,
        score: auditResult.score,
        decision,
        violations: auditResult.violations.length,
        author,
      });
    }

    // 5. Enviar notificações
    if (this.config.enableNotifications) {
      this.notify(result);
    }

    return result;
  }

  /**
   * 📊 Calcular decisão baseado em thresholds
   */
  private calculateDecision(auditResult: AuditResult): 'APPROVE' | 'WARNING' | 'REJECT' {
    // Modo strict: qualquer violação crítica = REJECT
    if (this.config.strictMode) {
      const criticalViolations = auditResult.violations.filter(v => v.type === 'CRITICAL');
      if (criticalViolations.length > 0) {
        return 'REJECT';
      }
    }

    // Baseado em score
    if (auditResult.score < this.config.rejectThreshold) {
      return 'REJECT';
    }

    if (auditResult.score < this.config.warningThreshold) {
      return 'WARNING';
    }

    return 'APPROVE';
  }

  /**
   * 💬 Gerar recomendação para o desenvolvedor
   */
  private generateRecommendation(
    decision: 'APPROVE' | 'WARNING' | 'REJECT',
    auditResult: AuditResult
  ): string {
    switch (decision) {
      case 'APPROVE':
        return '✅ Código aprovado. Pronto para merge.';

      case 'WARNING':
        return `⚠️ Código com warnings. Score: ${auditResult.score}/100. ` +
               `Violações: ${auditResult.violations.length}. ` +
               `Merge permitido com aprovação manual.`;

      case 'REJECT':
        const criticalCount = auditResult.violations.filter(v => v.type === 'CRITICAL').length;
        return `❌ Código rejeitado. ${criticalCount} violações críticas encontradas. ` +
               `Corrija os problemas e tente novamente.`;
    }
  }

  /**
   * 📝 Registrar no histórico de conformidade
   */
  private recordHistory(entry: ConformityHistory): void {
    this.history.push(entry);
    this.saveHistory();
  }

  /**
   * 💾 Salvar histórico em arquivo
   */
  private saveHistory(): void {
    try {
      const dir = path.dirname(this.config.historyPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.config.historyPath,
        JSON.stringify(this.history, null, 2)
      );
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }
  }

  /**
   * 📖 Carregar histórico do arquivo
   */
  private loadHistory(): void {
    try {
      if (fs.existsSync(this.config.historyPath)) {
        const data = fs.readFileSync(this.config.historyPath, 'utf-8');
        this.history = JSON.parse(data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      this.history = [];
    }
  }

  /**
   * 📊 Obter estatísticas de conformidade
   */
  public getStats(): {
    total: number;
    approved: number;
    warnings: number;
    rejected: number;
    averageScore: number;
    trend: 'improving' | 'stable' | 'declining';
  } {
    const total = this.history.length;
    const approved = this.history.filter(h => h.decision === 'APPROVE').length;
    const warnings = this.history.filter(h => h.decision === 'WARNING').length;
    const rejected = this.history.filter(h => h.decision === 'REJECT').length;

    const averageScore = total > 0
      ? this.history.reduce((sum, h) => sum + h.score, 0) / total
      : 0;

    // Calcular trend (últimos 10 vs anteriores)
    const trend = this.calculateTrend();

    return {
      total,
      approved,
      warnings,
      rejected,
      averageScore,
      trend,
    };
  }

  /**
   * 📈 Calcular tendência de conformidade
   */
  private calculateTrend(): 'improving' | 'stable' | 'declining' {
    if (this.history.length < 2) {
      return 'stable';
    }

    const recent = this.history.slice(-10);
    const older = this.history.slice(0, Math.max(1, this.history.length - 10));

    const recentAvg = recent.reduce((sum, h) => sum + h.score, 0) / recent.length;
    const olderAvg = older.reduce((sum, h) => sum + h.score, 0) / older.length;

    const diff = recentAvg - olderAvg;

    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  /**
   * 🔔 Enviar notificações (Slack, etc)
   */
  private notify(result: CIGateResult): void {
    if (this.config.slackWebhook) {
      this.notifySlack(result);
    }
  }

  /**
   * 💬 Notificar via Slack
   */
  private notifySlack(result: CIGateResult): void {
    const emoji = result.decision === 'APPROVE' ? '✅' : 
                  result.decision === 'WARNING' ? '⚠️' : '❌';

    const message = {
      text: `${emoji} PROST-QS CI Gate: ${result.decision}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *PROST-QS CI Gate: ${result.decision}*\n` +
                  `Score: ${result.score}/100\n` +
                  `Violações: ${result.violations.length}\n` +
                  `${result.prNumber ? `PR: #${result.prNumber}` : ''}\n` +
                  `${result.branch ? `Branch: ${result.branch}` : ''}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Recomendação:*\n${result.recommendation}`,
          },
        },
      ],
    };

    // Aqui você faria a chamada HTTP para o webhook
    // fetch(this.config.slackWebhook, { method: 'POST', body: JSON.stringify(message) })
  }

  /**
   * 📋 Gerar relatório de conformidade
   */
  public generateReport(): string {
    const stats = this.getStats();

    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    PROST-QS CONFORMITY REPORT                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 ESTATÍSTICAS GERAIS
├─ Total de PRs: ${stats.total}
├─ Aprovados: ${stats.approved} (${((stats.approved / stats.total) * 100).toFixed(1)}%)
├─ Warnings: ${stats.warnings} (${((stats.warnings / stats.total) * 100).toFixed(1)}%)
├─ Rejeitados: ${stats.rejected} (${((stats.rejected / stats.total) * 100).toFixed(1)}%)
└─ Score Médio: ${stats.averageScore.toFixed(1)}/100

📈 TENDÊNCIA
└─ ${stats.trend === 'improving' ? '📈 Melhorando' : 
     stats.trend === 'declining' ? '📉 Piorando' : '➡️ Estável'}

🔒 CONFIGURAÇÃO
├─ Strict Mode: ${this.config.strictMode ? 'SIM' : 'NÃO'}
├─ Reject Threshold: ${this.config.rejectThreshold}
├─ Warning Threshold: ${this.config.warningThreshold}
└─ Approve Threshold: ${this.config.approveThreshold}

📝 HISTÓRICO RECENTE
${this.history.slice(-5).reverse().map((h, i) => 
  `${i + 1}. [${new Date(h.timestamp).toISOString()}] ` +
  `${h.decision} - Score: ${h.score}/100 - ` +
  `${h.prNumber ? `PR #${h.prNumber}` : h.branch || 'N/A'}`
).join('\n')}
`;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * 🚀 Criar gate com configuração padrão
 */
export function createCIGate(config?: Partial<CIGateConfig>): ProstQSCIGate {
  return new ProstQSCIGate(config);
}

/**
 * 🔍 Validar código para CI/CD (função simples)
 */
export function validateForCI(code: string, strictMode: boolean = false): boolean {
  const gate = new ProstQSCIGate({ strictMode });
  const result = gate.gate(code);
  return result.passed;
}

/**
 * 📊 Obter estatísticas de conformidade
 */
export function getConformityStats(historyPath?: string) {
  const gate = new ProstQSCIGate({ historyPath });
  return gate.getStats();
}

/**
 * 📋 Gerar relatório de conformidade
 */
export function generateConformityReport(historyPath?: string): string {
  const gate = new ProstQSCIGate({ historyPath });
  return gate.generateReport();
}
