import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  color: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    const lines = 30;
    
    const animate = () => {
      time += 0.1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const gap = width / lines;

      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;

      for (let i = 0; i < lines; i++) {
        const x = i * gap + gap / 2;
        let amplitude = 0;

        if (isActive) {
           // Simulate a wave based on "breathing" or talking
           const distanceToCenter = Math.abs(i - lines / 2);
           const falloff = Math.max(0, 1 - distanceToCenter / (lines / 2));
           amplitude = Math.sin(time + i * 0.5) * 20 * falloff * (0.5 + Math.random() * 0.5);
        } else {
            amplitude = 2; // Idle state
        }

        ctx.beginPath();
        ctx.moveTo(x, centerY - amplitude);
        ctx.lineTo(x, centerY + amplitude);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [isActive, color]);

  return <canvas ref={canvasRef} width={300} height={100} className="w-full h-full" />;
};

export default AudioVisualizer;