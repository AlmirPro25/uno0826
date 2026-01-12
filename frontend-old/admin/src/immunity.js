/**
 * PROST-QS Immunity Module - Admin Dashboard
 * "Sistema Imunológico do Kernel"
 * 
 * Endpoints:
 * - GET  /api/v1/immunity/health           → Saúde do sistema
 * - GET  /api/v1/immunity/stats            → Estatísticas completas
 * - GET  /api/v1/immunity/alerts           → Alertas de segurança
 * - POST /api/v1/immunity/alerts/:id/ack   → Reconhecer alerta
 * - GET  /api/v1/immunity/quarantine       → Itens em quarentena
 * - POST /api/v1/immunity/quarantine/release → Liberar quarentena
 * - GET  /api/v1/immunity/circuits         → Circuit breakers
 * - GET  /api/v1/immunity/threats          → Fontes bloqueadas
 */

// ========================================
// IMMUNITY DASHBOARD
// ========================================

async function renderImmunitySection(container) {
    try {
        const [health, stats, alertsData, quarantineData, circuitsData, threatsData] = await Promise.all([
            api('/immunity/health').catch(() => ({ status: 'healthy', score: 100 })),
            api('/immunity/stats').catch(() => ({})),
            api('/immunity/alerts').catch(() => ({ alerts: [] })),
            api('/immunity/quarantine').catch(() => ({ quarantines: [] })),
            api('/immunity/circuits').catch(() => ({ circuits: [] })),
            api('/immunity/threats').catch(() => ({ blocked_sources: [] }))
        ]);

        const alertsList = alertsData.alerts || [];
        const quarantineList = quarantineData.quarantines || [];
        const circuitsList = circuitsData.circuits || [];
        const threatsList = threatsData.blocked_sources || [];

        const isHealthy = health.status === 'healthy';
        const threatLevel = stats.threat_level || (isHealthy ? 'low' : 'medium');

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-shield-virus text-emerald-400"></i>
                        Sistema Imunológico
                    </h2>
                    <p class="text-gray-400">Defesa automática do Kernel</p>
                </div>
                <button onclick="showSection('immunity')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
                    <i class="fas fa-sync-alt mr-2"></i> Atualizar
                </button>
            </div>

            <!-- Status Banner -->
            <div class="bg-gradient-to-r ${isHealthy ? 'from-emerald-500/20 to-emerald-900/20 border-emerald-500' : 'from-rose-500/20 to-rose-900/20 border-rose-500'} border-l-4 rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'} rounded-2xl flex items-center justify-center">
                            <i class="fas fa-${isHealthy ? 'shield-alt' : 'exclamation-triangle'} text-3xl text-white"></i>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold">${isHealthy ? 'Sistema Protegido' : 'Ameaça Detectada'}</h3>
                            <p class="text-gray-400">
                                Score: <span class="${health.score >= 80 ? 'text-emerald-400' : health.score >= 50 ? 'text-amber-400' : 'text-rose-400'}">${health.score || 100}%</span>
                                | Nível: <span class="${getThreatColor(threatLevel)}">${threatLevel.toUpperCase()}</span>
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-400">Status</p>
                        <p class="text-lg capitalize">${health.status || 'healthy'}</p>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold ${alertsList.filter(a => !a.is_acked).length > 0 ? 'text-rose-400' : 'text-emerald-400'}">${alertsList.filter(a => !a.is_acked).length}</p>
                    <p class="text-gray-400 text-sm">Alertas Ativos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${quarantineList.length}</p>
                    <p class="text-gray-400 text-sm">Em Quarentena</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold ${circuitsList.filter(b => b.state === 'open').length > 0 ? 'text-rose-400' : 'text-emerald-400'}">${circuitsList.filter(b => b.state === 'open').length}</p>
                    <p class="text-gray-400 text-sm">Breakers Abertos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${threatsList.length}</p>
                    <p class="text-gray-400 text-sm">IPs Bloqueados</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${health.total_heals || 0}</p>
                    <p class="text-gray-400 text-sm">Auto-Heals</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6 mb-6">
                <!-- Alerts -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-bell text-rose-400"></i>
                        Alertas de Segurança
                    </h3>
                    <div class="space-y-2 max-h-64 overflow-auto">
                        ${alertsList.length > 0 ? alertsList.map(a => `
                            <div class="flex items-center justify-between p-3 rounded-xl ${a.is_acked ? 'bg-white/5' : getSeverityBg(a.severity)}">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-${getSeverityIcon(a.severity)} ${getSeverityColor(a.severity)}"></i>
                                    <div>
                                        <p class="text-sm font-medium">${a.title || a.category}</p>
                                        <p class="text-xs text-gray-500">${a.message?.substring(0, 50) || '-'}...</p>
                                    </div>
                                </div>
                                ${!a.is_acked ? `
                                    <button onclick="ackImmunityAlert('${a.id}')" class="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
                                        ACK
                                    </button>
                                ` : '<span class="text-xs text-emerald-400">✓</span>'}
                            </div>
                        `).join('') : '<p class="text-emerald-400 text-center py-4"><i class="fas fa-check-circle mr-2"></i>Nenhum alerta</p>'}
                    </div>
                </div>

                <!-- Circuit Breakers -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-plug text-amber-400"></i>
                        Circuit Breakers
                    </h3>
                    <div class="space-y-2 max-h-64 overflow-auto">
                        ${circuitsList.length > 0 ? circuitsList.map(b => `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 rounded-full ${b.state === 'closed' ? 'bg-emerald-500' : b.state === 'open' ? 'bg-rose-500' : 'bg-amber-500'}"></div>
                                    <div>
                                        <p class="text-sm font-medium">${b.name || b.service}</p>
                                        <p class="text-xs text-gray-500">Falhas: ${b.failures || 0}</p>
                                    </div>
                                </div>
                                <span class="px-2 py-1 rounded text-xs ${b.state === 'closed' ? 'bg-emerald-500/20 text-emerald-400' : b.state === 'open' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}">
                                    ${b.state}
                                </span>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-center py-4">Nenhum circuit breaker</p>'}
                    </div>
                </div>
            </div>

            <!-- Quarantine -->
            <div class="card rounded-2xl p-6 mb-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-biohazard text-amber-400"></i>
                    Quarentena
                </h3>
                ${quarantineList.length > 0 ? `
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="text-left text-gray-400 border-b border-gray-700">
                                    <th class="pb-2">Tipo</th>
                                    <th class="pb-2">ID</th>
                                    <th class="pb-2">Motivo</th>
                                    <th class="pb-2">Expira</th>
                                    <th class="pb-2">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${quarantineList.map(q => `
                                    <tr class="border-b border-gray-800">
                                        <td class="py-2">
                                            <span class="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400">${q.target_type || q.type || 'unknown'}</span>
                                        </td>
                                        <td class="py-2 font-mono text-xs">${(q.target_id || q.id)?.substring(0, 12) || '-'}...</td>
                                        <td class="py-2 text-gray-400">${q.reason || '-'}</td>
                                        <td class="py-2 text-gray-500">${q.expires_at ? formatDate(q.expires_at) : 'Nunca'}</td>
                                        <td class="py-2">
                                            <button onclick="releaseFromQuarantine('${q.target_type || q.type}', '${q.target_id || q.id}')" class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/30">
                                                Liberar
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<p class="text-emerald-400 text-center py-4"><i class="fas fa-check-circle mr-2"></i>Nenhum item em quarentena</p>'}
            </div>

            <!-- Blocked IPs -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-ban text-rose-400"></i>
                    IPs Bloqueados
                </h3>
                ${threatsList.length > 0 ? `
                    <div class="grid grid-cols-3 gap-4">
                        ${threatsList.map(t => `
                            <div class="p-3 rounded-xl bg-rose-500/10 flex items-center justify-between">
                                <div>
                                    <p class="font-mono text-sm">${t.source}</p>
                                    <p class="text-xs text-gray-500">${t.remaining || '-'}</p>
                                </div>
                                <button onclick="unblockIP('${t.source}')" class="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">
                                    Desbloquear
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-emerald-400 text-center py-4"><i class="fas fa-check-circle mr-2"></i>Nenhum IP bloqueado</p>'}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Immunity', err.message);
    }
}

// ========================================
// HELPERS
// ========================================

function getThreatColor(level) {
    switch (level) {
        case 'critical': return 'text-rose-400';
        case 'high': return 'text-orange-400';
        case 'medium': return 'text-amber-400';
        case 'low': return 'text-emerald-400';
        default: return 'text-gray-400';
    }
}

function getSeverityBg(severity) {
    switch (severity) {
        case 'critical': return 'bg-rose-500/20';
        case 'high': return 'bg-orange-500/20';
        case 'warning': return 'bg-amber-500/20';
        default: return 'bg-blue-500/20';
    }
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'critical': return 'text-rose-400';
        case 'high': return 'text-orange-400';
        case 'warning': return 'text-amber-400';
        default: return 'text-blue-400';
    }
}

function getSeverityIcon(severity) {
    switch (severity) {
        case 'critical': return 'skull-crossbones';
        case 'high': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// ========================================
// ACTIONS
// ========================================

async function ackImmunityAlert(alertId) {
    try {
        await api(`/immunity/alerts/${alertId}/ack`, {
            method: 'POST',
            body: JSON.stringify({ acked_by: currentUser?.username || 'admin' })
        });
        toast('Alerta reconhecido', 'success');
        showSection('immunity');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function releaseFromQuarantine(targetType, targetId) {
    if (!confirm('Liberar este item da quarentena?')) return;

    try {
        await api('/immunity/quarantine/release', { 
            method: 'POST',
            body: JSON.stringify({
                target_type: targetType,
                target_id: targetId,
                released_by: currentUser?.username || 'admin',
                note: 'Liberado manualmente via Admin Console'
            })
        });
        toast('Item liberado', 'success');
        showSection('immunity');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function unblockIP(ip) {
    if (!confirm(`Desbloquear IP ${ip}?`)) return;

    try {
        await api('/immunity/threats/unblock', {
            method: 'POST',
            body: JSON.stringify({ ip })
        });
        toast('IP desbloqueado', 'success');
        showSection('immunity');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
