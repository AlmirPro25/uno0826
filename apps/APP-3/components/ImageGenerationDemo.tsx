import React, { useState } from 'react';
import { ImageGenerationManager } from './ImageGenerationManager';
import { useEnhancedAI } from '../hooks/useEnhancedAI';

const DEMO_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Restaurante Bella Vista</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-8">
        <header class="text-center mb-12">
            <h1 class="text-4xl font-bold mb-4">Restaurante Bella Vista</h1>
            <p class="text-xl text-gray-400">Sabores autênticos desde 1985</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <!-- Pizza Margherita -->
            <div class="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                <img 
                    src="ai-researched-image://pizza margherita artesanal com mussarela de búfala, tomate san marzano e manjericão fresco em forno a lenha, fotografia profissional de comida"
                    alt="Pizza Margherita"
                    class="w-full h-48 object-cover"
                    data-aid="image-pizza-margherita"
                />
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">Pizza Margherita Premium</h3>
                    <p class="text-gray-400 mb-4">Mussarela de búfala, tomate San Marzano, manjericão fresco</p>
                    <p class="text-green-400 font-bold text-lg">R$ 48,90</p>
                </div>
            </div>

            <!-- Pizza Pepperoni -->
            <div class="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                <img 
                    src="ai-researched-image://pizza pepperoni com queijo derretido e pepperoni crocante, fundo escuro, fotografia gastronômica profissional"
                    alt="Pizza Pepperoni"
                    class="w-full h-48 object-cover"
                    data-aid="image-pizza-pepperoni"
                />
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">Pizza Pepperoni Clássica</h3>
                    <p class="text-gray-400 mb-4">Pepperoni artesanal, mussarela especial, molho de tomate</p>
                    <p class="text-green-400 font-bold text-lg">R$ 52,90</p>
                </div>
            </div>

            <!-- Interior do Restaurante -->
            <div class="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
                <img 
                    src="ai-researched-image://interior aconchegante de restaurante italiano com forno a lenha, mesas de madeira, iluminação quente e atmosfera romântica"
                    alt="Interior do Restaurante"
                    class="w-full h-48 object-cover"
                    data-aid="image-restaurant-interior"
                />
                <div class="p-6">
                    <h3 class="text-xl font-semibold mb-2">Ambiente Acolhedor</h3>
                    <p class="text-gray-400 mb-4">Tradição italiana em cada detalhe</p>
                    <p class="text-blue-400 font-semibold">Reservas: (11) 9999-9999</p>
                </div>
            </div>
        </div>

        <section class="mt-16 text-center">
            <h2 class="text-3xl font-bold mb-8">Nossa História</h2>
            <div class="max-w-4xl mx-auto">
                <img 
                    src="ai-researched-image://chef italiano tradicional preparando massa de pizza artesanal em cozinha profissional, ambiente autêntico"
                    alt="Chef preparando pizza"
                    class="w-full h-64 object-cover rounded-lg mb-6"
                    data-aid="image-chef-cooking"
                />
                <p class="text-lg text-gray-300 leading-relaxed">
                    Desde 1985, o Restaurante Bella Vista traz os sabores autênticos da Itália para o coração de São Paulo. 
                    Nossa massa é fermentada por 48 horas e nossos ingredientes são importados diretamente da região da Campânia.
                </p>
            </div>
        </section>
    </div>
</body>
</html>`;

export const ImageGenerationDemo: React.FC = () => {
  const [htmlContent, setHtmlContent] = useState(DEMO_HTML);
  const [showDemo, setShowDemo] = useState(false);
  
  const {
    isGenerating,
    progress,
    error,
    generateCode,
    imagesGenerated,
    processingTime
  } = useEnhancedAI({
    generateImages: true,
    projectId: 'demo-restaurant',
    onProgress: (message) => console.log('🎨', message)
  });

  const handleGenerateNewExample = async () => {
    const prompt = `Crie um site moderno para uma loja de roupas femininas chamada "Moda Elegante". 
    Inclua seções para: header com logo, produtos em destaque, sobre a loja, e contato.
    Use placeholders ai-researched-image:// para todas as imagens.
    Estilo: moderno, elegante, cores suaves.`;

    const result = await generateCode(prompt);
    if (result) {
      setHtmlContent(result.content);
    }
  };

  if (!showDemo) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDemo(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-all flex items-center space-x-2"
          data-aid="button-show-image-demo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
          <span>Demo Imagens IA</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Sistema de Geração de Imagens IA</h2>
            <p className="text-gray-400">Demonstração do Gemini 2.0 Flash Preview Image Generation</p>
          </div>
          <button
            onClick={() => setShowDemo(false)}
            className="text-gray-400 hover:text-white transition-colors"
            data-aid="button-close-demo"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Controls */}
          <div className="w-1/3 p-6 border-r border-gray-700 overflow-y-auto">
            <div className="space-y-6">
              {/* Image Generation Manager */}
              <ImageGenerationManager
                htmlContent={htmlContent}
                onHtmlUpdate={setHtmlContent}
                projectId="demo-restaurant"
              />

              {/* Stats */}
              {(imagesGenerated > 0 || processingTime > 0) && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Estatísticas</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Imagens geradas:</span>
                      <span className="text-green-400 font-medium">{imagesGenerated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tempo de processamento:</span>
                      <span className="text-blue-400 font-medium">{Math.round(processingTime / 1000)}s</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generate New Example */}
              <div className="space-y-3">
                <button
                  onClick={handleGenerateNewExample}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-2 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  data-aid="button-generate-new-example"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Gerar Novo Exemplo</span>
                    </>
                  )}
                </button>

                {progress && (
                  <div className="text-sm text-blue-400 text-center">
                    {progress}
                  </div>
                )}

                {error && (
                  <div className="text-sm text-red-400 text-center bg-red-900/20 rounded p-2">
                    {error}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-semibold mb-2">Como usar:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Use <code className="bg-gray-800 px-1 rounded">ai-researched-image://descrição</code></li>
                  <li>• Clique em "Gerar Imagens" para processar</li>
                  <li>• As imagens são salvas localmente</li>
                  <li>• URLs são substituídas automaticamente</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 p-6">
            <div className="h-full bg-white rounded-lg overflow-hidden">
              <iframe
                srcDoc={htmlContent}
                className="w-full h-full border-0"
                title="Preview"
                data-aid="iframe-preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};