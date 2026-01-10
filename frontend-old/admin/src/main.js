/**
 * PROST-QS Console Soberano
 * Painel de controle total do sistema - Estilo Big Tech
 * 
 * Módulos expostos:
 * - Dashboard (overview)
 * - Users (identity)
 * - Subscriptions (billing accounts)
 * - Billing (payments)
 * - Ledger (economy)
 * - Kill Switch (emergency)
 * - Policies (rules engine)
 * - Approvals (workflow)
 * - Authority (permissions)
 * - Autonomy Matrix (agent profiles)
 * - Shadow Mode (dry-run)
 * - Agent Decisions
 * - Institutional Memory
 * - Audit Log
 * - Jobs (background tasks)
 */

const API_BASE = 'https://uno0826.onrender.com/api/v1';
const STORAGE = {
    TOKEN: 'pq_sovereign_token',
    USER: 'pq_sovereign_user'
};

let currentUser = null;
let currentPage = 1;

// ========================================
// JWT DECODE
// ========================================

function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function isTokenValid(token) {
    const claims = decodeJWT(token);
    if (!claims) return false;
    if (claims.exp * 1000 < Date.now()) return false;
    if (claims.role !== 'admin' && claims.role !== 'super_admin') return false;
    return true;
}

function isSuperAdmin() {
    const token = localStorage.getItem(STORAGE.TOKEN);
    const claims = decodeJWT(token);
    return claims?.role === 'super_admin';
}

// ========================================
// API HELPERS
// ========================================

async function api(endpoint, options = {}) {
    const token = localStorage.getItem(STORAGE.TOKEN);
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        
        if (!res.ok) {
            if (res.status === 401) {
                logout();
                throw new Error('Sessão expirada');
            }
            if (res.status === 403) {
                toast('Acesso negado', 'error');
                throw new Error('Acesso negado');
            }
            throw new Error(data.error || data.message || 'Erro');
        }
        
        return data;
    } catch (err) {
        if (err.message !== 'Sessão expirada') {
            console.error('API Error:', err);
        }
        throw err;
    }
}

// ========================================
// UI HELPERS
// ========================================

function showPage(pageId) {
    document.getElementById('login-page')?.classList.add('hidden');
    document.getElementById('main-layout')?.classList.add('hidden');
    
    if (pageId === 'main') {
        document.getElementById('main-layout')?.classList.remove('hidden');
    } else {
        document.getElementById(`${pageId}-page`)?.classList.remove('hidden');
    }
}

function showSection(sectionId) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-primary/20', 'text-primary');
        if (el.dataset.section === sectionId) {
            el.classList.add('bg-primary/20', 'text-primary');
        }
    });
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        crisis: '🚨 Crisis View',
        health: '💚 System Health',
        users: 'Usuários',
        subscriptions: 'Subscriptions',
        billing: 'Billing & Payments',
        ledger: 'Ledger',
        killswitch: 'Kill Switch',
        policies: 'Policy Engine',
        approvals: 'Approval Workflow',
        authority: 'Authority Resolution',
        autonomy: 'Autonomy Matrix',
        shadow: 'Shadow Mode',
        agents: 'Agent Decisions',
        memory: 'Institutional Memory',
        audit: 'Audit Log',
        jobs: 'Background Jobs',
        applications: '📦 Applications',
        // Identity & Access - Fase 26.8
        'login-history': '🔐 Login History',
        // Financial - Fase 27.0
        'financial': '💰 Financial Dashboard',
        'reconciliation': '🔄 Reconciliation',
        'alerts': '🚨 Financial Alerts',
        // Cognitive Dashboard - Fase 26.5
        'cognitive': '🧠 Dashboard Cognitivo',
        'cognitive-agents': '🤖 Agentes Cognitivos',
        'cognitive-decisions': '⚖️ Decisões Humanas',
        'cognitive-noise': '🔇 Padrões de Ruído',
        'cognitive-trust': '📈 Evolução da Confiança',
        // Kernel Billing - Fase 28.1
        'kernel-billing': '💰 Kernel Billing',
        // Governance
        'governance': '🛡️ Governance',
        // Onboarding
        'onboarding': '🚀 Onboarding'
    };
    document.getElementById('section-title').textContent = titles[sectionId] || sectionId;
    
    // Load section
    loadSection(sectionId);
}

function loader(show) {
    const el = document.getElementById('loader');
    show ? el?.classList.remove('hidden') : el?.classList.add('hidden');
}

function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const colors = { success: 'bg-emerald-500', error: 'bg-rose-500', info: 'bg-primary', warning: 'bg-amber-500' };
    const t = document.createElement('div');
    t.className = `${colors[type]} text-white text-sm px-4 py-3 rounded-xl mb-2 shadow-lg flex items-center gap-2`;
    const icons = { success: 'check-circle', error: 'times-circle', info: 'info-circle', warning: 'exclamation-triangle' };
    t.innerHTML = `<i class="fas fa-${icons[type]}"></i> ${msg}`;
    container?.appendChild(t);
    setTimeout(() => t.remove(), 4000);
}

function formatCurrency(cents) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
}

function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(date) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ========================================
// AUTH
// ========================================

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username-input').value;
    const password = document.getElementById('password-input').value;

    if (!username || !password) {
        toast('Preencha todos os campos', 'error');
        return;
    }

    try {
        loader(true);
        const res = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        // Check if admin
        const claims = decodeJWT(res.token);
        if (claims?.role !== 'admin' && claims?.role !== 'super_admin') {
            toast('Acesso negado. Você não é administrador.', 'error');
            return;
        }

        localStorage.setItem(STORAGE.TOKEN, res.token);
        localStorage.setItem(STORAGE.USER, JSON.stringify(res.user || { username }));
        currentUser = res.user || { username };
        
        initMainLayout();
        toast('Bem-vindo ao Console Soberano!', 'success');
    } catch (err) {
        toast(err.message || 'Erro ao fazer login', 'error');
    } finally {
        loader(false);
    }
}

function logout() {
    localStorage.removeItem(STORAGE.TOKEN);
    localStorage.removeItem(STORAGE.USER);
    currentUser = null;
    showPage('login');
}

function loginWithToken() {
    const token = document.getElementById('token-input').value.trim();
    if (!token) {
        toast('Cole um token JWT válido', 'error');
        return;
    }

    const claims = decodeJWT(token);
    if (!claims) {
        toast('Token inválido', 'error');
        return;
    }

    if (claims.exp * 1000 < Date.now()) {
        toast('Token expirado', 'error');
        return;
    }

    if (claims.role !== 'admin' && claims.role !== 'super_admin') {
        toast('Token não é de admin', 'error');
        return;
    }

    localStorage.setItem(STORAGE.TOKEN, token);
    localStorage.setItem(STORAGE.USER, JSON.stringify({ username: 'Admin', role: claims.role }));
    currentUser = { username: 'Admin', role: claims.role };
    
    initMainLayout();
    toast('Bem-vindo ao Console Soberano!', 'success');
}

function initMainLayout() {
    showPage('main');
    
    const claims = decodeJWT(localStorage.getItem(STORAGE.TOKEN));
    document.getElementById('admin-name').textContent = currentUser?.username || 'Admin';
    document.getElementById('admin-role').textContent = claims?.role === 'super_admin' ? 'Super Admin' : 'Admin';
    
    // Check kill switch status
    checkKillSwitchStatus();
    
    showSection('dashboard');
}

// ========================================
// KILL SWITCH STATUS CHECK
// ========================================

async function checkKillSwitchStatus() {
    try {
        const status = await api('/killswitch/status');
        if (status.active_switches?.length > 0) {
            document.getElementById('killswitch-banner').classList.remove('hidden');
            document.getElementById('killswitch-banner-text').textContent = 
                `KILL SWITCH ATIVO: ${status.active_switches.map(s => s.scope).join(', ')}`;
            document.getElementById('ks-badge').classList.remove('hidden');
            document.body.style.paddingTop = '40px';
        } else {
            document.getElementById('killswitch-banner').classList.add('hidden');
            document.getElementById('ks-badge').classList.add('hidden');
            document.body.style.paddingTop = '0';
        }
    } catch (err) {
        // Silently fail - user might not have permission
    }
}

// ========================================
// SECTION LOADER
// ========================================

async function loadSection(sectionId) {
    const content = document.getElementById('content-area');
    
    try {
        switch (sectionId) {
            case 'dashboard': await renderDashboard(content); break;
            case 'crisis': await renderCrisisView(content); break;
            case 'health': await renderSystemHealth(content); break;
            case 'users': await renderUsers(content); break;
            case 'subscriptions': await renderSubscriptions(content); break;
            case 'billing': await renderBilling(content); break;
            case 'ledger': await renderLedger(content); break;
            case 'killswitch': await renderKillSwitch(content); break;
            case 'policies': await renderPolicies(content); break;
            case 'approvals': await renderApprovals(content); break;
            case 'authority': await renderAuthority(content); break;
            case 'autonomy': await renderAutonomy(content); break;
            case 'shadow': await renderShadow(content); break;
            case 'agents': await renderAgents(content); break;
            case 'memory': await renderMemory(content); break;
            case 'audit': await renderAudit(content); break;
            case 'jobs': await renderJobs(content); break;
            case 'applications': await renderApplications(content); break;
            case 'rules': await renderRulesSection(content); break;
            // Identity & Access - Fase 26.8
            case 'login-history': await renderLoginHistory(content); break;
            // Financial - Fase 27.0
            case 'financial': await renderFinancialDashboard(content); break;
            case 'reconciliation': await renderReconciliation(content); break;
            // Alerts - Central de Alertas (Rules + System)
            case 'alerts': await renderAlertsSection(content); break;
            // Cognitive Dashboard - Fase 26.5
            case 'cognitive': await renderCognitive(content); break;
            case 'cognitive-agents': await renderCognitiveAgents(content); break;
            case 'cognitive-decisions': await renderCognitiveDecisions(content); break;
            case 'cognitive-noise': await renderCognitiveNoise(content); break;
            case 'cognitive-trust': await renderCognitiveTrust(content); break;
            // Kernel Billing - Fase 28.1
            case 'kernel-billing': await renderKernelBillingAdmin(content); break;
            // Governance - Shadow Mode, Kill Switch, Authority
            case 'governance': await renderGovernance(content); break;
            // Onboarding - Primeira experiência
            case 'onboarding': renderOnboarding(content); break;
            default: content.innerHTML = '<p class="text-gray-500">Seção não encontrada</p>';
        }
        document.getElementById('last-update').textContent = `Atualizado ${new Date().toLocaleTimeString('pt-BR')}`;
    } catch (err) {
        content.innerHTML = `<div class="card rounded-2xl p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-amber-400 mb-4"></i>
            <p class="text-gray-400">${err.message}</p>
        </div>`;
    }
}

function refreshData() {
    const activeSection = document.querySelector('.nav-item.bg-primary\\/20')?.dataset?.section || 'dashboard';
    loadSection(activeSection);
}


// ========================================
// SYSTEM HEALTH - Observabilidade Real
// ========================================

