/**
 * PROST-QS Autonomy Module - Admin Dashboard
 * "A soberania é técnica, a execução é delegada"
 * 
 * Endpoints:
 * - GET  /api/v1/autonomy/matrix      → Matriz completa
 * - GET  /api/v1/autonomy/forbidden   → Ações proibidas
 * - GET  /api/v1/autonomy/autonomous  → Ações permitidas
 * - GET  /api/v1/autonomy/profiles/:id → Perfil específico
 */

async function renderAutonomySection(container) {
    try {
        const [matrix, forbidden, autonomous] = await Promise.all([
            api('/autonomy/matrix').catch(() => ({ matrix: {}, levels: {} })),
            api('/autonomy/forbidden').catch(() => ({ forbidden_actions: [] })),
            api('/autonomy/autonomous').catch(() => ({ autonomous_actions: [] }))
        ]);

        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <i class="fas fa-brain text-purple-400"></i>
                        Autonomy Matrix
                    </h2>
                    <p class="text-gray-400">Definição soberana do que a IA pode e não pode fazer autonomamente</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="showSection('autonomy')" class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button onclick="showAutonomyRulesModal()" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl transition-all">
                        <i class="fas fa-gavel mr-2"></i> Regras Globais
                    </button>
                </div>
            </div>

            <!-- Autonomy Principles -->
            <div class="bg-purple-900/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
                <h3 class="font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <i class="fas fa-scroll"></i>
                    Princípios Fundamentais
                </h3>
                <div class="grid grid-cols-2 gap-4">
                    ${(matrix.rules || []).map(rule => `
                        <div class="flex items-start gap-3 p-3 bg-black/30 rounded-xl">
                            <i class="fas fa-check-shield text-purple-500 mt-1"></i>
                            <span class="text-sm text-gray-300">${rule}</span>
                        </div>
                    `).join('') || '<p class="text-gray-500">Nenhum princípio definido</p>'}
                </div>
            </div>

            <div class="grid grid-cols-2 gap-8">
                <!-- Forbidden Actions (HARD LOCK) -->
                <div class="card rounded-2xl p-6 border-l-4 border-rose-500">
                    <h3 class="font-bold text-rose-400 mb-6 flex items-center gap-2">
                        <i class="fas fa-ban"></i>
                        Ações Proibidas (Hard Lock)
                    </h3>
                    <p class="text-xs text-gray-500 mb-4">Estas ações EXIGEM intervenção humana direta e nunca serão executadas por agentes.</p>
                    <div class="space-y-2">
                        ${forbidden.forbidden_actions?.map(action => `
                            <div class="flex items-center justify-between p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                                <span class="font-mono text-sm text-rose-300">${action}</span>
                                <span class="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">HUMAN REQUIRED</span>
                            </div>
                        `).join('') || '<p class="text-emerald-400 text-center py-4">Nenhuma ação proibida!</p>'}
                    </div>
                </div>

                <!-- Autonomous Actions (DELEGATED) -->
                <div class="card rounded-2xl p-6 border-l-4 border-emerald-500">
                    <h3 class="font-bold text-emerald-400 mb-6 flex items-center gap-2">
                        <i class="fas fa-robot"></i>
                        Ações Autônomas (Delegadas)
                    </h3>
                    <p class="text-xs text-gray-500 mb-4">Ações que podem ser executadas plenamente por agentes sob supervisão algorítmica.</p>
                    <div class="space-y-2">
                        ${autonomous.autonomous_actions?.map(action => `
                            <div class="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                                <span class="font-mono text-sm text-emerald-300">${action}</span>
                                <span class="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">AI CAPABLE</span>
                            </div>
                        `).join('') || '<p class="text-gray-500 text-center py-4">Nenhuma ação autônoma.</p>'}
                    </div>
                </div>
            </div>

            <!-- Autonomy Spectrum -->
            <div class="mt-8 card rounded-2xl p-6">
                <h3 class="font-bold mb-6 flex items-center gap-2">
                    <i class="fas fa-sliders-h text-primary"></i>
                    Espectro de Autonomia
                </h3>
                <div class="grid grid-cols-4 gap-4">
                    ${Object.entries(matrix.levels || {}).map(([key, desc]) => {
            const level = key.split('_')[0];
            const name = key.split('_')[1];
            return `
                            <div class="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all">
                                <div class="text-2xl font-black text-white/10 mb-2">${level}</div>
                                <h4 class="font-bold text-primary capitalize mb-1">${name}</h4>
                                <p class="text-xs text-gray-500">${desc}</p>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Matriz de Autonomia', err.message);
    }
}

function showAutonomyRulesModal() {
    toast('Carregando regras de segurança...', 'info');
    // Implementar visualização detalhada das regras se necessário
}
