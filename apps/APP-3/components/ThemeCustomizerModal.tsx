
import React, { useCallback } from 'react';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export type ThemeColorName = keyof ThemeColors;

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeDescription: string;
  onThemeDescriptionChange: (description: string) => void;
  themeColors: ThemeColors;
  onThemeColorChange: (colorName: ThemeColorName, value: string) => void;
  onSuggestColors: () => void;
  onApplyTheme: () => void;
  isSuggesting: boolean;
  isApplying: boolean;
}

const ColorInputRow: React.FC<{
  label: string;
  colorName: ThemeColorName;
  value: string;
  onChange: (colorName: ThemeColorName, value: string) => void;
  disabled?: boolean;
}> = ({ label, colorName, value, onChange, disabled }) => {
  // Basic check for valid CSS color (hex, rgb, common names) for swatch
  const isValidColorForSwatch = (color: string) => {
    if (!color) return false;
    const s = new Option().style;
    s.color = color;
    // Check if browser recognized the color. Tailwind names won't be recognized here directly.
    // For Tailwind names, we might not get a perfect swatch unless we map them.
    // For simplicity, swatch will show color if it's a direct CSS value.
    return s.color !== ''; 
  };
  
  const getSwatchStyle = (colorValue: string): React.CSSProperties => {
    if (isValidColorForSwatch(colorValue)) {
      return { backgroundColor: colorValue };
    }
    // For Tailwind classes, we can't directly use them for swatch. 
    // Could attempt to map common ones or show a default.
    // For now, if not a direct CSS color, show a neutral color or placeholder.
    if (colorValue.match(/^(slate|gray|zinc|neutral|stone)-[0-9]{2,3}$/)) return { backgroundColor: '#A0AEC0'}; // A generic gray
    if (colorValue.match(/^(red|orange|amber|yellow)-[0-9]{2,3}$/)) return { backgroundColor: '#F56565'}; // A generic red
    if (colorValue.match(/^(lime|green|emerald|teal)-[0-9]{2,3}$/)) return { backgroundColor: '#48BB78'}; // A generic green
    if (colorValue.match(/^(cyan|sky|blue|indigo)-[0-9]{2,3}$/)) return { backgroundColor: '#4299E1'}; // A generic blue
    if (colorValue.match(/^(violet|purple|fuchsia|pink|rose)-[0-9]{2,3}$/)) return { backgroundColor: '#9F7AEA'}; // A generic purple
    return { backgroundColor: '#CBD5E0', border: '1px dashed #718096' }; // Default placeholder
  };


  return (
    <div className="flex items-center gap-2 mb-2.5">
      <label htmlFor={`theme-${colorName}`} className="w-1/3 text-sm text-slate-300 shrink-0">
        {label}:
      </label>
      <div 
        className="w-6 h-6 rounded border border-slate-500 shrink-0" 
        style={getSwatchStyle(value)}
        title={`Preview of ${value}`}
      ></div>
      <input
        type="text"
        id={`theme-${colorName}`}
        value={value}
        onChange={(e) => onChange(colorName, e.target.value)}
        placeholder="Ex: sky-500 ou #3B82F6"
        className="flex-grow p-1.5 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
        disabled={disabled}
      />
    </div>
  );
};

const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  themeDescription,
  onThemeDescriptionChange,
  themeColors,
  onThemeColorChange,
  onSuggestColors,
  onApplyTheme,
  isSuggesting,
  isApplying,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSuggesting && !isApplying) {
      onClose();
    }
  };

  const isActionInProgress = isSuggesting || isApplying;

  return (
    <div
      className="fixed inset-0 bg-slate-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[130] p-4" // Higher z-index
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-customizer-modal-title"
    >
      <div className="bg-slate-800 p-5 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col text-slate-100 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 id="theme-customizer-modal-title" className="text-xl sm:text-2xl font-semibold text-purple-400">
            <i className="fa-solid fa-palette mr-2"></i>AI Theme Customizer
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-purple-300 transition-colors p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500" 
            aria-label="Fechar modal de customização de tema"
            disabled={isActionInProgress}
          >
            <i className="fa-solid fa-times w-5 h-5"></i>
          </button>
        </div>

        <div className="mb-3">
          <label htmlFor="theme-description" className="block text-sm font-medium text-slate-300 mb-1">
            Descreva o Tema (Opcional):
          </label>
          <textarea
            id="theme-description"
            value={themeDescription}
            onChange={(e) => onThemeDescriptionChange(e.target.value)}
            placeholder="Ex: profissional e moderno, dark mode com acentos neon..."
            className="w-full p-2 bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm resize-none h-16 scrollbar-thin"
            disabled={isActionInProgress}
            rows={2}
          />
        </div>
        
        <button
          onClick={onSuggestColors}
          disabled={isActionInProgress}
          className="mb-4 w-full sm:w-auto self-start px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center gap-1.5 text-sm"
        >
          {isSuggesting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sugerindo Cores...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles w-3.5 h-3.5 mr-1"></i>
              Sugerir Cores com IA
            </>
          )}
        </button>

        <div className="flex-grow space-y-1.5 mb-4 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700/50">
          <ColorInputRow label="Primária" colorName="primary" value={themeColors.primary} onChange={onThemeColorChange} disabled={isActionInProgress} />
          <ColorInputRow label="Secundária" colorName="secondary" value={themeColors.secondary} onChange={onThemeColorChange} disabled={isActionInProgress} />
          <ColorInputRow label="Destaque" colorName="accent" value={themeColors.accent} onChange={onThemeColorChange} disabled={isActionInProgress} />
          <ColorInputRow label="Fundo da Página" colorName="background" value={themeColors.background} onChange={onThemeColorChange} disabled={isActionInProgress} />
          <ColorInputRow label="Texto Principal" colorName="text" value={themeColors.text} onChange={onThemeColorChange} disabled={isActionInProgress} />
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-700 flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors text-sm font-medium focus:outline-none focus:ring-1 focus:ring-slate-400"
            disabled={isActionInProgress}
          >
            Fechar
          </button>
          <button
            onClick={onApplyTheme}
            disabled={isActionInProgress || Object.values(themeColors).some(color => !color.trim())}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:bg-slate-500 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {isApplying ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Aplicando Tema...
            </>
          ) : (
            <>
              <i className="fa-solid fa-paint-roller w-4 h-4 mr-1"></i>
              Aplicar Tema ao Site
            </>
          )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeCustomizerModal;
