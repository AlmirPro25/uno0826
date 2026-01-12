/**
 * PROST-QS Secrets Module - Admin Dashboard
 * "Segredos pertencem à plataforma, não ao app"
 * 
 * Endpoints:
 * - GET  /api/v1/secrets           → Lista secrets (sem valores)
 * - POST /api/v1/secrets           → Criar secret
 * - PUT  /api/v1/secrets/:id       → Atualizar secret
 * - DELETE /api/v1/secrets/:id     → Deletar secret
 * - GET  /api/v1/secrets/audit     → Audit log de secrets
 */

// ========================================
// SECRETS DASHBOARD
// ========================================

async function renderSecretsSection(container) {
    try {
        const [secrets, audit] = await Promise.all([
            api('/secrets').catch(() => ({ secrets: [] })),
            api('/secrets/audit?limit=10').catch(() => ({ logs: [] }))
        ]);

        const secretsList = secrets.secrets || secrets || [];
        const auditList = audit.logs || audit || [];

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-key text-amber-400"></i>
                        Secrets Manager
                    </h2>
                    <p class="text-gray-400">Segredos pertencem à plataforma, não ao app</p>
                </div>
                <button onclick="showCreateSecretModal()" class="bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl">
                    <i class="fas fa-plus mr-2"></i> Novo Secret
                </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${secretsList.length}</p>
                    <p class="text-gray-400 text-sm">Total Secrets</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${secretsList.filter(s => s.status === 'active').length}</p>
                    <p class="text-gray-400 text-sm">Ativos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${secretsList.filter(s => s.expires_at && new Date(s.expires_at) < new Date()).length}</p>
                    <p class="text-gray-400 text-sm">Expirados</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${auditList.length}</p>
                    <p class="text-gray-400 text-sm">Acessos (24h)</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-6">
                <!-- Secrets List -->
                <div class="col-span-2 card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-lock text-primary"></i>
                        Secrets Registrados
                    </h3>
                    ${renderSecretsTable(secretsList)}
                </div>

                <!-- Audit Log -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-history text-purple-400"></i>
                        Audit Log
                    </h3>
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        ${auditList.length > 0 ? auditList.map(log => `
                            <div class="p-3 bg-white/5 rounded-xl">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm font-medium">${log.action || 'access'}</span>
                                    <span class="text-xs text-gray-500">${formatDate(log.created_at)}</span>
                                </div>
                                <p class="text-xs text-gray-400 mt-1">${log.secret_name || log.secret_id}</p>
                                <p class="text-xs text-gray-500">${log.actor || 'system'}</p>
                            </div>
                        `).join('') : `
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-history text-4xl mb-4"></i>
                                <p>Nenhum acesso registrado</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Secrets', err.message);
    }
}


function renderSecretsTable(secrets) {
    if (!secrets.length) {
        return `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-key text-4xl mb-4"></i>
                <p>Nenhum secret registrado</p>
                <button onclick="showCreateSecretModal()" class="mt-4 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl">
                    <i class="fas fa-plus mr-2"></i> Criar Primeiro Secret
                </button>
            </div>
        `;
    }

    return `
        <div class="space-y-2">
            ${secrets.map(s => `
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                            <i class="fas fa-key text-amber-400"></i>
                        </div>
                        <div>
                            <p class="font-medium">${s.name || 'Unnamed'}</p>
                            <p class="text-xs text-gray-500">${s.type || 'generic'} • ${s.scope || 'global'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="px-2 py-1 rounded-full text-xs ${s.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">
                            ${s.status || 'active'}
                        </span>
                        ${s.expires_at ? `<span class="text-xs text-gray-500">Expira: ${formatDateShort(s.expires_at)}</span>` : ''}
                        <div class="flex gap-1">
                            <button onclick="rotateSecret('${s.id}')" class="p-2 rounded-lg hover:bg-white/10 text-amber-400" title="Rotacionar">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                            <button onclick="deleteSecret('${s.id}')" class="p-2 rounded-lg hover:bg-white/10 text-rose-400" title="Deletar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showCreateSecretModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.id = 'secrets-modal';
    modal.innerHTML = `
        <div class="bg-dark-card rounded-2xl p-6 max-w-md w-full mx-4 border border-dark-border">
            <h3 class="text-xl font-bold mb-4">Novo Secret</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Nome</label>
                    <input type="text" id="secret-name" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="API_KEY_STRIPE">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Valor</label>
                    <input type="password" id="secret-value" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="sk_live_...">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Tipo</label>
                    <select id="secret-type" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2">
                        <option value="api_key">API Key</option>
                        <option value="oauth_token">OAuth Token</option>
                        <option value="database">Database Credential</option>
                        <option value="encryption_key">Encryption Key</option>
                        <option value="generic">Generic</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Escopo</label>
                    <select id="secret-scope" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2">
                        <option value="global">Global</option>
                        <option value="app">Por Aplicação</option>
                        <option value="environment">Por Ambiente</option>
                    </select>
                </div>
            </div>
            <div class="flex gap-2 mt-6">
                <button onclick="document.getElementById('secrets-modal').remove()" class="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">Cancelar</button>
                <button onclick="createSecret()" class="flex-1 bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-xl">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function createSecret() {
    const name = document.getElementById('secret-name')?.value;
    const value = document.getElementById('secret-value')?.value;
    const type = document.getElementById('secret-type')?.value;
    const scope = document.getElementById('secret-scope')?.value;

    if (!name || !value) {
        toast('Nome e valor são obrigatórios', 'error');
        return;
    }

    try {
        await api('/secrets', {
            method: 'POST',
            body: JSON.stringify({ name, value, type, scope })
        });
        document.getElementById('secrets-modal')?.remove();
        toast('Secret criado com sucesso', 'success');
        showSection('secrets');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function rotateSecret(secretId) {
    if (!confirm('Rotacionar este secret? O valor antigo será invalidado.')) return;
    
    try {
        await api(`/secrets/${secretId}/rotate`, { method: 'POST' });
        toast('Secret rotacionado com sucesso', 'success');
        showSection('secrets');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

async function deleteSecret(secretId) {
    if (!confirm('Deletar este secret? Esta ação não pode ser desfeita.')) return;
    
    try {
        await api(`/secrets/${secretId}`, { method: 'DELETE' });
        toast('Secret deletado', 'success');
        showSection('secrets');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
