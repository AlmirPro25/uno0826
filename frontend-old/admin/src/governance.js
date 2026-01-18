// ========================================
// GOVERNANCE - Painel de Governança
// ========================================

const API_URL = window.APP_CONFIG?.API_BASE || 'https://api.prostqs.com.br/api/v1';

let governanceInterval = null;

async function renderGovernance(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-white">Governança</h2>
                <span class="text-gray-400 text-sm">Atualiza a cada 10s</span>
            </div>

            <!-- Status Cards -->
            <div class="grid grid-cols-3 gap-6">
                <!-- Kill Switch -->
                <div id="killswitch-card" class="bg-gray-800 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-white">Kill Switch</h3>
                        <div id="killswitch-indicator" class="w-4 h-4 rounded-full bg-green-500"></div>
                    </div>
                    <p id="killswitch-status" class="text-gray-400 mb-4">Carregando...</p>
                    <div class="flex gap-2">
                        <button id="btn-activate-killswitch" class="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded transition-colors">
                            Ativar
                        </button>
                        <button id="btn-deactivate-killswitch" class="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded transition-colors">
                            Desativar
                        </button>
                    </div>
                </div>

                <!-- Shadow Mode -->
                <div id="shadow-card" class="bg-gray-800 rounded-lg p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-white">Shadow Mode</h3>
                        <div id="shadow-indicator" class="w-4 h-4 rounded-full bg-gray-500"></div>
                    </div>
                    <p id="shadow-status" class="text-gray-400 mb-4">Carregando...</p>
                    <div class="flex gap-2">
                        <button id="btn-activate-shadow" class="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-4 py-2 rounded transition-colors">
                            Ativar
                        </button>
                        <button id="btn-deactivate-shadow" class="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-4 py-2 rounded transition-colors">
                            Desativar
                        </button>
                    </div>
                </div>

                <!-- Audit Summary -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-white mb-4">Auditoria (24h)</h3>
                    <div id="audit-summary" class="space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-400">Ações executadas</span>
                            <span id="audit-executed" class="text-white">-</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Ações bloqueadas</span>
                            <span id="audit-blocked" class="text-white">-</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400">Shadow executions</span>
                            <span id="audit-shadow" class="text-white">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shadow Mode Stats -->
            <div id="shadow-stats-section" class="bg-gray-800 rounded-lg p-6 hidden">
                <h3 class="text-lg font-semibold text-white mb-4">Estatísticas Shadow Mode</h3>
                <div id="shadow-stats" class="grid grid-cols-4 gap-4">
                    <!-- Preenchido via JS -->
                </div>
            </div>

            <!-- Authority Levels -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-white mb-4">Níveis de Autoridade</h3>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-3">Nível</th>
                                <th class="pb-3">Rank</th>
                                <th class="pb-3">Descrição</th>
                                <th class="pb-3">Pode fazer</th>
                            </tr>
                        </thead>
                        <tbody id="authority-levels" class="text-gray-300">
                            <!-- Preenchido via JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Action Domains -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-white mb-4">Domínios de Ação</h3>
                <div id="action-domains" class="grid grid-cols-2 gap-4">
                    <!-- Preenchido via JS -->
                </div>
            </div>

            <!-- Policies -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-white mb-4">Políticas de Ação</h3>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-3">Ação</th>
                                <th class="pb-3">Permissão</th>
                                <th class="pb-3">Blast Radius</th>
                                <th class="pb-3">Duração Máx</th>
                                <th class="pb-3">Status</th>
                            </tr>
                        </thead>
                        <tbody id="policies-table" class="text-gray-300">
                            <!-- Preenchido via JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Prohibited Actions -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-white mb-4">Ações Proibidas</h3>
                <p class="text-gray-400 mb-4">Estas ações NUNCA podem ser automáticas:</p>
                <div id="prohibited-actions" class="flex flex-wrap gap-2">
                    <!-- Preenchido via JS -->
                </div>
            </div>

            <!-- Recent Audit Logs -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-lg font-semibold text-white mb-4">Logs de Auditoria Recentes</h3>
                <div id="audit-logs" class="space-y-2 max-h-96 overflow-y-auto">
                    <!-- Preenchido via JS -->
                </div>
            </div>
        </div>

        <!-- Modal Ativar Kill Switch -->
        <div id="modal-killswitch" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
            <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold text-white mb-4">⚠️ Ativar Kill Switch</h3>
                <p class="text-gray-400 mb-4">Isso pausará TODAS as ações automáticas imediatamente.</p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 text-sm mb-1">Motivo *</label>
                        <input type="text" id="killswitch-reason" class="w-full bg-gray-700 text-white rounded px-3 py-2" placeholder="Ex: Comportamento anômalo detectado">
                    </div>
                    <div>
                        <label class="block text-gray-400 text-sm mb-1">Auto-resume após (opcional)</label>
                        <select id="killswitch-duration" class="w-full bg-gray-700 text-white rounded px-3 py-2">
                            <option value="">Manual (sem auto-resume)</option>
                            <option value="30m">30 minutos</option>
                            <option value="1h">1 hora</option>
                            <option value="2h">2 horas</option>
                            <option value="6h">6 horas</option>
                            <option value="24h">24 horas</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 mt-6">
                    <button id="btn-cancel-killswitch" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancelar</button>
                    <button id="btn-confirm-killswitch" class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Ativar Kill Switch</button>
                </div>
            </div>
        </div>

        <!-- Modal Ativar Shadow Mode -->
        <div id="modal-shadow" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50">
            <div class="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold text-white mb-4">👁️ Ativar Shadow Mode</h3>
                <p class="text-gray-400 mb-4">Ações serão simuladas sem execução real.</p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-gray-400 text-sm mb-1">Motivo *</label>
                        <input type="text" id="shadow-reason" class="w-full bg-gray-700 text-white rounded px-3 py-2" placeholder="Ex: Testando novas regras">
                    </div>
                    <div>
                        <label class="block text-gray-400 text-sm mb-1">Duração</label>
                        <select id="shadow-duration" class="w-full bg-gray-700 text-white rounded px-3 py-2">
                            <option value="1h">1 hora</option>
                            <option value="6h">6 horas</option>
                            <option value="24h" selected>24 horas</option>
                            <option value="72h">72 horas (observação)</option>
                            <option value="">Indefinido</option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 mt-6">
                    <button id="btn-cancel-shadow" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancelar</button>
                    <button id="btn-confirm-shadow" class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded">Ativar Shadow</button>
                </div>
            </div>
        </div>
    `;

    setupGovernanceEvents();
    loadGovernanceData();

    // Atualizar a cada 10s
    governanceInterval = setInterval(loadGovernanceData, 10000);
}

function cleanupGovernance() {
    if (governanceInterval) {
        clearInterval(governanceInterval);
        governanceInterval = null;
    }
}

function setupGovernanceEvents() {
    // Kill Switch
    document.getElementById('btn-activate-killswitch').addEventListener('click', () => {
        document.getElementById('modal-killswitch').classList.remove('hidden');
        document.getElementById('modal-killswitch').classList.add('flex');
    });

    document.getElementById('btn-cancel-killswitch').addEventListener('click', () => {
        document.getElementById('modal-killswitch').classList.add('hidden');
        document.getElementById('modal-killswitch').classList.remove('flex');
    });

    document.getElementById('btn-confirm-killswitch').addEventListener('click', activateKillSwitch);
    document.getElementById('btn-deactivate-killswitch').addEventListener('click', deactivateKillSwitch);

    // Shadow Mode
    document.getElementById('btn-activate-shadow').addEventListener('click', () => {
        document.getElementById('modal-shadow').classList.remove('hidden');
        document.getElementById('modal-shadow').classList.add('flex');
    });

    document.getElementById('btn-cancel-shadow').addEventListener('click', () => {
        document.getElementById('modal-shadow').classList.add('hidden');
        document.getElementById('modal-shadow').classList.remove('flex');
    });

    document.getElementById('btn-confirm-shadow').addEventListener('click', activateShadowMode);
    document.getElementById('btn-deactivate-shadow').addEventListener('click', deactivateShadowMode);
}

async function loadGovernanceData() {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        // Carregar em paralelo
        const [killswitch, shadow, policies, authority, domains, audit] = await Promise.all([
            fetch(`${API_URL}/admin/rules/killswitch`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/admin/rules/shadow`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/admin/rules/policies`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/admin/rules/authority/levels`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/admin/rules/authority/domains`, { headers }).then(r => r.json()),
            fetch(`${API_URL}/admin/rules/audit?limit=20`, { headers }).then(r => r.json())
        ]);

        renderKillSwitchStatus(killswitch);
        renderShadowStatus(shadow);
        renderPolicies(policies);
        renderAuthorityLevels(authority);
        renderActionDomains(domains);
        renderAuditLogs(audit);

        // Shadow stats se ativo
        if (shadow.active) {
            const stats = await fetch(`${API_URL}/admin/rules/shadow/stats?since=24h`, { headers }).then(r => r.json());
            renderShadowStats(stats);
        }

    } catch (err) {
        console.error('Erro ao carregar governança:', err);
    }
}

function renderKillSwitchStatus(data) {
    const indicator = document.getElementById('killswitch-indicator');
    const status = document.getElementById('killswitch-status');

    if (data.active) {
        indicator.className = 'w-4 h-4 rounded-full bg-red-500 animate-pulse';
        status.innerHTML = `
            <span class="text-red-400 font-medium">ATIVO</span><br>
            <span class="text-sm">Por: ${data.activated_by || 'Sistema'}</span><br>
            <span class="text-sm">Motivo: ${data.reason || '-'}</span>
            ${data.auto_resume_at ? `<br><span class="text-sm">Auto-resume: ${new Date(data.auto_resume_at).toLocaleString()}</span>` : ''}
        `;
    } else {
        indicator.className = 'w-4 h-4 rounded-full bg-green-500';
        status.textContent = 'Inativo - Ações automáticas funcionando normalmente';
    }
}

function renderShadowStatus(data) {
    const indicator = document.getElementById('shadow-indicator');
    const status = document.getElementById('shadow-status');
    const statsSection = document.getElementById('shadow-stats-section');

    if (data.active) {
        indicator.className = 'w-4 h-4 rounded-full bg-yellow-500 animate-pulse';
        status.innerHTML = `
            <span class="text-yellow-400 font-medium">ATIVO</span><br>
            <span class="text-sm">Por: ${data.activated_by || 'Sistema'}</span><br>
            <span class="text-sm">Motivo: ${data.reason || '-'}</span>
            ${data.expires_at ? `<br><span class="text-sm">Expira: ${new Date(data.expires_at).toLocaleString()}</span>` : ''}
        `;
        statsSection.classList.remove('hidden');
    } else {
        indicator.className = 'w-4 h-4 rounded-full bg-gray-500';
        status.textContent = 'Inativo - Ações sendo executadas normalmente';
        statsSection.classList.add('hidden');
    }
}

function renderShadowStats(stats) {
    const container = document.getElementById('shadow-stats');
    container.innerHTML = `
        <div class="bg-gray-900 rounded p-4 text-center">
            <div class="text-2xl font-bold text-white">${stats.total || 0}</div>
            <div class="text-gray-400 text-sm">Total simulado</div>
        </div>
        <div class="bg-gray-900 rounded p-4 text-center">
            <div class="text-2xl font-bold text-green-400">${stats.would_execute || 0}</div>
            <div class="text-gray-400 text-sm">Seriam executadas</div>
        </div>
        <div class="bg-gray-900 rounded p-4 text-center">
            <div class="text-2xl font-bold text-red-400">${stats.would_block || 0}</div>
            <div class="text-gray-400 text-sm">Seriam bloqueadas</div>
        </div>
        <div class="bg-gray-900 rounded p-4 text-center">
            <div class="text-2xl font-bold text-blue-400">${stats.since || '24h'}</div>
            <div class="text-gray-400 text-sm">Período</div>
        </div>
    `;

    document.getElementById('audit-shadow').textContent = stats.total || 0;
}

function renderPolicies(data) {
    const tbody = document.getElementById('policies-table');
    const policies = data.policies || {};

    const permissionColors = {
        'automatic': 'text-green-400',
        'confirmation': 'text-yellow-400',
        'never': 'text-red-400'
    };

    tbody.innerHTML = Object.entries(policies).map(([type, policy]) => `
        <tr class="border-b border-gray-700">
            <td class="py-3 font-mono">${type}</td>
            <td class="py-3">
                <span class="${permissionColors[policy.permission] || 'text-gray-400'}">${policy.permission}</span>
            </td>
            <td class="py-3">${policy.max_blast_radius?.scope || '-'} (max: ${policy.max_blast_radius?.max_affected || '-'})</td>
            <td class="py-3">${policy.max_duration || '-'}</td>
            <td class="py-3">
                <button class="text-gray-400 hover:text-white text-sm" onclick="toggleActionPause('${type}')">
                    Pausar
                </button>
            </td>
        </tr>
    `).join('');

    // Prohibited actions
    const prohibited = data.prohibited_actions || [];
    document.getElementById('prohibited-actions').innerHTML = prohibited.map(action => `
        <span class="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm">${action}</span>
    `).join('');
}

function renderAuthorityLevels(data) {
    const tbody = document.getElementById('authority-levels');
    const levels = data.levels || [];

    const levelColors = {
        'observer': 'text-gray-400',
        'suggestor': 'text-blue-400',
        'operator': 'text-green-400',
        'manager': 'text-yellow-400',
        'governor': 'text-orange-400',
        'sovereign': 'text-red-400'
    };

    const levelActions = {
        'observer': 'Ver dashboards',
        'suggestor': 'Criar regras em shadow',
        'operator': 'Executar ações operacionais',
        'manager': 'Mudar regras e configs',
        'governor': 'Mudar políticas',
        'sovereign': 'Kill switch, shutdown'
    };

    tbody.innerHTML = levels.map(level => `
        <tr class="border-b border-gray-700">
            <td class="py-3">
                <span class="${levelColors[level.level] || 'text-gray-400'} font-medium">${level.level}</span>
            </td>
            <td class="py-3">${level.rank}</td>
            <td class="py-3 text-gray-400">${level.description}</td>
            <td class="py-3 text-gray-400">${levelActions[level.level] || '-'}</td>
        </tr>
    `).join('');
}

function renderActionDomains(data) {
    const container = document.getElementById('action-domains');
    const domains = data.domains || {};

    const domainColors = {
        'tech': 'border-blue-500',
        'business': 'border-purple-500',
        'governance': 'border-orange-500',
        'ops': 'border-green-500'
    };

    container.innerHTML = Object.entries(domains).map(([key, domain]) => `
        <div class="bg-gray-900 rounded-lg p-4 border-l-4 ${domainColors[key] || 'border-gray-500'}">
            <h4 class="text-white font-medium mb-2">${key.toUpperCase()}</h4>
            <p class="text-gray-400 text-sm mb-2">${domain.description}</p>
            <div class="text-xs text-gray-500">
                Autoridade mínima: <span class="text-white">${domain.required_authority}</span>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
                ${(domain.examples || []).map(ex => `<span class="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs">${ex}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderAuditLogs(data) {
    const container = document.getElementById('audit-logs');
    const logs = data.logs || [];

    if (logs.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">Nenhum log de auditoria</p>';
        return;
    }

    // Contadores
    let executed = 0, blocked = 0;
    logs.forEach(log => {
        if (log.was_executed) executed++;
        if (!log.was_allowed) blocked++;
    });
    document.getElementById('audit-executed').textContent = executed;
    document.getElementById('audit-blocked').textContent = blocked;

    container.innerHTML = logs.map(log => `
        <div class="bg-gray-900 rounded p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="${log.was_allowed ? 'text-green-400' : 'text-red-400'}">${log.was_allowed ? '✓' : '✗'}</span>
                <div>
                    <span class="text-white font-mono text-sm">${log.action_type}</span>
                    ${log.block_reason ? `<span class="text-red-400 text-xs ml-2">${log.block_reason}</span>` : ''}
                </div>
            </div>
            <div class="text-gray-500 text-xs">
                ${new Date(log.executed_at).toLocaleString()}
            </div>
        </div>
    `).join('');
}

async function activateKillSwitch() {
    const reason = document.getElementById('killswitch-reason').value;
    if (!reason) {
        alert('Motivo é obrigatório');
        return;
    }

    const duration = document.getElementById('killswitch-duration').value;
    const token = localStorage.getItem('admin_token');

    try {
        const res = await fetch(`${API_URL}/admin/rules/killswitch/activate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason,
                auto_resume_after: duration || undefined
            })
        });

        if (res.ok) {
            document.getElementById('modal-killswitch').classList.add('hidden');
            document.getElementById('modal-killswitch').classList.remove('flex');
            loadGovernanceData();
        } else {
            const err = await res.json();
            alert(err.error || 'Erro ao ativar kill switch');
        }
    } catch (err) {
        alert('Erro de conexão');
    }
}

