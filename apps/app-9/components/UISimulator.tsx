import React, { useState, useMemo, useEffect } from 'react';
import type { SimulationFile } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface UISimulatorProps {
    files: SimulationFile[] | null;
    isLoading: boolean;
    error: string | null;
    framework: string;
    key: string;
}

const TaskType = {
    IMAGE: 'image',
    TEXT: 'text',
    GENERATOR: 'generator',
    UNKNOWN: 'unknown'
};

const getTaskType = (files: SimulationFile[] | null): string => {
    if (!files || files.length === 0) {
        return TaskType.GENERATOR;
    }
    const firstFile = files[0];
    if (firstFile.filename.endsWith('.txt')) {
        return TaskType.TEXT;
    }
    if (['.png', '.jpg', '.jpeg'].some(ext => firstFile.filename.endsWith(ext))) {
        return TaskType.IMAGE;
    }
    return TaskType.UNKNOWN;
};

const MockImageOutput: React.FC = () => {
    const labels = useMemo(() => ['Gato', 'Cachorro', 'Pássaro', 'Carro', 'Flor'].sort(() => 0.5 - Math.random()).slice(0, 3), []);
    const data = useMemo(() => {
        const randoms = labels.map(() => Math.random());
        const sum = randoms.reduce((a, b) => a + b, 0);
        return randoms.map(r => r / sum); // Normalizar para somar 1
    }, [labels]);
    const maxVal = Math.max(...data);

    return (
        <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Resultados da Previsão</h3>
            {labels.map((label, index) => (
                <div key={label} className="flex items-center space-x-2">
                    <span className="w-16 text-xs text-gray-600 truncate">{label}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div
                            className={`h-4 rounded-full transition-all duration-500 ${data[index] === maxVal ? 'bg-purple-500' : 'bg-purple-300'}`}
                            style={{ width: `${data[index] * 100}%` }}
                        ></div>
                    </div>
                    <span className="w-12 text-xs font-mono text-gray-500 text-right">{ (data[index] * 100).toFixed(1) }%</span>
                </div>
            ))}
        </div>
    );
};

const MockTextOutput: React.FC<{text: string}> = ({ text }) => {
    const sentiment = useMemo(() => Math.random() > 0.5 ? 'Positivo' : 'Negativo', [text]);
    const confidence = useMemo(() => (Math.random() * (0.98 - 0.75) + 0.75), [text]);
    
    return (
        <div className="space-y-2">
             <h3 className="text-sm font-semibold text-gray-700">Resultado da Análise</h3>
             <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-md">
                <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${sentiment === 'Positivo' ? 'bg-green-500' : 'bg-red-500'}`}>{sentiment}</span>
                <span className="text-sm text-gray-600">Confiança: {(confidence * 100).toFixed(0)}%</span>
             </div>
        </div>
    );
};


export const UISimulator: React.FC<UISimulatorProps> = ({ files, isLoading, error, framework }) => {
    const taskType = getTaskType(files);
    const [selectedFile, setSelectedFile] = useState<SimulationFile | null>(null);
    const [isPredicting, setIsPredicting] = useState(false);
    const [output, setOutput] = useState<React.ReactNode | null>(null);

    useEffect(() => {
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        } else {
            setSelectedFile(null);
        }
        setOutput(null);
    }, [files]);
    
    const handlePredict = () => {
        setIsPredicting(true);
        setOutput(null);
        setTimeout(() => {
            switch(taskType) {
                case TaskType.IMAGE:
                    setOutput(<MockImageOutput />);
                    break;
                case TaskType.TEXT:
                    setOutput(<MockTextOutput text={selectedFile?.content ?? ''}/>);
                    break;
                case TaskType.GENERATOR:
                     setOutput(
                        <div className="flex justify-center items-center bg-gray-200 rounded-lg p-2">
                             <img src={`data:image/png;base64,${files?.[0]?.content}`} alt="Generated" className="max-w-full max-h-64 object-contain rounded"/>
                        </div>
                    );
                    break;
            }
            setIsPredicting(false);
        }, 1500); // Simular latência da rede
    };

    const renderInputSelector = () => {
        if (!files || taskType === TaskType.GENERATOR || files.length === 0) return null;

        return (
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Selecione uma Entrada de Amostra</h3>
                <div className="flex flex-wrap gap-2">
                    {files.map(file => (
                        <button key={file.filename} onClick={() => { setSelectedFile(file); setOutput(null); }} className={`p-2 border rounded-md transition-colors ${selectedFile?.filename === file.filename ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-300 bg-white hover:border-purple-400'}`}>
                            {taskType === TaskType.IMAGE ? (
                                <img src={`data:image/png;base64,${file.content}`} alt={file.filename} className="w-16 h-16 object-contain" />
                            ) : (
                                <span className="text-xs text-gray-600 font-mono">{file.filename}</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const renderPreview = () => {
         if (!selectedFile || taskType === TaskType.GENERATOR) return null;
         
         if (taskType === TaskType.IMAGE) {
             return <div className="mb-4 p-2 border border-dashed border-gray-300 rounded-lg flex justify-center items-center bg-gray-50 min-h-[150px]"><img src={`data:image/png;base64,${selectedFile.content}`} alt="Selected input" className="max-w-full max-h-48 object-contain rounded"/></div>
         }
         
         if (taskType === TaskType.TEXT) {
             return <textarea readOnly value={selectedFile.content} className="w-full h-32 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-800 font-mono mb-4"/>
         }

         return null;
    };


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-500">Gerando dados de simulação...</p>
                </div>
            );
        }
        if (error) {
             return <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg"><strong>Erro:</strong> {error}</div>;
        }
        if (!files && taskType !== TaskType.GENERATOR) {
            return <div className="text-center text-gray-500 py-16">Sem dados de entrada para simulação.</div>;
        }

        const buttonText = taskType === TaskType.GENERATOR ? "Gerar" : "Executar Previsão";

        return (
            <div className="flex flex-col h-full">
                <div className="flex-grow">
                    {renderInputSelector()}
                    {renderPreview()}
                </div>
                <div className="flex-shrink-0 space-y-4">
                    <button onClick={handlePredict} disabled={isPredicting || (!selectedFile && taskType !== TaskType.GENERATOR)} className="w-full px-4 py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                        {isPredicting ? 'Processando...' : buttonText}
                    </button>
                    {isPredicting && (
                         <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                           <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                           <span>Simulando execução do modelo...</span>
                         </div>
                    )}
                    {output && <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg animate-fade-in">{output}</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-6 bg-gray-900">
            <div className="bg-white text-gray-900 p-6 rounded-xl shadow-lg max-w-2xl mx-auto min-h-[500px] flex flex-col">
                <header className="mb-4">
                    <h2 className="text-lg font-bold">Simulação de UI ({framework})</h2>
                    <p className="text-sm text-gray-500">Visualize como sua aplicação de IA pode se comportar.</p>
                </header>
                <div className="flex-grow">
                    {renderContent()}
                </div>
                <footer className="mt-6 text-center">
                    <p className="text-xs text-gray-400 italic">*Esta é uma simulação interativa. A aparência e o resultado podem variar na aplicação real.</p>
                </footer>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};