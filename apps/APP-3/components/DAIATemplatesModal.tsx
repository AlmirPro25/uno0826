/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    DAIA Templates Modal                                       ║
 * ║                                                                               ║
 * ║              Visualização dos templates aprendidos pelo DAIA                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useEffect, useCallback } from 'react';
import { daiaService, type TemplateResult } from '@/services/DAIAService';
import { daiaBrain } from '@/services/DAIABrainService';

interface DAIATemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate?: (template: TemplateResult) => void;
}

interface CategoryStats {
    name: string;
    count: number;
}

const DAIATemplatesModal: React.FC<DAIATemplatesModalProps> = ({
    isOpen,
    onClose,
    onUseTemplate
}) => {
    const [templates, setTemplates] = useState<TemplateResult[]>([]);
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateResult | null>(null);
    const [stats, setStats] = useState<{ total: number; avgScore: number } | null>(null);
    const [brainAvailable, setBrainAvailable] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Check brain status
            const brainStatus = await daiaBrain.getStatus();
            setBrainAvailable(brainStatus.status === 'online');

            // Load stats
            const statsData = await daiaService.getStats();
            if (statsData) {
                setStats({
                    total: statsData.total_templates,
                    avgScore: statsData.avg_score
                });
                
                // Extract categories from stats
                if (statsData.categories) {
                    const cats = Object.entries(statsData.categories).map(([name, count]) => ({
                        name,
                        count: count as number
                    }));
                    setCategories(cats);
                }
            }

            // Load templates
            const templatesData = await daiaService.listTemplates(50, 0, selectedCategory || undefined);
            setTemplates(templatesData);
        } catch (error) {
            console.error('[DAIA Modal] Erro ao carregar dados:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, loadData]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadData();
            return;
        }

        setIsLoading(true);
        try {
            const results = await daiaService.search(searchQuery, 20, selectedCategory || undefined);
            setTemplates(results);
        } catch (error) {
            console.error('[DAIA Modal] Erro na busca:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Tem certeza que deseja remover este template?')) return;

        try {
            await daiaService.deleteTemplate(templateId);
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            setSelectedTemplate(null);
        } catch (error) {
            console.error('[DAIA Modal] Erro ao deletar:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center">
                            <i className="fa-solid fa-brain text-white text-lg" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">DAIA - Templates Aprendidos</h2>
                            <p className="text-xs text-slate-400">
                                {stats ? `${stats.total} templates • Score médio: ${stats.avgScore.toFixed(1)}` : 'Carregando...'}
                                {brainAvailable && <span className="ml-2 text-emerald-400">• Brain Ativo</span>}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors p-2"
                    >
                        <i className="fa-solid fa-times text-xl" />
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="p-4 border-b border-slate-700 flex gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Buscar templates..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                            />
                            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors"
                    >
                        Buscar
                    </button>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                        <i className="fa-solid fa-refresh mr-2" />
                        Atualizar
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - Categories */}
                    <div className="w-48 border-r border-slate-700 p-4 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Categorias</h3>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                                selectedCategory === null
                                    ? 'bg-sky-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            Todas ({stats?.total || 0})
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setSelectedCategory(cat.name)}
                                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                                    selectedCategory === cat.name
                                        ? 'bg-sky-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800'
                                }`}
                            >
                                {cat.name} ({cat.count})
                            </button>
                        ))}
                    </div>

                    {/* Templates Grid */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <i className="fa-solid fa-spinner fa-spin text-3xl text-sky-500" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <i className="fa-solid fa-folder-open text-5xl mb-4" />
                                <p>Nenhum template encontrado</p>
                                <p className="text-sm mt-2">Dê like em códigos gerados para salvar aqui!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template)}
                                        className={`bg-slate-800 border rounded-lg p-4 cursor-pointer transition-all hover:border-sky-500 ${
                                            selectedTemplate?.id === template.id
                                                ? 'border-sky-500 ring-2 ring-sky-500/30'
                                                : 'border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-xs px-2 py-1 bg-slate-700 rounded text-slate-300">
                                                {template.category || 'general'}
                                            </span>
                                            {template.score && (
                                                <span className={`text-xs font-medium ${
                                                    template.score >= 90 ? 'text-emerald-400' :
                                                    template.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                                                }`}>
                                                    {template.score}/100
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-white line-clamp-2 mb-2">
                                            {template.prompt}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(template.created_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Template Preview */}
                    {selectedTemplate && (
                        <div className="w-96 border-l border-slate-700 flex flex-col">
                            <div className="p-4 border-b border-slate-700">
                                <h3 className="font-semibold text-white mb-1">Preview</h3>
                                <p className="text-xs text-slate-400 line-clamp-2">{selectedTemplate.prompt}</p>
                            </div>
                            <div className="flex-1 overflow-auto p-4">
                                <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-950 p-3 rounded-lg">
                                    {selectedTemplate.code.substring(0, 2000)}
                                    {selectedTemplate.code.length > 2000 && '...'}
                                </pre>
                            </div>
                            <div className="p-4 border-t border-slate-700 flex gap-2">
                                {onUseTemplate && (
                                    <button
                                        onClick={() => {
                                            onUseTemplate(selectedTemplate);
                                            onClose();
                                        }}
                                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                                    >
                                        <i className="fa-solid fa-code mr-2" />
                                        Usar Template
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                                    className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                                >
                                    <i className="fa-solid fa-trash" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DAIATemplatesModal;
