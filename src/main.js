/**
 * PROST-QS: Sovereign Kernel Frontend
 * Conectado às APIs soberanas: Identity, Billing, Ads, Agent, Federation
 */

// --- Configuration ---
const API_BASE_URL = "http://localhost:8080/api/v1";
const STORAGE_KEYS = {
    TOKEN: 'pq_auth_token',
    IDENTITY_ID: 'pq_identity_id',
    PHONE: 'pq_phone',
    BILLING_ACCOUNT_ID: 'pq_billing_account_id'
};

let eventsChart = null;
let adRoiChart = null;

// --- Core API Wrapper ---
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

        if (response.status === 401 && !endpoint.includes('/identity/')) {
            handleLogout();
            throw new Error('Sessão expirada');
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

// --- Navigation & UI Control ---
function navTo(pageId) {
    const pages = ['home', 'login', 'verify-otp', 'dashboard', 'billing', 'ads', 'agents', 'admin', 'terminal'];

    // Auth guard
    const isPublic = ['home', 'login', 'verify-otp'].includes(pageId);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!isPublic && !token) {
        pageId = 'login';
    }

    pages.forEach(p => {
        const el = document.getElementById(`${p}-page`);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`${pageId}-page`);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // Update Bottom Nav UI
    const navBar = document.getElementById('bottom-nav');
    if (isPublic && pageId !== 'home') {
        navBar?.classList.add('opacity-0', 'pointer-events-none');
    } else {
        navBar?.classList.remove('opacity-0', 'pointer-events-none');
    }

    // Trigger data loads
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'billing') loadBilling();
    if (pageId === 'ads') loadAds();
    if (pageId === 'agents') loadAgentDecisions();
    if (pageId === 'admin') loadAdminDashboard();
}

// ========================================
// SOVEREIGN IDENTITY - Phone + OTP
// ========================================

let pendingVerificationId = null;

async function handleRequestOTP(e) {
    e.preventDefault();
    const phone = document.getElementById('phone-input').value;
    
    if (!phone || phone.length < 10) {
        showToast('Número de telefone inválido', 'error');
        return;
    }

    try {
        toggleLoader(true, 'Enviando código...');
        const res = await apiRequest('/identity/verify/request', {
            method: 'POST',
            body: JSON.stringify({ phone_number: phone, channel: 'sms' })
        });

        pendingVerificationId = res.verification_id;
        localStorage.setItem(STORAGE_KEYS.PHONE, phone);
        
        showToast(`Código enviado para ${phone}`, 'success');
        navTo('verify-otp');
        
        // Em dev, mostrar o código na tela
        if (res.dev_otp) {
            console.log(`[DEV] OTP Code: ${res.dev_otp}`);
            document.getElementById('dev-otp-hint').textContent = `DEV: ${res.dev_otp}`;
            document.getElementById('dev-otp-hint').classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
    } finally {
        toggleLoader(false);
    }
}

async function handleVerifyOTP(e) {
    e.preventDefault();
    const otp = document.getElementById('otp-input').value;
    
    if (!otp || otp.length !== 6) {
        showToast('Código deve ter 6 dígitos', 'error');
        return;
    }

    try {
        toggleLoader(true, 'Verificando identidade...');
        const res = await apiRequest('/identity/verify/confirm', {
            method: 'POST',
            body: JSON.stringify({
                verification_id: pendingVerificationId,
                code: otp
            })
        });

        // Salvar credenciais soberanas
        localStorage.setItem(STORAGE_KEYS.TOKEN, res.token);
        localStorage.setItem(STORAGE_KEYS.IDENTITY_ID, res.user_id);
        
        showToast('Identidade soberana verificada', 'success');
        navTo('dashboard');
    } catch (err) {
        console.error(err);
    } finally {
        toggleLoader(false);
    }
}

function handleLogout() {
    localStorage.clear();
    pendingVerificationId = null;
    navTo('home');
    showToast('Kernel desconectado', 'info');
}

// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {
    try {
        toggleLoader(true, 'Carregando kernel...');
        
        const identityId = localStorage.getItem(STORAGE_KEYS.IDENTITY_ID);
        const phone = localStorage.getItem(STORAGE_KEYS.PHONE) || '';
        
        // Tentar buscar conta de billing
        let billingAccount = await apiRequest('/billing/account').catch(() => null);
        
        // Se não existe, criar automaticamente
        if (!billingAccount) {
            console.log('[KERNEL] Criando conta de billing...');
            try {
                billingAccount = await apiRequest('/billing/account', {
                    method: 'POST',
                    body: JSON.stringify({ phone: phone, email: '' })
                });
                showToast('Conta de billing criada', 'success');
            } catch (createErr) {
                console.error('Falha ao criar billing account:', createErr);
            }
        }

        // Agora buscar ledger (só funciona se billing account existe)
        let ledgerData = { balance: 0, entries: [] };
        if (billingAccount) {
            ledgerData = await apiRequest('/billing/ledger').catch(() => ({ balance: 0, entries: [] }));
        }

        // Atualizar UI
        document.getElementById('display-balance').textContent = formatCurrency(ledgerData.balance || 0);
        document.getElementById('dashboard-identity-id').textContent = `ID: ${identityId?.substring(0, 8) || 'N/A'}...`;
        document.getElementById('dashboard-phone').textContent = phone || 'N/A';

        if (billingAccount) {
            localStorage.setItem(STORAGE_KEYS.BILLING_ACCOUNT_ID, billingAccount.account_id || billingAccount.AccountID);
            document.getElementById('billing-status').textContent = billingAccount.status || billingAccount.Status || 'active';
        } else {
            document.getElementById('billing-status').textContent = 'Erro ao criar';
        }

        initCharts();
        loadPendingDecisions();
    } catch (err) {
        console.error('Dashboard load failed', err);
    } finally {
        toggleLoader(false);
    }
}

