/**
 * PROST-QS Applications Management - Frontend
 * "Gerenciamento de Apps e API Keys"
 * 
 * Endpoints consumidos:
 * - GET  /api/v1/apps/mine           → Lista apps do usuário
 * - GET  /api/v1/apps                → Lista todos (admin)
 * - POST /api/v1/apps                → Criar app
 * - GET  /api/v1/apps/:id            → Detalhes do app
 * - PUT  /api/v1/apps/:id            → Atualizar app
 * - POST /api/v1/apps/:id/credentials → Criar API Key
 * - GET  /api/v1/apps/:id/credentials → Listar credentials
 * - DELETE /api/v1/apps/:id/credentials/:credId → Revogar
 * - GET  /api/v1/apps/:id/metrics    → Métricas do app
 */

// ========================================
// APPLICATIONS LIST
// ========================================

async function renderApplications(container) {
    try {
        const data = await api('/apps');
        const apps = data.apps || [];
        
        container.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-xl font-bold">Applications</h2>
                    <p class="text-gray-400">Gerencie seus apps e API Keys</p>
                </div>
                <button onclick="showCreateAppModal()" class="bg-primary hover:bg-primary/80 px-4 py-2 rounded-xl transition-all">
                    <i class="fas fa-plus mr-2"></i> Novo App
                </button>
            </div>

            <!-- Stats -->
            <div class="grid grid-cols-4 gap-4 mb-6">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400">${data.total || apps.length}</p>
                    <p class="text-gray-400 text-sm">Total Apps</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400">${apps.filter(a => a.status === 'active').length}</p>
                    <p class="text-gray-400 text-sm">Ativos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400">${apps.filter(a => a.status === 'suspended').length}</p>
                    <p class="text-gray-400 text-sm">Suspensos</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400">-</p>
                    <p class="text-gray-400 text-sm">API Calls (24h)</p>
                </div>
            </div>

            <!-- Apps Table -->
            ${apps.length > 0 ? `
                <div class="card rounded-2xl overflow-hidden">
                    <table class="w-full">
                        <thead class="bg-white/5">
                            <tr>
                                <th class="text-left p-4 text-sm text-gray-400">App</th>
                                <th class="text-left p-4 text-sm text-gray-400">Slug</th>
                                <th class="text-center p-4 text-sm text-gray-400">Status</th>
                                <th class="text-center p-4 text-sm text-gray-400">Criado</th>
                                <th class="text-center p-4 text-sm text-gray-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${apps.map(app => `
                                <tr class="table-row border-t border-dark-border hover:bg-white/5 cursor-pointer" onclick="showAppDetail('${app.id}')">
                                    <td class="p-4">
                                        <div class="flex items-center gap-3">
                                            <div class="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                                <i class="fas fa-cube text-blue-400"></i>
                                            </div>
                                            <div>
                                                <p class="font-medium">${app.name}</p>
                                                <p class="text-xs text-gray-500">${app.description || 'Sem descrição'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="p-4">
                                        <code class="text-sm bg-white/5 px-2 py-1 rounded">${app.slug}</code>
                                    </td>
                                    <td class="p-4 text-center">
                                        <span class="px-3 py-1 rounded-full text-xs ${getAppStatusColor(app.status)}">
                                            ${app.status}
                                        </span>
                                    </td>
                                    <td class="p-4 text-center text-gray-400 text-sm">${formatDate(app.created_at)}</td>
                                    <td class="p-4 text-center">
                                        <button onclick="event.stopPropagation(); showAppDetail('${app.id}')" class="text-primary hover:text-primary/80 mr-2">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="event.stopPropagation(); showCreateCredentialModal('${app.id}', '${app.name}')" class="text-emerald-400 hover:text-emerald-300">
                                            <i class="fas fa-key"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : `
                <div class="card rounded-2xl p-8 text-center">
                    <i class="fas fa-cube text-4xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400 mb-4">Nenhum app criado ainda</p>
                    <button onclick="showCreateAppModal()" class="bg-primary hover:bg-primary/80 px-6 py-2 rounded-xl">
                        <i class="fas fa-plus mr-2"></i> Criar Primeiro App
                    </button>
                </div>
            `}

            <!-- SDK Info -->
            <div class="card rounded-2xl p-6 mt-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-code text-purple-400"></i>
                    Integração via SDK
                </h3>
                <div class="bg-dark rounded-xl p-4 font-mono text-sm">
                    <p class="text-gray-400">// Instalar SDK</p>
                    <p class="text-emerald-400">npm install @prost-qs/sdk</p>
                    <br>
                    <p class="text-gray-400">// Usar no código</p>
                    <p class="text-cyan-400">import { ProstQS } from '@prost-qs/sdk';</p>
                    <p class="text-white">const client = new ProstQS({</p>
                    <p class="text-white pl-4">publicKey: <span class="text-amber-400">'pq_pk_xxx'</span>,</p>
                    <p class="text-white pl-4">secretKey: <span class="text-amber-400">'pq_sk_xxx'</span></p>
                    <p class="text-white">});</p>
                </div>
            </div>
        `;
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Applications', err.message);
    }
}


// ========================================
// APP DETAIL VIEW
// ========================================

// Variável global para controlar o polling
let metricsPollingInterval = null;

async function showAppDetail(appId) {
    const container = document.getElementById('content-area');
    
    // Limpar polling anterior se existir
    if (metricsPollingInterval) {
        clearInterval(metricsPollingInterval);
        metricsPollingInterval = null;
    }
    
    try {
        const [app, credentials, metrics] = await Promise.all([
            api(`/apps/${appId}`),
            api(`/apps/${appId}/credentials`).catch(() => ({ credentials: [] })),
            api(`/apps/${appId}/metrics`).catch(() => ({}))
        ]);
        
        const creds = credentials.credentials || [];
        
        container.innerHTML = `
            <!-- Back Button -->
            <button onclick="stopMetricsPolling(); showSection('applications')" class="text-gray-400 hover:text-white mb-4">
                <i class="fas fa-arrow-left mr-2"></i> Voltar para Apps
            </button>

            <!-- App Header -->
            <div class="card rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                            <i class="fas fa-cube text-3xl text-blue-400"></i>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">${app.name}</h2>
                            <p class="text-gray-400">${app.description || 'Sem descrição'}</p>
                            <div class="flex items-center gap-4 mt-2">
                                <code class="text-sm bg-white/5 px-2 py-1 rounded">${app.slug}</code>
                                <span class="px-3 py-1 rounded-full text-xs ${getAppStatusColor(app.status)}">${app.status}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="showPaymentProviderModal('${app.id}', '${app.name}')" class="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-xl">
                            <i class="fab fa-stripe mr-2"></i> Payment
                        </button>
                        <button onclick="showCreateCredentialModal('${app.id}', '${app.name}')" class="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl">
                            <i class="fas fa-key mr-2"></i> Nova API Key
                        </button>
                    </div>
                </div>
            </div>

            <!-- Real-time Status -->
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span class="text-sm text-gray-400">Dados em tempo real</span>
                </div>
                <span class="text-xs text-gray-500" id="metrics-last-update">Atualizando...</span>
            </div>

            <!-- Metrics (Real-time) - Row 1 -->
            <div class="grid grid-cols-6 gap-4 mb-4" id="metrics-container">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-blue-400 transition-all duration-300" id="metric-users">${metrics.total_users || 0}</p>
                    <p class="text-gray-400 text-sm">Usuários</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-emerald-400 transition-all duration-300" id="metric-active">${metrics.active_users_24h || 0}</p>
                    <p class="text-gray-400 text-sm">Ativos (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-green-400 transition-all duration-300" id="metric-online">${metrics.online_now || 0}</p>
                    <p class="text-gray-400 text-sm">Online Agora</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-purple-400 transition-all duration-300" id="metric-sessions">${metrics.total_sessions || 0}</p>
                    <p class="text-gray-400 text-sm">Sessões Total</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-cyan-400 transition-all duration-300" id="metric-active-sessions">${metrics.active_sessions || 0}</p>
                    <p class="text-gray-400 text-sm">Sessões Ativas</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-3xl font-bold text-amber-400 transition-all duration-300" id="metric-events">${metrics.total_events || metrics.total_decisions || 0}</p>
                    <p class="text-gray-400 text-sm">Eventos</p>
                </div>
            </div>

            <!-- Metrics (Real-time) - Row 2 -->
            <div class="grid grid-cols-5 gap-4 mb-4">
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-rose-400 transition-all duration-300" id="metric-epm">${(metrics.events_per_minute || 0).toFixed(1)}</p>
                    <p class="text-gray-400 text-sm">Eventos/min</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-indigo-400 transition-all duration-300" id="metric-active-1h">${metrics.active_users_1h || 0}</p>
                    <p class="text-gray-400 text-sm">Ativos (1h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-orange-400 transition-all duration-300" id="metric-events-24h">${metrics.events_24h || 0}</p>
                    <p class="text-gray-400 text-sm">Eventos (24h)</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-pink-400 transition-all duration-300" id="metric-interactions">${metrics.total_interactions || 0}</p>
                    <p class="text-gray-400 text-sm">Interações</p>
                </div>
                <div class="card rounded-2xl p-4 text-center">
                    <p class="text-2xl font-bold text-teal-400 transition-all duration-300" id="metric-interactions-24h">${metrics.interactions_24h || 0}</p>
                    <p class="text-gray-400 text-sm">Interações (24h)</p>
                </div>
            </div>

            <!-- Users by Feature -->
            <div class="card rounded-2xl p-4 mb-6">
                <h4 class="text-sm text-gray-400 mb-3">Usuários por Feature</h4>
                <div class="flex flex-wrap gap-2" id="metric-features">
                    ${renderFeatureBadges(metrics.users_by_feature)}
                </div>
                <p class="text-xs text-gray-500 mt-2" id="metric-last-event">Último evento: ${metrics.last_event_at ? formatDate(metrics.last_event_at) : '-'}</p>
            </div>

            <!-- Analytics Header -->
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold flex items-center gap-2">
                    <i class="fas fa-chart-bar text-purple-400"></i>
                    Analytics Avançado
                </h3>
                <button onclick="loadAllAnalytics('${app.id}')" class="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-4 py-2 rounded-xl text-sm transition-all">
                    <i class="fas fa-magic mr-2"></i> Carregar Todos
                </button>
            </div>

            <!-- Analytics Section -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                <!-- Funnel -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold flex items-center gap-2">
                            <i class="fas fa-filter text-purple-400"></i>
                            Funil de Conversão
                        </h4>
                        <button onclick="loadFunnel('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div id="funnel-container">
                        <p class="text-gray-500 text-sm text-center py-4">Clique para carregar</p>
                    </div>
                </div>

                <!-- Engagement -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold flex items-center gap-2">
                            <i class="fas fa-chart-line text-emerald-400"></i>
                            Engajamento (24h)
                        </h4>
                        <button onclick="loadEngagement('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div id="engagement-container">
                        <p class="text-gray-500 text-sm text-center py-4">Clique para carregar</p>
                    </div>
                </div>
            </div>

            <!-- Retention Section -->
            <div class="card rounded-2xl p-4 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold flex items-center gap-2">
                        <i class="fas fa-user-clock text-indigo-400"></i>
                        Retenção D1/D7/D30 (últimos 14 dias)
                    </h4>
                    <button onclick="loadRetention('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div id="retention-container">
                    <p class="text-gray-500 text-sm text-center py-4">Clique para carregar dados de retenção</p>
                </div>
            </div>

            <!-- Period Comparison -->
            <div class="card rounded-2xl p-4 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-bold flex items-center gap-2">
                        <i class="fas fa-balance-scale text-amber-400"></i>
                        Comparação de Períodos (7 dias)
                    </h4>
                    <button onclick="loadComparison('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
                <div id="comparison-container">
                    <p class="text-gray-500 text-sm text-center py-4">Clique para comparar últimos 7 dias vs 7 dias anteriores</p>
                </div>
            </div>

            <!-- Credentials -->
            <div class="card rounded-2xl p-6 mb-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-key text-amber-400"></i>
                    API Keys
                </h3>
                ${creds.length > 0 ? `
                    <div class="space-y-3">
                        ${creds.map(cred => `
                            <div class="flex items-center justify-between p-4 rounded-xl bg-white/5">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-key text-amber-400"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium">${cred.name}</p>
                                        <div class="flex items-center gap-2 mt-1">
                                            <code class="text-xs bg-dark px-2 py-1 rounded">${cred.public_key}</code>
                                            <button onclick="copyToClipboard('${cred.public_key}')" class="text-gray-400 hover:text-white">
                                                <i class="fas fa-copy text-xs"></i>
                                            </button>
                                        </div>
                                        <p class="text-xs text-gray-500 mt-1">
                                            Scopes: ${cred.scopes || 'identity, billing'}
                                            ${cred.last_used_at ? ` • Último uso: ${formatDate(cred.last_used_at)}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <button onclick="revokeCredential('${app.id}', '${cred.id}', '${cred.name}')" class="text-rose-400 hover:text-rose-300 px-3 py-1 rounded-lg hover:bg-rose-500/10">
                                    <i class="fas fa-trash mr-1"></i> Revogar
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-8">
                        <i class="fas fa-key text-4xl text-gray-600 mb-4"></i>
                        <p class="text-gray-400 mb-4">Nenhuma API Key criada</p>
                        <button onclick="showCreateCredentialModal('${app.id}', '${app.name}')" class="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl">
                            <i class="fas fa-plus mr-2"></i> Criar API Key
                        </button>
                    </div>
                `}
            </div>

            <!-- Alerts -->
            <div class="card rounded-2xl p-6 mb-6" id="alerts-section">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-bell text-rose-400"></i>
                    Alertas Recentes
                </h3>
                <div id="alerts-container">
                    <p class="text-gray-500 text-sm">Carregando alertas...</p>
                </div>
            </div>

            <!-- Advanced Analytics Row -->
            <div class="grid grid-cols-3 gap-4 mb-6">
                <!-- Heatmap -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold flex items-center gap-2">
                            <i class="fas fa-th text-orange-400"></i>
                            Heatmap de Atividade
                        </h4>
                        <button onclick="loadHeatmap('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div id="heatmap-container">
                        <p class="text-gray-500 text-sm text-center py-4">Clique para carregar</p>
                    </div>
                </div>

                <!-- User Journey -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold flex items-center gap-2">
                            <i class="fas fa-route text-blue-400"></i>
                            Jornada do Usuário
                        </h4>
                        <button onclick="loadJourney('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div id="journey-container">
                        <p class="text-gray-500 text-sm text-center py-4">Clique para carregar</p>
                    </div>
                </div>

                <!-- Geo Distribution -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold flex items-center gap-2">
                            <i class="fas fa-globe text-green-400"></i>
                            Distribuição Geográfica
                        </h4>
                        <button onclick="loadGeo('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div id="geo-container">
                        <p class="text-gray-500 text-sm text-center py-4">Clique para carregar</p>
                    </div>
                </div>
            </div>

            <!-- Live Events & Top Users Row -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                <!-- Live Events -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold flex items-center gap-2">
                            <i class="fas fa-bolt text-yellow-400"></i>
                            Eventos em Tempo Real
                            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        </h4>
                        <button onclick="loadLiveEvents('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                            <i class="fas fa-play mr-1"></i> Iniciar
                        </button>
                    </div>
                    <div id="live-events-container" class="max-h-48 overflow-y-auto">
                        <p class="text-gray-500 text-sm text-center py-4">Clique para iniciar stream</p>
                    </div>
                </div>

                <!-- Top Users -->
                <div class="card rounded-2xl p-4">
                    <div class="flex items-center justify-between mb-4">
                        <h4 class="font-bold flex items-center gap-2">
                            <i class="fas fa-trophy text-amber-400"></i>
                            Top Usuários (7 dias)
                        </h4>
                        <button onclick="loadTopUsers('${app.id}')" class="text-xs text-gray-400 hover:text-white">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    <div id="top-users-container">
                        <p class="text-gray-500 text-sm text-center py-4">Clique para carregar</p>
                    </div>
                </div>
            </div>

            <!-- Event Timeline -->
            <div class="card rounded-2xl p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold flex items-center gap-2">
                        <i class="fas fa-stream text-cyan-400"></i>
                        Timeline de Sessões Ativas
                    </h3>
                    <button onclick="toggleEventTimeline('${app.id}')" class="text-sm text-gray-400 hover:text-white">
                        <i class="fas fa-sync-alt mr-1"></i> Atualizar
                    </button>
                </div>
                <div id="events-timeline" class="max-h-64 overflow-y-auto">
                    <p class="text-gray-500 text-sm">Clique em Atualizar para ver sessões ativas</p>
                </div>
            </div>

            <!-- App Info -->
            <div class="card rounded-2xl p-6">
                <h3 class="font-bold mb-4 flex items-center gap-2">
                    <i class="fas fa-info-circle text-gray-400"></i>
                    Informações
                </h3>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="p-3 bg-white/5 rounded-xl">
                        <p class="text-gray-400">App ID</p>
                        <p class="font-mono">${app.id}</p>
                    </div>
                    <div class="p-3 bg-white/5 rounded-xl">
                        <p class="text-gray-400">Owner ID</p>
                        <p class="font-mono">${app.owner_id}</p>
                    </div>
                    <div class="p-3 bg-white/5 rounded-xl">
                        <p class="text-gray-400">Webhook URL</p>
                        <p class="font-mono">${app.webhook_url || '-'}</p>
                    </div>
                    <div class="p-3 bg-white/5 rounded-xl">
                        <p class="text-gray-400">Redirect URL</p>
                        <p class="font-mono">${app.redirect_url || '-'}</p>
                    </div>
                    <div class="p-3 bg-white/5 rounded-xl">
                        <p class="text-gray-400">Criado em</p>
                        <p>${formatDate(app.created_at)}</p>
                    </div>
                    <div class="p-3 bg-white/5 rounded-xl">
                        <p class="text-gray-400">Última atividade</p>
                        <p id="metric-last-activity">${metrics.last_activity_at ? formatDate(metrics.last_activity_at) : '-'}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Iniciar polling de métricas em tempo real
        startMetricsPolling(appId);
        
    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar detalhes do App', err.message);
    }
}

// ========================================
// REAL-TIME METRICS POLLING
// ========================================

function startMetricsPolling(appId) {
    // Atualizar imediatamente
    updateMetrics(appId);
    
    // Polling a cada 3 segundos
    metricsPollingInterval = setInterval(() => {
        updateMetrics(appId);
    }, 3000);
}

function stopMetricsPolling() {
    if (metricsPollingInterval) {
        clearInterval(metricsPollingInterval);
        metricsPollingInterval = null;
    }
    // Também parar live events se estiver rodando
    if (typeof stopLiveEvents === 'function') {
        stopLiveEvents();
    }
}

async function updateMetrics(appId) {
    try {
        // Buscar métricas do endpoint padrão E do endpoint de telemetria
        const [metrics, telemetryMetrics] = await Promise.all([
            api(`/apps/${appId}/metrics`),
            api(`/admin/telemetry/apps/${appId}/metrics`).catch(() => null)
        ]);
        
        // Usar métricas de telemetria se disponíveis, senão usar métricas padrão
        const finalMetrics = telemetryMetrics || metrics;
        
        // Row 1 - Métricas principais
        animateMetricUpdate('metric-users', finalMetrics.total_users || metrics.total_users || 0);
        animateMetricUpdate('metric-active', finalMetrics.active_users_24h || metrics.active_users_24h || 0);
        animateMetricUpdate('metric-online', finalMetrics.online_now || 0);
        animateMetricUpdate('metric-sessions', finalMetrics.total_sessions || metrics.total_sessions || 0);
        animateMetricUpdate('metric-active-sessions', finalMetrics.active_sessions || metrics.active_sessions || 0);
        animateMetricUpdate('metric-events', finalMetrics.total_events || metrics.total_decisions || 0);
        
        // Row 2 - Métricas adicionais
        animateMetricUpdateFloat('metric-epm', finalMetrics.events_per_minute || 0);
        animateMetricUpdate('metric-active-1h', finalMetrics.active_users_1h || 0);
        animateMetricUpdate('metric-events-24h', finalMetrics.events_24h || 0);
        animateMetricUpdate('metric-interactions', finalMetrics.total_interactions || 0);
        animateMetricUpdate('metric-interactions-24h', finalMetrics.interactions_24h || 0);
        
        // Atualizar badges de features
        const featuresEl = document.getElementById('metric-features');
        if (featuresEl) {
            featuresEl.innerHTML = renderFeatureBadges(finalMetrics.users_by_feature);
        }
        
        // Atualizar último evento
        const lastEventEl = document.getElementById('metric-last-event');
        if (lastEventEl && finalMetrics.last_event_at) {
            lastEventEl.textContent = `Último evento: ${formatDate(finalMetrics.last_event_at)}`;
        }
        
        // Atualizar última atividade
        const lastActivityEl = document.getElementById('metric-last-activity');
        if (lastActivityEl) {
            const lastActivity = finalMetrics.last_event_at || metrics.last_activity_at;
            if (lastActivity) {
                lastActivityEl.textContent = formatDate(lastActivity);
            }
        }
        
        // Atualizar timestamp
        const updateEl = document.getElementById('metrics-last-update');
        if (updateEl) {
            updateEl.textContent = `Atualizado: ${new Date().toLocaleTimeString()}`;
        }
        
        // Buscar alertas (a cada 10s, não a cada 3s)
        if (!window.lastAlertsFetch || Date.now() - window.lastAlertsFetch > 10000) {
            window.lastAlertsFetch = Date.now();
            updateAlerts(appId);
        }
    } catch (err) {
        console.error('Erro ao atualizar métricas:', err);
    }
}

// Buscar e renderizar alertas
async function updateAlerts(appId) {
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/alerts?limit=10`);
        const alerts = data.alerts || [];
        
        const container = document.getElementById('alerts-container');
        if (!container) return;
        
        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-check-circle text-2xl text-emerald-400 mb-2"></i>
                    <p class="text-gray-400 text-sm">Nenhum alerta recente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = alerts.map(alert => {
            const alertData = typeof alert.Data === 'string' ? JSON.parse(alert.Data || '{}') : alert.Data;
            const alertConfig = getAlertConfig(alert.Type);
            
            return `
                <div class="flex items-center gap-3 p-3 rounded-xl ${alertConfig.bgClass} mb-2">
                    <div class="w-8 h-8 ${alertConfig.iconBgClass} rounded-lg flex items-center justify-center">
                        <i class="fas ${alertConfig.icon} ${alertConfig.iconClass}"></i>
                    </div>
                    <div class="flex-1">
                        <p class="text-sm font-medium ${alertConfig.textClass}">${alertConfig.title}</p>
                        <p class="text-xs text-gray-400">${formatAlertData(alert.Type, alertData)}</p>
                    </div>
                    <span class="text-xs text-gray-500">${formatTimeAgo(alert.CreatedAt)}</span>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Erro ao buscar alertas:', err);
    }
}

function getAlertConfig(type) {
    const configs = {
        'online_drop': {
            title: 'Queda de Usuários Online',
            icon: 'fa-arrow-down',
            bgClass: 'bg-rose-500/10',
            iconBgClass: 'bg-rose-500/20',
            iconClass: 'text-rose-400',
            textClass: 'text-rose-400'
        },
        'no_events': {
            title: 'Sem Eventos',
            icon: 'fa-clock',
            bgClass: 'bg-amber-500/10',
            iconBgClass: 'bg-amber-500/20',
            iconClass: 'text-amber-400',
            textClass: 'text-amber-400'
        },
        'high_error_rate': {
            title: 'Taxa Alta de Erros',
            icon: 'fa-exclamation-triangle',
            bgClass: 'bg-red-500/10',
            iconBgClass: 'bg-red-500/20',
            iconClass: 'text-red-400',
            textClass: 'text-red-400'
        },
        'session_spike': {
            title: 'Pico de Sessões',
            icon: 'fa-chart-line',
            bgClass: 'bg-purple-500/10',
            iconBgClass: 'bg-purple-500/20',
            iconClass: 'text-purple-400',
            textClass: 'text-purple-400'
        }
    };
    return configs[type] || {
        title: type,
        icon: 'fa-bell',
        bgClass: 'bg-gray-500/10',
        iconBgClass: 'bg-gray-500/20',
        iconClass: 'text-gray-400',
        textClass: 'text-gray-400'
    };
}

function formatAlertData(type, data) {
    switch (type) {
        case 'online_drop':
            return `${data.previous || 0} → ${data.current || 0} (${data.drop || '-'})`;
        case 'high_error_rate':
            return `${data.error_count || 0} erros de ${data.total_count || 0} eventos (${data.rate || '-'})`;
        default:
            return JSON.stringify(data);
    }
}

function formatTimeAgo(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    
    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min atrás`;
    if (diffHour < 24) return `${diffHour}h atrás`;
    return formatDate(dateStr);
}

function animateMetricUpdate(elementId, newValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const currentValue = parseInt(el.textContent) || 0;
    
    if (currentValue !== newValue) {
        // Adicionar classe de animação
        el.classList.add('scale-110');
        
        // Se aumentou, pisca verde; se diminuiu, pisca vermelho
        if (newValue > currentValue) {
            el.style.textShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
        } else {
            el.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
        }
        
        // Atualizar valor
        el.textContent = newValue;
        
        // Remover animação após 300ms
        setTimeout(() => {
            el.classList.remove('scale-110');
            el.style.textShadow = 'none';
        }, 300);
    }
}

function animateMetricUpdateFloat(elementId, newValue) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    const currentValue = parseFloat(el.textContent) || 0;
    const formattedNew = parseFloat(newValue).toFixed(1);
    
    if (currentValue.toFixed(1) !== formattedNew) {
        // Adicionar classe de animação
        el.classList.add('scale-110');
        
        // Se aumentou, pisca verde; se diminuiu, pisca vermelho
        if (newValue > currentValue) {
            el.style.textShadow = '0 0 20px rgba(16, 185, 129, 0.8)';
        } else {
            el.style.textShadow = '0 0 20px rgba(239, 68, 68, 0.8)';
        }
        
        // Atualizar valor
        el.textContent = formattedNew;
        
        // Remover animação após 300ms
        setTimeout(() => {
            el.classList.remove('scale-110');
            el.style.textShadow = 'none';
        }, 300);
    }
}


// ========================================
// CREATE APP MODAL
// ========================================

function showCreateAppModal() {
    const modal = document.createElement('div');
    modal.id = 'app-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="card rounded-2xl p-6 w-full max-w-md">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-bold">Criar Novo App</h3>
                <button onclick="closeAppModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="create-app-form" onsubmit="createApplication(event)">
                <div class="mb-4">
                    <label class="block text-sm text-gray-400 mb-2">Nome do App *</label>
                    <input type="text" id="app-name" required placeholder="Meu App" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none">
                </div>
                <div class="mb-4">
                    <label class="block text-sm text-gray-400 mb-2">Slug (único) *</label>
                    <input type="text" id="app-slug" required placeholder="meu-app" pattern="[a-z0-9-]+"
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none">
                    <p class="text-xs text-gray-500 mt-1">Apenas letras minúsculas, números e hífens</p>
                </div>
                <div class="mb-4">
                    <label class="block text-sm text-gray-400 mb-2">Descrição</label>
                    <textarea id="app-description" placeholder="Descrição do app..." rows="2"
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none"></textarea>
                </div>
                <div class="mb-4">
                    <label class="block text-sm text-gray-400 mb-2">Webhook URL</label>
                    <input type="url" id="app-webhook" placeholder="https://..."
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none">
                </div>
                <div class="mb-6">
                    <label class="block text-sm text-gray-400 mb-2">Redirect URL</label>
                    <input type="url" id="app-redirect" placeholder="https://..."
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none">
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="closeAppModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl">
                        Cancelar
                    </button>
                    <button type="submit" class="flex-1 bg-primary hover:bg-primary/80 py-3 rounded-xl">
                        <i class="fas fa-plus mr-2"></i> Criar App
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeAppModal() {
    document.getElementById('app-modal')?.remove();
}

async function createApplication(event) {
    event.preventDefault();
    
    const name = document.getElementById('app-name').value;
    const slug = document.getElementById('app-slug').value;
    const description = document.getElementById('app-description').value;
    const webhookUrl = document.getElementById('app-webhook').value;
    const redirectUrl = document.getElementById('app-redirect').value;
    
    try {
        const app = await api('/apps', {
            method: 'POST',
            body: JSON.stringify({
                name,
                slug,
                description,
                webhook_url: webhookUrl,
                redirect_url: redirectUrl
            })
        });
        
        closeAppModal();
        toast('App criado com sucesso!', 'success');
        showAppDetail(app.id);
    } catch (err) {
        toast(err.message || 'Erro ao criar app', 'error');
    }
}


// ========================================
// CREATE CREDENTIAL MODAL
// ========================================

function showCreateCredentialModal(appId, appName) {
    const modal = document.createElement('div');
    modal.id = 'credential-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="card rounded-2xl p-6 w-full max-w-md">
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h3 class="text-xl font-bold">Nova API Key</h3>
                    <p class="text-gray-400 text-sm">${appName}</p>
                </div>
                <button onclick="closeCredentialModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="create-credential-form" onsubmit="createCredential(event, '${appId}')">
                <div class="mb-4">
                    <label class="block text-sm text-gray-400 mb-2">Nome da Key *</label>
                    <input type="text" id="cred-name" required placeholder="Production, Development, etc" 
                        class="w-full bg-dark border border-dark-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none">
                </div>
                <div class="mb-6">
                    <label class="block text-sm text-gray-400 mb-2">Scopes</label>
                    <div class="space-y-2">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="scope-identity" checked class="rounded">
                            <span>identity</span>
                            <span class="text-xs text-gray-500">- Autenticação e usuários</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="scope-billing" checked class="rounded">
                            <span>billing</span>
                            <span class="text-xs text-gray-500">- Pagamentos e subscriptions</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="scope-agents" class="rounded">
                            <span>agents</span>
                            <span class="text-xs text-gray-500">- Agentes e decisões</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="scope-audit" class="rounded">
                            <span>audit</span>
                            <span class="text-xs text-gray-500">- Logs e eventos</span>
                        </label>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="closeCredentialModal()" class="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-xl">
                        Cancelar
                    </button>
                    <button type="submit" class="flex-1 bg-emerald-500 hover:bg-emerald-600 py-3 rounded-xl">
                        <i class="fas fa-key mr-2"></i> Gerar Key
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeCredentialModal() {
    document.getElementById('credential-modal')?.remove();
}

async function createCredential(event, appId) {
    event.preventDefault();
    
    const name = document.getElementById('cred-name').value;
    const scopes = [];
    if (document.getElementById('scope-identity').checked) scopes.push('identity');
    if (document.getElementById('scope-billing').checked) scopes.push('billing');
    if (document.getElementById('scope-agents').checked) scopes.push('agents');
    if (document.getElementById('scope-audit').checked) scopes.push('audit');
    
    try {
        const result = await api(`/apps/${appId}/credentials`, {
            method: 'POST',
            body: JSON.stringify({ name, scopes })
        });
        
        closeCredentialModal();
        showSecretModal(result.credential, result.secret);
    } catch (err) {
        toast(err.message || 'Erro ao criar API Key', 'error');
    }
}


// ========================================
// SECRET DISPLAY MODAL (SHOW ONCE!)
// ========================================

function showSecretModal(credential, secret) {
    const modal = document.createElement('div');
    modal.id = 'secret-modal';
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="card rounded-2xl p-6 w-full max-w-lg">
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-check-circle text-3xl text-emerald-400"></i>
                </div>
                <h3 class="text-xl font-bold">API Key Criada!</h3>
                <p class="text-gray-400 text-sm mt-2">${credential.name}</p>
            </div>
            
            <div class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-6">
                <div class="flex items-center gap-2 text-rose-400 mb-2">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="font-bold">ATENÇÃO!</span>
                </div>
                <p class="text-sm text-gray-300">O Secret Key só será mostrado UMA VEZ. Copie e guarde em local seguro agora!</p>
            </div>
            
            <div class="space-y-4 mb-6">
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Public Key</label>
                    <div class="flex items-center gap-2">
                        <input type="text" readonly value="${credential.public_key}" 
                            class="flex-1 bg-dark border border-dark-border rounded-xl px-4 py-3 text-white font-mono text-sm">
                        <button onclick="copyToClipboard('${credential.public_key}')" class="bg-white/10 hover:bg-white/20 px-4 py-3 rounded-xl">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-gray-400 mb-2">Secret Key <span class="text-rose-400">(copie agora!)</span></label>
                    <div class="flex items-center gap-2">
                        <input type="text" readonly value="${secret}" id="secret-input"
                            class="flex-1 bg-dark border border-rose-500 rounded-xl px-4 py-3 text-white font-mono text-sm">
                        <button onclick="copyToClipboard('${secret}')" class="bg-rose-500 hover:bg-rose-600 px-4 py-3 rounded-xl">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="bg-white/5 rounded-xl p-4 mb-6">
                <p class="text-sm text-gray-400 mb-2">Exemplo de uso:</p>
                <pre class="text-xs font-mono text-emerald-400 overflow-x-auto">const client = new ProstQS({
  publicKey: '${credential.public_key}',
  secretKey: '${secret}'
});</pre>
            </div>
            
            <button onclick="closeSecretModal('${credential.app_id}')" class="w-full bg-primary hover:bg-primary/80 py-3 rounded-xl">
                <i class="fas fa-check mr-2"></i> Entendi, já copiei
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeSecretModal(appId) {
    document.getElementById('secret-modal')?.remove();
    if (appId) {
        showAppDetail(appId);
    }
}

// ========================================
// REVOKE CREDENTIAL
// ========================================

async function revokeCredential(appId, credId, credName) {
    if (!confirm(`Tem certeza que deseja revogar a API Key "${credName}"?\n\nEsta ação não pode ser desfeita e apps usando esta key deixarão de funcionar.`)) {
        return;
    }
    
    try {
        await api(`/apps/${appId}/credentials/${credId}`, {
            method: 'DELETE'
        });
        
        toast('API Key revogada com sucesso', 'success');
        showAppDetail(appId);
    } catch (err) {
        toast(err.message || 'Erro ao revogar API Key', 'error');
    }
}

// ========================================
// HELPERS
// ========================================

/**
 * Renderiza badges de features com contagem de usuários
 * @param {string|object} usersbyFeature - JSON string ou objeto com features
 * @returns {string} HTML com badges
 */
function renderFeatureBadges(usersbyFeature) {
    if (!usersbyFeature) {
        return '<span class="text-gray-500 text-sm">Nenhuma feature ativa</span>';
    }
    
    let features = usersbyFeature;
    
    // Se for string JSON, fazer parse
    if (typeof usersbyFeature === 'string') {
        try {
            features = JSON.parse(usersbyFeature);
        } catch (e) {
            return '<span class="text-gray-500 text-sm">-</span>';
        }
    }
    
    // Se não tiver features
    if (!features || Object.keys(features).length === 0) {
        return '<span class="text-gray-500 text-sm">Nenhuma feature ativa</span>';
    }
    
    // Cores para diferentes features
    const featureColors = {
        'lobby': 'bg-blue-500/20 text-blue-400',
        'video_chat': 'bg-emerald-500/20 text-emerald-400',
        'queue': 'bg-amber-500/20 text-amber-400',
        'match': 'bg-purple-500/20 text-purple-400',
        'chat': 'bg-cyan-500/20 text-cyan-400',
        'settings': 'bg-gray-500/20 text-gray-400'
    };
    
    return Object.entries(features)
        .map(([feature, count]) => {
            const colorClass = featureColors[feature] || 'bg-indigo-500/20 text-indigo-400';
            return `<span class="px-3 py-1 rounded-full text-xs ${colorClass}">
                ${feature}: <strong>${count}</strong>
            </span>`;
        })
        .join('');
}

function getAppStatusColor(status) {
    const colors = {
        active: 'bg-emerald-500/20 text-emerald-400',
        suspended: 'bg-amber-500/20 text-amber-400',
        deleted: 'bg-rose-500/20 text-rose-400'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        toast('Copiado para a área de transferência!', 'success');
    }).catch(() => {
        // Fallback
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        toast('Copiado!', 'success');
    });
}

// ========================================
// EVENT TIMELINE - Debug/Suporte
// ========================================

async function toggleEventTimeline(appId) {
    const container = document.getElementById('events-timeline');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm">Carregando eventos...</p>';
    
    try {
        // Buscar sessões ativas para pegar eventos recentes
        const sessionsData = await api(`/admin/telemetry/apps/${appId}/sessions?limit=20`);
        const sessions = sessionsData.sessions || [];
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-inbox text-2xl text-gray-600 mb-2"></i>
                    <p class="text-gray-500 text-sm">Nenhuma sessão ativa</p>
                </div>
            `;
            return;
        }
        
        // Renderizar sessões como timeline
        container.innerHTML = sessions.map(session => {
            const isOnline = !session.ended_at && new Date() - new Date(session.last_seen_at) < 60000;
            const statusClass = isOnline ? 'bg-emerald-500' : 'bg-gray-500';
            const statusText = isOnline ? 'Online' : 'Offline';
            
            return `
                <div class="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 border-l-2 ${isOnline ? 'border-emerald-500' : 'border-gray-600'} mb-2">
                    <div class="w-2 h-2 ${statusClass} rounded-full mt-2"></div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium truncate">${session.user_id?.substring(0, 8) || 'unknown'}...</span>
                            <span class="text-xs px-2 py-0.5 rounded ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}">${statusText}</span>
                            ${session.current_feature ? `<span class="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">${session.current_feature}</span>` : ''}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            <span>Eventos: ${session.event_count || 0}</span>
                            <span class="mx-2">•</span>
                            <span>Interações: ${session.interaction_count || 0}</span>
                            <span class="mx-2">•</span>
                            <span>Visto: ${formatTimeAgo(session.last_seen_at)}</span>
                        </div>
                        <div class="text-xs text-gray-600 mt-1 truncate">
                            ${session.ip_address || '-'} • ${session.country || '-'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Erro ao buscar timeline:', err);
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-circle text-2xl text-rose-400 mb-2"></i>
                <p class="text-gray-500 text-sm">Erro ao carregar eventos</p>
            </div>
        `;
    }
}

// ========================================
// LOAD ALL ANALYTICS
// ========================================

async function loadAllAnalytics(appId) {
    // Mostrar loading em todos os containers
    const containers = [
        'funnel-container', 'engagement-container', 'retention-container',
        'comparison-container', 'heatmap-container', 'journey-container',
        'geo-container', 'top-users-container'
    ];
    
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '<p class="text-gray-400 text-sm text-center animate-pulse">Carregando...</p>';
        }
    });
    
    // Carregar todos em paralelo
    await Promise.all([
        loadFunnel(appId),
        loadEngagement(appId),
        loadRetention(appId),
        loadComparison(appId),
        loadHeatmap(appId),
        loadJourney(appId),
        loadGeo(appId),
        loadTopUsers(appId),
        loadLiveEvents(appId)
    ]);
}

