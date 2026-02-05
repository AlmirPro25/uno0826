'use client';

import { useState } from 'react';
import { ghostApi } from '@/services/ghost-api';
import {
    Image, Mic, Play, Download, RefreshCw, Sparkles,
    Camera, Palette, Smile, Moon, Sun, Heart, Zap
} from 'lucide-react';

export default function MediaPage() {
    const [activeSection, setActiveSection] = useState<'voice' | 'image'>('voice');

    // Voice State
    const [voiceText, setVoiceText] = useState('');
    const [voiceEmotion, setVoiceEmotion] = useState<'neutral' | 'happy' | 'sad' | 'angry'>('happy');
    const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
    const [voiceLoading, setVoiceLoading] = useState(false);

    // Image State
    const [imagePrompt, setImagePrompt] = useState('');
    const [selfieMode, setSelfieMode] = useState(false);
    const [selfieMood, setSelfieMood] = useState('happy');
    const [selfieSetting, setSelfieSetting] = useState('outdoor');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(false);

    const generateVoice = async () => {
        if (!voiceText.trim()) return;
        setVoiceLoading(true);
        try {
            const res = await ghostApi.media.generateVoice(voiceText, voiceEmotion);
            if (res.data?.audio?.base64) {
                const audioUrl = `data:${res.data.audio.mimeType};base64,${res.data.audio.base64}`;
                setGeneratedAudio(audioUrl);
            }
        } catch (error) {
            console.error('Voice generation failed:', error);
        } finally {
            setVoiceLoading(false);
        }
    };

    const generateImage = async () => {
        setImageLoading(true);
        try {
            let res;
            if (selfieMode) {
                res = await ghostApi.media.generateSelfie(selfieMood, selfieSetting);
            } else {
                res = await ghostApi.media.generateImage(imagePrompt);
            }

            if (res.data?.image?.base64) {
                const imageUrl = `data:${res.data.image.mimeType};base64,${res.data.image.base64}`;
                setGeneratedImages(prev => [imageUrl, ...prev].slice(0, 6));
            }
        } catch (error) {
            console.error('Image generation failed:', error);
        } finally {
            setImageLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                            <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400">
                                Media Studio
                            </h1>
                        </div>
                        <p className="text-gray-400">Gere áudios e imagens contextuais com inteligência artificial</p>
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-4 mb-10">
                    <button
                        onClick={() => setActiveSection('voice')}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 ${activeSection === 'voice'
                            ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                            : 'bg-black/30 border-gray-700 text-gray-400 hover:text-white hover:bg-white/5'
                            } border backdrop-blur-md group`}
                    >
                        <Mic className={`w-5 h-5 group-hover:scale-110 transition-transform ${activeSection === 'voice' ? 'text-cyan-400' : ''}`} />
                        <span className="font-semibold text-lg">Voice Synthesis</span>
                    </button>
                    <button
                        onClick={() => setActiveSection('image')}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl transition-all duration-300 ${activeSection === 'image'
                            ? 'bg-violet-500/20 border-violet-500/50 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
                            : 'bg-black/30 border-gray-700 text-gray-400 hover:text-white hover:bg-white/5'
                            } border backdrop-blur-md group`}
                    >
                        <Image className={`w-5 h-5 group-hover:scale-110 transition-transform ${activeSection === 'image' ? 'text-violet-400' : ''}`} />
                        <span className="font-semibold text-lg">Image Generator</span>
                    </button>
                </div>

                {/* Voice Section */}
                {activeSection === 'voice' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] -z-10 group-hover:bg-cyan-500/10 transition-colors" />

                            <h3 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-lg">
                                    <Mic className="w-6 h-6 text-cyan-400" />
                                </div>
                                Text-to-Speech Conversion
                            </h3>

                            {/* Text Input */}
                            <div className="mb-8">
                                <label className="text-gray-400 text-sm font-medium mb-3 block">Mensagem para Transcrever</label>
                                <div className="relative">
                                    <textarea
                                        value={voiceText}
                                        onChange={(e) => setVoiceText(e.target.value)}
                                        placeholder="Digite o texto que a persona deve falar..."
                                        className="w-full h-40 bg-black/40 border border-gray-700 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none text-lg leading-relaxed"
                                    />
                                    <div className="absolute bottom-4 right-4 text-gray-600 text-xs font-mono">
                                        {voiceText.length} caracteres
                                    </div>
                                </div>
                            </div>

                            {/* Options Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* Emotion Selection */}
                                <div>
                                    <label className="text-gray-400 text-sm font-medium mb-3 block">Emoção e Entonação</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'neutral', label: 'Neutra', icon: '😐' },
                                            { id: 'happy', label: 'Feliz', icon: '😊' },
                                            { id: 'flirty', label: 'Sedutora', icon: '😏' },
                                            { id: 'sad', label: 'Triste', icon: '😢' },
                                            { id: 'angry', label: 'Irritada', icon: '😠' }
                                        ].map(emotion => (
                                            <button
                                                key={emotion.id}
                                                onClick={() => setVoiceEmotion(emotion.id as any)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${voiceEmotion === emotion.id
                                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                    } text-sm font-medium border border-transparent`}
                                            >
                                                <span>{emotion.icon}</span>
                                                {emotion.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Quick Controls (Placeholder for speed/pitch) */}
                                <div>
                                    <label className="text-gray-400 text-sm font-medium mb-3 block">Configurações Avançadas</label>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-gray-800 flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500 mb-1">Voz</span>
                                                <span className="text-white text-sm font-medium">Francisca (Neural)</span>
                                            </div>
                                            <div className="flex flex-col border-l border-gray-700 pl-4">
                                                <span className="text-xs text-gray-500 mb-1">Velocidade</span>
                                                <span className="text-white text-sm font-medium">1.0x</span>
                                            </div>
                                        </div>
                                        <div className="text-cyan-400 cursor-pointer hover:underline text-xs">Ajustar</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={generateVoice}
                                    disabled={voiceLoading || !voiceText.trim()}
                                    className="flex-1 flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-lg transition-all shadow-xl shadow-cyan-500/10 active:scale-95"
                                >
                                    {voiceLoading ? (
                                        <RefreshCw className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <Zap className="w-6 h-6" />
                                    )}
                                    Sintetizar Áudio
                                </button>

                                {generatedAudio && (
                                    <button
                                        onClick={() => {
                                            const audio = new Audio(generatedAudio);
                                            audio.play();
                                        }}
                                        className="p-5 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-2xl text-cyan-400 transition-colors"
                                    >
                                        <Play className="w-6 h-6" />
                                    </button>
                                )}
                            </div>

                            {/* Audio Player */}
                            {generatedAudio && (
                                <div className="mt-8 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
                                            <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center">
                                                <Play className="w-5 h-5 text-black" fill="black" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-cyan-300">Áudio Pronto</span>
                                                <span className="text-xs text-gray-500">MPEG Audio • 128kbps</span>
                                            </div>
                                            <audio controls className="w-full h-8 brightness-110 contrast-125" src={generatedAudio}>
                                                Seu navegador não suporta áudio.
                                            </audio>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={generatedAudio}
                                                download="ghost-audio.mp3"
                                                className="p-3 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-xl transition-all group/dl"
                                                title="Download"
                                            >
                                                <Download className="w-5 h-5 text-cyan-400 group-hover/dl:scale-110 transition-transform" />
                                            </a>
                                            {/* Add Send to Contact button simulation */}
                                            <button className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-all text-purple-400" title="Send to Contact">
                                                <Smile className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Guidelines */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <SmallInfoCard
                                icon={Heart}
                                title="Fale Naturalmente"
                                text="Use vírgulas e reticências para simular pausas humanas reais."
                                color="cyan"
                            />
                            <SmallInfoCard
                                icon={Zap}
                                title="Frequência"
                                text="Evite textos muito longos. Áudios de 10-15s são os mais convertem."
                                color="purple"
                            />
                            <SmallInfoCard
                                icon={Smile}
                                title="Abusos de Emoção"
                                text="As emoções mudam drásticamente o tom da voz da persona."
                                color="pink"
                            />
                        </div>
                    </div>
                )}

                {/* Image Section */}
                {activeSection === 'image' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-black/40 backdrop-blur-xl border border-violet-500/30 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500/5 blur-[80px] -z-10 group-hover:bg-violet-500/10 transition-colors" />

                            <h3 className="text-xl font-semibold text-white mb-8 flex items-center gap-3">
                                <div className="p-2 bg-violet-500/20 rounded-lg">
                                    <Camera className="w-6 h-6 text-violet-400" />
                                </div>
                                Visual Intelligence Generator
                            </h3>

                            {/* Mode Selection */}
                            <div className="flex p-1 bg-black/50 border border-gray-800 rounded-2xl mb-8 w-full md:w-fit">
                                <button
                                    onClick={() => setSelfieMode(false)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${!selfieMode
                                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                        : 'text-gray-500 hover:text-gray-300'
                                        } font-medium text-sm`}
                                >
                                    <Palette className="w-4 h-4" />
                                    Custom Prompt
                                </button>
                                <button
                                    onClick={() => setSelfieMode(true)}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${selfieMode
                                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                                        : 'text-gray-500 hover:text-gray-300'
                                        } font-medium text-sm`}
                                >
                                    <Camera className="w-4 h-4" />
                                    Persona Selfie
                                </button>
                            </div>

                            {!selfieMode ? (
                                <div className="mb-8">
                                    <label className="text-gray-400 text-sm font-medium mb-3 block">Prompt de Geração</label>
                                    <textarea
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        placeholder="Descreva exatamente a imagem que deseja gerar..."
                                        className="w-full h-32 bg-black/40 border border-gray-700 rounded-2xl px-6 py-4 text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none transition-all resize-none text-lg"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <label className="text-gray-400 text-sm font-medium mb-4 block">Mood da Persona</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'happy', label: 'Sorrindo', icon: '😊' },
                                                { id: 'flirty', label: 'Provocante', icon: '😏' },
                                                { id: 'mysterious', label: 'Misteriosa', icon: '🤫' },
                                                { id: 'playful', label: 'Brincalhona', icon: '😝' }
                                            ].map(mood => (
                                                <button
                                                    key={mood.id}
                                                    onClick={() => setSelfieMood(mood.id)}
                                                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${selfieMood === mood.id
                                                        ? 'bg-violet-500/20 border-violet-500/50 text-white shadow-lg'
                                                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span className="text-xl">{mood.icon}</span>
                                                    <span className="font-medium text-sm">{mood.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-gray-400 text-sm font-medium mb-4 block">Cenário (Ambientação)</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: 'outdoor', label: 'Ao Ar Livre', icon: '🌳' },
                                                { id: 'beach', label: 'Praia', icon: '🏖️' },
                                                { id: 'bedroom', label: 'Quarto', icon: '🛏️' },
                                                { id: 'bathroom', label: 'Espelho', icon: '🪞' }
                                            ].map(setting => (
                                                <button
                                                    key={setting.id}
                                                    onClick={() => setSelfieSetting(setting.id)}
                                                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${selfieSetting === setting.id
                                                        ? 'bg-violet-500/20 border-violet-500/50 text-white shadow-lg'
                                                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                                                        }`}
                                                >
                                                    <span className="text-xl">{setting.icon}</span>
                                                    <span className="font-medium text-sm">{setting.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={generateImage}
                                disabled={imageLoading || (!selfieMode && !imagePrompt.trim())}
                                className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed rounded-2xl text-white font-bold text-lg transition-all shadow-xl shadow-violet-500/10 active:scale-95"
                            >
                                {imageLoading ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Sparkles className="w-6 h-6" />
                                )}
                                Gerar Imagem com Imagen 4
                            </button>
                        </div>

                        {/* Recent Generations List */}
                        {generatedImages.length > 0 && (
                            <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-3xl p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-lg font-semibold text-white">Galeria de Mídia Recente</h3>
                                    <span className="text-xs text-gray-500 font-mono">Autodelete em 72h</span>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    {generatedImages.map((img, i) => (
                                        <div key={i} className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-gray-800 hover:border-violet-500/50 transition-all duration-500">
                                            <img
                                                src={img}
                                                alt={`Generated ${i + 1}`}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                                <div className="flex gap-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                                    <a
                                                        href={img}
                                                        download={`ghost-image-${i + 1}.png`}
                                                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-violet-400 transition-colors shadow-lg"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Baixar
                                                    </a>
                                                    <button className="p-3 bg-violet-600 text-white rounded-xl hover:bg-violet-500 transition-colors shadow-lg">
                                                        <Heart className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!imageLoading && generatedImages.length === 0 && (
                            <div className="text-center py-24 bg-white/5 rounded-3xl border border-gray-800 border-dashed">
                                <Palette className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                                <h3 className="text-xl text-white font-medium mb-2">Sua galeria está vazia</h3>
                                <p className="text-gray-500">Gere sua primeira imagem acima para começar o catálogo da persona</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function SmallInfoCard({ icon: Icon, title, text, color }: { icon: any; title: string, text: string, color: 'cyan' | 'purple' | 'pink' }) {
    const colors = {
        cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
        purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    };

    return (
        <div className={`p-5 rounded-2xl border ${colors[color]} backdrop-blur-sm`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm text-white">{title}</span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">{text}</p>
        </div>
    );
}