async function loadPendingDecisions() {
    try {
        const decisions = await apiRequest('/agents/decisions/pending').catch(() => []);
        const badge = document.getElementById('pending-decisions-badge');
        if (badge) {
            badge.textContent = decisions.length || 0;
            badge.classList.toggle('hidden', !decisions.length);
        }
    } catch (err) {
        console.error(err);
    }
}

// ========================================
// BILLING - Ledger, PaymentIntents, Subscriptions
// ========================================

async function loadBilling() {
    try {
        toggleLoader(true, 'Carregando ledger...');
        
        const [ledgerData, subscription] = await Promise.all([
            apiRequest('/billing/ledger'),
            apiRequest('/billing/subscriptions/active').catch(() => null)
        ]);

        // Saldo
        document.getElementById('billing-balance').textContent = formatCurrency(ledgerData.balance || 0);

        // Ledger entries
        const ledgerList = document.getElementById('ledger-list');
        const entries = ledgerData.entries || [];
        if (entries.length > 0) {
            ledgerList.innerHTML = entries.map(entry => `
                <div class="glass-card-sm p-4 flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full ${entry.type === 'credit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'} flex items-center justify-center">
                            <i class="fas ${entry.type === 'credit' ? 'fa-arrow-down text-emerald-400' : 'fa-arrow-up text-rose-400'}"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold">${entry.description || entry.type}</h4>
                            <p class="text-[10px] text-text-muted">${new Date(entry.created_at).toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold ${entry.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}">
                            ${entry.type === 'credit' ? '+' : '-'}${formatCurrency(entry.amount)}
                        </p>
                        <p class="text-[8px] text-text-muted font-mono">${entry.id.substring(0, 8)}</p>
                    </div>
                </div>
            `).join('');
        } else {
            ledgerList.innerHTML = '<div class="text-center py-8 text-text-muted text-xs">Nenhuma entrada no ledger.</div>';
        }

        // Subscription
        const subList = document.getElementById('subscriptions-list');
        if (subscription) {
            subList.innerHTML = `
                <div class="glass-card-sm p-4 flex items-center justify-between">
                    <div>
                        <h4 class="text-xs font-bold">${subscription.plan_id}</h4>
                        <p class="text-[10px] text-text-muted">Status: <span class="${subscription.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}">${subscription.status}</span></p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold">${formatCurrency(subscription.amount)}/mês</p>
                    </div>
                </div>
            `;
        } else {
            subList.innerHTML = '<div class="text-center py-4 text-text-muted text-xs">Nenhuma assinatura ativa.</div>';
        }

    } catch (err) {
        console.error('Billing load failed', err);
    } finally {
        toggleLoader(false);
    }
}

