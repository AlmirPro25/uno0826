import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import ContextualAiPanel from '@/components/ContextualAiPanel';
import EvolutionTracker from '@/components/EvolutionTracker';
import AiResearchPanel from '@/components/AiResearchPanel';
import GroundingSourcesDisplay from '@/components/GroundingSourcesDisplay';
import PreviewConsole from '@/components/PreviewConsole';
import { FloatingStatusIndicator } from '@/components/FloatingStatusIndicator';
import { AISpecialistSelector } from '@/components/AISpecialistSelector';

/**
 * PanelOrchestrator - Centraliza o gerenciamento de todos os painéis flutuantes
 * Reduz a complexidade do App.tsx e melhora a organização
 */
export const PanelOrchestrator: React.FC = () => {
  const {
    // Panel states
    isContextualAiPanelOpen,
    isEvolutionTrackerOpen,
    isResearchPanelOpen,
    isConsoleOpen,
    isAiSpecialistPanelVisible,

    // Panel data
    contextualAiTargetElementInfo,
    contextualAiCommand,
    isLoadingContextualAi,
    contextualAiPanelPosition,
    contextualQuickActions,
    contextualAiAnalysisResults,
    isLoadingContextualAiAnalysis,
    evolutionTrackerProgress,
    researchFindings,
    projectPlanSources,
    consoleMessages,
    consoleErrorCount,
    activeAiSpecialist,

    // Panel actions
    closeContextualAiPanel,
    setContextualAiCommand,
    handleContextualQuickAction,
    handleContextualAiSubmit,
    handleAnalyzeElementWithAi,
    toggleEvolutionTracker,
    toggleConsole,
    setConsoleMessages,
    toggleAiSpecialistPanel,
    setActiveAiSpecialist,

    // Other needed data
    htmlCode,
    editorRef,
    currentAppPhase,
    aiStatusMessage
  } = useAppStore();

  const handleSubmitContextual = async () => {
    const newCode = await handleContextualAiSubmit(editorRef?.current?.getValue() || htmlCode);
    if (newCode && editorRef?.current) {
      editorRef.current.setValue(newCode);
    }
  };

  return (
    <>
      {/* Contextual AI Panel */}
      {isContextualAiPanelOpen && (
        <ContextualAiPanel
          isOpen={isContextualAiPanelOpen}
          onClose={closeContextualAiPanel}
          targetElementInfo={contextualAiTargetElementInfo}
          command={contextualAiCommand}
          onCommandChange={setContextualAiCommand}
          isLoading={isLoadingContextualAi}
          position={contextualAiPanelPosition}
          quickActions={contextualQuickActions}
          onQuickAction={handleContextualQuickAction}
          onSubmit={handleSubmitContextual}
          analysisResults={contextualAiAnalysisResults}
          isLoadingAnalysis={isLoadingContextualAiAnalysis}
          onAnalyzeElement={handleAnalyzeElementWithAi}
        />
      )}

      {/* Evolution Tracker Panel */}
      {isEvolutionTrackerOpen && (
        <EvolutionTracker
          isOpen={isEvolutionTrackerOpen}
          onClose={toggleEvolutionTracker}
          progress={evolutionTrackerProgress}
        />
      )}

      {/* Research Panel */}
      {isResearchPanelOpen && (
        <AiResearchPanel
          isOpen={isResearchPanelOpen}
          findings={researchFindings}
          onClose={() => useAppStore.setState({ isResearchPanelOpen: false })}
        />
      )}

      {/* Grounding Sources Display */}
      {projectPlanSources && projectPlanSources.length > 0 && (
        <GroundingSourcesDisplay
          sources={projectPlanSources}
          onClose={() => useAppStore.setState({ projectPlanSources: [] })}
        />
      )}

      {/* Preview Console */}
      {isConsoleOpen && (
        <PreviewConsole
          isOpen={isConsoleOpen}
          onClose={toggleConsole}
          messages={consoleMessages}
          onClearMessages={() => setConsoleMessages([])}
          errorCount={consoleErrorCount}
        />
      )}

      {/* Floating Status Indicator */}
      <FloatingStatusIndicator
        currentPhase={currentAppPhase}
        statusMessage={aiStatusMessage}
      />

      {/* AI Specialist Panel */}
      {isAiSpecialistPanelVisible && (
        <AISpecialistSelector
          isVisible={isAiSpecialistPanelVisible}
          onClose={toggleAiSpecialistPanel}
          activeSpecialist={activeAiSpecialist}
          onSpecialistChange={setActiveAiSpecialist}
        />
      )}
    </>
  );
};
