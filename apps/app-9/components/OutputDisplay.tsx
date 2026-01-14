import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Tab, type GeminiResponse, type SimulationFile } from '../types';
import { generateSimulationData } from '../services/geminiService';
import { CodeDisplay } from './CodeDisplay';
import { ExplanationDisplay } from './ExplanationDisplay';
import { InteractiveNetworkVisualizer } from './InteractiveNetworkVisualizer';
import { ProfessionalNetworkVisualizer } from './ProfessionalNetworkVisualizer';
import { UISimulator } from './UISimulator';
import { BrowserRunner } from './JSSimulator';
import { CodeIcon, BrainIcon, ChartBarIcon, AppWindowIcon, DownloadIcon, BeakerIcon, PlayCircleIcon } from './icons/Icons';
import { RefinementForm } from './RefinementForm';
import { LoadingSpinner } from './LoadingSpinner';
import { ExportManager } from './ExportManager';
import { ShareManager } from './ShareManager';

interface OutputDisplayProps {
  response: GeminiResponse;
  prompt: string;
  onRefine: (refinementPrompt: string) => void;
  isRefining: boolean;
}

const TabButton: React.FC<{
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all duration-200 ${
      isActive
        ? 'border-purple-400 text-purple-300'
        : 'border-transparent text-gray-400 hover:text-white hover:bg-gray-800'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ response, prompt, onRefine, isRefining }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Code);
  const [isPackaging, setIsPackaging] = useState<boolean>(false);
  const [packagingError, setPackagingError] = useState<string | null>(null);
  const [simulationFiles, setSimulationFiles] = useState<SimulationFile[] | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [showExportManager, setShowExportManager] = useState<boolean>(false);
  const [showShareManager, setShowShareManager] = useState<boolean>(false);

  useEffect(() => {
    // When a new response comes in, switch to the most relevant tab
    if (response.jsCode) {
      setActiveTab(Tab.JSBrowser);
    } else if (response.uiCode) {
      setActiveTab(Tab.UI);
    } else {
      setActiveTab(Tab.Code);
    }
    
    const fetchSimulationData = async () => {
        if (response.uiCode) {
            setIsSimulating(true);
            setSimulationError(null);
            setSimulationFiles(null);
            try {
                const data = await generateSimulationData(prompt, response.pythonCode, response.uiCode);
                setSimulationFiles(data.simulationFiles);
            } catch (err) {
                console.error("Falha ao gerar dados de simulação:", err);
                const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
                setSimulationError(`Falha ao gerar dados para simulação: ${errorMessage}`);
            } finally {
                setIsSimulating(false);
            }
        }
    };
    
    fetchSimulationData();
  }, [response, prompt]);


  const getRunInstructions = () => {
    if (!response.uiCode) return null;
    const framework = response.uiCode.framework.toLowerCase();
    const installCommand = `pip install tensorflow ${framework === 'gradio' ? 'gradio' : 'streamlit'} numpy Pillow matplotlib`;
    const runCommand = framework === 'gradio' ? 'python app.py' : 'streamlit run app.py';
    const runDescription = framework === 'gradio'
        ? 'Execute a aplicação Gradio.'
        : 'Execute a aplicação Streamlit. O treinamento será iniciado a partir da própria interface:';

    return (
        <div className="p-4 md:p-6 text-gray-300 bg-gray-900/20 text-xs md:text-sm border-b border-gray-700">
            <p className="font-semibold text-white mb-2">Como Executar a Interface ({response.uiCode.framework}):</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
                <li>Salve o código da aba <span className="font-semibold text-purple-300">"Código"</span> como <code className="bg-gray-700 px-1.5 py-0.5 rounded font-mono">train.py</code>.</li>
                <li>Salve o código abaixo da <span className="font-semibold text-purple-300">"Interface"</span> como <code className="bg-gray-700 px-1.5 py-0.5 rounded font-mono">app.py</code>.</li>
                <li>No seu terminal, instale as bibliotecas necessárias: <br/><code className="block bg-gray-900 p-2 rounded mt-1 font-mono text-gray-300 text-xs w-full overflow-x-auto">{installCommand}</code></li>
                <li>{runDescription}<br/><code className="block bg-gray-900 p-2 rounded mt-1 font-mono text-gray-300 text-xs">{runCommand}</code></li>
            </ol>
        </div>
    );
  };

 const handleDownload = async () => {
    if (!response.uiCode && !response.jsCode) return;

    setIsPackaging(true);
    setPackagingError(null);

    try {
      const zip = new JSZip();
      
      // Add Python files if they exist
      if (response.uiCode) {
        const installCommand = `pip install tensorflow ${response.uiCode.framework.toLowerCase() === 'gradio' ? 'gradio' : 'streamlit'} numpy Pillow matplotlib`;
        const requirements = installCommand.replace('pip install ', '').split(' ').join('\n');
        const runInstructionsText = `
## Como Executar o Projeto

1.  **Descompacte** o arquivo \`.zip\` baixado.
2.  **Abra o terminal** na pasta do projeto descompactado.
3.  **Crie um ambiente virtual** (recomendado):
    \`\`\`bash
    python -m venv venv
    source venv/bin/activate  # No Windows, use: venv\\Scripts\\activate
    \`\`\`
4.  **Instale as dependências:**
    \`\`\`bash
    pip install -r requirements.txt
    \`\`\`
5.  **Execute a aplicação:**
    \`\`\`bash
    ${response.uiCode.framework.toLowerCase() === 'gradio' ? 'python app.py' : 'streamlit run app.py'}
    \`\`\`
`;
        const readmeContent = `# Projeto de IA Gerado

Este projeto foi gerado pela IA Criador de Redes Neurais com base no seguinte prompt:
> *${prompt}*

---

## Explicação do Modelo
${response.explanation}

---
${runInstructionsText}
`;
        zip.file("train.py", response.pythonCode);
        zip.file("app.py", response.uiCode.code);
        zip.file("requirements.txt", requirements);
        zip.file("README.md", readmeContent);

        const simData = simulationFiles ? { simulationFiles } : await generateSimulationData(prompt, response.pythonCode, response.uiCode);
        if (simData.simulationFiles && simData.simulationFiles.length > 0) {
            const simFolder = zip.folder("simulation_data");
            if(simFolder) {
               for (const file of simData.simulationFiles) {
                    if (file.encoding === 'base64') {
                        simFolder.file(file.filename, file.content, { base64: true });
                    } else {
                        simFolder.file(file.filename, file.content);
                    }
                }
            }
        }
      } else {
        // Fallback README for JS-only projects
         const readmeContent = `# Projeto de IA Gerado

Este projeto foi gerado pela IA Criador de Redes Neurais com base no seguinte prompt:
> *${prompt}*

---

## Explicação do Modelo
${response.explanation}
`;
        zip.file("README.md", readmeContent);
        zip.file("train.py", response.pythonCode);
      }
      
      // Add JS file if it exists
      if (response.jsCode) {
        zip.file("browser_app.html", response.jsCode);
      }

      zip.file("architecture.json", JSON.stringify(response.architecture, null, 2));
      zip.folder("model");
      zip.folder("assets");
      
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ai_project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Falha ao empacotar o projeto:", err);
      const errorMessage = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.';
      setPackagingError(`Falha ao empacotar o projeto: ${errorMessage}`);
    } finally {
      setIsPackaging(false);
    }
  };


  return (
    <div className="relative">
      {isRefining && (
        <div className="absolute inset-0 z-10 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-purple-300 animate-pulse">Refinando a arquitetura...</p>
        </div>
      )}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden shadow-lg">
        <div className="px-4 border-b border-gray-700 flex justify-between items-center">
          <nav className="flex -mb-px overflow-x-auto">
            {response.jsCode && (
              <TabButton
                label="Executar no Navegador"
                Icon={PlayCircleIcon}
                isActive={activeTab === Tab.JSBrowser}
                onClick={() => setActiveTab(Tab.JSBrowser)}
              />
            )}
            <TabButton
              label="Código"
              Icon={CodeIcon}
              isActive={activeTab === Tab.Code}
              onClick={() => setActiveTab(Tab.Code)}
            />
            <TabButton
              label="Explicação"
              Icon={BrainIcon}
              isActive={activeTab === Tab.Explanation}
              onClick={() => setActiveTab(Tab.Explanation)}
            />
            <TabButton
              label="Visualizar"
              Icon={ChartBarIcon}
              isActive={activeTab === Tab.Visualize}
              onClick={() => setActiveTab(Tab.Visualize)}
            />
            {response.uiCode && (
              <TabButton
                label="Interface"
                Icon={AppWindowIcon}
                isActive={activeTab === Tab.UI}
                onClick={() => setActiveTab(Tab.UI)}
              />
            )}
             {response.uiCode && (
              <TabButton
                label="Simular UI"
                Icon={BeakerIcon}
                isActive={activeTab === Tab.Simulate}
                onClick={() => setActiveTab(Tab.Simulate)}
              />
            )}
          </nav>
          <div className="py-2 pl-4 flex gap-2">
              <button
                  onClick={handleDownload}
                  disabled={isPackaging}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 transition-all duration-200"
              >
                  {isPackaging ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                  ) : (
                      <DownloadIcon className="w-4 h-4" />
                  )}
                  <span>{isPackaging ? 'Empacotando...' : 'Download Rápido'}</span>
              </button>
              <button
                  onClick={() => setShowExportManager(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Exportar Avançado</span>
              </button>
              <button
                  onClick={() => setShowShareManager(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-all duration-200"
              >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>Compartilhar</span>
              </button>
          </div>
        </div>
        {packagingError && <div className="p-4"><p className="text-sm text-red-400 bg-red-900/50 p-3 rounded-lg">{packagingError}</p></div>}
        <div className="min-h-[500px]">
          {activeTab === Tab.Code && (
            <div className="p-1 md:p-2"><CodeDisplay code={response.pythonCode} /></div>
          )}
          {activeTab === Tab.Explanation && (
            <div className="p-1 md:p-2"><ExplanationDisplay markdown={response.explanation} /></div>
          )}
          {activeTab === Tab.Visualize && <InteractiveNetworkVisualizer architecture={response.architecture} />}
          {activeTab === Tab.UI && response.uiCode && (
            <div>
              {getRunInstructions()}
              <div className="p-1 md:p-2">
                  <CodeDisplay code={response.uiCode.code} />
              </div>
            </div>
          )}
          {activeTab === Tab.Simulate && response.uiCode && (
            <UISimulator
                files={simulationFiles}
                isLoading={isSimulating}
                error={simulationError}
                framework={response.uiCode.framework}
                key={response.pythonCode} // Re-monta quando o código muda
            />
          )}
          {activeTab === Tab.JSBrowser && response.jsCode && (
            <BrowserRunner htmlContent={response.jsCode} />
          )}
        </div>
         <RefinementForm onSubmit={onRefine} isLoading={isRefining} />
      </div>
      
      {showExportManager && (
        <ExportManager 
          response={response}
          prompt={prompt}
          onClose={() => setShowExportManager(false)}
        />
      )}
      {showShareManager && (
        <ShareManager 
          response={response}
          prompt={prompt}
          onClose={() => setShowShareManager(false)}
        />
      )}
    </div>
  );
};