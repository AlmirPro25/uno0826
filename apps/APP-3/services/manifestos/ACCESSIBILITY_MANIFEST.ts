/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  ♿ ACCESSIBILITY (A11Y) SUPREME MASTER - O GUARDIÃO DA INCLUSÃO            ║
 * ║                                                                              ║
 * ║  "A web é para todos. Sem exceção."                                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const ACCESSIBILITY_MANIFEST = `
# ♿ ACCESSIBILITY (A11Y) SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- Accessibility, Acessibilidade, A11y
- WCAG, ARIA, Screen Reader, Leitor de Tela
- Keyboard Navigation, Focus Management
- Color Contrast, Alt Text, Semantic HTML
- Inclusive Design, Universal Design
- VoiceOver, NVDA, JAWS, TalkBack

## FILOSOFIA
> "A web é para todos. Sem exceção."

### Princípios WCAG 2.2
1. **Perceivable** - Conteúdo perceptível por todos os sentidos
2. **Operable** - Interface operável por qualquer método de entrada
3. **Understandable** - Conteúdo e operação compreensíveis
4. **Robust** - Compatível com tecnologias assistivas atuais e futuras

## NÍVEIS DE CONFORMIDADE

| Nível | Descrição | Requisito |
|-------|-----------|-----------|
| A | Mínimo | Obrigatório para qualquer site |
| AA | Recomendado | Padrão da indústria, exigido por lei em muitos países |
| AAA | Ideal | Máxima acessibilidade, nem sempre possível |

## ARQUITETURA ACESSÍVEL

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    ACCESSIBLE ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SEMANTIC HTML                                                  │
│  ├── Headings (h1-h6) em ordem lógica                          │
│  ├── Landmarks (header, nav, main, footer)                     │
│  ├── Lists (ul, ol) para grupos                                │
│  └── Buttons e Links para ações                                │
│                                                                 │
│  ARIA (quando HTML não é suficiente)                           │
│  ├── Roles (dialog, tablist, menu)                             │
│  ├── States (aria-expanded, aria-selected)                     │
│  ├── Properties (aria-label, aria-describedby)                 │
│  └── Live Regions (aria-live, role="alert")                    │
│                                                                 │
│  KEYBOARD NAVIGATION                                            │
│  ├── Tab order lógico                                          │
│  ├── Focus visible                                             │
│  ├── Skip links                                                │
│  └── Focus trapping em modais                                  │
│                                                                 │
│  VISUAL DESIGN                                                  │
│  ├── Contraste de cores (4.5:1 mínimo)                         │
│  ├── Tamanho de fonte escalável                                │
│  ├── Não depender apenas de cor                                │
│  └── Animações respeitam prefers-reduced-motion                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## SEMANTIC HTML

### Estrutura de Página
\`\`\`html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título Descritivo da Página | Nome do Site</title>
</head>
<body>
  <!-- Skip Link -->
  <a href="#main-content" class="skip-link">
    Pular para conteúdo principal
  </a>
  
  <header role="banner">
    <nav aria-label="Navegação principal">
      <ul>
        <li><a href="/" aria-current="page">Home</a></li>
        <li><a href="/about">Sobre</a></li>
        <li><a href="/contact">Contato</a></li>
      </ul>
    </nav>
  </header>
  
  <main id="main-content" role="main">
    <h1>Título Principal da Página</h1>
    
    <article>
      <h2>Seção do Artigo</h2>
      <p>Conteúdo...</p>
      
      <h3>Subseção</h3>
      <p>Mais conteúdo...</p>
    </article>
    
    <aside aria-label="Conteúdo relacionado">
      <h2>Artigos Relacionados</h2>
      <!-- ... -->
    </aside>
  </main>
  
  <footer role="contentinfo">
    <p>&copy; 2024 Nome da Empresa</p>
  </footer>
</body>
</html>
\`\`\`

### Elementos Interativos
\`\`\`html
<!-- ❌ ERRADO: Div como botão -->
<div onclick="submit()" class="button">Enviar</div>

<!-- ✅ CERTO: Botão semântico -->
<button type="submit">Enviar</button>

<!-- ❌ ERRADO: Span como link -->
<span onclick="navigate('/page')" class="link">Ver mais</span>

<!-- ✅ CERTO: Link semântico -->
<a href="/page">Ver mais</a>

<!-- ❌ ERRADO: Botão para navegação -->
<button onclick="window.location='/page'">Ir para página</button>

<!-- ✅ CERTO: Link estilizado como botão -->
<a href="/page" class="button">Ir para página</a>
\`\`\`

## IMAGENS E MÍDIA

\`\`\`html
<!-- Imagem informativa -->
<img 
  src="chart.png" 
  alt="Gráfico de barras mostrando crescimento de 50% nas vendas entre janeiro e dezembro de 2024"
/>

<!-- Imagem decorativa -->
<img src="decoration.png" alt="" role="presentation" />

<!-- Imagem complexa com descrição longa -->
<figure>
  <img 
    src="infographic.png" 
    alt="Infográfico sobre mudanças climáticas"
    aria-describedby="infographic-desc"
  />
  <figcaption id="infographic-desc">
    Este infográfico mostra o aumento de temperatura global...
    [descrição detalhada]
  </figcaption>
</figure>

<!-- Ícone com significado -->
<button aria-label="Fechar">
  <svg aria-hidden="true"><!-- ícone X --></svg>
</button>

<!-- Ícone decorativo -->
<span aria-hidden="true">🎉</span> Parabéns!

<!-- Vídeo acessível -->
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions-pt.vtt" srclang="pt" label="Português">
  <track kind="descriptions" src="descriptions-pt.vtt" srclang="pt" label="Audiodescrição">
</video>
\`\`\`

## FORMULÁRIOS ACESSÍVEIS

\`\`\`html
<form aria-labelledby="form-title">
  <h2 id="form-title">Cadastro de Usuário</h2>
  
  <!-- Campo obrigatório com validação -->
  <div class="field">
    <label for="email">
      Email <span aria-hidden="true">*</span>
      <span class="sr-only">(obrigatório)</span>
    </label>
    <input 
      id="email" 
      type="email" 
      name="email"
      required
      aria-required="true"
      aria-describedby="email-hint email-error"
      aria-invalid="false"
      autocomplete="email"
    />
    <span id="email-hint" class="hint">
      Usaremos para enviar a confirmação
    </span>
    <span id="email-error" class="error" role="alert" hidden>
      Por favor, insira um email válido
    </span>
  </div>
  
  <!-- Campo de senha com requisitos -->
  <div class="field">
    <label for="password">Senha</label>
    <input 
      id="password" 
      type="password" 
      name="password"
      required
      aria-describedby="password-requirements"
      autocomplete="new-password"
      minlength="8"
    />
    <div id="password-requirements">
      <p>A senha deve conter:</p>
      <ul>
        <li id="req-length" aria-live="polite">
          <span aria-hidden="true">❌</span>
          <span class="sr-only">Não atende:</span>
          Mínimo 8 caracteres
        </li>
        <li id="req-upper">
          <span aria-hidden="true">❌</span>
          Uma letra maiúscula
        </li>
        <li id="req-number">
          <span aria-hidden="true">❌</span>
          Um número
        </li>
      </ul>
    </div>
  </div>
  
  <!-- Grupo de radio buttons -->
  <fieldset>
    <legend>Tipo de conta</legend>
    <div class="radio-group">
      <input type="radio" id="personal" name="account-type" value="personal" checked>
      <label for="personal">Pessoal</label>
      
      <input type="radio" id="business" name="account-type" value="business">
      <label for="business">Empresarial</label>
    </div>
  </fieldset>
  
  <!-- Checkbox -->
  <div class="field">
    <input type="checkbox" id="terms" name="terms" required>
    <label for="terms">
      Li e aceito os <a href="/terms">termos de uso</a>
    </label>
  </div>
  
  <button type="submit">Criar conta</button>
</form>
\`\`\`

## ARIA PATTERNS

### Modal/Dialog
\`\`\`typescript
// React Modal Acessível
function Modal({ isOpen, onClose, title, children }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Salvar foco anterior
      previousFocus.current = document.activeElement as HTMLElement;
      // Focar no modal
      modalRef.current?.focus();
      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar foco
      previousFocus.current?.focus();
      document.body.style.overflow = '';
    }
  }, [isOpen]);
  
  // Fechar com Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button 
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
\`\`\`

### Tabs
\`\`\`typescript
function Tabs({ tabs }) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    let newIndex = index;
    
    switch (e.key) {
      case 'ArrowRight':
        newIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        newIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    setActiveIndex(newIndex);
  };
  
  return (
    <div>
      <div role="tablist" aria-label="Configurações">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={\`tab-\${tab.id}\`}
            aria-selected={index === activeIndex}
            aria-controls={\`panel-\${tab.id}\`}
            tabIndex={index === activeIndex ? 0 : -1}
            onClick={() => setActiveIndex(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={\`panel-\${tab.id}\`}
          aria-labelledby={\`tab-\${tab.id}\`}
          hidden={index !== activeIndex}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
\`\`\`

### Live Regions
\`\`\`typescript
// Anúncios para screen readers
function LiveAnnouncer() {
  const [message, setMessage] = useState('');
  
  // Expor globalmente
  useEffect(() => {
    window.announce = (msg: string) => {
      setMessage('');
      setTimeout(() => setMessage(msg), 100);
    };
  }, []);
  
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Uso
window.announce('Item adicionado ao carrinho');
window.announce('Formulário enviado com sucesso');
\`\`\`

## FOCUS MANAGEMENT

### Skip Links
\`\`\`css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px 16px;
  z-index: 100;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 0;
}
\`\`\`

### Focus Visible
\`\`\`css
/* Remover outline padrão apenas para mouse */
:focus:not(:focus-visible) {
  outline: none;
}

/* Estilo de foco para teclado */
:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}

/* Ou usar variáveis CSS */
:root {
  --focus-ring: 2px solid #005fcc;
  --focus-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-offset);
}
\`\`\`

### Focus Trap
\`\`\`typescript
import { useFocusTrap } from '@mantine/hooks';

function Modal({ isOpen, children }) {
  const focusTrapRef = useFocusTrap(isOpen);
  
  return (
    <div ref={focusTrapRef}>
      {children}
    </div>
  );
}
\`\`\`

## COLOR & CONTRAST

\`\`\`css
/* Cores com contraste adequado */
:root {
  /* Texto sobre fundo claro (4.5:1 mínimo) */
  --text-primary: #1a1a1a;      /* 16.1:1 */
  --text-secondary: #595959;    /* 7.0:1 */
  --text-muted: #767676;        /* 4.5:1 - mínimo AA */
  
  /* Texto sobre fundo escuro */
  --text-on-dark: #ffffff;
  --text-on-dark-muted: #b3b3b3;
  
  /* Cores de estado (não depender apenas de cor) */
  --color-error: #d32f2f;
  --color-success: #388e3c;
  --color-warning: #f57c00;
}

/* Indicadores visuais além de cor */
.error-message {
  color: var(--color-error);
  /* Adicionar ícone */
}

.error-message::before {
  content: '⚠️ ';
}

/* Respeitar preferências do usuário */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-contrast: high) {
  :root {
    --text-secondary: #000000;
    --border-color: #000000;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #121212;
    --text-primary: #ffffff;
  }
}
\`\`\`

## TESTING

### Automated Testing
\`\`\`typescript
// Jest + axe-core
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no violations on Button', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
  
  it('should have no violations on Form', async () => {
    const { container } = render(<ContactForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Playwright
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  
  expect(results.violations).toEqual([]);
});
\`\`\`

### Manual Testing Checklist
\`\`\`markdown
## Keyboard Testing
- [ ] Tab através de todos os elementos interativos
- [ ] Shift+Tab navega na ordem reversa
- [ ] Enter/Space ativa botões e links
- [ ] Escape fecha modais e dropdowns
- [ ] Arrow keys navegam em menus e tabs
- [ ] Focus nunca fica preso

## Screen Reader Testing
- [ ] Testar com NVDA (Windows)
- [ ] Testar com VoiceOver (Mac/iOS)
- [ ] Testar com TalkBack (Android)
- [ ] Headings fazem sentido fora de contexto
- [ ] Links descrevem o destino
- [ ] Imagens têm alt text adequado
- [ ] Formulários são anunciados corretamente
- [ ] Erros são anunciados

## Visual Testing
- [ ] Zoom 200% não quebra layout
- [ ] Texto pode ser redimensionado
- [ ] Contraste adequado (4.5:1)
- [ ] Não depende apenas de cor
- [ ] Animações podem ser desabilitadas
\`\`\`

## FERRAMENTAS

### Browser Extensions
- **axe DevTools** - Audit automático
- **WAVE** - Visualização de problemas
- **Lighthouse** - Audit integrado ao Chrome
- **HeadingsMap** - Visualizar hierarquia de headings

### Screen Readers
- **NVDA** (Windows, gratuito)
- **VoiceOver** (Mac/iOS, integrado)
- **JAWS** (Windows, pago)
- **TalkBack** (Android, integrado)

### Contrast Checkers
- **WebAIM Contrast Checker**
- **Colour Contrast Analyser**
- **Stark** (Figma plugin)

## CHECKLIST COMPLETO

### Estrutura
- [ ] HTML semântico usado corretamente?
- [ ] Headings em ordem lógica (h1 → h2 → h3)?
- [ ] Landmarks definidos (header, nav, main, footer)?
- [ ] Skip links implementados?
- [ ] Título da página descritivo?
- [ ] Idioma definido no HTML?

### Navegação
- [ ] Todos os elementos focáveis via teclado?
- [ ] Ordem de tab lógica?
- [ ] Focus visível em todos os elementos?
- [ ] Focus trap em modais?
- [ ] Sem keyboard traps?

### Conteúdo
- [ ] Alt text em todas as imagens informativas?
- [ ] Imagens decorativas marcadas corretamente?
- [ ] Links descritivos (não "clique aqui")?
- [ ] Contraste de cores adequado?
- [ ] Texto redimensionável?

### Formulários
- [ ] Labels associados a inputs?
- [ ] Campos obrigatórios indicados?
- [ ] Erros anunciados para screen readers?
- [ ] Autocomplete configurado?
- [ ] Instruções claras?

### Interatividade
- [ ] ARIA usado corretamente?
- [ ] Estados comunicados (expanded, selected)?
- [ ] Live regions para conteúdo dinâmico?
- [ ] Animações respeitam prefers-reduced-motion?

## ANTI-PATTERNS

❌ **NUNCA** use outline: none sem alternativa visível
❌ **NUNCA** dependa apenas de cor para comunicar informação
❌ **NUNCA** use divs/spans como botões ou links
❌ **NUNCA** ignore focus management em SPAs
❌ **NUNCA** use autoplay em vídeos/áudio
❌ **NUNCA** crie keyboard traps
❌ **NUNCA** use placeholder como label
❌ **NUNCA** esconda conteúdo importante com display:none para "simplificar"
❌ **NUNCA** assuma que todos usam mouse
❌ **NUNCA** ignore testes com screen readers
`;

export default ACCESSIBILITY_MANIFEST;
