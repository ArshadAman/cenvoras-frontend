import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { askAI } from '../api/ai';
import { getSubscriptionEntitlements } from '../api/subscription';

export default function AIChatWidget() {
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-entitlements'],
    queryFn: getSubscriptionEntitlements,
    staleTime: 60_000,
    retry: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;

  const entitlements = subscriptionData?.data || {};
  const planCode = String(entitlements?.plan?.code || '').toLowerCase();
  const canUseGemini = Boolean(entitlements?.can?.ai_copilot) || planCode === 'business';

  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(() => {
    return localStorage.getItem('gemini_chat_dismissed') === 'true';
  });
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your business assistant. Try asking:\n• \"What is my top product?\"\n• \"Sales today?\"\n• \"Low stock items?\"" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Render only on /dashboard and when subscription permits
  if (!canUseGemini || pathname !== '/dashboard') {
    return null;
  }

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsHidden(true);
    localStorage.setItem('gemini_chat_dismissed', 'true');
    setIsOpen(false);
  };

  const handleRestore = () => {
    setIsHidden(false);
    localStorage.setItem('gemini_chat_dismissed', 'false');
  };

  const handleSend = async (overrideInput = null, displayName = null) => {
    const textToSend = overrideInput || input.trim();
    if (!textToSend || loading) return;

    const userMsg = { role: 'user', content: displayName || textToSend };
    setMessages(prev => [...prev, userMsg]);

    if (!overrideInput) setInput('');
    setLoading(true);

    try {
      const { data } = await askAI(textToSend);

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        action: data.action 
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (isHidden) {
    return (
      <button
        onClick={handleRestore}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] h-14 w-8 bg-black/60 backdrop-blur-xl border-l border-y border-white/20 rounded-l-2xl flex items-center justify-center cursor-pointer hover:bg-black/80 hover:w-10 transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)] group"
        title="Restore Assistant"
      >
        <SparklesIcon className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform animate-pulse" />
      </button>
    );
  }

  return (
    <>
      {/* Floating Button Container */}
      {!isOpen ? (
        <div className="fixed bottom-6 right-6 z-[100] group">
          {/* Mini Dismiss Badge */}
          <button
            onClick={handleDismiss}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white/70 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 scale-100 md:scale-75 md:group-hover:scale-100 hover:bg-red-500/80 hover:border-red-500/50"
            title="Hide Assistant"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
          
          {/* Main Floating Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            <SparklesIcon className="w-6 h-6 animate-pulse" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(false)}
          className="fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:bottom-24 w-auto md:w-[400px] h-[calc(100vh-110px)] md:h-[580px] max-h-[580px] bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5 font-sans z-[100] transition-all duration-300">
          
          {/* Header */}
          <div className="px-4 py-4 md:px-6 md:py-5 border-b border-white/5 flex flex-col gap-0.5 md:gap-1 items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-transparent opacity-50 pointer-events-none" />
            <h3 className="text-base md:text-lg font-semibold tracking-tight text-white/90 relative z-10 flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-cyan-200" /> Cenvora Intelligence
            </h3>
            <p className="text-[10px] md:text-xs font-medium text-white/40 uppercase tracking-widest relative z-10">Business Copilot</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 space-y-4 md:space-y-6 custom-scrollbar relative">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] text-sm md:text-[15px] font-medium leading-relaxed text-white/90 bg-white/10 px-4 py-2 rounded-2xl rounded-tr-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-[95%] text-sm md:text-[15px] leading-relaxed text-white/80">
                    <ReactMarkdown
                      components={{
                        p: ({children}) => <p className="mb-3 last:mb-0 leading-relaxed font-light">{children}</p>,
                        strong: ({children}) => <strong className="text-white font-medium">{children}</strong>,
                        ul: ({children}) => <ul className="list-none mb-3 space-y-2 opacity-90">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-4 mb-3 space-y-2 font-light opacity-90">{children}</ol>,
                        li: ({children}) => <li className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-white/40 before:rounded-full">{children}</li>,
                        h3: ({children}) => <h3 className="text-white/90 font-medium tracking-tight mt-4 mb-2">{children}</h3>,
                        hr: () => <hr className="border-white/10 my-4" />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {msg.action && msg.action.intent === 'select_option' && (
                      <div className="mt-4 space-y-2 animate-fade-up">
                        {msg.action.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              // Send the choice with ID but show name in chat
                              handleSend(`CHOOSE_CUSTOMER:${opt.id}`, opt.name); 
                            }}
                            className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
                          >
                            <p className="text-sm font-medium text-white/90 group-hover:text-cyan-200">{opt.name}</p>
                            <p className="text-xs text-white/40 group-hover:text-white/60">{opt.detail}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.action && msg.action.intent === 'create_invoice' && (
                      <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 animate-fade-up">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <SparklesIcon className="w-4 h-4 text-cyan-300" />
                          </div>
                          <p className="text-xs font-semibold text-cyan-100/80 uppercase tracking-wider">
                            {msg.action.status === 'success' ? 'Action Completed' : 'AI Draft Prepared'}
                          </p>
                        </div>
                        <p className="text-sm text-white/60 mb-4 font-light">
                          {msg.action.status === 'success' 
                            ? `Invoice ${msg.action.invoice_number} has been recorded in your ledger.`
                            : `I've prepared a draft for ${msg.action.entities?.customer_name || 'a new customer'} with ${msg.action.entities?.items?.length || 0} items.`
                          }
                        </p>
                        {msg.action.status === 'success' ? (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/sales', { state: { viewInvoiceId: msg.action.invoice_id } });
                            }}
                            className="w-full py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-400 transition-all shadow-lg shadow-green-950/20 active:scale-95"
                          >
                            View Invoice Details
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsOpen(false);
                              navigate('/sales', { state: { aiDraft: msg.action.entities } });
                            }}
                            className="w-full py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-medium hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-950/20 active:scale-95"
                          >
                            Review & Create Invoice
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-1.5 items-center h-6 px-2 opacity-50">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 bg-white/[0.02] border-t border-white/5 backdrop-blur-3xl">
            <div className={`flex items-center gap-2 md:gap-3 bg-white/[0.08] rounded-full px-3 py-1 md:px-4 md:py-1.5 border transition-colors duration-300 ${
              input.length > 0 ? 'border-white/20' : 'border-transparent'
            }`}>
              <SparklesIcon className={`w-4 h-4 transition-colors duration-300 flex-shrink-0 ${input.length > 0 ? 'text-cyan-300' : 'text-white/30'}`} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask intelligence..."
                className="flex-1 bg-transparent text-sm md:text-[15px] font-light text-white placeholder-white/30 outline-none py-1.5 md:py-2 min-w-0"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className={`p-1.5 md:p-2 rounded-full transition-all duration-300 flex-shrink-0 ${
                  input.trim() && !loading 
                    ? 'bg-white/20 text-white hover:bg-white/30 hover:scale-105' 
                    : 'bg-transparent text-transparent'
                }`}
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
            <div className="mt-2 md:mt-3 text-center">
               <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-white/20 font-medium font-sans">AI can make mistakes. Verify important data.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
