/**
 * PROST-QS Security Module - Admin Dashboard
 * "MFA, Sessions, Activity"
 * 
 * Endpoints:
 * - GET  /api/v1/auth/sessions         → Lista sessões
 * - DELETE /api/v1/auth/sessions/:id   → Revogar sessão
 * - GET  /api/v1/activity              → Log de atividades
 * - GET  /api/v1/admin/login-stats     → Estatísticas de login
 * - GET  /api/v1/admin/login-history   → Histórico de login
 */

// ========================================
// SECURITY DASHBOARD
// ========================================

async function renderSecuritySection(container) {
    try {
        const [sessions, activity, loginStats] = await Promise.all([
            api('/auth/sessions').catch(() => ({ sessions: [] })),
            api('/activity?limit=50').catch(() => ({ activities: [] })),
            api('/admin/login-stats?hours=24').catch(() => ({}))
        ]);

        const sessionsList = sessions.sessions || sessions || [];
        const activityList = activity.activities || activity || [];

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-shield-alt text-emerald-400"></i>
                        Security Center
                    </h2>
                    <p class="text-gray-400">MFA, Sessões e Atividades</p>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${loginStats.total_logins || 0}</p>
                    <p class="text-gray-400 text-sm">Logins (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${sessionsList.length}</p>
                    <p class="text-gray-400 text-sm">Sessões Ativas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${loginStats.failed_logins || 0}</p>
                    <p class="text-gray-400 text-sm">Falhas (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${loginStats.unique_users || 0}</p>
                    <p class="text-gray-400 text-sm">Usuários Únicos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${loginStats.mfa_enabled || 0}</p>
                    <p class="text-gray-400 text-sm">Com MFA</p>
                </div>
            </div>

            <!-- Tabs -->
            <div class="flex gap-2 mb-6">
                <button onclick="showSecurityTab('sessions')" id="sec-tab-sessions" class="px-4 py-2 rounded-xl bg-primary/20 text-primary">
                    <i class="fas fa-desktop mr-2"></i> Sessões
                </button>
                <button onclick="showSecurityTab('activity')" id="sec-tab-activity" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
                    <i class="fas fa-history mr-2"></i> Atividades
                </button>
                <button onclick="showSecurityTab('failed')" id="sec-tab-failed" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20">
                    <i class="fas fa-exclamation-triangle mr-2"></i> Falhas de Login
                </button>
            </div>

            <!-- Content -->
            <div id="security-content">
                ${renderSessionsTable(sessionsList)}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Security', err.message);
    }
}

function renderSessionsTable(sessions) {
    if (!sessions.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-desktop text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhuma sessão ativa</p>
            </div>
        `;
    }

    return `
        <div class="card rounded-2xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-4 text-sm text-gray-400">Usuário</th>
                        <th class="text-left p-4 text-sm text-gray-400">Dispositivo</th>
                        <th class="text-center p-4 text-sm text-gray-400">IP</th>
                        <th class="text-center p-4 text-sm text-gray-400">Localização</th>
                        <th class="text-center p-4 text-sm text-gray-400">Criada</th>
                        <th class="text-center p-4 text-sm text-gray-400">Última Atividade</th>
                        <th class="text-center p-4 text-sm text-gray-400">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${sessions.map(s => `
                        <tr class="border-t border-dark-border hover:bg-white/5">
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-user text-emerald-400"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium">${s.user_email || s.user_id?.substring(0, 8) || 'Unknown'}</p>
                                        <p class="text-xs text-gray-500">${s.id?.substring(0, 8)}...</p>
                                    </div>
                                </div>
                            </td>
                            <td class="p-4">
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-${getDeviceIcon(s.user_agent)} text-gray-400"></i>
                                    <span class="text-sm text-gray-400">${parseUserAgent(s.user_agent)}</span>
                                </div>
                            </td>
                            <td class="p-4 text-center font-mono text-sm text-gray-400">${s.ip_address || '-'}</td>
                            <td class="p-4 text-center text-sm text-gray-400">${s.location || '-'}</td>
                            <td class="p-4 text-center text-sm text-gray-500">${formatTimeAgo(s.created_at)}</td>
                            <td class="p-4 text-center text-sm text-gray-500">${formatTimeAgo(s.last_activity_at)}</td>
                            <td class="p-4 text-center">
                                <button onclick="revokeSession('${s.id}')" class="p-2 rounded-lg hover:bg-white/10 text-rose-400" title="Revogar">
                                    <i class="fas fa-sign-out-alt"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function showSecurityTab(tab) {
    // Update tab styles
    ['sessions', 'activity', 'failed'].forEach(t => {
        const btn = document.getElementById(`sec-tab-${t}`);
        if (btn) {
            btn.className = t === tab 
                ? 'px-4 py-2 rounded-xl bg-primary/20 text-primary'
                : 'px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20';
        }
    });

    const content = document.getElementById('security-content');
    if (!content) return;

    try {
        switch (tab) {
            case 'sessions':
                const sessions = await api('/auth/sessions').catch(() => ({ sessions: [] }));
                content.innerHTML = renderSessionsTable(sessions.sessions || sessions || []);
                break;
            case 'activity':
                const activity = await api('/activity?limit=50').catch(() => ({ activities: [] }));
                content.innerHTML = renderActivityTable(activity.activities || activity || []);
                break;
            case 'failed':
                const failed = await api('/admin/login-history/failed?hours=24&limit=50').catch(() => ({ logins: [] }));
                content.innerHTML = renderFailedLoginsTable(failed.logins || failed || []);
                break;
        }
    } catch (err) {
        content.innerHTML = `<div class="card rounded-2xl p-8 text-center text-rose-400">${err.message}</div>`;
    }
}

function renderActivityTable(activities) {
    if (!activities.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-history text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Nenhuma atividade recente</p>
            </div>
        `;
    }

    return `
        <div class="card rounded-2xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-4 text-sm text-gray-400">Ação</th>
                        <th class="text-left p-4 text-sm text-gray-400">Usuário</th>
                        <th class="text-center p-4 text-sm text-gray-400">IP</th>
                        <th class="text-center p-4 text-sm text-gray-400">Data</th>
                        <th class="text-center p-4 text-sm text-gray-400">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${activities.map(a => `
                        <tr class="border-t border-dark-border hover:bg-white/5">
                            <td class="p-4">
                                <span class="px-2 py-1 rounded text-xs ${getActivityColor(a.action)}">${a.action || 'unknown'}</span>
                            </td>
                            <td class="p-4 font-mono text-sm">${a.user_id?.substring(0, 8) || '-'}...</td>
                            <td class="p-4 text-center font-mono text-sm text-gray-400">${a.ip_address || '-'}</td>
                            <td class="p-4 text-center text-sm text-gray-500">${formatDate(a.created_at)}</td>
                            <td class="p-4 text-center">
                                <span class="px-2 py-1 rounded-full text-xs ${a.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                                    ${a.success ? 'OK' : 'Falha'}
                                </span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderFailedLoginsTable(logins) {
    if (!logins.length) {
        return `
            <div class="card rounded-2xl p-8 text-center">
                <i class="fas fa-check-circle text-4xl text-emerald-400 mb-4"></i>
                <p class="text-gray-400">Nenhuma falha de login nas últimas 24h</p>
            </div>
        `;
    }

    return `
        <div class="card rounded-2xl overflow-hidden">
            <table class="w-full">
                <thead class="bg-white/5">
                    <tr>
                        <th class="text-left p-4 text-sm text-gray-400">Email/Username</th>
                        <th class="text-center p-4 text-sm text-gray-400">IP</th>
                        <th class="text-center p-4 text-sm text-gray-400">Motivo</th>
                        <th class="text-center p-4 text-sm text-gray-400">Data</th>
                    </tr>
                </thead>
                <tbody>
                    ${logins.map(l => `
                        <tr class="border-t border-dark-border hover:bg-white/5">
                            <td class="p-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-rose-500/20 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-times text-rose-400"></i>
                                    </div>
                                    <span class="font-medium">${l.email || l.username || '-'}</span>
                                </div>
                            </td>
                            <td class="p-4 text-center font-mono text-sm text-gray-400">${l.ip_address || '-'}</td>
                            <td class="p-4 text-center">
                                <span class="px-2 py-1 rounded text-xs bg-rose-500/20 text-rose-400">${l.reason || 'invalid_credentials'}</span>
                            </td>
                            <td class="p-4 text-center text-sm text-gray-500">${formatDate(l.created_at)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ========================================
// HELPERS
// ========================================

function getDeviceIcon(userAgent) {
    if (!userAgent) return 'desktop';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile-alt';
    if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet-alt';
    return 'desktop';
}

function parseUserAgent(userAgent) {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return userAgent.substring(0, 30) + '...';
}

function getActivityColor(action) {
    if (!action) return 'bg-gray-500/20 text-gray-400';
    if (action.includes('login')) return 'bg-emerald-500/20 text-emerald-400';
    if (action.includes('logout')) return 'bg-blue-500/20 text-blue-400';
    if (action.includes('create')) return 'bg-purple-500/20 text-purple-400';
    if (action.includes('delete')) return 'bg-rose-500/20 text-rose-400';
    if (action.includes('update')) return 'bg-amber-500/20 text-amber-400';
    return 'bg-gray-500/20 text-gray-400';
}

// ========================================
// ACTIONS
// ========================================

async function revokeSession(sessionId) {
    if (!confirm('Revogar esta sessão? O usuário será deslogado.')) return;

    try {
        await api(`/auth/sessions/${sessionId}`, { method: 'DELETE' });
        toast('Sessão revogada', 'success');
        showSection('security');
    } catch (err) {
        toast('Erro: ' + err.message, 'error');
    }
}
