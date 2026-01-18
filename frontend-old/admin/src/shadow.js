/**
 * PROST-QS Shadow Mode Module - Admin Dashboard
 * "Observe a intenção, antes da ação"
 * 
 * Endpoints:
 * - GET  /api/v1/shadow/executions    → Execuções simuladas recentes
 * - GET  /api/v1/shadow/agents/:id/stats → Estatísticas por agente
 */

async function renderShadowSection(container) {
    try {
        const [executionsData] = await Promise.all([
            api('/shadow/executions').catch(() => ({ executions: [] }))
        ]);

        const executions = executionsData.executions || [];

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-ghost text-amber-400"></i>
                        Shadow Mode Analysis
                    </h2>
                    <p class="text-gray-400">Monitoramento de intenções de IA sem impacto no ambiente real</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="showSection('shadow')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            <!-- Shadow Stats Summary -->
            <div class="grid grid-cols-4 gap-4 mb-8">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${executions.length}</p>
                    <p class="text-gray-400 text-sm">Simulações Recentes</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${executions.filter(e => e.would_allowed).length}</p>
                    <p class="text-gray-400 text-sm">Seriam Permitidas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-rose-400">${executions.filter(e => !e.would_allowed).length}</p>
                    <p class="text-gray-400 text-sm">Seriam Bloqueadas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">24h</p>
                    <p class="text-gray-400 text-sm">Janela de Observação</p>
                </div>
            </div>

            <!-- Execution List -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-6 flex items-center gap-2">
                    <i class="fas fa-list-ul text-primary"></i>
                    Simulações de Intenção
                </h3>
                
                ${executions.length > 0 ? `
                    <div class="space-y-4">
                        ${executions.map(e => renderShadowExecutionCard(e)).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12 text-gray-500">
                        <i class="fas fa-ghost text-4xl mb-4 opacity-20"></i>
                        <p>Nenhuma execução simulada no log recente.</p>
                    </div>
                `}
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Shadow Mode', err.message);
    }
}

function renderShadowExecutionCard(e) {
    const isAllowed = e.would_allowed;
    return `
        <div class="group bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all hover:bg-white/[0.07]">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center ${isAllowed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                        <i class="fas fa-${isAllowed ? 'check-double' : 'shield-alt'}"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-sm">${e.action_type || 'Unknown Action'}</span>
                            <span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono">${(e.id || '').substring(0, 8)}</span>
                        </div>
                        <p class="text-xs text-gray-500">Agente: ${e.agent_id || 'System'}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-xs font-bold block ${isAllowed ? 'text-emerald-400' : 'text-rose-400'}">
                        ${isAllowed ? 'WOULD ALLOW' : 'WOULD BLOCK'}
                    </span>
                    <span class="text-[10px] text-gray-500">${formatDate(e.executed_at)}</span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="p-2 rounded bg-black/20">
                    <p class="text-gray-500 mb-1">Impacto Potencial</p>
                    <p class="text-gray-300 font-mono">${e.impact_summary || 'Nenhum impacto mutável detectado'}</p>
                </div>
                <div class="p-2 rounded bg-black/20">
                    <p class="text-gray-500 mb-1">Razão da Decisão</p>
                    <p class="text-gray-300">${e.reason || 'Conforme regras de autonomia padrão'}</p>
                </div>
            </div>
            
            ${e.metadata ? `
                <div class="mt-3 pt-3 border-t border-white/5 hidden group-hover:block">
                    <pre class="text-[10px] text-gray-600 overflow-x-auto">${JSON.stringify(e.metadata, null, 2)}</pre>
                </div>
            ` : ''}
        </div>
    `;
}