async function deactivateKillSwitch() {
    const token = localStorage.getItem('admin_token');

    try {
        const res = await fetch(`${API_URL}/admin/rules/killswitch/deactivate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            loadGovernanceData();
        }
    } catch (err) {
        alert('Erro de conexão');
    }
}

async function activateShadowMode() {
    const reason = document.getElementById('shadow-reason').value;
    if (!reason) {
        alert('Motivo é obrigatório');
        return;
    }

    const duration = document.getElementById('shadow-duration').value;
    const token = localStorage.getItem('admin_token');

    try {
        const res = await fetch(`${API_URL}/admin/rules/shadow/activate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason,
                duration: duration || undefined
            })
        });

        if (res.ok) {
            document.getElementById('modal-shadow').classList.add('hidden');
            document.getElementById('modal-shadow').classList.remove('flex');
            loadGovernanceData();
        } else {
            const err = await res.json();
            alert(err.error || 'Erro ao ativar shadow mode');
        }
    } catch (err) {
        alert('Erro de conexão');
    }
}

async function deactivateShadowMode() {
    const token = localStorage.getItem('admin_token');

    try {
        const res = await fetch(`${API_URL}/admin/rules/shadow/deactivate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
            loadGovernanceData();
        }
    } catch (err) {
        alert('Erro de conexão');
    }
}

// Expor para onclick inline
window.toggleActionPause = async function (actionType) {
    const token = localStorage.getItem('admin_token');
    // Toggle pause/resume
    try {
        await fetch(`${API_URL}/admin/rules/actions/${actionType}/pause`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        loadGovernanceData();
    } catch (err) {
        alert('Erro ao pausar ação');
    }
};

// ========================================
// AUTHORITY MANAGEMENT
// ========================================

async function renderAuthority(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold">Gestão de Autoridade</h3>
            <button onclick="showCreateAuthority()" class="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl">
                <i class="fas fa-plus mr-2"></i> Nova Autoridade
            </button>
        </div>

        <div id="create-authority-form" class="card rounded-2xl p-6 mb-6 hidden">
            <h3 class="font-bold mb-4">Conceder Autoridade</h3>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm text-gray-400 mb-2">User ID do Agente/Usuário</label>
                    <input type="text" id="auth-user-id" placeholder="UUID" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Escopo (Domain)</label>
                    <input type="text" id="auth-scope" placeholder="ex: billing, tech, governance" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Nível de Autoridade (1-5)</label>
                    <select id="auth-level" class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                        <option value="1">1 - Observer</option>
                        <option value="2">2 - Suggestor</option>
                        <option value="3">3 - Operator</option>
                        <option value="4">4 - Manager</option>
                        <option value="5">5 - Sovereign</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Limite Diário (Ações)</label>
                    <input type="number" id="auth-limit" value="100" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3">
                </div>
            </div>
            <div class="flex gap-4 mt-4">
                <button onclick="createAuthority()" class="flex-1 bg-primary hover:bg-primary/80 text-white py-3 rounded-xl">Conceder</button>
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
    const token = localStorage.getItem('admin_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        const authorities = await fetch(`${API_URL}/authority`, { headers }).then(r => r.json());
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
    } catch (err) {
        console.error(err);
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
    const token = localStorage.getItem('admin_token');

    if (!user_id) {
        alert('Informe o User ID');
        return;
    }

    try {
        await fetch(`${API_URL}/authority`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user_id, scope, level, daily_limit })
        });
        alert('Autoridade criada com sucesso');
        hideCreateAuthority();
        loadAuthorities();
    } catch (err) {
        alert('Erro ao criar autoridade: ' + err.message);
    }
}

async function revokeAuthority(id) {
    if (!confirm('Revogar esta autoridade?')) return;
    const token = localStorage.getItem('admin_token');

    try {
        await fetch(`${API_URL}/authority/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Autoridade revogada');
        loadAuthorities();
    } catch (err) {
        alert('Erro ao revogar: ' + err.message);
    }
}

// Global exports for inline onClick
window.revokeAuthority = revokeAuthority;
window.createAuthority = createAuthority;
window.showCreateAuthority = showCreateAuthority;
window.hideCreateAuthority = hideCreateAuthority;
