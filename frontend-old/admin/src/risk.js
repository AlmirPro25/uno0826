/**
 * PROST-QS Risk Module - Admin Dashboard
 * "Risco calculável, explicável, defensável"
 * 
 * Endpoints:
 * - GET  /api/v1/risk/apps/:appId         → Score de risco do app
 * - GET  /api/v1/risk/apps/:appId/history → Histórico de risco
 * - GET  /api/v1/risk/apps/:appId/trend   → Tendência de risco
 * - POST /api/v1/risk/check               → Verificar risco de ação
 */

// ========================================
// RISK DASHBOARD
// ========================================

async function renderRiskSection(container) {
    try {
        // Primeiro buscar lista de apps para mostrar riscos
        const apps = await api('/applications').catch(() => ({ applications: [] }));
        const appsList = apps.applications || apps || [];

        // Buscar risco de cada app (limitado aos primeiros 10)
        const riskPromises = appsList.slice(0, 10).map(app => 
            api(`/risk/apps/${app.id}`).catch(() => ({ app_id: app.id, score: 0, level: 'unknown' }))
        );
        const riskScores = await Promise.all(riskPromises);

        const avgRisk = riskScores.length > 0 
            ? (riskScores.reduce((sum, s) => sum + (s.score || 0), 0) / riskScores.length).toFixed(1)
            : 0;

        const highRiskCount = riskScores.filter(s => s.score > 70).length;
        const mediumRiskCount = riskScores.filter(s => s.score > 40 && s.score <= 70).length;

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-rose-400"></i>
                        Risk Analysis
                    </h2>
                    <p class="text-gray-400">Risco calculável, explicável, defensável</p>
                </div>
                <button onclick="showRiskCheckModal()" class="bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl">
                    <i class="fas fa-calculator mr-2"></i> Verificar Risco
                </button>
            </div>

            <!-- Risk Overview -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold ${avgRisk > 70 ? 'text-rose-400' : avgRisk > 40 ? 'text-amber-400' : 'text-emerald-400'}">${avgRisk}</p>
                    <p class="text-gray-400 text-sm">Score Médio</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${highRiskCount}</p>
                    <p class="text-gray-400 text-sm">Alto Risco</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${mediumRiskCount}</p>
                    <p class="text-gray-400 text-sm">Médio Risco</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${appsList.length}</p>
                    <p class="text-gray-400 text-sm">Apps Monitorados</p>
                </div>
            </div>

            <!-- Risk Scores by App -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-bar text-primary"></i>
                    Scores de Risco por App
                </h3>
                ${riskScores.length > 0 ? `
                    <div class="space-y-3">
                        ${riskScores.map(r => {
                            const app = appsList.find(a => a.id === r.app_id) || {};
                            const riskLevel = r.score > 70 ? 'high' : r.score > 40 ? 'medium' : 'low';
                            const colors = { high: 'rose', medium: 'amber', low: 'emerald' };
                            const color = colors[riskLevel];
                            return `
                                <div class="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                    <div class="w-12 h-12 bg-${color}-500/20 rounded-xl flex items-center justify-center">
                                        <span class="text-${color}-400 font-bold text-lg">${r.score || 0}</span>
                                    </div>
                                    <div class="flex-1">
                                        <p class="font-medium">${app.name || 'App'}</p>
                                        <p class="text-xs text-gray-500">${r.app_id?.substring(0, 8) || '-'}...</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="px-2 py-1 rounded-full text-xs bg-${color}-500/20 text-${color}-400">
                                            ${r.level || riskLevel}
                                        </span>
                                        <button onclick="viewAppRiskHistory('${r.app_id}')" class="ml-2 p-2 rounded-lg hover:bg-white/10 text-gray-400">
                                            <i class="fas fa-history"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-chart-bar text-4xl mb-4"></i>
                        <p>Nenhum app para análise de risco</p>
                    </div>
                `}
            </div>

            <!-- Risk Factors -->
            <div class="card rounded-2xl p-6 mt-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-puzzle-piece text-purple-400"></i>
                    Fatores de Risco Analisados
                </h3>
                <div class="grid grid-cols-5 gap-4">
                    ${renderRiskFactors()}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Risk', err.message);
    }
}

function renderRiskFactors() {
    const factors = [
        { name: 'Autenticação', icon: 'lock', color: 'blue', desc: 'Falhas de login, MFA' },
        { name: 'Transações', icon: 'credit-card', color: 'emerald', desc: 'Volume, valores' },
        { name: 'Comportamento', icon: 'user-clock', color: 'purple', desc: 'Padrões anômalos' },
        { name: 'Geolocalização', icon: 'map-marker-alt', color: 'amber', desc: 'IPs suspeitos' },
        { name: 'API Usage', icon: 'server', color: 'cyan', desc: 'Rate limits, erros' }
    ];

    return factors.map(f => `
        <div class="text-center p-4 bg-white/5 rounded-xl">
            <i class="fas fa-${f.icon} text-2xl text-${f.color}-400 mb-2"></i>
            <p class="text-sm font-medium">${f.name}</p>
            <p class="text-xs text-gray-500">${f.desc}</p>
        </div>
    `).join('');
}

function showRiskCheckModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.id = 'risk-modal';
    modal.innerHTML = `
        <div class="bg-dark-card rounded-2xl p-6 max-w-md w-full mx-4 border border-dark-border">
            <h3 class="text-xl font-bold mb-4">Verificar Risco de Ação</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Tipo de Ação</label>
                    <select id="risk-action-type" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2">
                        <option value="payment">Pagamento</option>
                        <option value="withdrawal">Saque</option>
                        <option value="transfer">Transferência</option>
                        <option value="login">Login</option>
                        <option value="api_call">API Call</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">User ID</label>
                    <input type="text" id="risk-user-id" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="uuid...">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Valor (centavos)</label>
                    <input type="number" id="risk-amount" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="10000">
                </div>
            </div>
            <div class="flex gap-2 mt-6">
                <button onclick="document.getElementById('risk-modal').remove()" class="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">Cancelar</button>
                <button onclick="checkRisk()" class="flex-1 bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl">Verificar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function checkRisk() {
    const actionType = document.getElementById('risk-action-type')?.value;
    const userId = document.getElementById('risk-user-id')?.value;
    const amount = parseInt(document.getElementById('risk-amount')?.value || '0');

    try {
        const result = await api('/risk/check', {
            method: 'POST',
            body: JSON.stringify({ 
                action_type: actionType, 
                user_id: userId,
                amount: amount
            })
        });
        
        document.getElementById('risk-modal')?.remove();
        const level = result.risk_level || result.level || 'unknown';
        const score = result.risk_score || result.score || 0;
        toast(`Risco: ${score} (${level}) - ${result.allowed ? 'PERMITIDO' : 'BLOQUEADO'}`, 
            score > 70 ? 'error' : score > 40 ? 'warning' : 'success');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function viewAppRiskHistory(appId) {
    try {
        const history = await api(`/risk/apps/${appId}/history?days=7`);
        toast(`Histórico: ${history.count || 0} registros nos últimos 7 dias`, 'info');
    } catch (err) {
        toast('Erro ao buscar histórico: ' + err.message, 'error');
    }
}
