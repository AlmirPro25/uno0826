/**
 * PROST-QS Telemetry Module - Admin Dashboard
 * "Observabilidade avançada do comportamento do sistema"
 * 
 * Endpoints Admin:
 * - GET  /api/v1/admin/telemetry/alerts           → Todos os alertas
 * - GET  /api/v1/admin/telemetry/alerts/stats     → Estatísticas de alertas
 * - GET  /api/v1/admin/telemetry/apps/:id/metrics → Métricas de um app
 * - GET  /api/v1/admin/telemetry/apps/:id/retention → Retenção
 * - GET  /api/v1/admin/telemetry/apps/:id/funnel  → Funil
 * - GET  /api/v1/admin/telemetry/apps/:id/engagement → Engajamento
 * - GET  /api/v1/admin/telemetry/apps/:id/heatmap → Heatmap
 * - GET  /api/v1/admin/telemetry/apps/:id/journey → Jornada
 * - GET  /api/v1/admin/telemetry/apps/:id/live    → Eventos em tempo real
 */

// ========================================
// TELEMETRY DASHBOARD
// ========================================

async function renderTelemetrySection(container) {
    try {
        // Buscar apps primeiro
        const apps = await api('/applications').catch(() => ({ applications: [] }));
        const appsList = apps.applications || apps || [];
        
        // Buscar alertas e stats gerais
        const [alertsData, alertStats] = await Promise.all([
            api('/admin/telemetry/alerts').catch(() => ({ alerts: [] })),
            api('/admin/telemetry/alerts/stats').catch(() => ({}))
        ]);

        const alertsList = alertsData.alerts || [];
        const activeAlerts = alertsList.filter(a => !a.acknowledged);

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-chart-area text-cyan-400"></i>
                        Telemetry Dashboard
                    </h2>
                    <p class="text-gray-400">Observabilidade avançada do comportamento do sistema</p>
                </div>
                <div class="flex gap-2">
                    <select id="telemetry-app" onchange="loadAppTelemetry()" class="bg-dark border border-dark-border rounded-xl px-4 py-2">
                        <option value="">Selecione um App</option>
                        ${appsList.map(app => `<option value="${app.id}">${app.name || app.id}</option>`).join('')}
                    </select>
                    <button onclick="showSection('telemetry')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <!-- Alert Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center border-l-4 ${activeAlerts.length > 0 ? 'border-rose-500' : 'border-emerald-500'}">
                    <p class="text-3xl font-bold ${activeAlerts.length > 0 ? 'text-rose-400' : 'text-emerald-400'}">${activeAlerts.length}</p>
                    <p class="text-gray-400 text-sm">Alertas Ativos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${appsList.length}</p>
                    <p class="text-gray-400 text-sm">Apps</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${alertStats.total || alertsList.length}</p>
                    <p class="text-gray-400 text-sm">Total Alertas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${alertStats.by_severity?.warning || 0}</p>
                    <p class="text-gray-400 text-sm">Warnings</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${alertStats.by_severity?.critical || 0}</p>
                    <p class="text-gray-400 text-sm">Critical</p>
                </div>
            </div>

            <!-- Alerts List -->
            <div class="card rounded-2xl p-6 mb-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-bell text-amber-400"></i>
                    Alertas Recentes
                </h3>
                <div class="space-y-2 max-h-60 overflow-y-auto">
                    ${alertsList.length > 0 ? alertsList.slice(0, 10).map(alert => `
                        <div class="flex items-center justify-between p-3 rounded-xl ${alert.severity === 'critical' ? 'bg-rose-500/10' : 'bg-amber-500/10'}">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-${alert.severity === 'critical' ? 'exclamation-circle text-rose-400' : 'exclamation-triangle text-amber-400'}"></i>
                                <div>
                                    <p class="font-medium text-sm">${alert.type || alert.message || 'Alert'}</p>
                                    <p class="text-xs text-gray-500">${alert.app_id?.substring(0, 8) || '-'}...</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-gray-400">${alert.created_at ? formatDate(alert.created_at) : '-'}</span>
                                ${!alert.acknowledged ? `
                                    <button onclick="acknowledgeAlert('${alert.id}')" class="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs">
                                        Ack
                                    </button>
                                ` : '<span class="text-xs text-emerald-400">✓</span>'}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="text-center py-4 text-emerald-400">
                            <i class="fas fa-check-circle mr-2"></i>
                            Nenhum alerta
                        </div>
                    `}
                </div>
            </div>

            <!-- App Telemetry (loaded dynamically) -->
            <div id="app-telemetry-content">
                <div class="card rounded-2xl p-8 text-center text-gray-500">
                    <i class="fas fa-chart-area text-4xl mb-4"></i>
                    <p>Selecione um app para ver métricas detalhadas</p>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Telemetry', err.message);
    }
}

async function loadAppTelemetry() {
    const appId = document.getElementById('telemetry-app')?.value;
    const content = document.getElementById('app-telemetry-content');
    
    if (!appId || !content) return;

    content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl"></i></div>';

    try {
        const [metrics, retention, engagement] = await Promise.all([
            api(`/admin/telemetry/apps/${appId}/metrics`).catch(() => ({})),
            api(`/admin/telemetry/apps/${appId}/retention`).catch(() => ({})),
            api(`/admin/telemetry/apps/${appId}/engagement`).catch(() => ({}))
        ]);

        content.innerHTML = `
            <div class="grid grid-cols-2 gap-6">
                <!-- Metrics -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-chart-line text-cyan-400"></i>
                        Métricas
                    </h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-3 bg-white/5 rounded-xl">
                            <p class="text-2xl font-bold text-blue-400">${metrics.total_events || 0}</p>
                            <p class="text-xs text-gray-400">Eventos</p>
                        </div>
                        <div class="text-center p-3 bg-white/5 rounded-xl">
                            <p class="text-2xl font-bold text-emerald-400">${metrics.unique_users || 0}</p>
                            <p class="text-xs text-gray-400">Usuários</p>
                        </div>
                        <div class="text-center p-3 bg-white/5 rounded-xl">
                            <p class="text-2xl font-bold text-purple-400">${metrics.active_sessions || 0}</p>
                            <p class="text-xs text-gray-400">Sessões Ativas</p>
                        </div>
                        <div class="text-center p-3 bg-white/5 rounded-xl">
                            <p class="text-2xl font-bold text-amber-400">${metrics.avg_session_duration || 0}s</p>
                            <p class="text-xs text-gray-400">Duração Média</p>
                        </div>
                    </div>
                </div>

                <!-- Retention -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-user-clock text-purple-400"></i>
                        Retenção
                    </h3>
                    <div class="space-y-3">
                        ${['D1', 'D7', 'D14', 'D30'].map((day, i) => {
                            const key = ['day_1', 'day_7', 'day_14', 'day_30'][i];
                            const value = retention[key] || 0;
                            return `
                                <div>
                                    <div class="flex justify-between text-sm mb-1">
                                        <span class="text-gray-400">${day}</span>
                                        <span class="text-cyan-400">${value}%</span>
                                    </div>
                                    <div class="w-full bg-gray-700 rounded-full h-2">
                                        <div class="bg-cyan-500 rounded-full h-2" style="width: ${value}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>

            <!-- Engagement -->
            <div class="card rounded-2xl p-6 mt-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-heart text-rose-400"></i>
                    Engajamento
                </h3>
                <div class="grid grid-cols-4 gap-4">
                    <div class="text-center p-4 bg-white/5 rounded-xl">
                        <p class="text-2xl font-bold text-purple-400">${engagement.avg_session_duration || 0}s</p>
                        <p class="text-xs text-gray-400">Duração Média</p>
                    </div>
                    <div class="text-center p-4 bg-white/5 rounded-xl">
                        <p class="text-2xl font-bold text-blue-400">${engagement.avg_actions_per_session || 0}</p>
                        <p class="text-xs text-gray-400">Ações/Sessão</p>
                    </div>
                    <div class="text-center p-4 bg-white/5 rounded-xl">
                        <p class="text-2xl font-bold text-emerald-400">${engagement.return_rate || 0}%</p>
                        <p class="text-xs text-gray-400">Taxa de Retorno</p>
                    </div>
                    <div class="text-center p-4 bg-white/5 rounded-xl">
                        <p class="text-2xl font-bold text-amber-400">${engagement.bounce_rate || 0}%</p>
                        <p class="text-xs text-gray-400">Bounce Rate</p>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        content.innerHTML = `<div class="card rounded-2xl p-8 text-center text-rose-400">${err.message}</div>`;
    }
}

async function acknowledgeAlert(alertId) {
    try {
        await api(`/admin/telemetry/alerts/${alertId}/acknowledge`, { method: 'POST' });
        toast('Alerta reconhecido', 'success');
        showSection('telemetry');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
