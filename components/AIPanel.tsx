import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Flame, MoreHorizontal, MessageSquare, Sparkles, GripVertical } from 'lucide-react';

interface AIPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, setIsOpen }) => {
  const [width, setWidth] = useState(384); // Default w-96
  const [isDragging, setIsDragging] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);

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
        flex flex-col z-30 h-full shadow-[-5px_0_30px_0_rgba(0,0,0,0.3)]
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
           <div className="w-3 h-16 bg-brand-blue-light border border-white/20 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(120,192,240,0.8)] hover:bg-brand-blue-light/90">
             <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
             <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
             <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
           </div>
        </div>
      )}

      {/* Header */}
      <div className={`h-24 flex-shrink-0 flex items-center ${isOpen ? 'justify-between px-6' : 'justify-center'} border-b border-white/5 bg-white/5 backdrop-blur-md relative`}>
         {/* Toggle Button - Placed on border */}
         <button 
           onClick={() => setIsOpen(!isOpen)} 
           className="absolute -left-3 top-9 bg-slate-800/80 border border-white/20 rounded-full p-1 text-slate-400 hover:text-white hover:border-brand-blue-light/50 hover:shadow-[0_0_10px_rgba(120,192,240,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
         >
          {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        
        {isOpen && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <Flame size={18} className="text-brand-blue-light animate-pulse flex-shrink-0" />
            <div className="flex flex-col">
                <span className="font-bold text-sm tracking-widest uppercase text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)] truncate leading-none mb-0.5">
                  Prometheus
                </span>
                <span className="text-[10px] text-slate-400 tracking-wider font-medium uppercase opacity-80 leading-none">
                  Your AI Assistant
                </span>
            </div>
          </div>
        )}
        
        {isOpen && <MoreHorizontal size={16} className="text-slate-500 cursor-pointer hover:text-white transition-colors flex-shrink-0" />}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {isOpen ? (
          <>
            {/* Messages */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
              {/* AI Message */}
              <div className="flex items-start space-x-4 animate-float">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-blue-light flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(120,192,240,0.3)]">
                  <Flame size={14} className="text-white fill-white" />
                </div>
                <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-lg backdrop-blur-md">
                  <p>I noticed you're looking at <span className="text-brand-blue-light font-medium">Leadership</span> courses.</p>
                  <br/>
                  <p>Would you like me to highlight the ones that offer <span className="text-brand-orange font-medium">SHRM PDCs</span>?</p>
                </div>
              </div>
              
               {/* Suggestion Chips */}
               <div className="flex flex-wrap gap-2 pl-12">
                 <button className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all backdrop-blur-sm shadow-sm whitespace-nowrap">
                   Yes, show SHRM credits
                 </button>
                 <button className="text-xs bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all backdrop-blur-sm shadow-sm whitespace-nowrap">
                   What's popular?
                 </button>
               </div>

               {/* Disclaimer Text moved to bottom of history pane */}
               <div className="w-full flex justify-center pt-4 pb-2">
                  <p className="text-[10px] text-center text-slate-500 opacity-60">
                    AI can make mistakes. Verify important information.
                  </p>
               </div>
            </div>
            
            {/* Input Area (Footer) */}
            <div className="h-28 flex-shrink-0 p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-md flex flex-col justify-center">
              <div className="relative group w-full">
                
                {/* --- GLOW EFFECTS (Re-engineered for intensity) --- */}

                {/* 1. Orange "Hot Corner" (Top Left) */}
                <div 
                  className="
                    absolute -top-4 -left-4 w-16 h-16 
                    bg-[#FF9300] rounded-full blur-[20px] 
                    opacity-20 
                    group-hover:opacity-60 group-hover:w-32 group-hover:h-32 group-hover:-top-10 group-hover:-left-10 group-hover:blur-[40px]
                    group-focus-within:opacity-100 group-focus-within:w-48 group-focus-within:h-48 group-focus-within:-top-12 group-focus-within:-left-12 group-focus-within:blur-[60px]
                    transition-all duration-700 ease-out pointer-events-none mix-blend-screen
                  "
                ></div>

                {/* 2. Blue "Hot Corner" (Bottom Right) */}
                <div 
                  className="
                    absolute -bottom-4 -right-4 w-16 h-16 
                    bg-[#78C0F0] rounded-full blur-[20px] 
                    opacity-20 
                    group-hover:opacity-60 group-hover:w-32 group-hover:h-32 group-hover:-bottom-10 group-hover:-right-10 group-hover:blur-[40px]
                    group-focus-within:opacity-100 group-focus-within:w-48 group-focus-within:h-48 group-focus-within:-bottom-12 group-focus-within:-right-12 group-focus-within:blur-[60px]
                    transition-all duration-700 ease-out pointer-events-none mix-blend-screen
                  "
                ></div>

                {/* 3. Ambient Bridge (Connecting the two) */}
                 <div 
                    className="
                        absolute inset-0 rounded-xl 
                        bg-gradient-to-br from-[#FF9300]/10 via-transparent to-[#78C0F0]/10
                        opacity-0 group-hover:opacity-30 group-focus-within:opacity-50
                        blur-xl transition-all duration-700 pointer-events-none
                    "
                 ></div>

                {/* Input Container with Dynamic Gradient Border */}
                <div className="relative rounded-xl p-[1px] bg-gradient-to-br from-[#FF9300]/30 via-white/10 to-[#78C0F0]/30 group-hover:from-[#FF9300] group-hover:via-white/20 group-hover:to-[#78C0F0] group-focus-within:from-[#FF9300] group-focus-within:via-white/30 group-focus-within:to-[#78C0F0] transition-all duration-500 shadow-lg z-10">
                   {/* Input Background - Dark enough to contrast text, but allowing glow to frame it */}
                   <div className="relative bg-[#0A0D12] rounded-xl overflow-hidden">
                        <input 
                          type="text" 
                          placeholder="Ask anything..." 
                          className="
                            w-full bg-transparent
                            rounded-xl py-3.5 px-5 pr-12 
                            text-sm text-white 
                            placeholder-slate-500 
                            focus:outline-none 
                            transition-all duration-300
                          "
                        />
                        
                        {/* Inner Top Highlight (Glass Effect) */}
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50"></div>
                        
                        {/* Send/Action Button */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                          <button className="
                            p-2 rounded-lg 
                            bg-white/5 border border-white/10
                            text-brand-blue-light/70 
                            group-hover:text-white group-hover:bg-[#78C0F0] group-hover:border-[#78C0F0]
                            group-focus-within:text-white group-focus-within:bg-[#78C0F0] group-focus-within:border-[#78C0F0]
                            transition-all duration-300 
                            shadow-sm
                          ">
                            <MessageSquare size={16} />
                          </button>
                        </div>
                   </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Collapsed State - Residual Presence */
          <div 
            className="flex-1 flex flex-col items-center pt-12 space-y-8 cursor-pointer hover:bg-white/5 transition-colors group" 
            onClick={() => setIsOpen(true)}
          >
             <div className="vertical-text transform -rotate-90 text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500 group-hover:text-brand-blue-light whitespace-nowrap transition-colors drop-shadow-sm">
               Prometheus
             </div>
             <div className="w-10 h-10 rounded-full bg-brand-blue/10 border border-brand-blue-light/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(120,192,240,0.4)] transition-all backdrop-blur-sm">
               <Flame size={18} className="text-brand-blue-light animate-pulse" />
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;