import React, { useEffect, useRef } from 'react';

interface NeuralOscilloscopeProps {
    audioLevel: number;
    isActive: boolean;
    color: string;
}

const NeuralOscilloscope: React.FC<NeuralOscilloscopeProps> = ({ audioLevel, isActive, color }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let time = 0;

        // Waveform parameters
        const points: number[] = [];
        const maxPoints = 100;
        const speed = 2;

        const render = () => {
            time += speed;

            // Calculate Wave Height based on Audio Level + a base "heartbeat"
            const baseActivity = isActive ? Math.sin(time * 0.1) * 5 : 1;
            const reaction = (audioLevel * 100) * (Math.random() > 0.5 ? 1 : -1);
            const y = (canvas.height / 2) + baseActivity + reaction;

            points.push(y);
            if (points.length > maxPoints) points.shift();

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Grid (Medical Monitor Style)
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let i = 0; i < canvas.width; i += 20) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
            for (let i = 0; i < canvas.height; i += 20) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
            ctx.stroke();

            // Draw Wave
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;

            ctx.beginPath();
            for (let i = 0; i < points.length; i++) {
                const x = (i / maxPoints) * canvas.width;
                if (i === 0) ctx.moveTo(x, points[i]);
                else ctx.lineTo(x, points[i]);
            }
            ctx.stroke();

            // Draw "Leading Dot"
            if (points.length > 0) {
                const lastX = ((points.length - 1) / maxPoints) * canvas.width;
                const lastY = points[points.length - 1];
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            animationId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationId);
    }, [audioLevel, isActive, color]);

    return (
        <div className="w-full h-24 bg-slate-950 border-t border-b border-slate-800 relative overflow-hidden">
            <canvas ref={canvasRef} width={600} height={100} className="w-full h-full" />
            <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                NEURAL.OSCILLATOR // {isActive ? 'ACTIVE' : 'STANDBY'}
            </div>
        </div>
    );
};

export default NeuralOscilloscope;
