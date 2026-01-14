/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║           🔔 PROST-QS SLACK NOTIFIER - REAL-TIME ALERTS 🔔                 ║
 * ║                                                                              ║
 * ║                  "Conformidade em tempo real no Slack"                      ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Integração com Slack para notificações em tempo real de:
 * - Decisões de CI Gate (APPROVE/WARNING/REJECT)
 * - Mudanças de tendência
 * - Alertas de conformidade
 * - Relatórios diários/semanais
 */

import axios from 'axios';
import { CIGateResult } from './ProstQSCIGate';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface SlackConfig {
  webhookUrl: string;           // URL do webhook do Slack
  channel?: string;             // Canal (opcional, usa padrão do webhook)
  username?: string;            // Nome do bot (default: PROST-QS)
  iconEmoji?: string;           // Emoji do bot (default: 👑)
  enableMentions?: boolean;     // Mencionar usuários em rejections
  enableThreads?: boolean;      // Usar threads para detalhes
  enableDailyReport?: boolean;  // Enviar relatório diário
  dailyReportTime?: string;     // Hora do relatório (HH:mm, default: 09:00)
}

export interface SlackMessage {
  text: string;
  blocks: Array<any>;
  thread_ts?: string;
}

// ============================================================================
// CLASSE PRINCIPAL: SLACK NOTIFIER
// ============================================================================

export class ProstQSSlackNotifier {
  private config: SlackConfig;
  private lastReportTime: number = 0;

  constructor(config: SlackConfig) {
    if (!config.webhookUrl) {
      throw new Error('Slack webhook URL é obrigatório');
    }
    this.config = {
      username: 'PROST-QS',
      iconEmoji: '👑',
      enableMentions: false,
      enableThreads: true,
      enableDailyReport: false,
      dailyReportTime: '09:00',
      ...config,
    };
  }

  /**
   * 📤 Enviar notificação de CI Gate
   */
  public async notifyGateResult(
    result: CIGateResult,
    author?: string,
    reviewers?: string[]
  ): Promise<void> {
    try {
      const message = this.buildGateMessage(result, author, reviewers);
      await this.send(message);
    } catch (error) {
      console.error('Erro ao enviar notificação do gate:', error);
    }
  }

  /**
   * 📊 Enviar notificação de tendência
   */
  public async notifyTrendChange(
    trend: 'improving' | 'stable' | 'declining',
    previousTrend: 'improving' | 'stable' | 'declining',
    stats: any
  ): Promise<void> {
    try {
      if (trend === previousTrend) return; // Sem mudança

      const message = this.buildTrendMessage(trend, stats);
      await this.send(message);
    } catch (error) {
      console.error('Erro ao enviar notificação de tendência:', error);
    }
  }

