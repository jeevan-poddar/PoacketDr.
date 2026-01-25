'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, ArrowLeft, Trash2, Sparkles,
  BookOpen
} from 'lucide-react';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  // --- STATES ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const SUGGESTIONS = [
    "🤒 Dengue vs Flu",
    "💉 Vaccine Schedule",
    "💊 Antibiotic Resistance",
    "🍏 Diabetes Diet"
  ];

  // --- LOGIC: SCROLL TO BOTTOM ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- LOGIC: HANDLE SUBMIT ---
  const handleSubmit = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    const finalInput = textToSend.trim();
    if (!finalInput || isLoading) return;

    // Optimistic UI
    const newMessages: Message[] = [...messages, { role: 'user', content: finalInput }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: finalInput,
          history: newMessages.map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
          }))
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          const data = await response.json();
          throw new Error(data.text || "Rate limit exceeded");
        }
        throw new Error('Failed to fetch response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Error: ${error.message || "Something went wrong. Please try again."}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC: RICH TEXT RENDERING ---
  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();

      // 1. Headers
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-purple-700 font-bold text-lg mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      }

      // 2. Disclaimers
      if (line.toLowerCase().includes('disclaimer:')) {
        return (
          <div key={i} className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div>{line}</div>
          </div>
        );
      }

      // 3. Rich Text (Bold & Citations)
      const parts: (string | React.ReactNode)[] = [];
      let lastIndex = 0;
      const regex = /(\*\*(.*?)\*\*)|(\[(.*?):(.*?)\])/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }

        if (match[1]) { // Bold
          parts.push(
            <strong key={`${i}-${match.index}`} className="font-bold text-slate-900">
              {match[2]}
            </strong>
          );
        } else if (match[3]) { // Citation
          parts.push(
            <span key={`${i}-${match.index}`} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-100 align-middle">
              <BookOpen size={10} />
              {match[4].trim()}
            </span>
          );
        }
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }

      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
        return <div key={i} className="pl-4 mb-1">{parts.length > 0 ? parts : line}</div>;
      }

      if (!trimmedLine) return <div key={i} className="h-4"></div>;

      return (
        <p key={i} className="mb-2 leading-relaxed text-slate-700">
          {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    // FIX: Main Container
    <div className="h-[100dvh] w-full bg-[#F4F1FF] font-sans relative selection:bg-purple-200 overflow-hidden flex flex-col">

      {/* --- BACKGROUND ANIMATION --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-purple-200/40 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-blue-200/40 rounded-full blur-[120px]"
        />
      </div>

      {/* --- HEADER --- */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
        <button
          onClick={() => router.push('/dashboard')}
          className="pointer-events-auto p-2.5 bg-white/60 backdrop-blur-md rounded-full shadow-sm hover:bg-white text-slate-500 hover:text-purple-600 transition-all active:scale-95"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setMessages([])}
          className="pointer-events-auto p-2.5 bg-white/60 backdrop-blur-md rounded-full shadow-sm hover:bg-white text-slate-500 hover:text-red-500 transition-all active:scale-95"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </header>

      {/* --- CHAT AREA --- */}
      {/* Added pb-32 to ensure content isn't hidden behind the absolute input bar */}
      <main className="flex-1 w-full z-10 overflow-y-auto pb-32 pt-20 px-4 md:px-0">
        <div className="max-w-3xl mx-auto min-h-full flex flex-col">

          {messages.length === 0 ? (
            /* ZERO STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
              <div className="relative w-48 h-48 md:w-56 md:h-56 mb-6">
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/30 to-blue-400/30 rounded-full blur-[60px] animate-pulse" />
                <img
                  src="/robo.png"
                  alt="Aiva"
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                  style={{ animation: 'float 6s ease-in-out infinite' }}
                />
              </div>

              <h2 className="text-3xl font-bold text-slate-800 mb-2">Hi, I'm Aiva.</h2>
              <p className="text-slate-500 max-w-xs mx-auto mb-8">
                I can explain symptoms and research using verified sources.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSubmit(undefined, sug)}
                    className="p-4 text-sm text-left bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl hover:bg-white/90 hover:border-purple-200 hover:text-purple-700 transition-all shadow-sm active:scale-98"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* MESSAGES LIST */
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`
                      max-w-[90%] md:max-w-[80%] p-5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm relative
                      ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none'
                        : 'bg-white/80 backdrop-blur-md border border-white/60 text-slate-800 rounded-tl-none'}
                    `}>
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200/50">
                          <Sparkles className="w-3 h-3 text-purple-500" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Aiva AI</span>
                        </div>
                      )}

                      {msg.role === 'user' ? (
                        <p>{msg.content}</p>
                      ) : (
                        <div className="space-y-0.5">
                          {renderMessageContent(msg.content)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start w-full">
                  <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 border border-white/50">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* --- INPUT AREA (Fixed at Bottom with Absolute Position) --- */}
      {/* FIX: Absolute positioning guarantees it sticks to the bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 z-20 w-full px-4 pb-4 pt-4 md:px-6 md:pb-6 bg-gradient-to-t from-[#F4F1FF] via-[#F4F1FF]/80 to-transparent">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => handleSubmit(e)}
            className="relative flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-white/60 p-2 rounded-2xl shadow-xl shadow-purple-900/10 transition-all focus-within:ring-2 focus-within:ring-purple-500/20"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a symptom or disease..."
              disabled={isLoading}
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 px-4 py-2 text-base outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg shadow-purple-600/20 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
            AI can make mistakes. Consult a doctor.
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}