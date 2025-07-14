import React, { useState, useRef, useEffect } from 'react';
import { Role, type Message } from '../types';
import MessageBubble from './MessageBubble';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import Loader from './Loader';
import TopicRibbon from './TopicRibbon';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  topicSuggestions: string[];
  areSuggestionsLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  isReady, 
  error,
  topicSuggestions,
  areSuggestionsLoading,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && isReady) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    const input = document.getElementById('chat-input');
    input?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg, index) => (
          <MessageBubble key={index} role={msg.role} content={msg.content} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <MessageBubble role={Role.Model} content="" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div 
        className="p-4 bg-primary-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        {!isReady && !error && messages.length === 0 ? (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <Loader />
            <span className="ml-2">Inicializando asistente...</span>
          </div>
        ) : (
          <>
            <TopicRibbon 
              suggestions={topicSuggestions} 
              onSuggestionClick={handleSuggestionClick}
              isLoading={areSuggestionsLoading}
            />
            <form onSubmit={handleSubmit} className="flex items-center space-x-3 mt-2">
              <input
                id="chat-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isReady ? "Escribe tu pregunta aquí..." : "Esperando documentos..."}
                disabled={isLoading || !isReady}
                className="flex-1 p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:outline-none transition disabled:opacity-50"
                aria-label="Escribe tu pregunta"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-3 rounded-full bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                aria-label="Enviar mensaje"
              >
                <PaperAirplaneIcon />
              </button>
            </form>
          </>
        )}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default ChatInterface;