import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuthStore } from '@/hooks/useAuthStore';
import {
    Settings, Monitor, Tablet, Smartphone, Users,
    Plus, Trash2, Save, ExternalLink, Copy, Check,
    Volume2, Bell, Clock, Loader2
} from 'lucide-react';

interface Counter {
    id: string;
    name: string;
    type: 'guiche' | 'consultorio' | 'sala';
    active: boolean;
}

interface QueueSettings {
    counters: Counter[];
    services: string[];
    autoCallEnabled: boolean;
    soundEnabled: boolean;
    speechEnabled: boolean;
    estimatedTimePerPatient: number;
}

const DEFAULT_SETTINGS: QueueSettings = {
    counters: [
        { id: '1', name: 'Guichê 1', type: 'guiche', active: true },
        { id: '2', name: 'Guichê 2', type: 'guiche', active: true },
        { id: '3', name: 'Consultório 1', type: 'consultorio', active: true },
        { id: '4', name: 'Consultório 2', type: 'consultorio', active: true },
        { id: '5', name: 'Sala de Triagem', type: 'sala', active: true },
    ],
    services: ['Clínica Geral', 'Cardiologia', 'Ortopedia', 'Pediatria', 'Ginecologia'],
    autoCallEnabled: false,
    soundEnabled: true,
    speechEnabled: true,
    estimatedTimePerPatient: 15,
};

