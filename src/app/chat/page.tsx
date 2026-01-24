'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, BookOpen, Activity, Stethoscope } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "🤒 Dengue vs Flu",
    "💉 Vaccine Schedule",
    "💊 Antibiotic Resistance",
    "🍏 Diabetes Diet"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || input;
    const finalInput = textToSend.trim();
    if (!finalInput || isLoading) return;

    // Optimistic UI: Add user message immediately
    const newMessages: Message[] = [...messages, { role: 'user', content: finalInput }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: finalInput,
          // Map to backend expectation if needed (e.g., standardizing roles)
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

  // Helper to format message content
  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const trimmedLine = line.trim();
      
      // 1. Headers: ### Title
      if (line.startsWith('### ')) {
        return (
          <h3 key={i} className="text-blue-700 font-bold text-lg mt-4 mb-2">
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
      // processing inline bold (**text**) and citations ([Source: Info])
      const parts: (string | React.ReactNode)[] = [];
      let lastIndex = 0;
      
      // Regex matches either **bold** OR [citation: info]
      const regex = /(\*\*(.*?)\*\*)|(\[(.*?):(.*?)\])/g;
      let match;

      while ((match = regex.exec(line)) !== null) {
        // match[0] is full match
        // match[1] is full bold group (**...**)
        // match[2] is bold text content
        // match[3] is full citation group
        // match[4] is citation source
        // match[5] is citation details

        // Push preceding text
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }

        if (match[1]) {
          // It's bold
          parts.push(
            <strong key={`${i}-${match.index}`} className="font-bold text-slate-900">
              {match[2]}
            </strong>
          );
        } else if (match[3]) {
          // It's citation
          parts.push(
            <span key={`${i}-${match.index}`} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100 align-middle">
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

      // If line is a bullet point (legacy support or if model outputs it)
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('- ')) {
          return <div key={i} className="pl-4 mb-1">{parts.length > 0 ? parts : line}</div>;
      }
      
      // Empty lines
      if (!trimmedLine) {
          return <div key={i} className="h-4"></div>;
      }

      return (
        <p key={i} className="mb-2 leading-relaxed text-slate-700">
           {parts.length > 0 ? parts : line}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 relative font-sans text-slate-800">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Zero State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-slide-in">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white p-6 rounded-full ring-1 ring-blue-100 shadow-md">
                  <Activity className="w-10 h-10 text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hi, I'm Aiva.</h1>
                <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                  I can explain symptoms and research using verified sources.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md px-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => handleSubmit(undefined, sug)}
                    className="p-3.5 text-sm text-left bg-white text-slate-600 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat History */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 animate-slide-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white border border-gray-200'}
              `}>
                {msg.role === 'user' ? (
                  <User size={16} className="text-white" />
                ) : (
                  <Stethoscope size={16} className="text-blue-600" />
                )}
              </div>

              {/* Bubble */}
              <div className={`
                max-w-[85%] p-4 rounded-2xl shadow-sm text-[15px] leading-6
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 text-slate-800 rounded-bl-none'}
              `}>
                {msg.role === 'user' ? (
                  <p>{msg.content}</p>
                ) : (
                  <div className="space-y-0.5">
                    {renderMessageContent(msg.content)}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
               <Stethoscope size={16} className="text-blue-600" />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-4 left-0 right-0 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100">
             <form onSubmit={(e) => handleSubmit(e)} className="relative flex items-center pr-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about a symptom or disease..."
                  disabled={isLoading}
                  className="w-full px-5 py-3.5 bg-transparent text-slate-800 focus:outline-none placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm ml-2 shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3 font-medium">
            AI can make mistakes. Consult a doctor.
          </p>
        </div>
      </div>
    </div>
  );
}
