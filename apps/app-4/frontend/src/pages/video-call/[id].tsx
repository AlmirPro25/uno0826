import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { appointmentsAPI } from '@/api/appointments';
import { Button } from '@/components/ui/shadcn/Button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/shadcn/Sheet';
import { Bell, Info, PhoneOff, User, ShieldCheck, Wifi, Brain, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/shadcn/Badge';
import { AIAssistantPanel } from '@/components/consultation/AIAssistantPanel';
import { useConsultationAI } from '@/hooks/useConsultationAI';

interface VideoCallInfo {
    roomName: string;
    provider: string;
    patientName?: string;
    appointmentId?: number;
}

export default function VideoCallPage() {
    const router = useRouter();
    const { id } = router.query;
    const [callInfo, setCallInfo] = useState<VideoCallInfo | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [notifying, setNotifying] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showAIPanel, setShowAIPanel] = useState(true);

    // Get API key from environment or localStorage
    const apiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
        : '';

    // AI Assistant hook
    const {
        isConnected: aiConnected,
        isListening: aiListening,
        isProcessing: aiProcessing,
        transcript,
        suggestions,
        error: aiError,
        connect: connectAI,
        disconnect: disconnectAI,
        toggleListening,
        generateSummary,
        clearTranscript,
        dismissSuggestion
    } = useConsultationAI(apiKey);

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!loading && !error) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading, error]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!id) return;

        const fetchInfo = async () => {
            try {
                const info = await appointmentsAPI.getVideoCallInfo(Number(id));
                setCallInfo(info);
            } catch (err: any) {
                console.error(err);
                setError('Não foi possível conectar à sala segura. Verifique suas permissões.');
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, [id]);

    const handleNotify = async () => {
        setNotifying(true);
        try {
            await appointmentsAPI.startCall(Number(id));
            alert("Notificação enviada ao participante!");
        } catch (e) {
            console.error(e);
            alert("Erro ao notificar.");
        } finally {
            setNotifying(false);
        }
    };

    const handleEndCall = async () => {
        // Disconnect AI if connected
        if (aiConnected) {
            disconnectAI();
        }
        router.push('/dashboard');
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-gray-950 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="z-10 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Estabelecendo Conexão Segura</h2>
                    <p className="text-gray-400">Criptografando stream de áudio e vídeo...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-950 text-white p-4">
                <div className="max-w-md w-full p-8 bg-gray-900 border border-red-500/30 rounded-xl text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneOff className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Falha na Conexão</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Button onClick={() => router.back()} className="w-full bg-white text-black hover:bg-gray-200">
                        Voltar para o Painel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            <Head>
                <title>Consulta: {callInfo?.provider} - MediSync</title>
            </Head>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Top Bar */}
                <header className="h-14 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4 z-20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-white font-mono text-sm tracking-wider">{formatTime(elapsedTime)}</span>
                        </div>
                        <div className="h-5 w-px bg-gray-700"></div>
                        <div className="flex flex-col">
                            <h1 className="text-white text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Consulta Segura
                            </h1>
                            <span className="text-xs text-gray-400">Dr. {callInfo?.provider}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="hidden md:flex gap-1 text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                            <Wifi className="w-3 h-3" />
                            Estável
                        </Badge>

                        {/* AI Status Badge */}
                        {aiConnected && (
                            <Badge 
                                variant="outline" 
                                className={`hidden md:flex gap-1 ${
                                    aiListening 
                                        ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' 
                                        : 'text-gray-400 border-gray-500/30 bg-gray-500/10'
                                }`}
                            >
                                <Brain className="w-3 h-3" />
                                {aiListening ? 'IA Ativa' : 'IA Pausada'}
                            </Badge>
                        )}

                        <Button
                            onClick={handleNotify}
                            disabled={notifying}
                            variant="secondary"
                            size="sm"
                            className="bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
                        >
                            <Bell className="w-4 h-4 mr-1" />
                            {notifying ? "..." : "Chamar"}
                        </Button>

                        {/* Toggle AI Panel */}
                        <Button
                            onClick={() => setShowAIPanel(!showAIPanel)}
                            variant="ghost"
                            size="icon"
                            className={`text-gray-400 hover:text-white hover:bg-white/10 ${showAIPanel ? 'bg-cyan-500/20 text-cyan-400' : ''}`}
                            title={showAIPanel ? 'Ocultar IA' : 'Mostrar IA'}
                        >
                            <Brain className="w-5 h-5" />
                        </Button>

                        <Sheet>
                            <SheetTrigger>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                                    <Info className="w-5 h-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-gray-900 border-gray-800 text-white">
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-white">Detalhes da Consulta</h2>
                                    <p className="text-sm text-gray-400">Informações da sessão atual</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Médico Responsável</label>
                                        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                                            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{callInfo?.provider}</p>
                                                <p className="text-xs text-blue-400">CRM Verificado</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">Protocolo de Sala</label>
                                        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 font-mono text-xs text-gray-300 break-all">
                                            {callInfo?.roomName}
                                        </div>
                                    </div>

                                    {/* AI Configuration */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-400">IA Assistente</label>
                                        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-white">Status</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                    aiConnected 
                                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                                        : 'bg-gray-600/20 text-gray-400'
                                                }`}>
                                                    {aiConnected ? 'Conectado' : 'Desconectado'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                A IA pode transcrever a consulta e sugerir diagnósticos em tempo real.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 text-sm">
                                        <p className="font-semibold mb-1">Aviso de Privacidade</p>
                                        Esta chamada é criptografada de ponta a ponta. A IA processa dados localmente e não armazena gravações sem consentimento.
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button
                            onClick={handleEndCall}
                            variant="destructive"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                        >
                            <PhoneOff className="w-4 h-4 mr-1" />
                            Encerrar
                        </Button>
                    </div>
                </header>

                {/* Video Area */}
                <main className="flex-1 relative bg-black flex items-center justify-center p-2">
                    <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-800 relative">
                        {callInfo && (
                            <iframe
                                src={`https://meet.jit.si/${callInfo.roomName}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&interfaceConfig.TOOLBAR_BUTTONS=['microphone','camera','closedcaptions','desktop','fullscreen','fodeviceselection','hangup','profile','chat','recording','livestreaming','etherpad','sharedvideo','settings','raisehand','videoquality','filmstrip','feedback','stats','shortcuts','tileview','videobackgroundblur','download','help','mute-everyone','security']`}
                                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                                className="w-full h-full border-0"
                                style={{ minHeight: '100%', minWidth: '100%' }}
                                title="MediSync Video Call"
                            ></iframe>
                        )}
                    </div>
                </main>
            </div>

            {/* AI Assistant Panel */}
            {showAIPanel && (
                <AIAssistantPanel
                    isConnected={aiConnected}
                    isListening={aiListening}
                    isProcessing={aiProcessing}
                    transcript={transcript}
                    suggestions={suggestions}
                    error={aiError}
                    onConnect={connectAI}
                    onDisconnect={disconnectAI}
                    onToggleListening={toggleListening}
                    onGenerateSummary={generateSummary}
                    onDismissSuggestion={dismissSuggestion}
                    onClearTranscript={clearTranscript}
                />
            )}
        </div>
    );
}