async function createPaymentIntent() {
    const amount = prompt('Valor em centavos (ex: 1000 = R$10):');
    if (!amount) return;

    try {
        toggleLoader(true, 'Criando intent...');
        const res = await apiRequest('/billing/payment-intent', {
            method: 'POST',
            body: JSON.stringify({
                amount: parseInt(amount),
                currency: 'brl',
                description: 'Depósito via Frontend'
            })
        });
        showToast(`PaymentIntent criado: ${res.id.substring(0, 8)}`, 'success');
        loadBilling();
    } catch (err) {
        console.error(err);
    } finally {
        toggleLoader(false);
    }
}

// ========================================
// ADS MODULE
// ========================================

async function loadAds() {
    try {
        toggleLoader(true, 'Carregando ads...');
        
        const [account, campaigns, budgets] = await Promise.all([
            apiRequest('/ads/account').catch(() => null),
            apiRequest('/ads/campaigns').catch(() => []),
            apiRequest('/ads/budgets').catch(() => [])
        ]);

        // Account info
        if (account) {
            document.getElementById('ads-account-status').textContent = account.status;
            document.getElementById('ads-account-id').textContent = account.id.substring(0, 8);
        }

        // Campaigns
        const campaignList = document.getElementById('campaigns-list');
        if (campaigns && campaigns.length > 0) {
            campaignList.innerHTML = campaigns.map(c => `
                <div class="glass-card-sm p-4">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-xs font-bold">${c.name}</h4>
                        <span class="px-2 py-1 rounded-full text-[8px] font-bold ${getStatusColor(c.status)}">${c.status}</span>
                    </div>
                    <div class="flex justify-between text-[10px] text-text-muted">
                        <span>Bid: ${formatCurrency(c.bid_amount)}</span>
                        <span>Spent: ${formatCurrency(c.total_spent || 0)}</span>
                    </div>
                    <div class="flex gap-2 mt-3">
                        ${c.status === 'active' ? `<button onclick="pauseCampaign('${c.id}')" class="px-3 py-1 bg-amber-500/20 text-amber-400 rounded text-[10px]">Pausar</button>` : ''}
                        ${c.status === 'paused' ? `<button onclick="resumeCampaign('${c.id}')" class="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[10px]">Retomar</button>` : ''}
                    </div>
                </div>
            `).join('');
        } else {
            campaignList.innerHTML = '<div class="text-center py-8 text-text-muted text-xs">Nenhuma campanha.</div>';
        }

        // Budgets
        const budgetList = document.getElementById('budgets-list');
        if (budgets && budgets.length > 0) {
            budgetList.innerHTML = budgets.map(b => {
                const pct = b.total_amount > 0 ? (b.spent_amount / b.total_amount) * 100 : 0;
                return `
                    <div class="glass-card-sm p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-bold">${b.type} Budget</span>
                            <span class="text-[10px] ${getStatusColor(b.status)}">${b.status}</span>
                        </div>
                        <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full ${pct > 80 ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${pct}%"></div>
                        </div>
                        <div class="flex justify-between text-[10px] text-text-muted mt-2">
                            <span>${formatCurrency(b.spent_amount)} / ${formatCurrency(b.total_amount)}</span>
                            <span>${pct.toFixed(1)}%</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            budgetList.innerHTML = '<div class="text-center py-4 text-text-muted text-xs">Nenhum budget.</div>';
        }

    } catch (err) {
        console.error('Ads load failed', err);
    } finally {
        toggleLoader(false);
    }
}

async function pauseCampaign(id) {
    try {
        await apiRequest(`/ads/campaigns/${id}/pause`, { method: 'POST' });
        showToast('Campanha pausada', 'success');
        loadAds();
    } catch (err) {
        console.error(err);
    }
}

async function resumeCampaign(id) {
    try {
        await apiRequest(`/ads/campaigns/${id}/resume`, { method: 'POST' });
        showToast('Campanha retomada', 'success');
        loadAds();
    } catch (err) {
        console.error(err);
    }
}

// ========================================
// AGENT GOVERNANCE
// ========================================

async function loadAgentDecisions() {
    try {
        toggleLoader(true, 'Carregando decisões...');
        
        const [pending, recent] = await Promise.all([
            apiRequest('/agents/decisions/pending'),
            apiRequest('/agents/decisions?limit=20')
        ]);

        // Pending decisions
        const pendingList = document.getElementById('pending-decisions-list');
        if (pending && pending.length > 0) {
            pendingList.innerHTML = pending.map(d => `
                <div class="glass p-4 rounded-xl border-l-4 ${getRiskBorderColor(d.risk_score)}">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-xs font-bold">${d.proposed_action}</span>
                        <span class="px-2 py-1 rounded-full text-[8px] font-bold ${getRiskColor(d.risk_score)}">
                            Risk: ${(d.risk_score * 100).toFixed(0)}%
                        </span>
                    </div>
                    <p class="text-[10px] text-text-muted mb-2">Target: ${d.target_entity}</p>
                    <p class="text-[10px] text-text-muted mb-3">${d.reason || 'Sem justificativa'}</p>
                    <div class="flex gap-2">
                        <button onclick="approveDecision('${d.id}')" class="flex-1 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">
                            <i class="fas fa-check mr-1"></i> APROVAR
                        </button>
                        <button onclick="rejectDecision('${d.id}')" class="flex-1 px-3 py-2 bg-rose-500/20 text-rose-400 rounded text-[10px] font-bold">
                            <i class="fas fa-times mr-1"></i> REJEITAR
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            pendingList.innerHTML = '<div class="text-center py-8 text-text-muted text-xs">Nenhuma decisão pendente.</div>';
        }

        // Recent decisions
        const recentList = document.getElementById('recent-decisions-list');
        if (recent && recent.length > 0) {
            recentList.innerHTML = recent.map(d => `
                <div class="glass-card-sm p-3 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] font-bold">${d.proposed_action}</span>
                        <p class="text-[8px] text-text-muted">${new Date(d.created_at).toLocaleString()}</p>
                    </div>
                    <span class="px-2 py-1 rounded text-[8px] font-bold ${getDecisionStatusColor(d.status)}">${d.status}</span>
                </div>
            `).join('');
        }

    } catch (err) {
        console.error('Agent decisions load failed', err);
    } finally {
        toggleLoader(false);
    }
}

async function approveDecision(id) {
    const note = prompt('Nota de aprovação (opcional):') || '';
    try {
        await apiRequest(`/agents/decisions/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ note })
        });
        showToast('Decisão aprovada', 'success');
        loadAgentDecisions();
        loadPendingDecisions();
    } catch (err) {
        console.error(err);
    }
}

async function rejectDecision(id) {
    const note = prompt('Motivo da rejeição:') || '';
    try {
        await apiRequest(`/agents/decisions/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ note })
        });
        showToast('Decisão rejeitada', 'info');
        loadAgentDecisions();
        loadPendingDecisions();
    } catch (err) {
        console.error(err);
    }
}

