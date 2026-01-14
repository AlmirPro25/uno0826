import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { generateAiResponse, AiResponseType } from '@/services/GeminiService';

interface CodeSuggestion {
  id: string;
  description: string;
  code: string;
  lineStart?: number;
  lineEnd?: number;
  type: 'replace' | 'insert' | 'modify';
  confidence: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  codeSuggestions?: CodeSuggestion[];
  appliedSuggestions?: string[];
}

export const ChatEditorIntegration: React.FC = () => {
  const {
    htmlCode,
    setHtmlCode,
    editorRef,
    isLoadingAi,
    setIsLoadingAi,
    aiStatusMessage,
    setAiStatusMessage
  } = useAppStore();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [selectedLines, setSelectedLines] = useState<{ start: number; end: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detectar seleção no editor
  useEffect(() => {
    const handleSelectionChange = () => {
      if (editorRef?.current) {
        const selection = editorRef.current.getSelection();
        const model = editorRef.current.getModel();
        
        if (selection && !selection.isEmpty() && model) {
          const selectedText = model.getValueInRange(selection);
          setSelectedCode(selectedText);
          setSelectedLines({
            start: selection.startLineNumber,
            end: selection.endLineNumber
          });
        } else {
          setSelectedCode('');
          setSelectedLines(null);
        }
      }
    };

    const interval = setInterval(handleSelectionChange, 500);
    return () => clearInterval(interval);
  }, [editorRef]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoadingAi) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoadingAi(true);
    setAiStatusMessage('Analisando código e gerando sugestões...');

    try {
      const contextPrompt = buildContextPrompt(inputValue, selectedCode, selectedLines);
      const response = await generateAiResponse(
        contextPrompt,
        htmlCode,
        [],
        AiResponseType.CODE_GENERATION
      );

      if (response?.content) {
        const aiMessage = parseAiResponse(response.content);
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Desculpe, ocorreu um erro ao processar sua solicitação.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingAi(false);
      setAiStatusMessage('');
    }
  };

  const buildContextPrompt = (userInput: string, selectedCode: string, lines: { start: number; end: number } | null): string => {
    let prompt = `Você é um assistente de programação em par. O usuário está trabalhando no seguinte código:

CÓDIGO COMPLETO:
\`\`\`html
${htmlCode}
\`\`\`

PERGUNTA/SOLICITAÇÃO DO USUÁRIO:
${userInput}`;

    if (selectedCode && lines) {
      prompt += `

CÓDIGO SELECIONADO (linhas ${lines.start}-${lines.end}):
\`\`\`html
${selectedCode}
\`\`\``;
    }

    prompt += `

Responda de forma conversacional e, se apropriado, forneça sugestões de código específicas.

Para sugestões de código, use o formato:
[SUGESTÃO:tipo:confiança:descrição]
\`\`\`html
código aqui
\`\`\`
[/SUGESTÃO]

Onde:
- tipo: replace, insert, ou modify
- confiança: 1-100 (quão confiante você está na sugestão)
- descrição: breve descrição do que a sugestão faz

Exemplo:
[SUGESTÃO:replace:95:Adicionar responsividade ao botão]
\`\`\`html
<button class="btn btn-primary responsive-btn">Clique aqui</button>
\`\`\`
[/SUGESTÃO]`;

    return prompt;
  };

  const parseAiResponse = (content: string): ChatMessage => {
    const suggestions: CodeSuggestion[] = [];
    let cleanContent = content;

    // Extrair sugestões de código
    const suggestionRegex = /\[SUGESTÃO:(\w+):(\d+):([^\]]+)\]\s*```html\s*([\s\S]*?)\s*```\s*\[\/SUGESTÃO\]/g;
    let match;

    while ((match = suggestionRegex.exec(content)) !== null) {
      const [fullMatch, type, confidence, description, code] = match;
      
      suggestions.push({
        id: Date.now().toString() + Math.random(),
        type: type as 'replace' | 'insert' | 'modify',
        confidence: parseInt(confidence),
        description: description.trim(),
        code: code.trim(),
        lineStart: selectedLines?.start,
        lineEnd: selectedLines?.end
      });

      // Remover a sugestão do conteúdo limpo
      cleanContent = cleanContent.replace(fullMatch, '');
    }

    return {
      id: Date.now().toString(),
      type: 'ai',
      content: cleanContent.trim(),
      timestamp: new Date(),
      codeSuggestions: suggestions
    };
  };

  const applySuggestion = (suggestion: CodeSuggestion) => {
    if (!editorRef?.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    let newCode = htmlCode;

    if (suggestion.type === 'replace' && suggestion.lineStart && suggestion.lineEnd) {
      // Substituir linhas específicas
      const lines = htmlCode.split('\n');
      lines.splice(suggestion.lineStart - 1, suggestion.lineEnd - suggestion.lineStart + 1, suggestion.code);
      newCode = lines.join('\n');
    } else if (suggestion.type === 'insert' && suggestion.lineStart) {
      // Inserir código em linha específica
      const lines = htmlCode.split('\n');
      lines.splice(suggestion.lineStart - 1, 0, suggestion.code);
      newCode = lines.join('\n');
    } else {
      // Modificação geral - substituir código completo
      newCode = suggestion.code;
    }

    setHtmlCode(newCode);
    editorRef.current.setValue(newCode);

    // Marcar sugestão como aplicada
    setMessages(prev => prev.map(msg => {
      if (msg.codeSuggestions?.some(s => s.id === suggestion.id)) {
        return {
          ...msg,
          appliedSuggestions: [...(msg.appliedSuggestions || []), suggestion.id]
        };
      }
      return msg;
    }));

    setAiStatusMessage(`✅ Sugestão aplicada: ${suggestion.description}`);
    setTimeout(() => setAiStatusMessage(''), 3000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        title="Abrir Chat de Programação em Par"
      >
        <i className="fa-solid fa-comments text-lg"></i>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-slate-800 border border-slate-600 rounded-lg shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-600 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-robot text-white"></i>
          <span className="text-white font-medium">Programação em Par</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-slate-200 transition-colors"
        >
          <i className="fa-solid fa-times"></i>
        </button>
      </div>

      {/* Context Info */}
      {selectedCode && (
        <div className="p-2 bg-blue-900/30 border-b border-slate-600 text-xs">
          <span className="text-blue-300">
            📍 Código selecionado (linhas {selectedLines?.start}-{selectedLines?.end})
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 text-sm">
            <i className="fa-solid fa-lightbulb text-2xl mb-2 block"></i>
            Faça perguntas sobre seu código ou peça sugestões!
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-700 text-slate-100'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              
              {/* Code Suggestions */}
              {message.codeSuggestions && message.codeSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.codeSuggestions.map(suggestion => (
                    <div key={suggestion.id} className="bg-slate-800 rounded p-2 border border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-300">{suggestion.description}</span>
                        <span className="text-xs text-green-400">{suggestion.confidence}%</span>
                      </div>
                      <pre className="text-xs bg-slate-900 p-2 rounded overflow-x-auto">
                        <code>{suggestion.code}</code>
                      </pre>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        disabled={message.appliedSuggestions?.includes(suggestion.id)}
                        className={`mt-2 w-full py-1 px-2 rounded text-xs transition-colors ${
                          message.appliedSuggestions?.includes(suggestion.id)
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {message.appliedSuggestions?.includes(suggestion.id) ? '✅ Aplicado' : 'Aplicar Sugestão'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoadingAi && (
          <div className="flex justify-start">
            <div className="bg-slate-700 text-slate-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Analisando e gerando sugestões...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-600">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Pergunte sobre o código ou peça sugestões..."
            className="flex-1 bg-slate-700 text-white px-3 py-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
            disabled={isLoadingAi}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoadingAi}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded transition-colors"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};
