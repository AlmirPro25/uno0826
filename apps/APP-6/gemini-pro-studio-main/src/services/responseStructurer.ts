/**
 * 📰 RESPONSE STRUCTURER
 * Estrutura respostas em formato semântico com metadados
 */

export interface StructuredSource {
  id: number;
  title: string;
  url: string;
  type: 'article' | 'video' | 'government' | 'social' | 'reference';
  publisher: string;
  date?: string;
  thumbnail?: string;
}

export interface TimelineEvent {
  date: string;
  time?: string;
  title: string;
  description: string;
  location?: string;
  sources: number[]; // IDs das fontes
}

export interface StructuredSection {
  title: string;
  emoji: string;
  content: string;
  sources: number[];
  type: 'main' | 'secondary' | 'context';
}

export interface StructuredResponse {
  // Metadados
  query: string;
  responseType: 'news' | 'products' | 'educational' | 'general';
  summary: string; // Título resumo
  generatedAt: string;
  
  // Conteúdo estruturado
  sections: StructuredSection[];
  timeline?: TimelineEvent[];
  
  // Fontes organizadas
  sources: {
    articles: StructuredSource[];
    videos: StructuredSource[];
    government: StructuredSource[];
    other: StructuredSource[];
  };
  
  // Sugestões de follow-up
  followUpQuestions?: string[];
  
  // Conteúdo original (fallback)
  rawContent: string;
}

/**
 * Detectar tipo de resposta
 */
function detectResponseType(query: string, content: string): 'news' | 'products' | 'educational' | 'general' {
  const lowerQuery = query.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  // Notícias
  if (lowerQuery.match(/notícia|aconteceu|últimas|breaking/) || 
      lowerContent.match(/operação|polícia|governo|prefeitura/)) {
    return 'news';
  }
  
  // Produtos
  if (lowerQuery.match(/produto|comprar|preço|loja/) ||
      lowerContent.match(/r\$|reais|preço|comprar/)) {
    return 'products';
  }
  
  // Educacional
  if (lowerQuery.match(/como|tutorial|aprender|o que é/) ||
      lowerContent.match(/passo a passo|tutorial|guia/)) {
    return 'educational';
  }
  
  return 'general';
}

/**
 * Extrair seções do conteúdo markdown
 */
function extractSections(content: string): StructuredSection[] {
  const sections: StructuredSection[] = [];
  
  // Regex para capturar seções com emoji e título
  const sectionRegex = /^(#{1,3})\s*([^\n]+)\n([\s\S]*?)(?=^#{1,3}\s|$)/gm;
  
  let match;
  while ((match = sectionRegex.exec(content)) !== null) {
    const level = match[1].length;
    const titleLine = match[2].trim();
    const sectionContent = match[3].trim();
    
    // Extrair emoji do título
    const emojiMatch = titleLine.match(/^([^\w\s]+)\s*(.+)$/);
    const emoji = emojiMatch ? emojiMatch[1] : '📄';
    const title = emojiMatch ? emojiMatch[2] : titleLine;
    
    // Extrair referências de fontes [1], [2], etc.
    const sourceRefs = [...sectionContent.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]));
    
    sections.push({
      title,
      emoji,
      content: sectionContent,
      sources: [...new Set(sourceRefs)],
      type: level === 1 ? 'main' : level === 2 ? 'secondary' : 'context'
    });
  }
  
  return sections;
}

/**
 * Extrair timeline de eventos
 */
function extractTimeline(content: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // Regex para datas (terça-feira 28, quarta-feira 29, etc.)
  const dateRegex = /(segunda|terça|quarta|quinta|sexta|sábado|domingo)[-\s]feira\s+(\d{1,2})/gi;
  
  const lines = content.split('\n');
  let currentDate = '';
  
  lines.forEach(line => {
    const dateMatch = line.match(dateRegex);
    if (dateMatch) {
      currentDate = dateMatch[0];
    }
    
    // Se a linha tem data e conteúdo relevante
    if (currentDate && line.length > 20 && !line.startsWith('#')) {
      // Extrair referências de fontes
      const sourceRefs = [...line.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]));
      
      // Extrair localização (se houver)
      const locationMatch = line.match(/em\s+([A-Z][a-zá-ú]+(?:\s+[A-Z][a-zá-ú]+)*)/);
      
      events.push({
        date: currentDate,
        title: line.substring(0, 100).replace(/\[[\d,\s]+\]/g, '').trim(),
        description: line.replace(/\[[\d,\s]+\]/g, '').trim(),
        location: locationMatch ? locationMatch[1] : undefined,
        sources: sourceRefs
      });
    }
  });
  
  return events;
}

