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

    document.getElementById('audit-filter')?.addEventListener('change', loadAuditLogsPage);
    document.getElementById('audit-search')?.addEventListener('input', debounce(loadAuditLogsPage, 300));
    await loadAuditLogsPage();
}

async function loadAuditLogsPage() {
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
