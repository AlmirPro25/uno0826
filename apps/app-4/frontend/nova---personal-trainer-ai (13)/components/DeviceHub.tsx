import React from 'react';
import { Bluetooth, Heart, Activity, Footprints, Zap, Wifi, XCircle, CheckCircle, Smartphone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const DeviceHub: React.FC = () => {
  const { 
    isHeartDeviceConnected, heartRate, connectHeartDevice, disconnectHeartDevice,
    isRunDeviceConnected, runCadence, runSpeed, connectRunDevice, disconnectRunDevice,
    playSound
  } = useAppContext();

  const handleHeartConnect = () => {
     playSound('click');
     if (isHeartDeviceConnected) {
        disconnectHeartDevice();
        playSound('off');
     } else {
        connectHeartDevice().then(() => playSound('success')).catch(() => playSound('error'));
     }
  };

  const handleRunConnect = () => {
     playSound('click');
     if (isRunDeviceConnected) {
        disconnectRunDevice();
        playSound('off');
     } else {
        connectRunDevice().then(() => playSound('success')).catch(() => playSound('error'));
     }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
           <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
             <Bluetooth className="text-white" size={28} />
           </div>
           <div>
             <h2 className="text-3xl font-bold text-white">Hub de Sensores</h2>
             <p className="text-slate-400">Conecte wearables para alimentar o Gemini com dados reais.</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Heart Rate Monitor Card */}
        <div className={`
          relative overflow-hidden rounded-2xl border transition-all duration-300
          ${isHeartDeviceConnected 
            ? 'bg-red-900/20 border-red-500/50 shadow-lg shadow-red-900/20' 
            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}
        `}>
           <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${isHeartDeviceConnected ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                       <Heart size={24} className={isHeartDeviceConnected ? 'animate-pulse' : ''} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-white">Monitor Cardíaco</h3>
                       <p className="text-xs text-slate-400">Cintas, Relógios e Faixas</p>
                    </div>
                 </div>
                 {isHeartDeviceConnected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase border border-green-500/20">
                       <Wifi size={10} /> Online
                    </span>
                 )}
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                 <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Frequência Atual</p>
                 <div className="flex items-end gap-2">
                    <span className={`text-4xl font-mono font-bold ${isHeartDeviceConnected ? 'text-white' : 'text-slate-600'}`}>
                       {heartRate || '--'}
                    </span>
                    <span className="text-sm text-slate-500 mb-1">BPM</span>
                 </div>
              </div>

              <button
                onClick={handleHeartConnect}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                   isHeartDeviceConnected
                   ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                   : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                }`}
              >
                 {isHeartDeviceConnected ? (
                    <> <XCircle size={18} /> Desconectar </>
                 ) : (
                    <> <Bluetooth size={18} /> Buscar Dispositivo </>
                 )}
              </button>
           </div>
        </div>

        {/* Running Sensor Card */}
        <div className={`
          relative overflow-hidden rounded-2xl border transition-all duration-300
          ${isRunDeviceConnected 
            ? 'bg-emerald-900/20 border-emerald-500/50 shadow-lg shadow-emerald-900/20' 
            : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}
        `}>
           <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${isRunDeviceConnected ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                       <Footprints size={24} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-white">Sensor de Corrida</h3>
                       <p className="text-xs text-slate-400">Footpods, Esteiras Inteligentes</p>
                    </div>
                 </div>
                 {isRunDeviceConnected && (
                    <span className="flex items-center gap-1 text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase border border-green-500/20">
                       <Wifi size={10} /> Online
                    </span>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                       <Activity size={10} /> Cadência
                    </p>
                    <div className="flex items-end gap-1">
                       <span className={`text-2xl font-mono font-bold ${isRunDeviceConnected ? 'text-white' : 'text-slate-600'}`}>
                          {runCadence || '--'}
                       </span>
                       <span className="text-[10px] text-slate-500 mb-1">RPM</span>
                    </div>
                 </div>
                 <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                       <Zap size={10} /> Velocidade
                    </p>
                    <div className="flex items-end gap-1">
                       <span className={`text-2xl font-mono font-bold ${isRunDeviceConnected ? 'text-white' : 'text-slate-600'}`}>
                          {runSpeed ? (runSpeed * 3.6).toFixed(1) : '--'}
                       </span>
                       <span className="text-[10px] text-slate-500 mb-1">km/h</span>
                    </div>
                 </div>
              </div>

              <button
                onClick={handleRunConnect}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                   isRunDeviceConnected
                   ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20'
                   : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                }`}
              >
                 {isRunDeviceConnected ? (
                    <> <XCircle size={18} /> Desconectar </>
                 ) : (
                    <> <Bluetooth size={18} /> Buscar Sensor </>
                 )}
              </button>
           </div>
        </div>

      </div>

      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6 flex items-start gap-4">
         <div className="p-2 bg-slate-800 rounded-lg text-blue-400">
            <Smartphone size={24} />
         </div>
         <div>
            <h4 className="text-white font-bold mb-1">Como conectar?</h4>
            <ul className="text-sm text-slate-400 space-y-1 list-disc pl-4">
               <li>Certifique-se de que o Bluetooth do seu dispositivo está ligado.</li>
               <li>Clique em "Buscar" e selecione o dispositivo na janela que aparecerá.</li>
               <li>Alguns dispositivos exigem que você os molhe ou vista para ativar o sinal.</li>
               <li>Funciona apenas em navegadores Chrome, Edge ou Opera (PC e Android).</li>
            </ul>
         </div>
      </div>
    </div>
  );
};