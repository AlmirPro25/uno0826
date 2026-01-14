import prettier from 'prettier';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
import parserPostcss from 'prettier/parser-postcss';
import parserTypescript from 'prettier/parser-typescript';
import parserMarkdown from 'prettier/parser-markdown';

export const formatCode = async (code: string, filePath: string): Promise<string> => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  let parser = 'babel';
  let plugins = [parserBabel, parserHtml, parserPostcss, parserTypescript, parserMarkdown];

  switch (extension) {
    case 'html':
      parser = 'html';
      break;
    case 'css':
    case 'scss':
    case 'less':
      parser = 'css';
      break;
    case 'json':
      parser = 'json'; // Handled by babel parser usually, but lets be safe
      break;
    case 'ts':
    case 'tsx':
      parser = 'typescript';
      break;
    case 'md':
      parser = 'markdown';
      break;
    case 'js':
    case 'jsx':
    default:
      parser = 'babel';
      break;
  }

  try {
    // @ts-ignore - Prettier types in browser can be tricky with imports
    const formatted = await prettier.format(code, {
      parser,
      plugins,
      printWidth: 80,
      tabWidth: 2,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
    });
    return formatted;
  } catch (error) {
    console.error('Prettier format error:', error);
    // Return original code if formatting fails (e.g. syntax error)
    return code;
  }
};