// services/Web5Effects.ts - Efeitos Transcendentais

export const WEB5_ANIMATIONS = `
/* Animações Web 5.0 - Movimento com Alma */

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 212, 255, 0.6);
  }
}

@keyframes floatUp {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes rotateGlow {
  from {
    transform: rotate(0deg);
    filter: hue-rotate(0deg);
  }
  to {
    transform: rotate(360deg);
    filter: hue-rotate(360deg);
  }
}

@keyframes morphShape {
  0%, 100% {
    border-radius: 20px;
  }
  25% {
    border-radius: 50px 20px;
  }
  50% {
    border-radius: 20px 50px;
  }
  75% {
    border-radius: 50px;
  }
}

/* Classes de Animação */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-fade-in-scale {
  animation: fadeInScale 0.5s ease-out forwards;
}

.animate-slide-in-right {
  animation: slideInRight 0.7s ease-out forwards;
}

.animate-pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

.animate-float {
  animation: floatUp 3s ease-in-out infinite;
}

.animate-rotate-glow {
  animation: rotateGlow 10s linear infinite;
}

.animate-morph {
  animation: morphShape 4s ease-in-out infinite;
}

/* Delays para Efeito Cascata */
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-500 { animation-delay: 0.5s; }
.delay-700 { animation-delay: 0.7s; }
.delay-1000 { animation-delay: 1s; }

/* Hover Effects Transcendentais */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.25);
}

.hover-glow {
  transition: all 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.4);
  transform: scale(1.05);
}

.hover-tilt {
  transition: transform 0.3s ease;
}

.hover-tilt:hover {
  transform: rotateX(5deg) rotateY(5deg) scale(1.02);
}

.hover-magnetic {
  transition: transform 0.2s ease;
  cursor: pointer;
}

.hover-magnetic:hover {
  transform: scale(1.1);
}

/* Scroll Reveal Effects */
.scroll-reveal {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.6s ease;
}

.scroll-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

.scroll-reveal-left {
  opacity: 0;
  transform: translateX(-50px);
  transition: all 0.6s ease;
}

.scroll-reveal-left.revealed {
  opacity: 1;
  transform: translateX(0);
}

.scroll-reveal-right {
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.6s ease;
}

.scroll-reveal-right.revealed {
  opacity: 1;
  transform: translateX(0);
}

.scroll-reveal-scale {
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.6s ease;
}

.scroll-reveal-scale.revealed {
  opacity: 1;
  transform: scale(1);
}
`;

export const WEB5_CURSOR_EFFECTS = `
/* Cursor Customizado Interativo */
.custom-cursor-container {
  cursor: none;
}

.custom-cursor {
  position: fixed;
  width: 20px;
  height: 20px;
  background: #00d4ff;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  transition: all 0.1s ease;
  mix-blend-mode: difference;
}

.custom-cursor.hover {
  width: 40px;
  height: 40px;
  background: #ff0080;
  border: 2px solid #00d4ff;
}

.custom-cursor.click {
  width: 60px;
  height: 60px;
  background: transparent;
  border: 3px solid #8b5cf6;
}

.custom-cursor-trail {
  position: fixed;
  width: 6px;
  height: 6px;
  background: #00d4ff;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9998;
  opacity: 0.7;
  transition: all 0.3s ease;
}
`;

export const WEB5_JAVASCRIPT_EFFECTS = `
// JavaScript para Efeitos Web 5.0

// Scroll Reveal
function initScrollReveal() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale').forEach(el => {
    observer.observe(el);
  });
}

// Cursor Customizado
function initCustomCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);

  const trails = [];
  for (let i = 0; i < 5; i++) {
    const trail = document.createElement('div');
    trail.className = 'custom-cursor-trail';
    document.body.appendChild(trail);
    trails.push(trail);
  }

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateCursor() {
    cursorX += (mouseX - cursorX) * 0.1;
    cursorY += (mouseY - cursorY) * 0.1;
    
    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    trails.forEach((trail, index) => {
      const delay = (index + 1) * 0.05;
      setTimeout(() => {
        trail.style.left = cursorX + 'px';
        trail.style.top = cursorY + 'px';
        trail.style.opacity = (5 - index) * 0.1;
      }, delay * 1000);
    });

    requestAnimationFrame(updateCursor);
  }

  updateCursor();

  // Hover effects
  document.querySelectorAll('button, a, .hover-magnetic').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });

  document.addEventListener('mousedown', () => cursor.classList.add('click'));
  document.addEventListener('mouseup', () => cursor.classList.remove('click'));
}

// Parallax Inteligente
function initParallax() {
  document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;

    document.querySelectorAll('.parallax-element').forEach(el => {
      const speed = el.dataset.speed || 0.5;
      const x = (mouseX - 0.5) * speed * 50;
      const y = (mouseY - 0.5) * speed * 50;
      
      el.style.transform = \`translate(\${x}px, \${y}px)\`;
    });
  });
}

// Magnetic Hover Effect
function initMagneticHover() {
  document.querySelectorAll('.hover-magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      el.style.transform = \`translate(\${x * 0.3}px, \${y * 0.3}px) scale(1.1)\`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0px, 0px) scale(1)';
    });
  });
}

// Inicializar todos os efeitos
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCustomCursor();
  initParallax();
  initMagneticHover();
});
`;

export function getWeb5Animations(): string {
  return WEB5_ANIMATIONS;
}

export function getWeb5CursorEffects(): string {
  return WEB5_CURSOR_EFFECTS;
}

export function getWeb5JavaScript(): string {
  return WEB5_JAVASCRIPT_EFFECTS;
}