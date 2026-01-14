import React from 'react';
import { BrainIcon } from './icons/Icons';

export const Hero: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center bg-gray-800/30 rounded-2xl border border-dashed border-gray-700 p-8">
      <BrainIcon className="w-16 h-16 text-purple-400 mb-4" />
      <h2 className="text-2xl font-bold text-white">Seu Arquiteto de IA Aguarda</h2>
      <p className="mt-2 max-w-lg text-gray-400">
        Descreva a tarefa que você deseja que sua rede neural execute. Seja simples ou complexo. Explore as ideias abaixo para começar.
      </p>
      <div className="mt-6 p-4 bg-gray-900/50 rounded-lg text-left text-sm text-gray-400 max-w-lg w-full">
        <p className="font-semibold text-gray-300 mb-2">Experimente pedir:</p>
        <ul className="list-disc list-inside space-y-2">
            <li>"Usar <strong>transfer learning</strong> com MobileNetV2 para classificar imagens de flores."</li>
            <li>"Uma <strong>GAN</strong> para gerar novos dígitos manuscritos, com uma UI para inferência."</li>
            <li>"Um modelo de <strong>análise de sentimento</strong> para críticas de filmes do IMDB."</li>
            <li>"<strong>Clonar uma voz</strong> a partir de uma amostra de áudio usando uma arquitetura Tacotron 2 e um vocoder HiFi-GAN."</li>
            <li>"Um <strong>agente de RL</strong> com PPO para aprender a navegar em um labirinto."</li>
        </ul>
      </div>
    </div>
  );
};