// ========================================
// ANALYTICS - Funil e Engajamento
// ========================================

async function loadFunnel(appId) {
    const container = document.getElementById('funnel-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/funnel?since=24h`);
        const funnel = data.funnel || [];
        
        if (funnel.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center">Sem dados</p>';
            return;
        }
        
        container.innerHTML = funnel.map((step, i) => {
            const width = Math.max(step.percentage, 10);
            const color = getStepColor(i, funnel.length);
            
            return `
                <div class="mb-3">
                    <div class="flex justify-between text-xs mb-1">
                        <span class="text-gray-400">${step.step}</span>
                        <span class="text-white">${step.users} <span class="text-gray-500">(${step.percentage.toFixed(1)}%)</span></span>
                    </div>
                    <div class="h-2 bg-dark rounded-full overflow-hidden">
                        <div class="h-full ${color} rounded-full transition-all duration-500" style="width: ${width}%"></div>
                    </div>
                    ${step.drop_off > 0 ? `<p class="text-xs text-rose-400 mt-1">↓ ${step.drop_off.toFixed(1)}% abandonou</p>` : ''}
                </div>
            `;
        }).join('');
        
    } catch (err) {
        console.error('Erro ao carregar funil:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar</p>';
    }
}

function getStepColor(index, total) {
    const colors = ['bg-emerald-500', 'bg-cyan-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
    return colors[index % colors.length];
}

async function loadEngagement(appId) {
    const container = document.getElementById('engagement-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/engagement?since=24h`);
        const e = data.engagement || {};
        
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-lg font-bold text-blue-400">${formatDuration(e.avg_session_duration_ms)}</p>
                    <p class="text-xs text-gray-500">Duração média</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-lg font-bold text-emerald-400">${(e.avg_events_per_session || 0).toFixed(1)}</p>
                    <p class="text-xs text-gray-500">Eventos/sessão</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-lg font-bold text-purple-400">${(e.avg_matches_per_user || 0).toFixed(2)}</p>
                    <p class="text-xs text-gray-500">Matches/usuário</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-lg font-bold text-cyan-400">${(e.avg_messages_per_match || 0).toFixed(1)}</p>
                    <p class="text-xs text-gray-500">Msgs/match</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-lg font-bold ${e.bounce_rate > 50 ? 'text-rose-400' : 'text-amber-400'}">${(e.bounce_rate || 0).toFixed(1)}%</p>
                    <p class="text-xs text-gray-500">Bounce rate</p>
                </div>
                <div class="p-3 bg-white/5 rounded-xl">
                    <p class="text-lg font-bold ${e.match_rate > 30 ? 'text-emerald-400' : 'text-amber-400'}">${(e.match_rate || 0).toFixed(1)}%</p>
                    <p class="text-xs text-gray-500">Match rate</p>
                </div>
            </div>
        `;
        
    } catch (err) {
        console.error('Erro ao carregar engajamento:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar</p>';
    }
}

function formatDuration(ms) {
    if (!ms || ms <= 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
}


// ========================================
// RETENÇÃO D1/D7/D30
// ========================================

async function loadRetention(appId) {
    const container = document.getElementById('retention-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando dados de retenção...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/retention?days=14`);
        const retention = data.retention || [];
        
        if (retention.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center">Sem dados de retenção</p>';
            return;
        }
        
        // Calcular médias
        const validD1 = retention.filter(r => r.new_users > 0 && r.d1 > 0);
        const validD7 = retention.filter(r => r.new_users > 0 && r.d7 > 0);
        const validD30 = retention.filter(r => r.new_users > 0 && r.d30 > 0);
        
        const avgD1 = validD1.length > 0 ? validD1.reduce((a, b) => a + b.d1, 0) / validD1.length : 0;
        const avgD7 = validD7.length > 0 ? validD7.reduce((a, b) => a + b.d7, 0) / validD7.length : 0;
        const avgD30 = validD30.length > 0 ? validD30.reduce((a, b) => a + b.d30, 0) / validD30.length : 0;
        
        let html = `
            <!-- Médias de Retenção -->
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div class="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl text-center">
                    <p class="text-2xl font-bold text-blue-400">${avgD1.toFixed(1)}%</p>
                    <p class="text-xs text-gray-400">D1 (média)</p>
                </div>
                <div class="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl text-center">
                    <p class="text-2xl font-bold text-purple-400">${avgD7.toFixed(1)}%</p>
                    <p class="text-xs text-gray-400">D7 (média)</p>
                </div>
                <div class="p-3 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-xl text-center">
                    <p class="text-2xl font-bold text-emerald-400">${avgD30.toFixed(1)}%</p>
                    <p class="text-xs text-gray-400">D30 (média)</p>
                </div>
            </div>
            
            <!-- Tabela de Coortes -->
            <div class="overflow-x-auto">
                <table class="w-full text-xs">
                    <thead>
                        <tr class="text-gray-500 border-b border-white/10">
                            <th class="text-left py-2 px-2">Data</th>
                            <th class="text-center py-2 px-2">Novos</th>
                            <th class="text-center py-2 px-2">D1</th>
                            <th class="text-center py-2 px-2">D7</th>
                            <th class="text-center py-2 px-2">D30</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Mostrar últimos 10 dias com dados
        const recentData = retention.slice(-10).reverse();
        
        recentData.forEach(row => {
            if (row.new_users === 0) return;
            
            html += `
                <tr class="border-b border-white/5 hover:bg-white/5">
                    <td class="py-2 px-2 text-gray-400">${formatShortDate(row.date)}</td>
                    <td class="py-2 px-2 text-center text-white">${row.new_users}</td>
                    <td class="py-2 px-2 text-center">
                        <span class="${getRetentionColor(row.d1)}">${row.d1.toFixed(1)}%</span>
                    </td>
                    <td class="py-2 px-2 text-center">
                        <span class="${getRetentionColor(row.d7)}">${row.d7 > 0 ? row.d7.toFixed(1) + '%' : '-'}</span>
                    </td>
                    <td class="py-2 px-2 text-center">
                        <span class="${getRetentionColor(row.d30)}">${row.d30 > 0 ? row.d30.toFixed(1) + '%' : '-'}</span>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <p class="text-xs text-gray-600 mt-2 text-center">
                D1 = voltou no dia seguinte | D7 = voltou após 7 dias | D30 = voltou após 30 dias
            </p>
        `;
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Erro ao carregar retenção:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar dados de retenção</p>';
    }
}

function getRetentionColor(value) {
    if (value >= 40) return 'text-emerald-400';
    if (value >= 20) return 'text-blue-400';
    if (value >= 10) return 'text-amber-400';
    if (value > 0) return 'text-rose-400';
    return 'text-gray-500';
}

function formatShortDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}


// ========================================
// COMPARAÇÃO DE PERÍODOS
// ========================================

async function loadComparison(appId) {
    const container = document.getElementById('comparison-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/compare?days=7`);
        const { current, previous, changes } = data;
        
        container.innerHTML = `
            <div class="grid grid-cols-7 gap-2 text-center text-xs">
                <div class="text-gray-500">Métrica</div>
                <div class="text-gray-400">Atual</div>
                <div class="text-gray-400">Anterior</div>
                <div class="text-gray-400">Variação</div>
                <div class="text-gray-500">Métrica</div>
                <div class="text-gray-400">Atual</div>
                <div class="text-gray-400">Variação</div>
                
                <div class="text-left text-gray-400">Sessões</div>
                <div class="text-white font-bold">${current.total_sessions}</div>
                <div class="text-gray-500">${previous.total_sessions}</div>
                <div class="${getChangeColor(changes.sessions_change)}">${formatChange(changes.sessions_change)}</div>
                
                <div class="text-left text-gray-400">Bounce</div>
                <div class="text-white font-bold">${current.bounce_rate.toFixed(1)}%</div>
                <div class="${changes.bounce_rate_change < 0 ? 'text-emerald-400' : 'text-rose-400'}">${changes.bounce_rate_change > 0 ? '+' : ''}${changes.bounce_rate_change.toFixed(1)}pp</div>
                
                <div class="text-left text-gray-400">Usuários</div>
                <div class="text-white font-bold">${current.unique_users}</div>
                <div class="text-gray-500">${previous.unique_users}</div>
                <div class="${getChangeColor(changes.users_change)}">${formatChange(changes.users_change)}</div>
                
                <div class="text-left text-gray-400">Match Rate</div>
                <div class="text-white font-bold">${current.match_rate.toFixed(1)}%</div>
                <div class="${changes.match_rate_change > 0 ? 'text-emerald-400' : 'text-rose-400'}">${changes.match_rate_change > 0 ? '+' : ''}${changes.match_rate_change.toFixed(1)}pp</div>
                
                <div class="text-left text-gray-400">Matches</div>
                <div class="text-white font-bold">${current.total_matches}</div>
                <div class="text-gray-500">${previous.total_matches}</div>
                <div class="${getChangeColor(changes.matches_change)}">${formatChange(changes.matches_change)}</div>
                
                <div class="text-left text-gray-400">Duração</div>
                <div class="text-white font-bold">${formatDuration(current.avg_session_duration_ms)}</div>
                <div class="${getChangeColor(changes.duration_change)}">${formatChange(changes.duration_change)}</div>
            </div>
            <p class="text-xs text-gray-600 mt-3 text-center">
                ${current.start_date} a ${current.end_date} vs ${previous.start_date} a ${previous.end_date}
            </p>
        `;
        
    } catch (err) {
        console.error('Erro ao carregar comparação:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar</p>';
    }
}

function getChangeColor(change) {
    if (change > 5) return 'text-emerald-400';
    if (change < -5) return 'text-rose-400';
    return 'text-gray-400';
}

function formatChange(change) {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
}


// ========================================
// HEATMAP DE ATIVIDADE
// ========================================

async function loadHeatmap(appId) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando heatmap...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/heatmap?days=30`);
        const { cells, max_count } = data;
        
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        // Criar grid do heatmap
        let html = '<div class="overflow-x-auto">';
        html += '<div class="grid gap-1" style="grid-template-columns: 40px repeat(24, 1fr); min-width: 600px;">';
        
        // Header com horas
        html += '<div></div>';
        for (let h = 0; h < 24; h++) {
            html += `<div class="text-xs text-gray-500 text-center">${h}</div>`;
        }
        
        // Linhas por dia da semana
        for (let d = 0; d < 7; d++) {
            html += `<div class="text-xs text-gray-400 flex items-center">${days[d]}</div>`;
            for (let h = 0; h < 24; h++) {
                const cell = cells.find(c => c.day_of_week === d && c.hour === h) || { count: 0, intensity: 0 };
                const bgColor = getHeatmapColor(cell.intensity);
                html += `<div class="w-full h-6 rounded-sm cursor-pointer transition-all hover:scale-110" 
                         style="background-color: ${bgColor};" 
                         title="${days[d]} ${h}h: ${cell.count} eventos"></div>`;
            }
        }
        
        html += '</div>';
        
        // Legenda
        html += `
            <div class="flex items-center justify-center gap-2 mt-3">
                <span class="text-xs text-gray-500">Menos</span>
                <div class="flex gap-1">
                    <div class="w-4 h-4 rounded-sm" style="background-color: ${getHeatmapColor(0)}"></div>
                    <div class="w-4 h-4 rounded-sm" style="background-color: ${getHeatmapColor(0.25)}"></div>
                    <div class="w-4 h-4 rounded-sm" style="background-color: ${getHeatmapColor(0.5)}"></div>
                    <div class="w-4 h-4 rounded-sm" style="background-color: ${getHeatmapColor(0.75)}"></div>
                    <div class="w-4 h-4 rounded-sm" style="background-color: ${getHeatmapColor(1)}"></div>
                </div>
                <span class="text-xs text-gray-500">Mais</span>
                <span class="text-xs text-gray-600 ml-4">Max: ${max_count} eventos</span>
            </div>
        `;
        html += '</div>';
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Erro ao carregar heatmap:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar heatmap</p>';
    }
}

function getHeatmapColor(intensity) {
    if (intensity === 0) return 'rgba(255, 255, 255, 0.05)';
    // Gradiente de azul escuro para verde brilhante
    const r = Math.round(16 + (34 - 16) * (1 - intensity));
    const g = Math.round(185 + (197 - 185) * intensity);
    const b = Math.round(129 + (94 - 129) * (1 - intensity));
    const a = 0.3 + intensity * 0.7;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// ========================================
// USER JOURNEY
// ========================================

async function loadJourney(appId) {
    const container = document.getElementById('journey-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando jornada...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/journey?since=24h`);
        const { steps, total_users, completions } = data;
        
        if (steps.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center">Sem dados de jornada</p>';
            return;
        }
        
        const completionRate = total_users > 0 ? (completions / total_users * 100).toFixed(1) : 0;
        
        let html = `
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm text-gray-400">Total: ${total_users} usuários</span>
                <span class="text-sm ${completionRate > 10 ? 'text-emerald-400' : 'text-amber-400'}">
                    Completaram: ${completionRate}%
                </span>
            </div>
        `;
        
        html += '<div class="space-y-2">';
        
        steps.forEach((step, i) => {
            const width = total_users > 0 ? (step.count / total_users * 100) : 0;
            const eventName = formatEventName(step.event_type);
            
            html += `
                <div class="relative">
                    <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-gray-400">${i + 1}. ${eventName}</span>
                        <span class="text-white">${step.count} <span class="text-gray-500">(${width.toFixed(0)}%)</span></span>
                    </div>
                    <div class="h-6 bg-white/5 rounded-lg overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg transition-all duration-500"
                             style="width: ${width}%"></div>
                    </div>
                    ${step.drop_off > 0 ? `
                        <span class="absolute right-0 -top-1 text-xs text-rose-400">
                            -${step.drop_off.toFixed(0)}%
                        </span>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Erro ao carregar jornada:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar jornada</p>';
    }
}

