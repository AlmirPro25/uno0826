import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let label = "DESCONHECIDO";
  let icon = null;

  switch (level) {
    case RiskLevel.LOW:
      bgColor = "bg-emerald-100 border-emerald-200";
      textColor = "text-emerald-800";
      label = "BAIXO RISCO (VERDE)";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    case RiskLevel.MEDIUM:
      bgColor = "bg-amber-100 border-amber-200";
      textColor = "text-amber-800";
      label = "ATENÇÃO (AMARELO)";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;
    case RiskLevel.HIGH:
      bgColor = "bg-rose-100 border-rose-200";
      textColor = "text-rose-800";
      label = "EMERGÊNCIA (VERMELHO)";
      icon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
  }

  return (
    <div className={`flex items-center justify-center px-4 py-3 rounded-lg border ${bgColor} ${textColor} font-bold tracking-wide shadow-sm animate-pulse-slow`}>
      {icon}
      {label}
    </div>
  );
};

export default RiskBadge;