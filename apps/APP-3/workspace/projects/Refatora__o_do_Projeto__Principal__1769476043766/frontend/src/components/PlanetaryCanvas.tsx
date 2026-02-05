
import React, { useRef, useEffect } from 'react';

// SIMULATES LIDAR SCAN OF PLANETARY SURFACE
export const PlanetaryCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let tick = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 300;
      canvas.height = canvas.parentElement?.clientHeight || 300;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      tick++;
      ctx.fillStyle = 'rgba(11, 11, 15, 0.3)'; // Trail effect
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.7;

      // Draw Planet Outline
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#C1440E';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw Rotating Atmosphere Bands (Sine waves)
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.1 + (i * 0.05)})`;
        ctx.lineWidth = 1;
        for (let x = -radius; x < radius; x += 5) {
          const y = Math.sin((x + tick * 2) * 0.02 + i) * (20 + i * 5);
          // Clip to circle
          if (x*x + y*y < radius*radius) {
            ctx.lineTo(centerX + x, centerY + y);
          }
        }
        ctx.stroke();
      }

      // Draw "Smart Dust" Particles
      for (let i = 0; i < 20; i++) {
        const angle = (tick * 0.01 + i) % (Math.PI * 2);
        const orbitR = radius * (1.2 + Math.sin(tick * 0.005 + i) * 0.1);
        const px = centerX + Math.cos(angle) * orbitR;
        const py = centerY + Math.sin(angle) * orbitR;
        
        ctx.fillStyle = '#FFF';
        ctx.fillRect(px, py, 2, 2);
      }

      frameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full opacity-80" />;
};