  /**
   * ⚠️ Enviar alerta de conformidade
   */
  public async notifyAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const message = this.buildAlertMessage(severity, title, description, metadata);
      await this.send(message);
    } catch (error) {
      console.error('Erro ao enviar alerta:', error);
    }
  }

  /**
   * 📋 Enviar relatório de conformidade
   */
  public async sendReport(
    stats: any,
    recentHistory: any[],
    recommendations: string[]
  ): Promise<void> {
    try {
      const message = this.buildReportMessage(stats, recentHistory, recommendations);
      await this.send(message);
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
    }
  }

  /**
   * 🏗️ Construir mensagem de resultado do gate
   */
  private buildGateMessage(
    result: CIGateResult,
    author?: string,
    reviewers?: string[]
  ): SlackMessage {
    const emoji = result.decision === 'APPROVE' ? '✅' :
                  result.decision === 'WARNING' ? '⚠️' : '❌';

    const color = result.decision === 'APPROVE' ? '#36a64f' :
                  result.decision === 'WARNING' ? '#ff9900' : '#ff0000';

    const criticalViolations = result.violations.filter(v => v.type === 'CRITICAL');
    const severeViolations = result.violations.filter(v => v.type === 'SEVERE');
    const warningViolations = result.violations.filter(v => v.type === 'WARNING');

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} PROST-QS CI Gate: ${result.decision}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Score:*\n${result.score}/100`,
          },
          {
            type: 'mrkdwn',
            text: `*Decisão:*\n${result.decision}`,
          },
          {
            type: 'mrkdwn',
            text: `*PR:*\n${result.prNumber ? `#${result.prNumber}` : 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Branch:*\n${result.branch || 'N/A'}`,
          },
        ],
      },
    ];

    // Adicionar violações se houver
    if (result.violations.length > 0) {
      let violationText = '*Violações:*\n';
      if (criticalViolations.length > 0) {
        violationText += `🔴 Críticas: ${criticalViolations.length}\n`;
      }
      if (severeViolations.length > 0) {
        violationText += `🟠 Severas: ${severeViolations.length}\n`;
      }
      if (warningViolations.length > 0) {
        violationText += `🟡 Warnings: ${warningViolations.length}`;
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: violationText,
        },
      });
    }

    // Adicionar recomendação
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Recomendação:*\n${result.recommendation}`,
      },
    });

    // Adicionar menções se configurado
    if (this.config.enableMentions && result.decision === 'REJECT' && reviewers?.length) {
      const mentions = reviewers.map(r => `<@${r}>`).join(' ');
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Reviewers: ${mentions}`,
          },
        ],
      });
    }

    return {
      text: `${emoji} PROST-QS CI Gate: ${result.decision}`,
      blocks,
    };
  }

  /**
   * 📈 Construir mensagem de mudança de tendência
   */
  private buildTrendMessage(
    trend: 'improving' | 'stable' | 'declining',
    stats: any
  ): SlackMessage {
    const emoji = trend === 'improving' ? '📈' :
                  trend === 'declining' ? '📉' : '➡️';

    const trendText = trend === 'improving' ? 'Melhorando' :
                      trend === 'declining' ? 'Piorando' : 'Estável';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Tendência de Conformidade: ${trendText}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Score Médio:*\n${stats.averageScore.toFixed(1)}/100`,
          },
          {
            type: 'mrkdwn',
            text: `*Total de PRs:*\n${stats.total}`,
          },
          {
            type: 'mrkdwn',
            text: `*Aprovados:*\n${stats.approved} (${((stats.approved / stats.total) * 100).toFixed(1)}%)`,
          },
          {
            type: 'mrkdwn',
            text: `*Rejeitados:*\n${stats.rejected} (${((stats.rejected / stats.total) * 100).toFixed(1)}%)`,
          },
        ],
      },
    ];

    if (trend === 'declining') {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '⚠️ *Atenção:* Conformidade está piorando. Revise as violações recentes.',
        },
      });
    }

    return {
      text: `${emoji} Tendência: ${trendText}`,
      blocks,
    };
  }

  /**
   * ⚠️ Construir mensagem de alerta
   */
  private buildAlertMessage(
    severity: 'low' | 'medium' | 'high' | 'critical',
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): SlackMessage {
    const emoji = severity === 'critical' ? '🚨' :
                  severity === 'high' ? '🔴' :
                  severity === 'medium' ? '🟠' : '🟡';

    const color = severity === 'critical' ? '#ff0000' :
                  severity === 'high' ? '#ff3300' :
                  severity === 'medium' ? '#ff9900' : '#ffcc00';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: description,
        },
      },
    ];

    if (metadata && Object.keys(metadata).length > 0) {
      const fields = Object.entries(metadata).map(([key, value]) => ({
        type: 'mrkdwn',
        text: `*${key}:*\n${value}`,
      }));

      blocks.push({
        type: 'section',
        fields: fields.slice(0, 10), // Máximo 10 campos
      });
    }

    return {
      text: `${emoji} ${title}`,
      blocks,
    };
  }

  /**
   * 📋 Construir mensagem de relatório
   */
  private buildReportMessage(
    stats: any,
    recentHistory: any[],
    recommendations: string[]
  ): SlackMessage {
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Relatório de Conformidade PROST-QS',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total de PRs:*\n${stats.total}`,
          },
          {
            type: 'mrkdwn',
            text: `*Score Médio:*\n${stats.averageScore.toFixed(1)}/100`,
          },
          {
            type: 'mrkdwn',
            text: `*Aprovados:*\n${stats.approved} (${((stats.approved / stats.total) * 100).toFixed(1)}%)`,
          },
          {
            type: 'mrkdwn',
            text: `*Warnings:*\n${stats.warnings} (${((stats.warnings / stats.total) * 100).toFixed(1)}%)`,
          },
          {
            type: 'mrkdwn',
            text: `*Rejeitados:*\n${stats.rejected} (${((stats.rejected / stats.total) * 100).toFixed(1)}%)`,
          },
          {
            type: 'mrkdwn',
            text: `*Tendência:*\n${stats.trend === 'improving' ? '📈 Melhorando' : stats.trend === 'declining' ? '📉 Piorando' : '➡️ Estável'}`,
          },
        ],
      },
    ];

    // Histórico recente
    if (recentHistory.length > 0) {
      const historyText = recentHistory
        .slice(0, 5)
        .map(h => `• ${h.decision} - Score: ${h.score}/100 - ${new Date(h.timestamp).toLocaleDateString()}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Histórico Recente:*\n${historyText}`,
        },
      });
    }

    // Recomendações
    if (recommendations.length > 0) {
      const recText = recommendations
        .slice(0, 3)
        .map((r, i) => `${i + 1}. ${r}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Recomendações:*\n${recText}`,
        },
      });
    }

    return {
      text: '📊 Relatório de Conformidade PROST-QS',
      blocks,
    };
  }

  /**
   * 📤 Enviar mensagem para Slack
   */
  private async send(message: SlackMessage): Promise<void> {
    const payload = {
      text: message.text,
      blocks: message.blocks,
      username: this.config.username,
      icon_emoji: this.config.iconEmoji,
      ...(this.config.channel && { channel: this.config.channel }),
    };

    await axios.post(this.config.webhookUrl, payload);
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * 🚀 Criar notifier com configuração
 */
export function createSlackNotifier(webhookUrl: string, config?: Partial<SlackConfig>): ProstQSSlackNotifier {
  return new ProstQSSlackNotifier({
    webhookUrl,
    ...config,
  });
}

/**
 * 🔔 Notificar resultado do gate
 */
export async function notifyGateResult(
  webhookUrl: string,
  result: CIGateResult,
  author?: string,
  reviewers?: string[]
): Promise<void> {
  const notifier = createSlackNotifier(webhookUrl);
  await notifier.notifyGateResult(result, author, reviewers);
}
