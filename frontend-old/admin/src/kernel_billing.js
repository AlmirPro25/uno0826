// ========================================
// KERNEL BILLING - Fase 28.1
// Frontend para billing do kernel
// ========================================

// Usa a função api() global definida em main.js

// ========================================
// PLANS VIEW (público)
// ========================================

async function renderKernelPlans(container) {
    container.innerHTML = `
        <div class="kernel-billing">
            <h2>📋 Planos do Kernel</h2>
            <p class="subtitle">Escolha o plano ideal para seu app</p>
            
            <div id="plans-grid" class="plans-grid">
                <div class="loading">Carregando planos...</div>
            </div>
        </div>
    `;

    try {
        const response = await api('/kernel/plans');
        const plans = response.plans || [];
        
        const plansGrid = document.getElementById('plans-grid');
        
        if (plans.length === 0) {
            plansGrid.innerHTML = '<p>Nenhum plano disponível</p>';
            return;
        }

        plansGrid.innerHTML = plans.map(plan => `
            <div class="plan-card ${plan.name}">
                <div class="plan-header">
                    <h3>${plan.display_name}</h3>
                    <div class="plan-price">
                        ${plan.price_monthly === 0 
                            ? '<span class="price">Grátis</span>' 
                            : `<span class="price">R$ ${(plan.price_monthly / 100).toFixed(2)}</span><span class="period">/mês</span>`
                        }
                    </div>
                </div>
                <p class="plan-description">${plan.description}</p>
                <ul class="plan-features">
                    <li>
                        <span class="feature-icon">📊</span>
                        ${plan.max_transactions_month === 0 ? 'Transações ilimitadas' : `${plan.max_transactions_month.toLocaleString()} transações/mês`}
                    </li>
                    <li>
                        <span class="feature-icon">📱</span>
                        ${plan.max_apps === 0 ? 'Apps ilimitados' : `${plan.max_apps} app${plan.max_apps > 1 ? 's' : ''}`}
                    </li>
                    <li>
                        <span class="feature-icon">🔗</span>
                        ${plan.max_api_calls_month === 0 ? 'API calls ilimitadas' : `${plan.max_api_calls_month.toLocaleString()} API calls/mês`}
                    </li>
                    <li>
                        <span class="feature-icon">🔔</span>
                        ${plan.max_webhooks_month === 0 ? 'Webhooks ilimitados' : `${plan.max_webhooks_month.toLocaleString()} webhooks/mês`}
                    </li>
                </ul>
            </div>
        `).join('');

    } catch (error) {
        document.getElementById('plans-grid').innerHTML = `
            <div class="error">Erro ao carregar planos: ${error.message}</div>
        `;
    }
}

// ========================================
// APP BILLING VIEW (app owner)
// ========================================

async function renderAppBilling(container, appId) {
    container.innerHTML = `
        <div class="app-billing">
            <h2>💳 Billing do App</h2>
            
            <div class="billing-sections">
                <div id="subscription-section" class="billing-section">
                    <h3>📋 Assinatura</h3>
                    <div class="loading">Carregando...</div>
                </div>
                
                <div id="usage-section" class="billing-section">
                    <h3>📊 Consumo Atual</h3>
                    <div class="loading">Carregando...</div>
                </div>
                
                <div id="invoices-section" class="billing-section">
                    <h3>📄 Faturas</h3>
                    <div class="loading">Carregando...</div>
                </div>
            </div>
        </div>
    `;

    // Carregar dados em paralelo
    await Promise.all([
        loadSubscription(appId),
        loadUsage(appId),
        loadInvoices(appId)
    ]);
}

