import React from 'react';
import { Bot } from 'lucide-react';
import { Message } from '../types';
// @ts-ignore
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  isLoading: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLast, isLoading }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-slate-700' : 'bg-indigo-600'}`}>
         {isUser ? <span className="text-xs text-white font-medium">You</span> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Bubble Content Container */}
      <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-1">
                {message.attachments.map((att, i) => (
                    <img 
                        key={i} 
                        src={att.previewUrl} 
                        alt="attachment" 
                        className="max-w-[200px] max-h-[200px] rounded-lg border border-slate-700 object-cover"
                    />
                ))}
            </div>
        )}

        {/* Text Bubble */}
        {message.content && (
            <div 
                className={`rounded-2xl px-5 py-3.5 text-[13px] leading-6 shadow-sm overflow-x-auto markdown-content break-words ${
                isUser 
                    ? 'bg-[#27272a] text-slate-100 border border-slate-700' 
                    : 'bg-transparent text-slate-300'
                }`}
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
                
                {/* Cursor for streaming message */}
                {isLoading && isLast && !isUser && (
                     <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-1 align-middle animate-pulse"></span>
                )}
            </div>
        )}
      </div>
    </div>
  );
};
