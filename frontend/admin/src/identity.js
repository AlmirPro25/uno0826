/**
 * PROST-QS Identity & Access Module
 * Fase 26.8 - Login History & Payment Provider per App
 */

// ========================================
// LOGIN HISTORY - Auditoria de Logins
// ========================================

async function renderLoginHistory(container) {
    // Carregar estatísticas e histórico em paralelo
    const [stats, recentLogins, failedLogins] = await Promise.all([
        api('/admin/login-stats?hours=24').catch(() => ({})),
        api('/admin/login-history?limit=50').catch(() => ({ events: [] })),
        api('/admin/login-history/failed?hours=24&limit=20').catch(() => ({ events: [] }))
    ]);

    const events = recentLogins.events || [];
    const failed = failedLogins.events || [];

    container.innerHTML = `
        <!-- Stats Cards -->
        <div class="grid grid-cols-5 gap-4 mb-6">
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-primary">${stats.total || 0}</p>
                <p class="text-gray-400 text-sm">Total (24h)</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-emerald-400">${stats.successful || 0}</p>
                <p class="text-gray-400 text-sm">Sucesso</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-rose-400">${stats.failed || 0}</p>
                <p class="text-gray-400 text-sm">Falhas</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-amber-400">${stats.successful && stats.total ? ((stats.successful / stats.total) * 100).toFixed(0) : 0}%</p>
                <p class="text-gray-400 text-sm">Taxa Sucesso</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-purple-400">${Object.keys(stats.by_method || {}).length}</p>
                <p class="text-gray-400 text-sm">Métodos</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-6">
            <!-- By Method -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-key text-primary"></i>
                    Por Método de Login
                </h3>
                <div class="space-y-3">
                    ${Object.entries(stats.by_method || {}).map(([method, count]) => `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <span class="flex items-center gap-2">
                                <i class="fas fa-${getMethodIcon(method)} text-primary"></i>
                                ${formatMethod(method)}
                            </span>
                            <span class="font-bold">${count}</span>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-center py-4">Sem dados</p>'}
                </div>
            </div>

            <!-- By Role -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-user-shield text-amber-400"></i>
                    Por Role
                </h3>
                <div class="space-y-3">
                    ${Object.entries(stats.by_role || {}).map(([role, count]) => `
                        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                            <span class="flex items-center gap-2">
                                <span class="px-2 py-1 rounded text-xs ${getRoleBadgeClass(role)}">${role}</span>
                            </span>
                            <span class="font-bold">${count}</span>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-center py-4">Sem dados</p>'}
                </div>
            </div>
        </div>

        <!-- Failed Logins Alert -->
        ${failed.length > 0 ? `
            <div class="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 mb-6">
                <h3 class="font-bold mb-4 flex items-center gap-2 text-rose-400">
                    <i class="fas fa-exclamation-triangle"></i>
                    Tentativas Falhas (24h)
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-2">Usuário</th>
                                <th class="pb-2">IP</th>
                                <th class="pb-2">Método</th>
                                <th class="pb-2">Motivo</th>
                                <th class="pb-2">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${failed.slice(0, 10).map(e => `
                                <tr class="border-b border-gray-800">
                                    <td class="py-2 font-mono text-rose-400">${e.username || '-'}</td>
                                    <td class="py-2 font-mono text-xs">${e.ip || '-'}</td>
                                    <td class="py-2">${formatMethod(e.method)}</td>
                                    <td class="py-2 text-rose-300">${formatFailReason(e.fail_reason)}</td>
                                    <td class="py-2 text-gray-500">${formatDate(e.created_at)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}

        <!-- Recent Logins -->
        <div class="card rounded-2xl p-6">
            <h3 class="font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-history text-primary"></i>
                Logins Recentes
            </h3>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-gray-400 border-b border-gray-700">
                            <th class="pb-2">Status</th>
                            <th class="pb-2">Usuário</th>
                            <th class="pb-2">Role</th>
                            <th class="pb-2">IP</th>
                            <th class="pb-2">Método</th>
                            <th class="pb-2">User Agent</th>
                            <th class="pb-2">Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${events.map(e => `
                            <tr class="border-b border-gray-800 hover:bg-white/5">
                                <td class="py-3">
                                    ${e.success 
                                        ? '<span class="text-emerald-400"><i class="fas fa-check-circle"></i></span>'
                                        : '<span class="text-rose-400"><i class="fas fa-times-circle"></i></span>'
                                    }
                                </td>
                                <td class="py-3 font-medium">${e.username || '-'}</td>
                                <td class="py-3">
                                    <span class="px-2 py-1 rounded text-xs ${getRoleBadgeClass(e.role)}">${e.role || '-'}</span>
                                </td>
                                <td class="py-3 font-mono text-xs text-gray-400">${e.ip || '-'}</td>
                                <td class="py-3">
                                    <span class="flex items-center gap-1">
                                        <i class="fas fa-${getMethodIcon(e.method)} text-xs"></i>
                                        ${formatMethod(e.method)}
                                    </span>
                                </td>
                                <td class="py-3 text-xs text-gray-500 max-w-xs truncate" title="${e.user_agent || ''}">${truncateUA(e.user_agent)}</td>
                                <td class="py-3 text-gray-500">${formatDate(e.created_at)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="7" class="py-8 text-center text-gray-500">Nenhum login registrado</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ========================================
// PAYMENT PROVIDER - Stripe per App
// ========================================

async function showPaymentProviderModal(appId, appName) {
    // Carregar providers existentes
    const providers = await api(`/apps/${appId}/payment-provider`).catch(() => ({ providers: [] }));
    const stripeProvider = (providers.providers || []).find(p => p.provider === 'stripe');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.id = 'payment-provider-modal';
    modal.innerHTML = `
        <div class="bg-gray-900 rounded-2xl p-8 max-w-lg w-full mx-4 border border-gray-700">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold flex items-center gap-2">
                    <i class="fab fa-stripe text-purple-400"></i>
                    Payment Provider - ${appName}
                </h2>
                <button onclick="closePaymentProviderModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>

            ${stripeProvider ? `
                <!-- Provider Conectado -->
                <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-check-circle text-emerald-400 text-2xl"></i>
                        <div>
                            <p class="font-bold text-emerald-400">Stripe Conectado</p>
                            <p class="text-sm text-gray-400">Ambiente: ${stripeProvider.environment || 'test'}</p>
                        </div>
                    </div>
                </div>

                <div class="space-y-4 mb-6">
                    <div class="p-4 bg-white/5 rounded-xl">
                        <p class="text-sm text-gray-400 mb-1">Public Key</p>
                        <p class="font-mono text-sm">${stripeProvider.public_key || '-'}</p>
                    </div>
                    <div class="p-4 bg-white/5 rounded-xl">
                        <p class="text-sm text-gray-400 mb-1">Status</p>
                        <span class="px-2 py-1 rounded text-xs ${stripeProvider.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}">${stripeProvider.status}</span>
                    </div>
                    ${stripeProvider.connected_at ? `
                        <div class="p-4 bg-white/5 rounded-xl">
                            <p class="text-sm text-gray-400 mb-1">Conectado em</p>
                            <p class="text-sm">${formatDate(stripeProvider.connected_at)}</p>
                        </div>
                    ` : ''}
                    ${stripeProvider.last_used_at ? `
                        <div class="p-4 bg-white/5 rounded-xl">
                            <p class="text-sm text-gray-400 mb-1">Último uso</p>
                            <p class="text-sm">${formatDate(stripeProvider.last_used_at)}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="flex gap-3">
                    <button onclick="showUpdateStripeForm('${appId}')" class="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-xl font-medium">
                        <i class="fas fa-edit mr-2"></i> Atualizar Chaves
                    </button>
                    <button onclick="revokePaymentProvider('${appId}', 'stripe')" class="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-6 py-3 rounded-xl font-medium">
                        <i class="fas fa-trash mr-2"></i> Revogar
                    </button>
                </div>
            ` : `
                <!-- Formulário de Conexão -->
                <form id="stripe-connect-form" onsubmit="connectStripe(event, '${appId}')">
                    <div class="space-y-4 mb-6">
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Secret Key *</label>
                            <input type="password" id="stripe-secret-key" required
                                class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
                                placeholder="sk_test_... ou sk_live_...">
                            <p class="text-xs text-gray-500 mt-1">Nunca será exibida novamente</p>
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Publishable Key *</label>
                            <input type="text" id="stripe-publishable-key" required
                                class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
                                placeholder="pk_test_... ou pk_live_...">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Webhook Secret (opcional)</label>
                            <input type="password" id="stripe-webhook-secret"
                                class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none"
                                placeholder="whsec_...">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-400 mb-2">Ambiente</label>
                            <select id="stripe-environment" class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 focus:border-primary focus:outline-none">
                                <option value="test">Test (Sandbox)</option>
                                <option value="live">Live (Produção)</option>
                            </select>
                        </div>
                    </div>

                    <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                        <p class="text-sm text-amber-400">
                            <i class="fas fa-shield-alt mr-2"></i>
                            As chaves serão criptografadas com AES-256 e nunca serão exibidas novamente.
                        </p>
                    </div>

                    <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium">
                        <i class="fab fa-stripe mr-2"></i> Conectar Stripe
                    </button>
                </form>
            `}
        </div>
    `;
    document.body.appendChild(modal);
}

function closePaymentProviderModal() {
    document.getElementById('payment-provider-modal')?.remove();
}

async function connectStripe(event, appId) {
    event.preventDefault();
    
    const secretKey = document.getElementById('stripe-secret-key').value;
    const publishableKey = document.getElementById('stripe-publishable-key').value;
    const webhookSecret = document.getElementById('stripe-webhook-secret').value;
    const environment = document.getElementById('stripe-environment').value;

    try {
        loader(true);
        await api(`/apps/${appId}/payment-provider/stripe`, {
            method: 'POST',
            body: JSON.stringify({
                secret_key: secretKey,
                publishable_key: publishableKey,
                webhook_secret: webhookSecret,
                environment: environment
            })
        });
        
        toast('Stripe conectado com sucesso!', 'success');
        closePaymentProviderModal();
        
        // Refresh app detail if visible
        if (typeof showAppDetail === 'function') {
            showAppDetail(appId);
        }
    } catch (err) {
        toast(err.message || 'Erro ao conectar Stripe', 'error');
    } finally {
        loader(false);
    }
}

async function revokePaymentProvider(appId, provider) {
    if (!confirm(`Tem certeza que deseja revogar o ${provider}? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        loader(true);
        await api(`/apps/${appId}/payment-provider/${provider}`, { method: 'DELETE' });
        toast('Provider revogado', 'success');
        closePaymentProviderModal();
        
        // Refresh app detail if visible
        if (typeof showAppDetail === 'function') {
            showAppDetail(appId);
        }
    } catch (err) {
        toast(err.message || 'Erro ao revogar provider', 'error');
    } finally {
        loader(false);
    }
}

function showUpdateStripeForm(appId) {
    closePaymentProviderModal();
    // Re-open modal without existing provider to show form
    setTimeout(() => {
        showPaymentProviderModal(appId, 'App');
    }, 100);
}

// ========================================
// HELPERS
// ========================================

function getMethodIcon(method) {
    const icons = {
        'password': 'lock',
        'phone_otp': 'mobile-alt',
        'google': 'google',
        'api_key': 'key',
        'token': 'ticket-alt'
    };
    return icons[method] || 'sign-in-alt';
}

function formatMethod(method) {
    const names = {
        'password': 'Senha',
        'phone_otp': 'SMS OTP',
        'google': 'Google',
        'api_key': 'API Key',
        'token': 'Token'
    };
    return names[method] || method || '-';
}

function formatFailReason(reason) {
    const reasons = {
        'user_not_found': 'Usuário não encontrado',
        'invalid_password': 'Senha inválida',
        'invalid_otp': 'OTP inválido',
        'account_locked': 'Conta bloqueada',
        'expired_token': 'Token expirado'
    };
    return reasons[reason] || reason || '-';
}

function getRoleBadgeClass(role) {
    const classes = {
        'super_admin': 'bg-rose-500/20 text-rose-400',
        'admin': 'bg-amber-500/20 text-amber-400',
        'user': 'bg-primary/20 text-primary'
    };
    return classes[role] || 'bg-gray-500/20 text-gray-400';
}

function truncateUA(ua) {
    if (!ua) return '-';
    // Extract browser name
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return ua.substring(0, 30) + '...';
}
