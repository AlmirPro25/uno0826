/**
 * 💬 MessageBubble - Balão de mensagem entre agentes
 */

import React from 'react';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  from: string;
  to: string;
  subject: string;
  content: string;
  type: 'request' | 'response' | 'broadcast' | 'contract' | 'artifact' | 'feedback';
  timestamp: Date;
  fromPosition: { x: number; y: number };
  toPosition: { x: number; y: number };
}

const typeStyles = {
  request: { bg: 'bg-blue-600', icon: '❓', label: 'Pergunta' },
  response: { bg: 'bg-green-600', icon: '💬', label: 'Resposta' },
  broadcast: { bg: 'bg-purple-600', icon: '📢', label: 'Broadcast' },
  contract: { bg: 'bg-yellow-600', icon: '📜', label: 'Contrato' },
  artifact: { bg: 'bg-orange-600', icon: '📦', label: 'Artefato' },
  feedback: { bg: 'bg-pink-600', icon: '🔍', label: 'Feedback' }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  from,
  to,
  subject,
  content,
  type,
  timestamp,
  fromPosition,
  toPosition
}) => {
  const style = typeStyles[type] || typeStyles.response;
  
  // Calcular posição do balão (meio do caminho)
  const midX = (fromPosition.x + toPosition.x) / 2;
  const midY = (fromPosition.y + toPosition.y) / 2;

  return (
    <>
      {/* Linha conectando os agentes */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <motion.line
          x1={fromPosition.x}
          y1={fromPosition.y}
          x2={toPosition.x}
          y2={toPosition.y}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      
      {/* Balão de mensagem */}
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`
          absolute ${style.bg} rounded-lg p-3 shadow-xl
          max-w-xs z-10
        `}
        style={{ 
          left: midX, 
          top: midY - 60,
          transform: 'translateX(-50%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{style.icon}</span>
          <span className="text-xs text-white/70">{style.label}</span>
          <span className="text-xs text-white/50 ml-auto">
            {timestamp.toLocaleTimeString()}
          </span>
        </div>
        
        {/* Subject */}
        <p className="text-sm font-semibold text-white mb-1">{subject}</p>
        
        {/* Content preview */}
        <p className="text-xs text-white/80 line-clamp-2">{content}</p>
        
        {/* Arrow pointing down */}
        <div 
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 
            w-0 h-0 border-l-8 border-r-8 border-t-8 
            border-l-transparent border-r-transparent ${style.bg.replace('bg-', 'border-t-')}`}
        />
      </motion.div>
    </>
  );
};

export default MessageBubble;
