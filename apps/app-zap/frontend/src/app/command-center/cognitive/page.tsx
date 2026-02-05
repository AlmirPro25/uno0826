'use client';

import { useEffect, useState } from 'react';
import { ghostApi } from '@/services/ghost-api';
import {
    Brain, Sparkles, MessageSquare, Trash2,
    RefreshCw, CheckCircle, AlertTriangle,
    Zap, List, Search, Plus
} from 'lucide-react';

interface StyleDNA {
    avgWordCount: number;
    emojiFrequency: number;
    commonEmojis: string[];
    punctuationStyle: string;
    frequentPhrases: string[];
    intentionalErrors: string[];
}

interface ObjectionPattern {
    id: string;
    triggerPattern: string;
    category: string;
    winningResponse: string;
    successRate: number;
    timesUsed: number;
}

export default function CognitivePage() {
    const [styleDNA, setStyleDNA] = useState<StyleDNA | null>(null);
    const [objections, setObjections] = useState<ObjectionPattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [extracting, setExtracting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Real APIs would go here
            const [styleRes, objRes] = await Promise.all([
                ghostApi.cognitive.getDashboard().catch(() => null),
                ghostApi.cognitive.getObjectionPrompt().catch(() => null)
            ]);

            // Mocking for UI development
            setStyleDNA({
                avgWordCount: 8.5,
                emojiFrequency: 0.65,
                commonEmojis: ['🔥', '🌚', '💜', '🙊', '👀'],
                punctuationStyle: 'INFORMAL (Double dots, few commas)',
                frequentPhrases: ['eai amor', 'bora fechar?', 'vixi kkk', 'slc'],
                intentionalErrors: ['vc', 'tb', 'pq', 'hj', 'fala tu']
            });

            setObjections([
                { id: '1', triggerPattern: 'tá caro', category: 'PRICE', winningResponse: 'Amor, a qualidade custa um pouquinho a mais, mas vale cada centavo... 🌚', successRate: 0.85, timesUsed: 124 },
                { id: '2', triggerPattern: 'manda uma grátis', category: 'TRUST', winningResponse: 'Poxa baby, o conteúdo é VIP, mas te mando um bônus especial no primeiro pack! 💜', successRate: 0.62, timesUsed: 89 },
                { id: '3', triggerPattern: 'é real?', category: 'TRUST', winningResponse: 'Real oficial! Se quiser te mando um áudio agora pra vc conferir... 🙊', successRate: 0.94, timesUsed: 210 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const extractDNA = async () => {
        setExtracting(true);
        try {
            await ghostApi.cognitive.extractStyle();
            alert('Style DNA extraction completed successfully!');
            loadData();
        } catch (error) {
            console.error('Extraction failed:', error);
        } finally {
            setExtracting(false);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Brain className="w-8 h-8 text-purple-400" />
                        Cognitive Engine
                    </h1>
                    <p className="text-gray-400">Manage Persona DNA and Sales Intelligence</p>
                </div>
                <button
                    onClick={extractDNA}
                    disabled={extracting}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold hover:brightness-110 transition-all disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${extracting ? 'animate-spin' : ''}`} />
                    {extracting ? 'Analyzing Style...' : 'Extract Style DNA'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Writing DNA Panel */}
                <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-purple-500/20 bg-purple-500/5">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            Operator Writing DNA
                        </h2>
                    </div>
                    {styleDNA ? (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <DNAMetric label="Avg Word Count" value={styleDNA.avgWordCount} />
                                <DNAMetric label="Emoji Frequency" value={`${(styleDNA.emojiFrequency * 100).toFixed(0)}%`} />
                            </div>

                            <div className="space-y-3">
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Top Emojis</label>
                                <div className="flex gap-3 text-2xl">
                                    {styleDNA.commonEmojis.map((e, i) => (
                                        <span key={i} className="hover:scale-125 transition-transform cursor-default">{e}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Punctuation Style</label>
                                <p className="text-purple-300 font-medium italic">{styleDNA.punctuationStyle}</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Frequent Phrases</label>
                                <div className="flex flex-wrap gap-2">
                                    {styleDNA.frequentPhrases.map((p, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-lg text-sm">{p}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-gray-500 text-xs font-bold uppercase tracking-wider">Intentional Abbreviations</label>
                                <div className="flex flex-wrap gap-2">
                                    {styleDNA.intentionalErrors.map((e, i) => (
                                        <span key={i} className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-sm border border-purple-500/20">{e}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 text-center text-gray-500">
                            No DNA extracted yet. Click the button above to analyze chat history.
                        </div>
                    )}
                </div>

                {/* Objection Library */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-orange-400" />
                            Sales IQ: Objection Library
                        </h2>
                        <button className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {objections.map(obj => (
                            <div key={obj.id} className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-xl p-4 hover:border-orange-500/30 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-bold rounded mb-1 inline-block">
                                            {obj.category}
                                        </span>
                                        <h3 className="text-white font-bold group-hover:text-orange-400 transition-colors">
                                            "{obj.triggerPattern}"
                                        </h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-bold text-lg">{(obj.successRate * 100).toFixed(0)}%</div>
                                        <div className="text-gray-600 text-[10px] uppercase font-bold">Success</div>
                                    </div>
                                </div>
                                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800 text-sm text-gray-300 italic">
                                    "{obj.winningResponse}"
                                </div>
                                <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-500 font-bold">
                                    <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> USED {obj.timesUsed}x</span>
                                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> LEARNED FROM OPERATOR</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-500/20 rounded-xl">
                                <Brain className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold">Dynamic Prompting</h3>
                                <p className="text-gray-400 text-sm">Persona style is injected into LLM contexts in real-time.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DNAMetric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/50">
            <div className="text-gray-500 text-xs font-bold uppercase mb-1">{label}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
        </div>
    );
}
