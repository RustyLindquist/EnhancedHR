import React from 'react';
import { BackgroundTheme } from '../types';

interface BackgroundSystemProps {
  theme: BackgroundTheme;
}

const BackgroundSystem: React.FC<BackgroundSystemProps> = ({ theme }) => {
  const isCustom = theme.type === 'custom';
  const isDefaultTheme = theme.id === 'deep-void';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base dark layer */}
      <div className="absolute inset-0 bg-[#0A0D12]" />

      {isCustom ? (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${theme.value})` }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>
      ) : isDefaultTheme ? (
        <>
            {/* 1. Enhanced Atmospheric Glow - Subtle & Deep */}
            <div 
                className="absolute inset-0 z-0"
                style={{
                    background: 'radial-gradient(circle at 50% -20%, #082f4d 0%, #0A0D12 60%, #000000 100%)',
                    opacity: 0.7
                }}
            />

            {/* 2. Crisp Tech Grid - Tighter (4x) & More Visible */}
            <div 
                className="absolute inset-0 z-0 opacity-[0.12]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(120, 192, 240, 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(120, 192, 240, 0.2) 1px, transparent 1px)
                    `,
                    backgroundSize: '15px 15px',
                    maskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)'
                }}
            />

            {/* 3. Diffuse Light Rays (SVG) - Tightened & Animated */}
            <div className="absolute inset-0 w-full h-full z-0 mix-blend-screen opacity-50">
                <svg 
                    className="w-full h-full blur-[40px]" 
                    viewBox="0 0 100 100" 
                    preserveAspectRatio="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#78C0F0" stopOpacity="0.3" />
                            <stop offset="50%" stopColor="#78C0F0" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <g className="animate-pulse-slow animate-ray-move">
                        {/* Central Beam - Tighter */}
                        <path d="M 45 -10 L 65 120 L 40 120 L 42 -10 Z" fill="url(#beam-grad)" />
                        
                        {/* Right Beam - Closer to center */}
                        <path d="M 52 -10 L 80 120 L 65 120 L 48 -10 Z" fill="url(#beam-grad)" opacity="0.7" />
                        
                        {/* Left Beam - Closer to center */}
                        <path d="M 38 -10 L 35 120 L 20 120 L 32 -10 Z" fill="url(#beam-grad)" opacity="0.7" />
                    </g>
                </svg>
            </div>
            
            {/* 4. Top Light Source/Flare - Reduced for darker top background */}
            <div 
                className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] rounded-full mix-blend-screen blur-[120px] opacity-20" 
                style={{ background: '#054C74' }}
            />
        </>
      ) : (
        <div className={`absolute inset-0 transition-all duration-1000 ${theme.value}`}></div>
      )}

      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-10" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
           }}>
      </div>
    </div>
  );
};

export default BackgroundSystem;