async function loadSubscription(appId) {
    const section = document.getElementById('subscription-section');
    try {
        const data = await api(`/apps/${appId}/billing/subscription`);
        const sub = data;
        const plan = sub.plan || {};

        section.innerHTML = `
            <h3>📋 Assinatura</h3>
            <div class="subscription-card">
                <div class="current-plan">
                    <span class="plan-badge ${plan.name}">${plan.display_name || sub.plan_id}</span>
                    <span class="status-badge ${sub.status}">${sub.status}</span>
                </div>
                <div class="plan-details">
                    <p><strong>Preço:</strong> ${plan.price_monthly === 0 ? 'Grátis' : `R$ ${(plan.price_monthly / 100).toFixed(2)}/mês`}</p>
                    <p><strong>Período:</strong> ${new Date(sub.current_period_start).toLocaleDateString()} - ${new Date(sub.current_period_end).toLocaleDateString()}</p>
                    ${sub.pending_plan_id ? `<p class="pending-change">⏳ Mudança para ${sub.pending_plan_id} agendada</p>` : ''}
                    ${sub.cancel_at_period_end ? `<p class="cancel-warning">⚠️ Cancelamento agendado para ${new Date(sub.current_period_end).toLocaleDateString()}</p>` : ''}
                </div>
                <div class="subscription-actions">
                    <button onclick="window.showChangePlanModal('${appId}')" class="btn-secondary">Mudar Plano</button>
                    ${!sub.cancel_at_period_end ? `<button onclick="window.cancelSubscription('${appId}')" class="btn-danger">Cancelar</button>` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        section.innerHTML = `<h3>📋 Assinatura</h3><div class="error">${error.message}</div>`;
    }
}

async function loadUsage(appId) {
    const section = document.getElementById('usage-section');
    try {
        const data = await api(`/apps/${appId}/billing/usage`);
        const usage = data.usage || {};
        const limits = data.limits || {};

        const transactionsPercent = limits.max_transactions_month > 0 
            ? Math.min(100, (usage.transactions_count / limits.max_transactions_month) * 100) 
            : 0;
        const webhooksPercent = limits.max_webhooks_month > 0 
            ? Math.min(100, (usage.webhooks_count / limits.max_webhooks_month) * 100) 
            : 0;
        const apiCallsPercent = limits.max_api_calls_month > 0 
            ? Math.min(100, (usage.api_calls_count / limits.max_api_calls_month) * 100) 
            : 0;

        section.innerHTML = `
            <h3>📊 Consumo Atual (${usage.period || 'N/A'})</h3>
            <div class="usage-meters">
                <div class="usage-meter">
                    <div class="meter-header">
                        <span>Transações</span>
                        <span>${usage.transactions_count || 0} / ${limits.max_transactions_month === 0 ? '∞' : limits.max_transactions_month}</span>
                    </div>
                    <div class="meter-bar">
                        <div class="meter-fill ${transactionsPercent > 80 ? 'warning' : ''}" style="width: ${transactionsPercent}%"></div>
                    </div>
                </div>
                
                <div class="usage-meter">
                    <div class="meter-header">
                        <span>Webhooks</span>
                        <span>${usage.webhooks_count || 0} / ${limits.max_webhooks_month === 0 ? '∞' : limits.max_webhooks_month}</span>
                    </div>
                    <div class="meter-bar">
                        <div class="meter-fill ${webhooksPercent > 80 ? 'warning' : ''}" style="width: ${webhooksPercent}%"></div>
                    </div>
                </div>
                
                <div class="usage-meter">
                    <div class="meter-header">
                        <span>API Calls</span>
                        <span>${usage.api_calls_count || 0} / ${limits.max_api_calls_month === 0 ? '∞' : limits.max_api_calls_month}</span>
                    </div>
                    <div class="meter-bar">
                        <div class="meter-fill ${apiCallsPercent > 80 ? 'warning' : ''}" style="width: ${apiCallsPercent}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="usage-summary">
                <p><strong>Volume processado:</strong> R$ ${((usage.total_processed_amount || 0) / 100).toFixed(2)}</p>
                ${usage.first_event_at ? `<p><strong>Primeiro evento:</strong> ${new Date(usage.first_event_at).toLocaleString()}</p>` : ''}
                ${usage.last_event_at ? `<p><strong>Último evento:</strong> ${new Date(usage.last_event_at).toLocaleString()}</p>` : ''}
            </div>
        `;
    } catch (error) {
        section.innerHTML = `<h3>📊 Consumo Atual</h3><div class="error">${error.message}</div>`;
    }
}

async function loadInvoices(appId) {
    const section = document.getElementById('invoices-section');
    try {
        const data = await api(`/apps/${appId}/billing/invoices`);
        const invoices = data.invoices || [];

        if (invoices.length === 0) {
            section.innerHTML = `<h3>📄 Faturas</h3><p>Nenhuma fatura ainda</p>`;
            return;
        }

        section.innerHTML = `
            <h3>📄 Faturas</h3>
            <table class="invoices-table">
                <thead>
                    <tr>
                        <th>Período</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th>Vencimento</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map(inv => `
                        <tr>
                            <td>${new Date(inv.period_start).toLocaleDateString()} - ${new Date(inv.period_end).toLocaleDateString()}</td>
                            <td>R$ ${(inv.total / 100).toFixed(2)}</td>
                            <td><span class="status-badge ${inv.status}">${inv.status}</span></td>
                            <td>${inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        section.innerHTML = `<h3>📄 Faturas</h3><div class="error">${error.message}</div>`;
    }
}

// ========================================
// SUPERADMIN BILLING DASHBOARD
// ========================================

async function renderKernelBillingAdmin(container) {
    container.innerHTML = `
        <div class="kernel-billing-admin">
            <h2>💰 Kernel Billing (Admin)</h2>
            
            <div id="billing-stats" class="stats-cards">
                <div class="loading">Carregando estatísticas...</div>
            </div>
            
            <div class="admin-sections">
                <div id="subscriptions-section" class="admin-section">
                    <h3>📋 Subscriptions</h3>
                    <div class="loading">Carregando...</div>
                </div>
                
                <div id="pending-invoices-section" class="admin-section">
                    <h3>📄 Invoices Pendentes</h3>
                    <div class="loading">Carregando...</div>
                </div>
            </div>
            
            <div class="admin-actions">
                <button onclick="window.processBillingCycle()" class="btn-primary">🔄 Processar Ciclo de Billing</button>
            </div>
        </div>
    `;

    await Promise.all([
        loadBillingStats(),
        loadAllSubscriptions(),
        loadPendingInvoices()
    ]);
}

async function loadBillingStats() {
    const container = document.getElementById('billing-stats');
    try {
        const stats = await api('/admin/kernel/billing/stats');
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${stats.total_apps}</div>
                <div class="stat-label">Total Apps</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.active_subscriptions}</div>
                <div class="stat-label">Subscriptions Ativas</div>
            </div>
            <div class="stat-card highlight">
                <div class="stat-value">R$ ${(stats.total_mrr / 100).toFixed(2)}</div>
                <div class="stat-label">MRR</div>
            </div>
            <div class="stat-card ${stats.pending_invoices > 0 ? 'warning' : ''}">
                <div class="stat-value">${stats.pending_invoices}</div>
                <div class="stat-label">Invoices Pendentes</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">R$ ${(stats.pending_amount / 100).toFixed(2)}</div>
                <div class="stat-label">Valor Pendente</div>
            </div>
        `;

        // Distribuição por plano
        if (stats.plan_distribution) {
            const distHtml = Object.entries(stats.plan_distribution)
                .map(([plan, count]) => `<span class="plan-dist-item">${plan}: ${count}</span>`)
                .join(' | ');
            container.innerHTML += `<div class="plan-distribution">Distribuição: ${distHtml}</div>`;
        }
    } catch (error) {
        container.innerHTML = `<div class="error">${error.message}</div>`;
    }
}

async function loadAllSubscriptions() {
    const section = document.getElementById('subscriptions-section');
    try {
        const data = await api('/admin/kernel/billing/subscriptions');
        const subs = data.subscriptions || [];

        section.innerHTML = `
            <h3>📋 Subscriptions (${subs.length})</h3>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>App ID</th>
                        <th>Plano</th>
                        <th>Status</th>
                        <th>Período</th>
                    </tr>
                </thead>
                <tbody>
                    ${subs.slice(0, 20).map(sub => `
                        <tr>
                            <td><code>${sub.app_id.substring(0, 8)}...</code></td>
                            <td><span class="plan-badge ${sub.plan?.name || ''}">${sub.plan?.display_name || sub.plan_id}</span></td>
                            <td><span class="status-badge ${sub.status}">${sub.status}</span></td>
                            <td>${new Date(sub.current_period_end).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${subs.length > 20 ? `<p class="more-items">... e mais ${subs.length - 20} subscriptions</p>` : ''}
        `;
    } catch (error) {
        section.innerHTML = `<h3>📋 Subscriptions</h3><div class="error">${error.message}</div>`;
    }
}

async function loadPendingInvoices() {
    const section = document.getElementById('pending-invoices-section');
    try {
        const data = await api('/admin/kernel/billing/invoices?status=pending');
        const invoices = data.invoices || [];

        if (invoices.length === 0) {
            section.innerHTML = `<h3>📄 Invoices Pendentes</h3><p>Nenhuma invoice pendente 🎉</p>`;
            return;
        }

        section.innerHTML = `
            <h3>📄 Invoices Pendentes (${invoices.length})</h3>
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>App ID</th>
                        <th>Período</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoices.map(inv => `
                        <tr>
                            <td><code>${inv.app_id.substring(0, 8)}...</code></td>
                            <td>${new Date(inv.period_start).toLocaleDateString()}</td>
                            <td>R$ ${(inv.total / 100).toFixed(2)}</td>
                            <td>${inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '-'}</td>
                            <td>
                                <button onclick="window.markInvoicePaid('${inv.id}')" class="btn-small btn-success">✓ Pago</button>
                                <button onclick="window.voidInvoice('${inv.id}')" class="btn-small btn-danger">✗ Cancelar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        section.innerHTML = `<h3>📄 Invoices Pendentes</h3><div class="error">${error.message}</div>`;
    }
}

// ========================================
// GLOBAL ACTIONS
// ========================================

window.showChangePlanModal = async function(appId) {
    const plans = (await api('/kernel/plans')).plans || [];
    const planOptions = plans.map(p => `<option value="${p.id}">${p.display_name} - R$ ${(p.price_monthly / 100).toFixed(2)}/mês</option>`).join('');
    
    const newPlanId = prompt(`Escolha o novo plano:\n${plans.map(p => `${p.id}: ${p.display_name}`).join('\n')}`);
    if (newPlanId) {
        try {
            await api(`/apps/${appId}/billing/change-plan`, {
                method: 'POST',
                body: JSON.stringify({ plan_id: newPlanId })
            });
            alert('Plano alterado com sucesso!');
            location.reload();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }
};

window.cancelSubscription = async function(appId) {
    if (confirm('Tem certeza que deseja cancelar a assinatura? O cancelamento será efetivo no fim do período atual.')) {
        try {
            await api(`/apps/${appId}/billing/cancel`, { method: 'POST' });
            alert('Cancelamento agendado');
            location.reload();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }
};

window.markInvoicePaid = async function(invoiceId) {
    const note = prompt('Nota (opcional):');
    try {
        await api(`/admin/kernel/billing/invoices/${invoiceId}/pay`, {
            method: 'POST',
            body: JSON.stringify({ note: note || '' })
        });
        alert('Invoice marcada como paga');
        location.reload();
    } catch (error) {
        alert('Erro: ' + error.message);
    }
};

window.voidInvoice = async function(invoiceId) {
    const reason = prompt('Motivo do cancelamento:');
    if (reason) {
        try {
            await api(`/admin/kernel/billing/invoices/${invoiceId}/void`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            alert('Invoice cancelada');
            location.reload();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }
};

window.processBillingCycle = async function() {
    if (confirm('Processar ciclo de billing? Isso irá gerar invoices para todos os apps.')) {
        try {
            await api('/admin/kernel/billing/process-cycle', { method: 'POST' });
            alert('Ciclo de billing processado');
            location.reload();
        } catch (error) {
            alert('Erro: ' + error.message);
        }
    }
};

