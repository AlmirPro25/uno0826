/**
 * PROST-QS Webhooks Module - Admin Dashboard
 * "Eventos que saem do sistema"
 * 
 * Endpoints:
 * - GET  /api/v1/webhooks              → Lista webhooks
 * - POST /api/v1/webhooks              → Criar webhook
 * - GET  /api/v1/webhooks/:id          → Detalhes
 * - PUT  /api/v1/webhooks/:id          → Atualizar
 * - DELETE /api/v1/webhooks/:id        → Deletar
 * - POST /api/v1/webhooks/:id/test     → Testar webhook
 * - GET  /api/v1/webhooks/:id/logs     → Logs de entrega
 * - GET  /api/v1/webhooks/stats        → Estatísticas
 */

// ========================================
// WEBHOOKS DASHBOARD
// ========================================

async function renderWebhooksSection(container) {
    try {
        const [webhooks, stats] = await Promise.all([
            api('/webhooks').catch(() => ({ endpoints: [] })),
            api('/webhooks/stats').catch(() => ({}))
        ]);

        const webhooksList = webhooks.endpoints || webhooks || [];

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-broadcast-tower text-cyan-400"></i>
                        Webhooks
                    </h2>
                    <p class="text-gray-400">Eventos que saem do sistema</p>
                </div>
                <button onclick="showCreateWebhookModal()" class="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-xl transition-all">
                    <i class="fas fa-plus mr-2"></i> Novo Webhook
                </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-cyan-400">${webhooksList.length}</p>
                    <p class="text-gray-400 text-sm">Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${webhooksList.filter(w => w.active).length}</p>
                    <p class="text-gray-400 text-sm">Ativos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${stats.total_deliveries || 0}</p>
                    <p class="text-gray-400 text-sm">Entregas (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${stats.success_rate || 0}%</p>
                    <p class="text-gray-400 text-sm">Taxa Sucesso</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${stats.failed_deliveries || 0}</p>
                    <p class="text-gray-400 text-sm">Falhas (24h)</p>
                </div>
            </div>

            <!-- Webhooks List -->
            <div id="webhooks-list">
                ${renderWebhooksTable(webhooksList)}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Webhooks', err.message);
    }
}

function renderWebhooksTable(webhooks) {
    if (!webhooks.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-broadcast-tower text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhum webhook configurado</p>
                <button onclick="showCreateWebhookModal()" class="mt-4 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-xl">
                    <i class="fas fa-plus mr-2"></i> Criar Primeiro Webhook
                </button>
            </div>
        `;
    }

    return `
        <div class="card rounded-2xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-4 text-sm text-gray-400">Webhook</th>
                        <th class="text-left p-4 text-sm text-gray-400">URL</th>
                        <th class="text-center p-4 text-sm text-gray-400">Eventos</th>
                        <th class="text-center p-4 text-sm text-gray-400">Status</th>
                        <th class="text-center p-4 text-sm text-gray-400">Última Entrega</th>
                        <th class="text-center p-4 text-sm text-gray-400">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${webhooks.map(w => `
                        <tr class="border-t border-dark-border hover:bg-white/5">
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 ${w.active ? 'bg-cyan-500/20' : 'bg-gray-500/20'} rounded-xl flex items-center justify-center">
                                        <i class="fas fa-broadcast-tower ${w.active ? 'text-cyan-400' : 'text-gray-400'}"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium">${w.name || 'Sem nome'}</p>
                                        <p class="text-xs text-gray-500 font-mono">${w.id?.substring(0, 8)}...</p>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4">
                                <p class="text-sm font-mono text-gray-400 truncate max-w-xs">${w.url || '-'}</p>
                            </td>
                            <td class="p-4 text-center">
                                <div class="flex flex-wrap gap-1 justify-center">
                                    ${(w.events || []).slice(0, 3).map(e => `
                                        <span class="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">${e}</span>
                                    `).join('')}
                                    ${(w.events || []).length > 3 ? `<span class="text-xs text-gray-500">+${w.events.length - 3}</span>` : ''}
                                </div>
                            </td>
                            <td class="p-4 text-center">
                                <span class="px-2 py-1 rounded-full text-xs ${w.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">
                                    ${w.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </td>
                            <td class="p-4 text-center text-sm text-gray-500">
                                ${w.last_delivery_at ? formatTimeAgo(w.last_delivery_at) : 'Nunca'}
                            </td>
                            <td class="p-4 text-center">
                                <button onclick="testWebhook('${w.id}')" class="p-2 rounded-lg hover:bg-white/10 text-blue-400" title="Testar">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                                <button onclick="viewWebhookLogs('${w.id}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400" title="Logs">
                                    <i class="fas fa-list"></i>
                                </button>
                                <button onclick="toggleWebhook('${w.id}', ${!w.active})" class="p-2 rounded-lg hover:bg-white/10 ${w.active ? 'text-amber-400' : 'text-emerald-400'}" title="${w.active ? 'Desativar' : 'Ativar'}">
                                    <i class="fas fa-${w.active ? 'pause' : 'play'}"></i>
                                </button>
                                <button onclick="deleteWebhook('${w.id}')" class="p-2 rounded-lg hover:bg-white/10 text-rose-400" title="Deletar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ========================================
// ACTIONS
// ========================================

function showCreateWebhookModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.id = 'webhook-modal';
    modal.innerHTML = `
        <div class="bg-dark-card rounded-2xl p-6 max-w-lg w-full mx-4 border border-dark-border">
            <h3 class="text-xl font-bold mb-4">Novo Webhook</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Nome</label>
                    <input type="text" id="webhook-name" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="Ex: Notificações Slack">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">URL</label>
                    <input type="url" id="webhook-url" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="https://...">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Eventos (separados por vírgula)</label>
                    <input type="text" id="webhook-events" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="user.created, payment.succeeded">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Secret (opcional)</label>
                    <input type="text" id="webhook-secret" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="whsec_...">
                </div>
            </div>
            <div class="flex gap-2 mt-6">
                <button onclick="document.getElementById('webhook-modal').remove()" class="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">Cancelar</button>
                <button onclick="createWebhook()" class="flex-1 bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded-xl">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function createWebhook() {
    const name = document.getElementById('webhook-name')?.value;
    const url = document.getElementById('webhook-url')?.value;
    const eventsStr = document.getElementById('webhook-events')?.value;
    const secret = document.getElementById('webhook-secret')?.value;

    if (!name || !url) {
        toast('Nome e URL são obrigatórios', 'error');
        return;
    }

    const events = eventsStr ? eventsStr.split(',').map(e => e.trim()).filter(e => e) : ['*'];

    try {
        await api('/webhooks', {
            method: 'POST',
            body: JSON.stringify({ name, url, events, secret })
        });
        document.getElementById('webhook-modal')?.remove();
        toast('Webhook criado com sucesso', 'success');
        showSection('webhooks');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function testWebhook(webhookId) {
    try {
        await api(`/webhooks/${webhookId}/test`, { method: 'POST' });
        toast('Teste enviado!', 'success');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function viewWebhookLogs(webhookId) {
    try {
        const logs = await api(`/webhooks/${webhookId}/logs?limit=20`);
        const logsList = logs.logs || logs || [];

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-auto';
        modal.id = 'webhook-logs-modal';
        modal.innerHTML = `
            <div class="bg-dark-card rounded-2xl p-6 max-w-3xl w-full mx-4 my-8 border border-dark-border max-h-[90vh] overflow-auto">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold">Logs de Entrega</h3>
                    <button onclick="document.getElementById('webhook-logs-modal').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="space-y-2">
                    ${logsList.length > 0 ? logsList.map(log => `
                        <div class="p-3 rounded-xl ${log.success ? 'bg-emerald-500/10' : 'bg-rose-500/10'}">
                            <div class="flex items-center justify-between mb-1">
                                <span class="text-sm ${log.success ? 'text-emerald-400' : 'text-rose-400'}">
                                    <i class="fas fa-${log.success ? 'check' : 'times'} mr-2"></i>
                                    ${log.status_code || 'N/A'}
                                </span>
                                <span class="text-xs text-gray-500">${formatDate(log.created_at)}</span>
                            </div>
                            <p class="text-xs text-gray-400 font-mono truncate">${log.response || '-'}</p>
                        </div>
                    `).join('') : '<p class="text-gray-500 text-center py-4">Nenhum log encontrado</p>'}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function toggleWebhook(webhookId, active) {
    try {
        await api(`/webhooks/${webhookId}`, {
            method: 'PUT',
            body: JSON.stringify({ active })
        });
        toast(active ? 'Webhook ativado' : 'Webhook desativado', 'success');
        showSection('webhooks');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function deleteWebhook(webhookId) {
    if (!confirm('Tem certeza que deseja deletar este webhook?')) return;

    try {
        await api(`/webhooks/${webhookId}`, { method: 'DELETE' });
        toast('Webhook deletado', 'success');
        showSection('webhooks');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