export default function QueueSettingsPage() {
    const router = useRouter();
    const { isAuthenticated, role } = useAuthStore();
    const [settings, setSettings] = useState<QueueSettings>(DEFAULT_SETTINGS);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [newService, setNewService] = useState('');
    const [newCounter, setNewCounter] = useState({ name: '', type: 'guiche' as const });

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/auth/login');
            return;
        }
        if (role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }
        // Load settings from localStorage (in production, would be from API)
        const saved = localStorage.getItem('queue_settings');
        if (saved) {
            setSettings(JSON.parse(saved));
        }
    }, [isAuthenticated, role]);

    const handleSave = async () => {
        setSaving(true);
        // Save to localStorage (in production, would be API call)
        localStorage.setItem('queue_settings', JSON.stringify(settings));
        await new Promise(r => setTimeout(r, 500));
        setSaving(false);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const addCounter = () => {
        if (!newCounter.name.trim()) return;
        setSettings(prev => ({
            ...prev,
            counters: [...prev.counters, {
                id: Date.now().toString(),
                name: newCounter.name,
                type: newCounter.type,
                active: true
            }]
        }));
        setNewCounter({ name: '', type: 'guiche' });
    };

    const removeCounter = (id: string) => {
        setSettings(prev => ({
            ...prev,
            counters: prev.counters.filter(c => c.id !== id)
        }));
    };

    const addService = () => {
        if (!newService.trim() || settings.services.includes(newService)) return;
        setSettings(prev => ({
            ...prev,
            services: [...prev.services, newService]
        }));
        setNewService('');
    };

    const removeService = (service: string) => {
        setSettings(prev => ({
            ...prev,
            services: prev.services.filter(s => s !== service)
        }));
    };

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const urls = [
        { id: 'display', name: 'Painel TV (Display)', url: `${baseUrl}/queue/display`, icon: Monitor, description: 'Tela para TV na sala de espera' },
        { id: 'join', name: 'Retirar Senha', url: `${baseUrl}/queue/join`, icon: Tablet, description: 'Tablet/totem para pacientes' },
        { id: 'panel', name: 'Painel Atendente', url: `${baseUrl}/queue/panel`, icon: Users, description: 'Controle de chamadas (requer login)' },
        { id: 'track', name: 'Acompanhar Senha', url: `${baseUrl}/queue/track`, icon: Smartphone, description: 'Paciente acompanha pelo celular' },
        { id: 'history', name: 'Histórico', url: `${baseUrl}/queue/history`, icon: Clock, description: 'Relatórios e estatísticas' },
    ];

    return (
        <>
            <Head>
                <title>Configurações da Fila | MediSync</title>
            </Head>

            <div className="max-w-5xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Settings className="w-7 h-7 text-cyan-600" />
                            Configurações da Fila Digital
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Configure guichês, serviços e acesse os links do sistema
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Salvar
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* URLs Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <ExternalLink className="w-5 h-5 text-cyan-600" />
                            Links do Sistema
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Use estes links para configurar os dispositivos na clínica
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {urls.map((item) => (
                                <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="flex items-center gap-3 mb-2">
                                        <item.icon className="w-5 h-5 text-cyan-600" />
                                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-3">{item.description}</p>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={item.url}
                                            readOnly
                                            className="flex-1 text-xs px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(item.url, item.id)}
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                            title="Copiar"
                                        >
                                            {copied === item.id ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                            title="Abrir"
                                        >
                                            <ExternalLink className="w-4 h-4 text-gray-400" />
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Counters Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-cyan-600" />
                            Guichês e Consultórios
                        </h2>
                        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                            {settings.counters.map((counter) => (
                                <div key={counter.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={counter.active}
                                            onChange={(e) => {
                                                setSettings(prev => ({
                                                    ...prev,
                                                    counters: prev.counters.map(c =>
                                                        c.id === counter.id ? { ...c, active: e.target.checked } : c
                                                    )
                                                }));
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-gray-900 dark:text-white">{counter.name}</span>
                                        <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                                            {counter.type}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeCounter(counter.id)}
                                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newCounter.name}
                                onChange={(e) => setNewCounter(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Nome do guichê"
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                            />
                            <select
                                value={newCounter.type}
                                onChange={(e) => setNewCounter(prev => ({ ...prev, type: e.target.value as any }))}
                                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                            >
                                <option value="guiche">Guichê</option>
                                <option value="consultorio">Consultório</option>
                                <option value="sala">Sala</option>
                            </select>
                            <button
                                onClick={addCounter}
                                className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Services Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-600" />
                            Serviços / Especialidades
                        </h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {settings.services.map((service) => (
                                <span
                                    key={service}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-sm"
                                >
                                    {service}
                                    <button
                                        onClick={() => removeService(service)}
                                        className="p-0.5 hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newService}
                                onChange={(e) => setNewService(e.target.value)}
                                placeholder="Nova especialidade"
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                                onKeyPress={(e) => e.key === 'Enter' && addService()}
                            />
                            <button
                                onClick={addService}
                                className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Audio Settings */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Volume2 className="w-5 h-5 text-cyan-600" />
                            Configurações de Áudio
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.soundEnabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
                                    className="rounded border-gray-300 text-cyan-600"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Som de Notificação</p>
                                    <p className="text-sm text-gray-500">Toca som ao chamar senha</p>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.speechEnabled}
                                    onChange={(e) => setSettings(prev => ({ ...prev, speechEnabled: e.target.checked }))}
                                    className="rounded border-gray-300 text-cyan-600"
                                />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Síntese de Voz</p>
                                    <p className="text-sm text-gray-500">Anuncia senha por voz</p>
                                </div>
                            </label>
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <p className="font-medium text-gray-900 dark:text-white mb-2">Tempo Médio por Paciente</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={settings.estimatedTimePerPatient}
                                        onChange={(e) => setSettings(prev => ({ ...prev, estimatedTimePerPatient: parseInt(e.target.value) || 15 }))}
                                        className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-center"
                                        min={1}
                                        max={60}
                                    />
                                    <span className="text-gray-500">minutos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Setup Guide */}
                <div className="mt-6 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-700 rounded-xl p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-3">🚀 Guia Rápido de Configuração</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">TV na Sala de Espera</p>
                                <p className="text-gray-600 dark:text-gray-400">Abra o link "Painel TV" no navegador da TV e deixe em tela cheia (F11)</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Tablet na Recepção</p>
                                <p className="text-gray-600 dark:text-gray-400">Abra o link "Retirar Senha" e adicione à tela inicial como app</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Computador do Médico</p>
                                <p className="text-gray-600 dark:text-gray-400">Acesse "Painel Atendente" com login de médico para chamar pacientes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
