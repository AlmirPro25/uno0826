import { useEffect, useRef, useState } from "react";
import { useGhostStore } from "@/stores/useGhostStore"; // Updated import
import { cn, formatTime } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, User, Loader2 } from "lucide-react"; // Import Loader2 for typing indicator

export function ChatWindow() {
  const { messages, activeContactId, contacts, isLoadingMessages, isAgentTyping, sendMessage } = useGhostStore(); // Add sendMessage
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const activeContact = contacts.find(c => c.id === activeContactId);
  const agentIsTypingForActiveContact = activeContactId ? isAgentTyping[activeContactId] : false;

  const handleSendMessage = async () => {
    if (!activeContactId || !inputValue.trim()) return;

    setIsSending(true);
    try {
      await sendMessage(activeContactId, inputValue);
      setInputValue("");
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContactId, agentIsTypingForActiveContact]); // Re-scroll when agent starts/stops typing

  if (!activeContactId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-black/20">
        <Bot className="w-16 h-16 mb-4 opacity-20" />
        <div className="font-mono text-sm uppercase tracking-tighter opacity-40">SELECT A TARGET TO ENGAGE</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden font-sans">
      {/* Header */}
      <div className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/95 backdrop-blur-sm z-10 justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-lg">
              {activeContact?.name?.[0] || activeContact?.id?.[0]}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-base">
              {activeContact?.name || activeContact?.id}
            </div>
            <div className="text-xs text-slate-400 font-mono flex gap-2">
              <span>Latency: {activeContact?.avgResponseTime}s</span>
              <span>•</span>
              <span className={activeContact?.isPaused ? "text-amber-400" : "text-emerald-400"}>
                {activeContact?.isPaused ? "MANUAL" : "AUTO-PILOT"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-950">
        {isLoadingMessages ? (
          <div className="flex justify-center py-10">
            <div className="flex items-center gap-2 text-slate-500 font-mono text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              LOADING HISTORY...
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex w-full",
                  msg.fromMe ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed relative shadow-md",
                    msg.fromMe
                      ? "bg-emerald-600 text-white rounded-tr-sm"
                      : "bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <div className={cn(
                    "text-[10px] mt-2 font-mono flex items-center gap-1 opacity-70",
                    msg.fromMe ? "justify-end text-emerald-100" : "text-slate-400"
                  )}>
                    {msg.fromMe && <Bot className="w-3 h-3" />}
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </motion.div>
            ))}
            {agentIsTypingForActiveContact && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full justify-start"
              >
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 border border-slate-700 flex items-center gap-3">
                  <Bot className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span className="text-sm text-slate-400 font-mono">Generative AI is thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Placeholder - Enabled for future impl */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="relative flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending || activeContact?.isPaused === false} // Optional: Disable control if AI is active? No, user wants manual override.
            // Actually user logic: "Manual Override" implies we CAN send.
            // If activeContact.isPaused is FALSE (AI is engaged), can we send?
            // Yes, user wants to INTERRUPT.
            // So I will enable it always, or maybe visually warn.
            // User request: "Use your phone to intervene" was the old placeholder.
            // I will enable it.
            placeholder={activeContact?.isPaused ? "Type a message..." : "Type to interrupt AI..."}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="bg-emerald-600 text-white rounded-xl px-4 hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
