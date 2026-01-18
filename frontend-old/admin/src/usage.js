/**
 * PROST-QS Resource Usage Monitor - Fase 29
 * "Eficiência é o novo lucro"
 * 
 * Módulo para visualização de consumo de recursos por aplicação.
 */

async function renderUsageSection(container) {
    try {
        loader(true);
        // No Admin, listamos uso geral ou permitimos selecionar um App.
        // Por agora, vamos buscar as aplicações primeiro.
        const apps = await api('/admin/dashboard').then(d => d.apps || []);

        container.innerHTML = `
            <div class="mb-6">
                <h3 class="font-bold text-xl mb-2">Consumo de Recursos</h3>
                <p class="text-gray-400">Monitore o uso de CPU, Memória e Eventos de cada aplicação.</p>
            </div>

            <div class="grid grid-cols-1 gap-6" id="usage-list">
                <div class="card p-8 text-center text-gray-500">
                    <p><i class="fas fa-spinner fa-spin mr-2"></i> Calculando métricas de todas as aplicações...</p>
                </div>
            </div>
        `;

        // Se tiver apps, carregar uso de cada uma (simulação de agregação)
        // No backend real, poderíamos ter um /usage/overview
        loadUsageOverview(apps);

    } catch (err) {
        container.innerHTML = renderError('Erro ao carregar Usage', err.message);
    } finally {
        loader(false);
    }
}

async function loadUsageOverview(apps) {
    const list = document.getElementById('usage-list');
    if (!list) return;

    if (!apps || apps.length === 0) {
        list.innerHTML = '<div class="card p-8 text-center text-gray-500">Nenhuma aplicação encontrada para monitorar uso.</div>';
        return;
    }

    try {
        // Buscar uso do primeiro app como demonstração (Backend mockup)
        const usageData = [];
        for (const app of apps.slice(0, 5)) {
            const usage = await api(`/usage/apps/${app.id}/current`).catch(() => ({
                deploy_count: 0,
                telemetry_events: 0,
                webhook_calls: 0,
                container_hours: 0,
                crash_count: 0
            }));
            usageData.push({ ...app, usage });
        }

        list.innerHTML = usageData.map(item => `
            <div class="card rounded-2xl p-6 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold">
                        ${item.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-bold">${item.name}</h4>
                        <p class="text-xs text-gray-500 font-mono">${item.id}</p>
                    </div>
                </div>

                <div class="flex gap-8">
                    <div class="text-center">
                        <p class="text-lg font-bold text-cyan-400">${item.usage.telemetry_events.toLocaleString()}</p>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Eventos</p>
                    </div>
                    <div class="text-center">
                        <p class="text-lg font-bold text-purple-400">${item.usage.deploy_count}</p>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Deploys</p>
                    </div>
                    <div class="text-center">
                        <p class="text-lg font-bold text-emerald-400">${item.usage.container_hours}h</p>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Uptime</p>
                    </div>
                    <div class="text-center">
                        <p class="text-lg font-bold ${item.usage.crash_count > 0 ? 'text-rose-400' : 'text-gray-500'}">${item.usage.crash_count}</p>
                        <p class="text-[10px] text-gray-500 uppercase tracking-wider">Crashes</p>
                    </div>
                </div>

                <button class="bg-white/5 hover:bg-white/10 p-2 rounded-lg text-gray-400">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `).join('');

    } catch (err) {
        list.innerHTML = `<div class="p-4 text-rose-400 text-sm">Erro ao carregar detalhes: ${err.message}</div>`;
    }
}
