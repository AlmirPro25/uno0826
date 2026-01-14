import React, { useState } from 'react';
import { Upload, Camera, Utensils, User, AlertCircle, CheckCircle, Loader2, PlusCircle } from 'lucide-react';
import { analyzeImage } from '../services/geminiService';
import { AnalysisResult } from '../types';
import { useAppContext } from '../context/AppContext';

export const AnalysisModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'food' | 'body'>('food');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);

  const { logCaloriesConsumed, addAnalysis } = useAppContext();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      const rawBase64 = base64String.split(',')[1];
      processImage(rawBase64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setLoading(true);
    setResult(null);
    setLogged(false);
    try {
      const analysis = await analyzeImage(base64, mimeType, activeTab);
      // Auto-save to history
      addAnalysis(analysis);
      setResult({ ...analysis, id: 'temp' }); // Temp ID just for display
    } catch (err) {
      alert("Erro ao analisar imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogData = () => {
    if (result && result.estimatedCalories && result.estimatedCalories > 0) {
      logCaloriesConsumed(result.estimatedCalories);
      setLogged(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <header>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Laboratório de Análise
        </h2>
        <p className="text-slate-400">Inteligência Visual para nutrição e biomecânica.</p>
      </header>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-800 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('food'); setPreview(null); setResult(null); setLogged(false); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === 'food' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <Utensils size={18} /> Nutrição
        </button>
        <button
          onClick={() => { setActiveTab('body'); setPreview(null); setResult(null); setLogged(false); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${activeTab === 'body' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          <User size={18} /> Biometria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-blue-500/50 transition-colors bg-slate-800/20 min-h-[300px] relative overflow-hidden group">
            
            {preview ? (
              <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
            ) : null}

            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-slate-800 p-4 rounded-full mb-4 shadow-xl">
                {loading ? <Loader2 className="animate-spin text-blue-400" size={32} /> : <Camera className="text-blue-400" size={32} />}
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {activeTab === 'food' ? 'Fotografe sua refeição' : 'Check-up visual'}
              </h3>
              <p className="text-sm text-slate-400 max-w-xs mb-6">
                A análise será salva automaticamente em sua memória neural.
              </p>
              
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-medium transition-transform active:scale-95 shadow-lg shadow-blue-600/20">
                Selecionar Imagem
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading} />
              </label>
            </div>
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 min-h-[300px] flex flex-col">
          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
              <Upload size={48} className="mb-4" />
              <p>Aguardando dados...</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-blue-400 animate-pulse">
              <div className="h-2 w-24 bg-blue-500 rounded mb-2"></div>
              <div className="h-2 w-16 bg-blue-500 rounded"></div>
              <p className="mt-4 text-sm">Processando com Gemini 3 Pro Thinking...</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-slate-400 mb-1">Resumo</h4>
                  <p className="text-lg text-white font-medium">{result.summary}</p>
                </div>
                {activeTab === 'food' && result.estimatedCalories && result.estimatedCalories > 0 && (
                   <button 
                    onClick={handleLogData}
                    disabled={logged}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-colors ${logged ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                   >
                     {logged ? <CheckCircle size={12} /> : <PlusCircle size={12} />}
                     {logged ? 'Registrado' : 'Diário'}
                   </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {result.metrics.map((m, i) => (
                  <div key={i} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <p className="text-xs text-slate-400">{m.label}</p>
                    <p className="text-xl font-bold text-emerald-400">{m.value} <span className="text-xs font-normal text-slate-500">{m.unit}</span></p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <CheckCircle size={16} />
                  <span className="font-semibold text-sm">Recomendação</span>
                </div>
                <p className="text-sm text-blue-100">{result.recommendation}</p>
              </div>

              <div className="flex items-start gap-2 text-xs text-orange-400/80 bg-orange-900/10 p-3 rounded border border-orange-500/20">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