function formatEventName(eventType) {
    const names = {
        'session.start': 'Sessão Iniciada',
        'nav.feature.enter': 'Entrou em Feature',
        'interaction.queue.joined': 'Entrou na Fila',
        'interaction.match.created': 'Match Criado',
        'interaction.message.sent': 'Mensagem Enviada',
        'interaction.match.ended': 'Match Finalizado'
    };
    return names[eventType] || eventType;
}

// ========================================
// DISTRIBUIÇÃO GEOGRÁFICA
// ========================================

async function loadGeo(appId) {
    const container = document.getElementById('geo-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/geo?since=168h&limit=10`);
        const countries = data.countries || [];
        
        if (countries.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center">Sem dados geográficos</p>';
            return;
        }
        
        let html = '<div class="space-y-2">';
        
        countries.forEach((country, i) => {
            const flag = getCountryFlag(country.country);
            html += `
                <div class="flex items-center gap-3">
                    <span class="text-lg">${flag}</span>
                    <div class="flex-1">
                        <div class="flex items-center justify-between text-xs mb-1">
                            <span class="text-gray-300">${country.country || 'Desconhecido'}</span>
                            <span class="text-gray-400">${country.sessions} sessões (${country.percent.toFixed(1)}%)</span>
                        </div>
                        <div class="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                 style="width: ${country.percent}%"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Erro ao carregar geo:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar</p>';
    }
}

function getCountryFlag(countryCode) {
    const flags = {
        'BR': '🇧🇷', 'US': '🇺🇸', 'PT': '🇵🇹', 'ES': '🇪🇸', 'AR': '🇦🇷',
        'MX': '🇲🇽', 'CO': '🇨🇴', 'CL': '🇨🇱', 'PE': '🇵🇪', 'VE': '🇻🇪',
        'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'GB': '🇬🇧', 'CA': '🇨🇦',
        'JP': '🇯🇵', 'CN': '🇨🇳', 'IN': '🇮🇳', 'AU': '🇦🇺', 'RU': '🇷🇺'
    };
    return flags[countryCode] || '🌍';
}

// ========================================
// LIVE EVENTS STREAM
// ========================================

let liveEventsInterval = null;

async function loadLiveEvents(appId) {
    const container = document.getElementById('live-events-container');
    if (!container) return;
    
    // Limpar intervalo anterior
    if (liveEventsInterval) {
        clearInterval(liveEventsInterval);
    }
    
    async function fetchEvents() {
        try {
            const data = await api(`/admin/telemetry/apps/${appId}/live?limit=15`);
            const events = data.events || [];
            
            if (events.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">Aguardando eventos...</p>';
                return;
            }
            
            let html = '<div class="space-y-1 max-h-64 overflow-y-auto">';
            
            events.forEach(event => {
                const eventConfig = getEventConfig(event.type);
                html += `
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                        <div class="w-6 h-6 ${eventConfig.bgClass} rounded flex items-center justify-center">
                            <i class="fas ${eventConfig.icon} ${eventConfig.iconClass} text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-xs text-white truncate">${event.type}</p>
                            <p class="text-xs text-gray-500">${event.user_id}</p>
                        </div>
                        <span class="text-xs text-gray-500 whitespace-nowrap">${event.time_ago}</span>
                    </div>
                `;
            });
            
            html += '</div>';
            container.innerHTML = html;
            
        } catch (err) {
            console.error('Erro ao carregar live events:', err);
        }
    }
    
    // Buscar imediatamente
    await fetchEvents();
    
    // Atualizar a cada 5 segundos
    liveEventsInterval = setInterval(fetchEvents, 5000);
}

function stopLiveEvents() {
    if (liveEventsInterval) {
        clearInterval(liveEventsInterval);
        liveEventsInterval = null;
    }
}

function getEventConfig(type) {
    if (type.startsWith('session.')) {
        return { icon: 'fa-user', bgClass: 'bg-blue-500/20', iconClass: 'text-blue-400' };
    }
    if (type.startsWith('interaction.match')) {
        return { icon: 'fa-heart', bgClass: 'bg-pink-500/20', iconClass: 'text-pink-400' };
    }
    if (type.startsWith('interaction.queue')) {
        return { icon: 'fa-clock', bgClass: 'bg-amber-500/20', iconClass: 'text-amber-400' };
    }
    if (type.startsWith('interaction.message')) {
        return { icon: 'fa-comment', bgClass: 'bg-emerald-500/20', iconClass: 'text-emerald-400' };
    }
    if (type.startsWith('nav.')) {
        return { icon: 'fa-compass', bgClass: 'bg-purple-500/20', iconClass: 'text-purple-400' };
    }
    if (type.startsWith('error.')) {
        return { icon: 'fa-exclamation', bgClass: 'bg-rose-500/20', iconClass: 'text-rose-400' };
    }
    return { icon: 'fa-circle', bgClass: 'bg-gray-500/20', iconClass: 'text-gray-400' };
}

// ========================================
// TOP USERS
// ========================================

async function loadTopUsers(appId) {
    const container = document.getElementById('top-users-container');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm text-center">Carregando...</p>';
    
    try {
        const data = await api(`/admin/telemetry/apps/${appId}/top-users?limit=10&since=168h`);
        const users = data.users || [];
        
        if (users.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm text-center">Sem dados de usuários</p>';
            return;
        }
        
        let html = '<div class="space-y-2">';
        
        users.forEach((user, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            html += `
                <div class="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    <span class="text-lg w-8 text-center">${medal}</span>
                    <div class="flex-1">
                        <p class="text-xs text-gray-300 font-mono">${user.user_id.substring(0, 8)}...</p>
                        <div class="flex gap-3 text-xs text-gray-500 mt-1">
                            <span><i class="fas fa-play mr-1"></i>${user.session_count} sessões</span>
                            <span><i class="fas fa-clock mr-1"></i>${formatDuration(user.total_duration)}</span>
                            <span><i class="fas fa-heart mr-1"></i>${user.match_count} matches</span>
                        </div>
                    </div>
                    <span class="text-xs text-gray-600">${user.last_seen}</span>
                </div>
            `;
        });
        
        html += '</div>';
        
        container.innerHTML = html;
        
    } catch (err) {
        console.error('Erro ao carregar top users:', err);
        container.innerHTML = '<p class="text-rose-400 text-sm text-center">Erro ao carregar</p>';
    }
}
