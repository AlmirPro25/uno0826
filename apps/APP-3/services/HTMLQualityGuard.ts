// services/HTMLQualityGuard.ts
// Sistema que garante HTML perfeito - nunca mais tela branca!

export class HTMLQualityGuard {
  
  /**
   * Instruções obrigatórias que devem ser incluídas em TODOS os prompts de geração HTML
   */
  static getHTMLQualityInstructions(): string {
    return `
🎯 **INSTRUÇÕES CRÍTICAS - HTML PERFEITO (NUNCA ESQUECER):**

**ESTRUTURA OBRIGATÓRIA:**
1. SEMPRE começar com: <!DOCTYPE html>
2. SEMPRE incluir: <html lang="pt-BR">
3. SEMPRE incluir: <meta charset="UTF-8">
4. SEMPRE incluir: <meta name="viewport" content="width=device-width, initial-scale=1.0">
5. SEMPRE fechar TODAS as tags
6. SEMPRE incluir conteúdo VISÍVEL no body

**CSS OBRIGATÓRIO:**
- Reset básico: * { margin: 0; padding: 0; box-sizing: border-box; }
- Body com font-family, color e background definidos
- Cores CONTRASTANTES (nunca branco no branco)
- Estrutura responsiva

**CONTEÚDO OBRIGATÓRIO:**
- Header com título principal
- Main com conteúdo principal
- Footer com informações básicas
- Texto VISÍVEL e LEGÍVEL

**JAVASCRIPT OBRIGATÓRIO:**
- Sempre dentro de DOMContentLoaded
- Sem erros de sintaxe
- Console.log para confirmar carregamento

**TEMPLATE BASE (USAR COMO REFERÊNCIA):**
\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Funcional</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', sans-serif; 
            color: #333; 
            background: linear-gradient(135deg, #667eea, #764ba2); 
            min-height: 100vh; 
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header, main, footer { 
            background: rgba(255,255,255,0.95); 
            padding: 20px; 
            border-radius: 10px; 
            margin-bottom: 20px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <header><h1>Título</h1></header>
        <main><p>Conteúdo visível</p></main>
        <footer><p>Footer</p></footer>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            console.log('✅ Site carregado!');
        });
    </script>
</body>
</html>
\`\`\`

🚨 **NUNCA GERAR HTML SEM SEGUIR ESTAS REGRAS!**
`;
  }

  /**
   * Valida se o HTML gerado segue as regras básicas
   */
  static validateHTML(html: string): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificações críticas
    if (!html.includes('<!DOCTYPE html>')) {
      errors.push('❌ DOCTYPE ausente');
    }

    if (!html.includes('<html')) {
      errors.push('❌ Tag <html> ausente');
    }

    if (!html.includes('<head>')) {
      errors.push('❌ Tag <head> ausente');
    }

    if (!html.includes('<body>')) {
      errors.push('❌ Tag <body> ausente');
    }

    if (!html.includes('charset="UTF-8"')) {
      errors.push('❌ Charset UTF-8 ausente');
    }

    if (!html.includes('viewport')) {
      warnings.push('⚠️ Meta viewport ausente');
    }

    if (!html.includes('<title>')) {
      warnings.push('⚠️ Tag <title> ausente');
    }

    // Verificar se há conteúdo visível
    const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/s);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1];
      const textContent = bodyContent.replace(/<[^>]*>/g, '').trim();
      if (textContent.length < 10) {
        errors.push('❌ Body sem conteúdo visível suficiente');
      }
    }

    // Verificar tags não fechadas (básico)
    const openTags = html.match(/<(\w+)[^>]*>/g) || [];
    const closeTags = html.match(/<\/(\w+)>/g) || [];
    
    if (openTags.length > closeTags.length + 5) { // +5 para tags auto-fechadas
      warnings.push('⚠️ Possíveis tags não fechadas');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Corrige problemas básicos no HTML
   */
  static fixBasicIssues(html: string): string {
    let fixedHtml = html;

    // Adicionar DOCTYPE se ausente
    if (!fixedHtml.includes('<!DOCTYPE html>')) {
      fixedHtml = '<!DOCTYPE html>\n' + fixedHtml;
    }

    // Adicionar charset se ausente
    if (!fixedHtml.includes('charset=')) {
      fixedHtml = fixedHtml.replace(
        '<head>',
        '<head>\n    <meta charset="UTF-8">'
      );
    }

    // Adicionar viewport se ausente
    if (!fixedHtml.includes('viewport')) {
      fixedHtml = fixedHtml.replace(
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    }

    // Adicionar título se ausente
    if (!fixedHtml.includes('<title>')) {
      fixedHtml = fixedHtml.replace(
        '</head>',
        '    <title>Site Gerado</title>\n</head>'
      );
    }

    return fixedHtml;
  }

  /**
   * Gera um HTML de emergência quando tudo falha
   */
  static getEmergencyHTML(userPrompt: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Funcional</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            max-width: 800px;
            background: rgba(255,255,255,0.95);
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        
        p {
            margin-bottom: 20px;
            font-size: 1.1em;
            color: #555;
        }
        
        .prompt-box {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-style: italic;
        }
        
        .status {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Site Funcional</h1>
        <p>Este é um HTML de emergência que sempre funciona no canvas.</p>
        
        <div class="prompt-box">
            <strong>Prompt do usuário:</strong><br>
            "${userPrompt.substring(0, 200)}..."
        </div>
        
        <p>O sistema detectou um problema na geração do HTML original e ativou este template de segurança.</p>
        
        <div class="status">
            ✅ <strong>Status:</strong> HTML válido e funcional carregado com sucesso!
        </div>
    </div>
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.log('✅ HTML de emergência carregado com sucesso!');
            console.log('📝 Prompt original:', '${userPrompt.substring(0, 100)}...');
            
            // Adicionar interatividade básica
            const container = document.querySelector('.container');
            if (container) {
                container.addEventListener('click', function() {
                    alert('HTML de emergência funcionando perfeitamente!\\n\\nEste template garante que sempre há algo visível no canvas.');
                });
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * Relatório de qualidade do HTML
   */
  static generateQualityReport(html: string): string {
    const validation = this.validateHTML(html);
    
    let report = '📊 **RELATÓRIO DE QUALIDADE HTML:**\n\n';
    
    if (validation.isValid) {
      report += '✅ **Status:** HTML VÁLIDO\n';
    } else {
      report += '❌ **Status:** HTML COM PROBLEMAS\n';
    }
    
    if (validation.errors.length > 0) {
      report += '\n🚨 **ERROS CRÍTICOS:**\n';
      validation.errors.forEach(error => {
        report += `- ${error}\n`;
      });
    }
    
    if (validation.warnings.length > 0) {
      report += '\n⚠️ **AVISOS:**\n';
      validation.warnings.forEach(warning => {
        report += `- ${warning}\n`;
      });
    }
    
    if (validation.isValid) {
      report += '\n🎉 **Resultado:** Site deve aparecer perfeitamente no canvas!';
    } else {
      report += '\n🔧 **Ação:** Corrigir erros antes de usar no canvas.';
    }
    
    return report;
  }
}