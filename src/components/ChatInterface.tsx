"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Bot, User, Trash2, Sparkles, Loader2 } from "lucide-react";
import { sendMessage } from "@/app/actions/chat";
import { useAuth } from "@/context/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Chat with Personalized Welcome
  useEffect(() => {
    const welcomeText = profile?.name
      ? `Hello ${profile.name.split(' ')[0]}! 👋 I'm Aiva. I can help you understand medical concepts, symptoms, and vaccinations. How are you feeling today?`
      : "Hello! I'm Aiva, your health awareness assistant. How can I help you today?";

    setMessages([{
      id: "welcome",
      role: "assistant",
      content: welcomeText,
      timestamp: new Date(),
    }]);
  }, [profile?.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Pass user metadata to the server action
      const response = await sendMessage(userMessage.content, user?.id, profile);

      if (!response.success || !response.message) {
        throw new Error(response.error || "No response from Aiva");
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: "error-" + Date.now(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    if (window.confirm("Do you want to clear your conversation history?")) {
      setMessages(prev => [prev[0]]); // Keep only welcome message
    }
  };

  // Avatar initials from profile
  const userInitials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/60 shadow-xl">

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 leading-tight">Aiva</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Health Assistant</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex items-end gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
            >
              {/* Avatar Icons */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-xs font-bold ${message.role === "assistant"
                  ? "bg-gradient-to-tr from-purple-600 to-blue-600 text-white"
                  : "bg-slate-200 text-slate-600"
                }`}>
                {message.role === "assistant" ? <Bot size={16} /> : userInitials}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] md:max-w-[75%] px-5 py-3.5 shadow-sm rounded-2xl ${message.role === "user"
                  ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-none"
                  : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                }`}
              >
                <div className="text-[14px] leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </div>
                <div className={`text-[9px] mt-2 font-medium opacity-50 ${message.role === "user" ? "text-white" : "text-slate-400"
                  }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Animation */}
        {isLoading && (
          <div className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <Loader2 size={14} className="text-purple-600 animate-spin" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-5 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your symptoms or ask a health question..."
            disabled={isLoading}
            className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all text-sm font-medium"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg shadow-purple-500/20"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
          Aiva provides information for awareness. Always consult a doctor for diagnosis.
        </p>
      </div>
    </div>
  );
}