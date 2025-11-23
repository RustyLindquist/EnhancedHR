import React from 'react';
import { LucideIcon } from 'lucide-react';
import { COLLECTION_PORTALS } from '../constants';

interface PortalProps {
  label: string;
  icon: LucideIcon;
  color: string;
}

const Portal: React.FC<PortalProps> = ({ label, icon: Icon, color }) => (
  <div className="group relative flex flex-col items-center justify-end pb-6 w-1/4 transition-all duration-500 cursor-pointer pointer-events-auto h-full">
    {/* The Glow/Flame Effect - The "Portal Light" */}
    <div 
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 opacity-0 group-hover:opacity-40 transition-all duration-700 rounded-t-full blur-2xl mix-blend-screen transform translate-y-8"
      style={{ backgroundColor: color }}
    ></div>
    
    {/* Secondary Glow */}
    <div 
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-16 opacity-0 group-hover:opacity-60 transition-all duration-500 rounded-t-full blur-xl mix-blend-screen"
      style={{ backgroundColor: color }}
    ></div>
    
    {/* The Portal "Floor" Ring - Visual anchor at bottom of hover effect */}
    <div className="absolute bottom-12 w-32 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500"></div>

    {/* Icon Container - Positioned to sit on the border line */}
    {/* mb-10 pushes the icon up so its center sits roughly on the top border of the footer container */}
    <div className="relative z-10 mb-10 transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-110">
      <div 
        className="p-3 rounded-full bg-black border border-white/20 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:border-white/40 transition-all"
        style={{ boxShadow: `0 0 0 1px ${color}20` }}
      >
        <Icon size={22} color={color} className="drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
      </div>
    </div>
    
    {/* Label - Sits inside the footer bar */}
    <span 
      className="absolute bottom-6 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 group-hover:text-white transition-colors relative z-10 drop-shadow-sm"
      style={{ textShadow: `0 0 20px ${color}` }}
    >
      {label}
    </span>
  </div>
);

const CollectionSurface: React.FC = () => {
  return (
    <div className="relative w-full h-28 flex-shrink-0">
        {/* Visual Background Footer Bar */}
        <div className="absolute inset-0 border-t border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.2)] z-10"></div>
        
        {/* Visual Gradients to blend surface with canvas */}
        {/* Anchored to bottom to provide seamless vignette for text legibility over any background */}
        <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#0A0D12]/90 via-[#0A0D12]/40 to-transparent pointer-events-none z-0"></div>
        
        {/* Content Container - Overflowing upwards */}
        <div className="absolute bottom-0 w-full h-48 flex justify-between px-12 pointer-events-none z-20">
          {COLLECTION_PORTALS.map(portal => (
            <Portal 
              key={portal.id}
              label={portal.label}
              icon={portal.icon}
              color={portal.color}
            />
          ))}
        </div>
    </div>
  );
};

export default CollectionSurface;