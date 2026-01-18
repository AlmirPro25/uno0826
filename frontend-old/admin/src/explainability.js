/**
 * PROST-QS Explainability Timeline - Fase 29
 * "Transparência total sobre cada decisão"
 * 
 * Módulo para visualização da linha do tempo de decisões e divergências de políticas.
 */

async function renderExplainabilitySection(container) {
    try {
        loader(true);
        // Buscar decisões divergentes (onde a lógica de IA ou threshold divergiu do esperado)
        const data = await api('/timeline/divergent');

        container.innerHTML = `
            <div class="bg-gradient-to-r from-amber-500/20 to-amber-900/20 border-l-4 border-amber-500 rounded-2xl p-6 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                        <i class="fas fa-brain text-xl text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-lg">Decisões com Divergência</h3>
                        <p class="text-gray-400 text-sm">Identificamos ${data.count || 0} casos onde a política e o threshold de confiança divergiram.</p>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                ${renderExplainabilityTimeline(data.timelines)}
            </div>
            
            ${!data.timelines?.length ? `
                <div class="card rounded-2xl p-12 text-center text-gray-500">
                    <i class="fas fa-check-circle text-4xl text-emerald-500 mb-4 opacity-50"></i>
                    <p>Nenhuma divergência crítica detectada no momento.</p>
                </div>
            ` : ''}
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Explainability', err.message);
    } finally {
        loader(false);
    }
}

function renderExplainabilityTimeline(timelines) {
    if (!timelines?.length) return '';

    return timelines.map(t => `
        <div class="card rounded-2xl p-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-4">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${t.outcome === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}">
                    ${t.outcome.toUpperCase()}
                </span>
            </div>
            
            <div class="flex items-start gap-4">
                <div class="w-1 bg-primary self-stretch rounded-full"></div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs text-gray-500">${formatDate(t.created_at)}</span>
                        <span class="text-xs px-2 py-0.5 rounded bg-white/5 text-primary">ID: ${t.id.substring(0, 8)}</span>
                    </div>
                    
                    <h4 class="font-bold text-lg mb-2">${t.decision_type}</h4>
                    
                    <div class="grid grid-cols-2 gap-6 mt-4">
                        <div class="bg-white/5 rounded-xl p-4">
                            <p class="text-xs text-gray-500 mb-1">Raciocínio de Negócio</p>
                            <p class="text-sm">${t.reasoning || 'Sem raciocínio detalhado'}</p>
                        </div>
                        <div class="bg-white/5 rounded-xl p-4">
                            <p class="text-xs text-gray-500 mb-1">Evidências / Contexto</p>
                            <div class="text-xs font-mono text-cyan-400 truncate">
                                ${JSON.stringify(t.metadata || {})}
                            </div>
                        </div>
                    </div>

                    ${t.divergent ? `
                        <div class="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-sm">
                            <i class="fas fa-exclamation-circle text-xs"></i>
                            <strong>Nota de Divergência:</strong> Esta decisão ignorou o threshold de confiança padrão.
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}
