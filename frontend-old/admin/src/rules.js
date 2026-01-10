/**
 * PROST-QS Rules Engine - Frontend
 * "Observação → Condição → Ação"
 * 
 * Endpoints:
 * - GET  /api/v1/admin/rules/app/:appId     → Lista regras do app
 * - POST /api/v1/admin/rules                → Criar regra
 * - PUT  /api/v1/admin/rules/:id            → Atualizar regra
 * - DELETE /api/v1/admin/rules/:id          → Deletar regra
 * - POST /api/v1/admin/rules/:id/toggle     → Ativar/desativar
 * - GET  /api/v1/admin/rules/templates      → Templates pré-definidos
 * - POST /api/v1/admin/rules/from-template  → Criar de template
 * - GET  /api/v1/admin/rules/:id/executions → Histórico de execuções
 */

// ========================================
// RULES SECTION (Main Entry Point)
// ========================================

async function renderRulesSection(container) {
    // Buscar lista de apps para seleção
    try {
        const data = await api('/apps');
        const apps = data.apps || [];
        
        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-brain text-purple-400"></i>
                        Rules Engine
                    </h2>
                    <p class="text-gray-400">Sistema de decisão automática</p>
                </div>
            </div>

            <!-- App Selector -->
            <div class="card rounded-2xl p-4 mb-6">
                <label class="block text-sm text-gray-400 mb-2">Selecione um App</label>
                <select id="rules-app-selector" onchange="onRulesAppChange(this.value)"
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 focus:border-purple-500 outline-none">
                    <option value="">-- Selecione --</option>
                    ${apps.map(app => `
                        <option value="${app.id}">${app.name} (${app.slug})</option>
                    `).join('')}
                </select>
            </div>

            <!-- Rules Container -->
            <div id="rules-container">
                <div class="text-center py-12">
                    <i class="fas fa-brain text-4xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400">Selecione um app para ver as regras</p>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar apps', err.message);
    }
}

function onRulesAppChange(appId) {
    window.currentAppId = appId;
    const container = document.getElementById('rules-container');
    if (appId) {
        renderRules(container, appId);
    } else {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-brain text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Selecione um app para ver as regras</p>
            </div>
        `;
    }
}

// ========================================
// RULES LIST
// ========================================

async function renderRules(container, appId) {
    if (!appId) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-brain text-4xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Selecione um app para ver as regras</p>
            </div>
        `;
        return;
    }
    
    try {
        const [rulesData, templatesData] = await Promise.all([
            api(`/admin/rules/app/${appId}`),
            api('/admin/rules/templates')
        ]);
        
        const rules = rulesData.rules || [];
        const templates = templatesData.templates || [];
        
        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-brain text-purple-400"></i>
                        Rules Engine
                    </h2>
                    <p class="text-gray-400">Regras de decisão automática</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="showTemplatesModal('${appId}')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-magic mr-2"></i> Templates
                    </button>
                    <button onclick="showCreateRuleModal('${appId}')" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-plus mr-2"></i> Nova Regra
                    </button>
                </div>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${rules.length}</p>
                    <p class="text-gray-400 text-sm">Total Regras</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${rules.filter(r => r.status === 'active').length}</p>
                    <p class="text-gray-400 text-sm">Ativas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${rules.reduce((sum, r) => sum + (r.trigger_count || 0), 0)}</p>
                    <p class="text-gray-400 text-sm">Disparos Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${templates.length}</p>
                    <p class="text-gray-400 text-sm">Templates</p>
                </div>
            </div>

            <!-- Rules List -->
            ${rules.length > 0 ? `
                <div class="space-y-4">
                    ${rules.map(rule => renderRuleCard(rule)).join('')}
                </div>
            ` : `
                <div class="card rounded-2xl p-8 text-center">
                    <i class="fas fa-brain text-4xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400 mb-4">Nenhuma regra criada</p>
                    <p class="text-gray-500 text-sm mb-4">
                        Regras permitem automatizar decisões baseadas em métricas e eventos.
                    </p>
                    <div class="flex gap-2 justify-center">
                        <button onclick="showTemplatesModal('${appId}')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">
                            <i class="fas fa-magic mr-2"></i> Usar Template
                        </button>
                        <button onclick="showCreateRuleModal('${appId}')" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl">
                            <i class="fas fa-plus mr-2"></i> Criar do Zero
                        </button>
                    </div>
                </div>
            `}
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar regras', err.message);
    }
}

