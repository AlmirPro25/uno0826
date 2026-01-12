/**
 * PROST-QS Events Module - Admin Dashboard
 * "Eventos que entram no sistema"
 * 
 * Endpoints:
 * - GET  /api/v1/events              → Lista eventos
 * - GET  /api/v1/events/stats        → Estatísticas
 * - GET  /api/v1/events/types        → Tipos de eventos
 * - GET  /api/v1/events/integrations → Integrações
 */

// ========================================
// EVENTS DASHBOARD
// ========================================

async function renderEventsSection(container) {
    try {
        const [events, stats, types] = await Promise.all([
            api('/events?limit=50').catch(() => ({ events: [] })),
            api('/events/stats').catch(() => ({})),
            api('/events/types').catch(() => ({ types: [] }))
        ]);

        const eventsList = events.events || events || [];
        const typesList = types.types || types || [];

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-bolt text-amber-400"></i>
                        Event System
                    </h2>
                    <p class="text-gray-400">Eventos que entram no sistema</p>
                </div>
                <button onclick="refreshEvents()" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
                    <i class="fas fa-sync-alt mr-2"></i> Atualizar
                </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${stats.total_events || 0}</p>
                    <p class="text-gray-400 text-sm">Total (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${stats.events_per_minute || 0}</p>
                    <p class="text-gray-400 text-sm">Por Minuto</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${typesList.length}</p>
                    <p class="text-gray-400 text-sm">Tipos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${stats.processed || 0}</p>
                    <p class="text-gray-400 text-sm">Processados</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${stats.failed || 0}</p>
                    <p class="text-gray-400 text-sm">Falhas</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-6 mb-6">
                <!-- Event Types -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-tags text-purple-400"></i>
                        Tipos de Eventos
                    </h3>
                    <div class="space-y-2 max-h-64 overflow-auto">
                        ${typesList.length > 0 ? typesList.map(t => `
                            <div class="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <span class="text-sm font-mono">${t.type || t}</span>
                                <span class="text-xs text-gray-500">${t.count || 0}</span>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-center py-4">Nenhum tipo</p>'}
                    </div>
                </div>

                <!-- Top Sources -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-cube text-blue-400"></i>
                        Top Apps
                    </h3>
                    <div class="space-y-2 max-h-64 overflow-auto">
                        ${(stats.top_apps || []).length > 0 ? stats.top_apps.map(app => `
                            <div class="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <span class="text-sm font-mono">${app.app_id?.substring(0, 8)}...</span>
                                <span class="text-xs text-amber-400">${app.count || 0}</span>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-center py-4">Nenhum app</p>'}
                    </div>
                </div>

                <!-- Hourly Distribution -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-chart-bar text-emerald-400"></i>
                        Distribuição (24h)
                    </h3>
                    <div class="h-48 flex items-end gap-1">
                        ${(stats.hourly || Array(24).fill(0)).map((count, i) => {
                            const max = Math.max(...(stats.hourly || [1]));
                            const height = max > 0 ? (count / max) * 100 : 0;
                            return `
                                <div class="flex-1 bg-emerald-500/30 rounded-t" style="height: ${height}%" title="${i}h: ${count}"></div>
                            `;
                        }).join('')}
                    </div>
                    <div class="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0h</span>
                        <span>12h</span>
                        <span>23h</span>
                    </div>
                </div>
            </div>

            <!-- Recent Events -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-history text-amber-400"></i>
                    Eventos Recentes
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-2">Tipo</th>
                                <th class="pb-2">App</th>
                                <th class="pb-2">User</th>
                                <th class="pb-2">Data</th>
                                <th class="pb-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${eventsList.length > 0 ? eventsList.slice(0, 20).map(e => `
                                <tr class="border-b border-gray-800 hover:bg-white/5">
                                    <td class="py-2">
                                        <span class="px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-400">${e.type || 'unknown'}</span>
                                    </td>
                                    <td class="py-2 font-mono text-xs">${e.app_id?.substring(0, 8) || '-'}...</td>
                                    <td class="py-2 font-mono text-xs">${e.user_id?.substring(0, 8) || '-'}...</td>
                                    <td class="py-2 text-gray-500">${formatDate(e.created_at)}</td>
                                    <td class="py-2">
                                        <span class="px-2 py-1 rounded text-xs ${e.processed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">
                                            ${e.processed ? 'OK' : 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('') : '<tr><td colspan="5" class="py-8 text-center text-gray-500">Nenhum evento</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Events', err.message);
    }
}

function refreshEvents() {
    showSection('events');
}
