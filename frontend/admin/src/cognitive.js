/**
 * PROST-QS Cognitive Dashboard - Fase 26.5
 * "Observabilidade total. Zero interferência."
 * 
 * READ-ONLY: Apenas visualização, sem alteração de dados
 * 
 * Endpoints consumidos:
 * - GET /api/v1/admin/cognitive/dashboard
 * - GET /api/v1/admin/cognitive/agents
 * - GET /api/v1/admin/cognitive/decisions
 * - GET /api/v1/admin/cognitive/findings
 * - GET /api/v1/admin/cognitive/noise
 * - GET /api/v1/admin/cognitive/trust
 */

// ========================================
// COGNITIVE DASHBOARD - Home
// "O sistema está saudável? Os agentes estão úteis?"
// ========================================

async function renderCognitive(container) {
    try {
        const data = await api('/admin/cognitive/dashboard');
        
        // Determinar status geral
        const hasKillSwitch = data.active_kill_switches?.length > 0;
        const pendingRate = data.total_suggestions > 0 
            ? (data.pending_suggestions / data.total_suggestions * 100).toFixed(1) 
            : 0;
        const acceptedRate = data.decision_distribution?.find(d => d.decision === 'accepted')?.percentage || 0;
        const ignoredRate = data.decision_distribution?.find(d => d.decision === 'ignored')?.percentage || 0;
        
        // Status do sistema
        let systemStatus = 'healthy';
        let statusColor = 'emerald';
        let statusIcon = 'check-circle';
        let statusText = 'Sistema Saudável';
        
        if (hasKillSwitch) {
            systemStatus = 'critical';
            statusColor = 'red';
            statusIcon = 'exclamation-triangle';
            statusText = 'Kill Switch Ativo';
        } else if (ignoredRate > 50) {
            systemStatus = 'noisy';
            statusColor = 'amber';
            statusIcon = 'volume-up';
            statusText = 'Sistema Ruidoso';
        } else if (pendingRate > 80) {
            systemStatus = 'backlog';
            statusColor = 'amber';
            statusIcon = 'clock';
            statusText = 'Backlog Alto';
        }

        container.innerHTML = `
            <!-- Status Banner -->
            <div class="bg-gradient-to-r from-${statusColor}-500/20 to-${statusColor}-900/20 border-l-4 border-${statusColor}-500 rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-${statusColor}-500 rounded-2xl flex items-center justify-center">
                            <i class="fas fa-${statusIcon} text-3xl text-white"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">${statusText}</h2>
                            <p class="text-gray-400">Dashboard Cognitivo • Fase 26.5</p>
                        </div>
                    </div>
                    <div class="text-right text-sm text-gray-400">
                        <p>Atualizado: ${new Date(data.generated_at).toLocaleString('pt-BR')}</p>
                    </div>
                </div>
            </div>

            <!-- KPIs Principais -->
            <div class="grid grid-cols-5 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-cyan-400">${data.total_suggestions}</p>
                    <p class="text-gray-400 text-sm">Sugestões Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${data.suggestions_24h}</p>
                    <p class="text-gray-400 text-sm">Sugestões (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${data.pending_suggestions}</p>
                    <p class="text-gray-400 text-sm">Pendentes</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${data.total_decisions}</p>
                    <p class="text-gray-400 text-sm">Decisões Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold ${data.avg_decision_time_hours > 24 ? 'text-rose-400' : 'text-emerald-400'}">${data.avg_decision_time_hours?.toFixed(1) || '-'}h</p>
                    <p class="text-gray-400 text-sm">Tempo Médio</p>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-6 mb-6">
                <!-- Distribuição de Decisões -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-chart-pie text-primary"></i>
                        Distribuição de Decisões
                    </h3>
                    ${renderDecisionDistribution(data.decision_distribution)}
                </div>

                <!-- Top Findings -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-lightbulb text-amber-400"></i>
                        Top Findings
                    </h3>
                    ${renderTopFindings(data.top_findings)}
                </div>

                <!-- Top Ignorados (Ruído) -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-volume-mute text-rose-400"></i>
                        Top Ignorados (Ruído)
                    </h3>
                    ${renderTopIgnored(data.top_ignored)}
                </div>
            </div>

            <!-- Kill Switches Ativos -->
            ${hasKillSwitch ? `
                <div class="card rounded-2xl p-6 border-2 border-red-500 mb-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2 text-red-400">
                        <i class="fas fa-power-off"></i>
                        Kill Switches Ativos
                    </h3>
                    <div class="space-y-3">
                        ${data.active_kill_switches.map(ks => `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-red-500/10">
                                <div>
                                    <span class="font-bold text-red-400">${ks.scope}</span>
                                    <p class="text-sm text-gray-400">${ks.reason}</p>
                                </div>
                                <div class="text-right text-sm">
                                    <p class="text-gray-400">Ativado: ${formatDate(ks.activated_at)}</p>
                                    ${ks.expires_at ? `<p class="text-amber-400">Expira: ${formatDate(ks.expires_at)}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Legenda -->
            <div class="card rounded-2xl p-4 text-center text-sm text-gray-500">
                <i class="fas fa-info-circle mr-2"></i>
                Dashboard READ-ONLY • Dados derivados de agent_memory e human_decisions • Fase 26.5
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Dashboard Cognitivo', err.message);
    }
}

// ========================================
// COGNITIVE AGENTS - Visão dos Agentes
// ========================================

async function renderCognitiveAgents(container) {
    try {
        const data = await api('/admin/cognitive/agents');
        
        container.innerHTML = `
            <div class="mb-6">
                <h2 class="text-xl font-bold mb-2">Visão dos Agentes</h2>
                <p class="text-gray-400">Efetividade de cada agente observador</p>
            </div>

            <!-- Resumo -->
            <div class="grid grid-cols-3 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${data.total_agents}</p>
                    <p class="text-gray-400 text-sm">Agentes Ativos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-cyan-400">${data.agents?.reduce((sum, a) => sum + a.total_suggestions, 0) || 0}</p>
                    <p class="text-gray-400 text-sm">Sugestões Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${calculateOverallAcceptance(data.agents)}%</p>
                    <p class="text-gray-400 text-sm">Taxa Aceitação Média</p>
                </div>
            </div>

            <!-- Tabela de Agentes -->
            <div class="card rounded-2xl overflow-hidden">
                <table class="w-full">
                    <thead class="bg-white/5">
                        <tr>
                            <th class="text-left p-4 text-sm text-gray-400">Agente</th>
                            <th class="text-center p-4 text-sm text-gray-400">Sugestões</th>
                            <th class="text-center p-4 text-sm text-gray-400">24h</th>
                            <th class="text-center p-4 text-sm text-gray-400">Aceitas</th>
                            <th class="text-center p-4 text-sm text-gray-400">Ignoradas</th>
                            <th class="text-center p-4 text-sm text-gray-400">Adiadas</th>
                            <th class="text-center p-4 text-sm text-gray-400">Taxa Aceitação</th>
                            <th class="text-center p-4 text-sm text-gray-400">Confiança Média</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.agents?.map(agent => `
                            <tr class="table-row border-t border-dark-border">
                                <td class="p-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                                            <i class="fas fa-robot text-purple-400"></i>
                                        </div>
                                        <span class="font-medium">${agent.agent}</span>
                                    </div>
                                </td>
                                <td class="p-4 text-center">${agent.total_suggestions}</td>
                                <td class="p-4 text-center text-cyan-400">${agent.suggestions_24h}</td>
                                <td class="p-4 text-center text-emerald-400">${agent.accepted_count}</td>
                                <td class="p-4 text-center text-rose-400">${agent.ignored_count}</td>
                                <td class="p-4 text-center text-amber-400">${agent.deferred_count}</td>
                                <td class="p-4 text-center">
                                    <span class="px-3 py-1 rounded-full text-sm ${getAcceptanceColor(agent.acceptance_rate)}">
                                        ${agent.acceptance_rate.toFixed(1)}%
                                    </span>
                                </td>
                                <td class="p-4 text-center">
                                    <span class="px-3 py-1 rounded-full text-sm ${getConfidenceColor(agent.avg_confidence)}">
                                        ${(agent.avg_confidence * 100).toFixed(0)}%
                                    </span>
                                </td>
                            </tr>
                        `).join('') || '<tr><td colspan="8" class="p-8 text-center text-gray-500">Nenhum agente encontrado</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Legenda -->
            <div class="card rounded-2xl p-4 mt-6 text-sm text-gray-500">
                <div class="flex items-center justify-center gap-6">
                    <span><span class="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>Taxa ≥ 60%</span>
                    <span><span class="inline-block w-3 h-3 rounded-full bg-amber-500 mr-2"></span>Taxa 30-60%</span>
                    <span><span class="inline-block w-3 h-3 rounded-full bg-rose-500 mr-2"></span>Taxa < 30%</span>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Agentes', err.message);
    }
}


// ========================================
// COGNITIVE DECISIONS - Estatísticas de Decisões
// ========================================

async function renderCognitiveDecisions(container) {
    try {
        const data = await api('/admin/cognitive/decisions');
        
        container.innerHTML = `
            <div class="mb-6">
                <h2 class="text-xl font-bold mb-2">Estatísticas de Decisões</h2>
                <p class="text-gray-400">Padrões de decisões humanas sobre sugestões</p>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-primary">${data.total_decisions}</p>
                    <p class="text-gray-400 text-sm">Total de Decisões</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-cyan-400">${data.last_24h}</p>
                    <p class="text-gray-400 text-sm">Últimas 24h</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${data.last_7d}</p>
                    <p class="text-gray-400 text-sm">Últimos 7 dias</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${data.avg_reason_length?.toFixed(0) || '-'}</p>
                    <p class="text-gray-400 text-sm">Tamanho Médio Reason</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
                <!-- Distribuição por Tipo -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-chart-pie text-primary"></i>
                        Distribuição por Tipo
                    </h3>
                    ${renderDecisionDistribution(data.by_type)}
                </div>

                <!-- Top Humanos -->
                <div class="card rounded-2xl p-6">
                    <h3 class="font-bold mb-4 flex items-center gap-2">
                        <i class="fas fa-users text-emerald-400"></i>
                        Top Decisores
                    </h3>
                    <div class="space-y-3">
                        ${data.by_human?.map((h, i) => `
                            <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">${i + 1}</span>
                                    <span class="font-medium">${h.human}</span>
                                </div>
                                <span class="text-emerald-400 font-bold">${h.count}</span>
                            </div>
                        `).join('') || '<p class="text-gray-500 text-center py-4">Nenhum decisor encontrado</p>'}
                    </div>
                </div>
            </div>

            <!-- Insight -->
            <div class="card rounded-2xl p-4 mt-6 text-center">
                <p class="text-sm text-gray-400">
                    <i class="fas fa-lightbulb text-amber-400 mr-2"></i>
                    Reasons mais longos indicam decisões mais ponderadas. Média ideal: 50-200 caracteres.
                </p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Decisões', err.message);
    }
}

// ========================================
// COGNITIVE NOISE - Padrões de Ruído
// ========================================

async function renderCognitiveNoise(container) {
    try {
        const data = await api('/admin/cognitive/noise');
        
        const hasNoise = data.patterns?.length > 0;
        const highNoisePatterns = data.patterns?.filter(p => p.ignore_rate > 70) || [];
        
        container.innerHTML = `
            <div class="mb-6">
                <h2 class="text-xl font-bold mb-2">Padrões de Ruído</h2>
                <p class="text-gray-400">Findings frequentemente ignorados — candidatos a silenciamento na Fase 27</p>
            </div>

            <!-- Status -->
            <div class="bg-gradient-to-r ${highNoisePatterns.length > 0 ? 'from-rose-500/20 to-rose-900/20 border-rose-500' : 'from-emerald-500/20 to-emerald-900/20 border-emerald-500'} border-l-4 rounded-2xl p-6 mb-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 ${highNoisePatterns.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'} rounded-xl flex items-center justify-center">
                        <i class="fas fa-${highNoisePatterns.length > 0 ? 'volume-up' : 'volume-mute'} text-xl text-white"></i>
                    </div>
                    <div>
                        <h3 class="font-bold">${highNoisePatterns.length > 0 ? `${highNoisePatterns.length} padrões de alto ruído detectados` : 'Ruído sob controle'}</h3>
                        <p class="text-gray-400 text-sm">Total de sugestões ignoradas: ${data.total_noise || 0}</p>
                    </div>
                </div>
            </div>

            <!-- Tabela de Padrões -->
            ${hasNoise ? `
                <div class="card rounded-2xl overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-white/5">
                            <tr>
                                <th class="text-left p-4 text-sm text-gray-400">Finding</th>
                                <th class="text-center p-4 text-sm text-gray-400">Vezes Ignorado</th>
                                <th class="text-center p-4 text-sm text-gray-400">Taxa de Ignore</th>
                                <th class="text-center p-4 text-sm text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.patterns.map(p => `
                                <tr class="table-row border-t border-dark-border">
                                    <td class="p-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 ${p.ignore_rate > 70 ? 'bg-rose-500/20' : 'bg-amber-500/20'} rounded-xl flex items-center justify-center">
                                                <i class="fas fa-${p.ignore_rate > 70 ? 'times' : 'minus'} ${p.ignore_rate > 70 ? 'text-rose-400' : 'text-amber-400'}"></i>
                                            </div>
                                            <span class="font-medium text-sm">${truncateText(p.finding, 60)}</span>
                                        </div>
                                    </td>
                                    <td class="p-4 text-center text-rose-400 font-bold">${p.times_ignored}</td>
                                    <td class="p-4 text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <div class="w-24 bg-gray-700 rounded-full h-2">
                                                <div class="${p.ignore_rate > 70 ? 'bg-rose-500' : 'bg-amber-500'} rounded-full h-2" style="width: ${p.ignore_rate}%"></div>
                                            </div>
                                            <span class="text-sm ${p.ignore_rate > 70 ? 'text-rose-400' : 'text-amber-400'}">${p.ignore_rate.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td class="p-4 text-center">
                                        <span class="px-3 py-1 rounded-full text-xs ${p.ignore_rate > 70 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}">
                                            ${p.ignore_rate > 70 ? 'Alto Ruído' : 'Moderado'}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="card rounded-2xl p-8 text-center">
                    <i class="fas fa-check-circle text-4xl text-emerald-400 mb-4"></i>
                    <p class="text-gray-400">Nenhum padrão de ruído significativo detectado</p>
                </div>
            `}

            <!-- Insight -->
            <div class="card rounded-2xl p-4 mt-6">
                <p class="text-sm text-gray-400 text-center">
                    <i class="fas fa-info-circle text-cyan-400 mr-2"></i>
                    Padrões com taxa de ignore > 70% são candidatos a silenciamento na Fase 27 (Calibração Cognitiva)
                </p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Padrões de Ruído', err.message);
    }
}

// ========================================
// COGNITIVE TRUST - Evolução da Confiança
// ========================================

async function renderCognitiveTrust(container) {
    try {
        const data = await api('/admin/cognitive/trust?days=30');
        
        // Calcular métricas
        const hasDays = data.days?.length > 0;
        const trendIcon = data.trend_status === 'improving' ? 'arrow-up' : 
                         data.trend_status === 'declining' ? 'arrow-down' : 'minus';
        const trendColor = data.trend_status === 'improving' ? 'emerald' : 
                          data.trend_status === 'declining' ? 'rose' : 'amber';
        const trendText = data.trend_status === 'improving' ? 'Melhorando' : 
                         data.trend_status === 'declining' ? 'Declinando' : 
                         data.trend_status === 'insufficient_data' ? 'Dados Insuficientes' : 'Estável';

        // Calcular médias
        let avgAcceptance = 0;
        let totalDecisions = 0;
        if (hasDays) {
            const sum = data.days.reduce((acc, d) => acc + d.acceptance_rate, 0);
            avgAcceptance = sum / data.days.length;
            totalDecisions = data.days.reduce((acc, d) => acc + d.total, 0);
        }

        container.innerHTML = `
            <div class="mb-6">
                <h2 class="text-xl font-bold mb-2">Evolução da Confiança</h2>
                <p class="text-gray-400">Como a confiança no sistema evolui ao longo do tempo</p>
            </div>

            <!-- Status de Tendência -->
            <div class="bg-gradient-to-r from-${trendColor}-500/20 to-${trendColor}-900/20 border-l-4 border-${trendColor}-500 rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-${trendColor}-500 rounded-2xl flex items-center justify-center">
                            <i class="fas fa-${trendIcon} text-3xl text-white"></i>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold">Tendência: ${trendText}</h3>
                            <p class="text-gray-400">Baseado nos últimos 14 dias vs 14 anteriores</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-3xl font-bold text-${trendColor}-400">${avgAcceptance.toFixed(1)}%</p>
                        <p class="text-gray-400 text-sm">Taxa Média de Aceitação</p>
                    </div>
                </div>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-primary">${data.days?.length || 0}</p>
                    <p class="text-gray-400 text-sm">Dias com Dados</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${totalDecisions}</p>
                    <p class="text-gray-400 text-sm">Decisões no Período</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-cyan-400">${hasDays ? data.days[0]?.acceptance_rate?.toFixed(1) : '-'}%</p>
                    <p class="text-gray-400 text-sm">Taxa Hoje</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">${hasDays ? data.days[data.days.length - 1]?.acceptance_rate?.toFixed(1) : '-'}%</p>
                    <p class="text-gray-400 text-sm">Taxa Início</p>
                </div>
            </div>

            <!-- Tabela de Evolução -->
            ${hasDays ? `
                <div class="card rounded-2xl overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-white/5">
                            <tr>
                                <th class="text-left p-4 text-sm text-gray-400">Data</th>
                                <th class="text-center p-4 text-sm text-gray-400">Aceitas</th>
                                <th class="text-center p-4 text-sm text-gray-400">Ignoradas</th>
                                <th class="text-center p-4 text-sm text-gray-400">Adiadas</th>
                                <th class="text-center p-4 text-sm text-gray-400">Total</th>
                                <th class="text-center p-4 text-sm text-gray-400">Taxa Aceitação</th>
                                <th class="text-center p-4 text-sm text-gray-400">Reason Médio</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.days.slice(0, 14).map(d => `
                                <tr class="table-row border-t border-dark-border">
                                    <td class="p-4 font-medium">${formatDateShort(d.day)}</td>
                                    <td class="p-4 text-center text-emerald-400">${d.accepted}</td>
                                    <td class="p-4 text-center text-rose-400">${d.ignored}</td>
                                    <td class="p-4 text-center text-amber-400">${d.deferred}</td>
                                    <td class="p-4 text-center">${d.total}</td>
                                    <td class="p-4 text-center">
                                        <span class="px-3 py-1 rounded-full text-sm ${getAcceptanceColor(d.acceptance_rate)}">
                                            ${d.acceptance_rate.toFixed(1)}%
                                        </span>
                                    </td>
                                    <td class="p-4 text-center text-gray-400">${d.avg_reason_len?.toFixed(0) || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="card rounded-2xl p-8 text-center">
                    <i class="fas fa-chart-line text-4xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400">Dados insuficientes para análise de tendência</p>
                    <p class="text-gray-500 text-sm mt-2">Continue operando o sistema para coletar mais dados</p>
                </div>
            `}

            <!-- Insight -->
            <div class="card rounded-2xl p-4 mt-6">
                <p class="text-sm text-gray-400 text-center">
                    <i class="fas fa-lightbulb text-amber-400 mr-2"></i>
                    Taxa de aceitação crescente indica que o sistema está gerando sugestões mais úteis
                </p>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Evolução da Confiança', err.message);
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function renderDecisionDistribution(distribution) {
    if (!distribution?.length) {
        return '<p class="text-gray-500 text-center py-4">Sem dados</p>';
    }

    const colors = {
        accepted: { bg: 'bg-emerald-500', text: 'text-emerald-400', icon: 'check' },
        ignored: { bg: 'bg-rose-500', text: 'text-rose-400', icon: 'times' },
        deferred: { bg: 'bg-amber-500', text: 'text-amber-400', icon: 'clock' }
    };

    return `
        <div class="space-y-4">
            ${distribution.map(d => {
                const c = colors[d.decision] || { bg: 'bg-gray-500', text: 'text-gray-400', icon: 'question' };
                return `
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="flex items-center gap-2">
                                <i class="fas fa-${c.icon} ${c.text}"></i>
                                <span class="capitalize">${d.decision}</span>
                            </span>
                            <span class="${c.text}">${d.count} (${d.percentage.toFixed(1)}%)</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-3">
                            <div class="${c.bg} rounded-full h-3 transition-all" style="width: ${d.percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderTopFindings(findings) {
    if (!findings?.length) {
        return '<p class="text-gray-500 text-center py-4">Sem dados</p>';
    }

    return `
        <div class="space-y-3">
            ${findings.map((f, i) => `
                <div class="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs text-amber-400">${i + 1}</span>
                        <span class="text-sm truncate" title="${f.finding}">${truncateText(f.finding, 40)}</span>
                    </div>
                    <div class="text-right ml-4">
                        <span class="text-amber-400 font-bold">${f.occurrences}</span>
                        <span class="text-gray-500 text-xs ml-1">(${(f.avg_confidence * 100).toFixed(0)}%)</span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderTopIgnored(ignored) {
    if (!ignored?.length) {
        return '<p class="text-emerald-400 text-center py-4"><i class="fas fa-check-circle mr-2"></i>Nenhum padrão de ruído</p>';
    }

    return `
        <div class="space-y-3">
            ${ignored.map((f, i) => `
                <div class="flex items-center justify-between p-3 rounded-xl bg-rose-500/10">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <span class="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-xs text-rose-400">${i + 1}</span>
                        <span class="text-sm truncate" title="${f.finding}">${truncateText(f.finding, 40)}</span>
                    </div>
                    <span class="text-rose-400 font-bold ml-4">${f.occurrences}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderError(title, message) {
    return `
        <div class="card rounded-2xl p-8 text-center">
            <i class="fas fa-exclamation-triangle text-4xl text-amber-400 mb-4"></i>
            <h3 class="font-bold mb-2">${title}</h3>
            <p class="text-gray-400">${message}</p>
        </div>
    `;
}

function truncateText(text, maxLen) {
    if (!text) return '-';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
}

function getAcceptanceColor(rate) {
    if (rate >= 60) return 'bg-emerald-500/20 text-emerald-400';
    if (rate >= 30) return 'bg-amber-500/20 text-amber-400';
    return 'bg-rose-500/20 text-rose-400';
}

function getConfidenceColor(confidence) {
    if (confidence >= 0.7) return 'bg-emerald-500/20 text-emerald-400';
    if (confidence >= 0.4) return 'bg-amber-500/20 text-amber-400';
    return 'bg-rose-500/20 text-rose-400';
}

function calculateOverallAcceptance(agents) {
    if (!agents?.length) return 0;
    const totalAccepted = agents.reduce((sum, a) => sum + a.accepted_count, 0);
    const totalDecisions = agents.reduce((sum, a) => sum + a.accepted_count + a.ignored_count + a.deferred_count, 0);
    return totalDecisions > 0 ? (totalAccepted / totalDecisions * 100).toFixed(1) : 0;
}


// ========================================
// COGNITIVE NARRATOR - Fase 26.6
// "Gemini como narrador, não como cérebro"
// ========================================

// Adicionar botão de narração ao dashboard cognitivo
function addNarratorButton(container) {
    const narratorSection = document.createElement('div');
    narratorSection.className = 'card rounded-2xl p-6 mt-6';
    narratorSection.innerHTML = `
        <h3 class="font-bold mb-4 flex items-center gap-2">
            <i class="fas fa-microphone text-purple-400"></i>
            Narrador Cognitivo (Gemini)
        </h3>
        <div class="grid grid-cols-4 gap-4 mb-4">
            <button onclick="generateNarrative('summary')" class="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 py-3 px-4 rounded-xl transition-all">
                <i class="fas fa-bolt mr-2"></i>Resumo Instantâneo
            </button>
            <button onclick="generateNarrative('daily')" class="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-3 px-4 rounded-xl transition-all">
                <i class="fas fa-calendar-day mr-2"></i>Relatório Diário
            </button>
            <button onclick="generateNarrative('weekly')" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 py-3 px-4 rounded-xl transition-all">
                <i class="fas fa-calendar-week mr-2"></i>Relatório Semanal
            </button>
            <button onclick="showQuestionModal()" class="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 py-3 px-4 rounded-xl transition-all">
                <i class="fas fa-question-circle mr-2"></i>Fazer Pergunta
            </button>
        </div>
        <div id="narrative-output" class="hidden">
            <div class="bg-white/5 rounded-xl p-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-gray-400" id="narrative-meta"></span>
                    <button onclick="copyNarrative()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div id="narrative-text" class="text-sm whitespace-pre-wrap"></div>
            </div>
        </div>
        <div id="narrative-loading" class="hidden text-center py-8">
            <div class="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p class="text-gray-400 text-sm">Gerando narrativa...</p>
        </div>
    `;
    container.appendChild(narratorSection);
}

// Gerar narrativa
async function generateNarrative(type, question = '') {
    const output = document.getElementById('narrative-output');
    const loading = document.getElementById('narrative-loading');
    const textEl = document.getElementById('narrative-text');
    const metaEl = document.getElementById('narrative-meta');

    output.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
        const body = { type };
        if (question) body.question = question;

        const response = await api('/admin/cognitive/narrate', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        textEl.textContent = response.narrative;
        metaEl.textContent = `${response.type} • ${response.model} • ${new Date(response.generated_at).toLocaleString('pt-BR')}`;
        
        loading.classList.add('hidden');
        output.classList.remove('hidden');

        toast('Narrativa gerada com sucesso', 'success');
    } catch (err) {
        loading.classList.add('hidden');
        toast('Erro ao gerar narrativa: ' + err.message, 'error');
    }
}

// Modal de pergunta
function showQuestionModal() {
    const modal = document.createElement('div');
    modal.id = 'question-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="card rounded-2xl p-6 w-full max-w-lg mx-4">
            <h3 class="font-bold mb-4 flex items-center gap-2">
                <i class="fas fa-question-circle text-amber-400"></i>
                Fazer Pergunta ao Narrador
            </h3>
            <p class="text-gray-400 text-sm mb-4">
                O narrador irá responder baseado nos dados do sistema. Ele NÃO pode sugerir ações ou mudanças.
            </p>
            <textarea id="question-input" rows="3" placeholder="Ex: Por que o agente error_rate está sendo ignorado?" 
                class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none mb-4"></textarea>
            <div class="flex gap-3">
                <button onclick="closeQuestionModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-xl">
                    Cancelar
                </button>
                <button onclick="submitQuestion()" class="flex-1 bg-amber-500 hover:bg-amber-600 py-2 rounded-xl">
                    <i class="fas fa-paper-plane mr-2"></i>Enviar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeQuestionModal() {
    document.getElementById('question-modal')?.remove();
}

function submitQuestion() {
    const question = document.getElementById('question-input')?.value?.trim();
    if (!question) {
        toast('Digite uma pergunta', 'warning');
        return;
    }
    closeQuestionModal();
    generateNarrative('question', question);
}

// Copiar narrativa
function copyNarrative() {
    const text = document.getElementById('narrative-text')?.textContent;
    if (text) {
        navigator.clipboard.writeText(text);
        toast('Narrativa copiada!', 'success');
    }
}

// Modificar renderCognitive para incluir narrador
const originalRenderCognitive = renderCognitive;
renderCognitive = async function(container) {
    await originalRenderCognitive(container);
    addNarratorButton(container);
};
