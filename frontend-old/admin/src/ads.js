/**
 * PROST-QS Ads Module - Admin Dashboard
 * "Motor Econômico de Decisão em Tempo Real"
 * 
 * Endpoints:
 * - GET  /api/v1/ads/accounts         → Lista contas de anunciantes
 * - POST /api/v1/ads/accounts         → Criar conta
 * - GET  /api/v1/ads/campaigns        → Lista campanhas
 * - POST /api/v1/ads/campaigns        → Criar campanha
 * - GET  /api/v1/ads/budgets          → Lista orçamentos
 * - GET  /api/v1/ads/slots            → Lista slots de anúncio
 * - GET  /api/v1/ads/creatives        → Lista criativos
 * - GET  /api/v1/ads/stats            → Estatísticas gerais
 */

// ========================================
// ADS DASHBOARD
// ========================================

async function renderAdsSection(container) {
    try {
        const [accounts, campaigns, stats] = await Promise.all([
            api('/ads/accounts').catch(() => ({ accounts: [] })),
            api('/ads/campaigns').catch(() => ({ campaigns: [] })),
            api('/ads/stats').catch(() => ({}))
        ]);

        const accountsList = accounts.accounts || accounts || [];
        const campaignsList = campaigns.campaigns || campaigns || [];

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-ad text-purple-400"></i>
                        Ads Manager
                    </h2>
                    <p class="text-gray-400">Motor Econômico de Decisão em Tempo Real</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="showCreateAccountModal()" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-plus mr-2"></i> Nova Conta
                    </button>
                    <button onclick="showCreateCampaignModal()" class="bg-primary hover:bg-primary/80 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-bullhorn mr-2"></i> Nova Campanha
                    </button>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${accountsList.length}</p>
                    <p class="text-gray-400 text-sm">Contas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${campaignsList.length}</p>
                    <p class="text-gray-400 text-sm">Campanhas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${stats.total_impressions || 0}</p>
                    <p class="text-gray-400 text-sm">Impressões</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${stats.total_clicks || 0}</p>
                    <p class="text-gray-400 text-sm">Cliques</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-cyan-400">${formatCurrency(stats.total_spend || 0)}</p>
                    <p class="text-gray-400 text-sm">Gasto Total</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex gap-2 mb-6">
                <button onclick="showAdsTab('accounts')" id="tab-accounts" class="px-4 py-2 rounded-xl bg-primary/20 text-primary">
                    <i class="fas fa-building mr-2"></i> Contas
                </button>
                <button onclick="showAdsTab('campaigns')" id="tab-campaigns" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
                    <i class="fas fa-bullhorn mr-2"></i> Campanhas
                </button>
                <button onclick="showAdsTab('slots')" id="tab-slots" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
                    <i class="fas fa-th-large mr-2"></i> Slots
                </button>
                <button onclick="showAdsTab('creatives')" id="tab-creatives" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
                    <i class="fas fa-image mr-2"></i> Criativos
                </button>
            </div>

            <!-- Content -->
            <div id="ads-content">
                ${renderAccountsTable(accountsList)}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Ads', err.message);
    }
}

