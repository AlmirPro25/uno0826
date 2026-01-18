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
