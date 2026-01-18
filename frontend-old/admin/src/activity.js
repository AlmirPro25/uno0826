/**
 * PROST-QS Activity Monitor - Fase 29
 * "Saber o que aconteceu é tão importante quanto fazer acontecer"
 * 
 * Módulo para visualização de logs de segurança e atividades do sistema.
 */

async function renderActivitySection(container) {
    try {
        loader(true);
        // Carregar dados iniciais (Segurança por padrão no Admin)
        const data = await api('/activity/security');
        const stats = await api('/activity/stats').catch(() => ({}));

        container.innerHTML = `
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${data.count || 0}</p>
                    <p class="text-gray-400 text-sm">Alertas de Segurança</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-primary">${stats.total_activities || '-'}</p>
                    <p class="text-gray-400 text-sm">Atividades Totais</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${stats.failed_logins_last_30_days || '-'}</p>
                    <p class="text-gray-400 text-sm">Falhas de Login (30d)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${stats.activities_last_7_days || '-'}</p>
                    <p class="text-gray-400 text-sm">Atividades (7d)</p>
                </div>
            </div>

            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold flex items-center gap-2">
                    <i class="fas fa-shield-alt text-rose-400"></i>
                    Logs de Segurança Recentes
                </h3>
                <div class="flex gap-2">
                    <button onclick="refreshActivity('security')" class="bg-rose-500/20 text-rose-400 px-3 py-1 rounded-lg text-sm hover:bg-rose-500/30 transition-all">
                        <i class="fas fa-sync-alt mr-1"></i> Atualizar
                    </button>
                </div>
            </div>

            <div class="card rounded-2xl overflow-hidden">
                <table class="w-full">
                    <thead class="bg-white/5">
                        <tr>
                            <th class="text-left p-4 text-sm text-gray-400">Data/Hora</th>
                            <th class="text-left p-4 text-sm text-gray-400">Tipo</th>
                            <th class="text-left p-4 text-sm text-gray-400">Descrição</th>
                            <th class="text-center p-4 text-sm text-gray-400">IP</th>
                            <th class="text-center p-4 text-sm text-gray-400">Status</th>
                        </tr>
                    </thead>
                    <tbody id="activity-table-body">
                        ${renderActivityRows(data.activities)}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Atividades', err.message);
    } finally {
        loader(false);
    }
}

function renderActivityRows(activities) {
    if (!activities?.length) {
        return '<tr><td colspan="5" class="p-8 text-center text-gray-500">Nenhuma atividade registrada</td></tr>';
    }

    return activities.map(a => `
        <tr class="table-row border-t border-dark-border">
            <td class="p-4 text-sm text-gray-300">${formatDate(a.created_at)}</td>
            <td class="p-4">
                <span class="px-2 py-1 rounded-lg text-xs font-mono bg-white/5 text-primary">
                    ${a.type}
                </span>
            </td>
            <td class="p-4 text-sm">
                <div class="font-medium">${a.description}</div>
                ${a.metadata ? `<div class="text-xs text-gray-500 mt-1 font-mono">${truncateText(a.metadata, 100)}</div>` : ''}
            </td>
            <td class="p-4 text-center text-xs text-gray-400 font-mono">${a.ip_address || '-'}</td>
            <td class="p-4 text-center">
                <span class="px-2 py-1 rounded-full text-xs ${a.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                    ${a.success ? 'Success' : 'Failed'}
                </span>
            </td>
        </tr>
    `).join('');
}

async function refreshActivity(type) {
    const body = document.getElementById('activity-table-body');
    if (!body) return;

    try {
        toast('Atualizando logs...', 'info');
        const data = await api(type === 'security' ? '/activity/security' : '/activity');
        body.innerHTML = renderActivityRows(data.activities);
    } catch (err) {
        toast('Erro ao atualizar: ' + err.message, 'error');
    }
}
