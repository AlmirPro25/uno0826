import React, { useState, useEffect, useCallback } from 'react';
import { PlayIcon, PauseIcon, StopIcon } from './icons/Icons';

interface SpeechControlsProps {
    textToRead: string;
}

export const SpeechControls: React.FC<SpeechControlsProps> = ({ textToRead }) => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
    const [rate, setRate] = useState(1);
    const [pitch, setPitch] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    
    const populateVoiceList = useCallback(() => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            const ptVoices = availableVoices.filter(v => v.lang.startsWith('pt'));
            setVoices(ptVoices);
            if (ptVoices.length > 0) {
                const preferredVoiceName = "Microsoft Thalita Multilingual Online (Natural) - Portuguese (Brazil) (pt-BR)";
                const preferredVoice = ptVoices.find(voice => voice.name === preferredVoiceName);
                if (preferredVoice) {
                    setSelectedVoiceURI(preferredVoice.voiceURI);
                } else {
                    setSelectedVoiceURI(ptVoices[0].voiceURI);
                }
            }
        }
    }, []);

    useEffect(() => {
        populateVoiceList();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }

        return () => {
            window.speechSynthesis.cancel();
        };
    }, [populateVoiceList]);

    const handlePlay = () => {
        if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            return;
        }
        
        const utterance = new SpeechSynthesisUtterance(textToRead);
        const selectedVoice = voices.find(voice => voice.voiceURI === selectedVoiceURI);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.pitch = pitch;
        utterance.rate = rate;
        
        utterance.onstart = () => {
            setIsSpeaking(true);
            setIsPaused(false);
        };
        utterance.onend = () => {
            setIsSpeaking(false);
            setIsPaused(false);
        };
        utterance.onerror = (e) => {
            console.error("Erro na síntese de fala:", e.error);
            setIsSpeaking(false);
            setIsPaused(false);
        };
        
        // CORREÇÃO: Cancela qualquer síntese de fala anterior para limpar possíveis estados travados
        // antes de iniciar uma nova. Esta é uma correção de robustez comum para a Web Speech API.
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handlePause = () => {
        window.speechSynthesis.pause();
        setIsPaused(true);
    };

    const handleStop = () => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setIsPaused(false);
    };

    return (
        <div className="p-4 mb-6 bg-gray-900/50 border border-gray-700 rounded-2xl space-y-4 not-prose">
            <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-1/2">
                    <label htmlFor="voice-select" className="block text-xs font-medium text-gray-400 mb-1">
                        Voz
                    </label>
                    <select
                        id="voice-select"
                        value={selectedVoiceURI}
                        onChange={(e) => setSelectedVoiceURI(e.target.value)}
                        className="w-full p-2 text-sm bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-gray-200"
                        disabled={isSpeaking || voices.length === 0}
                    >
                        {voices.length > 0 ? voices.map(voice => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                                {voice.name}
                            </option>
                        )) : <option>Nenhuma voz em Português encontrada</option>}
                    </select>
                </div>
                <div className="w-full md:w-1/4">
                     <label htmlFor="rate-slider" className="block text-xs font-medium text-gray-400 mb-1">
                        Velocidade: {rate.toFixed(1)}x
                    </label>
                    <input
                        id="rate-slider"
                        type="range" min="0.5" max="2" step="0.1" value={rate}
                        onChange={(e) => setRate(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                        disabled={isSpeaking}
                    />
                </div>
                 <div className="w-full md:w-1/4">
                     <label htmlFor="pitch-slider" className="block text-xs font-medium text-gray-400 mb-1">
                        Tom: {pitch.toFixed(1)}
                    </label>
                    <input
                        id="pitch-slider"
                        type="range" min="0" max="2" step="0.1" value={pitch}
                        onChange={(e) => setPitch(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                        disabled={isSpeaking}
                    />
                </div>
            </div>
            <div className="flex items-center justify-center space-x-2">
                {!isSpeaking ? (
                    <button onClick={handlePlay} className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center min-w-[120px]">
                        <PlayIcon className="w-5 h-5 mr-2" /> Ler Texto
                    </button>
                ) : isPaused ? (
                     <button onClick={handlePlay} className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center min-w-[120px]">
                         <PlayIcon className="w-5 h-5 mr-2" /> Resumir
                    </button>
                ) : null }
                 
                {isSpeaking && !isPaused && (
                    <button onClick={handlePause} className="px-4 py-2 font-semibold text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 flex items-center justify-center min-w-[120px]">
                         <PauseIcon className="w-5 h-5 mr-2" /> Pausar
                    </button>
                )}
                
                {isSpeaking && (
                    <button onClick={handleStop} className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center justify-center min-w-[120px]">
                        <StopIcon className="w-5 h-5 mr-2" /> Parar
                    </button>
                )}
            </div>
            <style>{`
                .range-thumb-purple::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: #a855f7;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .range-thumb-purple::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: #a855f7;
                    border-radius: 50%;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};