"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Bot, User } from "lucide-react";
import { sendMessage } from "@/app/actions/chat";
import { useAuth } from "@/context/AuthProvider";

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

  // Set personalized welcome message based on profile
  useEffect(() => {
    const welcomeMessage = profile?.name 
      ? `Hello ${profile.name}! 👋 I'm PocketDr, your personal health assistant. I have your health profile on file and can provide personalized advice. How can I help you today?`
      : "Hello! I'm PocketDr, your personal health assistant. How can I help you today?";
    
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: welcomeMessage,
      timestamp: new Date(),
    }]);
  }, [profile?.name]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Pass user profile to server action for personalized responses
      const response = await sendMessage(userMessage.content, user?.id, profile);
      
      if (!response.success || !response.message) {
        throw new Error(response.error || "Failed to get response");
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Get user initials for avatar
  const userInitials = profile?.name 
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end gap-3 ${
              message.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            {message.role === "assistant" ? (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2db3a0] to-[#00509d] flex items-center justify-center shrink-0 shadow-md">
                <Bot size={18} className="text-white" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md text-white text-xs font-bold">
                {userInitials}
              </div>
            )}

            {/* Bubble */}
            <div
              className={`max-w-[75%] px-5 py-3.5 shadow-sm ${
                message.role === "user"
                  ? "bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white rounded-2xl rounded-br-sm"
                  : "bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-bl-sm"
              }`}
            >
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p
                suppressHydrationWarning
                className={`text-[10px] mt-2 ${
                  message.role === "user" ? "text-white/70" : "text-slate-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-end gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2db3a0] to-[#00509d] flex items-center justify-center shrink-0 shadow-md">
              <Bot size={18} className="text-white" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#2db3a0] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-[#00509d] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-[#003060] rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white p-4">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={profile?.name ? `Ask me anything, ${profile.name}...` : "Type your health question..."}
            disabled={isLoading}
            className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2db3a0]/50 focus:border-[#2db3a0] transition-all text-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="p-3.5 bg-gradient-to-r from-[#2db3a0] to-[#00509d] text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