// ========================================
// ADMIN DASHBOARD
// ========================================

async function loadAdminDashboard() {
    try {
        toggleLoader(true, 'Carregando admin...');
        
        const stats = await apiRequest('/admin/dashboard');

        document.getElementById('admin-total-identities').textContent = stats.total_identities || 0;
        document.getElementById('admin-total-billing').textContent = stats.total_billing_accounts || 0;
        document.getElementById('admin-total-ledger').textContent = formatCurrency(stats.total_ledger_balance || 0);
        document.getElementById('admin-pending-jobs').textContent = stats.pending_jobs || 0;
        document.getElementById('admin-failed-jobs').textContent = stats.failed_jobs || 0;
        document.getElementById('admin-disputed-count').textContent = stats.disputed_entities || 0;

    } catch (err) {
        console.error('Admin load failed', err);
    } finally {
        toggleLoader(false);
    }
}

// ========================================
// TERMINAL
// ========================================

async function executeCmd(e) {
    if (e) e.preventDefault();

    const input = document.getElementById('cmd-input');
    const typeSelect = document.getElementById('cmd-type-select');
    const terminal = document.getElementById('terminal-output');

    const type = typeSelect.value;
    let payloadRaw = input.value;

    addToTerminal(`> EXECUTING ${type}...`, 'text-primary');

    try {
        const payload = payloadRaw ? JSON.parse(payloadRaw) : {};
        const res = await apiRequest('/commands', {
            method: 'POST',
            body: JSON.stringify({ type, payload, metadata: {} })
        });

        addToTerminal(`✔ SUCCESS: ${JSON.stringify(res)}`, 'text-emerald-400');
        input.value = '';
        showToast('Comando processado', 'success');
    } catch (err) {
        addToTerminal(`✘ ERROR: ${err.message}`, 'text-rose-400');
    }
}

