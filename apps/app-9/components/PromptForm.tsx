import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SampleDataset } from '../types';
import { MicrophoneIcon } from './icons/Icons';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
// These types are not included in standard TypeScript DOM typings.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}


interface PromptFormProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  generateUi: boolean;
  setGenerateUi: (generate: boolean) => void;
  generateJs: boolean;
  setGenerateJs: (generate: boolean) => void;
  selectedDataset: SampleDataset;
  setSelectedDataset: (dataset: SampleDataset) => void;
  onVisualize: () => void;
  learningRate: string;
  setLearningRate: (value: string) => void;
  epochs: string;
  setEpochs: (value: string) => void;
  batchSize: string;
  setBatchSize: (value: string) => void;
  model: string;
  setModel: (model: string) => void;
}

interface HyperparameterErrors {
  learningRate?: string;
  epochs?: string;
  batchSize?: string;
}

const HyperparameterInput: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled: boolean;
  placeholder: string;
}> = ({ label, id, value, onChange, error, disabled, placeholder }) => (
  <div className="flex-1">
    <label htmlFor={id} className="block text-xs font-medium text-gray-400 mb-1">
      {label}
    </label>
    <input
      type="text"
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full p-2 text-sm bg-gray-900 border ${
        error ? 'border-red-500' : 'border-gray-600'
      } rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-200`}
    />
    {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
  </div>
);

export const PromptForm: React.FC<PromptFormProps> = ({
  prompt, setPrompt, onSubmit, isLoading, generateUi, setGenerateUi,
  generateJs, setGenerateJs, selectedDataset, setSelectedDataset, onVisualize,
  learningRate, setLearningRate, epochs, setEpochs, batchSize, setBatchSize,
  model, setModel
}) => {
  const [errors, setErrors] = useState<HyperparameterErrors>({});
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("A API de Reconhecimento de Fala não é suportada neste navegador.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognitionRef.current = recognition;

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event) => {
      console.error('Erro no reconhecimento de fala', event.error);
      setIsListening(false);
    };
  }, []);

  const handleToggleListen = () => {
    const recognition = recognitionRef.current;
    if (!recognition || isLoading) return;

    if (isListening) {
      recognition.stop();
    } else {
      let finalTranscript = prompt ? prompt + ' ' : '';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setPrompt(finalTranscript + interimTranscript);
      };

      recognition.start();
      setIsListening(true);
    }
  };
  
  const validate = useMemo(() => {
    return () => {
      const newErrors: HyperparameterErrors = {};
      
      const lr = parseFloat(learningRate);
      if (isNaN(lr) || lr <= 0) {
        newErrors.learningRate = 'Deve ser um nº positivo.';
      }

      const ep = parseInt(epochs, 10);
      if (isNaN(ep) || !Number.isInteger(ep) || ep <= 0) {
        newErrors.epochs = 'Deve ser um inteiro > 0.';
      }
      
      const bs = parseInt(batchSize, 10);
      if (isNaN(bs) || !Number.isInteger(bs) || bs <= 0) {
        newErrors.batchSize = 'Deve ser um inteiro > 0.';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  }, [learningRate, epochs, batchSize]);
  
  useEffect(() => {
    validate();
  }, [validate]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = () => {
    if (!isLoading && validate()) {
      onSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="ex: 'Criar um agente PPO para um NPC em um jogo...'"
          className="w-full h-32 p-3 pr-12 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none text-gray-200 placeholder-gray-500"
          disabled={isLoading}
        />
        <button
            onClick={handleToggleListen}
            disabled={isLoading}
            title={isListening ? "Parar gravação" : "Digitar por voz"}
            aria-label={isListening ? "Parar gravação" : "Digitar por voz"}
            className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 ${
                isListening 
                ? 'bg-red-600 text-white animate-pulse' 
                : 'bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white'
            }`}
        >
            <MicrophoneIcon className="w-5 h-5" />
        </button>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-300 -mb-1">Opções de Treinamento</p>
        <div className="p-3 bg-gray-900/50 border border-gray-700 rounded-lg space-y-4">
          <div>
            <label htmlFor="model-select" className="block text-xs font-medium text-gray-400 mb-1">
                Modelo
            </label>
            <select 
                id="model-select" 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isLoading}
                className="flex-grow w-full p-2 text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-200"
            >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Qualidade Superior)</option>
            </select>
          </div>
          <div>
            <label htmlFor="dataset-select" className="block text-xs font-medium text-gray-400 mb-1">
                Conjunto de Dados de Amostra (Opcional)
            </label>
            <div className="flex space-x-2">
                <select 
                    id="dataset-select" 
                    value={selectedDataset}
                    onChange={(e) => setSelectedDataset(e.target.value as SampleDataset)}
                    disabled={isLoading}
                    className="flex-grow w-full p-2 text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-200"
                >
                    <option value="none">Nenhum</option>
                    <option value="mnist">Dígitos MNIST</option>
                    <option value="cifar10">Imagens CIFAR-10</option>
                    <option value="imdb">Críticas de Filmes IMDB</option>
                    <option value="robot_arm">Braço Robótico 6-DOF</option>
                    <option value="humanoid">Robô Humanoide 18-DOF</option>
                    <option value="mobile_robot">Robô Móvel com SLAM</option>
                    <option value="drone">Drone Autônomo</option>
                    <option value="manipulation">Manipulação de Objetos</option>
                    <option value="c4">C4 (Colossal Clean Crawled Corpus)</option>
                    <option value="openwebtext">OpenWebText (GPT-2 Dataset)</option>
                    <option value="pile">The Pile (800GB Text Dataset)</option>
                    <option value="common_crawl">Common Crawl (Web Scraping)</option>
                    <option value="instruction_following">Instruction Following Dataset</option>
                    <option value="conversation">Conversational AI Dataset</option>
                    <option value="code_generation">Code Generation Dataset</option>
                </select>
                <button 
                    onClick={onVisualize} 
                    disabled={isLoading || selectedDataset === 'none'}
                    className="px-3 py-2 text-sm font-semibold text-white bg-purple-600/50 rounded-md hover:bg-purple-600/80 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Visualizar conjunto de dados"
                >
                    Visualizar
                </button>
            </div>
          </div>
          <div className="flex space-x-2">
            <HyperparameterInput
              label="Tx. de Aprendizado"
              id="learning-rate"
              value={learningRate}
              onChange={(e) => setLearningRate(e.target.value)}
              error={errors.learningRate}
              disabled={isLoading}
              placeholder="0.001"
            />
            <HyperparameterInput
              label="Épocas"
              id="epochs"
              value={epochs}
              onChange={(e) => setEpochs(e.target.value)}
              error={errors.epochs}
              disabled={isLoading}
              placeholder="10"
            />
            <HyperparameterInput
              label="Tamanho do Lote"
              id="batch-size"
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              error={errors.batchSize}
              disabled={isLoading}
              placeholder="32"
            />
          </div>
        </div>
      </div>
       <div className="space-y-3">
        <p className="text-sm font-medium text-gray-300 -mb-1">Opções de Geração</p>
         <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700 p-3 rounded-lg">
          <input
              type="checkbox"
              id="generate-ui"
              checked={generateUi}
              onChange={(e) => setGenerateUi(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-purple-600 focus:ring-purple-500 transition-colors"
          />
          <label htmlFor="generate-ui" className="text-sm text-gray-300 flex-1 cursor-pointer">
              Gerar interface de usuário (Python)
          </label>
        </div>
        <div className="flex items-center space-x-3 bg-gray-900/50 border border-gray-700 p-3 rounded-lg">
          <input
            type="checkbox"
            id="generate-js"
            checked={generateJs}
            onChange={(e) => setGenerateJs(e.target.checked)}
            disabled={isLoading}
            className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-purple-600 focus:ring-purple-500 transition-colors"
          />
          <label htmlFor="generate-js" className="text-sm text-gray-300 flex-1 cursor-pointer">
              Gerar versão JS executável no navegador
          </label>
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={isLoading || hasErrors}
        className="w-full px-4 py-3 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transition-all duration-200 flex items-center justify-center"
      >
        {isLoading ? 'Gerando...' : 'Criar IA'}
      </button>
      <p className="text-xs text-center text-gray-500">
        Pressione <span className="font-mono bg-gray-700 px-1.5 py-0.5 rounded">Cmd/Ctrl</span> + <span className="font-mono bg-gray-700 px-1.5 py-0.5 rounded">Enter</span> para enviar.
      </p>
    </div>
  );
};