/**
 * Classificar e organizar fontes
 */
function organizeSources(rawSources: Array<{title: string; url: string; source: string}>): StructuredResponse['sources'] {
  const organized: StructuredResponse['sources'] = {
    articles: [],
    videos: [],
    government: [],
    other: []
  };
  
  rawSources.forEach((source, index) => {
    const structuredSource: StructuredSource = {
      id: index + 1,
      title: source.title,
      url: source.url,
      type: 'article',
      publisher: source.source
    };
    
    // Classificar por tipo
    const lowerUrl = source.url.toLowerCase();
    const lowerTitle = source.title.toLowerCase();
    
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerTitle.includes('vídeo')) {
      structuredSource.type = 'video';
      organized.videos.push(structuredSource);
    } else if (lowerUrl.includes('gov.br') || lowerUrl.includes('prefeitura') || source.source.includes('Governo')) {
      structuredSource.type = 'government';
      organized.government.push(structuredSource);
    } else if (lowerUrl.includes('g1.globo') || lowerUrl.includes('uol.com') || lowerUrl.includes('folha.uol')) {
      structuredSource.type = 'article';
      organized.articles.push(structuredSource);
    } else {
      organized.other.push(structuredSource);
    }
  });
  
  return organized;
}

/**
 * Gerar perguntas de follow-up
 */
function generateFollowUpQuestions(query: string, content: string, responseType: string): string[] {
  const questions: string[] = [];
  
  if (responseType === 'news') {
    questions.push('Quais foram as consequências?');
    questions.push('Há atualizações recentes?');
    questions.push('Como a população reagiu?');
  } else if (responseType === 'products') {
    questions.push('Qual o mais barato?');
    questions.push('Qual tem melhor avaliação?');
    questions.push('Onde comprar com desconto?');
  } else if (responseType === 'educational') {
    questions.push('Pode explicar com mais detalhes?');
    questions.push('Quais são os exemplos práticos?');
    questions.push('Onde posso aprender mais?');
  }
  
  return questions.slice(0, 3);
}

/**
 * Gerar título resumo
 */
function generateSummaryTitle(query: string, responseType: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  
  switch (responseType) {
    case 'news':
      return `📰 Resumo: ${query} (${dateStr})`;
    case 'products':
      return `🛒 Produtos: ${query}`;
    case 'educational':
      return `📚 Guia: ${query}`;
    default:
      return `🔍 Pesquisa: ${query}`;
  }
}

/**
 * Estruturar resposta completa
 */
export function structureResponse(
  query: string,
  content: string,
  sources: Array<{title: string; url: string; source: string}>
): StructuredResponse {
  
  console.log('📊 Estruturando resposta...');
  
  // Detectar tipo
  const responseType = detectResponseType(query, content);
  
  // Extrair seções
  const sections = extractSections(content);
  
  // Extrair timeline (se for notícia)
  const timeline = responseType === 'news' ? extractTimeline(content) : undefined;
  
  // Organizar fontes
  const organizedSources = organizeSources(sources);
  
  // Gerar follow-up
  const followUpQuestions = generateFollowUpQuestions(query, content, responseType);
  
  // Gerar título resumo
  const summary = generateSummaryTitle(query, responseType);
  
  const structured: StructuredResponse = {
    query,
    responseType,
    summary,
    generatedAt: new Date().toISOString(),
    sections,
    timeline,
    sources: organizedSources,
    followUpQuestions,
    rawContent: content
  };
  
  console.log(`✅ Resposta estruturada: ${sections.length} seções, ${timeline?.length || 0} eventos`);
  
  return structured;
}

export default {
  structureResponse
};
