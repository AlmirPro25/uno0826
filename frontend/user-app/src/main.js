/**
 * PROST-QS User App
 * Interface do usuário final - Fase 10
 */

const API_BASE = 'http://localhost:8080/api/v1';
const STORAGE = {
    TOKEN: 'pq_token',
    USER: 'pq_user',
    VERIFICATION_ID: 'pq_verification_id',
    PHONE: 'pq_phone'
};

let currentUser = null;

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
        
        // Handle empty responses
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        
        if (!res.ok) {
            if (res.status === 401) {
                logout();
                throw new Error('Sessão expirada. Faça login novamente.');
            }
            if (res.status === 403) {
                throw new Error(data.message || 'Acesso negado');
            }
            throw new Error(data.error || 'Erro desconhecido');
        }
        
        return data;
    } catch (err) {
        if (err.message !== 'Sessão expirada. Faça login novamente.') {
            toast(err.message, 'error');
        }
        throw err;
    }
}

// ========================================
// UI HELPERS
// ========================================

function showPage(pageId) {
    const pages = ['login', 'verify', 'signup', 'dashboard', 'wallet', 'profile', 'deposit', 'subscription', 'settings', 'powers'];
    pages.forEach(p => {
        const el = document.getElementById(`${p}-page`);
        if (el) el.classList.add('hidden');
    });
    
    const target = document.getElementById(`${pageId}-page`);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo(0, 0);
    }

    // Load data for specific pages
    if (pageId === 'dashboard') loadDashboard();
    if (pageId === 'wallet') loadWallet();
    if (pageId === 'profile') loadProfile();
    if (pageId === 'subscription') loadSubscription();
    if (pageId === 'powers') loadPowers();
}

function loader(show, text = 'Carregando...') {
    const el = document.getElementById('loader');
    const txt = document.getElementById('loader-text');
    if (el && txt) {
        txt.textContent = text;
        show ? el.classList.remove('hidden') : el.classList.add('hidden');
    }
}

