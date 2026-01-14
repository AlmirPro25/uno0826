import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { personalityService } from '../services/personalityService';
import { memoryService } from '../services/memoryService';
import { BrainIcon, CloseIcon, SendIcon, CopyIcon, VolumeIcon } from './Icons';
import { playBase64Audio } from '../utils/audioUtils';

const renderMarkdown = (text: string) => {
    const codeBlocks: string[] = [];
    // 1. Isolate and process code blocks, replacing them with placeholders
    let processedText = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const html = `<div class="code-block bg-gray-900 rounded-md my-4">
            <div class="flex justify-between items-center px-4 py-2 bg-gray-800 rounded-t-md">
                <span class="text-xs text-gray-400">${lang || 'code'}</span>
                <button class="copy-button text-gray-400 hover:text-white" data-code="${encodeURIComponent(code)}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
            <pre class="p-4 text-sm overflow-x-auto"><code>${escapedCode}</code></pre>
        </div>`;
        codeBlocks.push(html);
        return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 2. Process markdown on the rest of the text
    processedText = processedText
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3 border-b border-gray-700 pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4 border-b border-gray-600 pb-3">$1</h1>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        .replace(/^\* (.*$)/gim, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
        .replace(/<\/li><li>/g, '</li><li>') // fix for adjacent list items
        .replace(/(<li>.*<\/li>)/gs, (match) => {
            if (match.includes('list-disc') || match.includes('list-decimal')) return match; // avoid double wrapping
            const listType = match.includes('1.') ? 'ol' : 'ul';
            return `<${listType} class="ml-6 list-${listType === 'ol' ? 'decimal' : 'disc'}">${match}</${listType}>`;
        })
        .replace(/\n/g, '<br />');

    // 3. Restore code blocks
    processedText = processedText.replace(/__CODE_BLOCK_(\d+)__/g, (match, index) => {
        return codeBlocks[parseInt(index, 10)];
    });

    return processedText;
};


interface ThinkingModeProps {
  onClose: () => void;
}

const ThinkingMode: React.FC<ThinkingModeProps> = ({ onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const resultContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);
    
    useEffect(() => {
        const currentResultContainer = resultContainerRef.current;
        if (!currentResultContainer) return;

        const handleCopyClick = (event: Event) => {
            const button = (event.target as HTMLElement).closest('.copy-button');
            if(button && button.getAttribute('data-code')) {
                const code = decodeURIComponent(button.getAttribute('data-code') || '');
                navigator.clipboard.writeText(code);
            }
        }
        currentResultContainer.addEventListener('click', handleCopyClick);
        return () => currentResultContainer.removeEventListener('click', handleCopyClick);
    }, [result]);
    
    const handleSubmit = async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setResult('');
        
        // Obtém contexto da memória
        const memoryContext = await memoryService.getContextForAI(prompt);
        
        // Gera instrução personalizada
        const systemInstruction = personalityService.generateSystemInstruction(memoryContext);
        
        // Usa o novo método com personalidade
        const response = await geminiService.generateWithPersonality(
          prompt,
          systemInstruction,
          { useDeepThinking: true }
        );
        
        setResult(response);
        
        // Registra interação
        personalityService.recordInteraction(prompt, response);
        memoryService.addToShortTerm(`Thinking Mode - User: ${prompt}`);
        memoryService.addToShortTerm(`Thinking Mode - AI: ${response.substring(0, 200)}...`);
        
        setIsLoading(false);
    };

    const handleReadAloud = async () => {
        if (!result || isSpeaking) return;
        setIsSpeaking(true);
        // We use the raw result text for TTS to get the most natural speech.
        const audioData = await geminiService.generateSpeech(result);
        if (audioData) {
            await playBase64Audio(audioData);
        }
        setIsSpeaking(false);
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-4">
            <div ref={containerRef} className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <BrainIcon className="w-8 h-8 text-teal-400"/>
                        <h2 className="text-2xl font-bold text-white">Thinking Mode</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-7 h-7" />
                    </button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Input Panel */}
                    <div className="flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Your Complex Request</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your task, ask for code, or provide context for analysis..."
                            className="w-full h-full p-3 bg-gray-900 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none border border-gray-700"
                        />
                        <button 
                            onClick={handleSubmit} 
                            disabled={isLoading || !prompt}
                            className="mt-4 w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            {isLoading ? 'Thinking...' : 'Analyze'}
                            <SendIcon className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* Output Panel */}
                    <div className="flex-1 flex flex-col bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                         <div className="flex justify-between items-center p-3 border-b border-gray-700 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-300">AI Analysis</h3>
                            {result && (
                                <button 
                                    onClick={handleReadAloud} 
                                    disabled={isSpeaking} 
                                    className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors p-1 rounded-full hover:bg-gray-700"
                                    title="Read analysis aloud"
                                >
                                    {isSpeaking 
                                        ? <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div> 
                                        : <VolumeIcon className="w-5 h-5" />
                                    }
                                </button>
                            )}
                        </div>
                        <div ref={resultContainerRef} className="p-4 overflow-y-auto h-full prose prose-invert prose-sm max-w-none">
                            {isLoading && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <BrainIcon className="w-16 h-16 animate-pulse text-teal-500"/>
                                    <p className="mt-4 text-lg">Processing your request...</p>
                                </div>
                            )}
                            {result && <div dangerouslySetInnerHTML={{ __html: renderMarkdown(result) }}></div>}
                            {!isLoading && !result && <div className="text-gray-500 text-center pt-16">The analysis will appear here.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThinkingMode;