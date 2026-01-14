import React from 'react';
import { SampleDataset } from '../types';

interface Template {
  id: string;
  name: string;
  description: string;
  prompt: string;
  dataset: SampleDataset;
  hyperparams: {
    learningRate: string;
    epochs: string;
    batchSize: string;
  };
  generateUi: boolean;
  category: 'vision' | 'nlp' | 'robotics' | 'generative' | 'rl';
}

const TEMPLATES: Template[] = [
  {
    id: 'image_classifier',
    name: 'Classificador de Imagens',
    description: 'CNN para classificação de imagens com transfer learning',
    prompt: 'Criar um classificador de imagens usando transfer learning com MobileNetV2. O modelo deve ser capaz de classificar diferentes categorias de objetos com alta precisão.',
    dataset: 'cifar10',
    hyperparams: { learningRate: '0.0001', epochs: '20', batchSize: '32' },
    generateUi: true,
    category: 'vision'
  },
  {
    id: 'sentiment_analysis',
    name: 'Análise de Sentimentos',
    description: 'Modelo NLP para análise de sentimentos em texto',
    prompt: 'Criar um modelo de análise de sentimentos para classificar reviews como positivos ou negativos. Incluir visualização de importância das palavras.',
    dataset: 'imdb',
    hyperparams: { learningRate: '0.001', epochs: '15', batchSize: '64' },
    generateUi: true,
    category: 'nlp'
  },
  {
    id: 'robot_control',
    name: 'Controle Robótico',
    description: 'Rede neural para controle de braço robótico',
    prompt: 'Criar um sistema de controle neural para braço robótico de 6 DOF. O modelo deve aprender cinemática inversa para posicionamento preciso do end-effector.',
    dataset: 'robot_arm',
    hyperparams: { learningRate: '0.0005', epochs: '50', batchSize: '128' },
    generateUi: true,
    category: 'robotics'
  },
  {
    id: 'gan_generator',
    name: 'Gerador GAN',
    description: 'GAN para geração de imagens sintéticas',
    prompt: 'Criar uma GAN (DCGAN) para gerar dígitos MNIST sintéticos. Implementar loop de treinamento adversarial completo com visualização do progresso.',
    dataset: 'mnist',
    hyperparams: { learningRate: '0.0002', epochs: '100', batchSize: '128' },
    generateUi: true,
    category: 'generative'
  },
  {
    id: 'llm_training',
    name: 'Treinamento de LLM',
    description: 'Large Language Model com arquitetura Transformer',
    prompt: 'Criar um Large Language Model usando arquitetura Transformer. Implementar attention multi-head, positional encoding e treinamento distribuído para geração de texto.',
    dataset: 'openwebtext',
    hyperparams: { learningRate: '0.0001', epochs: '10', batchSize: '16' },
    generateUi: true,
    category: 'nlp'
  },
  {
    id: 'rl_agent',
    name: 'Agente de RL',
    description: 'Agente de aprendizado por reforço usando PPO',
    prompt: 'Criar um agente PPO para navegação autônoma. O agente deve aprender a navegar em ambientes complexos evitando obstáculos e alcançando objetivos.',
    dataset: 'mobile_robot',
    hyperparams: { learningRate: '0.0003', epochs: '1000', batchSize: '64' },
    generateUi: true,
    category: 'rl'
  }
];

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onClose }) => {
  const categories = {
    vision: { name: 'Visão Computacional', color: 'bg-blue-500' },
    nlp: { name: 'Processamento de Linguagem', color: 'bg-green-500' },
    robotics: { name: 'Robótica', color: 'bg-orange-500' },
    generative: { name: 'Modelos Generativos', color: 'bg-purple-500' },
    rl: { name: 'Aprendizado por Reforço', color: 'bg-red-500' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Templates de IA</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 hover:border-purple-500 transition-all cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${categories[template.category].color}`}></span>
                <h3 className="font-semibold text-white">{template.name}</h3>
              </div>
              <p className="text-sm text-gray-400 mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-gray-700 px-2 py-1 rounded">{categories[template.category].name}</span>
                <span className="bg-gray-700 px-2 py-1 rounded">Dataset: {template.dataset}</span>
                <span className="bg-gray-700 px-2 py-1 rounded">Épocas: {template.hyperparams.epochs}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};