async function renderSystemHealth(container) {
    // Carregar health endpoint real
    const healthData = await api('/health').catch(() => null);
    
    // Carregar dados adicionais em paralelo
    const [dashboard, audit, decisions, subscriptions] = await Promise.all([
        api('/admin/dashboard').catch(() => ({})),
        api('/audit?limit=100').catch(() => []),
        api('/agents/decisions?limit=50').catch(() => []),
        api('/billing/subscriptions?limit=100').catch(() => ({ data: [] }))
    ]);

    // Usar dados do health endpoint se disponível
    const isHealthy = healthData?.status === 'healthy';
    const uptime = healthData?.uptime || '-';
    const version = healthData?.version?.version || '-';
    const services = healthData?.services || {};
    const jobsHealth = healthData?.jobs || { pending: 0, failed: 0, processing: 0, status: 'unknown' };
    const systemInfo = healthData?.system || {};

    // Calcular métricas adicionais
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Erros por módulo (do audit)
    const errors = (audit || []).filter(a => !a.success && new Date(a.created_at).getTime() > now - day);
    const errorsByModule = {};
    errors.forEach(e => {
        const mod = e.type || 'other';
        errorsByModule[mod] = (errorsByModule[mod] || 0) + 1;
    });

    // Agent metrics
    const recentDecisions = (decisions || []).filter(d => new Date(d.created_at).getTime() > now - day);
    const autoDecisions = recentDecisions.filter(d => d.status === 'executed' && !d.approved_by);
    const humanDecisions = recentDecisions.filter(d => d.approved_by);
    const autonomyRate = recentDecisions.length > 0 ? (autoDecisions.length / recentDecisions.length * 100).toFixed(0) : 0;

    // Revenue metrics
    const subs = subscriptions.data || subscriptions || [];
    const activeSubs = subs.filter(s => s.status === 'active');
    const premiumSubs = activeSubs.filter(s => s.plan_id === 'premium');
    const proSubs = activeSubs.filter(s => s.plan_id === 'pro');
    const mrr = (premiumSubs.length * 2990 + proSubs.length * 9990);
    const trialSubs = subs.filter(s => s.status === 'trialing');
    const canceledRecent = subs.filter(s => s.status === 'canceled' && new Date(s.updated_at).getTime() > now - 30 * day);
    const churnRate = activeSubs.length > 0 ? (canceledRecent.length / (activeSubs.length + canceledRecent.length) * 100).toFixed(1) : 0;

    container.innerHTML = `
        <!-- System Status Banner -->
        <div class="bg-gradient-to-r ${isHealthy ? 'from-emerald-500/20 to-emerald-900/20 border-emerald-500' : 'from-amber-500/20 to-amber-900/20 border-amber-500'} border-l-4 rounded-2xl p-6 mb-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'} rounded-2xl flex items-center justify-center">
                        <i class="fas fa-heartbeat text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">${isHealthy ? 'Sistema Saudável' : 'Atenção Necessária'}</h2>
                        <p class="text-gray-400">Uptime: ${uptime} | Versão: ${version}</p>
                    </div>
                </div>
                <button onclick="showSection('health')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">
                    <i class="fas fa-sync-alt mr-2"></i> Atualizar
                </button>
            </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-5 gap-4 mb-6">
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-primary">${systemInfo.num_goroutine || '-'}</p>
                <p class="text-gray-400 text-sm">Goroutines</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-emerald-400">${systemInfo.memory_mb || '-'}MB</p>
                <p class="text-gray-400 text-sm">Memória</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold ${errors.length > 10 ? 'text-rose-400' : 'text-emerald-400'}">${errors.length}</p>
                <p class="text-gray-400 text-sm">Erros (24h)</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold text-amber-400">${jobsHealth.pending}</p>
                <p class="text-gray-400 text-sm">Jobs Pendentes</p>
            </div>
            <div class="card rounded-2xl p-4 text-center">
                <p class="text-3xl font-bold ${jobsHealth.failed > 0 ? 'text-rose-400' : 'text-emerald-400'}">${jobsHealth.failed}</p>
                <p class="text-gray-400 text-sm">Jobs Falhos</p>
            </div>
        </div>

        <div class="grid grid-cols-3 gap-6 mb-6">
            <!-- Services Health -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-server text-primary"></i>
                    Services
                </h3>
                <div class="space-y-3">
                    ${Object.entries(services).map(([name, status]) => `
                        <div class="flex items-center justify-between p-3 rounded-xl ${status === 'healthy' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}">
                            <span class="text-sm capitalize">${name.replace('_', ' ')}</span>
                            <span class="${status === 'healthy' ? 'text-emerald-400' : 'text-rose-400'} text-sm">
                                <i class="fas fa-${status === 'healthy' ? 'check-circle' : 'times-circle'} mr-1"></i>
                                ${status}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Agents Health -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-robot text-purple-400"></i>
                    Agents Health
                </h3>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-400">Autonomia Média</span>
                            <span class="text-purple-400">${autonomyRate}%</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div class="bg-purple-500 rounded-full h-2" style="width: ${autonomyRate}%"></div>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mt-4">
                        <div class="text-center p-3 bg-purple-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-purple-400">${autoDecisions.length}</p>
                            <p class="text-xs text-gray-400">Auto (24h)</p>
                        </div>
                        <div class="text-center p-3 bg-amber-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-amber-400">${humanDecisions.length}</p>
                            <p class="text-xs text-gray-400">Humano (24h)</p>
                        </div>
                    </div>
                    <p class="text-xs text-gray-500 text-center">
                        ${recentDecisions.length} decisões nas últimas 24h
                    </p>
                </div>
            </div>

            <!-- Revenue Health -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-chart-line text-emerald-400"></i>
                    Revenue Health
                </h3>
                <div class="space-y-4">
                    <div class="text-center p-4 bg-emerald-500/10 rounded-xl">
                        <p class="text-3xl font-bold text-emerald-400">${formatCurrency(mrr)}</p>
                        <p class="text-xs text-gray-400">MRR (Monthly Recurring)</p>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div class="text-center p-2 bg-white/5 rounded-lg">
                            <p class="text-lg font-bold">${activeSubs.length}</p>
                            <p class="text-xs text-gray-500">Ativos</p>
                        </div>
                        <div class="text-center p-2 bg-white/5 rounded-lg">
                            <p class="text-lg font-bold text-blue-400">${trialSubs.length}</p>
                            <p class="text-xs text-gray-500">Trials</p>
                        </div>
                        <div class="text-center p-2 bg-white/5 rounded-lg">
                            <p class="text-lg font-bold ${parseFloat(churnRate) > 5 ? 'text-rose-400' : 'text-gray-400'}">${churnRate}%</p>
                            <p class="text-xs text-gray-500">Churn</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Errors by Module -->
        <div class="card rounded-2xl p-6">
            <h3 class="font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-bug text-rose-400"></i>
                Erros por Módulo (24h)
            </h3>
            ${Object.keys(errorsByModule).length > 0 ? `
                <div class="grid grid-cols-6 gap-4">
                    ${Object.entries(errorsByModule).sort((a, b) => b[1] - a[1]).map(([mod, count]) => `
                        <div class="text-center p-3 bg-rose-500/10 rounded-xl">
                            <p class="text-2xl font-bold text-rose-400">${count}</p>
                            <p class="text-xs text-gray-400">${mod}</p>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <p class="text-emerald-400 text-center py-4">
                    <i class="fas fa-check-circle mr-2"></i>
                    Nenhum erro nas últimas 24 horas
                </p>
            `}
        </div>

        <!-- System Info -->
        <div class="card rounded-2xl p-6 mt-6">
            <h3 class="font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-info-circle text-gray-400"></i>
                System Info
            </h3>
            <div class="grid grid-cols-4 gap-4 text-sm">
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-gray-400">Go Version</p>
                    <p class="font-mono">${systemInfo.go_version || '-'}</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-gray-400">CPUs</p>
                    <p class="font-mono">${systemInfo.num_cpu || '-'}</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-gray-400">Timestamp</p>
                    <p class="font-mono">${healthData?.timestamp ? new Date(healthData.timestamp).toLocaleString('pt-BR') : '-'}</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-gray-400">Build</p>
                    <p class="font-mono">${healthData?.version?.build_time || '-'}</p>
                </div>
            </div>
        </div>
    `;
}


// ========================================
// DASHBOARD
// ========================================

async function renderDashboard(container) {
    const stats = await api('/admin/dashboard').catch(() => ({}));
    
    container.innerHTML = `
        <div class="grid grid-cols-4 gap-6 mb-8">
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-400 text-sm">Usuários</span>
                    <i class="fas fa-users text-primary"></i>
                </div>
                <p class="text-3xl font-bold">${stats.total_identities || 0}</p>
            </div>
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-400 text-sm">Volume Total</span>
                    <i class="fas fa-coins text-emerald-400"></i>
                </div>
                <p class="text-3xl font-bold">${formatCurrency(stats.total_ledger_balance)}</p>
            </div>
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-400 text-sm">Jobs Pendentes</span>
                    <i class="fas fa-cogs text-amber-400"></i>
                </div>
                <p class="text-3xl font-bold">${stats.pending_jobs || 0}</p>
            </div>
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-400 text-sm">Jobs Falhos</span>
                    <i class="fas fa-exclamation-triangle text-rose-400"></i>
                </div>
                <p class="text-3xl font-bold">${stats.failed_jobs || 0}</p>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4">Usuários Recentes</h3>
                <div id="recent-users" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">Carregando...</p>
                </div>
            </div>
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4">Status do Sistema</h3>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10">
                        <span class="text-sm">Identity Kernel</span>
                        <span class="text-emerald-400 text-sm"><i class="fas fa-check-circle mr-1"></i> Online</span>
                    </div>
                    <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10">
                        <span class="text-sm">Billing Kernel</span>
                        <span class="text-emerald-400 text-sm"><i class="fas fa-check-circle mr-1"></i> Online</span>
                    </div>
                    <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10">
                        <span class="text-sm">Policy Engine</span>
                        <span class="text-emerald-400 text-sm"><i class="fas fa-check-circle mr-1"></i> Online</span>
                    </div>
                    <div class="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10">
                        <span class="text-sm">Job Queue</span>
                        <span class="text-emerald-400 text-sm"><i class="fas fa-check-circle mr-1"></i> Online</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load recent users
    const usersRes = await api('/admin/users?limit=5').catch(() => ({ data: [] }));
    const recentUsers = document.getElementById('recent-users');
    if (usersRes.data?.length) {
        recentUsers.innerHTML = usersRes.data.map(u => `
            <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5">
                <div class="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-primary text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">${u.profile?.name || u.username || 'Sem nome'}</p>
                    <p class="text-xs text-gray-500">${u.profile?.email || '-'}</p>
                </div>
                <span class="text-xs text-gray-500">${formatDateShort(u.created_at)}</span>
            </div>
        `).join('');
    } else {
        recentUsers.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum usuário</p>';
    }
}

// ========================================
// CRISIS VIEW - Visão de Emergência
// "Tudo que precisa de atenção AGORA"
// ========================================

async function renderCrisisView(container) {
    // Carregar todos os dados de crise em paralelo
    const [killStatus, pendingApprovals, pendingDecisions, failedJobs, activePolicies, shadowStatus] = await Promise.all([
        api('/killswitch/status').catch(() => ({ active_switches: [] })),
        api('/approvals/pending').catch(() => []),
        api('/agents/decisions/pending').catch(() => []),
        api('/admin/jobs?status=failed&limit=10').catch(() => []),
        api('/policies').catch(() => []),
        api('/shadow/status').catch(() => ({ enabled: false }))
    ]);

    const hasKillSwitch = killStatus.active_switches?.length > 0;
    const hasPendingApprovals = pendingApprovals?.length > 0;
    const hasPendingDecisions = pendingDecisions?.length > 0;
    const hasFailedJobs = failedJobs?.length > 0;
    const isShadowMode = shadowStatus.enabled;
    
    // Calcular nível de crise
    let crisisLevel = 'green';
    let crisisCount = 0;
    if (hasKillSwitch) { crisisLevel = 'red'; crisisCount++; }
    if (isShadowMode) { crisisLevel = crisisLevel === 'red' ? 'red' : 'yellow'; crisisCount++; }
    if (hasPendingApprovals) { crisisCount += pendingApprovals.length; }
    if (hasPendingDecisions) { crisisCount += pendingDecisions.length; }
    if (hasFailedJobs) { crisisLevel = crisisLevel === 'green' ? 'yellow' : crisisLevel; crisisCount += failedJobs.length; }

    // Update badge
    if (crisisCount > 0) {
        document.getElementById('crisis-badge').textContent = crisisCount;
        document.getElementById('crisis-badge').classList.remove('hidden');
    } else {
        document.getElementById('crisis-badge').classList.add('hidden');
    }

    const crisisColors = {
        red: 'from-red-500/20 to-red-900/20 border-red-500',
        yellow: 'from-amber-500/20 to-amber-900/20 border-amber-500',
        green: 'from-emerald-500/20 to-emerald-900/20 border-emerald-500'
    };

    container.innerHTML = `
        <!-- Crisis Status Banner -->
        <div class="bg-gradient-to-r ${crisisColors[crisisLevel]} border-l-4 rounded-2xl p-6 mb-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 ${crisisLevel === 'red' ? 'bg-red-500' : crisisLevel === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'} rounded-2xl flex items-center justify-center">
                        <i class="fas fa-${crisisLevel === 'green' ? 'check-circle' : 'exclamation-triangle'} text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold">${crisisLevel === 'red' ? 'ATENÇÃO CRÍTICA' : crisisLevel === 'yellow' ? 'Atenção Necessária' : 'Sistema Operacional'}</h2>
                        <p class="text-gray-400">${crisisCount} ${crisisCount === 1 ? 'item requer' : 'itens requerem'} atenção</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm text-gray-400">Última verificação</p>
                    <p class="font-mono">${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
            <!-- Kill Switch Status -->
            <div class="card rounded-2xl p-6 ${hasKillSwitch ? 'border-2 border-red-500' : ''}">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2">
                        <i class="fas fa-power-off ${hasKillSwitch ? 'text-red-400' : 'text-gray-400'}"></i>
                        Kill Switch
                    </h3>
                    <span class="px-3 py-1 rounded-full text-sm ${hasKillSwitch ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}">
                        ${hasKillSwitch ? 'ATIVO' : 'Inativo'}
                    </span>
                </div>
                ${hasKillSwitch ? `
                    <div class="space-y-2">
                        ${killStatus.active_switches.map(s => `
                            <div class="bg-red-500/10 rounded-xl p-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-medium text-red-400">${s.scope}</span>
                                    <button onclick="showSection('killswitch')" class="text-xs text-gray-400 hover:text-white">Ver detalhes →</button>
                                </div>
                                <p class="text-sm text-gray-400 mt-1">${s.reason}</p>
                                <p class="text-xs text-gray-500 mt-1">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    <strong>Por quê:</strong> Ativado manualmente por admin para ${s.reason}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-gray-500 text-sm">Nenhum kill switch ativo. Sistema operando normalmente.</p>'}
            </div>

            <!-- Shadow Mode Status -->
            <div class="card rounded-2xl p-6 ${isShadowMode ? 'border-2 border-purple-500' : ''}">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2">
                        <i class="fas fa-ghost ${isShadowMode ? 'text-purple-400' : 'text-gray-400'}"></i>
                        Shadow Mode
                    </h3>
                    <span class="px-3 py-1 rounded-full text-sm ${isShadowMode ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}">
                        ${isShadowMode ? 'ATIVO' : 'Inativo'}
                    </span>
                </div>
                ${isShadowMode ? `
                    <div class="bg-purple-500/10 rounded-xl p-3">
                        <p class="text-purple-400 font-medium">Modo de simulação ativo</p>
                        <p class="text-sm text-gray-400 mt-1">Ações de agentes estão sendo simuladas, não executadas.</p>
                        <p class="text-xs text-gray-500 mt-2">
                            <i class="fas fa-info-circle mr-1"></i>
                            <strong>Por quê:</strong> Permite testar comportamento de agentes sem efeitos reais
                        </p>
                        <button onclick="showSection('shadow')" class="text-xs text-purple-400 hover:underline mt-2">Gerenciar →</button>
                    </div>
                ` : '<p class="text-gray-500 text-sm">Shadow mode desativado. Ações são executadas normalmente.</p>'}
            </div>
        </div>

        <!-- Pending Actions -->
        <div class="grid grid-cols-2 gap-6 mt-6">
            <!-- Pending Approvals -->
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2">
                        <i class="fas fa-check-double text-amber-400"></i>
                        Aprovações Pendentes
                        ${hasPendingApprovals ? `<span class="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">${pendingApprovals.length}</span>` : ''}
                    </h3>
                    <button onclick="showSection('approvals')" class="text-xs text-gray-400 hover:text-white">Ver todas →</button>
                </div>
                ${hasPendingApprovals ? `
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${pendingApprovals.slice(0, 5).map(a => `
                            <div class="bg-amber-500/10 rounded-xl p-3 cursor-pointer hover:bg-amber-500/20" onclick="showExplainPanel('approval', '${a.id}')">
                                <div class="flex items-center justify-between">
                                    <span class="font-medium">${a.action_type || a.type}</span>
                                    <span class="text-xs ${getRiskColor(a.risk_score || 0.5)}">${((a.risk_score || 0.5) * 100).toFixed(0)}% risk</span>
                                </div>
                                <p class="text-xs text-gray-400 mt-1">${a.description || 'Aguardando aprovação humana'}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-gray-500 text-sm">Nenhuma aprovação pendente.</p>'}
            </div>

            <!-- Pending Agent Decisions -->
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2">
                        <i class="fas fa-robot text-primary"></i>
                        Decisões de Agentes
                        ${hasPendingDecisions ? `<span class="bg-primary text-white text-xs px-2 py-0.5 rounded-full">${pendingDecisions.length}</span>` : ''}
                    </h3>
                    <button onclick="showSection('agents')" class="text-xs text-gray-400 hover:text-white">Ver todas →</button>
                </div>
                ${hasPendingDecisions ? `
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${pendingDecisions.slice(0, 5).map(d => `
                            <div class="bg-primary/10 rounded-xl p-3 cursor-pointer hover:bg-primary/20" onclick="showExplainPanel('decision', '${d.id}')">
                                <div class="flex items-center justify-between">
                                    <span class="font-medium">${d.proposed_action}</span>
                                    <span class="text-xs ${getRiskColor(d.risk_score || 0.5)}">${((d.risk_score || 0.5) * 100).toFixed(0)}% risk</span>
                                </div>
                                <p class="text-xs text-gray-400 mt-1">${d.reason || 'Decisão proposta por agente'}</p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-gray-500 text-sm">Nenhuma decisão pendente.</p>'}
            </div>
        </div>

        <!-- Failed Jobs & Active Policies -->
        <div class="grid grid-cols-2 gap-6 mt-6">
            <!-- Failed Jobs -->
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-rose-400"></i>
                        Jobs Falhos
                        ${hasFailedJobs ? `<span class="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full">${failedJobs.length}</span>` : ''}
                    </h3>
                    <button onclick="showSection('jobs')" class="text-xs text-gray-400 hover:text-white">Ver todos →</button>
                </div>
                ${hasFailedJobs ? `
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${failedJobs.slice(0, 5).map(j => `
                            <div class="bg-rose-500/10 rounded-xl p-3">
                                <div class="flex items-center justify-between">
                                    <span class="font-medium">${j.type}</span>
                                    <button onclick="retryJob('${j.id}')" class="text-xs text-primary hover:underline">Retry</button>
                                </div>
                                <p class="text-xs text-gray-400 mt-1">ID: ${j.id?.substring(0, 8)}... | Tentativas: ${j.attempts || 0}</p>
                                <p class="text-xs text-gray-500 mt-1">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    <strong>Por quê:</strong> ${j.error || 'Erro durante execução'}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-gray-500 text-sm">Nenhum job falho. Fila saudável.</p>'}
            </div>

            <!-- Active Policies Summary -->
            <div class="card rounded-2xl p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2">
                        <i class="fas fa-gavel text-emerald-400"></i>
                        Políticas Ativas
                    </h3>
                    <button onclick="showSection('policies')" class="text-xs text-gray-400 hover:text-white">Gerenciar →</button>
                </div>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                    ${(activePolicies || []).filter(p => p.is_active).slice(0, 5).map(p => `
                        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                            <div>
                                <span class="text-sm">${p.name}</span>
                                <p class="text-xs text-gray-500">${p.scope}</p>
                            </div>
                            <span class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">${p.value}</span>
                        </div>
                    `).join('') || '<p class="text-gray-500 text-sm">Nenhuma política ativa.</p>'}
                </div>
            </div>
        </div>

        <!-- Explain Panel Modal -->
        <div id="explain-modal" class="fixed inset-0 bg-black/50 z-50 hidden flex items-center justify-center p-4">
            <div class="bg-dark-card rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div class="p-6 border-b border-dark-border flex items-center justify-between">
                    <h3 id="explain-title" class="font-bold text-lg">Detalhes</h3>
                    <button onclick="closeExplainPanel()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="explain-content" class="p-6">
                    <!-- Content loaded dynamically -->
                </div>
            </div>
        </div>
    `;
}

// ========================================
// USERS
// ========================================

async function renderUsers(container) {
    container.innerHTML = `
        <div class="card rounded-2xl">
            <div class="p-4 border-b border-dark-border flex items-center justify-between">
                <input type="text" id="users-search" placeholder="Buscar por nome, email ou username..." 
                    class="bg-dark border border-dark-border rounded-xl px-4 py-2 w-80 focus:border-primary outline-none">
                <span id="users-count" class="text-gray-400 text-sm">Carregando...</span>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="text-left text-gray-400 text-sm border-b border-dark-border">
                            <th class="px-6 py-4">Usuário</th>
                            <th class="px-6 py-4">Email</th>
                            <th class="px-6 py-4">Status</th>
                            <th class="px-6 py-4">Role</th>
                            <th class="px-6 py-4">Criado em</th>
                            <th class="px-6 py-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="users-table">
                        <tr><td colspan="6" class="text-center py-8 text-gray-500">Carregando...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="p-4 border-t border-dark-border flex items-center justify-between">
                <button onclick="loadUsersPage(currentPage - 1)" id="users-prev" class="px-4 py-2 bg-white/5 rounded-xl disabled:opacity-50" disabled>Anterior</button>
                <span id="users-pagination" class="text-gray-400 text-sm">Página 1</span>
                <button onclick="loadUsersPage(currentPage + 1)" id="users-next" class="px-4 py-2 bg-white/5 rounded-xl disabled:opacity-50">Próximo</button>
            </div>
        </div>
    `;

    document.getElementById('users-search')?.addEventListener('input', () => loadUsersPage(1));
    await loadUsersPage(1);
}

async function loadUsersPage(page = 1) {
    currentPage = page;
    const search = document.getElementById('users-search')?.value || '';
    const res = await api(`/admin/users?page=${page}&limit=20&search=${encodeURIComponent(search)}`);
    
    document.getElementById('users-count').textContent = `${res.total || 0} usuários`;
    document.getElementById('users-pagination').textContent = `Página ${page} de ${res.total_pages || 1}`;
    document.getElementById('users-prev').disabled = page <= 1;
    document.getElementById('users-next').disabled = page >= (res.total_pages || 1);

    const tbody = document.getElementById('users-table');
    if (res.data?.length) {
        tbody.innerHTML = res.data.map(u => `
            <tr class="table-row border-b border-dark-border">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3 cursor-pointer hover:text-primary" onclick="showExplainPanel('user', '${u.id}')">
                        <div class="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-primary text-sm"></i>
                        </div>
                        <div>
                            <p class="font-medium">${u.profile?.name || u.username || 'Sem nome'}</p>
                            <p class="text-xs text-gray-500">${u.id?.substring(0, 8)}...</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-400">${u.profile?.email || '-'}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(u.status || u.account_status)} cursor-pointer" onclick="showExplainPanel('user', '${u.id}')" title="Clique para ver detalhes">${u.status || u.account_status || 'active'}</span>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-full text-xs ${getRoleColor(u.role)}">${u.role || 'user'}</span>
                </td>
                <td class="px-6 py-4 text-gray-400 text-sm">${formatDate(u.created_at)}</td>
                <td class="px-6 py-4">
                    <div class="flex gap-2">
                        <button onclick="showExplainPanel('user', '${u.id}')" class="text-gray-400 hover:text-white" title="Ver detalhes"><i class="fas fa-eye"></i></button>
                        ${(u.status === 'active' || u.account_status === 'active') ? `<button onclick="suspendUser('${u.id}')" class="text-amber-400 hover:text-amber-300" title="Suspender"><i class="fas fa-pause"></i></button>` : ''}
                        ${(u.status === 'suspended' || u.account_status === 'suspended') ? `<button onclick="reactivateUser('${u.id}')" class="text-emerald-400 hover:text-emerald-300" title="Reativar"><i class="fas fa-play"></i></button>` : ''}
                        ${u.role === 'user' && isSuperAdmin() ? `<button onclick="promoteToAdmin('${u.id}')" class="text-primary hover:text-primary/80" title="Promover a Admin"><i class="fas fa-shield"></i></button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-500">Nenhum usuário encontrado</td></tr>';
    }
}

async function suspendUser(id) {
    if (!confirm('Suspender este usuário?')) return;
    try {
        await api(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason: 'Admin action' }) });
        toast('Usuário suspenso', 'success');
        loadUsersPage(currentPage);
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function reactivateUser(id) {
    try {
        await api(`/admin/users/${id}/reactivate`, { method: 'POST' });
        toast('Usuário reativado', 'success');
        loadUsersPage(currentPage);
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function promoteToAdmin(id) {
    if (!confirm('Promover este usuário a Admin?')) return;
    try {
        await api(`/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role: 'admin' }) });
        toast('Usuário promovido a Admin', 'success');
        loadUsersPage(currentPage);
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ========================================
// SUBSCRIPTIONS
// ========================================

async function renderSubscriptions(container) {
    container.innerHTML = `
        <div class="card rounded-2xl">
            <div class="p-4 border-b border-dark-border flex items-center justify-between">
                <select id="sub-filter" class="bg-dark border border-dark-border rounded-xl px-4 py-2">
                    <option value="">Todos os status</option>
                    <option value="active">Ativas</option>
                    <option value="canceled">Canceladas</option>
                    <option value="past_due">Vencidas</option>
                </select>
                <span id="sub-count" class="text-gray-400 text-sm">Carregando...</span>
            </div>
            <div id="subscriptions-list" class="divide-y divide-dark-border">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    document.getElementById('sub-filter')?.addEventListener('change', loadSubscriptions);
    await loadSubscriptions();
}

async function loadSubscriptions() {
    const status = document.getElementById('sub-filter')?.value || '';
    // Try to get subscriptions from billing endpoint
    const res = await api(`/billing/subscriptions?status=${status}&limit=50`).catch(() => ({ data: [] }));
    
    const list = document.getElementById('subscriptions-list');
    const data = res.data || res || [];
    
    document.getElementById('sub-count').textContent = `${data.length} subscriptions`;
    
    if (data.length) {
        list.innerHTML = data.map(s => `
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-id-card text-primary"></i>
                    </div>
                    <div>
                        <p class="font-medium">${s.plan_id || s.plan || 'Plano'}</p>
                        <p class="text-xs text-gray-500">User: ${s.user_id?.substring(0, 8) || s.billing_account_id?.substring(0, 8)}...</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-xs ${getSubStatusColor(s.status)}">${s.status}</span>
                    <p class="text-xs text-gray-500 mt-1">${formatDate(s.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma subscription encontrada</p>';
    }
}


// ========================================
// BILLING
// ========================================

async function renderBilling(container) {
    container.innerHTML = `
        <div class="grid grid-cols-3 gap-6 mb-6">
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Billing Accounts</p>
                <p id="billing-accounts" class="text-3xl font-bold">-</p>
            </div>
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Pagamentos (30 dias)</p>
                <p id="billing-payments" class="text-3xl font-bold text-emerald-400">-</p>
            </div>
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Receita (30 dias)</p>
                <p id="billing-revenue" class="text-3xl font-bold text-emerald-400">-</p>
            </div>
        </div>
        <div class="card rounded-2xl">
            <div class="p-4 border-b border-dark-border">
                <h3 class="font-bold">Pagamentos Recentes</h3>
            </div>
            <div id="payments-list" class="divide-y divide-dark-border">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    // Load billing stats
    const overview = await api('/admin/economy/overview').catch(() => ({}));
    document.getElementById('billing-accounts').textContent = overview.total_accounts || '-';
    document.getElementById('billing-payments').textContent = overview.total_payments || '-';
    document.getElementById('billing-revenue').textContent = formatCurrency(overview.total_revenue || 0);

    // Load payments
    const payments = await api('/admin/payments?limit=20').catch(() => ({ data: [] }));
    const list = document.getElementById('payments-list');
    const data = payments.data || payments || [];
    
    if (data.length) {
        list.innerHTML = data.map(p => `
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="font-medium">${formatCurrency(p.amount)}</p>
                    <p class="text-sm text-gray-500">${p.description || 'Pagamento'}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(p.status)}">${p.status}</span>
                    <p class="text-xs text-gray-500 mt-1">${formatDate(p.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum pagamento</p>';
    }
}

// ========================================
// LEDGER
// ========================================

async function renderLedger(container) {
    const overview = await api('/admin/economy/overview').catch(() => ({}));
    
    container.innerHTML = `
        <div class="grid grid-cols-3 gap-6 mb-6">
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Saldo Total</p>
                <p class="text-3xl font-bold text-emerald-400">${formatCurrency(overview.total_balance)}</p>
            </div>
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Créditos (30 dias)</p>
                <p class="text-3xl font-bold text-emerald-400">${formatCurrency(overview.total_credits)}</p>
            </div>
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Débitos (30 dias)</p>
                <p class="text-3xl font-bold text-rose-400">${formatCurrency(overview.total_debits)}</p>
            </div>
        </div>
        <div class="card rounded-2xl">
            <div class="p-4 border-b border-dark-border">
                <h3 class="font-bold">Entradas do Ledger</h3>
            </div>
            <div id="ledger-entries" class="divide-y divide-dark-border max-h-96 overflow-y-auto">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    const ledger = await api('/admin/ledger?limit=50').catch(() => ({ data: [] }));
    const list = document.getElementById('ledger-entries');
    const data = ledger.data || ledger || [];
    
    if (data.length) {
        list.innerHTML = data.map(e => `
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full ${e.type === 'credit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'} flex items-center justify-center">
                        <i class="fas ${e.type === 'credit' ? 'fa-arrow-down text-emerald-400' : 'fa-arrow-up text-rose-400'}"></i>
                    </div>
                    <div>
                        <p class="text-sm">${e.description || e.type}</p>
                        <p class="text-xs text-gray-500">${e.account_id?.substring(0, 8)}...</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="${e.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'} font-medium">${e.type === 'credit' ? '+' : '-'}${formatCurrency(e.amount)}</p>
                    <p class="text-xs text-gray-500">${formatDate(e.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma entrada</p>';
    }
}

// ========================================
// KILL SWITCH
// ========================================

async function renderKillSwitch(container) {
    if (!isSuperAdmin()) {
        container.innerHTML = `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-lock text-4xl text-gray-500 mb-4"></i>
                <p class="text-gray-400">Acesso restrito a Super Admin</p>
            </div>
        `;
        return;
    }

    const status = await api('/killswitch/status').catch(() => ({ active_switches: [] }));
    const hasActive = status.active_switches?.length > 0;

    container.innerHTML = `
        <div class="card rounded-2xl p-6 mb-6 ${hasActive ? 'border-2 border-red-500 killswitch-active' : ''}">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 ${hasActive ? 'bg-red-500' : 'bg-gray-700'} rounded-2xl flex items-center justify-center">
                        <i class="fas fa-power-off text-3xl ${hasActive ? 'text-white' : 'text-gray-400'}"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold">${hasActive ? 'KILL SWITCH ATIVO' : 'Sistema Operacional'}</h3>
                        <p class="text-gray-400">${hasActive ? 'Operações bloqueadas' : 'Todas as operações permitidas'}</p>
                    </div>
                </div>
                ${hasActive ? `
                    <button onclick="deactivateKillSwitch()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">
                        <i class="fas fa-play mr-2"></i> Desativar
                    </button>
                ` : `
                    <button onclick="showActivateKillSwitch()" class="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold">
                        <i class="fas fa-power-off mr-2"></i> Ativar Kill Switch
                    </button>
                `}
            </div>
            ${hasActive ? `
                <div class="bg-red-500/10 rounded-xl p-4">
                    <h4 class="font-bold text-red-400 mb-2">Switches Ativos:</h4>
                    ${status.active_switches.map(s => `
                        <div class="flex items-center justify-between py-2 border-b border-red-500/20 last:border-0">
                            <div>
                                <span class="font-medium">${s.scope}</span>
                                <p class="text-sm text-gray-400">${s.reason}</p>
                            </div>
                            <span class="text-xs text-gray-500">Expira: ${s.expires_at ? formatDate(s.expires_at) : 'Nunca'}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <div id="activate-ks-form" class="card rounded-2xl p-6 hidden">
            <h3 class="font-bold mb-4">Ativar Kill Switch</h3>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Escopo</label>
                    <select id="ks-scope" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                        <option value="global">Global (todo o sistema)</option>
                        <option value="billing">Billing (pagamentos)</option>
                        <option value="agents">Agents (ações de agentes)</option>
                        <option value="identity">Identity (autenticação)</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Motivo</label>
                    <input type="text" id="ks-reason" placeholder="Ex: Manutenção de emergência" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Duração (minutos, 0 = indefinido)</label>
                    <input type="number" id="ks-duration" value="60" min="0"
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div class="flex gap-4">
                    <button onclick="activateKillSwitch()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold">
                        <i class="fas fa-exclamation-triangle mr-2"></i> CONFIRMAR ATIVAÇÃO
                    </button>
                    <button onclick="hideActivateKillSwitch()" class="px-6 py-3 bg-gray-700 rounded-xl">Cancelar</button>
                </div>
            </div>
        </div>

        <div class="card rounded-2xl p-6">
            <h3 class="font-bold mb-4">Histórico de Kill Switches</h3>
            <div id="ks-history" class="space-y-2">
                <p class="text-gray-500 text-center py-4">Carregando...</p>
            </div>
        </div>
    `;

    // Load history
    const history = await api('/killswitch/history?limit=20').catch(() => []);
    const historyEl = document.getElementById('ks-history');
    if (history?.length) {
        historyEl.innerHTML = history.map(h => `
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5">
                <div>
                    <span class="font-medium">${h.scope}</span>
                    <p class="text-xs text-gray-500">${h.reason}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-xs ${h.is_active ? 'bg-red-500/20 text-red-400' : 'bg-gray-500/20 text-gray-400'}">${h.is_active ? 'Ativo' : 'Inativo'}</span>
                    <p class="text-xs text-gray-500">${formatDate(h.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        historyEl.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum histórico</p>';
    }
}

function showActivateKillSwitch() {
    document.getElementById('activate-ks-form')?.classList.remove('hidden');
}

function hideActivateKillSwitch() {
    document.getElementById('activate-ks-form')?.classList.add('hidden');
}

async function activateKillSwitch() {
    const scope = document.getElementById('ks-scope').value;
    const reason = document.getElementById('ks-reason').value;
    const duration = parseInt(document.getElementById('ks-duration').value) || 0;

    if (!reason) {
        toast('Informe o motivo', 'error');
        return;
    }

    if (!confirm(`ATENÇÃO: Você está prestes a ativar o Kill Switch para "${scope}". Isso bloqueará operações. Continuar?`)) {
        return;
    }

    try {
        await api('/killswitch/activate', {
            method: 'POST',
            body: JSON.stringify({ scope, reason, duration_minutes: duration })
        });
        toast('Kill Switch ativado!', 'warning');
        checkKillSwitchStatus();
        showSection('killswitch');
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function deactivateKillSwitch() {
    if (!confirm('Desativar todos os Kill Switches ativos?')) return;
    
    try {
        await api('/killswitch/deactivate', { method: 'POST' });
        toast('Kill Switch desativado', 'success');
        checkKillSwitchStatus();
        showSection('killswitch');
    } catch (err) {
        toast(err.message, 'error');
    }
}


// ========================================
// POLICIES
// ========================================

async function renderPolicies(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <p class="text-gray-400">Regras que governam o comportamento do sistema</p>
            <button onclick="showCreatePolicy()" class="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl">
                <i class="fas fa-plus mr-2"></i> Nova Policy
            </button>
        </div>

        <div id="create-policy-form" class="card rounded-2xl p-6 mb-6 hidden">
            <h3 class="font-bold mb-4">Criar Nova Policy</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Nome</label>
                    <input type="text" id="policy-name" placeholder="ex: max_daily_transactions" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Tipo</label>
                    <select id="policy-type" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                        <option value="limit">Limite</option>
                        <option value="threshold">Threshold</option>
                        <option value="boolean">Boolean</option>
                        <option value="allowlist">Allowlist</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Escopo</label>
                    <select id="policy-scope" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                        <option value="global">Global</option>
                        <option value="billing">Billing</option>
                        <option value="agents">Agents</option>
                        <option value="identity">Identity</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Valor</label>
                    <input type="text" id="policy-value" placeholder="ex: 1000 ou true" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div class="col-span-2">
                    <label class="block text-sm text-gray-400 mb-2">Descrição</label>
                    <input type="text" id="policy-description" placeholder="Descrição da policy" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
            </div>
            <div class="flex gap-4 mt-4">
                <button onclick="createPolicy()" class="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-xl">Criar</button>
                <button onclick="hideCreatePolicy()" class="px-6 py-3 bg-gray-700 rounded-xl">Cancelar</button>
            </div>
        </div>

        <div class="card rounded-2xl">
            <div id="policies-list" class="divide-y divide-dark-border">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    await loadPolicies();
}

async function loadPolicies() {
    const policies = await api('/policies').catch(() => []);
    const list = document.getElementById('policies-list');
    
    if (policies?.length) {
        list.innerHTML = policies.map(p => `
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 ${p.is_active ? 'bg-emerald-500/20' : 'bg-gray-500/20'} rounded-xl flex items-center justify-center">
                        <i class="fas fa-gavel ${p.is_active ? 'text-emerald-400' : 'text-gray-400'}"></i>
                    </div>
                    <div>
                        <p class="font-medium">${p.name}</p>
                        <p class="text-xs text-gray-500">${p.description || p.scope}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm">${p.value}</span>
                    <span class="px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">${p.is_active ? 'Ativa' : 'Inativa'}</span>
                    <button onclick="togglePolicy('${p.id}', ${!p.is_active})" class="text-gray-400 hover:text-white">
                        <i class="fas fa-${p.is_active ? 'pause' : 'play'}"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma policy</p>';
    }
}

function showCreatePolicy() {
    document.getElementById('create-policy-form')?.classList.remove('hidden');
}

function hideCreatePolicy() {
    document.getElementById('create-policy-form')?.classList.add('hidden');
}

async function createPolicy() {
    const name = document.getElementById('policy-name').value;
    const type = document.getElementById('policy-type').value;
    const scope = document.getElementById('policy-scope').value;
    const value = document.getElementById('policy-value').value;
    const description = document.getElementById('policy-description').value;

    if (!name || !value) {
        toast('Preencha nome e valor', 'error');
        return;
    }

    try {
        await api('/policies', {
            method: 'POST',
            body: JSON.stringify({ name, type, scope, value, description, is_active: true })
        });
        toast('Policy criada', 'success');
        hideCreatePolicy();
        loadPolicies();
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function togglePolicy(id, activate) {
    try {
        await api(`/policies/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: activate })
        });
        toast(`Policy ${activate ? 'ativada' : 'desativada'}`, 'success');
        loadPolicies();
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ========================================
// APPROVALS
// ========================================

async function renderApprovals(container) {
    container.innerHTML = `
        <div class="grid grid-cols-3 gap-6 mb-6">
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Pendentes</p>
                <p id="approvals-pending" class="text-3xl font-bold text-amber-400">-</p>
            </div>
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Aprovadas (7 dias)</p>
                <p id="approvals-approved" class="text-3xl font-bold text-emerald-400">-</p>
            </div>
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Rejeitadas (7 dias)</p>
                <p id="approvals-rejected" class="text-3xl font-bold text-rose-400">-</p>
            </div>
        </div>

        <div class="card rounded-2xl p-6 mb-6">
            <h3 class="font-bold mb-4">Aprovações Pendentes</h3>
            <div id="pending-approvals" class="space-y-4">
                <p class="text-gray-500 text-center py-4">Carregando...</p>
            </div>
        </div>

        <div class="card rounded-2xl p-6">
            <h3 class="font-bold mb-4">Histórico de Aprovações</h3>
            <div id="approvals-history" class="space-y-2 max-h-96 overflow-y-auto">
                <p class="text-gray-500 text-center py-4">Carregando...</p>
            </div>
        </div>
    `;

    // Load pending
    const pending = await api('/approvals/pending').catch(() => []);
    const pendingEl = document.getElementById('pending-approvals');
    document.getElementById('approvals-pending').textContent = pending?.length || 0;
    
    if (pending?.length) {
        document.getElementById('approvals-badge').textContent = pending.length;
        document.getElementById('approvals-badge').classList.remove('hidden');
        
        pendingEl.innerHTML = pending.map(a => `
            <div class="card rounded-xl p-4 border-l-4 ${getRiskBorderColor(a.risk_score || 0.5)}">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">${a.action_type || a.type}</span>
                    <span class="px-2 py-1 rounded-full text-xs ${getRiskColor(a.risk_score || 0.5)}">Risk: ${((a.risk_score || 0.5) * 100).toFixed(0)}%</span>
                </div>
                <p class="text-sm text-gray-400 mb-3">${a.description || a.reason || 'Sem descrição'}</p>
                <div class="flex gap-2">
                    <button onclick="approveRequest('${a.id}')" class="flex-1 bg-emerald-500/20 text-emerald-400 py-2 rounded-lg text-sm hover:bg-emerald-500/30">
                        <i class="fas fa-check mr-1"></i> Aprovar
                    </button>
                    <button onclick="rejectRequest('${a.id}')" class="flex-1 bg-rose-500/20 text-rose-400 py-2 rounded-lg text-sm hover:bg-rose-500/30">
                        <i class="fas fa-times mr-1"></i> Rejeitar
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        document.getElementById('approvals-badge').classList.add('hidden');
        pendingEl.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma aprovação pendente</p>';
    }

    // Load history
    const history = await api('/approvals?limit=30').catch(() => []);
    const historyEl = document.getElementById('approvals-history');
    const approved = history?.filter(h => h.status === 'approved')?.length || 0;
    const rejected = history?.filter(h => h.status === 'rejected')?.length || 0;
    
    document.getElementById('approvals-approved').textContent = approved;
    document.getElementById('approvals-rejected').textContent = rejected;
    
    if (history?.length) {
        historyEl.innerHTML = history.map(h => `
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5">
                <div>
                    <span class="font-medium">${h.action_type || h.type}</span>
                    <p class="text-xs text-gray-500">${h.approved_by || 'Sistema'}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-xs ${getApprovalStatusColor(h.status)}">${h.status}</span>
                    <p class="text-xs text-gray-500">${formatDate(h.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        historyEl.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum histórico</p>';
    }
}

async function approveRequest(id) {
    try {
        await api(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ note: 'Approved via Console' }) });
        toast('Aprovado', 'success');
        showSection('approvals');
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function rejectRequest(id) {
    const note = prompt('Motivo da rejeição:') || '';
    try {
        await api(`/approvals/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) });
        toast('Rejeitado', 'info');
        showSection('approvals');
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ========================================
// AUTHORITY
// ========================================

async function renderAuthority(container) {
    if (!isSuperAdmin()) {
        container.innerHTML = `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-lock text-4xl text-gray-500 mb-4"></i>
                <p class="text-gray-400">Acesso restrito a Super Admin</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <p class="text-gray-400">Defina quem pode aprovar o quê no sistema</p>
            <button onclick="showCreateAuthority()" class="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl">
                <i class="fas fa-plus mr-2"></i> Nova Autoridade
            </button>
        </div>

        <div id="create-authority-form" class="card rounded-2xl p-6 mb-6 hidden">
            <h3 class="font-bold mb-4">Criar Nova Autoridade</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-2">User ID</label>
                    <input type="text" id="auth-user-id" placeholder="UUID do usuário" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Escopo</label>
                    <select id="auth-scope" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                        <option value="billing">Billing</option>
                        <option value="agents">Agents</option>
                        <option value="identity">Identity</option>
                        <option value="system">System</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Nível</label>
                    <select id="auth-level" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                        <option value="1">1 - Básico</option>
                        <option value="2">2 - Intermediário</option>
                        <option value="3">3 - Avançado</option>
                        <option value="4">4 - Crítico</option>
                        <option value="5">5 - Supremo</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Limite Diário</label>
                    <input type="number" id="auth-limit" value="10" min="1"
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
            </div>
            <div class="flex gap-4 mt-4">
                <button onclick="createAuthority()" class="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-xl">Criar</button>
                <button onclick="hideCreateAuthority()" class="px-6 py-3 bg-gray-700 rounded-xl">Cancelar</button>
            </div>
        </div>

        <div class="card rounded-2xl">
            <div id="authority-list" class="divide-y divide-dark-border">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    await loadAuthorities();
}

async function loadAuthorities() {
    const authorities = await api('/authority').catch(() => []);
    const list = document.getElementById('authority-list');
    
    if (authorities?.length) {
        list.innerHTML = authorities.map(a => `
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                        <i class="fas fa-user-shield text-primary"></i>
                    </div>
                    <div>
                        <p class="font-medium">${a.user_id?.substring(0, 8)}...</p>
                        <p class="text-xs text-gray-500">Escopo: ${a.scope}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-sm">Nível ${a.level}</span>
                    <span class="text-sm text-gray-400">${a.daily_limit}/dia</span>
                    <button onclick="revokeAuthority('${a.id}')" class="text-rose-400 hover:text-rose-300">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma autoridade configurada</p>';
    }
}

function showCreateAuthority() {
    document.getElementById('create-authority-form')?.classList.remove('hidden');
}

function hideCreateAuthority() {
    document.getElementById('create-authority-form')?.classList.add('hidden');
}

async function createAuthority() {
    const user_id = document.getElementById('auth-user-id').value;
    const scope = document.getElementById('auth-scope').value;
    const level = parseInt(document.getElementById('auth-level').value);
    const daily_limit = parseInt(document.getElementById('auth-limit').value);

    if (!user_id) {
        toast('Informe o User ID', 'error');
        return;
    }

    try {
        await api('/authority', {
            method: 'POST',
            body: JSON.stringify({ user_id, scope, level, daily_limit })
        });
        toast('Autoridade criada', 'success');
        hideCreateAuthority();
        loadAuthorities();
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function revokeAuthority(id) {
    if (!confirm('Revogar esta autoridade?')) return;
    try {
        await api(`/authority/${id}`, { method: 'DELETE' });
        toast('Autoridade revogada', 'success');
        loadAuthorities();
    } catch (err) {
        toast(err.message, 'error');
    }
}


// ========================================
// AUTONOMY MATRIX
// ========================================

async function renderAutonomy(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <p class="text-gray-400">Matriz de autonomia define o que agentes podem fazer automaticamente</p>
            <button onclick="showCreateAutonomy()" class="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl">
                <i class="fas fa-plus mr-2"></i> Novo Perfil
            </button>
        </div>

        <div id="create-autonomy-form" class="card rounded-2xl p-6 mb-6 hidden">
            <h3 class="font-bold mb-4">Criar Perfil de Autonomia</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Nome do Perfil</label>
                    <input type="text" id="autonomy-name" placeholder="ex: conservative, aggressive" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Tipo de Ação</label>
                    <input type="text" id="autonomy-action" placeholder="ex: billing.charge, agent.execute" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Threshold de Risco (0-1)</label>
                    <input type="number" id="autonomy-threshold" value="0.3" min="0" max="1" step="0.1"
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Requer Aprovação?</label>
                    <select id="autonomy-approval" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                        <option value="false">Não</option>
                        <option value="true">Sim</option>
                    </select>
                </div>
            </div>
            <div class="flex gap-4 mt-4">
                <button onclick="createAutonomy()" class="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-xl">Criar</button>
                <button onclick="hideCreateAutonomy()" class="px-6 py-3 bg-gray-700 rounded-xl">Cancelar</button>
            </div>
        </div>

        <div class="card rounded-2xl">
            <div id="autonomy-list" class="divide-y divide-dark-border">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    await loadAutonomy();
}

async function loadAutonomy() {
    const profiles = await api('/autonomy/profiles').catch(() => []);
    const list = document.getElementById('autonomy-list');
    
    if (profiles?.length) {
        list.innerHTML = profiles.map(p => `
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                        <i class="fas fa-robot text-primary"></i>
                    </div>
                    <div>
                        <p class="font-medium">${p.name || p.profile_name}</p>
                        <p class="text-xs text-gray-500">Ação: ${p.action_type}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="px-3 py-1 ${getRiskColor(p.risk_threshold)} rounded-lg text-sm">Threshold: ${(p.risk_threshold * 100).toFixed(0)}%</span>
                    <span class="px-2 py-1 rounded-full text-xs ${p.requires_approval ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}">
                        ${p.requires_approval ? 'Requer Aprovação' : 'Auto'}
                    </span>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum perfil de autonomia</p>';
    }
}

function showCreateAutonomy() {
    document.getElementById('create-autonomy-form')?.classList.remove('hidden');
}

function hideCreateAutonomy() {
    document.getElementById('create-autonomy-form')?.classList.add('hidden');
}

async function createAutonomy() {
    const name = document.getElementById('autonomy-name').value;
    const action_type = document.getElementById('autonomy-action').value;
    const risk_threshold = parseFloat(document.getElementById('autonomy-threshold').value);
    const requires_approval = document.getElementById('autonomy-approval').value === 'true';

    if (!name || !action_type) {
        toast('Preencha nome e tipo de ação', 'error');
        return;
    }

    try {
        await api('/autonomy/profiles', {
            method: 'POST',
            body: JSON.stringify({ name, action_type, risk_threshold, requires_approval })
        });
        toast('Perfil criado', 'success');
        hideCreateAutonomy();
        loadAutonomy();
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ========================================
// SHADOW MODE
// ========================================

async function renderShadow(container) {
    const status = await api('/shadow/status').catch(() => ({ enabled: false }));
    
    container.innerHTML = `
        <div class="card rounded-2xl p-6 mb-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-16 h-16 ${status.enabled ? 'bg-purple-500' : 'bg-gray-700'} rounded-2xl flex items-center justify-center">
                        <i class="fas fa-ghost text-3xl ${status.enabled ? 'text-white' : 'text-gray-400'}"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-bold">${status.enabled ? 'Shadow Mode ATIVO' : 'Shadow Mode Desativado'}</h3>
                        <p class="text-gray-400">${status.enabled ? 'Ações são simuladas, não executadas' : 'Ações são executadas normalmente'}</p>
                    </div>
                </div>
                <button onclick="toggleShadowMode(${!status.enabled})" class="${status.enabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-500 hover:bg-purple-600'} text-white px-6 py-3 rounded-xl font-bold">
                    <i class="fas fa-${status.enabled ? 'sun' : 'moon'} mr-2"></i> ${status.enabled ? 'Desativar' : 'Ativar Shadow'}
                </button>
            </div>
        </div>

        <div class="card rounded-2xl p-6">
            <h3 class="font-bold mb-4">Execuções Shadow (Simuladas)</h3>
            <div id="shadow-executions" class="space-y-2 max-h-96 overflow-y-auto">
                <p class="text-gray-500 text-center py-4">Carregando...</p>
            </div>
        </div>
    `;

    // Load shadow executions
    const executions = await api('/shadow/executions?limit=50').catch(() => []);
    const list = document.getElementById('shadow-executions');
    
    if (executions?.length) {
        list.innerHTML = executions.map(e => `
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border-l-4 border-purple-500">
                <div>
                    <span class="font-medium">${e.action_type}</span>
                    <p class="text-xs text-gray-500">${e.agent_id?.substring(0, 8) || 'Sistema'}...</p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">Shadow</span>
                    <p class="text-xs text-gray-500">${formatDate(e.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma execução shadow</p>';
    }
}

async function toggleShadowMode(enable) {
    try {
        await api(`/shadow/${enable ? 'enable' : 'disable'}`, { method: 'POST' });
        toast(`Shadow Mode ${enable ? 'ativado' : 'desativado'}`, enable ? 'warning' : 'success');
        showSection('shadow');
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ========================================
// AGENTS
// ========================================

async function renderAgents(container) {
    container.innerHTML = `
        <div class="card rounded-2xl p-6 mb-6">
            <h3 class="font-bold mb-4">Decisões Pendentes</h3>
            <div id="pending-decisions" class="space-y-4">
                <p class="text-gray-500 text-center py-4">Carregando...</p>
            </div>
        </div>

        <div class="card rounded-2xl p-6">
            <h3 class="font-bold mb-4">Histórico de Decisões</h3>
            <div id="decisions-history" class="space-y-2 max-h-96 overflow-y-auto">
                <p class="text-gray-500 text-center py-4">Carregando...</p>
            </div>
        </div>
    `;

    // Load pending
    const pending = await api('/agents/decisions/pending').catch(() => []);
    const pendingEl = document.getElementById('pending-decisions');
    
    if (pending?.length) {
        pendingEl.innerHTML = pending.map(d => `
            <div class="card rounded-xl p-4 border-l-4 ${getRiskBorderColor(d.risk_score || 0.5)}">
                <div class="flex items-center justify-between mb-2">
                    <span class="font-medium">${d.proposed_action}</span>
                    <span class="px-2 py-1 rounded-full text-xs ${getRiskColor(d.risk_score || 0.5)}">Risk: ${((d.risk_score || 0.5) * 100).toFixed(0)}%</span>
                </div>
                <p class="text-sm text-gray-400 mb-3">${d.reason || 'Sem justificativa'}</p>
                <div class="flex gap-2">
                    <button onclick="approveDecision('${d.id}')" class="flex-1 bg-emerald-500/20 text-emerald-400 py-2 rounded-lg text-sm hover:bg-emerald-500/30">Aprovar</button>
                    <button onclick="rejectDecision('${d.id}')" class="flex-1 bg-rose-500/20 text-rose-400 py-2 rounded-lg text-sm hover:bg-rose-500/30">Rejeitar</button>
                </div>
            </div>
        `).join('');
    } else {
        pendingEl.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma decisão pendente</p>';
    }

    // Load history
    const history = await api('/agents/decisions?limit=30').catch(() => []);
    const historyEl = document.getElementById('decisions-history');
    
    if (history?.length) {
        historyEl.innerHTML = history.map(d => `
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5">
                <div>
                    <span class="font-medium">${d.proposed_action}</span>
                    <p class="text-xs text-gray-500">${formatDate(d.created_at)}</p>
                </div>
                <span class="px-2 py-1 rounded-full text-xs ${getDecisionStatusColor(d.status)}">${d.status}</span>
            </div>
        `).join('');
    } else {
        historyEl.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum histórico</p>';
    }
}

async function approveDecision(id) {
    try {
        await api(`/agents/decisions/${id}/approve`, { method: 'POST', body: JSON.stringify({ note: 'Approved via Console' }) });
        toast('Decisão aprovada', 'success');
        showSection('agents');
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function rejectDecision(id) {
    const note = prompt('Motivo da rejeição:') || '';
    try {
        await api(`/agents/decisions/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) });
        toast('Decisão rejeitada', 'info');
        showSection('agents');
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ========================================
// MEMORY
// ========================================

async function renderMemory(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <p class="text-gray-400">Memória institucional - decisões e precedentes do sistema</p>
        </div>

        <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Total de Memórias</p>
                <p id="memory-total" class="text-3xl font-bold">-</p>
            </div>
            <div class="card rounded-2xl p-6">
                <p class="text-gray-400 text-sm mb-2">Precedentes Ativos</p>
                <p id="memory-precedents" class="text-3xl font-bold text-primary">-</p>
            </div>
        </div>

        <div class="card rounded-2xl p-6">
            <h3 class="font-bold mb-4">Memórias Recentes</h3>
            <div id="memory-list" class="space-y-2 max-h-96 overflow-y-auto">
                <p class="text-gray-500 text-center py-4">Carregando...</p>
            </div>
        </div>
    `;

    const memories = await api('/memory?limit=50').catch(() => []);
    const list = document.getElementById('memory-list');
    
    document.getElementById('memory-total').textContent = memories?.length || 0;
    document.getElementById('memory-precedents').textContent = memories?.filter(m => m.is_precedent)?.length || 0;
    
    if (memories?.length) {
        list.innerHTML = memories.map(m => `
            <div class="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 ${m.is_precedent ? 'border-l-4 border-primary' : ''}">
                <div>
                    <span class="font-medium">${m.type || m.action_type}</span>
                    <p class="text-xs text-gray-500">${m.description || m.context?.substring(0, 50) || '-'}...</p>
                </div>
                <div class="text-right">
                    ${m.is_precedent ? '<span class="px-2 py-1 rounded-full text-xs bg-primary/20 text-primary mr-2">Precedente</span>' : ''}
                    <p class="text-xs text-gray-500">${formatDate(m.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhuma memória</p>';
    }
}

// ========================================
// AUDIT
// ========================================

async function renderAudit(container) {
    container.innerHTML = `
        <div class="card rounded-2xl mb-6">
            <div class="p-4 border-b border-dark-border flex items-center gap-4">
                <select id="audit-filter" class="bg-dark border border-dark-border rounded-xl px-4 py-2">
                    <option value="">Todos os tipos</option>
                    <option value="auth">Autenticação</option>
                    <option value="billing">Billing</option>
                    <option value="agent">Agentes</option>
                    <option value="admin">Admin</option>
                    <option value="policy">Políticas</option>
                    <option value="killswitch">Kill Switch</option>
                </select>
                <input type="text" id="audit-search" placeholder="Buscar por user_id ou ação..." 
                    class="flex-1 bg-dark border border-dark-border rounded-xl px-4 py-2">
            </div>
            <div id="audit-list" class="divide-y divide-dark-border max-h-[600px] overflow-y-auto">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    document.getElementById('audit-filter')?.addEventListener('change', loadAuditLogs);
    document.getElementById('audit-search')?.addEventListener('input', debounce(loadAuditLogs, 300));
    await loadAuditLogs();
}

async function loadAuditLogs() {
    const type = document.getElementById('audit-filter')?.value || '';
    const search = document.getElementById('audit-search')?.value || '';
    
    const logs = await api(`/audit?type=${type}&search=${encodeURIComponent(search)}&limit=100`).catch(() => []);
    const list = document.getElementById('audit-list');
    
    if (logs?.length) {
        list.innerHTML = logs.map(l => `
            <div class="p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 ${getAuditTypeColor(l.type)} rounded-xl flex items-center justify-center">
                        <i class="fas ${getAuditTypeIcon(l.type)} text-white"></i>
                    </div>
                    <div>
                        <p class="font-medium">${l.action}</p>
                        <p class="text-xs text-gray-500">User: ${l.user_id?.substring(0, 8) || 'Sistema'}... | IP: ${l.ip_address || '-'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-xs ${l.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">${l.success ? 'OK' : 'FAIL'}</span>
                    <p class="text-xs text-gray-500">${formatDate(l.created_at)}</p>
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum log encontrado</p>';
    }
}

// ========================================
// JOBS
// ========================================

async function renderJobs(container) {
    const stats = await api('/admin/dashboard').catch(() => ({}));
    
    container.innerHTML = `
        <div class="grid grid-cols-4 gap-4 mb-6">
            <div class="card rounded-xl p-4 text-center">
                <p class="text-2xl font-bold" id="jobs-pending">${stats.pending_jobs || 0}</p>
                <p class="text-gray-400 text-sm">Pendentes</p>
            </div>
            <div class="card rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-blue-400" id="jobs-processing">0</p>
                <p class="text-gray-400 text-sm">Processando</p>
            </div>
            <div class="card rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-emerald-400" id="jobs-completed">0</p>
                <p class="text-gray-400 text-sm">Completos</p>
            </div>
            <div class="card rounded-xl p-4 text-center">
                <p class="text-2xl font-bold text-rose-400" id="jobs-failed">${stats.failed_jobs || 0}</p>
                <p class="text-gray-400 text-sm">Falhos</p>
            </div>
        </div>

        <div class="card rounded-2xl">
            <div class="p-4 border-b border-dark-border">
                <select id="jobs-filter" class="bg-dark border border-dark-border rounded-xl px-4 py-2">
                    <option value="">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="processing">Processando</option>
                    <option value="failed">Falhos</option>
                    <option value="dead">Dead</option>
                </select>
            </div>
            <div id="jobs-list" class="divide-y divide-dark-border max-h-96 overflow-y-auto">
                <p class="text-gray-500 text-center py-8">Carregando...</p>
            </div>
        </div>
    `;

    document.getElementById('jobs-filter')?.addEventListener('change', loadJobs);
    await loadJobs();
}

async function loadJobs() {
    const status = document.getElementById('jobs-filter')?.value || '';
    const jobs = await api(`/admin/jobs?status=${status}&limit=50`).catch(() => []);
    const list = document.getElementById('jobs-list');
    
    if (jobs?.length) {
        list.innerHTML = jobs.map(j => `
            <div class="p-4 flex items-center justify-between">
                <div>
                    <p class="font-medium">${j.type}</p>
                    <p class="text-xs text-gray-500">ID: ${j.id?.substring(0, 8)}... | Tentativas: ${j.attempts || 0}</p>
                </div>
                <div class="flex items-center gap-4">
                    <span class="px-2 py-1 rounded-full text-xs ${getJobStatusColor(j.status)}">${j.status}</span>
                    ${j.status === 'failed' ? `<button onclick="retryJob('${j.id}')" class="text-primary hover:text-primary/80"><i class="fas fa-redo"></i></button>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhum job</p>';
    }
}

async function retryJob(id) {
    try {
        await api(`/admin/jobs/${id}/retry`, { method: 'POST' });
        toast('Job reenfileirado', 'success');
        loadJobs();
    } catch (err) {
        toast(err.message, 'error');
    }
}


// ========================================
// HELPER FUNCTIONS
// ========================================

function getStatusColor(status) {
    const colors = { 
        active: 'bg-emerald-500/20 text-emerald-400', 
        suspended: 'bg-amber-500/20 text-amber-400', 
        banned: 'bg-rose-500/20 text-rose-400',
        pending: 'bg-amber-500/20 text-amber-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}

function getRoleColor(role) {
    const colors = { 
        user: 'bg-gray-500/20 text-gray-400', 
        admin: 'bg-primary/20 text-primary', 
        super_admin: 'bg-sovereign/20 text-sovereign' 
    };
    return colors[role] || 'bg-gray-500/20 text-gray-400';
}

function getSubStatusColor(status) {
    const colors = { 
        active: 'bg-emerald-500/20 text-emerald-400', 
        canceled: 'bg-gray-500/20 text-gray-400', 
        past_due: 'bg-rose-500/20 text-rose-400',
        trialing: 'bg-blue-500/20 text-blue-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}

function getPaymentStatusColor(status) {
    const colors = { 
        pending: 'bg-amber-500/20 text-amber-400', 
        confirmed: 'bg-emerald-500/20 text-emerald-400', 
        completed: 'bg-emerald-500/20 text-emerald-400',
        failed: 'bg-rose-500/20 text-rose-400', 
        disputed: 'bg-rose-500/20 text-rose-400' 
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}

function getJobStatusColor(status) {
    const colors = { 
        pending: 'bg-amber-500/20 text-amber-400', 
        processing: 'bg-blue-500/20 text-blue-400', 
        completed: 'bg-emerald-500/20 text-emerald-400', 
        failed: 'bg-rose-500/20 text-rose-400', 
        dead: 'bg-gray-500/20 text-gray-400' 
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}

function getRiskColor(score) {
    if (score < 0.3) return 'bg-emerald-500/20 text-emerald-400';
    if (score < 0.6) return 'bg-amber-500/20 text-amber-400';
    return 'bg-rose-500/20 text-rose-400';
}

function getRiskBorderColor(score) {
    if (score < 0.3) return 'border-emerald-500';
    if (score < 0.6) return 'border-amber-500';
    return 'border-rose-500';
}

function getDecisionStatusColor(status) {
    const colors = { 
        proposed: 'bg-amber-500/20 text-amber-400', 
        approved: 'bg-emerald-500/20 text-emerald-400', 
        rejected: 'bg-rose-500/20 text-rose-400', 
        executed: 'bg-primary/20 text-primary' 
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}

function getApprovalStatusColor(status) {
    const colors = { 
        pending: 'bg-amber-500/20 text-amber-400', 
        approved: 'bg-emerald-500/20 text-emerald-400', 
        rejected: 'bg-rose-500/20 text-rose-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}

function getAuditTypeColor(type) {
    const colors = {
        auth: 'bg-blue-500',
        billing: 'bg-emerald-500',
        agent: 'bg-purple-500',
        admin: 'bg-sovereign',
        policy: 'bg-amber-500',
        killswitch: 'bg-rose-500'
    };
    return colors[type] || 'bg-gray-500';
}

function getAuditTypeIcon(type) {
    const icons = {
        auth: 'fa-key',
        billing: 'fa-credit-card',
        agent: 'fa-robot',
        admin: 'fa-shield',
        policy: 'fa-gavel',
        killswitch: 'fa-power-off'
    };
    return icons[type] || 'fa-circle';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem(STORAGE.TOKEN);
    const userData = localStorage.getItem(STORAGE.USER);
    
    if (token && isTokenValid(token)) {
        currentUser = userData ? JSON.parse(userData) : {};
        initMainLayout();
        
        // Iniciar atualização periódica do badge de alertas
        updateAlertsBadge();
        setInterval(updateAlertsBadge, 30000); // A cada 30 segundos
    } else {
        localStorage.removeItem(STORAGE.TOKEN);
        localStorage.removeItem(STORAGE.USER);
        showPage('login');
    }

    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
});

// Atualiza o badge de alertas não lidos
async function updateAlertsBadge() {
    try {
        const stats = await api('/admin/telemetry/alerts/stats');
        const badge = document.getElementById('alerts-badge');
        if (badge && stats) {
            const count = stats.unacknowledged || 0;
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    } catch (err) {
        // Silenciar erros de badge
    }
}

// ========================================
// GLOBAL EXPORTS
// ========================================

window.loginWithToken = loginWithToken;
window.showSection = showSection;
window.logout = logout;
window.refreshData = refreshData;
window.loadUsersPage = loadUsersPage;
window.suspendUser = suspendUser;
window.reactivateUser = reactivateUser;
window.promoteToAdmin = promoteToAdmin;
window.loadSubscriptions = loadSubscriptions;
window.showActivateKillSwitch = showActivateKillSwitch;
window.hideActivateKillSwitch = hideActivateKillSwitch;
window.activateKillSwitch = activateKillSwitch;
window.deactivateKillSwitch = deactivateKillSwitch;
window.showCreatePolicy = showCreatePolicy;
window.hideCreatePolicy = hideCreatePolicy;
window.createPolicy = createPolicy;
window.togglePolicy = togglePolicy;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.showCreateAuthority = showCreateAuthority;
window.hideCreateAuthority = hideCreateAuthority;
window.createAuthority = createAuthority;
window.revokeAuthority = revokeAuthority;
window.showCreateAutonomy = showCreateAutonomy;
window.hideCreateAutonomy = hideCreateAutonomy;
window.createAutonomy = createAutonomy;
window.toggleShadowMode = toggleShadowMode;
window.approveDecision = approveDecision;
window.rejectDecision = rejectDecision;
window.loadAuditLogs = loadAuditLogs;
window.loadJobs = loadJobs;
window.retryJob = retryJob;
window.showExplainPanel = showExplainPanel;
window.closeExplainPanel = closeExplainPanel;
// Alerts
window.acknowledgeAlert = acknowledgeAlert;
window.acknowledgeAllAlerts = acknowledgeAllAlerts;
window.filterAlerts = filterAlerts;
window.toggleAlertsPolling = toggleAlertsPolling;
window.showAlertDetails = showAlertDetails;

// ========================================
// EXPLAIN PANEL - Causalidade
// "Por que isso aconteceu?"
// ========================================

async function showExplainPanel(type, id) {
    const modal = document.getElementById('explain-modal');
    const title = document.getElementById('explain-title');
    const content = document.getElementById('explain-content');
    
    modal.classList.remove('hidden');
    content.innerHTML = '<p class="text-gray-400 text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i> Carregando...</p>';
    
    try {
        if (type === 'approval') {
            title.textContent = 'Detalhes da Aprovação';
            const approval = await api(`/approvals/${id}`).catch(() => null);
            const audit = await api(`/audit?entity_id=${id}&limit=10`).catch(() => []);
            
            content.innerHTML = `
                <div class="space-y-6">
                    <!-- Status -->
                    <div class="bg-amber-500/10 rounded-xl p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-bold text-amber-400">${approval?.action_type || 'Ação'}</span>
                            <span class="px-2 py-1 rounded-full text-xs ${getApprovalStatusColor(approval?.status || 'pending')}">${approval?.status || 'pending'}</span>
                        </div>
                        <p class="text-gray-400">${approval?.description || 'Sem descrição'}</p>
                    </div>

                    <!-- Why Section -->
                    <div>
                        <h4 class="font-bold mb-3 flex items-center gap-2">
                            <i class="fas fa-question-circle text-primary"></i>
                            Por que isso precisa de aprovação?
                        </h4>
                        <div class="bg-dark rounded-xl p-4 space-y-2">
                            <p class="text-sm"><i class="fas fa-shield text-amber-400 mr-2"></i> <strong>Risco:</strong> ${((approval?.risk_score || 0.5) * 100).toFixed(0)}% - ${approval?.risk_score > 0.6 ? 'Alto risco requer supervisão humana' : 'Risco moderado, verificação recomendada'}</p>
                            <p class="text-sm"><i class="fas fa-gavel text-emerald-400 mr-2"></i> <strong>Policy:</strong> ${approval?.policy_id || 'Política padrão de aprovação'}</p>
                            <p class="text-sm"><i class="fas fa-robot text-primary mr-2"></i> <strong>Origem:</strong> ${approval?.agent_id ? 'Agente autônomo' : 'Ação do sistema'}</p>
                        </div>
                    </div>

                    <!-- Impact Section -->
                    <div>
                        <h4 class="font-bold mb-3 flex items-center gap-2">
                            <i class="fas fa-bolt text-amber-400"></i>
                            O que acontece se aprovar?
                        </h4>
                        <div class="bg-dark rounded-xl p-4">
                            <p class="text-sm text-gray-400">${approval?.impact || 'A ação será executada conforme solicitado. Isso pode afetar usuários, billing ou configurações do sistema.'}</p>
                        </div>
                    </div>

                    <!-- Audit Trail -->
                    <div>
                        <h4 class="font-bold mb-3 flex items-center gap-2">
                            <i class="fas fa-history text-gray-400"></i>
                            Histórico relacionado
                        </h4>
                        <div class="space-y-2 max-h-40 overflow-y-auto">
                            ${audit?.length ? audit.map(a => `
                                <div class="flex items-center justify-between p-2 rounded-lg bg-dark text-sm">
                                    <span>${a.action}</span>
                                    <span class="text-xs text-gray-500">${formatDate(a.created_at)}</span>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-sm">Nenhum histórico encontrado</p>'}
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-4 pt-4 border-t border-dark-border">
                        <button onclick="approveRequest('${id}'); closeExplainPanel();" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold">
                            <i class="fas fa-check mr-2"></i> Aprovar
                        </button>
                        <button onclick="rejectRequest('${id}'); closeExplainPanel();" class="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold">
                            <i class="fas fa-times mr-2"></i> Rejeitar
                        </button>
                    </div>
                </div>
            `;
        } else if (type === 'decision') {
            title.textContent = 'Detalhes da Decisão do Agente';
            const decision = await api(`/agents/decisions/${id}`).catch(() => null);
            
            content.innerHTML = `
                <div class="space-y-6">
                    <!-- Status -->
                    <div class="bg-primary/10 rounded-xl p-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-bold text-primary">${decision?.proposed_action || 'Ação'}</span>
                            <span class="px-2 py-1 rounded-full text-xs ${getDecisionStatusColor(decision?.status || 'proposed')}">${decision?.status || 'proposed'}</span>
                        </div>
                        <p class="text-gray-400">${decision?.reason || 'Sem justificativa'}</p>
                    </div>

                    <!-- Agent Info -->
                    <div>
                        <h4 class="font-bold mb-3 flex items-center gap-2">
                            <i class="fas fa-robot text-primary"></i>
                            Sobre o Agente
                        </h4>
                        <div class="bg-dark rounded-xl p-4 space-y-2">
                            <p class="text-sm"><i class="fas fa-id-badge text-gray-400 mr-2"></i> <strong>ID:</strong> ${decision?.agent_id?.substring(0, 12) || 'Desconhecido'}...</p>
                            <p class="text-sm"><i class="fas fa-layer-group text-gray-400 mr-2"></i> <strong>Perfil:</strong> ${decision?.autonomy_profile || 'Padrão'}</p>
                            <p class="text-sm"><i class="fas fa-chart-line text-gray-400 mr-2"></i> <strong>Risco calculado:</strong> ${((decision?.risk_score || 0.5) * 100).toFixed(0)}%</p>
                        </div>
                    </div>

                    <!-- Why Section -->
                    <div>
                        <h4 class="font-bold mb-3 flex items-center gap-2">
                            <i class="fas fa-brain text-amber-400"></i>
                            Por que o agente propôs isso?
                        </h4>
                        <div class="bg-dark rounded-xl p-4">
                            <p class="text-sm text-gray-400">${decision?.reasoning || 'O agente identificou uma oportunidade ou necessidade baseada em dados do sistema e propôs esta ação para otimização.'}</p>
                        </div>
                    </div>

                    <!-- Why Needs Approval -->
                    <div>
                        <h4 class="font-bold mb-3 flex items-center gap-2">
                            <i class="fas fa-hand-paper text-rose-400"></i>
                            Por que precisa de aprovação humana?
                        </h4>
                        <div class="bg-dark rounded-xl p-4 space-y-2">
                            ${decision?.risk_score > 0.6 ? '<p class="text-sm"><i class="fas fa-exclamation-triangle text-rose-400 mr-2"></i> Risco alto (>60%) - requer supervisão</p>' : ''}
                            ${decision?.requires_approval ? '<p class="text-sm"><i class="fas fa-gavel text-amber-400 mr-2"></i> Política de autonomia exige aprovação para este tipo de ação</p>' : ''}
                            <p class="text-sm"><i class="fas fa-shield text-emerald-400 mr-2"></i> Governança ativa protege contra ações não autorizadas</p>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-4 pt-4 border-t border-dark-border">
                        <button onclick="approveDecision('${id}'); closeExplainPanel();" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-bold">
                            <i class="fas fa-check mr-2"></i> Aprovar
                        </button>
                        <button onclick="rejectDecision('${id}'); closeExplainPanel();" class="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold">
                            <i class="fas fa-times mr-2"></i> Rejeitar
                        </button>
                    </div>
                </div>
            `;
        } else if (type === 'user') {
            title.textContent = 'Detalhes do Usuário';
            const user = await api(`/admin/users/${id}`).catch(() => null);
            const audit = await api(`/audit?user_id=${id}&limit=10`).catch(() => []);
            
            content.innerHTML = `
                <div class="space-y-6">
                    <!-- User Info -->
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                            <i class="fas fa-user text-primary text-2xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg">${user?.profile?.name || user?.username || 'Usuário'}</h3>
                            <p class="text-gray-400">${user?.profile?.email || '-'}</p>
                            <div class="flex gap-2 mt-2">
                                <span class="px-2 py-1 rounded-full text-xs ${getStatusColor(user?.status || 'active')}">${user?.status || 'active'}</span>
                                <span class="px-2 py-1 rounded-full text-xs ${getRoleColor(user?.role || 'user')}">${user?.role || 'user'}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Status Explanation -->
                    ${user?.status === 'suspended' ? `
                        <div class="bg-amber-500/10 rounded-xl p-4">
                            <h4 class="font-bold text-amber-400 mb-2">
                                <i class="fas fa-pause-circle mr-2"></i> Usuário Suspenso
                            </h4>
                            <p class="text-sm text-gray-400">
                                <strong>Por quê:</strong> ${user?.suspension_reason || 'Motivo não especificado'}
                            </p>
                            <p class="text-xs text-gray-500 mt-2">
                                Suspenso em: ${formatDate(user?.suspended_at) || '-'}
                            </p>
                        </div>
                    ` : ''}

                    <!-- Recent Activity -->
                    <div>
                        <h4 class="font-bold mb-3 flex items-center gap-2">
                            <i class="fas fa-history text-gray-400"></i>
                            Atividade Recente
                        </h4>
                        <div class="space-y-2 max-h-48 overflow-y-auto">
                            ${audit?.length ? audit.map(a => `
                                <div class="flex items-center justify-between p-2 rounded-lg bg-dark text-sm">
                                    <div>
                                        <span>${a.action}</span>
                                        <span class="ml-2 px-1 py-0.5 rounded text-xs ${a.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">${a.success ? 'OK' : 'FAIL'}</span>
                                    </div>
                                    <span class="text-xs text-gray-500">${formatDate(a.created_at)}</span>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-sm">Nenhuma atividade recente</p>'}
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="flex gap-4 pt-4 border-t border-dark-border">
                        ${user?.status === 'active' ? `
                            <button onclick="suspendUser('${id}'); closeExplainPanel();" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl">
                                <i class="fas fa-pause mr-2"></i> Suspender
                            </button>
                        ` : `
                            <button onclick="reactivateUser('${id}'); closeExplainPanel();" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl">
                                <i class="fas fa-play mr-2"></i> Reativar
                            </button>
                        `}
                        <button onclick="showSection('audit'); closeExplainPanel();" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl">
                            <i class="fas fa-scroll mr-2"></i> Ver Audit
                        </button>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        content.innerHTML = `<p class="text-rose-400 text-center py-8"><i class="fas fa-exclamation-triangle mr-2"></i> Erro ao carregar: ${err.message}</p>`;
    }
}

function closeExplainPanel() {
    document.getElementById('explain-modal')?.classList.add('hidden');
}