function addToTerminal(text, colorClass) {
    const term = document.getElementById('terminal-output');
    if (!term) return;

    const line = document.createElement('div');
    line.className = `${colorClass} mb-1`;
    line.textContent = text;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

// ========================================
// CHARTS
// ========================================

function initCharts() {
    const ctxEvents = document.getElementById('eventsChart')?.getContext('2d');
    if (ctxEvents && !eventsChart) {
        eventsChart = new Chart(ctxEvents, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Ledger Activity',
                    data: [12, 19, 3, 5, 2, 3],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } }
                }
            }
        });
    }
}

// ========================================
// UTILS
// ========================================

function toggleLoader(show, text = 'Carregando...') {
    const loader = document.getElementById('global-loader');
    const txt = document.getElementById('loader-text');
    if (loader && txt) {
        txt.textContent = text;
        show ? loader.classList.remove('hidden') : loader.classList.add('hidden');
    }
}

function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val / 100);
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = { success: 'bg-emerald-500', error: 'bg-rose-500', info: 'bg-primary' };

    toast.className = `${colors[type]} text-white text-[10px] font-bold px-6 py-3 rounded-full mb-3 shadow-2xl pointer-events-auto border border-white/20`;
    toast.textContent = msg;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function getStatusColor(status) {
    const colors = {
        active: 'bg-emerald-500/20 text-emerald-400',
        paused: 'bg-amber-500/20 text-amber-400',
        exhausted: 'bg-rose-500/20 text-rose-400',
        disputed: 'bg-rose-500/20 text-rose-400'
    };
    return colors[status] || 'bg-white/10 text-text-muted';
}

function getRiskColor(score) {
    if (score < 0.2) return 'bg-emerald-500/20 text-emerald-400';
    if (score < 0.6) return 'bg-amber-500/20 text-amber-400';
    return 'bg-rose-500/20 text-rose-400';
}

function getRiskBorderColor(score) {
    if (score < 0.2) return 'border-emerald-500';
    if (score < 0.6) return 'border-amber-500';
    return 'border-rose-500';
}

function getDecisionStatusColor(status) {
    const colors = {
        proposed: 'bg-amber-500/20 text-amber-400',
        approved: 'bg-emerald-500/20 text-emerald-400',
        rejected: 'bg-rose-500/20 text-rose-400',
        executed: 'bg-primary/20 text-primary',
        failed: 'bg-rose-500/20 text-rose-400',
        expired: 'bg-white/10 text-text-muted'
    };
    return colors[status] || 'bg-white/10 text-text-muted';
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Auth check
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
        navTo('dashboard');
    } else {
        navTo('home');
    }

    // Export functions
    window.navTo = navTo;
    window.handleRequestOTP = handleRequestOTP;
    window.handleVerifyOTP = handleVerifyOTP;
    window.handleLogout = handleLogout;
    window.logout = handleLogout;
    window.executeCmd = executeCmd;
    window.createPaymentIntent = createPaymentIntent;
    window.pauseCampaign = pauseCampaign;
    window.resumeCampaign = resumeCampaign;
    window.approveDecision = approveDecision;
    window.rejectDecision = rejectDecision;
});
