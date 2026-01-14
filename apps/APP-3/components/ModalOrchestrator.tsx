import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import ModelPlaygroundModal from '@/components/ModelPlaygroundModal';
import BrainstormingModal from '@/components/BrainstormingModal';
import ThemeCustomizerModal from '@/components/ThemeCustomizerModal';
import ProjectTaskManager from '@/components/ProjectTaskManager';
import SiteCriticModal from '@/components/SiteCriticModal';
import ProjectSnapshotsModal from '@/components/ProjectSnapshotsModal';
import AiCodeInsightModal from '@/components/AiCodeInsightModal';
import AiErrorFallbackModal from '@/components/AiErrorFallbackModal';
import TestSuggestionModal from '@/components/TestSuggestionModal';
import AiCodeDoctorModal from '@/components/AiCodeDoctorModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { TechStackSelector } from '@/components/TechStackSelector';
import { ColorPaletteSelector } from '@/components/ColorPaletteSelector';
import { PersonaSelector } from '@/components/PersonaSelector';

/**
 * ModalOrchestrator - Centraliza o gerenciamento de todos os modais
 * Reduz drasticamente a complexidade do App.tsx
 */
export const ModalOrchestrator: React.FC = () => {
  const {
    // Modal states
    isModelPlaygroundOpen,
    isBrainstormingModalOpen,
    isThemeModalOpen,
    isTaskManagerOpen,
    isSiteCriticModalOpen,
    isSnapshotsModalOpen,
    isAiCodeInsightModalOpen,
    isAiErrorFallbackModalOpen,
    isTestSuggestionModalOpen,
    isAiCodeDoctorModalOpen,
    isApiKeyModalOpen,
    isTechStackModalOpen,
    isColorPaletteSelectorOpen,
    isPersonaSelectorOpen,

    // Modal data
    playgroundPrompt,
    baseModelPlaygroundOutput,
    finetunedModelPlaygroundOutput,
    isPlaygroundGenerating,
    brainstormingTopic,
    brainstormingMode,
    brainstormingResults,
    isBrainstormingLoading,
    currentThemeDescription,
    currentThemeColors,
    isSuggestingColors,
    isApplyingTheme,
    siteCritiqueResults,
    isLoadingSiteCritique,
    selectedCodeForInsight,
    aiInsightResult,
    isLoadingAiInsight,
    currentInsightType,
    selectedCodeLanguageHint,
    lastFailedOperationDetails,
    testSuggestions,
    isLoadingTestSuggestions,
    aiCodeDoctorAnalysisResult,
    isLoadingAiCodeDoctor,
    aiCodeDoctorProblemRef,
    selectedColorPalette,
    availablePersonas,
    selectedPersona,
    recommendedPersona,
    isGeneratingWithPersona,

    // Modal actions
    closeModelPlaygroundModal,
    closeBrainstormingModal,
    closeThemeModal,
    closeTaskManager,
    closeSiteCriticModal,
    closeSnapshotsModal,
    closeAiCodeInsightModal,
    closeAiErrorFallbackModal,
    closeTestSuggestionModal,
    closeAiCodeDoctorModal,
    closeApiKeyModal,
    closeTechStackModal,
    closeColorPaletteSelector,
    togglePersonaSelector,

    // Other actions needed by modals
    setBrainstormingTopic,
    setBrainstormingMode,
    handleGenerateBrainstormIdeas,
    setCurrentThemeDescription,
    setCurrentThemeColors,
    handleSuggestThemeColors,
    handleApplyThemeColors,
    handleAddTask,
    handleToggleTask,
    handleRemoveTask,
    handleSaveSnapshot,
    handleLoadSnapshot,
    handleDeleteSnapshot,
    handleRenameSnapshot,
    handleRequestCodeExplanation,
    handleRequestRefactoringSuggestion,
    setAiCodeDoctorProblem,
    handleAiCodeDoctorSubmit,
    selectTechStack,
    selectColorPalette,
    continueWithSelectedPalette,
    selectPersona,
    generateWithSelectedPersona,
    clearPersonaRecommendation,

    // Data needed by modals
    tasks,
    projectSnapshots,
    htmlCode,
    editorRef
  } = useAppStore();

  return (
    <>
      {/* Model Playground Modal */}
      {isModelPlaygroundOpen && (
        <ModelPlaygroundModal
          isOpen={isModelPlaygroundOpen}
          onClose={closeModelPlaygroundModal}
          prompt={playgroundPrompt}
          baseModelOutput={baseModelPlaygroundOutput}
          finetunedModelOutput={finetunedModelPlaygroundOutput}
          isGenerating={isPlaygroundGenerating}
        />
      )}

      {/* Brainstorming Modal */}
      {isBrainstormingModalOpen && (
        <BrainstormingModal
          isOpen={isBrainstormingModalOpen}
          onClose={closeBrainstormingModal}
          topic={brainstormingTopic}
          onTopicChange={setBrainstormingTopic}
          mode={brainstormingMode}
          onModeChange={setBrainstormingMode}
          results={brainstormingResults}
          isLoading={isBrainstormingLoading}
          onGenerate={handleGenerateBrainstormIdeas}
        />
      )}

      {/* Theme Customizer Modal */}
      {isThemeModalOpen && (
        <ThemeCustomizerModal
          isOpen={isThemeModalOpen}
          onClose={closeThemeModal}
          currentDescription={currentThemeDescription}
          onDescriptionChange={setCurrentThemeDescription}
          currentColors={currentThemeColors}
          onColorsChange={setCurrentThemeColors}
          onSuggestColors={handleSuggestThemeColors}
          onApplyTheme={handleApplyThemeColors}
          isSuggestingColors={isSuggestingColors}
          isApplyingTheme={isApplyingTheme}
        />
      )}

      {/* Task Manager Modal */}
      {isTaskManagerOpen && (
        <ProjectTaskManager
          isOpen={isTaskManagerOpen}
          onClose={closeTaskManager}
          tasks={tasks}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onRemoveTask={handleRemoveTask}
        />
      )}

      {/* Site Critic Modal */}
      {isSiteCriticModalOpen && (
        <SiteCriticModal
          isOpen={isSiteCriticModalOpen}
          onClose={closeSiteCriticModal}
          results={siteCritiqueResults}
          isLoading={isLoadingSiteCritique}
        />
      )}

      {/* Project Snapshots Modal */}
      {isSnapshotsModalOpen && (
        <ProjectSnapshotsModal
          isOpen={isSnapshotsModalOpen}
          onClose={closeSnapshotsModal}
          snapshots={projectSnapshots}
          onSave={handleSaveSnapshot}
          onLoad={handleLoadSnapshot}
          onDelete={handleDeleteSnapshot}
          onRename={handleRenameSnapshot}
        />
      )}

      {/* AI Code Insight Modal */}
      {isAiCodeInsightModalOpen && (
        <AiCodeInsightModal
          isOpen={isAiCodeInsightModalOpen}
          onClose={closeAiCodeInsightModal}
          selectedCode={selectedCodeForInsight}
          result={aiInsightResult}
          isLoading={isLoadingAiInsight}
          insightType={currentInsightType}
          languageHint={selectedCodeLanguageHint}
          onRequestExplanation={handleRequestCodeExplanation}
          onRequestRefactoring={handleRequestRefactoringSuggestion}
        />
      )}

      {/* AI Error Fallback Modal */}
      {isAiErrorFallbackModalOpen && (
        <AiErrorFallbackModal
          isOpen={isAiErrorFallbackModalOpen}
          onClose={closeAiErrorFallbackModal}
          failedOperationDetails={lastFailedOperationDetails}
        />
      )}

      {/* Test Suggestion Modal */}
      {isTestSuggestionModalOpen && (
        <TestSuggestionModal
          isOpen={isTestSuggestionModalOpen}
          onClose={closeTestSuggestionModal}
          suggestions={testSuggestions}
          isLoading={isLoadingTestSuggestions}
        />
      )}

      {/* AI Code Doctor Modal */}
      {isAiCodeDoctorModalOpen && (
        <AiCodeDoctorModal
          isOpen={isAiCodeDoctorModalOpen}
          onClose={closeAiCodeDoctorModal}
          analysisResult={aiCodeDoctorAnalysisResult}
          isLoading={isLoadingAiCodeDoctor}
          problemRef={aiCodeDoctorProblemRef}
          onProblemChange={setAiCodeDoctorProblem}
          onSubmit={handleAiCodeDoctorSubmit}
        />
      )}

      {/* API Key Modal */}
      {isApiKeyModalOpen && (
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={closeApiKeyModal}
        />
      )}

      {/* Tech Stack Selector Modal */}
      {isTechStackModalOpen && (
        <TechStackSelector
          isOpen={isTechStackModalOpen}
          onClose={closeTechStackModal}
          onSelect={selectTechStack}
        />
      )}

      {/* Color Palette Selector Modal */}
      {isColorPaletteSelectorOpen && (
        <ColorPaletteSelector
          isOpen={isColorPaletteSelectorOpen}
          onClose={closeColorPaletteSelector}
          selectedPalette={selectedColorPalette}
          onSelect={selectColorPalette}
          onContinue={continueWithSelectedPalette}
        />
      )}

      {/* Persona Selector Modal */}
      {isPersonaSelectorOpen && (
        <PersonaSelector
          isOpen={isPersonaSelectorOpen}
          onClose={togglePersonaSelector}
          personas={availablePersonas}
          selectedPersona={selectedPersona}
          recommendedPersona={recommendedPersona}
          isGenerating={isGeneratingWithPersona}
          onSelectPersona={selectPersona}
          onGenerate={generateWithSelectedPersona}
          onClearRecommendation={clearPersonaRecommendation}
        />
      )}
    </>
  );
};
