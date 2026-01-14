
import { VirtualFile } from "../types";

/**
 * Standardizes file paths to remove ./ prefix and leading slashes
 */
export const normalizePath = (path: string): string => {
    if (!path) return '';
    let clean = path.replace(/\\/g, '/'); // Windows backslashes
    if (clean.startsWith('./')) clean = clean.substring(2);
    if (clean.startsWith('/')) clean = clean.substring(1);
    return clean;
};

/**
 * Parses the raw HTML string (which may contain embedded <script data-path="..."> tags)
 * into a structured array of VirtualFiles suitable for a file tree.
 */
export const parseVirtualFiles = (htmlCode: string): VirtualFile[] => {
  const files: VirtualFile[] = [];
  
  // Regex to find the data-path scripts
  const scriptRegex = /<script[^>]*type="text\/plain"[^>]*data-path="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g;
  
  let match;
  const embeddedFiles: { path: string, content: string }[] = [];
  
  while ((match = scriptRegex.exec(htmlCode)) !== null) {
    embeddedFiles.push({
      path: normalizePath(match[1]),
      content: match[2].trim()
    });
  }

  // Add Index.html (The App Shell)
  files.push({
    name: 'index.html',
    path: 'index.html',
    content: htmlCode,
    language: 'html',
    isFolder: false
  });

  // Process embedded files into the structure
  embeddedFiles.forEach(f => {
    const pathParts = f.path.split('/');
    let currentLevel = files;
    let currentPath = '';

    pathParts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === pathParts.length - 1;

      const existing = currentLevel.find(item => item.name === part);

      if (existing) {
        if (existing.isFolder && existing.children) {
          currentLevel = existing.children;
        }
      } else {
        const newFile: VirtualFile = {
          name: part,
          path: currentPath,
          content: isLast ? f.content : '',
          language: determineLanguage(part),
          isFolder: !isLast,
          children: !isLast ? [] : undefined,
          isOpen: true
        };
        currentLevel.push(newFile);
        if (!isLast && newFile.children) {
          currentLevel = newFile.children;
        }
      }
    });
  });

  return sortFiles(files);
};

/**
 * Reconstructs the full HTML string by taking the edited file content 
 * and injecting it back into the original HTML shell.
 */
export const updateVirtualFile = (
  originalHtml: string, 
  filePath: string, 
  newContent: string
): string => {
  const normalizedPath = normalizePath(filePath);

  if (normalizedPath === 'index.html') {
    return newContent;
  }

  // Flexible regex that handles potential "./" variations in the source HTML
  // matches data-path="src/file.js" OR data-path="./src/file.js"
  const escapedPath = normalizedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(<script[^>]*data-path="(\\./)?${escapedPath}"[^>]*>)([\\s\\S]*?)(<\\/script>)`, 'g');

  if (regex.test(originalHtml)) {
    return originalHtml.replace(regex, `$1\n${newContent}\n$4`);
  } else {
    // Fallback: if file doesn't exist, append it
    const closingBody = '</body>';
    const newScript = `
<script type="text/plain" data-path="${normalizedPath}">
${newContent}
</script>
`;
    if (originalHtml.includes(closingBody)) {
        return originalHtml.replace(closingBody, newScript + closingBody);
    }
    return originalHtml + newScript;
  }
};

/**
 * Renames a file or directory in the virtual file system (raw HTML string).
 * Updates all matching data-path attributes.
 */
export const renameVirtualPath = (htmlCode: string, oldPath: string, newPath: string): string => {
  const cleanOld = normalizePath(oldPath);
  const cleanNew = normalizePath(newPath);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const safeOld = escapeRegExp(cleanOld);
  
  // This regex matches: data-path="oldPath" (exact file match) OR data-path="oldPath/..." (directory child match)
  // Supports optional ./ prefix in the source
  const regex = new RegExp(`(data-path=")(\\./)?${safeOld}("|\\/)`, 'g');
  
  return htmlCode.replace(regex, (match, prefix, dotSlash, separator) => {
     // We reconstruct the string. We preserve dotSlash if it existed, or just use clean new path.
     // Usually safer to just output clean path.
     return `data-path="${cleanNew}${separator === '/' ? '/' : '"'}`;
  });
};

/**
 * Removes a file from the HTML shell by deleting its script tag.
 */
export const deleteVirtualFile = (originalHtml: string, filePath: string): string => {
  const cleanPath = normalizePath(filePath);
  if (cleanPath === 'index.html') return originalHtml; // Cannot delete root

  const escapedPath = cleanPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Regex matches data-path="path" OR data-path="./path"
  const regex = new RegExp(`\\s*<script[^>]*type="text\\/plain"[^>]*data-path="(\\./)?${escapedPath}"[^>]*>[\\s\\S]*?<\\/script>`, 'g');
  
  return originalHtml.replace(regex, '');
};

const determineLanguage = (filename: string): string => {
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.jsx')) return 'jsx';
  if (filename.endsWith('.js')) return 'javascript';
  if (filename.endsWith('.tsx')) return 'tsx';
  if (filename.endsWith('.ts')) return 'typescript';
  if (filename.endsWith('.json')) return 'json';
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.tex')) return 'latex';
  return 'text';
};

const sortFiles = (files: VirtualFile[]): VirtualFile[] => {
  return files.sort((a, b) => {
    // Folders first
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    // Then alphabetical
    return a.name.localeCompare(b.name);
  });
};

/**
 * Generates a string representation of the file tree for the AI context.
 */
export const generateFileTreeString = (files: VirtualFile[], depth = 0): string => {
  let output = '';
  const indent = '  '.repeat(depth);
  
  files.forEach(file => {
    if (file.path === 'index.html' && depth === 0) return; 

    if (file.isFolder) {
      output += `${indent}📂 ${file.name}/\n`;
      if (file.children) {
        output += generateFileTreeString(file.children, depth + 1);
      }
    } else {
      output += `${indent}📄 ${file.name}\n`;
    }
  });
  
  return output;
};

/**
 * Generates a highly compact file tree for LLM context injection
 */
export const generateContextTree = (files: VirtualFile[]): string => {
    const buildTree = (nodes: VirtualFile[], prefix = ''): string => {
        let str = '';
        nodes.forEach((node, index) => {
            // Skip root index.html usually as it's implied wrapper
            if (node.path === 'index.html' && prefix === '') return;

            const isLast = index === nodes.length - 1;
            const linePrefix = prefix + (isLast ? '└── ' : '├── ');
            const childPrefix = prefix + (isLast ? '    ' : '│   ');
            
            str += `${linePrefix}${node.name}${node.isFolder ? '/' : ''}\n`;
            
            if (node.isFolder && node.children) {
                str += buildTree(node.children, childPrefix);
            }
        });
        return str;
    };
    return buildTree(files);
};

/**
 * Converts VirtualFiles to WebContainer FileSystemTree
 */
export const filesToWebContainerTree = (files: VirtualFile[]): any => {
    const tree: any = {};

    files.forEach(file => {
        if (file.isFolder) {
            tree[file.name] = {
                directory: filesToWebContainerTree(file.children || [])
            };
        } else {
            tree[file.name] = {
                file: {
                    contents: file.content
                }
            };
        }
    });

    return tree;
};
