/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║        📊 PROST-QS CONFORMITY DASHBOARD - REAL-TIME VISUALIZATION 📊        ║
 * ║                                                                              ║
 * ║                  "Conformidade em tempo real no dashboard"                  ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect } from 'react';

interface ConformityStats {
  total: number;
  approved: number;
  warnings: number;
  rejected: number;
  averageScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface ConformityHistory {
  timestamp: number;
  prNumber?: string;
  branch?: string;
  score: number;
  decision: 'APPROVE' | 'WARNING' | 'REJECT';
  violations: number;
  author?: string;
}

interface ProstQSConformityDashboardProps {
  stats: ConformityStats;
  history: ConformityHistory[];
  onRefresh?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * 📊 Dashboard de Conformidade PROST-QS
 */
export const ProstQSConformityDashboard: React.FC<ProstQSConformityDashboardProps> = ({
  stats,
  history,
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000, // 30 segundos
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      onRefresh();
      setIsRefreshing(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh, refreshInterval]);

  const approvalRate = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
  const rejectionRate = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0;

  return (
    <div className="prost-qs-dashboard">
      <style>{`
        .prost-qs-dashboard {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          padding: 24px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          border-bottom: 2px solid #334155;
          padding-bottom: 16px;
        }

        .dashboard-title {
          font-size: 28px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-controls {
          display: flex;
          gap: 12px;
        }

        .refresh-button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .refresh-button:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .refresh-button:disabled {
          background: #64748b;
          cursor: not-allowed;
          transform: none;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.3s;
        }

        .stat-card:hover {
          border-color: #475569;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        }

        .stat-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 8px;
          letter-spacing: 0.5px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
        }

        .stat-subtext {
          font-size: 12px;
          color: #cbd5e1;
        }

        .score-bar {
          width: 100%;
          height: 8px;
          background: #334155;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 12px;
        }

        .score-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #84cc16, #22c55e);
          transition: width 0.3s ease;
        }

        .trend-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #334155;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 12px;
        }

        .trend-improving {
          color: #22c55e;
        }

        .trend-stable {
          color: #f59e0b;
        }

        .trend-declining {
          color: #ef4444;
        }

        .charts-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .chart-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .chart-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #f1f5f9;
        }

        .pie-chart {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          position: relative;
        }

        .pie-segment {
          position: absolute;
          border-radius: 50%;
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .history-section {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .history-title {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #f1f5f9;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
        }

        .history-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #334155;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: #94a3b8;
          background: #0f172a;
        }

        .history-table td {
          padding: 12px;
          border-bottom: 1px solid #334155;
          font-size: 13px;
        }

        .history-table tr:hover {
          background: #0f172a;
        }

        .decision-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
        }

        .decision-approve {
          background: #10b981;
          color: white;
        }

        .decision-warning {
          background: #f59e0b;
          color: white;
        }

        .decision-reject {
          background: #ef4444;
          color: white;
        }

        .score-cell {
          font-weight: 600;
          color: #f1f5f9;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #94a3b8;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state-text {
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .prost-qs-dashboard {
            padding: 16px;
          }

          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .charts-section {
            grid-template-columns: 1fr;
          }

          .history-table {
            font-size: 12px;
          }

          .history-table th,
          .history-table td {
            padding: 8px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          👑 PROST-QS Conformity Dashboard
        </div>
        <div className="dashboard-controls">
          <button
            className="refresh-button"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? '⟳ Atualizando...' : '⟳ Atualizar'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Total PRs */}
        <div className="stat-card">
          <div className="stat-label">Total de PRs</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-subtext">Todas as submissões</div>
        </div>

        {/* Average Score */}
        <div className="stat-card">
          <div className="stat-label">Score Médio</div>
          <div className="stat-value">{stats.averageScore.toFixed(1)}</div>
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${stats.averageScore}%` }}
            />
          </div>
          <div className="trend-indicator" style={{
            color: stats.trend === 'improving' ? '#22c55e' :
                   stats.trend === 'declining' ? '#ef4444' : '#f59e0b'
          }}>
            {stats.trend === 'improving' ? '📈' :
             stats.trend === 'declining' ? '📉' : '➡️'}
            {stats.trend === 'improving' ? 'Melhorando' :
             stats.trend === 'declining' ? 'Piorando' : 'Estável'}
          </div>
        </div>

        {/* Approval Rate */}
        <div className="stat-card">
          <div className="stat-label">Taxa de Aprovação</div>
          <div className="stat-value">{approvalRate.toFixed(1)}%</div>
          <div className="stat-subtext">{stats.approved} de {stats.total} aprovados</div>
        </div>

        {/* Rejection Rate */}
        <div className="stat-card">
          <div className="stat-label">Taxa de Rejeição</div>
          <div className="stat-value">{rejectionRate.toFixed(1)}%</div>
          <div className="stat-subtext">{stats.rejected} de {stats.total} rejeitados</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Decision Distribution */}
        <div className="chart-card">
          <div className="chart-title">📊 Distribuição de Decisões</div>
          <div className="pie-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#22c55e' }} />
              <span>Aprovados: {stats.approved} ({approvalRate.toFixed(1)}%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f59e0b' }} />
              <span>Warnings: {stats.warnings} ({((stats.warnings / stats.total) * 100).toFixed(1)}%)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }} />
              <span>Rejeitados: {stats.rejected} ({rejectionRate.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="chart-card">
          <div className="chart-title">📈 Análise de Tendência</div>
          <div style={{ padding: '20px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>
                {stats.trend === 'improving' ? '📈' :
                 stats.trend === 'declining' ? '📉' : '➡️'}
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>
                {stats.trend === 'improving' ? 'Melhorando' :
                 stats.trend === 'declining' ? 'Piorando' : 'Estável'}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
              Score médio: {stats.averageScore.toFixed(1)}/100
            </div>
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="history-section">
        <div className="history-title">📋 Histórico Recente</div>
        {history.length > 0 ? (
          <table className="history-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>PR</th>
                <th>Branch</th>
                <th>Decisão</th>
                <th>Score</th>
                <th>Violações</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((entry, idx) => (
                <tr key={idx}>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td>{entry.prNumber ? `#${entry.prNumber}` : '-'}</td>
                  <td>{entry.branch || '-'}</td>
                  <td>
                    <span className={`decision-badge decision-${entry.decision.toLowerCase()}`}>
                      {entry.decision === 'APPROVE' ? '✅' :
                       entry.decision === 'WARNING' ? '⚠️' : '❌'}
                      {entry.decision}
                    </span>
                  </td>
                  <td className="score-cell">{entry.score}/100</td>
                  <td>{entry.violations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">Nenhum histórico disponível</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProstQSConformityDashboard;
