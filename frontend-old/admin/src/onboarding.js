// ========================================
// ONBOARDING - Primeira experiência
// ========================================

function renderOnboarding(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <div class="text-center mb-12">
                <h1 class="text-4xl font-bold text-white mb-4">Bem-vindo ao PROST-QS</h1>
                <p class="text-xl text-gray-400">Consciência operacional para seu app</p>
            </div>

            <!-- Timeline -->
            <div class="relative">
                <!-- Linha vertical -->
                <div class="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-700"></div>

                <!-- Dia 0 -->
                <div class="relative flex items-start mb-8">
                    <div class="flex-shrink-0 w-16 h-16 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center z-10">
                        <span class="text-green-400 font-bold">0</span>
                    </div>
                    <div class="ml-6 bg-gray-800 rounded-lg p-6 flex-1">
                        <h3 class="text-lg font-semibold text-white mb-2">Conexão</h3>
                        <p class="text-gray-400 mb-4">15 minutos para integrar. 3 linhas de código.</p>
                        <div class="bg-gray-900 rounded p-4 font-mono text-sm text-gray-300">
                            <div>prostqs.session.start(userId)</div>
                            <div>prostqs.session.ping(sessionId)</div>
                            <div>prostqs.session.end(sessionId)</div>
                        </div>
                        <p class="text-green-400 mt-4 text-sm">✓ Dashboard mostra usuários online em tempo real</p>
                    </div>
                </div>

                <!-- Dia 1-3 -->
                <div class="relative flex items-start mb-8">
                    <div class="flex-shrink-0 w-16 h-16 bg-blue-500/20 border-2 border-blue-500 rounded-full flex items-center justify-center z-10">
                        <span class="text-blue-400 font-bold">1-3</span>
                    </div>
                    <div class="ml-6 bg-gray-800 rounded-lg p-6 flex-1">
                        <h3 class="text-lg font-semibold text-white mb-2">Observação Pura</h3>
                        <p class="text-gray-400 mb-4">O sistema coleta. Você observa. Nenhuma ação automática.</p>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gray-900 rounded p-3">
                                <div class="text-gray-500 text-xs">Usuários/hora</div>
                                <div class="text-white text-lg">Coletando...</div>
                            </div>
                            <div class="bg-gray-900 rounded p-3">
                                <div class="text-gray-500 text-xs">Duração média</div>
                                <div class="text-white text-lg">Coletando...</div>
                            </div>
                            <div class="bg-gray-900 rounded p-3">
                                <div class="text-gray-500 text-xs">Bounce rate</div>
                                <div class="text-white text-lg">Coletando...</div>
                            </div>
                            <div class="bg-gray-900 rounded p-3">
                                <div class="text-gray-500 text-xs">Horário de pico</div>
                                <div class="text-white text-lg">Coletando...</div>
                            </div>
                        </div>
                        <p class="text-blue-400 mt-4 text-sm">✓ Baseline estabelecido sem interferência</p>
                    </div>
                </div>

                <!-- Dia 4 -->
                <div class="relative flex items-start mb-8">
                    <div class="flex-shrink-0 w-16 h-16 bg-yellow-500/20 border-2 border-yellow-500 rounded-full flex items-center justify-center z-10">
                        <span class="text-yellow-400 font-bold">4</span>
                    </div>
                    <div class="ml-6 bg-gray-800 rounded-lg p-6 flex-1">
                        <h3 class="text-lg font-semibold text-white mb-2">Shadow Mode</h3>
                        <p class="text-gray-400 mb-4">Primeira regra ativada em modo simulação.</p>
                        <div class="bg-gray-900 rounded p-4 border-l-4 border-yellow-500">
                            <div class="text-yellow-400 text-sm font-medium mb-1">REGRA EM SHADOW</div>
                            <div class="text-white">Se bounce_rate > 60%, criar alerta</div>
                            <div class="text-gray-500 text-sm mt-2">Teria disparado 3x hoje</div>
                        </div>
                        <p class="text-yellow-400 mt-4 text-sm">✓ Calibrar thresholds sem risco</p>
                    </div>
                </div>

                <!-- Dia 5 -->
                <div class="relative flex items-start mb-8">
                    <div class="flex-shrink-0 w-16 h-16 bg-purple-500/20 border-2 border-purple-500 rounded-full flex items-center justify-center z-10">
                        <span class="text-purple-400 font-bold">5</span>
                    </div>
                    <div class="ml-6 bg-gray-800 rounded-lg p-6 flex-1">
                        <h3 class="text-lg font-semibold text-white mb-2">Ativação Gradual</h3>
                        <p class="text-gray-400 mb-4">Regra sai do shadow. Alertas reais começam.</p>
                        <div class="bg-gray-900 rounded p-4 border-l-4 border-purple-500">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-yellow-400">⚠️</span>
                                <span class="text-white font-medium">Bounce Rate Alto</span>
                            </div>
                            <div class="text-gray-400 text-sm">Valor: 73% | Horário: 22:15</div>
                        </div>
                        <p class="text-purple-400 mt-4 text-sm">✓ Primeiro alerta real com contexto</p>
                    </div>
                </div>

                <!-- Dia 6 -->
                <div class="relative flex items-start mb-8">
                    <div class="flex-shrink-0 w-16 h-16 bg-orange-500/20 border-2 border-orange-500 rounded-full flex items-center justify-center z-10">
                        <span class="text-orange-400 font-bold">6</span>
                    </div>
                    <div class="ml-6 bg-gray-800 rounded-lg p-6 flex-1">
                        <h3 class="text-lg font-semibold text-white mb-2">Ação Consequente</h3>
                        <p class="text-gray-400 mb-4">Sistema escala alertas não reconhecidos.</p>
                        <div class="flex items-center gap-4">
                            <div class="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-sm">warning</div>
                            <span class="text-gray-500">→ 30min sem ack →</span>
                            <div class="bg-red-500/20 text-red-400 px-3 py-1 rounded text-sm">critical</div>
                        </div>
                        <p class="text-orange-400 mt-4 text-sm">✓ Sistema ensina a prestar atenção</p>
                    </div>
                </div>

                <!-- Dia 7 -->
                <div class="relative flex items-start">
                    <div class="flex-shrink-0 w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center z-10">
                        <span class="text-emerald-400 font-bold">7</span>
                    </div>
                    <div class="ml-6 bg-gray-800 rounded-lg p-6 flex-1">
                        <h3 class="text-lg font-semibold text-white mb-2">Governança Visível</h3>
                        <p class="text-gray-400 mb-4">Confiança estabelecida. Limites claros.</p>
                        <div class="grid grid-cols-3 gap-4">
                            <div class="bg-gray-900 rounded p-3 text-center">
                                <div class="text-2xl mb-1">⚪</div>
                                <div class="text-gray-400 text-xs">Kill Switch</div>
                                <div class="text-green-400 text-sm">Inativo</div>
                            </div>
                            <div class="bg-gray-900 rounded p-3 text-center">
                                <div class="text-2xl mb-1">📋</div>
                                <div class="text-gray-400 text-xs">Auditoria</div>
                                <div class="text-green-400 text-sm">100%</div>
                            </div>
                            <div class="bg-gray-900 rounded p-3 text-center">
                                <div class="text-2xl mb-1">🛡️</div>
                                <div class="text-gray-400 text-xs">Bloqueios</div>
                                <div class="text-green-400 text-sm">0</div>
                            </div>
                        </div>
                        <p class="text-emerald-400 mt-4 text-sm">✓ Sistema faz o que promete, dentro dos limites</p>
                    </div>
                </div>
            </div>

            <!-- CTA -->
            <div class="mt-12 text-center">
                <div class="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-8 border border-blue-500/30">
                    <h2 class="text-2xl font-bold text-white mb-4">Pronto para começar?</h2>
                    <p class="text-gray-400 mb-6">Em 7 dias, você passa de "não sei o que está acontecendo" para "sei exatamente o que está acontecendo".</p>
                    <button onclick="window.location.hash='#applications'" class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
                        Ver Meus Apps
                    </button>
                </div>
            </div>

            <!-- Princípios -->
            <div class="mt-12 grid grid-cols-2 gap-6">
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-white mb-4">O que o PROST-QS é</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Consciência operacional</li>
                        <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Decisões explicáveis</li>
                        <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Ações com limites</li>
                        <li class="flex items-center gap-2"><span class="text-green-400">✓</span> Auditoria completa</li>
                    </ul>
                </div>
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-white mb-4">O que o PROST-QS não é</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li class="flex items-center gap-2"><span class="text-red-400">✗</span> Caixa-preta de ML</li>
                        <li class="flex items-center gap-2"><span class="text-red-400">✗</span> Automação sem controle</li>
                        <li class="flex items-center gap-2"><span class="text-red-400">✗</span> Substituto de banco de dados</li>
                        <li class="flex items-center gap-2"><span class="text-red-400">✗</span> Analytics tradicional</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}
