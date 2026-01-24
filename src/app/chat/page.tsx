'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', parts: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.parts }]
          }))
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle rate limit gracefully
        if (response.status === 429 && data.text) {
          setMessages((prev) => [...prev, { role: 'model', parts: data.text }]);
          return;
        }
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages((prev) => [...prev, { role: 'model', parts: data.text }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { role: 'model', parts: `Error: ${error.message || "Something went wrong."}` }]);
    } finally {
      setIsLoading(false);
      // Keep focus on input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <h1 className="font-semibold text-lg text-gray-800 dark:text-white">AI Assistant</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center text-gray-500 space-y-4">
              <Bot className="w-12 h-12 opacity-20" />
              <p>Start a conversation with your AI Assistant!</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              <div
                className={`flex flex-col max-w-[80%] ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="leading-relaxed text-sm sm:text-base prose dark:prose-invert max-w-none">
                     {msg.role === 'model' ? (
                        <ReactMarkdown>{msg.parts}</ReactMarkdown>
                     ) : (
                        <p className="whitespace-pre-wrap">{msg.parts}</p>
                     )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="w-full pl-4 pr-12 py-3.5 bg-gray-100 dark:bg-gray-900 border-transparent focus:bg-white dark:focus:bg-gray-800 border focus:border-blue-500 rounded-xl outline-none transition-all text-gray-800 dark:text-gray-100 placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-sm"
              title="Send message"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
