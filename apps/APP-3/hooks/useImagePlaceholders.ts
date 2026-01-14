import { useMemo } from 'react';

export function useImagePlaceholders(htmlContent: string) {
  const analysis = useMemo(() => {
    const hasPlaceholders = /ai-researched-image:\/\//.test(htmlContent);
    
    if (!hasPlaceholders) {
      return {
        hasPlaceholders: false,
        count: 0,
        descriptions: [],
        estimatedTime: 0
      };
    }

    const matches = htmlContent.match(/ai-researched-image:\/\/([^"']+)/g);
    const count = matches ? matches.length : 0;
    
    const descriptions = matches 
      ? matches.map(match => match.replace('ai-researched-image://', ''))
      : [];
    
    // Estimar tempo: ~12 segundos por imagem
    const estimatedTime = count * 12;

    return {
      hasPlaceholders: true,
      count,
      descriptions,
      estimatedTime
    };
  }, [htmlContent]);

  return analysis;
}