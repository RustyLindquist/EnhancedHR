import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Flame, MoreHorizontal, MessageSquare, Sparkles, GraduationCap, Bot } from 'lucide-react';

interface AIPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  context?: {
    currentTime: number;
    lessonId: string;
    transcript?: any[];
  };
}

type AIMode = 'assistant' | 'tutor';

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, setIsOpen, context }) => {
  const [width, setWidth] = useState(384); // Default w-96
  const [isDragging, setIsDragging] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const [mode, setMode] = useState<AIMode>('assistant');

  // Handle Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      // Panel is on the right, so width is total width - mouse X position
      const newWidth = document.body.clientWidth - e.clientX;

      // Constraints: Min 300px, Max 800px
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Re-enable transitions after dragging stops
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
              <span className="font-bold text-sm tracking-widest uppercase text-brand-orange drop-shadow-[0_0_5px_rgba(255,147,0,0.5)] truncate leading-none">
                Prometheus AI
              </span>
            </div>
            <MoreHorizontal size={16} className="text-slate-500 cursor-pointer hover:text-white transition-colors flex-shrink-0" />
          </div>
        )}
      </div>

      {/* MODE TOGGLE (Only when open) */}
      {isOpen && (
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

              {/* Dynamic Empty State Message based on Mode */}
              <div className="flex items-start space-x-3 animate-float">
                <div className="flex-shrink-0 pt-1">
                  {mode === 'assistant' ? (
                    <div className="w-8 h-8 rounded-lg bg-brand-orange/20 border border-brand-orange/30 flex items-center justify-center text-brand-orange shadow-[0_0_15px_rgba(255,147,0,0.2)]">
                      <Flame size={16} />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-brand-blue-light/20 border border-brand-blue-light/30 flex items-center justify-center text-brand-blue-light shadow-[0_0_15px_rgba(120,192,240,0.2)]">
                      <GraduationCap size={16} />
                    </div>
                  )}
                </div>

                <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-lg backdrop-blur-md">
                  {mode === 'assistant' ? (
                    <>
                      <p>I can help you navigate this course. Ask me to:</p>
                      <ul className="mt-2 space-y-2 list-disc list-inside text-slate-400 text-xs">
                        <li>Summarize the module</li>
                        <li>Explain key concepts</li>
                        <li>Draft an email based on this lesson</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p>I'm your personal Tutor. I'll help you master this material.</p>
                      <p className="mt-2 text-slate-400 text-xs">We can roleplay scenarios, I can quiz you on the content, or we can create a personalized study guide.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2 pl-11">
                {mode === 'assistant' ? (
                  <>
                    <button className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                      Summarize this module
                    </button>
                    <button className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                      What are the key takeaways?
                    </button>
                  </>
                ) : (
                  <>
                    <button className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                      Quiz me on this
                    </button>
                    <button className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                      Roleplay a scenario
                    </button>
                  </>
                )}
              </div>

              {/* Disclaimer Text moved to bottom of history pane */}
              <div className="w-full flex justify-center pt-4 pb-2">
                <p className="text-[10px] text-center text-slate-500 opacity-60">
                  Prometheus can make mistakes. Verify important info.
                </p>
              </div>
            </div>

            {/* Input Area (Footer) */}
            <div className="h-28 flex-shrink-0 p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-md flex flex-col justify-center">
              <div className="relative group w-full">

                {/* --- GLOW EFFECTS --- */}
                <div
                  className={`
                    absolute -top-4 -left-4 w-16 h-16 
                    ${mode === 'assistant' ? 'bg-[#FF9300]' : 'bg-[#78C0F0]'} rounded-full blur-[20px] 
                    opacity-20 
                    group-hover:opacity-60 group-hover:w-32 group-hover:h-32 group-hover:-top-10 group-hover:-left-10 group-hover:blur-[40px]
                    group-focus-within:opacity-100 group-focus-within:w-48 group-focus-within:h-48 group-focus-within:-top-12 group-focus-within:-left-12 group-focus-within:blur-[60px]
                    transition-all duration-700 ease-out pointer-events-none mix-blend-screen
                  `}
                ></div>

                {/* Input Container */}
                <div className={`relative rounded-xl p-[1px] bg-gradient-to-br transition-all duration-500 shadow-lg z-10 ${mode === 'assistant' ? 'from-[#FF9300]/30 via-white/10 to-[#78C0F0]/10' : 'from-[#78C0F0]/30 via-white/10 to-[#FF9300]/10'}`}>
                  <div className="relative bg-[#0A0D12] rounded-xl overflow-hidden">
                    <input
                      type="text"
                      placeholder={mode === 'assistant' ? "Ask about the course..." : "Start tutoring session..."}
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
                      <button className={`
                            p-2 rounded-lg 
                            bg-white/5 border border-white/10
                            text-slate-400
                            group-hover:text-white 
                            transition-all duration-300 
                            shadow-sm
                            ${mode === 'assistant' ? 'group-hover:bg-[#FF9300] group-hover:border-[#FF9300]' : 'group-hover:bg-[#78C0F0] group-hover:border-[#78C0F0] group-hover:text-black'}
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