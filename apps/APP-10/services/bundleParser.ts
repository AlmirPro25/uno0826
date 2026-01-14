/**
 * 🎁 AETHER BUNDLE PARSER
 * Detecta e parseia bundles de projeto gerados pela IA
 * 
 * Formato do Bundle:
 * ```aether-bundle
 * ===FILE: path/to/file.tsx===
 * conteúdo do arquivo
 * ===END_FILE===
 * 
 * ===FILE: path/to/another.ts===
 * conteúdo
 * ===END_FILE===
 * ```
 */

export interface ParsedFile {
  path: string;
  content: string;
}

export interface BundleParseResult {
  isBundle: boolean;
  files: ParsedFile[];
  textBefore: string;
  textAfter: string;
}

// Regex para detectar o bundle
const BUNDLE_START = /```aether-bundle\s*\n/;
const BUNDLE_END = /\n```/;
const FILE_PATTERN = /===FILE:\s*(.+?)===\n([\s\S]*?)===END_FILE===/g;

// Formato alternativo mais simples (para compatibilidade)
const ALT_FILE_PATTERN = /<!-- FILE:\s*(.+?)\s*-->\n([\s\S]*?)<!-- END_FILE -->/g;

// Formato de script HTML (como o DEFAULT_PLACEHOLDER_HTML usa)
const SCRIPT_FILE_PATTERN = /<script\s+type="text\/plain"\s+data-path="([^"]+)">([\s\S]*?)<\/script>/g;

/**
 * Detecta se o texto contém um bundle de projeto
 */
export function detectBundle(text: string): boolean {
  return (
    BUNDLE_START.test(text) ||
    ALT_FILE_PATTERN.test(text) ||
    SCRIPT_FILE_PATTERN.test(text) ||
    text.includes('===FILE:') ||
    text.includes('<!-- FILE:')
  );
}

/**
 * Parseia um bundle e extrai os arquivos
 */
export function parseBundle(text: string): BundleParseResult {
  const result: BundleParseResult = {
    isBundle: false,
    files: [],
    textBefore: '',
    textAfter: ''
  };

  // Tentar formato aether-bundle
  const bundleMatch = text.match(/```aether-bundle\s*\n([\s\S]*?)\n```/);
  if (bundleMatch) {
    result.isBundle = true;
    const bundleContent = bundleMatch[1];
    const bundleStart = text.indexOf(bundleMatch[0]);
    const bundleEnd = bundleStart + bundleMatch[0].length;
    
    result.textBefore = text.substring(0, bundleStart).trim();
    result.textAfter = text.substring(bundleEnd).trim();
    
    // Extrair arquivos do bundle
    let match;
    FILE_PATTERN.lastIndex = 0;
    while ((match = FILE_PATTERN.exec(bundleContent)) !== null) {
      result.files.push({
        path: normalizePath(match[1].trim()),
        content: match[2].trim()
      });
    }
    
    return result;
  }

  // Tentar formato alternativo HTML comments
  let altMatch;
  ALT_FILE_PATTERN.lastIndex = 0;
  while ((altMatch = ALT_FILE_PATTERN.exec(text)) !== null) {
    result.isBundle = true;
    result.files.push({
      path: normalizePath(altMatch[1].trim()),
      content: altMatch[2].trim()
    });
  }

  // Tentar formato script (como o placeholder HTML)
  let scriptMatch;
  SCRIPT_FILE_PATTERN.lastIndex = 0;
  while ((scriptMatch = SCRIPT_FILE_PATTERN.exec(text)) !== null) {
    result.isBundle = true;
    result.files.push({
      path: normalizePath(scriptMatch[1].trim()),
      content: scriptMatch[2].trim()
    });
  }

  // Tentar formato inline ===FILE:===
  if (!result.isBundle && text.includes('===FILE:')) {
    let inlineMatch;
    FILE_PATTERN.lastIndex = 0;
    while ((inlineMatch = FILE_PATTERN.exec(text)) !== null) {
      result.isBundle = true;
      result.files.push({
        path: normalizePath(inlineMatch[1].trim()),
        content: inlineMatch[2].trim()
      });
    }
    
    if (result.isBundle) {
      // Remover os blocos de arquivo do texto
      result.textBefore = text.replace(FILE_PATTERN, '').trim();
    }
  }

  return result;
}

/**
 * Normaliza o caminho do arquivo
 */
function normalizePath(path: string): string {
  // Remove ./ do início
  let normalized = path.replace(/^\.\//, '');
  // Remove / do início
  normalized = normalized.replace(/^\//, '');
  // Normaliza barras
  normalized = normalized.replace(/\\/g, '/');
  return normalized;
}

/**
 * Gera um bundle a partir de uma lista de arquivos
 */
export function generateBundle(files: ParsedFile[]): string {
  const fileBlocks = files.map(f => 
    `===FILE: ${f.path}===\n${f.content}\n===END_FILE===`
  ).join('\n\n');
  
  return `\`\`\`aether-bundle\n${fileBlocks}\n\`\`\``;
}

/**
 * Detecta e extrai código de blocos markdown comuns
 * Útil quando a IA escreve código em blocos ```jsx etc
 */
export function extractCodeBlocks(text: string): { language: string; code: string; filename?: string }[] {
  const blocks: { language: string; code: string; filename?: string }[] = [];
  
  // Padrão: ```language filename.ext ou ```language
  const codeBlockPattern = /```(\w+)(?:\s+([^\n]+))?\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockPattern.exec(text)) !== null) {
    const language = match[1];
    const possibleFilename = match[2]?.trim();
    const code = match[3].trim();
    
    // Tentar inferir filename se não fornecido
    let filename = possibleFilename;
    if (!filename && code.length > 0) {
      // Tentar detectar pelo conteúdo
      if (code.includes('export default function') || code.includes('export const')) {
        const componentMatch = code.match(/(?:export default function|export const)\s+(\w+)/);
        if (componentMatch) {
          const ext = language === 'tsx' || language === 'typescript' ? 'tsx' : 
                      language === 'jsx' || language === 'javascript' ? 'jsx' : 
                      language;
          filename = `${componentMatch[1]}.${ext}`;
        }
      }
    }
    
    blocks.push({ language, code, filename });
  }
  
  return blocks;
}

/**
 * Tenta converter blocos de código soltos em um bundle estruturado
 */
export function convertCodeBlocksToBundle(text: string): BundleParseResult {
  const result: BundleParseResult = {
    isBundle: false,
    files: [],
    textBefore: text,
    textAfter: ''
  };
  
  const blocks = extractCodeBlocks(text);
  
  for (const block of blocks) {
    if (block.filename) {
      result.isBundle = true;
      result.files.push({
        path: block.filename,
        content: block.code
      });
    }
  }
  
  return result;
}
