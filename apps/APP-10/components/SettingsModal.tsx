
import React, { useState, useEffect } from 'react';
import { X, Key, Save } from 'lucide-react';
import { useStore } from '../store';

export const SettingsModal = () => {
  const { isSettingsOpen, toggleSettings, apiKey, setApiKey } = useStore();
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    if (isSettingsOpen) {
      setKeyInput(apiKey || '');
    }
  }, [isSettingsOpen, apiKey]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#18181b] w-full max-w-md rounded-xl border border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">Settings</h2>
          <button onClick={toggleSettings} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <Key className="w-3.5 h-3.5" />
              Gemini API Key
            </label>
            <input 
              type="password" 
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter your Gemini API Key (starts with AI...)"
              className="w-full bg-[#0c0c0e] border border-slate-700 rounded px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none placeholder-slate-600 font-mono"
            />
            <p className="text-[10px] text-slate-500">
              Your API key is stored locally in your browser's LocalStorage.
            </p>
          </div>
        </div>

        <div className="px-4 py-3 bg-[#121214] border-t border-slate-800 flex justify-end">
          <button 
            onClick={() => {
              setApiKey(keyInput);
              toggleSettings();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
