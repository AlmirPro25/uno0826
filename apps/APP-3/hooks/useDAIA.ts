/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    useDAIA - Hook de Integração DAIA                          ║
 * ║                                                                               ║
 * ║              Hook React para integrar DAIA no fluxo de geração               ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useCallback, useEffect } from 'react';
import {
    sendToDAIA,
    enrichWithDAIA,
    isDAIAAvailable,
    isDAIABrainAvailable,
    getDAIAFullStatus,
    askDAIABrain,
    generateWithDAIABrain,
    type DAIAEnrichmentResult,
    type DAIABrainResult
} from '@/services/DAIAIntegration';
import { daiaBrain } from '@/services/DAIABrainService';

export interface DAIAStatus {
    serviceOnline: boolean;
    brainOnline: boolean;
    templatesCount: number;
    conversationLength: number;
}

export interface UseDAIAReturn {
    // Status
    status: DAIAStatus;
    isLoading: boolean;
    
    // Actions
    checkStatus: () => Promise<void>;
    saveApprovedCode: (code: string, prompt: string, modelUsed: string, score?: number) => Promise<boolean>;
    enrichPrompt: (prompt: string) => Promise<DAIAEnrichmentResult>;
    askBrain: (message: string, context?: { currentCode?: string; projectType?: string }) => Promise<DAIABrainResult>;
    generateWithBrain: (prompt: string) => Promise<{ code: string; usedBrain: boolean }>;
    resetBrainConversation: () => Promise<void>;
    
    // Modal state
    isTemplatesModalOpen: boolean;
    openTemplatesModal: () => void;
    closeTemplatesModal: () => void;
}

export function useDAIA(): UseDAIAReturn {
    const [status, setStatus] = useState<DAIAStatus>({
        serviceOnline: false,
        brainOnline: false,
        templatesCount: 0,
        conversationLength: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

    // Check status on mount and periodically
    const checkStatus = useCallback(async () => {
        try {
            const fullStatus = await getDAIAFullStatus();
            setStatus({
                serviceOnline: fullStatus.service.available,
                brainOnline: fullStatus.brain.available,
                templatesCount: fullStatus.service.templates,
                conversationLength: fullStatus.brain.conversationLength || 0
            });
        } catch (error) {
            console.error('[useDAIA] Erro ao verificar status:', error);
            setStatus({
                serviceOnline: false,
                brainOnline: false,
                templatesCount: 0,
                conversationLength: 0
            });
        }
    }, []);

    useEffect(() => {
        // Verifica status apenas uma vez no mount
        // NÃO faz polling automático para evitar chamadas desnecessárias à API
        checkStatus();
        
        // Polling desabilitado - verificação manual quando necessário
        // Se precisar de status atualizado, chame checkStatus() manualmente
        // const interval = setInterval(checkStatus, 60000);
        // return () => clearInterval(interval);
    }, []); // Removido checkStatus das dependências para evitar re-runs

    // Save approved code to DAIA
    const saveApprovedCode = useCallback(async (
        code: string,
        prompt: string,
        modelUsed: string,
        score: number = 85
    ): Promise<boolean> => {
        if (!status.serviceOnline) {
            console.log('[useDAIA] Serviço offline, não salvando');
            return false;
        }

        setIsLoading(true);
        try {
            const success = await sendToDAIA({
                code,
                prompt,
                modelUsed,
                userRating: 'liked',
                isGoodForTraining: true,
                score
            });

            if (success) {
                console.log('[useDAIA] ✅ Código salvo no DAIA');
                // Update templates count
                await checkStatus();
            }

            return success;
        } catch (error) {
            console.error('[useDAIA] Erro ao salvar código:', error);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [status.serviceOnline, checkStatus]);

    // Enrich prompt with similar templates
    const enrichPrompt = useCallback(async (prompt: string): Promise<DAIAEnrichmentResult> => {
        if (!status.serviceOnline) {
            return {
                originalPrompt: prompt,
                enrichedPrompt: prompt,
                usedTemplates: [],
                wasEnriched: false
            };
        }

        setIsLoading(true);
        try {
            return await enrichWithDAIA(prompt);
        } catch (error) {
            console.error('[useDAIA] Erro ao enriquecer prompt:', error);
            return {
                originalPrompt: prompt,
                enrichedPrompt: prompt,
                usedTemplates: [],
                wasEnriched: false
            };
        } finally {
            setIsLoading(false);
        }
    }, [status.serviceOnline]);

    // Ask the brain to think
    const askBrain = useCallback(async (
        message: string,
        context?: { currentCode?: string; projectType?: string }
    ): Promise<DAIABrainResult> => {
        if (!status.brainOnline) {
            return { response: '', toolsUsed: [], usedBrain: false };
        }

        setIsLoading(true);
        try {
            const result = await askDAIABrain(message, context);
            // Update conversation length
            await checkStatus();
            return result;
        } catch (error) {
            console.error('[useDAIA] Erro ao consultar brain:', error);
            return { response: '', toolsUsed: [], usedBrain: false };
        } finally {
            setIsLoading(false);
        }
    }, [status.brainOnline, checkStatus]);

    // Generate code with brain
    const generateWithBrain = useCallback(async (prompt: string): Promise<{ code: string; usedBrain: boolean }> => {
        if (!status.brainOnline) {
            return { code: '', usedBrain: false };
        }

        setIsLoading(true);
        try {
            const result = await generateWithDAIABrain(prompt);
            return { code: result.code, usedBrain: result.usedBrain };
        } catch (error) {
            console.error('[useDAIA] Erro ao gerar com brain:', error);
            return { code: '', usedBrain: false };
        } finally {
            setIsLoading(false);
        }
    }, [status.brainOnline]);

    // Reset brain conversation
    const resetBrainConversation = useCallback(async () => {
        if (!status.brainOnline) return;

        try {
            await daiaBrain.resetConversation();
            await checkStatus();
        } catch (error) {
            console.error('[useDAIA] Erro ao resetar conversa:', error);
        }
    }, [status.brainOnline, checkStatus]);

    // Modal controls
    const openTemplatesModal = useCallback(() => setIsTemplatesModalOpen(true), []);
    const closeTemplatesModal = useCallback(() => setIsTemplatesModalOpen(false), []);

    return {
        status,
        isLoading,
        checkStatus,
        saveApprovedCode,
        enrichPrompt,
        askBrain,
        generateWithBrain,
        resetBrainConversation,
        isTemplatesModalOpen,
        openTemplatesModal,
        closeTemplatesModal
    };
}

export default useDAIA;
