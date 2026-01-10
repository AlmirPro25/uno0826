/**
 * PROST-QS Alerts Dashboard - Frontend
 * "O sistema fala. Você escuta."
 * 
 * Endpoints:
 * - GET  /api/v1/admin/telemetry/alerts/filtered  → Lista alertas com filtros
 * - GET  /api/v1/admin/telemetry/alerts/stats     → Estatísticas de alertas
 * - POST /api/v1/admin/telemetry/alerts/:id/acknowledge → Reconhecer alerta
 * - POST /api/v1/admin/telemetry/alerts/acknowledge-all → Reconhecer todos
 */

// ========================================
// ALERTS SECTION
// ========================================

let alertsPollingInterval = null;

async function renderAlertsSection(container) {
    try {
        const [alertsData, statsData] = await Promise.all([
            api('/admin/telemetry/alerts/filtered?limit=100&acknowledged=false'),
            api('/admin/telemetry/alerts/stats')
        ]);
        
        const alerts = alertsData.alerts || [];
        const stats = statsData || {};
        
        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-bell text-amber-400"></i>
                        Central de Alertas
                    </h2>
                    <p class="text-gray-400">Alertas do sistema e regras</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="toggleAlertsPolling()" id="alerts-polling-btn" 
                            class="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl hover:bg-emerald-500/30 transition-all">
                        <i class="fas fa-sync-alt mr-2"></i> Auto-refresh: OFF
                    </button>
                    <button onclick="acknowledgeAllAlerts()" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-check-double mr-2"></i> Reconhecer Todos
                    </button>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${stats.total || 0}</p>
                    <p class="text-gray-400 text-sm">Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${stats.unacknowledged || 0}</p>
                    <p class="text-gray-400 text-sm">Não Lidos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-red-500">${stats.by_severity?.critical || 0}</p>
                    <p class="text-gray-400 text-sm">Críticos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-orange-400">${stats.by_severity?.warning || 0}</p>
                    <p class="text-gray-400 text-sm">Warnings</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${stats.last_1h || 0}</p>
                    <p class="text-gray-400 text-sm">Última Hora</p>
                </div>
            </div>

            <!-- Filters -->
            <div class="card rounded-2xl p-4 mb-6">
                <div class="flex items-center gap-4">
                    <div>
                        <label class="text-xs text-gray-500">Severidade</label>
                        <select id="filter-severity" onchange="filterAlerts()" 
                                class="bg-dark border border-dark-border rounded-lg px-3 py-2 text-sm">
                            <option value="">Todas</option>
                            <option value="critical">Crítico</option>
                            <option value="warning">Warning</option>
                            <option value="info">Info</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">Fonte</label>
                        <select id="filter-source" onchange="filterAlerts()" 
                                class="bg-dark border border-dark-border rounded-lg px-3 py-2 text-sm">
                            <option value="">Todas</option>
                            <option value="rule">Regras</option>
                            <option value="system">Sistema</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">Status</label>
                        <select id="filter-acknowledged" onchange="filterAlerts()" 
                                class="bg-dark border border-dark-border rounded-lg px-3 py-2 text-sm">
                            <option value="false">Não Lidos</option>
                            <option value="true">Lidos</option>
                            <option value="">Todos</option>
                        </select>
                    </div>
                    <div class="flex-1"></div>
                    <span class="text-sm text-gray-500" id="alerts-count">${alerts.length} alertas</span>
                </div>
            </div>

            <!-- Alerts List -->
            <div id="alerts-list" class="space-y-3">
                ${alerts.length > 0 ? alerts.map(alert => renderAlertCard(alert)).join('') : `
                    <div class="card rounded-2xl p-8 text-center">
                        <i class="fas fa-check-circle text-4xl text-emerald-400 mb-4"></i>
                        <p class="text-gray-400">Nenhum alerta pendente</p>
                        <p class="text-gray-500 text-sm mt-2">O sistema está operando normalmente</p>
                    </div>
                `}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar alertas', err.message);
    }
}

