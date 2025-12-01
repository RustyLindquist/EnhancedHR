import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, MoreHorizontal, MessageSquare, Sparkles, GraduationCap, Bot, User, Loader2, Library, Download, Plus } from 'lucide-react';
import { getAgentResponse } from '@/lib/ai/engine';
import { AgentType, ContextScope } from '@/lib/ai/types';

interface AIPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // New Props for Context Engineering
  agentType?: AgentType; // Default agent to load
  contextScope?: ContextScope; // Scope for RAG
  initialPrompt?: string;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  setIsOpen,
  agentType = 'platform_assistant',
  contextScope = { type: 'PLATFORM' },
  initialPrompt
}) => {
  const [width, setWidth] = useState(384); // Default w-96
  const [isDragging, setIsDragging] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);

  // Internal Mode State (Only relevant if toggling between Assistant/Tutor in Course Scope)
  const [mode, setMode] = useState<'assistant' | 'tutor'>('assistant');

  // Derived effective agent type based on internal toggle if in Course Scope
  const effectiveAgentType: AgentType = (contextScope.type === 'COURSE' && mode === 'tutor')
    ? 'course_tutor'
    : (contextScope.type === 'COURSE')
      ? 'course_assistant'
      : agentType;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialPromptRun = useRef(false);

  // Handle Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    };
  }, [isDragging]);

  const lastProcessedPromptRef = useRef<string | undefined>(undefined);

  // Handle Initial Prompt
  useEffect(() => {
    if (initialPrompt && isOpen && initialPrompt !== lastProcessedPromptRef.current) {
      lastProcessedPromptRef.current = initialPrompt;
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, parts: m.text }));

      // Use the new AI Engine
      const response = await getAgentResponse(effectiveAgentType, text, contextScope, history);

      const aiMsg: Message = { role: 'model', text: response.text };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to my knowledge base right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get Agent Display Info
  const getAgentInfo = () => {
    switch (effectiveAgentType) {
      case 'course_assistant': return { name: 'Course Assistant', icon: Bot, color: 'text-brand-blue-light', themeColor: 'bg-brand-blue-light' };
      case 'course_tutor': return { name: 'Prometheus Tutor', icon: GraduationCap, color: 'text-brand-orange', themeColor: 'bg-brand-orange' };
      case 'collection_assistant': return { name: 'Collection Assistant', icon: Library, color: 'text-purple-400', themeColor: 'bg-purple-400' };
      case 'platform_assistant': return { name: 'Prometheus AI', icon: Sparkles, color: 'text-brand-orange', themeColor: 'bg-brand-orange' };
      default: return { name: 'AI Assistant', icon: Bot, color: 'text-white', themeColor: 'bg-white' };
    }
  };

  const agentInfo = getAgentInfo();

  return (
    <div
      className={`
        flex-shrink-0 
        bg-white/[0.02] backdrop-blur-xl 
        border-l border-white/10 
        flex flex-col z-[90] h-full shadow-[-5px_0_30px_0_rgba(0,0,0,0.3)]
        relative
        ${!isDragging ? 'transition-all duration-300 ease-in-out' : ''}
      `}
      style={{ width: isOpen ? width : 64 }}
    >
      {/* Vertical Beam Effect - 1px wide, slow expansion */}
      <div
        className={`
          absolute -left-[1px] top-0 bottom-0 w-px bg-brand-blue-light 
          shadow-[0_0_15px_rgba(120,192,240,0.8)] z-40 pointer-events-none
          transition-transform duration-[1500ms] ease-out origin-center
          ${isHandleHovered ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}
        `}
      ></div>

      {/* Resize Handle - Only visible when open */}
      {isOpen && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50 group cursor-col-resize p-4"
          onMouseDown={() => setIsDragging(true)}
          onMouseEnter={() => setIsHandleHovered(true)}
          onMouseLeave={() => setIsHandleHovered(false)}
        >
          {/* Interface Modifier Color: #5694C7 (Less bright blue) */}
          <div className="w-3 h-16 bg-[#5694C7] border border-white/20 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(86,148,199,0.8)] hover:bg-[#5694C7]/90">
            <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`h-24 flex-shrink-0 flex items-center ${isOpen ? 'justify-between pl-10 pr-6' : 'justify-center'} border-b border-white/5 bg-white/5 backdrop-blur-md relative`}>
        {/* Toggle Button - Placed on border */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -left-3 top-9 bg-[#5694C7] border border-white/20 rounded-full p-1 text-white hover:bg-[#5694C7]/90 hover:shadow-[0_0_10px_rgba(86,148,199,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
        >
          {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {isOpen && (
          <div className="flex items-center overflow-hidden w-full justify-between">
            <div className="flex flex-col justify-center">
              <span className={`font-bold text-sm tracking-widest uppercase ${agentInfo.color} drop-shadow-[0_0_5px_rgba(255,147,0,0.5)] truncate leading-none`}>
                {agentInfo.name}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Online</span>
              </div>
            </div>
            <MoreHorizontal size={16} className="text-slate-500 cursor-pointer hover:text-white transition-colors flex-shrink-0" />
          </div>
        )}
      </div>

      {/* MODE TOGGLE (Only when open and in Course Scope) */}
      {isOpen && contextScope.type === 'COURSE' && (
        <div className="px-6 py-4 border-b border-white/5">
          <div className="bg-black/30 p-1 rounded-xl flex border border-white/10">
            <button
              onClick={() => setMode('assistant')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mode === 'assistant' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Bot size={14} /> Assistant
            </button>
            <button
              onClick={() => setMode('tutor')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mode === 'tutor' ? 'bg-brand-blue-light text-brand-black shadow-[0_0_15px_rgba(120,192,240,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <GraduationCap size={14} /> Tutor
            </button>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-black/20">
        {isOpen ? (
          <>
            {/* Messages */}
            <div className="flex-1 px-6 pt-8 pb-6 space-y-6 overflow-y-auto no-scrollbar">

              {messages.length === 0 ? (
                <>
                  {/* Dynamic Empty State Message based on Agent Type */}
                  <div className="flex items-start space-x-3 animate-float">
                    <div className="flex-shrink-0 pt-1">
                      <div className={`w-8 h-8 rounded-lg ${agentInfo.themeColor}/20 border ${agentInfo.themeColor}/30 flex items-center justify-center ${agentInfo.color} shadow-[0_0_15px_rgba(255,147,0,0.2)]`}>
                        <agentInfo.icon size={16} />
                      </div>
                    </div>

                    <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-lg backdrop-blur-md">
                      {effectiveAgentType === 'course_assistant' && (
                        <>
                          <p>I can help you navigate this course. Ask me to:</p>
                          <ul className="mt-2 space-y-2 list-disc list-inside text-slate-400 text-xs">
                            <li>Summarize the module</li>
                            <li>Explain key concepts</li>
                            <li>Draft an email based on this lesson</li>
                          </ul>
                        </>
                      )}
                      {effectiveAgentType === 'course_tutor' && (
                        <>
                          <p>I'm your personal Tutor. I'll help you master this material.</p>
                          <p className="mt-2 text-slate-400 text-xs">We can roleplay scenarios, I can quiz you on the content, or we can create a personalized study guide.</p>
                        </>
                      )}
                      {effectiveAgentType === 'platform_assistant' && (
                        <>
                          <p>I'm Prometheus, your Platform Assistant.</p>
                          <p className="mt-2 text-slate-400 text-xs">Ask me about any course, help finding content, or general HR questions.</p>
                        </>
                      )}
                      {effectiveAgentType === 'collection_assistant' && (
                        <>
                          <p>I'm the Collection Assistant.</p>
                          <p className="mt-2 text-slate-400 text-xs">I can help you synthesize information across all the items in this collection.</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-2 pl-11">
                    {effectiveAgentType === 'course_assistant' && (
                      <>
                        <button onClick={() => handleSendMessage("Summarize this module")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Summarize this module
                        </button>
                        <button onClick={() => handleSendMessage("What are the key takeaways?")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Key takeaways?
                        </button>
                      </>
                    )}
                    {effectiveAgentType === 'course_tutor' && (
                      <>
                        <button onClick={() => handleSendMessage("Quiz me on this")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Quiz me
                        </button>
                        <button onClick={() => handleSendMessage("Roleplay a scenario")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Roleplay
                        </button>
                      </>
                    )}
                    {effectiveAgentType === 'platform_assistant' && (
                      <>
                        <button onClick={() => handleSendMessage("Find courses on Leadership")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Find Leadership courses
                        </button>
                        <button onClick={() => handleSendMessage("How do I earn credits?")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          How to earn credits?
                        </button>
                      </>
                    )}
                  </div>

                  {/* Disclaimer Text */}
                  <div className="w-full flex justify-center pt-4 pb-2">
                    <p className="text-[10px] text-center text-slate-500 opacity-60">
                      Prometheus can make mistakes. Verify important info.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                        ? 'bg-brand-blue-light text-brand-black rounded-tr-none'
                        : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/10'
                        }`}>
                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-bold uppercase tracking-wider">
                          {msg.role === 'user' ? <User size={10} /> : <agentInfo.icon size={10} />}
                          {msg.role === 'user' ? 'You' : agentInfo.name}
                        </div>
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 size={14} className="animate-spin" />
                        Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area (Footer) */}
            <div className="h-28 flex-shrink-0 p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-md flex flex-col justify-center">
              <div className="relative group w-full">

                {/* --- GLOW EFFECTS --- */}
                <div
                  className={`
                    absolute -top-4 -left-4 w-16 h-16 
                    ${effectiveAgentType === 'course_tutor' ? 'bg-[#FF9300]' : 'bg-[#78C0F0]'} rounded-full blur-[20px] 
                    opacity-20 
                    group-hover:opacity-60 group-hover:w-32 group-hover:h-32 group-hover:-top-10 group-hover:-left-10 group-hover:blur-[40px]
                    group-focus-within:opacity-100 group-focus-within:w-48 group-focus-within:h-48 group-focus-within:-top-12 group-focus-within:-left-12 group-focus-within:blur-[60px]
                    transition-all duration-700 ease-out pointer-events-none mix-blend-screen
                  `}
                ></div>

                {/* Input Container */}
                <div className={`relative rounded-xl p-[1px] bg-gradient-to-br transition-all duration-500 shadow-lg z-10 ${effectiveAgentType === 'course_tutor' ? 'from-[#FF9300]/30 via-white/10 to-[#78C0F0]/10' : 'from-[#78C0F0]/30 via-white/10 to-[#FF9300]/10'}`}>
                  <div className="relative bg-[#0A0D12] rounded-xl overflow-hidden">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                      placeholder={effectiveAgentType === 'course_tutor' ? "Start tutoring session..." : "Ask a question..."}
                      className="
                        w-full bg-transparent
                        rounded-xl py-3.5 px-5 pr-12 
                        text-sm text-white 
                        placeholder-slate-500 
                        focus:outline-none 
                        transition-all duration-300
                      "
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                      <button
                        onClick={() => handleSendMessage(input)}
                        className={`
                          p-2 rounded-lg 
                          bg-white/5 border border-white/10
                          text-slate-400
                          group-hover:text-white 
                          transition-all duration-300 
                          shadow-sm
                          ${effectiveAgentType === 'course_tutor' ? 'group-hover:bg-[#FF9300] group-hover:border-[#FF9300]' : 'group-hover:bg-[#78C0F0] group-hover:border-[#78C0F0] group-hover:text-black'}
                        `}>
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Collapsed State */
          <div
            className="flex-1 flex flex-col items-center pt-12 space-y-8 cursor-pointer hover:bg-white/5 transition-colors group"
            onClick={() => setIsOpen(true)}
          >
            <div className="vertical-text transform -rotate-90 text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500 group-hover:text-brand-orange whitespace-nowrap transition-colors drop-shadow-sm">
              Prometheus AI
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-blue/10 border border-brand-blue-light/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,147,0,0.4)] transition-all backdrop-blur-sm">
              <Flame size={18} className="text-brand-orange animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;