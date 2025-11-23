import React, { useRef } from 'react';
import { Plus } from 'lucide-react';
import { Course } from '../types';

interface CardStackProps extends Course {}

const CardStack: React.FC<CardStackProps> = ({ title, author, category, progress }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="relative group cursor-pointer w-full h-72 perspective-1000">
      {/* --- Depth Layer 2 (Bottom) --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[85%] h-full 
        bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl shadow-2xl
        transition-all duration-500 group-hover:translate-y-3 group-hover:rotate-3 z-0 opacity-40">
      </div>
      
      {/* --- Depth Layer 1 (Middle) --- */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[92%] h-full 
        bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl
        transition-all duration-500 group-hover:translate-y-1.5 group-hover:-rotate-1 z-10 opacity-70">
      </div>
      
      {/* --- Main Card (Front - Liquid Glass) --- */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="
          relative w-full h-full z-20
          bg-gradient-to-br from-white/10 to-white/5
          backdrop-blur-2xl 
          border border-white/10
          rounded-2xl p-6 flex flex-col justify-between
          shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
          transition-all duration-300 group-hover:-translate-y-1 
          group-hover:shadow-[0_20px_50px_0_rgba(120,192,240,0.15)]
          overflow-hidden
        "
      >
        {/* --- Flashlight Effects --- */}
        
        {/* 1. Background Flashlight (Soft Glow) */}
        <div 
          className="absolute inset-0 z-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-screen"
          style={{
            background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(120,192,240,0.15), transparent 40%)`
          }}
        ></div>

        {/* 2. Border Flashlight (Reveals border locally) */}
        <div 
          className="absolute inset-0 z-50 rounded-2xl border border-brand-blue-light/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            maskImage: `radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`,
            WebkitMaskImage: `radial-gradient(250px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`
          }}
        ></div>

        {/* --- Border Beam Animation (Blue SVG) --- */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-40 rounded-2xl">
            {/* Path 1: Top-Left Origin -> Top & Right */}
            <rect 
                x="0" y="0" width="100%" height="100%" rx="16" ry="16"
                fill="none"
                stroke="#78C0F0"
                strokeWidth="1"
                pathLength="100"
                strokeDasharray="0 100"
                className="transition-all duration-[1200ms] ease-out group-hover:[stroke-dasharray:50_100]"
            />
            
            {/* Path 2: Bottom-Right Origin -> Bottom & Left (Rotated 180) */}
            <rect 
                x="0" y="0" width="100%" height="100%" rx="16" ry="16"
                fill="none"
                stroke="#78C0F0"
                strokeWidth="1"
                pathLength="100"
                strokeDasharray="0 100"
                className="transition-all duration-[1200ms] ease-out origin-center rotate-180 group-hover:[stroke-dasharray:50_100]"
            />
        </svg>

        {/* Specular Highlight / Reflection */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none rounded-t-2xl z-10"></div>

        {/* Card Header */}
        <div className="flex justify-between items-start relative z-30 pointer-events-none">
          <span className="
            text-[10px] font-bold tracking-widest uppercase 
            text-brand-blue-light/90 border border-brand-blue-light/20 
            bg-brand-blue-light/5 px-2 py-1 rounded shadow-[0_0_10px_rgba(120,192,240,0.1)]
          ">
            {category}
          </span>
          <button className="
            text-slate-400 group-hover:text-white p-1.5 rounded-full 
            bg-white/5 group-hover:bg-white/20 border border-white/5 group-hover:border-white/30
            transition-all duration-300 backdrop-blur-sm shadow-inner pointer-events-auto
          ">
            <Plus size={16} />
          </button>
        </div>

        {/* Card Content */}
        <div className="space-y-4 relative z-30 pointer-events-none">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2 leading-tight group-hover:text-brand-blue-light transition-colors drop-shadow-lg">
              {title}
            </h3>
            <p className="text-sm text-slate-300 font-light tracking-wide opacity-80">{author}</p>
          </div>
          
          {/* Progress Indicator */}
          {progress > 0 && (
            <div className="w-full bg-black/20 rounded-full h-1 border border-white/5">
              <div 
                className="bg-brand-blue-light h-1 rounded-full shadow-[0_0_15px_rgba(120,192,240,0.8)] relative overflow-hidden" 
                style={{ width: `${progress}%` }}
              >
                 <div className="absolute inset-0 bg-white/30 w-full h-full animate-pulse"></div>
              </div>
            </div>
          )}
        </div>

        {/* Subtle inner glow on hover - blended with flashlight */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-brand-blue-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default CardStack;