/**
 * DAIA Status Indicator
 * Indicador visual do status do servidor DAIA + Brain (Gemini 2.5 Flash)
 * 
 * v2.0: Agora mostra status do Brain com Tool Calling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { daiaService, type DAIAHealthStatus } from '@/services/DAIAService';
import { daiaBrain, type BrainStatus } from '@/services/DAIABrainService';

interface DAIAStatusIndicatorProps {
    className?: string;
    position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
    onStatusChange?: (status: DAIAHealthStatus) => void;
    onOpenTemplates?: () => void;
}

interface FullStatus {
    service: DAIAHealthStatus;
    brain: BrainStatus;
}

const DAIAStatusIndicator: React.FC<DAIAStatusIndicatorProps> = ({
    className = '',
    position = 'bottom-left',
    onStatusChange,
    onOpenTemplates
}) => {
    const [status, setStatus] = useState<DAIAHealthStatus>({ status: 'offline' });
    const [brainStatus, setBrainStatus] = useState<BrainStatus>({ status: 'offline' });
    const [isExpanded, setIsExpanded] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const checkStatus = useCallback(async () => {
        setIsChecking(true);
        try {
            // Verifica serviço e brain em paralelo
            const [health, brain] = await Promise.all([
                daiaService.checkHealth(true),
                daiaBrain.getStatus()
            ]);
            
            setStatus(health);
            setBrainStatus(brain);
            
            if (onStatusChange) {
                onStatusChange(health);
            }
        } catch {
            setStatus({ status: 'error', error: 'Erro ao verificar status' });
            setBrainStatus({ status: 'offline' });
        } finally {
            setIsChecking(false);
        }
    }, [onStatusChange]);

    useEffect(() => {
        // Verifica status apenas uma vez no mount
        checkStatus();
        
        // Polling a cada 5 MINUTOS (era 30 segundos)
        // ⚠️ Aumentado para evitar chamadas excessivas à API do Gemini
        // O usuário pode clicar em "Atualizar" para verificar manualmente
        const interval = setInterval(checkStatus, 300000); // 5 minutos
        return () => clearInterval(interval);
    }, [checkStatus]);

    const getStatusColor = () => {
        // Brain online/ready = verde brilhante, só serviço = verde, offline = cinza
        if (brainStatus.status === 'online' || brainStatus.status === 'ready') return 'bg-emerald-400';
        if (status.status === 'online') return 'bg-green-500';
        if (status.status === 'error') return 'bg-red-500';
        return 'bg-slate-500';
    };

    const getStatusText = () => {
        if (brainStatus.status === 'online' || brainStatus.status === 'ready') return 'DAIA Brain';
        if (status.status === 'online') return 'DAIA Online';
        if (status.status === 'error') return 'DAIA Erro';
        return 'DAIA Offline';
    };

    const getStatusIcon = () => {
        if (brainStatus.status === 'online' || brainStatus.status === 'ready') return 'fa-brain';
        if (status.status === 'online') return 'fa-database';
        return 'fa-circle-xmark';
    };

    const positionClasses = {
        'bottom-left': 'fixed bottom-4 left-4',
        'bottom-right': 'fixed bottom-4 right-4',
        'top-left': 'fixed top-4 left-4',
        'top-right': 'fixed top-4 right-4'
    };

    return (
        <div className={`${positionClasses[position]} z-40 ${className}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                    transition-all duration-200 hover:opacity-80
                    ${status.status === 'online' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : status.status === 'error'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-slate-600/30 text-slate-400 border border-slate-500/30'
                    }
                `}
                title={`${getStatusText()} - Clique para detalhes`}
            >
                <span className={`w-2 h-2 rounded-full ${getStatusColor()} ${status.status === 'online' ? 'animate-pulse' : ''}`} />
                {isChecking ? (
                    <i className="fa-solid fa-spinner fa-spin text-xs" />
                ) : (
                    <i className={`fa-solid ${getStatusIcon()} text-xs`} />
                )}
                <span className="hidden sm:inline">{getStatusText()}</span>
                {status.stats && (
                    <span className="hidden md:inline text-[10px] opacity-70">
                        ({status.stats.total_templates} templates)
                    </span>
                )}
            </button>

            {isExpanded && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            <i className="fa-solid fa-brain text-sky-400" />
                            DAIA
                        </h3>
                        <button
                            onClick={() => setIsExpanded(false)}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            <i className="fa-solid fa-times" />
                        </button>
                    </div>

                    <div className="mb-3 p-2 rounded bg-slate-700/50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Status:</span>
                            <span className={`text-xs font-medium ${
                                status.status === 'online' ? 'text-green-400' :
                                status.status === 'error' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                                {status.status.toUpperCase()}
                            </span>
                        </div>
                        {status.error && (
                            <p className="text-xs text-red-400 mt-1">{status.error}</p>
                        )}
                    </div>

                    {/* Brain Status */}
                    <div className="mb-3 p-2 rounded bg-slate-700/50">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <i className="fa-solid fa-brain text-emerald-400" />
                                Brain (Gemini):
                            </span>
                            <span className={`text-xs font-medium ${
                                brainStatus.status === 'online' ? 'text-emerald-400' : 'text-slate-400'
                            }`}>
                                {brainStatus.status === 'online' ? 'ATIVO' : 'INATIVO'}
                            </span>
                        </div>
                        {(brainStatus.status === 'online' || brainStatus.status === 'ready') && (
                            <>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500">Modelo:</span>
                                    <span className="text-slate-300">{brainStatus.model || 'gemini-2.5-flash'}</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500">Tools:</span>
                                    <span className="text-slate-300">{brainStatus.tools_available || 8} disponíveis</span>
                                </div>
                                {brainStatus.conversation_length !== undefined && brainStatus.conversation_length > 0 && (
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500">Conversa:</span>
                                        <span className="text-slate-300">{brainStatus.conversation_length} mensagens</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {status.stats && (
                        <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Templates:</span>
                                <span className="text-slate-200 font-medium">{status.stats.total_templates}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Score Médio:</span>
                                <span className="text-slate-200 font-medium">{status.stats.avg_score.toFixed(1)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Armazenamento:</span>
                                <span className="text-slate-200 font-medium">{status.stats.storage_size_mb.toFixed(2)} MB</span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={checkStatus}
                            disabled={isChecking}
                            className="flex-1 px-2 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                            <i className={`fa-solid ${isChecking ? 'fa-spinner fa-spin' : 'fa-refresh'}`} />
                            Atualizar
                        </button>
                        {onOpenTemplates && status.status === 'online' && (
                            <button
                                onClick={() => {
                                    setIsExpanded(false);
                                    onOpenTemplates();
                                }}
                                className="flex-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
                            >
                                <i className="fa-solid fa-folder-open" />
                                Templates
                            </button>
                        )}
                    </div>

                    {status.status === 'offline' && (
                        <p className="text-[10px] text-slate-500 mt-2 text-center">
                            Execute <code className="bg-slate-700 px-1 rounded">start-daia.bat</code> na pasta daia-local
                        </p>
                    )}

                    {status.status === 'online' && brainStatus.status === 'offline' && (
                        <p className="text-[10px] text-amber-500 mt-2 text-center">
                            <i className="fa-solid fa-exclamation-triangle mr-1" />
                            Brain offline - verifique GEMINI_API_KEY
                        </p>
                    )}

                    {(brainStatus.status === 'online' || brainStatus.status === 'ready') && (
                        <p className="text-[10px] text-emerald-500 mt-2 text-center">
                            <i className="fa-solid fa-check-circle mr-1" />
                            Brain {brainStatus.status === 'ready' ? 'pronto' : 'ativo'} com Tool Calling
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DAIAStatusIndicator;
