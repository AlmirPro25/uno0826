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
