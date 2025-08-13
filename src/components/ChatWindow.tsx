import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';

// API endpoint configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: string[];
  accuracy?: number;
  timestamp: Date;
}

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message: inputValue.trim()
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.response,
        sources: response.data.sources,
        accuracy: response.data.accuracy_percentage,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error. Please make sure the backend server is running on port 8000.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">AI Assistant</h2>
        <p className="text-white/60">Ask questions about your documents and get AI-powered answers</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`
                max-w-3xl p-4 rounded-2xl
                ${message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'bg-white/10 text-white border border-white/20'
                }
              `}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {message.accuracy !== undefined && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white/80">Accuracy:</span>
                      <div className="flex-1 bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, message.accuracy || 0))}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-white/70">{message.accuracy?.toFixed(1) || '0.0'}%</span>
                    </div>
                  </div>
                )}
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-xs font-semibold text-white/80 mb-1">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {message.sources.map((source, index) => (
                        <span 
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-white/10 rounded-full text-white/70"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} style={{ height: '1px', minHeight: '1px' }} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-white/10">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your documents..."
              className="w-full p-4 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;