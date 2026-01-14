import React, { useState, useEffect } from 'react';
import { databaseService, Session } from '../services/databaseService';
import { CloseIcon, RobotIcon, UserIcon, BrainIcon, HistoryIcon } from './Icons';

const renderMessage = (message: any) => (
    <div key={message.id} className={`flex items-start gap-3 my-2 ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.speaker !== 'user' && <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.speaker === 'model' ? 'bg-gray-700' : 'bg-teal-600'}`}>
            {message.speaker === 'model' ? <RobotIcon className="w-5 h-5 text-purple-400" /> : <BrainIcon className="w-5 h-5 text-white" />}
        </div>}
        <div className={`max-w-xl p-3 rounded-2xl shadow-lg ${message.speaker === 'user' ? 'bg-purple-600 rounded-br-none' : `bg-gray-700 rounded-bl-none ${message.speaker === 'analysis' ? 'border border-teal-500' : ''}`}`}>
            {message.speaker === 'analysis' && <p className="text-sm font-semibold text-teal-300 mb-1">Screen Analysis:</p>}
            <div className="text-sm prose prose-invert prose-sm max-w-none break-words" dangerouslySetInnerHTML={{__html: message.text.replace(/\n/g, '<br />') }}></div>
        </div>
        {message.speaker === 'user' && <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-white" /></div>}
    </div>
);


interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ isOpen, onClose }) => {
    const [history, setHistory] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchHistory = async () => {
                setIsLoading(true);
                const data = await databaseService.getHistory();
                setHistory(data);
                setIsLoading(false);
            };
            fetchHistory();
        } else {
            // Reset selection when panel is closed
            setSelectedSessionId(null);
        }
    }, [isOpen]);

    const selectedSession = history.find(s => s.id === selectedSessionId);

    return (
        <div className={`fixed top-0 right-0 h-full bg-gray-900/80 backdrop-blur-lg border-l border-gray-700 shadow-2xl z-50 transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} w-full md:w-1/2 lg:w-1/3`}>
            <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-700 flex-shrink-0">
                    <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                            <HistoryIcon className="w-7 h-7 text-purple-400" />
                            <h2 className="text-xl font-bold">Histórico</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <CloseIcon className="w-7 h-7" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">
                            Armazenamento: <strong className="text-purple-400">{databaseService.getDatabaseSize()}</strong>
                        </span>
                        <button
                            onClick={() => {
                                if (confirm('Apagar sessões antigas (manter últimas 10)?')) {
                                    databaseService.deleteOldSessions(10);
                                    window.location.reload();
                                }
                            }}
                            className="text-yellow-400 hover:text-yellow-300 underline"
                        >
                            Limpar antigas
                        </button>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
                        </div>
                    ) : selectedSession ? (
                        <div className="p-4">
                            <button onClick={() => setSelectedSessionId(null)} className="text-sm text-purple-400 hover:underline mb-4">&larr; Back to Sessions</button>
                            <h3 className="text-lg font-semibold mb-2">Session from {new Date(selectedSession.startTime).toLocaleString()}</h3>
                            {selectedSession.summary && <p className="text-xs text-gray-400 italic bg-gray-800 p-2 rounded-md mb-4">Summary: {selectedSession.summary}</p>}
                            <div>{selectedSession.messages.map(renderMessage)}</div>
                        </div>
                    ) : (
                         history.length > 0 ? (
                            <ul>
                                {history.map(session => (
                                    <li key={session.id} className="border-b border-gray-800">
                                        <button onClick={() => setSelectedSessionId(session.id)} className="w-full text-left p-4 hover:bg-gray-800 transition-colors">
                                            <p className="font-semibold">{new Date(session.startTime).toLocaleString()}</p>
                                            <p className="text-sm text-gray-400 truncate">{session.summary || 'No summary available.'}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <HistoryIcon className="w-16 h-16 mb-4"/>
                                <p>No conversation history found.</p>
                                <p className="text-sm">Start a session to begin.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPanel;
