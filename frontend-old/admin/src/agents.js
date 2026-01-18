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
