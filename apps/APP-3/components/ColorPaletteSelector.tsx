import React from 'react';
import type { ColorPalette } from '@/services/AdvancedResearch';

interface ColorPaletteSelectorProps {
  palettes: ColorPalette[];
  selectedPaletteId: string | null;
  onPaletteSelect: (paletteId: string) => void;
  onContinue: () => void;
}

export const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
  palettes,
  selectedPaletteId,
  onPaletteSelect,
  onContinue
}) => {
  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 backdrop-blur-sm flex items-center justify-center z-[400] p-4">
      <div className="bg-slate-800 p-6 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-slate-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">
            🎨 Escolha a Paleta de Cores
          </h2>
          <p className="text-slate-300">
            A IA pesquisou e criou 5 paletas únicas para seu projeto. Selecione sua favorita:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {palettes.map((palette) => (
            <div
              key={palette.id}
              className={`relative cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedPaletteId === palette.id
                  ? 'ring-4 ring-blue-500 shadow-2xl scale-105'
                  : 'hover:shadow-xl'
              }`}
              onClick={() => onPaletteSelect(palette.id)}
            >
              {/* Checkbox */}
              <div className="absolute top-3 right-3 z-10">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedPaletteId === palette.id
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-white/50 bg-black/20'
                }`}>
                  {selectedPaletteId === palette.id && (
                    <i className="fa-solid fa-check text-white text-sm"></i>
                  )}
                </div>
              </div>

              {/* Palette Card */}
              <div className="bg-slate-700 rounded-lg overflow-hidden">
                {/* Color Swatches */}
                <div className="h-32 flex">
                  <div 
                    className="flex-1 flex items-center justify-center"
                    style={{ backgroundColor: palette.primary }}
                  >
                    <span className="text-xs font-bold text-white/80">PRIMARY</span>
                  </div>
                  <div 
                    className="flex-1 flex items-center justify-center"
                    style={{ backgroundColor: palette.secondary }}
                  >
                    <span className="text-xs font-bold text-white/80">SECONDARY</span>
                  </div>
                  <div 
                    className="flex-1 flex items-center justify-center"
                    style={{ backgroundColor: palette.accent }}
                  >
                    <span className="text-xs font-bold text-white/80">ACCENT</span>
                  </div>
                </div>

                {/* Background Preview */}
                <div 
                  className="h-16 flex items-center justify-center"
                  style={{ 
                    backgroundColor: palette.background,
                    color: palette.text 
                  }}
                >
                  <span className="text-sm font-medium">Background + Text</span>
                </div>

                {/* Palette Info */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-100 mb-1">{palette.name}</h3>
                  <p className="text-xs text-slate-300 mb-3">{palette.description}</p>
                  
                  {/* Color Codes */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: palette.primary }}
                      ></div>
                      <span className="text-slate-400">{palette.primary}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: palette.secondary }}
                      ></div>
                      <span className="text-slate-400">{palette.secondary}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: palette.accent }}
                      ></div>
                      <span className="text-slate-400">{palette.accent}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div 
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: palette.background }}
                      ></div>
                      <span className="text-slate-400">{palette.background}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={onContinue}
            disabled={!selectedPaletteId}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            <i className="fa-solid fa-rocket"></i>
            Continuar com Paleta Selecionada
          </button>
          
          {selectedPaletteId && (
            <p className="text-sm text-slate-400 mt-3">
              Paleta selecionada: <span className="text-blue-400 font-medium">
                {palettes.find(p => p.id === selectedPaletteId)?.name}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};