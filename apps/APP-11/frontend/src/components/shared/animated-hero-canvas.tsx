
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export function AnimatedHeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();
  const particles = useRef<Particle[]>([]);
  const isMounted = useRef(true);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }, []);

  const createParticle = useCallback((canvas: HTMLCanvasElement): Particle => {
    const radius = Math.random() * 2 + 0.5;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = (Math.random() - 0.5) * 0.5; // Slower velocity
    const vy = (Math.random() - 0.5) * 0.5;
    const color = `rgba(100, 100, 250, ${Math.random() * 0.3 + 0.1})`; // Lighter, more transparent blueish
    return { x, y, vx, vy, radius, color };
  }, []);

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      particles.current = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 10000); // Density-based
      for (let i = 0; i < numParticles; i++) {
        particles.current.push(createParticle(canvas));
      }
    }
  }, [createParticle]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas

    particles.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap particles around the screen
      if (p.x < 0 - p.radius) p.x = canvas.width + p.radius;
      if (p.x > canvas.width + p.radius) p.x = 0 - p.radius;
      if (p.y < 0 - p.radius) p.y = canvas.height + p.radius;
      if (p.y > canvas.height + p.radius) p.y = 0 - p.radius;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    if (isMounted.current) {
      animationFrameId.current = requestAnimationFrame(() => draw(ctx, canvas));
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    resizeCanvas();
    initParticles();
    animationFrameId.current = requestAnimationFrame(() => draw(ctx, canvas));

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles(); // Re-initialize particles on resize
    });

    return () => {
      isMounted.current = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [draw, resizeCanvas, initParticles]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full -z-10 opacity-70"
    />
  );
}
