import React, { useEffect, useRef } from 'react';

interface Props {
  imageUrl: string;
  isSpeaking: boolean;
  audioData?: number; // Normalized 0-1 volume level if available, or just use boolean state
}

const AvatarDisplay: React.FC<Props> = ({ imageUrl, isSpeaking }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Simple CSS-based breathing/speaking animation
  // In a real production app, we might use canvas mesh deformation, 
  // but here we simulate speech presence with scale and brightness pulses.
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl">
      {/* Background Tech Mesh */}
      <div className="absolute inset-0 opacity-20" 
           style={{
             backgroundImage: 'radial-gradient(circle at 50% 50%, #06b6d4 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }} 
      />
      
      {imageUrl ? (
        <div className="relative w-full h-full flex items-end justify-center">
            {/* The Avatar Image */}
            <img 
              src={imageUrl} 
              alt="AI Nurse" 
              className={`max-w-none h-[110%] object-cover transition-transform duration-100 ease-out ${
                isSpeaking ? 'scale-105 brightness-110' : 'scale-100 brightness-90'
              }`}
              style={{
                filter: isSpeaking ? 'drop-shadow(0 0 15px rgba(6,182,212,0.5))' : 'none',
                // Subtle breathing animation when idle
                animation: !isSpeaking ? 'breathe 4s ease-in-out infinite' : 'none'
              }}
            />
            
            {/* Holographic Overlay Scanlines */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-cyan-900/50 via-transparent to-transparent opacity-40 mix-blend-overlay"></div>
            <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-cyan-500 animate-pulse">
          Gerando Avatar Neural...
        </div>
      )}

      {/* Speaking Indicator Ring */}
      <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
        isSpeaking ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}>
         <div className="flex space-x-1 items-end h-8">
            <div className="w-1 bg-cyan-400 animate-[bounce_0.8s_infinite] h-4"></div>
            <div className="w-1 bg-cyan-400 animate-[bounce_0.6s_infinite] h-6"></div>
            <div className="w-1 bg-cyan-400 animate-[bounce_1.0s_infinite] h-8"></div>
            <div className="w-1 bg-cyan-400 animate-[bounce_0.6s_infinite] h-6"></div>
            <div className="w-1 bg-cyan-400 animate-[bounce_0.8s_infinite] h-4"></div>
         </div>
      </div>
      
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1.0); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
};

export default AvatarDisplay;