function renderAccountsTable(accounts) {
    if (!accounts.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-building text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhuma conta de anunciante</p>
                <button onclick="showCreateAccountModal()" class="mt-4 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl">
                    <i class="fas fa-plus mr-2"></i> Criar Primeira Conta
                </button>
            </div>
        `;
    }

    return `
        <div class="card rounded-2xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-4 text-sm text-gray-400">Conta</th>
                        <th class="text-center p-4 text-sm text-gray-400">Status</th>
                        <th class="text-center p-4 text-sm text-gray-400">Saldo</th>
                        <th class="text-center p-4 text-sm text-gray-400">Campanhas</th>
                        <th class="text-center p-4 text-sm text-gray-400">Gasto Total</th>
                        <th class="text-center p-4 text-sm text-gray-400">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${accounts.map(acc => `
                        <tr class="border-t border-dark-border hover:bg-white/5">
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-building text-purple-400"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium">${acc.name || 'Sem nome'}</p>
                                        <p class="text-xs text-gray-500 font-mono">${acc.id?.substring(0, 8)}...</p>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4 text-center">
                                <span class="px-2 py-1 rounded-full text-xs ${acc.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">
                                    ${acc.status || 'unknown'}
                                </span>
                            </td>
                            <td class="p-4 text-center text-emerald-400">${formatCurrency(acc.balance || 0)}</td>
                            <td class="p-4 text-center">${acc.campaigns_count || 0}</td>
                            <td class="p-4 text-center text-amber-400">${formatCurrency(acc.total_spend || 0)}</td>
                            <td class="p-4 text-center">
                                <button onclick="viewAccountDetails('${acc.id}')" class="p-2 rounded-lg hover:bg-white/10 text-gray-400">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="addBudget('${acc.id}')" class="p-2 rounded-lg hover:bg-white/10 text-emerald-400">
                                    <i class="fas fa-plus-circle"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function showAdsTab(tab) {
    // Update tab styles
    ['accounts', 'campaigns', 'slots', 'creatives'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            btn.className = t === tab 
                ? 'px-4 py-2 rounded-xl bg-primary/20 text-primary'
                : 'px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20';
        }
    });

    const content = document.getElementById('ads-content');
    if (!content) return;

    try {
        switch (tab) {
            case 'accounts':
                const accounts = await api('/ads/accounts').catch(() => ({ accounts: [] }));
                content.innerHTML = renderAccountsTable(accounts.accounts || accounts || []);
                break;
            case 'campaigns':
                const campaigns = await api('/ads/campaigns').catch(() => ({ campaigns: [] }));
                content.innerHTML = renderCampaignsTable(campaigns.campaigns || campaigns || []);
                break;
            case 'slots':
                const slots = await api('/ads/slots').catch(() => ({ slots: [] }));
                content.innerHTML = renderSlotsTable(slots.slots || slots || []);
                break;
            case 'creatives':
                const creatives = await api('/ads/creatives').catch(() => ({ creatives: [] }));
                content.innerHTML = renderCreativesTable(creatives.creatives || creatives || []);
                break;
        }
    } catch (err) {
        content.innerHTML = `<div class="card rounded-2xl p-8 text-center text-rose-400">${err.message}</div>`;
    }
}

function renderCampaignsTable(campaigns) {
    if (!campaigns.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-bullhorn text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhuma campanha</p>
            </div>
        `;
    }

    return `
        <div class="card rounded-2xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-4 text-sm text-gray-400">Campanha</th>
                        <th class="text-center p-4 text-sm text-gray-400">Status</th>
                        <th class="text-center p-4 text-sm text-gray-400">Orçamento</th>
                        <th class="text-center p-4 text-sm text-gray-400">Impressões</th>
                        <th class="text-center p-4 text-sm text-gray-400">Cliques</th>
                        <th class="text-center p-4 text-sm text-gray-400">CTR</th>
                    </tr>
                </thead>
                <tbody>
                    ${campaigns.map(c => `
                        <tr class="border-t border-dark-border hover:bg-white/5">
                            <td class="p-4">
                                <p class="font-medium">${c.name || 'Sem nome'}</p>
                                <p class="text-xs text-gray-500">${c.type || 'display'}</p>
                            </td>
                            <td class="p-4 text-center">
                                <span class="px-2 py-1 rounded-full text-xs ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'paused' ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}">
                                    ${c.status || 'draft'}
                                </span>
                            </td>
                            <td class="p-4 text-center">${formatCurrency(c.budget || 0)}</td>
                            <td class="p-4 text-center">${c.impressions || 0}</td>
                            <td class="p-4 text-center">${c.clicks || 0}</td>
                            <td class="p-4 text-center text-cyan-400">${c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderSlotsTable(slots) {
    if (!slots.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-th-large text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhum slot de anúncio</p>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-3 gap-4">
            ${slots.map(s => `
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-3">
                        <span class="font-medium">${s.name || s.id}</span>
                        <span class="px-2 py-1 rounded-full text-xs ${s.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">
                            ${s.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <div class="text-sm text-gray-400 space-y-1">
                        <p><i class="fas fa-expand-arrows-alt mr-2"></i>${s.width || 0}x${s.height || 0}</p>
                        <p><i class="fas fa-tag mr-2"></i>${s.type || 'banner'}</p>
                        <p><i class="fas fa-eye mr-2"></i>${s.impressions || 0} impressões</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderCreativesTable(creatives) {
    if (!creatives.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-image text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhum criativo</p>
            </div>
        `;
    }

    return `
        <div class="grid grid-cols-4 gap-4">
            ${creatives.map(c => `
                <div class="card rounded-2xl p-4">
                    <div class="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                        ${c.image_url 
                            ? `<img src="${c.image_url}" class="max-w-full max-h-full rounded" alt="${c.name}">`
                            : `<i class="fas fa-image text-2xl text-gray-600"></i>`
                        }
                    </div>
                    <p class="font-medium truncate">${c.name || 'Sem nome'}</p>
                    <p class="text-xs text-gray-500">${c.type || 'image'} • ${c.width || 0}x${c.height || 0}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// ========================================
// MODALS
// ========================================

function showCreateAccountModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.id = 'ads-modal';
    modal.innerHTML = `
        <div class="bg-dark-card rounded-2xl p-6 max-w-md w-full mx-4 border border-dark-border">
            <h3 class="text-xl font-bold mb-4">Nova Conta de Anunciante</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Nome da Conta</label>
                    <input type="text" id="account-name" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="Ex: Empresa XYZ">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Email de Contato</label>
                    <input type="email" id="account-email" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="contato@empresa.com">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-1">Saldo Inicial (centavos)</label>
                    <input type="number" id="account-balance" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2" placeholder="10000" value="0">
                </div>
            </div>
            <div class="flex gap-2 mt-6">
                <button onclick="document.getElementById('ads-modal').remove()" class="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">Cancelar</button>
                <button onclick="createAccount()" class="flex-1 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl">Criar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function createAccount() {
    const name = document.getElementById('account-name')?.value;
    const email = document.getElementById('account-email')?.value;
    const balance = parseInt(document.getElementById('account-balance')?.value || '0');

    if (!name) {
        toast('Nome é obrigatório', 'error');
        return;
    }

    try {
        await api('/ads/accounts', {
            method: 'POST',
            body: JSON.stringify({ name, email, initial_balance: balance })
        });
        document.getElementById('ads-modal')?.remove();
        toast('Conta criada com sucesso', 'success');
        showSection('ads');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}

function showCreateCampaignModal() {
    toast('Modal de campanha em desenvolvimento', 'info');
}

function viewAccountDetails(accountId) {
    toast('Detalhes da conta: ' + accountId, 'info');
}

function addBudget(accountId) {
    toast('Adicionar orçamento: ' + accountId, 'info');
}
