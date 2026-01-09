/**
 * PROST-QS Financial Dashboard
 * Fase 27.0 - "Todo centavo que passa é rastreável"
 */

// ========================================
// FINANCIAL DASHBOARD (Global - Super Admin)
// ========================================

async function renderFinancialDashboard(container) {
    try {
        // Carregar dados em paralelo
        const [globalMetrics, dailySnapshots, topApps, recentEvents] = await Promise.all([
            api('/admin/financial/metrics').catch(() => ({})),
            api('/admin/financial/daily?days=30').catch(() => ({ snapshots: [] })),
            api('/admin/financial/top-apps?limit=5').catch(() => ({ apps: [] })),
            api('/admin/financial/events?limit=10').catch(() => ({ events: [] }))
        ]);

        const snapshots = dailySnapshots.snapshots || [];
        const apps = topApps.apps || [];
        const events = recentEvents.events || [];

        container.innerHTML = `
            <!-- Header Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30">
                    <p class="text-3xl font-bold text-emerald-400">${formatCurrency(globalMetrics.total_revenue)}</p>
                    <p class="text-gray-400 text-sm">Receita Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${formatCurrency(globalMetrics.net_revenue)}</p>
                    <p class="text-gray-400 text-sm">Receita Líquida</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${formatCurrency(globalMetrics.total_fees)}</p>
                    <p class="text-gray-400 text-sm">Taxas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${formatCurrency(globalMetrics.total_refunds)}</p>
                    <p class="text-gray-400 text-sm">Reembolsos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${globalMetrics.total_payments || 0}</p>
                    <p class="text-gray-400 text-sm">Transações</p>
                </div>
            </div>

            <!-- Rolling Metrics -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400 text-sm">Hoje</span>
                        <i class="fas fa-calendar-day text-primary"></i>
                    </div>
                    <p class="text-2xl font-bold">${formatCurrency(globalMetrics.revenue_today)}</p>
                    <p class="text-xs text-gray-500">${globalMetrics.volume_today || 0} transações</p>
                </div>
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400 text-sm">7 dias</span>
                        <i class="fas fa-calendar-week text-blue-400"></i>
                    </div>
                    <p class="text-2xl font-bold">${formatCurrency(globalMetrics.revenue_7d)}</p>
                    <p class="text-xs text-gray-500">${globalMetrics.volume_7d || 0} transações</p>
                </div>
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400 text-sm">30 dias</span>
                        <i class="fas fa-calendar-alt text-emerald-400"></i>
                    </div>
                    <p class="text-2xl font-bold">${formatCurrency(globalMetrics.revenue_30d)}</p>
                    <p class="text-xs text-gray-500">${globalMetrics.volume_30d || 0} transações</p>
                </div>
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-gray-400 text-sm">Apps Ativos</span>
                        <i class="fas fa-cube text-purple-400"></i>
                    </div>
                    <p class="text-2xl font-bold">${globalMetrics.active_apps || 0}</p>
                    <p class="text-xs text-gray-500">de ${globalMetrics.total_apps || 0} total</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-6 mb-6">
                <!-- Revenue Chart -->
                <div class="card rounded-2xl p-6 col-span-2">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-chart-line text-emerald-400"></i>
                        Receita (30 dias)
                    </h3>
                    <div class="h-64">
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>

                <!-- Top Apps -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-trophy text-amber-400"></i>
                        Top Apps por Receita
                    </h3>
                    <div class="space-y-3">
                        ${apps.length > 0 ? apps.map((app, i) => `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded-full ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-600'} flex items-center justify-center text-xs font-bold">${i + 1}</span>
                                    <span class="text-sm font-mono truncate max-w-24">${app.app_id.substring(0, 8)}...</span>
                                </div>
                                <span class="text-emerald-400 font-bold">${formatCurrency(app.total_revenue)}</span>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-center py-4">Nenhum app com receita</p>'}
                    </div>
                </div>
            </div>

            <!-- Recent Events -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-history text-primary"></i>
                    Eventos Recentes
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-2">Tipo</th>
                                <th class="pb-2">App</th>
                                <th class="pb-2">Valor</th>
                                <th class="pb-2">Provider</th>
                                <th class="pb-2">External ID</th>
                                <th class="pb-2">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${events.length > 0 ? events.map(e => `
                                <tr class="border-b border-gray-800 hover:bg-white/5">
                                    <td class="py-3">
                                        <span class="px-2 py-1 rounded text-xs ${getEventTypeColor(e.type)}">${formatEventType(e.type)}</span>
                                    </td>
                                    <td class="py-3 font-mono text-xs">${e.app_id.substring(0, 8)}...</td>
                                    <td class="py-3 ${e.type.includes('refund') || e.type.includes('dispute') ? 'text-rose-400' : 'text-emerald-400'} font-bold">
                                        ${e.type.includes('refund') || e.type.includes('dispute') ? '-' : ''}${formatCurrency(e.amount)}
                                    </td>
                                    <td class="py-3">
                                        <span class="flex items-center gap-1">
                                            <i class="fab fa-${e.provider === 'stripe' ? 'stripe' : 'credit-card'} text-purple-400"></i>
                                            ${e.provider}
                                        </span>
                                    </td>
                                    <td class="py-3 font-mono text-xs text-gray-500">${e.external_id ? e.external_id.substring(0, 15) + '...' : '-'}</td>
                                    <td class="py-3 text-gray-500">${formatDate(e.occurred_at)}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="6" class="py-8 text-center text-gray-500">Nenhum evento registrado</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Renderizar gráfico
        if (snapshots.length > 0) {
            renderRevenueChart(snapshots);
        }
    } catch (err) {
        container.innerHTML = `<div class="card rounded-2xl p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-amber-400 mb-4"></i>
            <p class="text-gray-400">${err.message}</p>
        </div>`;
    }
}

// ========================================
// APP FINANCIAL VIEW
// ========================================

async function renderAppFinancial(container, appId) {
    try {
        const [metrics, dailySnapshots, events] = await Promise.all([
            api(`/apps/${appId}/financial/metrics`),
            api(`/apps/${appId}/financial/daily?days=30`).catch(() => ({ snapshots: [] })),
            api(`/apps/${appId}/financial/events?limit=20`).catch(() => ({ events: [] }))
        ]);

        const snapshots = dailySnapshots.snapshots || [];
        const eventsList = events.events || [];

        container.innerHTML = `
            <!-- Back Button -->
            <button onclick="showSection('applications')" class="text-gray-400 hover:text-white mb-4">
                <i class="fas fa-arrow-left mr-2"></i> Voltar para Apps
            </button>

            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30">
                    <p class="text-2xl font-bold text-emerald-400">${formatCurrency(metrics.total_revenue)}</p>
                    <p class="text-gray-400 text-xs">Receita Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-blue-400">${formatCurrency(metrics.net_revenue)}</p>
                    <p class="text-gray-400 text-xs">Líquido</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-emerald-400">${metrics.payments_success || 0}</p>
                    <p class="text-gray-400 text-xs">Pagamentos OK</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-rose-400">${metrics.payments_failed || 0}</p>
                    <p class="text-gray-400 text-xs">Falhas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-amber-400">${metrics.refunds_count || 0}</p>
                    <p class="text-gray-400 text-xs">Reembolsos</p>
                </div>
            </div>

            <!-- Rolling -->
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="card rounded-2xl p-4">
                    <p class="text-gray-400 text-sm mb-1">Hoje</p>
                    <p class="text-xl font-bold">${formatCurrency(metrics.revenue_today)}</p>
                </div>
                <div class="card rounded-2xl p-4">
                    <p class="text-gray-400 text-sm mb-1">7 dias</p>
                    <p class="text-xl font-bold">${formatCurrency(metrics.revenue_7d)}</p>
                </div>
                <div class="card rounded-2xl p-4">
                    <p class="text-gray-400 text-sm mb-1">30 dias</p>
                    <p class="text-xl font-bold">${formatCurrency(metrics.revenue_30d)}</p>
                </div>
            </div>

            <!-- Chart -->
            <div class="card rounded-2xl p-6 mb-6">
                <h3 class="font-bold mb-4">Receita Diária</h3>
                <div class="h-48">
                    <canvas id="app-revenue-chart"></canvas>
                </div>
            </div>

            <!-- Events -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4">Eventos Financeiros</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-2">Tipo</th>
                                <th class="pb-2">Valor</th>
                                <th class="pb-2">Líquido</th>
                                <th class="pb-2">Taxa</th>
                                <th class="pb-2">External ID</th>
                                <th class="pb-2">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eventsList.map(e => `
                                <tr class="border-b border-gray-800">
                                    <td class="py-2">
                                        <span class="px-2 py-1 rounded text-xs ${getEventTypeColor(e.type)}">${formatEventType(e.type)}</span>
                                    </td>
                                    <td class="py-2 font-bold ${e.type.includes('refund') ? 'text-rose-400' : 'text-emerald-400'}">${formatCurrency(e.amount)}</td>
                                    <td class="py-2 text-blue-400">${formatCurrency(e.net_amount)}</td>
                                    <td class="py-2 text-amber-400">${formatCurrency(e.fee_amount)}</td>
                                    <td class="py-2 font-mono text-xs text-gray-500">${e.external_id || '-'}</td>
                                    <td class="py-2 text-gray-500">${formatDate(e.occurred_at)}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="6" class="py-4 text-center text-gray-500">Nenhum evento</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Renderizar gráfico do app
        if (snapshots.length > 0) {
            renderAppRevenueChart(snapshots);
        }
    } catch (err) {
        container.innerHTML = `<div class="card rounded-2xl p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-amber-400 mb-4"></i>
            <p class="text-gray-400">${err.message}</p>
        </div>`;
    }
}

// ========================================
// CHARTS
// ========================================

function renderRevenueChart(snapshots) {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    const labels = snapshots.map(s => {
        const d = new Date(s.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const revenues = snapshots.map(s => s.revenue / 100);
    const refunds = snapshots.map(s => s.refunds / 100);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Receita',
                    data: revenues,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Reembolsos',
                    data: refunds,
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#9ca3af' }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#9ca3af',
                        callback: v => 'R$ ' + v.toFixed(0)
                    }
                }
            }
        }
    });
}

function renderAppRevenueChart(snapshots) {
    const ctx = document.getElementById('app-revenue-chart');
    if (!ctx) return;

    const labels = snapshots.map(s => {
        const d = new Date(s.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const revenues = snapshots.map(s => s.revenue / 100);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Receita',
                data: revenues,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: '#10b981',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#9ca3af',
                        callback: v => 'R$ ' + v.toFixed(0)
                    }
                }
            }
        }
    });
}

// ========================================
// HELPERS
// ========================================

function getEventTypeColor(type) {
    if (type.includes('succeeded') || type.includes('paid')) return 'bg-emerald-500/20 text-emerald-400';
    if (type.includes('failed') || type.includes('canceled')) return 'bg-rose-500/20 text-rose-400';
    if (type.includes('refund')) return 'bg-amber-500/20 text-amber-400';
    if (type.includes('dispute')) return 'bg-purple-500/20 text-purple-400';
    if (type.includes('subscription')) return 'bg-blue-500/20 text-blue-400';
    return 'bg-gray-500/20 text-gray-400';
}

function formatEventType(type) {
    const names = {
        'payment.created': 'Criado',
        'payment.succeeded': 'Pago',
        'payment.failed': 'Falhou',
        'payment.canceled': 'Cancelado',
        'refund.created': 'Reembolso',
        'refund.succeeded': 'Reembolsado',
        'subscription.created': 'Sub Criada',
        'subscription.canceled': 'Sub Cancelada',
        'subscription.renewed': 'Renovação',
        'dispute.created': 'Disputa',
        'dispute.won': 'Disputa Ganha',
        'dispute.lost': 'Disputa Perdida'
    };
    return names[type] || type.split('.').pop();
}


// ========================================
// RECONCILIATION VIEW
// ========================================

async function renderReconciliation(container) {
    try {
        const [summary, recent, mismatched] = await Promise.all([
            api('/admin/financial/reconciliation-summary').catch(() => ({})),
            api('/admin/financial/reconciliations?limit=20').catch(() => ({ reconciliations: [] })),
            api('/admin/financial/reconciliations/mismatched?limit=10').catch(() => ({ reconciliations: [] }))
        ]);

        const reconciliations = recent.reconciliations || [];
        const mismatchedList = mismatched.reconciliations || [];

        container.innerHTML = `
            <!-- Summary Cards -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-primary">${summary.total_reconciliations || 0}</p>
                    <p class="text-gray-400 text-sm">Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center bg-emerald-500/10 border border-emerald-500/30">
                    <p class="text-3xl font-bold text-emerald-400">${summary.matched || 0}</p>
                    <p class="text-gray-400 text-sm">Matched</p>
                </div>
                <div class="card rounded-2xl p-4 text-center bg-amber-500/10 border border-amber-500/30">
                    <p class="text-3xl font-bold text-amber-400">${summary.mismatched || 0}</p>
                    <p class="text-gray-400 text-sm">Mismatched</p>
                </div>
                <div class="card rounded-2xl p-4 text-center bg-rose-500/10 border border-rose-500/30">
                    <p class="text-3xl font-bold text-rose-400">${summary.failed || 0}</p>
                    <p class="text-gray-400 text-sm">Failed</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${summary.total_discrepancies || 0}</p>
                    <p class="text-gray-400 text-sm">Discrepâncias</p>
                </div>
            </div>

            <!-- Actions -->
            <div class="card rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="font-bold">Executar Reconciliação Global</h3>
                        <p class="text-gray-400 text-sm">Verifica todos os apps com eventos no período</p>
                    </div>
                    <button onclick="runGlobalReconciliation()" class="bg-primary hover:bg-primary/80 px-6 py-3 rounded-xl">
                        <i class="fas fa-sync-alt mr-2"></i> Reconciliar Todos
                    </button>
                </div>
            </div>

            ${mismatchedList.length > 0 ? `
                <!-- Mismatched Alert -->
                <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2 text-amber-400">
                        <i class="fas fa-exclamation-triangle"></i>
                        Reconciliações com Divergências
                    </h3>
                    <div class="space-y-3">
                        ${mismatchedList.map(r => `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-black/20">
                                <div>
                                    <span class="font-mono text-sm">${r.app_id.substring(0, 8)}...</span>
                                    <span class="text-gray-500 text-sm ml-2">${formatDate(r.executed_at)}</span>
                                </div>
                                <div class="flex items-center gap-4">
                                    <span class="text-amber-400">${r.discrepancy_count} discrepâncias</span>
                                    <span class="text-rose-400">Diff: ${formatCurrency(r.revenue_diff)}</span>
                                    <button onclick="showReconciliationDetail('${r.id}')" class="text-primary hover:text-primary/80">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Recent Reconciliations -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-history text-primary"></i>
                    Reconciliações Recentes
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-2">Status</th>
                                <th class="pb-2">App</th>
                                <th class="pb-2">Período</th>
                                <th class="pb-2">Ledger</th>
                                <th class="pb-2">Provider</th>
                                <th class="pb-2">Diff</th>
                                <th class="pb-2">Discrepâncias</th>
                                <th class="pb-2">Executado</th>
                                <th class="pb-2">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reconciliations.map(r => `
                                <tr class="border-b border-gray-800 hover:bg-white/5">
                                    <td class="py-3">
                                        <span class="px-2 py-1 rounded text-xs ${getReconciliationStatusColor(r.status)}">${r.status}</span>
                                    </td>
                                    <td class="py-3 font-mono text-xs">${r.app_id.substring(0, 8)}...</td>
                                    <td class="py-3 text-xs text-gray-500">
                                        ${formatDateShort(r.period_start)} - ${formatDateShort(r.period_end)}
                                    </td>
                                    <td class="py-3 text-emerald-400">${formatCurrency(r.ledger_revenue)}</td>
                                    <td class="py-3 text-blue-400">${formatCurrency(r.provider_revenue)}</td>
                                    <td class="py-3 ${r.revenue_diff !== 0 ? 'text-rose-400' : 'text-gray-500'}">
                                        ${r.revenue_diff !== 0 ? formatCurrency(r.revenue_diff) : '-'}
                                    </td>
                                    <td class="py-3 ${r.discrepancy_count > 0 ? 'text-amber-400' : 'text-gray-500'}">
                                        ${r.discrepancy_count || 0}
                                    </td>
                                    <td class="py-3 text-gray-500">${formatDate(r.executed_at)}</td>
                                    <td class="py-3">
                                        <button onclick="showReconciliationDetail('${r.id}')" class="text-primary hover:text-primary/80">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="9" class="py-8 text-center text-gray-500">Nenhuma reconciliação executada</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="card rounded-2xl p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-amber-400 mb-4"></i>
            <p class="text-gray-400">${err.message}</p>
        </div>`;
    }
}

async function runGlobalReconciliation() {
    if (!confirm('Executar reconciliação para todos os apps dos últimos 30 dias?')) {
        return;
    }

    try {
        loader(true);
        const result = await api('/admin/financial/reconcile', {
            method: 'POST',
            body: JSON.stringify({})
        });

        toast(`Reconciliação concluída: ${result.matched} OK, ${result.mismatched} divergências`, 
            result.mismatched > 0 ? 'warning' : 'success');
        
        showSection('reconciliation');
    } catch (err) {
        toast(err.message || 'Erro na reconciliação', 'error');
    } finally {
        loader(false);
    }
}

async function showReconciliationDetail(id) {
    try {
        const data = await api(`/financial/reconciliations/${id}`);
        const result = data.result;
        const discrepancies = data.discrepancies || [];

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-auto';
        modal.id = 'reconciliation-modal';
        modal.innerHTML = `
            <div class="bg-gray-900 rounded-2xl p-8 max-w-3xl w-full mx-4 my-8 border border-gray-700 max-h-[90vh] overflow-auto">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold">Detalhes da Reconciliação</h2>
                    <button onclick="document.getElementById('reconciliation-modal').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>

                <!-- Status -->
                <div class="flex items-center gap-4 mb-6">
                    <span class="px-3 py-1 rounded-lg text-sm ${getReconciliationStatusColor(result.status)}">${result.status}</span>
                    <span class="text-gray-500">App: ${result.app_id}</span>
                </div>

                <!-- Comparação -->
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="card rounded-xl p-4 text-center">
                        <p class="text-gray-400 text-sm mb-2">Ledger</p>
                        <p class="text-2xl font-bold text-emerald-400">${formatCurrency(result.ledger_revenue)}</p>
                        <p class="text-xs text-gray-500">${result.ledger_count} eventos</p>
                    </div>
                    <div class="card rounded-xl p-4 text-center">
                        <p class="text-gray-400 text-sm mb-2">Provider</p>
                        <p class="text-2xl font-bold text-blue-400">${formatCurrency(result.provider_revenue)}</p>
                        <p class="text-xs text-gray-500">${result.provider_count} eventos</p>
                    </div>
                    <div class="card rounded-xl p-4 text-center ${result.revenue_diff !== 0 ? 'bg-rose-500/10 border border-rose-500/30' : ''}">
                        <p class="text-gray-400 text-sm mb-2">Diferença</p>
                        <p class="text-2xl font-bold ${result.revenue_diff !== 0 ? 'text-rose-400' : 'text-gray-500'}">${formatCurrency(result.revenue_diff)}</p>
                        <p class="text-xs text-gray-500">${result.count_diff} eventos</p>
                    </div>
                </div>

                <!-- Período -->
                <div class="card rounded-xl p-4 mb-6">
                    <div class="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <p class="text-gray-400">Período</p>
                            <p>${formatDate(result.period_start)} - ${formatDate(result.period_end)}</p>
                        </div>
                        <div>
                            <p class="text-gray-400">Executado por</p>
                            <p>${result.executed_by}</p>
                        </div>
                        <div>
                            <p class="text-gray-400">Duração</p>
                            <p>${result.duration_ms}ms</p>
                        </div>
                    </div>
                </div>

                <!-- Discrepâncias -->
                ${discrepancies.length > 0 ? `
                    <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <h3 class="font-bold mb-4 text-amber-400">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            ${discrepancies.length} Discrepâncias Encontradas
                        </h3>
                        <div class="space-y-2 max-h-60 overflow-auto">
                            ${discrepancies.map(d => `
                                <div class="p-3 bg-black/20 rounded-lg text-sm">
                                    <div class="flex items-center justify-between">
                                        <span class="font-mono">${d.external_id || '-'}</span>
                                        <span class="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400">${d.type}</span>
                                    </div>
                                    <p class="text-gray-400 mt-1">${d.details || d.event_type || ''}</p>
                                    ${d.ledger_value || d.provider_value ? `
                                        <p class="text-xs text-gray-500 mt-1">
                                            Ledger: ${formatCurrency(d.ledger_value || 0)} | Provider: ${formatCurrency(d.provider_value || 0)}
                                        </p>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                        <i class="fas fa-check-circle text-emerald-400 text-2xl mb-2"></i>
                        <p class="text-emerald-400">Nenhuma discrepância encontrada</p>
                    </div>
                `}
            </div>
        `;
        document.body.appendChild(modal);
    } catch (err) {
        toast(err.message || 'Erro ao carregar detalhes', 'error');
    }
}

function getReconciliationStatusColor(status) {
    const colors = {
        'matched': 'bg-emerald-500/20 text-emerald-400',
        'mismatched': 'bg-amber-500/20 text-amber-400',
        'failed': 'bg-rose-500/20 text-rose-400',
        'running': 'bg-blue-500/20 text-blue-400',
        'pending': 'bg-gray-500/20 text-gray-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}


// ========================================
// FINANCIAL ALERTS VIEW - Fase 27.2.3
// "Sistema sem alertas é sistema cego"
// ========================================

async function renderFinancialAlerts(container) {
    try {
        const [alerts, stats, thresholds, idempStats, rateLimitStats] = await Promise.all([
            api('/admin/financial/alerts?limit=50').catch(() => ({ alerts: [] })),
            api('/admin/financial/alerts/stats?window=24h').catch(() => ({ stats: {} })),
            api('/admin/financial/alerts/thresholds').catch(() => ({ thresholds: [] })),
            api('/admin/financial/idempotency/stats?window=24h').catch(() => ({ stats: {} })),
            api('/admin/financial/ratelimit/stats').catch(() => ({}))
        ]);

        const alertsList = alerts.alerts || [];
        const alertStats = stats.stats || {};
        const thresholdsList = thresholds.thresholds || [];
        const idempotencyStats = idempStats.stats || {};

        container.innerHTML = `
            <!-- Summary Cards -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-primary">${alertStats.total || 0}</p>
                    <p class="text-gray-400 text-sm">Total (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center bg-rose-500/10 border border-rose-500/30">
                    <p class="text-3xl font-bold text-rose-400">${alertStats.unresolved || 0}</p>
                    <p class="text-gray-400 text-sm">Não Resolvidos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${alertStats.by_severity?.warning || 0}</p>
                    <p class="text-gray-400 text-sm">Warnings</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${alertStats.by_severity?.critical || 0}</p>
                    <p class="text-gray-400 text-sm">Critical</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${idempotencyStats.processed || 0}</p>
                    <p class="text-gray-400 text-sm">Webhooks OK</p>
                </div>
            </div>

            <!-- Idempotency & Rate Limit Stats -->
            <div class="grid grid-cols-2 gap-6 mb-6">
                <!-- Idempotency -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-shield-alt text-emerald-400"></i>
                        Idempotência (24h)
                    </h3>
                    <div class="grid grid-cols-4 gap-4">
                        <div class="text-center p-3 bg-white/5 rounded-xl">
                            <p class="text-2xl font-bold">${idempotencyStats.total || 0}</p>
                            <p class="text-xs text-gray-500">Total</p>
                        </div>
                        <div class="text-center p-3 bg-emerald-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-emerald-400">${idempotencyStats.processed || 0}</p>
                            <p class="text-xs text-gray-500">Processados</p>
                        </div>
                        <div class="text-center p-3 bg-amber-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-amber-400">${idempotencyStats.processing || 0}</p>
                            <p class="text-xs text-gray-500">Em Processo</p>
                        </div>
                        <div class="text-center p-3 bg-rose-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-rose-400">${idempotencyStats.failed || 0}</p>
                            <p class="text-xs text-gray-500">Falhos</p>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 mt-4 text-center">
                        Taxa de duplicatas bloqueadas: ${idempStats.duplicate_rate?.toFixed(1) || 0}%
                    </p>
                </div>

                <!-- Rate Limit -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-tachometer-alt text-blue-400"></i>
                        Rate Limiting
                    </h3>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="text-center p-3 bg-white/5 rounded-xl">
                            <p class="text-2xl font-bold">${rateLimitStats.limit_per_minute || 60}</p>
                            <p class="text-xs text-gray-500">Limite/min</p>
                        </div>
                        <div class="text-center p-3 bg-blue-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-blue-400">${rateLimitStats.active_counters || 0}</p>
                            <p class="text-xs text-gray-500">Apps Ativos</p>
                        </div>
                        <div class="text-center p-3 bg-purple-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-purple-400">${rateLimitStats.total_apps || 0}</p>
                            <p class="text-xs text-gray-500">Total Apps</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Active Alerts -->
            <div class="card rounded-2xl p-6 mb-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-bell text-amber-400"></i>
                    Alertas Ativos
                </h3>
                ${alertsList.length > 0 ? `
                    <div class="space-y-3">
                        ${alertsList.filter(a => !a.is_resolved).map(alert => `
                            <div class="flex items-center justify-between p-4 rounded-xl ${getAlertBgColor(alert.severity)}">
                                <div class="flex items-center gap-4">
                                    <span class="text-2xl">${getAlertIcon(alert.type)}</span>
                                    <div>
                                        <p class="font-medium">${formatAlertType(alert.type)}</p>
                                        <p class="text-sm text-gray-400">${alert.message}</p>
                                        <p class="text-xs text-gray-500">${formatDate(alert.created_at)}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-4">
                                    <span class="px-3 py-1 rounded-lg text-sm ${getAlertSeverityColor(alert.severity)}">${alert.severity}</span>
                                    <button onclick="resolveAlert('${alert.id}')" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-xl text-sm">
                                        <i class="fas fa-check mr-1"></i> Resolver
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-check-circle text-4xl text-emerald-400 mb-4"></i>
                        <p>Nenhum alerta ativo</p>
                    </div>
                `}
            </div>

            <!-- Thresholds Configuration -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-sliders-h text-primary"></i>
                    Thresholds Configurados
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-2">Tipo</th>
                                <th class="pb-2">Threshold</th>
                                <th class="pb-2">Severidade</th>
                                <th class="pb-2">Descrição</th>
                                <th class="pb-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${thresholdsList.map(t => `
                                <tr class="border-b border-gray-800">
                                    <td class="py-3">${formatAlertType(t.type)}</td>
                                    <td class="py-3 font-mono">${t.threshold}${t.type.includes('rate') || t.type.includes('drop') ? '%' : ''}</td>
                                    <td class="py-3">
                                        <span class="px-2 py-1 rounded text-xs ${getAlertSeverityColor(t.severity)}">${t.severity}</span>
                                    </td>
                                    <td class="py-3 text-gray-400 text-xs">${t.description || '-'}</td>
                                    <td class="py-3">
                                        <span class="${t.is_enabled ? 'text-emerald-400' : 'text-gray-500'}">
                                            <i class="fas fa-${t.is_enabled ? 'check-circle' : 'times-circle'}"></i>
                                            ${t.is_enabled ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="card rounded-2xl p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-amber-400 mb-4"></i>
            <p class="text-gray-400">${err.message}</p>
        </div>`;
    }
}

async function resolveAlert(alertId) {
    if (!confirm('Marcar este alerta como resolvido?')) return;
    
    try {
        await api(`/admin/financial/alerts/${alertId}/resolve`, { method: 'POST' });
        toast('Alerta resolvido', 'success');
        showSection('alerts');
    } catch (err) {
        toast(err.message || 'Erro ao resolver alerta', 'error');
    }
}

// ========================================
// ALERT HELPERS
// ========================================

function getAlertBgColor(severity) {
    const colors = {
        'info': 'bg-blue-500/10 border border-blue-500/30',
        'warning': 'bg-amber-500/10 border border-amber-500/30',
        'critical': 'bg-rose-500/10 border border-rose-500/30'
    };
    return colors[severity] || 'bg-gray-500/10';
}

function getAlertSeverityColor(severity) {
    const colors = {
        'info': 'bg-blue-500/20 text-blue-400',
        'warning': 'bg-amber-500/20 text-amber-400',
        'critical': 'bg-rose-500/20 text-rose-400'
    };
    return colors[severity] || 'bg-gray-500/20 text-gray-400';
}

function getAlertIcon(type) {
    const icons = {
        'revenue_dropped': '📉',
        'webhook_failures': '⚠️',
        'reconciliation_diff': '🔄',
        'high_refund_rate': '💸',
        'payment_failures': '❌',
        'rate_limit_exceeded': '🚫',
        'dispute_created': '⚖️',
        'no_revenue_today': '📊',
        'anomaly_detected': '🔍'
    };
    return icons[type] || '🔔';
}

function formatAlertType(type) {
    const names = {
        'revenue_dropped': 'Queda de Receita',
        'webhook_failures': 'Falhas de Webhook',
        'reconciliation_diff': 'Divergência Reconciliação',
        'high_refund_rate': 'Taxa Alta de Reembolsos',
        'payment_failures': 'Falhas de Pagamento',
        'rate_limit_exceeded': 'Rate Limit Excedido',
        'dispute_created': 'Disputa Criada',
        'no_revenue_today': 'Sem Receita Hoje',
        'anomaly_detected': 'Anomalia Detectada'
    };
    return names[type] || type;
}
