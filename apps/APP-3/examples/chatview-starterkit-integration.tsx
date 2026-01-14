/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    CHATVIEW + STARTER KIT INTEGRATION EXAMPLE                 ║
 * ║                                                                               ║
 * ║              Exemplo de como integrar o auto-save no ChatView                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Este exemplo mostra como:
 * 1. Auto-salvar código gerado como Starter Kit
 * 2. Mostrar preview do kit salvo
 * 3. Permitir publicação no marketplace
 */

import React, { useState, useCallback } from 'react';
import { useStarterKit, type SavedKitInfo } from '@/hooks/useStarterKit';
import { StarterKitPreview, StarterKitMiniIndicator } from '@/components/StarterKitPreview';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  code?: string;
  starterKit?: SavedKitInfo;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE EXEMPLO
// ═══════════════════════════════════════════════════════════════════════════════

export function ChatViewWithStarterKit() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showKitPreview, setShowKitPreview] = useState<SavedKitInfo | null>(null);
  
  const {
    isAvailable,
    isLoading,
    saveGeneration,
    publishKit,
    lastSavedKitInfo,
    clearLastSaved,
  } = useStarterKit();

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: Quando código é gerado
  // ═══════════════════════════════════════════════════════════════════════════

  const handleCodeGenerated = useCallback(async (
    code: string,
    prompt: string,
    messageId: string
  ) => {
    if (!isAvailable) {
      console.log('[ChatView] Marketplace não disponível, pulando auto-save');
      return;
    }

    // Salva automaticamente como Starter Kit
    const kit = await saveGeneration(code, prompt, {
      modelUsed: 'gemini-2.5-flash',
      manifestUsed: 'DETECTED_FROM_PROMPT',
    });

    if (kit) {
      // Atualiza a mensagem com info do kit
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            starterKit: {
              id: kit.id,
              grade: kit.classification.grade,
              quality_score: kit.classification.quality_score,
              category: kit.metadata.category,
              complexity: kit.metadata.complexity,
              estimated_hours: kit.metadata.estimated_hours,
            },
          };
        }
        return msg;
      }));

      console.log(`[ChatView] ✅ Código salvo como Starter Kit: ${kit.id}`);
    }
  }, [isAvailable, saveGeneration]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLER: Publicar kit
  // ═══════════════════════════════════════════════════════════════════════════

  const handlePublishKit = useCallback(async (kitId: string) => {
    const success = await publishKit(kitId);
    
    if (success) {
      alert('Kit publicado no Marketplace! 🎉');
    } else {
      alert('Não foi possível publicar o kit. Verifique a qualidade.');
    }
  }, [publishKit]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-full">
      {/* Header com status do marketplace */}
      <div className="p-2 border-b border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {isAvailable ? (
            <span className="text-green-400">● Marketplace conectado</span>
          ) : (
            <span className="text-yellow-400">○ Marketplace offline</span>
          )}
        </span>
        
        {isLoading && (
          <span className="text-xs text-purple-400 animate-pulse">
            Salvando...
          </span>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className="space-y-2">
            {/* Conteúdo da mensagem */}
            <div className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 ml-auto max-w-[80%]' 
                : 'bg-gray-800 max-w-[80%]'
            }`}>
              {message.content}
            </div>

            {/* Indicador de Starter Kit (se houver) */}
            {message.starterKit && (
              <div className="flex items-center gap-2">
                <StarterKitMiniIndicator
                  grade={message.starterKit.grade}
                  qualityScore={message.starterKit.quality_score}
                  onClick={() => setShowKitPreview(message.starterKit!)}
                />
                <span className="text-xs text-gray-500">
                  ~{message.starterKit.estimated_hours}h economizadas
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview do Kit (modal/sidebar) */}
      {showKitPreview && (
        <div className="absolute bottom-20 right-4 w-80 z-50">
          <StarterKitPreview
            kit={showKitPreview}
            onViewDetails={() => {
              // Abrir modal de detalhes ou navegar para marketplace
              console.log('Ver detalhes do kit:', showKitPreview.id);
            }}
            onPublish={() => handlePublishKit(showKitPreview.id)}
            onDismiss={() => setShowKitPreview(null)}
          />
        </div>
      )}

      {/* Notificação de último kit salvo */}
      {lastSavedKitInfo && (
        <div className="p-3 bg-purple-900/50 border-t border-purple-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-purple-400">✨</span>
              <span className="text-sm">
                Código salvo como Starter Kit (Grade {lastSavedKitInfo.grade})
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowKitPreview(lastSavedKitInfo)}
                className="text-xs px-2 py-1 bg-purple-600 rounded hover:bg-purple-700"
              >
                Ver
              </button>
              <button
                onClick={clearLastSaved}
                className="text-xs px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXEMPLO DE USO NO FLUXO DE GERAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Exemplo de como chamar o auto-save após uma geração:
 * 
 * ```typescript
 * // No seu handler de geração de código:
 * const handleGenerate = async (prompt: string) => {
 *   // 1. Gera o código com Gemini
 *   const response = await geminiService.generate(prompt);
 *   
 *   // 2. Extrai o código da resposta
 *   const code = extractCodeFromResponse(response);
 *   
 *   // 3. Adiciona mensagem ao chat
 *   const messageId = addMessage({
 *     role: 'assistant',
 *     content: response,
 *     code,
 *   });
 *   
 *   // 4. Auto-salva como Starter Kit (em background)
 *   handleCodeGenerated(code, prompt, messageId);
 * };
 * ```
 */

export default ChatViewWithStarterKit;
