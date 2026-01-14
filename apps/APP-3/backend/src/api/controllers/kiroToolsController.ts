// backend/src/api/controllers/kiroToolsController.ts
// 🚀 KIRO TOOLS CONTROLLER - Ferramentas de Agente de Código
// Implementa capacidades similares ao Kiro IDE

import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';

// Diretório base para sandbox (workspace do projeto)
const WORKSPACE_DIR = path.join(process.cwd(), '..');

/**
 * Valida se o caminho está dentro do sandbox
 */
function validatePath(filePath: string): string {
  const fullPath = path.resolve(WORKSPACE_DIR, filePath);
  if (!fullPath.startsWith(WORKSPACE_DIR)) {
    throw new Error('Acesso negado: Caminho fora do workspace');
  }
  return fullPath;
}

/**
 * 🔍 GREP SEARCH - Busca texto em arquivos
 * POST /api/kiro/search
 */
export const grepSearch = async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      path: searchPath = '.', 
      includePattern = '**/*',
      excludePattern,
      caseSensitive = false,
      maxResults = 50
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query não fornecida' });
    }

    const basePath = validatePath(searchPath);
    
    // Encontrar arquivos que correspondem ao padrão
    const files = await glob(includePattern, {
      cwd: basePath,
      ignore: excludePattern ? [excludePattern, '**/node_modules/**', '**/.git/**'] : ['**/node_modules/**', '**/.git/**'],
      nodir: true,
      absolute: false
    });

    const results: Array<{
      file: string;
      line: number;
      content: string;
      match: string;
    }> = [];

    const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');

    for (const file of files) {
      if (results.length >= maxResults) break;

      try {
        const fullFilePath = path.join(basePath, file);
        const content = await fs.readFile(fullFilePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) break;
          
          const line = lines[i];
          const matches = line.match(regex);
          
          if (matches) {
            results.push({
              file: path.join(searchPath, file),
              line: i + 1,
              content: line.trim().substring(0, 200),
              match: matches[0]
            });
          }
        }
      } catch (err) {
        // Ignora arquivos que não podem ser lidos (binários, etc.)
        continue;
      }
    }

    res.json({
      success: true,
      query,
      totalMatches: results.length,
      results
    });

  } catch (error: any) {
    console.error('Erro no grep search:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 📚 READ MULTIPLE FILES - Lê múltiplos arquivos de uma vez
 * POST /api/kiro/read-multiple
 */
export const readMultipleFiles = async (req: Request, res: Response) => {
  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Lista de caminhos não fornecida' });
    }

    const results: Array<{
      path: string;
      success: boolean;
      content?: string;
      error?: string;
      size?: number;
    }> = [];

    for (const filePath of paths) {
      try {
        const fullPath = validatePath(filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const stats = await fs.stat(fullPath);
        
        results.push({
          path: filePath,
          success: true,
          content,
          size: stats.size
        });
      } catch (err: any) {
        results.push({
          path: filePath,
          success: false,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      files: results
    });

  } catch (error: any) {
    console.error('Erro ao ler múltiplos arquivos:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🔄 STRING REPLACE - Substitui texto em arquivo
 * POST /api/kiro/replace
 */
export const strReplace = async (req: Request, res: Response) => {
  try {
    const { path: filePath, oldStr, newStr } = req.body;

    if (!filePath || oldStr === undefined || newStr === undefined) {
      return res.status(400).json({ 
        error: 'Parâmetros obrigatórios: path, oldStr, newStr' 
      });
    }

    const fullPath = validatePath(filePath);
    
    // Lê o arquivo
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Verifica se oldStr existe no arquivo
    if (!content.includes(oldStr)) {
      return res.status(400).json({
        success: false,
        error: 'String não encontrada no arquivo',
        hint: 'Verifique se o texto existe exatamente como especificado (incluindo espaços e quebras de linha)'
      });
    }
    
    // Conta ocorrências
    const occurrences = content.split(oldStr).length - 1;
    
    if (occurrences > 1) {
      return res.status(400).json({
        success: false,
        error: `String encontrada ${occurrences} vezes. Deve ser única.`,
        hint: 'Inclua mais contexto (linhas antes/depois) para tornar a string única'
      });
    }
    
    // Substitui
    const newContent = content.replace(oldStr, newStr);
    
    // Escreve de volta
    await fs.writeFile(fullPath, newContent, 'utf-8');

    res.json({
      success: true,
      path: filePath,
      message: 'Substituição realizada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro no strReplace:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 📁 LIST DIRECTORY RECURSIVE - Lista diretório com profundidade
 * GET /api/kiro/list-recursive
 */
export const listDirectoryRecursive = async (req: Request, res: Response) => {
  try {
    const { path: dirPath = '.', depth = 2 } = req.query;

    const basePath = validatePath(dirPath as string);
    
    interface FileNode {
      name: string;
      path: string;
      isDirectory: boolean;
      size?: number;
      children?: FileNode[];
    }

    async function readDir(currentPath: string, currentDepth: number): Promise<FileNode[]> {
      if (currentDepth > Number(depth)) return [];
      
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        const nodes: FileNode[] = [];

        for (const entry of entries) {
          // Ignora node_modules e .git
          if (entry.name === 'node_modules' || entry.name === '.git') continue;

          const entryPath = path.join(currentPath, entry.name);
          const relativePath = path.relative(WORKSPACE_DIR, entryPath);

          const node: FileNode = {
            name: entry.name,
            path: relativePath,
            isDirectory: entry.isDirectory()
          };

          if (entry.isDirectory()) {
            node.children = await readDir(entryPath, currentDepth + 1);
          } else {
            try {
              const stats = await fs.stat(entryPath);
              node.size = stats.size;
            } catch {}
          }

          nodes.push(node);
        }

        return nodes.sort((a, b) => {
          // Diretórios primeiro
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      } catch {
        return [];
      }
    }

    const tree = await readDir(basePath, 1);

    res.json({
      success: true,
      path: dirPath,
      depth,
      tree
    });

  } catch (error: any) {
    console.error('Erro ao listar diretório:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ➕ FILE APPEND - Adiciona conteúdo ao final do arquivo
 * POST /api/kiro/append
 */
export const fileAppend = async (req: Request, res: Response) => {
  try {
    const { path: filePath, text } = req.body;

    if (!filePath || text === undefined) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios: path, text' });
    }

    const fullPath = validatePath(filePath);
    
    // Verifica se arquivo existe
    try {
      await fs.access(fullPath);
    } catch {
      return res.status(404).json({ 
        error: 'Arquivo não existe. Use write-files para criar.' 
      });
    }

    // Lê conteúdo atual
    const currentContent = await fs.readFile(fullPath, 'utf-8');
    
    // Adiciona newline se necessário
    const separator = currentContent.endsWith('\n') ? '' : '\n';
    
    // Append
    await fs.appendFile(fullPath, separator + text, 'utf-8');

    res.json({
      success: true,
      path: filePath,
      message: 'Conteúdo adicionado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro no append:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🗑️ FILE DELETE - Deleta arquivo (com confirmação)
 * DELETE /api/kiro/delete
 */
export const fileDelete = async (req: Request, res: Response) => {
  try {
    const { path: filePath, confirm } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'Caminho do arquivo não fornecido' });
    }

    if (!confirm) {
      return res.status(400).json({ 
        error: 'Confirmação necessária',
        message: 'Envie confirm: true para confirmar a deleção'
      });
    }

    const fullPath = validatePath(filePath);
    
    // Verifica se existe
    const stats = await fs.stat(fullPath);
    
    if (stats.isDirectory()) {
      return res.status(400).json({ 
        error: 'Não é possível deletar diretórios por segurança' 
      });
    }

    await fs.unlink(fullPath);

    res.json({
      success: true,
      path: filePath,
      message: 'Arquivo deletado com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao deletar:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 🔎 FILE SEARCH - Busca arquivos por nome
 * GET /api/kiro/file-search
 */
export const fileSearch = async (req: Request, res: Response) => {
  try {
    const { query, path: searchPath = '.' } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Query não fornecida' });
    }

    const basePath = validatePath(searchPath as string);
    
    // Busca arquivos que correspondem ao padrão
    const pattern = `**/*${query}*`;
    const files = await glob(pattern, {
      cwd: basePath,
      ignore: ['**/node_modules/**', '**/.git/**'],
      nodir: false
    });

    const results = files.slice(0, 20).map(file => ({
      path: path.join(searchPath as string, file),
      name: path.basename(file)
    }));

    res.json({
      success: true,
      query,
      results
    });

  } catch (error: any) {
    console.error('Erro na busca de arquivos:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * 📊 GET DIAGNOSTICS - Obtém erros de sintaxe/tipo (básico)
 * POST /api/kiro/diagnostics
 */
export const getDiagnostics = async (req: Request, res: Response) => {
  try {
    const { paths } = req.body;

    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Lista de caminhos não fornecida' });
    }

    const diagnostics: Array<{
      path: string;
      issues: Array<{
        line: number;
        column: number;
        message: string;
        severity: 'error' | 'warning' | 'info';
      }>;
    }> = [];

    for (const filePath of paths) {
      try {
        const fullPath = validatePath(filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const issues: Array<{
          line: number;
          column: number;
          message: string;
          severity: 'error' | 'warning' | 'info';
        }> = [];

        // Análise básica de sintaxe
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Detecta console.log em produção
          if (line.includes('console.log')) {
            issues.push({
              line: i + 1,
              column: line.indexOf('console.log') + 1,
              message: 'console.log encontrado - considere remover em produção',
              severity: 'warning'
            });
          }
          
          // Detecta TODO/FIXME
          if (line.includes('TODO') || line.includes('FIXME')) {
            issues.push({
              line: i + 1,
              column: 1,
              message: 'TODO/FIXME encontrado',
              severity: 'info'
            });
          }
          
          // Detecta any em TypeScript
          if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            if (line.includes(': any') || line.includes('<any>')) {
              issues.push({
                line: i + 1,
                column: line.indexOf('any') + 1,
                message: 'Uso de "any" - considere usar tipo específico',
                severity: 'warning'
              });
            }
          }
        }

        diagnostics.push({ path: filePath, issues });
      } catch (err: any) {
        diagnostics.push({ 
          path: filePath, 
          issues: [{
            line: 0,
            column: 0,
            message: `Erro ao analisar: ${err.message}`,
            severity: 'error'
          }]
        });
      }
    }

    res.json({
      success: true,
      diagnostics
    });

  } catch (error: any) {
    console.error('Erro ao obter diagnósticos:', error);
    res.status(500).json({ error: error.message });
  }
};
