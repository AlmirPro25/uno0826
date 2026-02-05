
import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, status = 'normal' }) => {
  const colors = {
    normal: 'text-mars-cyan border-mars-cyan/20',
    warning: 'text-yellow-500 border-yellow-500/30',
    critical: 'text-mars-red border-mars-red/50 animate-pulse'
  };

  return (
    <div className={`p-4 border bg-mars-surface/50 backdrop-blur-sm ${colors[status]} flex flex-col`}>
      <span className="text-[10px] uppercase tracking-[0.2em] opacity-70 mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-bold">{value}</span>
        {unit && <span className="text-xs opacity-60 font-mono">{unit}</span>}
      </div>
      
      {/* Visual Health Bar */}
      <div className="w-full h-1 bg-gray-800 mt-3 relative overflow-hidden">
        <motion.div 
          className={`h-full ${status === 'critical' ? 'bg-mars-red' : 'bg-mars-cyan'}`}
          initial={{ width: 0 }}
          animate={{ width: status === 'critical' ? '20%' : '80%' }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", repeatDelay: 2 }}
        />
      </div>
    </div>
  );
};
