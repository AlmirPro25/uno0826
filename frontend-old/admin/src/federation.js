/**
 * PROST-QS Federation Module - Admin Dashboard
 * "Identidade sem fronteiras, soberania centralizada"
 * 
 * Endpoints:
 * - GET  /api/v1/federation/providers      → Lista providers linkados
 * - POST /api/v1/federation/oauth/start    → Inicia fluxo OAuth
 * - DELETE /api/v1/federation/providers/:p → Remove provider
 */

async function renderFederationSection(container) {
    try {
        const providers = await api('/federation/providers').catch(() => []);

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-network-wired text-blue-400"></i>
                        Federation Overview
                    </h2>
                    <p class="text-gray-400">Gerenciamento de identidades federadas e conexões externas</p>
                </div>
                <button onclick="startFederationOAuth('google')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
                    <i class="fab fa-google mr-2"></i> Conectar Google
                </button>
            </div>

            <!-- Provider Status -->
            <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="card rounded-2xl p-6 border-l-4 border-blue-500">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fab fa-google text-2xl text-blue-400"></i>
                        <h3 class="font-bold">Google Identity</h3>
                    </div>
                    <p class="text-sm text-gray-400 mb-4">Integração com Google Workspace para SSO empresarial.</p>
                    ${renderProviderStatus(providers, 'google')}
                </div>

                <div class="card rounded-2xl p-6 opacity-50 border-l-4 border-gray-500">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fab fa-github text-2xl text-white"></i>
                        <h3 class="font-bold">GitHub (Fase 31)</h3>
                    </div>
                    <p class="text-sm text-gray-400">Integração para desenvolvedores e acesso via repo.</p>
                    <span class="text-xs bg-gray-700 px-2 py-1 rounded">EM BREVE</span>
                </div>

                <div class="card rounded-2xl p-6 opacity-50 border-l-4 border-gray-500">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fab fa-microsoft text-2xl text-blue-500"></i>
                        <h3 class="font-bold">Azure AD (Fase 32)</h3>
                    </div>
                    <p class="text-sm text-gray-400">Fédere sua infraestrutura Microsoft no Kernel.</p>
                    <span class="text-xs bg-gray-700 px-2 py-1 rounded">ROTEIRO</span>
                </div>
            </div>

            <!-- Linked Accounts -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-6 flex items-center gap-2">
                    <i class="fas fa-link text-primary"></i>
                    Contas Vinculadas
                </h3>
                
                ${providers.length > 0 ? `
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="text-left text-gray-400 border-b border-gray-700">
                                    <th class="pb-3 px-2">Provider</th>
                                    <th class="pb-3 px-2">Usuário Externo</th>
                                    <th class="pb-3 px-2">E-mail</th>
                                    <th class="pb-3 px-2">Vinculado em</th>
                                    <th class="pb-3 px-2 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${providers.map(p => `
                                    <tr class="border-b border-gray-800 hover:bg-white/5 transition-colors">
                                        <td class="py-4 px-2">
                                            <div class="flex items-center gap-2">
                                                <i class="fab fa-${p.provider} ${p.provider === 'google' ? 'text-blue-400' : ''}"></i>
                                                <span class="capitalize font-medium">${p.provider}</span>
                                            </div>
                                        </td>
                                        <td class="py-4 px-2">
                                            <div class="flex items-center gap-2">
                                                <img src="${p.picture || 'https://www.gravatar.com/avatar/000?d=mp'}" class="w-6 h-6 rounded-full border border-gray-700">
                                                <span>${p.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td class="py-4 px-2 text-gray-300 font-mono text-xs">${p.email}</td>
                                        <td class="py-4 px-2 text-gray-500">${new Date(p.linked_at).toLocaleDateString()}</td>
                                        <td class="py-4 px-2 text-right">
                                            <button onclick="unlinkFederationProvider('${p.provider}')" class="text-rose-400 hover:bg-rose-500/10 px-3 py-1 rounded-lg transition-colors">
                                                <i class="fas fa-unlink mr-1"></i> Desvincular
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-network-wired text-4xl mb-4 opacity-20"></i>
                        <p>Nenhuma conta federada ativa no momento.</p>
                        <p class="text-xs">Conecte um provider para centralizar o acesso.</p>
                    </div>
                `}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Federation', err.message);
    }
}

function renderProviderStatus(providers, type) {
    const linked = providers.find(p => p.provider === type);
    if (linked) {
        return `
            <div class="flex items-center justify-between">
                <span class="text-emerald-400 text-xs font-bold flex items-center gap-1">
                    <i class="fas fa-check-circle"></i> CONECTADO
                </span>
                <span class="text-xs text-gray-500">${linked.email}</span>
            </div>
        `;
    }
    return `
        <div class="flex items-center justify-between">
            <span class="text-gray-500 text-xs font-bold flex items-center gap-1">
                <i class="fas fa-times-circle"></i> NÃO POSSUI
            </span>
            <button onclick="startFederationOAuth('${type}')" class="text-xs text-blue-400 hover:underline">Conectar agora</button>
        </div>
    `;
}

async function startFederationOAuth(provider) {
    try {
        const res = await api('/federation/oauth/start', {
            method: 'POST',
            body: JSON.stringify({ provider })
        });

        if (res.auth_url) {
            toast('Redirecionando para login federado...', 'info');
            window.location.href = res.auth_url;
        }
    } catch (err) {
        toast('Erro ao iniciar OAuth: ' + err.message, 'error');
    }
}

async function unlinkFederationProvider(provider) {
    if (!confirm(`Deseja realmente desvincular o provider ${provider}?`)) return;

    try {
        await api(`/federation/providers/${provider}`, { method: 'DELETE' });
        toast('Provider desvinculado com sucesso!', 'success');
        showSection('federation');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
