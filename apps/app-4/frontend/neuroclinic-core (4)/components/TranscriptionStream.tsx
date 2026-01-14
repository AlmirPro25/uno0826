import React, { useEffect, useRef } from 'react';
import { TranscriptItem } from '../types';

interface TranscriptionStreamProps {
  items: TranscriptItem[];
}

const TranscriptionStream: React.FC<TranscriptionStreamProps> = ({ items }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items]);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl h-32 overflow-hidden pointer-events-none z-30 flex flex-col justify-end pb-2">
       <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
       
       <div className="relative z-10 flex flex-col gap-2 px-4">
          {items.slice(-3).map((item) => (
             <div 
                key={item.id} 
                className={`flex gap-3 items-end transition-all duration-300 ${item.source === 'AGENT' ? 'justify-start' : 'justify-end'}`}
             >
                {item.source === 'AGENT' && (
                    <div className="w-1 h-4 bg-cyan-500 rounded-full animate-pulse"></div>
                )}
                
                <div className={`
                    max-w-[80%] text-sm font-sans font-medium px-3 py-1 rounded backdrop-blur-sm
                    ${item.source === 'AGENT' 
                        ? 'text-cyan-100 bg-cyan-950/40 border-l-2 border-cyan-500/50' 
                        : 'text-emerald-100 bg-emerald-950/40 border-r-2 border-emerald-500/50 text-right'}
                `}>
                    <span className="opacity-70 text-[10px] block uppercase tracking-wider mb-0.5">
                        {item.source === 'AGENT' ? 'CORTEX AUDIO OUT' : 'AUDIO INPUT DECODED'}
                    </span>
                    {item.text}
                    {!item.isFinal && <span className="animate-pulse">_</span>}
                </div>

                {item.source === 'USER' && (
                    <div className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
             </div>
          ))}
          <div ref={bottomRef}></div>
       </div>
    </div>
  );
};

export default TranscriptionStream;
