// test-media-integration.js
// Script para testar o sistema integrado de mídia

import { processHtmlAndGenerateMedia } from './services/MediaIntegrationService.js';
import { expandImageUrls } from './services/ImageUrlExpander.js';
import { expandVideoUrls } from './services/VideoUrlExpander.js';

/**
 * Função para testar o sistema integrado de mídia
 */
async function testMediaIntegration() {
  console.log('🧪 INICIANDO TESTE DE INTEGRAÇÃO DE MÍDIA...');
  
  try {
    // 1. Carregar o HTML de teste
    const response = await fetch('./test-media-integration.html');
    const htmlContent = await response.text();
    
    console.log('📄 HTML de teste carregado');
    
    // 2. Processar o HTML e gerar mídia
    console.log('🔄 Processando HTML e buscando mídia...');
    
    const processedHtml = await processHtmlAndGenerateMedia(
      htmlContent,
      (progress) => {
        console.log(`📊 Progresso: ${progress.current}/${progress.total} ${progress.type}s - ${progress.description}`);
      }
    );
    
    console.log('✅ Processamento concluído!');
    
    // 3. Exibir o HTML processado
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
      // Expandir URLs para visualização
      const expandedHtml = expandVideoUrls(expandImageUrls(processedHtml));
      
      // Criar iframe para visualização
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      
      previewContainer.appendChild(iframe);
      
      // Escrever HTML no iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(expandedHtml);
      iframeDoc.close();
      
      console.log('🖼️ Preview gerado com sucesso!');
    }
    
    // 4. Exibir estatísticas
    const imageCount = (processedHtml.match(/ai-img:\/\//g) || []).length;
    const videoCount = (processedHtml.match(/ai-vid:\/\//g) || []).length;
    
    console.log(`📊 ESTATÍSTICAS:`);
    console.log(`📸 Imagens processadas: ${imageCount}`);
    console.log(`🎬 Vídeos processados: ${videoCount}`);
    console.log(`📦 Tamanho do HTML: ${processedHtml.length} caracteres`);
    
    return {
      success: true,
      imageCount,
      videoCount,
      htmlSize: processedHtml.length
    };
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Executar o teste quando o documento estiver pronto
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando teste de integração...');
    testMediaIntegration()
      .then(result => {
        console.log('🏁 Teste concluído:', result);
      })
      .catch(error => {
        console.error('💥 Erro no teste:', error);
      });
  });
}

// Exportar função para uso em outros contextos
export { testMediaIntegration };