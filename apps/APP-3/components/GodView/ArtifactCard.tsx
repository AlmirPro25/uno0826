/**
 * 📦 ArtifactCard - Card de artefato gerado por um agente
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ArtifactCardProps {
  name: string;
  type: 'code' | 'schema' | 'api' | 'config' | 'doc';
  agentName: string;
  version: number;
  preview?: string;
  onClick?: () => void;
}

const typeConfig = {
  code: { icon: '📄', color: 'bg-blue-500', label: 'Código' },
  schema: { icon: '🗂️', color: 'bg-purple-500', label: 'Schema' },
  api: { icon: '🔌', color: 'bg-green-500', label: 'API' },
  config: { icon: '⚙️', color: 'bg-yellow-500', label: 'Config' },
  doc: { icon: '📝', color: 'bg-gray-500', label: 'Doc' }
};

export const ArtifactCard: React.FC<ArtifactCardProps> = ({
  name,
  type,
  agentName,
  version,
  preview,
  onClick
}) => {
  const config = typeConfig[type] || typeConfig.code;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800 rounded-lg p-3 cursor-pointer border border-gray-700 hover:border-gray-500 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`${config.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
          <span className="text-xl">{config.icon}</span>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <span className="text-xs text-gray-500">v{version}</span>
          </div>
          <p className="text-xs text-gray-400">{agentName}</p>
          <span className={`text-xs ${config.color.replace('bg-', 'text-')}`}>
            {config.label}
          </span>
        </div>
      </div>
      
      {/* Preview */}
      {preview && (
        <div className="mt-2 bg-gray-900 rounded p-2 overflow-hidden">
          <pre className="text-xs text-gray-400 line-clamp-3 font-mono">
            {preview}
          </pre>
        </div>
      )}
    </motion.div>
  );
};

export default ArtifactCard;
