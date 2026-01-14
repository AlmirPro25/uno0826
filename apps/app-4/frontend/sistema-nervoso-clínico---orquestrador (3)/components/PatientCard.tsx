import React from 'react';
import { Paciente, RiscoClinico } from '../types';

interface PatientCardProps {
  paciente: Paciente;
  onClick: () => void;
  isSelected: boolean;
}

const getRiscoColor = (risco: RiscoClinico) => {
  switch (risco) {
    case RiscoClinico.CRITICO: return 'bg-red-600 text-white border-red-700';
    case RiscoClinico.ALTO: return 'bg-orange-500 text-white border-orange-600';
    case RiscoClinico.MODERADO: return 'bg-yellow-400 text-black border-yellow-500';
    case RiscoClinico.BAIXO: return 'bg-green-500 text-white border-green-600';
    default: return 'bg-gray-400';
  }
};

export const PatientCard: React.FC<PatientCardProps> = ({ paciente, onClick, isSelected }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md mb-3 flex items-start gap-4 ${
        isSelected 
          ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' 
          : 'bg-white border-slate-200 hover:border-blue-300'
      }`}
    >
      <div className="relative">
        <img 
          src={paciente.fotoUrl} 
          alt={paciente.nome} 
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRiscoColor(paciente.risco)}`}>
          {paciente.risco}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
            <h4 className="font-semibold text-slate-900 truncate">{paciente.nome}</h4>
            <span className="text-xs text-slate-400 font-mono">{paciente.idade} anos</span>
        </div>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{paciente.queixaPrincipal}</p>
        
        <div className="flex gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                SPO2 {paciente.ultimaTelemetria.spo2}%
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                FC {paciente.ultimaTelemetria.fc}
            </span>
        </div>
      </div>
    </div>
  );
};