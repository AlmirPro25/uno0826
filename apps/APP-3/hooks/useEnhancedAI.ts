// hooks/useEnhancedAI.ts
// Hook personalizado para usar IA com geração automática de imagens

import { useState, useCallback } from 'react';
import { generateAiResponseWithImages, EnhancedAiResponse } from '../services/EnhancedGeminiService';
import { AiServicePhase } from '../services/GeminiService';
import type { Part } from "@google/genai";
import type { ResearchFinding } from '../services/GeminiService';

interface UseEnhancedAIOptions {
  generateImages?: boolean;
  projectId?: string;
  onProgress?: (message: string) => void;
}

interface UseEnhancedAIState {
  isGenerating: boolean;
  progress: string;
  error: string | null;
  lastResponse: EnhancedAiResponse | null;
}

export function useEnhancedAI(options: UseEnhancedAIOptions = {}) {
  const [state, setState] = useState<UseEnhancedAIState>({
    isGenerating: false,
    progress: '',
    error: null,
    lastResponse: null
  });

  const updateProgress = useCallback((message: string) => {
    setState(prev => ({ ...prev, progress: message }));
    options.onProgress?.(message);
  }, [options.onProgress]);

  const generateWithImages = useCallback(async (
    userPrompt: string,
    phase: AiServicePhase,
    modelName: string = 'gemini-2.5-flash',
    currentPlan?: string | null,
    currentCode?: string | null,
    initialPlanPrompt?: string | null,
    researchFindings?: ResearchFinding[],
    attachments?: Part[]
  ): Promise<EnhancedAiResponse | null> => {
    
    setState(prev => ({
      ...prev,
      isGenerating: true,
      error: null,
      progress: 'Iniciando geração...'
    }));

    try {
      const response = await generateAiResponseWithImages(
        userPrompt,
        phase,
        modelName,
        currentPlan,
        currentCode,
        initialPlanPrompt,
        researchFindings,
        attachments,
        {
          generateImages: options.generateImages ?? true,
          projectId: options.projectId,
          showProgress: updateProgress
        }
      );

      setState(prev => ({
        ...prev,
        isGenerating: false,
        progress: 'Concluído!',
        lastResponse: response
      }));

      return response;

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: error.message,
        progress: ''
      }));

      return null;
    }
  }, [options.generateImages, options.projectId, updateProgress]);

  const generateCode = useCallback(async (
    prompt: string,
    currentCode?: string
  ) => {
    return generateWithImages(
      prompt,
      currentCode ? 'refine_code_no_plan' : 'generate_code_no_plan',
      'gemini-2.5-flash',
      null,
      currentCode
    );
  }, [generateWithImages]);

  const generatePlan = useCallback(async (
    prompt: string,
    researchFindings?: ResearchFinding[]
  ) => {
    return generateWithImages(
      prompt,
      'create_plan',
      'gemini-2.5-flash',
      null,
      null,
      null,
      researchFindings
    );
  }, [generateWithImages]);

  const generateFromPlan = useCallback(async (
    prompt: string,
    plan: string,
    currentCode?: string
  ) => {
    return generateWithImages(
      prompt,
      currentCode ? 'refine_code_with_plan' : 'generate_code_from_plan',
      'gemini-2.5-flash',
      plan,
      currentCode
    );
  }, [generateWithImages]);

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: '',
      error: null,
      lastResponse: null
    });
  }, []);

  return {
    // Estado
    isGenerating: state.isGenerating,
    progress: state.progress,
    error: state.error,
    lastResponse: state.lastResponse,
    
    // Funções principais
    generateWithImages,
    generateCode,
    generatePlan,
    generateFromPlan,
    
    // Utilitários
    reset,
    
    // Informações da última resposta
    imagesGenerated: state.lastResponse?.imagesGenerated ?? 0,
    imageUrls: state.lastResponse?.imageUrls ?? [],
    processingTime: state.lastResponse?.processingTime ?? 0
  };
}