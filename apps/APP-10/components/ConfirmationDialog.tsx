
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store';

export const ConfirmationDialog: React.FC = () => {
  const { confirmation, closeConfirmation } = useStore();

  if (!confirmation.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-slate-700 rounded-xl shadow-2xl max-w-[400px] w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 flex gap-4">
           <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${confirmation.variant === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
             <AlertTriangle className="w-5 h-5" />
           </div>
           <div className="space-y-2">
             <h3 className="text-base font-semibold text-slate-200 leading-none pt-2">{confirmation.title}</h3>
             <p className="text-sm text-slate-400 leading-relaxed">{confirmation.message}</p>
           </div>
        </div>
        
        <div className="bg-[#121214] px-4 py-3 flex justify-end gap-3 border-t border-slate-800">
          <button 
            onClick={closeConfirmation}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              confirmation.onConfirm();
              closeConfirmation();
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium text-white shadow-lg transition-all ${
              confirmation.variant === 'danger' 
                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
            }`}
          >
            {confirmation.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
