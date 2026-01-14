// services/Web5Fonts.ts - Sistema de Fontes Transcendentais

export const WEB5_FONTS_CDN = `
<!-- Fontes Web 5.0 Transcendentais -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- General Sans - Neutra Sofisticada -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

<!-- Space Grotesk - Geek + Elegância -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<!-- Manrope - Limpa e Versátil -->
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet">

<!-- JetBrains Mono - Código Vivo -->
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

<!-- Playfair Display - Elegância Clássica -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
`;

export const WEB5_FONT_SYSTEM = `
:root {
  /* Sistema Tipográfico Web 5.0 */
  --font-hero: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-tech: 'Space Grotesk', sans-serif;
  --font-elegant: 'Manrope', sans-serif;
  --font-code: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Escala Tipográfica Harmônica */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  --text-5xl: 3rem;       /* 48px */
  --text-6xl: 3.75rem;    /* 60px */
  --text-7xl: 4.5rem;     /* 72px */
  --text-8xl: 6rem;       /* 96px */
  --text-9xl: 8rem;       /* 128px */
  
  /* Pesos Tipográficos */
  --font-thin: 100;
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
  --font-black: 900;
  
  /* Line Heights Perfeitos */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
}

/* Classes Tipográficas Vivas */
.text-hero {
  font-family: var(--font-hero);
  font-size: var(--text-6xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: -0.025em;
}

.text-display {
  font-family: var(--font-tech);
  font-size: var(--text-4xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-tight);
}

.text-body-large {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
}

.text-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  line-height: var(--leading-normal);
}

.text-caption {
  font-family: var(--font-elegant);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-snug);
}

.text-code {
  font-family: var(--font-code);
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  line-height: var(--leading-relaxed);
}

/* Efeitos Tipográficos Transcendentais */
.text-gradient-magic {
  background: linear-gradient(45deg, #ff0080, #00d4ff, #8b5cf6);
  background-size: 200% 200%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-flow 3s ease infinite;
}

.text-gradient-sunset {
  background: linear-gradient(135deg, #ff8800, #ff0080);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-ocean {
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-shadow-soft {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.text-shadow-strong {
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.text-shadow-neon {
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

@keyframes gradient-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Responsividade Tipográfica */
@media (max-width: 768px) {
  .text-hero {
    font-size: var(--text-4xl);
  }
  
  .text-display {
    font-size: var(--text-3xl);
  }
}

@media (max-width: 480px) {
  .text-hero {
    font-size: var(--text-3xl);
  }
  
  .text-display {
    font-size: var(--text-2xl);
  }
}
`;

export function injectWeb5Fonts(): string {
  return WEB5_FONTS_CDN;
}

export function getWeb5FontSystem(): string {
  return WEB5_FONT_SYSTEM;
}