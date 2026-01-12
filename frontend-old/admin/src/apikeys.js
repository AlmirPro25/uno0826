/**
 * PROST-QS API Keys Module - Admin Dashboard
 * "Chaves de acesso programático"
 * 
 * Endpoints:
 * - GET  /api/v1/apikeys              → Lista API keys
 * - POST /api/v1/apikeys              → Criar API key
 * - GET  /api/v1/apikeys/:id          → Detalhes
 * - DELETE /api/v1/apikeys/:id        → Revogar
 * - POST /api/v1/apikeys/:id/rotate   → Rotacionar
 * - GET  /api/v1/apikeys/stats        → Estatísticas
 */

// ========================================
// API KEYS DASHBOARD
// ========================================

async function renderApiKeysSection(container) {
    try {
        const [keys, stats] = await Promise.all([
            api('/apikeys').catch(() => ({ keys: [] })),
            api('/apikeys/stats').catch(() => ({}))
        ]);

        const keysList = keys.keys || keys || [];

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-key text-amber-400"></i>
                        API Keys
                    </h2>
                    <p class="text-gray-400">Chaves de acesso programático</p>
                </div>
                <button onclick="showCreateApiKeyModal()" class="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl transition-all">
                    <i class="fas fa-plus mr-2"></i> Nova API Key
                </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${keysList.length}</p>
                    <p class="text-gray-400 text-sm">Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${keysList.filter(k => k.active).length}</p>
                    <p class="text-gray-400 text-sm">Ativas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${stats.total_requests || 0}</p>
                    <p class="text-gray-400 text-sm">Requests (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${keysList.filter(k => !k.active).length}</p>
                    <p class="text-gray-400 text-sm">Revogadas</p>
                </div>
            </div>

            <!-- API Keys List -->
            <div id="apikeys-list">
                ${renderApiKeysTable(keysList)}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar API Keys', err.message);
    }
}

function renderApiKeysTable(keys) {
    if (!keys.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-key text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhuma API key</p>
                <button onclick="showCreateApiKeyModal()" class="mt-4 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl">
                    <i class="fas fa-plus mr-2"></i> Criar Primeira Key
                </button>
            </div>
        `;
    }

    return `
        <div class="card rounded-2xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-4 text-sm text-gray-400">Nome</th>
                        <th class="text-left p-4 text-sm text-gray-400">Key</th>
                        <th class="text-center p-4 text-sm text-gray-400">Scopes</th>
                        <th class="text-center p-4 text-sm text-gray-400">Status</th>
                        <th class="text-center p-4 text-sm text-gray-400">Último Uso</th>
                        <th class="text-center p-4 text-sm text-gray-400">Requests</th>
                        <th class="text-center p-4 text-sm text-gray-400">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${keys.map(k => `
                        <tr class="border-t border-dark-border hover:bg-white/5">
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 ${k.active ? 'bg-amber-500/20' : 'bg-gray-500/20'} rounded-xl flex items-center justify-center">
                                        <i class="fas fa-key ${k.active ? 'text-amber-400' : 'text-gray-400'}"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium">${k.name || 'Sem nome'}</p>
                                        <p class="text-xs text-gray-500">App: ${k.app_id?.substring(0, 8) || '-'}...</p>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4">
                                <div class="flex items-center gap-2">
                                    <code class="text-sm text-gray-400">${k.key_prefix || 'pk_'}...${k.key_suffix || '****'}</code>
                                    <button onclick="copyToClipboard('${k.key_prefix}...${k.key_suffix}')" class="text-gray-500 hover:text-white">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </td>
                            <td class="p-4 text-center">
                                <div class="flex flex-wrap gap-1 justify-center">
                                    ${(k.scopes || ['*']).slice(0, 3).map(s => `
                                        <span class="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">${s}</span>
                                    `).join('')}
                                    ${(k.scopes || []).length > 3 ? `<span class="text-xs text-gray-500">+${k.scopes.length - 3}</span>` : ''}
                                </div>
                            </td>
                            <td class="p-4 text-center">
                                <span class="px-2 py-1 rounded-full text-xs ${k.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                                    ${k.active ? 'Ativa' : 'Revogada'}
                                </span>
                            </td>
                            <td class="p-4 text-center text-sm text-gray-500">
                                ${k.last_used_at ? formatTimeAgo(k.last_used_at) : 'Nunca'}
                            </td>
                            <td class="p-4 text-center text-blue-400">
                                ${k.request_count || 0}
                            </td>
                            <td class="p-4 text-center">
                                ${k.active ? `
                                    <button onclick="rotateApiKey('${k.id}')" class="p-2 rounded-lg hover:bg-white/10 text-blue-400" title="Rotacionar">
                                        <i class="fas fa-sync-alt"></i>
                                    </button>
                                    <button onclick="revokeApiKey('${k.id}')" class="p-2 rounded-lg hover:bg-white/10 text-rose-400" title="Revogar">
                                        <i class="fas fa-ban"></i>
                                    </button>
                                ` : `
                                    <span class="text-gray-500 text-sm">Revogada</span>
                                `}
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

function showCreateApiKeyModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.id = 'apikey-modal';
    modal.innerHTML = `
        <div class="bg-dark-card rounded-2xl p-6 max-w-lg w-full mx-4 border border-dark-border">
            <h3 class="text-xl font-bold mb-4">Nova API Key</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Nome</label>
                    <input type="text" id="apikey-name" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="Ex: Backend Production">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">App ID (opcional)</label>
                    <input type="text" id="apikey-app" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="UUID do app">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Scopes (separados por vírgula)</label>
                    <input type="text" id="apikey-scopes" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="read, write, admin">
                    <p class="text-xs text-gray-500 mt-1">Deixe vazio para acesso total (*)</p>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Expira em (dias, opcional)</label>
                    <input type="number" id="apikey-expires" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="365">
                </div>
            </div>
            <div class="flex gap-2 mt-6">
                <button onclick="document.getElementById('apikey-modal').remove()" class="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">Cancelar</button>
                <button onclick="createApiKey()" class="flex-1 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function createApiKey() {
    const name = document.getElementById('apikey-name')?.value;
    const appId = document.getElementById('apikey-app')?.value;
    const scopesStr = document.getElementById('apikey-scopes')?.value;
    const expiresDays = parseInt(document.getElementById('apikey-expires')?.value || '0');

    if (!name) {
        toast('Nome é obrigatório', 'error');
        return;
    }

    const scopes = scopesStr ? scopesStr.split(',').map(s => s.trim()).filter(s => s) : ['*'];

    try {
        const result = await api('/apikeys', {
            method: 'POST',
            body: JSON.stringify({ 
                name, 
                app_id: appId || undefined,
                scopes,
                expires_in_days: expiresDays || undefined
            })
        });

        document.getElementById('apikey-modal')?.remove();

        // Show the key (only shown once!)
        if (result.key) {
            showNewKeyModal(result.key);
        } else {
            toast('API Key criada com sucesso', 'success');
            showSection('apikeys');
        }
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

function showNewKeyModal(key) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.id = 'newkey-modal';
    modal.innerHTML = `
        <div class="bg-dark-card rounded-2xl p-6 max-w-lg w-full mx-4 border border-amber-500">
            <div class="text-center mb-4">
                <i class="fas fa-exclamation-triangle text-4xl text-amber-400 mb-2"></i>
                <h3 class="text-xl font-bold">Guarde sua API Key!</h3>
                <p class="text-gray-400 text-sm">Esta é a única vez que você verá a key completa.</p>
            </div>
            <div class="bg-dark rounded-xl p-4 mb-4">
                <code class="text-sm text-amber-400 break-all">${key}</code>
            </div>
            <div class="flex gap-2">
                <button onclick="copyToClipboard('${key}'); toast('Copiado!', 'success')" class="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">
                    <i class="fas fa-copy mr-2"></i> Copiar
                </button>
                <button onclick="document.getElementById('newkey-modal').remove(); showSection('apikeys')" class="flex-1 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl">
                    Entendi
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function rotateApiKey(keyId) {
    if (!confirm('Rotacionar esta key? A key antiga será invalidada imediatamente.')) return;

    try {
        const result = await api(`/apikeys/${keyId}/rotate`, { method: 'POST' });
        if (result.key) {
            showNewKeyModal(result.key);
        } else {
            toast('Key rotacionada', 'success');
            showSection('apikeys');
        }
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function revokeApiKey(keyId) {
    if (!confirm('Revogar esta API key? Esta ação não pode ser desfeita.')) return;

    try {
        await api(`/apikeys/${keyId}`, { method: 'DELETE' });
        toast('API Key revogada', 'success');
        showSection('apikeys');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
        // Fallback
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    });
}
