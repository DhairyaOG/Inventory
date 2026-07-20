import React, { useState, useRef, useEffect } from 'react';
import { askAI, syncDb } from '../services/api';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Pantri AI. Ask me anything about your sales or inventory!", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const syncPromiseRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpenChat = () => {
    setIsOpen(true);
    // Fire off sync in the background so it's ready (or almost ready) when they ask a question.
    if (!syncPromiseRef.current) {
      const apiKey = import.meta.env.VITE_API_SECRET_KEY || 'abc';
      syncPromiseRef.current = syncDb(apiKey).catch(err => {
        console.error('Background sync failed:', err);
        syncPromiseRef.current = null; // Reset so we don't block
      });
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInput('');
    setIsLoading(true);

    try {
      if (syncPromiseRef.current) {
        // Remove typing indicator if we're going to show a sync message
        setMessages(prev => [...prev, { text: "⏳ Syncing latest database before answering...", isBot: true, isTemp: true }]);
        await syncPromiseRef.current;
        syncPromiseRef.current = null; // Clear it so subsequent questions don't wait
        
        // Remove the temp syncing message
        setMessages(prev => prev.filter(m => !m.isTemp));
      }

      const response = await askAI(userMessage);
      setMessages(prev => [...prev, { text: response.answer, isBot: true }]);
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.isTemp));
      setMessages(prev => [...prev, { text: `Error: ${err.response?.data?.error || err.message}`, isBot: true, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="w-80 h-96 bg-white/90 backdrop-blur-xl border border-indigo-100 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h3 className="font-bold">Pantri AI</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Chat Window */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-3 flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${
                    msg.isBot 
                      ? msg.isError 
                        ? 'bg-red-50 text-red-700 border border-red-100' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about inventory..."
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button 
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
        >
          <span className="text-2xl">✨</span>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
