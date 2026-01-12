/**
 * PROST-QS Capabilities Module - Admin Dashboard
 * "Capabilities por plano - o que cada tier pode fazer"
 * 
 * Endpoints:
 * - GET  /api/v1/me/entitlements           → Entitlements do usuário
 * - GET  /api/v1/me/capabilities/:cap      → Verificar capability
 * - GET  /api/v1/me/limits/:resource       → Verificar limite
 * - GET  /api/v1/addons                    → Lista add-ons disponíveis
 * - GET  /api/v1/addons/mine               → Add-ons do usuário
 */

// ========================================
// CAPABILITIES DASHBOARD
// ========================================

async function renderCapabilitiesSection(container) {
    try {
        const [entitlements, addons, myAddons] = await Promise.all([
            api('/me/entitlements').catch(() => ({ plan: {}, capabilities: {}, limits: {} })),
            api('/addons').catch(() => ({ addons: [] })),
            api('/addons/mine').catch(() => [])
        ]);

        const plan = entitlements.plan || {};
        const capabilities = entitlements.capabilities || {};
        const limits = entitlements.limits || {};
        const addonsList = addons.addons || addons || [];
        const myAddonsList = Array.isArray(myAddons) ? myAddons : (myAddons.addons || []);

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-puzzle-piece text-purple-400"></i>
                        Capabilities & Entitlements
                    </h2>
                    <p class="text-gray-400">O que seu plano permite fazer</p>
                </div>
            </div>

            <!-- Current Plan -->
            <div class="bg-gradient-to-r from-purple-500/20 to-purple-900/20 border-l-4 border-purple-500 rounded-2xl p-6 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center">
                        <i class="fas fa-crown text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold capitalize">${plan.id || plan.name || 'Free'}</h2>
                        <p class="text-gray-400">${plan.description || 'Plano atual'}</p>
                    </div>
                </div>
            </div>

            <!-- Limits -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${limits.max_apps || '∞'}</p>
                    <p class="text-gray-400 text-sm">Max Apps</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${limits.max_users || '∞'}</p>
                    <p class="text-gray-400 text-sm">Max Users/App</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${limits.max_api_calls || '∞'}</p>
                    <p class="text-gray-400 text-sm">API Calls/mês</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${myAddonsList.length}</p>
                    <p class="text-gray-400 text-sm">Add-ons Ativos</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <!-- Capabilities -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-check-circle text-emerald-400"></i>
                        Capabilities Habilitadas
                    </h3>
                    <div class="space-y-2">
                        ${Object.keys(capabilities).length > 0 ? Object.entries(capabilities).map(([cap, enabled]) => `
                            <div class="flex items-center justify-between p-3 rounded-xl ${enabled ? 'bg-emerald-500/10' : 'bg-gray-500/10'}">
                                <span class="text-sm capitalize">${cap.replace(/_/g, ' ')}</span>
                                <i class="fas fa-${enabled ? 'check text-emerald-400' : 'times text-gray-500'}"></i>
                            </div>
                        `).join('') : `
                            <div class="text-center py-4 text-gray-500">
                                <p>Capabilities padrão do plano</p>
                            </div>
                        `}
                    </div>
                </div>

                <!-- Add-ons -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-plus-circle text-purple-400"></i>
                        Add-ons Disponíveis
                    </h3>
                    <div class="space-y-2 max-h-80 overflow-y-auto">
                        ${addonsList.length > 0 ? addonsList.map(addon => {
                            const owned = addon.owned || myAddonsList.some(a => a.addon_id === addon.id);
                            return `
                                <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                    <div>
                                        <p class="font-medium text-sm">${addon.name || addon.id}</p>
                                        <p class="text-xs text-gray-500">${addon.description || '-'}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm text-emerald-400">${formatCurrency(addon.price_cents || 0)}/mês</span>
                                        ${owned 
                                            ? '<span class="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">Ativo</span>'
                                            : `<button onclick="purchaseAddon('${addon.id}')" class="px-3 py-1 bg-purple-500 hover:bg-purple-600 rounded-lg text-xs">Comprar</button>`
                                        }
                                    </div>
                                </div>
                            `;
                        }).join('') : `
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-puzzle-piece text-4xl mb-4"></i>
                                <p>Nenhum add-on disponível</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Plans Comparison -->
            <div class="card rounded-2xl p-6 mt-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-table text-primary"></i>
                    Comparativo de Planos
                </h3>
                ${renderPlansComparison()}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Capabilities', err.message);
    }
}

function renderPlansComparison() {
    const plans = ['free', 'starter', 'pro', 'enterprise'];
    const features = [
        { name: 'Apps', free: '1', starter: '3', pro: '10', enterprise: '∞' },
        { name: 'Users/App', free: '100', starter: '1K', pro: '10K', enterprise: '∞' },
        { name: 'API Calls/mês', free: '10K', starter: '100K', pro: '1M', enterprise: '∞' },
        { name: 'Webhooks', free: '❌', starter: '✅', pro: '✅', enterprise: '✅' },
        { name: 'Rules Engine', free: '❌', starter: '❌', pro: '✅', enterprise: '✅' },
        { name: 'Audit Retention', free: '7d', starter: '30d', pro: '90d', enterprise: '1y' },
        { name: 'Support', free: 'Community', starter: 'Email', pro: 'Priority', enterprise: 'Dedicated' },
        { name: 'SLA', free: '❌', starter: '❌', pro: '99.9%', enterprise: '99.99%' }
    ];

    return `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-3 text-sm text-gray-400">Feature</th>
                        ${plans.map(p => `<th class="text-center p-3 text-sm text-gray-400 capitalize">${p}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${features.map(f => `
                        <tr class="border-t border-dark-border">
                            <td class="p-3 text-sm">${f.name}</td>
                            ${plans.map(p => `<td class="p-3 text-center text-sm">${f[p]}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function purchaseAddon(addonId) {
    try {
        const result = await api(`/addons/${addonId}/purchase`, { method: 'POST' });
        if (result.checkout_url) {
            window.open(result.checkout_url, '_blank');
        } else {
            toast('Add-on adquirido com sucesso!', 'success');
            showSection('capabilities');
        }
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