function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const colors = {
        success: 'bg-emerald-500',
        error: 'bg-rose-500',
        info: 'bg-primary'
    };

    const t = document.createElement('div');
    t.className = `${colors[type]} text-white text-sm font-medium px-4 py-3 rounded-xl mb-2 shadow-lg animate-fade-in`;
    t.textContent = msg;
    container.appendChild(t);

    setTimeout(() => {
        t.classList.add('opacity-0', 'transition-opacity');
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

function formatCurrency(cents) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ========================================
// JWT DECODE (para verificar role localmente)
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
    return claims.exp * 1000 > Date.now();
}

// ========================================
// AUTH FLOW
// ========================================

async function handleLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('phone-input').value.replace(/\D/g, '');
    
    if (phone.length < 10) {
        toast('Número inválido', 'error');
        return;
    }

    const fullPhone = '+55' + phone;
    localStorage.setItem(STORAGE.PHONE, fullPhone);

    try {
        loader(true, 'Enviando código...');
        const res = await api('/auth/phone/request', {
            method: 'POST',
            body: JSON.stringify({ phone_number: fullPhone, channel: 'sms' })
        });

        localStorage.setItem(STORAGE.VERIFICATION_ID, res.verification_id);
        document.getElementById('display-phone').textContent = fullPhone;
        
        // Dev mode: show OTP
        if (res.dev_otp) {
            const devEl = document.getElementById('dev-otp');
            devEl.textContent = `[DEV] Código: ${res.dev_otp}`;
            devEl.classList.remove('hidden');
        }

        showPage('verify');
        toast('Código enviado!', 'success');
    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

async function handleVerify(e) {
    e.preventDefault();
    const code = document.getElementById('otp-input').value;
    
    if (code.length !== 6) {
        toast('Código deve ter 6 dígitos', 'error');
        return;
    }

    const verificationId = localStorage.getItem(STORAGE.VERIFICATION_ID);

    try {
        loader(true, 'Verificando...');
        const res = await api('/auth/phone/verify', {
            method: 'POST',
            body: JSON.stringify({ verification_id: verificationId, code })
        });

        if (res.is_new_user) {
            // Novo usuário - precisa completar cadastro
            showPage('signup');
            toast('Telefone verificado! Complete seu cadastro.', 'success');
        } else {
            // Usuário existente - login completo
            completeLogin(res);
        }
    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('name-input').value.trim();
    const email = document.getElementById('email-input').value.trim();
    const terms = document.getElementById('terms-checkbox').checked;

    if (!name || name.length < 2) {
        toast('Nome muito curto', 'error');
        return;
    }
    if (!email || !email.includes('@')) {
        toast('Email inválido', 'error');
        return;
    }
    if (!terms) {
        toast('Aceite os termos para continuar', 'error');
        return;
    }

    const verificationId = localStorage.getItem(STORAGE.VERIFICATION_ID);

    try {
        loader(true, 'Criando conta...');
        const res = await api(`/auth/complete-signup?verification_id=${verificationId}`, {
            method: 'POST',
            body: JSON.stringify({ name, email })
        });

        completeLogin(res);
        toast('Conta criada com sucesso!', 'success');
    } catch (err) {
        console.error(err);
    } finally {
        loader(false);
    }
}

function completeLogin(res) {
    localStorage.setItem(STORAGE.TOKEN, res.token);
    localStorage.setItem(STORAGE.USER, JSON.stringify(res.user));
    currentUser = res.user;
    
    // Limpar dados de verificação
    localStorage.removeItem(STORAGE.VERIFICATION_ID);
    localStorage.removeItem(STORAGE.PHONE);
    
    showPage('dashboard');
    toast(`Bem-vindo, ${res.user.profile?.name || 'Usuário'}!`, 'success');
}

function resendOTP() {
    document.getElementById('otp-input').value = '';
    showPage('login');
    toast('Solicite um novo código', 'info');
}

function logout() {
    localStorage.removeItem(STORAGE.TOKEN);
    localStorage.removeItem(STORAGE.USER);
    currentUser = null;
    showPage('login');
    toast('Até logo!', 'info');
}

// ========================================
// DATA LOADING
// ========================================

async function loadDashboard() {
    try {
        // Load user data
        const user = await api('/identity/me');
        currentUser = user;
        localStorage.setItem(STORAGE.USER, JSON.stringify(user));
        
        document.getElementById('user-name').textContent = user.profile?.name || 'Usuário';

        // Load balance - criar conta de billing se não existir
        try {
            const account = await api('/billing/account');
            document.getElementById('balance').textContent = formatCurrency(account.balance);
        } catch {
            // Tentar criar conta de billing
            try {
                await api('/billing/account', { method: 'POST' });
                document.getElementById('balance').textContent = 'R$ 0,00';
            } catch {
                document.getElementById('balance').textContent = 'R$ 0,00';
            }
        }

        // Load subscription status
        try {
            const sub = await api('/subscriptions/active');
            if (sub && sub.status === 'active') {
                document.getElementById('subscription-banner')?.classList.remove('hidden');
                document.getElementById('sub-plan-name').textContent = sub.plan_id === 'pro' ? 'Pro' : 'Premium';
                document.getElementById('sub-status').textContent = 'Ativo';
            } else {
                document.getElementById('subscription-banner')?.classList.add('hidden');
            }
        } catch {
            document.getElementById('subscription-banner')?.classList.add('hidden');
        }
    } catch (err) {
        console.error('Dashboard load failed', err);
    }
}

async function loadWallet() {
    try {
        // Load balance
        try {
            const account = await api('/billing/account');
            document.getElementById('wallet-balance').textContent = formatCurrency(account.balance);
        } catch {
            document.getElementById('wallet-balance').textContent = 'R$ 0,00';
        }

        // Load transactions
        try {
            const ledger = await api('/billing/ledger');
            const list = document.getElementById('transactions-list');
            const entries = ledger.entries || [];

            if (entries.length > 0) {
                list.innerHTML = entries.map(e => `
                    <div class="glass rounded-xl p-4 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full ${e.type === 'credit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'} flex items-center justify-center">
                                <i class="fas ${e.type === 'credit' ? 'fa-arrow-down text-emerald-400' : 'fa-arrow-up text-rose-400'}"></i>
                            </div>
                            <div>
                                <p class="font-medium">${e.description || (e.type === 'credit' ? 'Depósito' : 'Pagamento')}</p>
                                <p class="text-xs text-gray-400">${formatDate(e.created_at)}</p>
                            </div>
                        </div>
                        <span class="${e.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'} font-bold">
                            ${e.type === 'credit' ? '+' : '-'}${formatCurrency(e.amount)}
                        </span>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma transação ainda</p>';
            }
        } catch {
            document.getElementById('transactions-list').innerHTML = '<p class="text-gray-500 text-center py-8">Nenhuma transação ainda</p>';
        }
    } catch (err) {
        console.error('Wallet load failed', err);
    }
}

async function loadProfile() {
    if (!currentUser) {
        try {
            currentUser = await api('/identity/me');
            localStorage.setItem(STORAGE.USER, JSON.stringify(currentUser));
        } catch {
            return;
        }
    }

    document.getElementById('profile-name').textContent = currentUser.profile?.name || 'Usuário';
    document.getElementById('profile-email').textContent = currentUser.profile?.email || '-';
    
    const phone = currentUser.auth_methods?.find(m => m.type === 'phone')?.identifier;
    document.getElementById('profile-phone').textContent = phone || '-';
    
    const since = new Date(currentUser.created_at);
    document.getElementById('profile-since').textContent = since.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

    // Load subscription for profile
    try {
        const sub = await api('/subscriptions/active');
        if (sub && sub.status === 'active') {
            document.getElementById('profile-plan').textContent = sub.plan_id === 'pro' ? 'Pro' : 'Premium';
        } else {
            document.getElementById('profile-plan').textContent = 'Free';
        }
    } catch {
        document.getElementById('profile-plan').textContent = 'Free';
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if logged in
    const token = localStorage.getItem(STORAGE.TOKEN);
    const userData = localStorage.getItem(STORAGE.USER);
    
    if (token && userData && isTokenValid(token)) {
        currentUser = JSON.parse(userData);
        showPage('dashboard');
    } else {
        // Limpar dados inválidos
        localStorage.removeItem(STORAGE.TOKEN);
        localStorage.removeItem(STORAGE.USER);
        showPage('login');
    }

    // Form handlers
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('verify-form')?.addEventListener('submit', handleVerify);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);

    // Phone input formatting
    document.getElementById('phone-input')?.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        if (v.length > 7) v = v.slice(0, 2) + ' ' + v.slice(2, 7) + '-' + v.slice(7);
        else if (v.length > 2) v = v.slice(0, 2) + ' ' + v.slice(2);
        e.target.value = v;
    });

    // OTP input - only numbers
    document.getElementById('otp-input')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
    });
});

// Export for HTML onclick
window.showPage = showPage;
window.logout = logout;
window.resendOTP = resendOTP;


// ========================================
// DEPOSIT FUNCTIONS
// ========================================

let selectedDepositAmount = 0;

function setDepositAmount(cents) {
    selectedDepositAmount = cents;
    document.getElementById('deposit-amount').value = (cents / 100).toFixed(2).replace('.', ',');
    
    // Highlight selected button
    document.querySelectorAll('.deposit-amount').forEach(btn => {
        btn.classList.remove('border-primary', 'bg-primary/10');
    });
    event.target.classList.add('border-primary', 'bg-primary/10');
}

async function processDeposit() {
    let amount = selectedDepositAmount;
    
    // Se não selecionou preset, pegar do input
    if (!amount) {
        const inputValue = document.getElementById('deposit-amount').value.replace(',', '.');
        amount = Math.round(parseFloat(inputValue) * 100);
    }
    
    if (!amount || amount < 100) {
        toast('Valor mínimo: R$ 1,00', 'error');
        return;
    }
    
    if (amount > 100000) {
        toast('Valor máximo: R$ 1.000,00', 'error');
        return;
    }

    try {
        loader(true, 'Criando pagamento...');
        
        // Criar payment intent
        const intent = await api('/billing/payment-intent', {
            method: 'POST',
            body: JSON.stringify({
                amount: amount,
                currency: 'brl',
                description: 'Depósito na carteira'
            })
        });

        // Em produção, aqui abriria o Stripe Checkout
        // Por enquanto, simular confirmação
        toast('Pagamento criado! Em produção, você seria redirecionado para o Stripe.', 'info');
        
        // Simular confirmação (apenas em dev)
        if (intent.intent_id) {
            setTimeout(async () => {
                try {
                    await api(`/billing/payment-intent/${intent.intent_id}/confirm`, {
                        method: 'POST',
                        body: JSON.stringify({ payment_method_id: 'pm_card_visa' })
                    });
                    toast('Depósito realizado com sucesso!', 'success');
                    showPage('dashboard');
                } catch {
                    // Ignorar erro de simulação
                }
            }, 2000);
        }
    } catch (err) {
        console.error('Deposit failed', err);
    } finally {
        loader(false);
    }
}

// Export deposit functions
window.setDepositAmount = setDepositAmount;
window.processDeposit = processDeposit;

// ========================================
// SUBSCRIPTION FUNCTIONS
// ========================================

let currentSubscription = null;

async function loadSubscription() {
    try {
        // Buscar assinatura ativa
        const sub = await api('/subscriptions/active').catch(() => null);
        currentSubscription = sub;
        
        // Atualizar UI
        const currentPlanCard = document.getElementById('current-plan-card');
        const freeBadge = document.getElementById('free-badge');
        const premiumBadge = document.getElementById('premium-badge');
        const proBadge = document.getElementById('pro-badge');
        const premiumBtn = document.getElementById('premium-btn');
        const proBtn = document.getElementById('pro-btn');
        
        // Reset badges
        freeBadge?.classList.add('hidden');
        premiumBadge?.classList.add('hidden');
        proBadge?.classList.add('hidden');
        
        if (sub && sub.status === 'active') {
            currentPlanCard?.classList.remove('hidden');
            document.getElementById('current-plan-name').textContent = sub.plan_id === 'pro' ? 'Pro' : 'Premium';
            document.getElementById('current-plan-price').textContent = sub.plan_id === 'pro' ? 'R$ 99,90/mês' : 'R$ 29,90/mês';
            document.getElementById('current-plan-status').textContent = 'Ativo';
            
            if (sub.current_period_end) {
                const nextDate = new Date(sub.current_period_end);
                document.getElementById('next-billing-date').textContent = nextDate.toLocaleDateString('pt-BR');
            }
            
            // Show badge on current plan
            if (sub.plan_id === 'premium') {
                premiumBadge?.classList.remove('hidden');
                premiumBtn.textContent = 'Plano atual';
                premiumBtn.disabled = true;
                premiumBtn.classList.add('opacity-50');
            } else if (sub.plan_id === 'pro') {
                proBadge?.classList.remove('hidden');
                proBtn.textContent = 'Plano atual';
                proBtn.disabled = true;
                proBtn.classList.add('opacity-50');
            }
            
            // Update dashboard banner
            document.getElementById('subscription-banner')?.classList.remove('hidden');
            document.getElementById('sub-plan-name').textContent = sub.plan_id === 'pro' ? 'Pro' : 'Premium';
            document.getElementById('sub-status').textContent = 'Ativo até ' + new Date(sub.current_period_end).toLocaleDateString('pt-BR');
            
            // Update profile
            document.getElementById('profile-plan').textContent = sub.plan_id === 'pro' ? 'Pro' : 'Premium';
        } else {
            currentPlanCard?.classList.add('hidden');
            freeBadge?.classList.remove('hidden');
            document.getElementById('subscription-banner')?.classList.add('hidden');
            document.getElementById('profile-plan').textContent = 'Free';
        }
    } catch (err) {
        console.error('Failed to load subscription', err);
    }
}

async function subscribeToPlan(planId, amountCents) {
    try {
        loader(true, 'Criando assinatura...');
        
        // Primeiro, garantir que tem billing account
        try {
            await api('/billing/account');
        } catch {
            await api('/billing/account', { method: 'POST' });
        }
        
        // Criar assinatura
        const sub = await api('/subscriptions', {
            method: 'POST',
            body: JSON.stringify({
                plan_id: planId,
                amount: amountCents,
                currency: 'brl',
                interval: 'month'
            })
        });
        
        toast('Assinatura criada com sucesso!', 'success');
        currentSubscription = sub;
        loadSubscription();
        
    } catch (err) {
        console.error('Subscribe failed', err);
        toast(err.message || 'Erro ao criar assinatura', 'error');
    } finally {
        loader(false);
    }
}

async function cancelSubscription() {
    if (!currentSubscription) return;
    
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium.')) {
        return;
    }
    
    try {
        loader(true, 'Cancelando...');
        
        await api(`/subscriptions/${currentSubscription.id}/cancel`, {
            method: 'POST'
        });
        
        toast('Assinatura cancelada', 'info');
        currentSubscription = null;
        loadSubscription();
        
    } catch (err) {
        console.error('Cancel failed', err);
        toast(err.message || 'Erro ao cancelar', 'error');
    } finally {
        loader(false);
    }
}

// Export subscription functions
window.loadSubscription = loadSubscription;
window.subscribeToPlan = subscribeToPlan;
window.cancelSubscription = cancelSubscription;

// ========================================
// POWERS & LIMITS
// ========================================

async function loadPowers() {
    // Get subscription
    let plan = 'free';
    let sub = null;
    try {
        sub = await api('/subscriptions/active');
        if (sub && sub.status === 'active') {
            plan = sub.plan_id || 'premium';
        }
    } catch {}

    // Update plan display
    const planIcon = document.getElementById('powers-plan-icon');
    const planName = document.getElementById('powers-plan-name');
    
    if (plan === 'pro') {
        planIcon.className = 'w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center';
        planIcon.innerHTML = '<i class="fas fa-rocket text-primary text-2xl"></i>';
        planName.textContent = 'Pro';
    } else if (plan === 'premium') {
        planIcon.className = 'w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center';
        planIcon.innerHTML = '<i class="fas fa-crown text-amber-400 text-2xl"></i>';
        planName.textContent = 'Premium';
    } else {
        planIcon.className = 'w-14 h-14 bg-gray-500/20 rounded-2xl flex items-center justify-center';
        planIcon.innerHTML = '<i class="fas fa-user text-gray-400 text-2xl"></i>';
        planName.textContent = 'Free';
    }

    // Define features by plan
    const allFeatures = {
        free: [
            { name: 'Acesso básico', icon: 'check', enabled: true },
            { name: 'Até 100 operações/mês', icon: 'calculator', enabled: true },
            { name: 'Suporte por email', icon: 'envelope', enabled: true }
        ],
        premium: [
            { name: 'Acesso completo', icon: 'check-double', enabled: true },
            { name: 'Operações ilimitadas', icon: 'infinity', enabled: true },
            { name: 'Suporte prioritário', icon: 'headset', enabled: true },
            { name: 'Recursos exclusivos', icon: 'star', enabled: true }
        ],
        pro: [
            { name: 'Tudo do Premium', icon: 'check-double', enabled: true },
            { name: 'API dedicada', icon: 'code', enabled: true },
            { name: 'SLA garantido', icon: 'shield-alt', enabled: true },
            { name: 'Suporte 24/7', icon: 'clock', enabled: true },
            { name: 'Integrações avançadas', icon: 'plug', enabled: true }
        ]
    };

    const blockedFeatures = {
        free: [
            { name: 'Operações ilimitadas', icon: 'infinity', upgrade: 'premium' },
            { name: 'Suporte prioritário', icon: 'headset', upgrade: 'premium' },
            { name: 'API dedicada', icon: 'code', upgrade: 'pro' },
            { name: 'SLA garantido', icon: 'shield-alt', upgrade: 'pro' }
        ],
        premium: [
            { name: 'API dedicada', icon: 'code', upgrade: 'pro' },
            { name: 'SLA garantido', icon: 'shield-alt', upgrade: 'pro' },
            { name: 'Suporte 24/7', icon: 'clock', upgrade: 'pro' }
        ],
        pro: []
    };

    const limits = {
        free: [
            { name: 'Operações', current: 45, max: 100, unit: '/mês' },
            { name: 'Armazenamento', current: 50, max: 100, unit: 'MB' }
        ],
        premium: [
            { name: 'Operações', current: 1250, max: null, unit: 'ilimitado' },
            { name: 'Armazenamento', current: 500, max: 5000, unit: 'MB' }
        ],
        pro: [
            { name: 'Operações', current: 5000, max: null, unit: 'ilimitado' },
            { name: 'Armazenamento', current: 2000, max: null, unit: 'ilimitado' }
        ]
    };

    // Render features
    const featuresEl = document.getElementById('powers-features');
    featuresEl.innerHTML = (allFeatures[plan] || allFeatures.free).map(f => `
        <div class="glass rounded-xl p-4 flex items-center gap-3">
            <div class="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <i class="fas fa-${f.icon} text-emerald-400"></i>
            </div>
            <span>${f.name}</span>
            <i class="fas fa-check text-emerald-400 ml-auto"></i>
        </div>
    `).join('');

    // Render limits
    const limitsEl = document.getElementById('powers-limits');
    limitsEl.innerHTML = (limits[plan] || limits.free).map(l => `
        <div class="glass rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
                <span>${l.name}</span>
                <span class="text-sm text-gray-400">${l.max ? `${l.current}/${l.max}` : l.current} ${l.unit}</span>
            </div>
            ${l.max ? `
                <div class="w-full bg-gray-700 rounded-full h-2">
                    <div class="bg-primary rounded-full h-2" style="width: ${Math.min((l.current / l.max) * 100, 100)}%"></div>
                </div>
            ` : `
                <div class="w-full bg-emerald-500/20 rounded-full h-2">
                    <div class="bg-emerald-500 rounded-full h-2 w-full"></div>
                </div>
            `}
        </div>
    `).join('');

    // Render blocked
    const blockedEl = document.getElementById('powers-blocked');
    const blocked = blockedFeatures[plan] || blockedFeatures.free;
    if (blocked.length > 0) {
        blockedEl.innerHTML = blocked.map(f => `
            <div class="glass rounded-xl p-4 flex items-center gap-3 opacity-60">
                <div class="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                    <i class="fas fa-${f.icon} text-gray-500"></i>
                </div>
                <div class="flex-1">
                    <span>${f.name}</span>
                    <p class="text-xs text-gray-500">Disponível no ${f.upgrade === 'pro' ? 'Pro' : 'Premium'}</p>
                </div>
                <i class="fas fa-lock text-gray-500"></i>
            </div>
        `).join('');
    } else {
        blockedEl.innerHTML = '<p class="text-emerald-400 text-sm"><i class="fas fa-check-circle mr-2"></i> Você tem acesso a todos os recursos!</p>';
    }

    // Render events (mini audit)
    const eventsEl = document.getElementById('powers-events');
    try {
        const ledger = await api('/billing/ledger').catch(() => ({ entries: [] }));
        const entries = (ledger.entries || []).slice(0, 5);
        
        if (entries.length > 0) {
            eventsEl.innerHTML = entries.map(e => `
                <div class="glass rounded-xl p-3 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 ${e.type === 'credit' ? 'bg-emerald-500/20' : 'bg-rose-500/20'} rounded-lg flex items-center justify-center">
                            <i class="fas ${e.type === 'credit' ? 'fa-arrow-down text-emerald-400' : 'fa-arrow-up text-rose-400'} text-sm"></i>
                        </div>
                        <div>
                            <p class="text-sm">${e.description || (e.type === 'credit' ? 'Crédito' : 'Débito')}</p>
                            <p class="text-xs text-gray-500">${formatDate(e.created_at)}</p>
                        </div>
                    </div>
                    <span class="${e.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'} text-sm font-medium">
                        ${e.type === 'credit' ? '+' : '-'}${formatCurrency(e.amount)}
                    </span>
                </div>
            `).join('');
        } else {
            eventsEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Nenhum evento recente</p>';
        }
    } catch {
        eventsEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Nenhum evento recente</p>';
    }
}

window.loadPowers = loadPowers;