function renderAlertCard(alert) {
    const severityConfig = getAlertSeverityConfig(alert.severity);
    const sourceConfig = getAlertSourceConfig(alert.source);
    
    // Parse data JSON
    let alertData = {};
    try {
        alertData = JSON.parse(alert.data || '{}');
    } catch (e) {}
    
    return `
        <div class="card rounded-2xl p-4 ${alert.acknowledged ? 'opacity-60' : ''} hover:bg-white/5 transition-all">
            <div class="flex items-start gap-4">
                <div class="w-10 h-10 ${severityConfig.bgClass} rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas ${severityConfig.icon} ${severityConfig.iconClass}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold">${alert.title || alert.type}</span>
                        <span class="px-2 py-0.5 rounded-full text-xs ${severityConfig.badgeClass}">
                            ${alert.severity}
                        </span>
                        <span class="px-2 py-0.5 rounded-full text-xs ${sourceConfig.badgeClass}">
                            <i class="fas ${sourceConfig.icon} mr-1"></i>${alert.source}
                        </span>
                        ${alert.acknowledged ? `
                            <span class="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                                <i class="fas fa-check mr-1"></i>Lido
                            </span>
                        ` : ''}
                    </div>
                    <p class="text-sm text-gray-400">${alert.message || ''}</p>
                    ${alert.rule_name ? `
                        <p class="text-xs text-purple-400 mt-1">
                            <i class="fas fa-brain mr-1"></i>Regra: ${alert.rule_name}
                        </p>
                    ` : ''}
                    <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span><i class="fas fa-clock mr-1"></i>${formatTimeAgo(alert.created_at)}</span>
                        <span><i class="fas fa-cube mr-1"></i>${alert.app_id?.substring(0, 8)}...</span>
                        ${alertData.metrics ? `
                            <span class="text-cyan-400">
                                <i class="fas fa-chart-line mr-1"></i>
                                ${Object.entries(alertData.metrics).slice(0, 3).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(1) : v}`).join(', ')}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${!alert.acknowledged ? `
                        <button onclick="acknowledgeAlert('${alert.id}')" 
                                class="p-2 rounded-lg hover:bg-white/10 transition-all text-emerald-400"
                                title="Marcar como lido">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button onclick="showAlertDetails('${alert.id}')" 
                            class="p-2 rounded-lg hover:bg-white/10 transition-all text-gray-400"
                            title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ========================================
// HELPERS
// ========================================

function getAlertSeverityConfig(severity) {
    const configs = {
        'critical': {
            bgClass: 'bg-red-500/20',
            iconClass: 'text-red-400',
            badgeClass: 'bg-red-500/20 text-red-400',
            icon: 'fa-exclamation-circle'
        },
        'warning': {
            bgClass: 'bg-orange-500/20',
            iconClass: 'text-orange-400',
            badgeClass: 'bg-orange-500/20 text-orange-400',
            icon: 'fa-exclamation-triangle'
        },
        'info': {
            bgClass: 'bg-blue-500/20',
            iconClass: 'text-blue-400',
            badgeClass: 'bg-blue-500/20 text-blue-400',
            icon: 'fa-info-circle'
        }
    };
    return configs[severity] || configs['info'];
}

function getAlertSourceConfig(source) {
    const configs = {
        'rule': {
            badgeClass: 'bg-purple-500/20 text-purple-400',
            icon: 'fa-brain'
        },
        'system': {
            badgeClass: 'bg-gray-500/20 text-gray-400',
            icon: 'fa-cog'
        },
        'manual': {
            badgeClass: 'bg-cyan-500/20 text-cyan-400',
            icon: 'fa-user'
        }
    };
    return configs[source] || configs['system'];
}

// ========================================
// ACTIONS
// ========================================

async function acknowledgeAlert(alertId) {
    try {
        await api(`/admin/telemetry/alerts/${alertId}/acknowledge`, { method: 'POST' });
        showToast('Alerta reconhecido', 'success');
        filterAlerts(); // Recarregar lista
    } catch (err) {
        showToast('Erro ao reconhecer alerta: ' + err.message, 'error');
    }
}

async function acknowledgeAllAlerts() {
    if (!confirm('Marcar todos os alertas como lidos?')) return;
    
    try {
        const result = await api('/admin/telemetry/alerts/acknowledge-all', {
            method: 'POST',
            body: JSON.stringify({})
        });
        showToast(`${result.count} alertas reconhecidos`, 'success');
        filterAlerts(); // Recarregar lista
    } catch (err) {
        showToast('Erro: ' + err.message, 'error');
    }
}

async function filterAlerts() {
    const severity = document.getElementById('filter-severity')?.value || '';
    const source = document.getElementById('filter-source')?.value || '';
    const acknowledged = document.getElementById('filter-acknowledged')?.value || '';
    
    try {
        let url = '/admin/telemetry/alerts/filtered?limit=100';
        if (severity) url += `&severity=${severity}`;
        if (source) url += `&source=${source}`;
        if (acknowledged) url += `&acknowledged=${acknowledged}`;
        
        const data = await api(url);
        const alerts = data.alerts || [];
        
        const listContainer = document.getElementById('alerts-list');
        const countEl = document.getElementById('alerts-count');
        
        if (listContainer) {
            listContainer.innerHTML = alerts.length > 0 
                ? alerts.map(alert => renderAlertCard(alert)).join('')
                : `
                    <div class="card rounded-2xl p-8 text-center">
                        <i class="fas fa-check-circle text-4xl text-emerald-400 mb-4"></i>
                        <p class="text-gray-400">Nenhum alerta encontrado</p>
                    </div>
                `;
        }
        
        if (countEl) {
            countEl.textContent = `${alerts.length} alertas`;
        }
    } catch (err) {
        showToast('Erro ao filtrar alertas: ' + err.message, 'error');
    }
}

function toggleAlertsPolling() {
    const btn = document.getElementById('alerts-polling-btn');
    
    if (alertsPollingInterval) {
        clearInterval(alertsPollingInterval);
        alertsPollingInterval = null;
        if (btn) {
            btn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Auto-refresh: OFF';
            btn.classList.remove('bg-emerald-500', 'text-white');
            btn.classList.add('bg-emerald-500/20', 'text-emerald-400');
        }
    } else {
        alertsPollingInterval = setInterval(filterAlerts, 5000);
        if (btn) {
            btn.innerHTML = '<i class="fas fa-sync-alt mr-2 animate-spin"></i> Auto-refresh: ON';
            btn.classList.add('bg-emerald-500', 'text-white');
            btn.classList.remove('bg-emerald-500/20', 'text-emerald-400');
        }
        showToast('Auto-refresh ativado (5s)', 'success');
    }
}

function showAlertDetails(alertId) {
    // TODO: Modal com detalhes completos do alerta
    showToast('Detalhes do alerta: ' + alertId, 'info');
}

// Cleanup ao sair da seção
function cleanupAlertsSection() {
    if (alertsPollingInterval) {
        clearInterval(alertsPollingInterval);
        alertsPollingInterval = null;
    }
}