function renderRuleCard(rule) {
    const statusConfig = getRuleStatusConfig(rule.status);
    const triggerConfig = getTriggerTypeConfig(rule.trigger_type);
    const actionConfig = getActionTypeConfig(rule.action_type);
    
    return `
        <div class="card rounded-2xl p-4 hover:bg-white/5 transition-all">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 ${statusConfig.bgClass} rounded-xl flex items-center justify-center">
                        <i class="fas fa-brain ${statusConfig.iconClass} text-xl"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold">${rule.name}</h4>
                            <span class="px-2 py-0.5 rounded-full text-xs ${statusConfig.badgeClass}">
                                ${rule.status}
                            </span>
                        </div>
                        <p class="text-sm text-gray-400">${rule.description || 'Sem descrição'}</p>
                        <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span class="flex items-center gap-1">
                                <i class="fas ${triggerConfig.icon}"></i>
                                ${triggerConfig.label}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas ${actionConfig.icon}"></i>
                                ${actionConfig.label}
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-bolt"></i>
                                ${rule.trigger_count || 0} disparos
                            </span>
                            ${rule.last_triggered_at ? `
                                <span class="flex items-center gap-1">
                                    <i class="fas fa-clock"></i>
                                    Último: ${formatTimeAgo(rule.last_triggered_at)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="toggleRule('${rule.id}', ${rule.status !== 'active'})" 
                            class="p-2 rounded-lg hover:bg-white/10 transition-all"
                            title="${rule.status === 'active' ? 'Desativar' : 'Ativar'}">
                        <i class="fas ${rule.status === 'active' ? 'fa-pause' : 'fa-play'} ${rule.status === 'active' ? 'text-amber-400' : 'text-emerald-400'}"></i>
                    </button>
                    <button onclick="showRuleExecutions('${rule.id}', '${rule.name}')" 
                            class="p-2 rounded-lg hover:bg-white/10 transition-all"
                            title="Ver histórico">
                        <i class="fas fa-history text-blue-400"></i>
                    </button>
                    <button onclick="showEditRuleModal('${rule.id}')" 
                            class="p-2 rounded-lg hover:bg-white/10 transition-all"
                            title="Editar">
                        <i class="fas fa-edit text-gray-400"></i>
                    </button>
                    <button onclick="deleteRule('${rule.id}', '${rule.name}')" 
                            class="p-2 rounded-lg hover:bg-white/10 transition-all"
                            title="Deletar">
                        <i class="fas fa-trash text-rose-400"></i>
                    </button>
                </div>
            </div>
            
            <!-- Condition Preview -->
            <div class="mt-3 p-3 bg-dark rounded-xl">
                <p class="text-xs text-gray-500 mb-1">Condição:</p>
                <code class="text-sm text-cyan-400">${rule.condition || 'Sempre verdadeiro'}</code>
            </div>
        </div>
    `;
}

// ========================================
// HELPERS
// ========================================

function getRuleStatusConfig(status) {
    const configs = {
        'active': {
            bgClass: 'bg-emerald-500/20',
            iconClass: 'text-emerald-400',
            badgeClass: 'bg-emerald-500/20 text-emerald-400'
        },
        'inactive': {
            bgClass: 'bg-gray-500/20',
            iconClass: 'text-gray-400',
            badgeClass: 'bg-gray-500/20 text-gray-400'
        },
        'paused': {
            bgClass: 'bg-amber-500/20',
            iconClass: 'text-amber-400',
            badgeClass: 'bg-amber-500/20 text-amber-400'
        }
    };
    return configs[status] || configs['inactive'];
}

function getTriggerTypeConfig(type) {
    const configs = {
        'metric': { icon: 'fa-chart-line', label: 'Métrica' },
        'event': { icon: 'fa-bolt', label: 'Evento' },
        'schedule': { icon: 'fa-clock', label: 'Agendado' },
        'threshold': { icon: 'fa-exclamation-triangle', label: 'Threshold' }
    };
    return configs[type] || { icon: 'fa-question', label: type };
}

function getActionTypeConfig(type) {
    const configs = {
        'alert': { icon: 'fa-bell', label: 'Alerta' },
        'webhook': { icon: 'fa-globe', label: 'Webhook' },
        'flag': { icon: 'fa-flag', label: 'Flag' },
        'notify': { icon: 'fa-envelope', label: 'Notificar' },
        'adjust': { icon: 'fa-sliders-h', label: 'Ajustar' },
        'experiment': { icon: 'fa-flask', label: 'Experimento' }
    };
    return configs[type] || { icon: 'fa-question', label: type };
}

// ========================================
// ACTIONS
// ========================================

async function toggleRule(ruleId, active) {
    try {
        await api(`/admin/rules/${ruleId}/toggle`, {
            method: 'POST',
            body: JSON.stringify({ active })
        });
        
        showToast(active ? 'Regra ativada' : 'Regra desativada', 'success');
        
        // Recarregar lista
        if (window.currentAppId) {
            renderRules(document.getElementById('rules-container'), window.currentAppId);
        }
    } catch (err) {
        showToast('Erro ao alterar regra: ' + err.message, 'error');
    }
}

async function deleteRule(ruleId, ruleName) {
    if (!confirm(`Tem certeza que deseja deletar a regra "${ruleName}"?`)) {
        return;
    }
    
    try {
        await api(`/admin/rules/${ruleId}`, { method: 'DELETE' });
        showToast('Regra deletada', 'success');
        
        // Recarregar lista
        if (window.currentAppId) {
            renderRules(document.getElementById('rules-container'), window.currentAppId);
        }
    } catch (err) {
        showToast('Erro ao deletar regra: ' + err.message, 'error');
    }
}

// ========================================
// MODALS
// ========================================

async function showTemplatesModal(appId) {
    try {
        const data = await api('/admin/rules/templates');
        const templates = data.templates || [];
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.id = 'templates-modal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        modal.innerHTML = `
            <div class="card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Templates de Regras</h3>
                    <button onclick="document.getElementById('templates-modal').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    ${templates.map(t => `
                        <div class="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                             onclick="createFromTemplate('${t.id}', '${appId}')">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-bold">${t.name}</h4>
                                    <p class="text-sm text-gray-400">${t.description}</p>
                                    <span class="text-xs text-purple-400 mt-1 inline-block">
                                        <i class="fas fa-tag mr-1"></i>${t.category}
                                    </span>
                                </div>
                                <i class="fas fa-plus text-purple-400"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (err) {
        showToast('Erro ao carregar templates: ' + err.message, 'error');
    }
}

async function createFromTemplate(templateId, appId) {
    try {
        await api('/admin/rules/from-template', {
            method: 'POST',
            body: JSON.stringify({ template_id: templateId, app_id: appId })
        });
        
        showToast('Regra criada a partir do template', 'success');
        document.getElementById('templates-modal')?.remove();
        
        // Recarregar lista
        renderRules(document.getElementById('rules-container'), appId);
    } catch (err) {
        showToast('Erro ao criar regra: ' + err.message, 'error');
    }
}

function showCreateRuleModal(appId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.id = 'create-rule-modal';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="card rounded-2xl p-6 w-full max-w-lg">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold">Nova Regra</h3>
                <button onclick="document.getElementById('create-rule-modal').remove()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form onsubmit="submitCreateRule(event, '${appId}')">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Nome</label>
                        <input type="text" name="name" required
                               class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2 focus:border-purple-500 outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Descrição</label>
                        <input type="text" name="description"
                               class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2 focus:border-purple-500 outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Tipo de Trigger</label>
                        <select name="trigger_type" required
                                class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2 focus:border-purple-500 outline-none">
                            <option value="metric">Métrica</option>
                            <option value="threshold">Threshold</option>
                            <option value="event">Evento</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Condição</label>
                        <input type="text" name="condition" placeholder="ex: bounce_rate > 60 AND online_now > 10"
                               class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2 focus:border-purple-500 outline-none font-mono text-sm">
                        <p class="text-xs text-gray-500 mt-1">
                            Métricas: online_now, bounce_rate, match_rate, events_per_minute, active_sessions
                        </p>
                    </div>
                    
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Tipo de Ação</label>
                        <select name="action_type" required
                                class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2 focus:border-purple-500 outline-none">
                            <option value="alert">Criar Alerta</option>
                            <option value="webhook">Chamar Webhook</option>
                            <option value="flag">Marcar Flag</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm text-gray-400 mb-1">Cooldown (minutos)</label>
                        <input type="number" name="cooldown_minutes" value="60" min="1"
                               class="w-full bg-dark border border-dark-border rounded-xl px-4 py-2 focus:border-purple-500 outline-none">
                    </div>
                </div>
                
                <div class="flex gap-2 mt-6">
                    <button type="button" onclick="document.getElementById('create-rule-modal').remove()"
                            class="flex-1 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl">
                        Cancelar
                    </button>
                    <button type="submit"
                            class="flex-1 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl">
                        Criar Regra
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function submitCreateRule(event, appId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const rule = {
        app_id: appId,
        name: formData.get('name'),
        description: formData.get('description'),
        trigger_type: formData.get('trigger_type'),
        condition: formData.get('condition'),
        action_type: formData.get('action_type'),
        cooldown_minutes: parseInt(formData.get('cooldown_minutes')) || 60
    };
    
    try {
        await api('/admin/rules', {
            method: 'POST',
            body: JSON.stringify(rule)
        });
        
        showToast('Regra criada com sucesso', 'success');
        document.getElementById('create-rule-modal')?.remove();
        
        // Recarregar lista
        renderRules(document.getElementById('rules-container'), appId);
    } catch (err) {
        showToast('Erro ao criar regra: ' + err.message, 'error');
    }
}

async function showRuleExecutions(ruleId, ruleName) {
    try {
        const data = await api(`/admin/rules/${ruleId}/executions?limit=20`);
        const executions = data.executions || [];
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.id = 'executions-modal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        
        modal.innerHTML = `
            <div class="card rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold">Histórico: ${ruleName}</h3>
                    <button onclick="document.getElementById('executions-modal').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                ${executions.length > 0 ? `
                    <div class="space-y-2">
                        ${executions.map(exec => `
                            <div class="p-3 bg-white/5 rounded-xl">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2">
                                        <i class="fas ${exec.condition_met ? 'fa-check-circle text-emerald-400' : 'fa-times-circle text-gray-400'}"></i>
                                        <span class="text-sm">${exec.condition_met ? 'Condição satisfeita' : 'Condição não satisfeita'}</span>
                                    </div>
                                    <span class="text-xs text-gray-500">${formatDate(exec.executed_at)}</span>
                                </div>
                                ${exec.action_taken ? `
                                    <div class="mt-2 text-xs text-emerald-400">
                                        <i class="fas fa-bolt mr-1"></i> Ação executada
                                    </div>
                                ` : ''}
                                ${exec.error ? `
                                    <div class="mt-2 text-xs text-rose-400">
                                        <i class="fas fa-exclamation-triangle mr-1"></i> ${exec.error}
                                    </div>
                                ` : ''}
                                <div class="mt-2 text-xs text-gray-500">
                                    Duração: ${exec.duration_ms}ms
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8">
                        <i class="fas fa-history text-4xl text-gray-600 mb-4"></i>
                        <p class="text-gray-400">Nenhuma execução registrada</p>
                    </div>
                `}
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (err) {
        showToast('Erro ao carregar histórico: ' + err.message, 'error');
    }
}
