/**
 * 🤖 AgentNode - Representação visual de um agente na God View
 */

import React from 'react';
import { motion } from 'framer-motion';

interface AgentNodeProps {
  id: string;
  name: string;
  domain: string;
  status: 'idle' | 'working' | 'waiting' | 'reviewing' | 'done';
  position: { x: number; y: number };
  isSelected?: boolean;
  artifactCount: number;
  onClick?: () => void;
}

const statusColors = {
  idle: { bg: 'bg-gray-500', ring: 'ring-gray-400', pulse: false },
  working: { bg: 'bg-blue-500', ring: 'ring-blue-400', pulse: true },
  waiting: { bg: 'bg-yellow-500', ring: 'ring-yellow-400', pulse: true },
  reviewing: { bg: 'bg-purple-500', ring: 'ring-purple-400', pulse: true },
  done: { bg: 'bg-green-500', ring: 'ring-green-400', pulse: false }
};

const statusIcons = {
  idle: '😴',
  working: '⚡',
  waiting: '⏳',
  reviewing: '🔍',
  done: '✅'
};

const domainIcons: Record<string, string> = {
  authentication: '🔐',
  payments: '💳',
  admin: '📊',
  mobile: '📱',
  backend: '🖥️',
  frontend: '🎨',
  database: '🗄️',
  core: '⚙️'
};

export const AgentNode: React.FC<AgentNodeProps> = ({
  id,
  name,
  domain,
  status,
  position,
  isSelected,
  artifactCount,
  onClick
}) => {
  const colors = statusColors[status];
  const statusIcon = statusIcons[status];
  const domainIcon = domainIcons[domain] || '🤖';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="absolute cursor-pointer"
      style={{ left: position.x, top: position.y, transform: 'translate(-50%, -50%)' }}
      onClick={onClick}
    >
      {/* Círculo principal */}
      <motion.div
        className={`
          relative w-20 h-20 rounded-full ${colors.bg}
          flex items-center justify-center
          ring-4 ${colors.ring}
          ${isSelected ? 'ring-8 ring-white' : ''}
          shadow-lg
        `}
        animate={colors.pulse ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        {/* Ícone do domínio */}
        <span className="text-3xl">{domainIcon}</span>
        
        {/* Badge de status */}
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
          <span className="text-sm">{statusIcon}</span>
        </div>
        
        {/* Badge de artefatos */}
        {artifactCount > 0 && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center shadow text-white text-xs font-bold">
            {artifactCount}
          </div>
        )}
      </motion.div>
      
      {/* Nome do agente */}
      <div className="mt-2 text-center">
        <p className="text-xs font-semibold text-white truncate max-w-24">
          {name.split(' ').slice(0, 2).join(' ')}
        </p>
        <p className="text-xs text-gray-400 capitalize">{domain}</p>
      </div>
    </motion.div>
  );
};

export default AgentNode;
