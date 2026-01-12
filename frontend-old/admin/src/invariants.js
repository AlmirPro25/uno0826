/**
 * PROST-QS Invariants Module - Admin Dashboard
 * "Testes ativos que vivem em produção"
 * 
 * Endpoints:
 * - GET  /api/v1/invariants/violations  → Lista violações
 * - GET  /api/v1/invariants/stats       → Estatísticas
 * - DELETE /api/v1/invariants/violations → Limpar violações
 */

// ========================================
// INVARIANTS DASHBOARD
// ========================================

async function renderInvariantsSection(container) {
    try {
        const [stats, violations] = await Promise.all([
            api('/admin/invariants/stats').catch(() => ({ total: 0, by_severity: {}, by_invariant: {}, enabled: true })),
            api('/admin/invariants/violations').catch(() => ({ violations: [], count: 0 }))
        ]);

        const violationsList = violations.violations || [];
        const isHealthy = stats.total === 0;
        const bySeverity = stats.by_severity || {};
        const byInvariant = stats.by_invariant || {};

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-shield-check text-emerald-400"></i>
                        System Invariants
                    </h2>
                    <p class="text-gray-400">Testes ativos que vivem em produção</p>
                </div>
                <button onclick="clearInvariantViolations()" class="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-all">
                    <i class="fas fa-trash mr-2"></i> Limpar Violações
                </button>
            </div>

            <!-- Status Banner -->
            <div class="bg-gradient-to-r ${isHealthy ? 'from-emerald-500/20 to-emerald-900/20 border-emerald-500' : 'from-rose-500/20 to-rose-900/20 border-rose-500'} border-l-4 rounded-2xl p-6 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'} rounded-2xl flex items-center justify-center">
                        <i class="fas fa-${isHealthy ? 'check-circle' : 'exclamation-triangle'} text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">${isHealthy ? 'Sistema Saudável' : `${stats.total} Violações Detectadas`}</h2>
                        <p class="text-gray-400">Invariants ${stats.enabled ? 'habilitadas' : 'desabilitadas'}</p>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${stats.total || 0}</p>
                    <p class="text-gray-400 text-sm">Total Violações</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${bySeverity.WARNING || 0}</p>
                    <p class="text-gray-400 text-sm">Warning</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${bySeverity.CRITICAL || 0}</p>
                    <p class="text-gray-400 text-sm">Critical</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-red-600">${bySeverity.FATAL || 0}</p>
                    <p class="text-gray-400 text-sm">Fatal</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <!-- Violations List -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-list text-primary"></i>
                        Violações Recentes
                    </h3>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${violationsList.length > 0 ? violationsList.map(v => `
                            <div class="flex items-center justify-between p-3 rounded-xl ${v.Severity === 'FATAL' ? 'bg-red-500/10' : v.Severity === 'CRITICAL' ? 'bg-rose-500/10' : 'bg-amber-500/10'}">
                                <div class="flex items-center gap-3">
                                    <i class="fas fa-${v.Severity === 'FATAL' ? 'skull' : v.Severity === 'CRITICAL' ? 'times-circle' : 'exclamation-triangle'} text-${v.Severity === 'FATAL' ? 'red-600' : v.Severity === 'CRITICAL' ? 'rose-400' : 'amber-400'}"></i>
                                    <div>
                                        <p class="font-medium text-sm">${v.Invariant || 'Unknown'}</p>
                                        <p class="text-xs text-gray-500">${v.Message || '-'}</p>
                                    </div>
                                </div>
                                <span class="text-xs text-gray-400">${v.Timestamp ? formatDate(v.Timestamp) : '-'}</span>
                            </div>
                        `).join('') : `
                            <div class="text-center py-8 text-emerald-400">
                                <i class="fas fa-check-circle text-4xl mb-4"></i>
                                <p>Nenhuma violação registrada</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- By Invariant -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-chart-bar text-purple-400"></i>
                        Por Invariante
                    </h3>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${Object.keys(byInvariant).length > 0 ? Object.entries(byInvariant).sort((a, b) => b[1] - a[1]).map(([name, count]) => `
                            <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span class="text-sm font-mono">${name}</span>
                                <span class="px-2 py-1 bg-rose-500/20 text-rose-400 rounded-full text-xs">${count}</span>
                            </div>
                        `).join('') : `
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-chart-bar text-4xl mb-4"></i>
                                <p>Nenhuma invariante com violações</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Invariants', err.message);
    }
}

async function clearInvariantViolations() {
    if (!confirm('Limpar todas as violações registradas?')) return;
    
    try {
        await api('/admin/invariants/violations', { method: 'DELETE' });
        toast('Violações limpas', 'success');
        showSection('invariants');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
