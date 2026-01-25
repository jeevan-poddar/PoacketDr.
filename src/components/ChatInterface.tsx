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
  <div className="flex flex-col h-[calc(100vh-2rem)] max-w-5xl mx-auto w-full bg-white/70 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/60 shadow-xl my-4">
    
    {/* 1. Header (Fixed height) */}
    <div className="px-6 py-4 border-b border-slate-100 bg-white/50 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 leading-tight">Aiva AI</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Health Assistant</p>
        </div>
      </div>
      <button onClick={clearChat} className="p-2 text-slate-400 hover:text-red-500 transition-all">
        <Trash2 size={18} />
      </button>
    </div>

    {/* 2. Messages Area (Expands to fill available space) */}
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-transparent">
      {/* ... your messages mapping logic ... */}
      <div ref={messagesEndRef} />
    </div>

    {/* 3. Input Area (Pinned to bottom) */}
    <div className="p-6 bg-white/50 border-t border-slate-100 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center gap-3 relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a symptom or disease..."
          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 focus:ring-2 focus:ring-purple-500/20 outline-none pr-16 shadow-sm"
        />
        <button
          onClick={handleSubmit}
          className="absolute right-2 p-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg hover:scale-105 transition-transform"
        >
          <Send size={20} />
        </button>
      </div>
      <p className="text-[10px] text-center text-slate-400 mt-3">
        AI can make mistakes. Consult a doctor.
      </p>
    </div>
  </div>
);
}