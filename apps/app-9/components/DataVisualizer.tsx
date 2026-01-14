import React from 'react';
import type { SampleDataset } from '../types';
import { MNIST_SAMPLES } from '../assets/mnist_samples';
import { CIFAR10_SAMPLES } from '../assets/cifar10_samples';

interface DataVisualizerProps {
  dataset: SampleDataset;
  onClose: () => void;
}

const IMDB_SAMPLES = {
    positive: "This movie was an absolute masterpiece! The acting was superb, the plot was gripping, and the cinematography was breathtaking. I was on the edge of my seat from start to finish. I can't recommend it enough, a true classic in the making.",
    negative: "What a disappointment. I had high hopes for this film, but it fell flat in almost every way. The storyline was predictable and full of holes, the dialogue was cringeworthy, and I felt no connection to any of the characters. A complete waste of time."
};

const DATASET_DETAILS = {
    'mnist': { title: "Amostras do Conjunto de Dados MNIST", description: "Imagens em tons de cinza de 28x28 de dígitos manuscritos (0-9)." },
    'cifar10': { title: "Amostras do Conjunto de Dados CIFAR-10", description: "Imagens coloridas de 32x32 de 10 classes de objetos (avião, carro, pássaro, etc.)." },
    'imdb': { title: "Amostras do Conjunto de Dados IMDB", description: "Críticas de filmes rotuladas como positivas ou negativas." },
    'none': { title: "", description: "" }
}

const ImageGrid: React.FC<{ images: string[], alt: string, imageClass?: string }> = ({ images, alt, imageClass = '' }) => (
    <div className="grid grid-cols-5 gap-2 p-2 bg-gray-900/50 rounded-lg">
        {images.map((src, index) => (
            <img key={index} src={src} alt={`${alt} ${index + 1}`} className={`rounded-md w-full h-auto object-contain ${imageClass}`} />
        ))}
    </div>
);

const TextSamples: React.FC = () => (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold text-green-400 mb-1">Crítica Positiva de Amostra:</h4>
            <p className="p-3 bg-gray-900/50 rounded-lg text-sm text-gray-300 italic">"{IMDB_SAMPLES.positive}"</p>
        </div>
        <div>
            <h4 className="font-semibold text-red-400 mb-1">Crítica Negativa de Amostra:</h4>
            <p className="p-3 bg-gray-900/50 rounded-lg text-sm text-gray-300 italic">"{IMDB_SAMPLES.negative}"</p>
        </div>
    </div>
);


export const DataVisualizer: React.FC<DataVisualizerProps> = ({ dataset, onClose }) => {
    const details = DATASET_DETAILS[dataset];

    const renderContent = () => {
        switch(dataset) {
            case 'mnist':
                return <ImageGrid images={MNIST_SAMPLES} alt="Dígito MNIST" imageClass="bg-black" />;
            case 'cifar10':
                return <ImageGrid images={CIFAR10_SAMPLES} alt="Imagem CIFAR-10" />;
            case 'imdb':
                return <TextSamples />;
            default:
                return null;
        }
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl shadow-purple-500/20 w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div>
                        <h3 className="text-lg font-bold text-white">{details.title}</h3>
                        <p className="text-sm text-gray-400">{details.description}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-colors"
                        aria-label="Fechar visualizador"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>
                <main className="p-4 overflow-y-auto">
                    {renderContent()}
                </main>
            </div>
            {/* FIX: Removed the unsupported 'jsx' prop from the <style> tag. This is a Next.js specific feature (styled-jsx) and is not supported in this React project. Using a standard <style> tag with a string child for the CSS content is the correct approach here to define the keyframe animation. */}
             <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};