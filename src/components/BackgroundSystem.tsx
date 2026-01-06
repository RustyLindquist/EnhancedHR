import React from 'react';
import { BackgroundTheme } from '../types';

interface BackgroundSystemProps {
  theme: BackgroundTheme;
}

const BackgroundSystem: React.FC<BackgroundSystemProps> = ({ theme }) => {
  const isCustom = theme.type === 'custom';

  // Generate Neon Particles once to avoid re-rendering jitter
  const neonParticles = React.useMemo(() => {
    const colors = ['bg-pink-400', 'bg-purple-400', 'bg-cyan-300', 'bg-fuchsia-500', 'bg-indigo-400'];
    const animations = ['animate-neon-float-1', 'animate-neon-float-2', 'animate-neon-float-3'];
    
    return Array.from({ length: 75 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      // Size: Random between 2px and 10px (current max was w-2.5 which is 10px)
      size: Math.random() * 8 + 2, 
      color: colors[Math.floor(Math.random() * colors.length)],
      animation: animations[Math.floor(Math.random() * animations.length)],
      // Spread delays widely (0s to 20s) so they don't all pulse together
      delay: `${Math.random() * 20}s`,
      // Subtle variety in blur based on depth/size
      blur: Math.random() * 1.5 + 0.5 
    }));
  }, []);

  // --- Theme Renderers ---

  const renderDeepVoid = () => (
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

        {/* 3. Diffuse Light Rays (SVG) - Intensitfied */}
        <div className="absolute inset-0 w-full h-full z-0 mix-blend-screen opacity-80">
            <svg 
                className="w-full h-full blur-[30px]" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#78C0F0" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#78C0F0" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </linearGradient>
                </defs>

                <g>
                    {/* Central Beam - Slow Drift */}
                    <path 
                      d="M 45 -10 L 70 120 L 35 120 L 42 -10 Z" 
                      fill="url(#beam-grad)" 
                      className="animate-beam-sway-1" 
                      style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
                    />
                    
                    {/* Right Beam - Reverse Drift */}
                    <path 
                      d="M 52 -10 L 85 120 L 60 120 L 48 -10 Z" 
                      fill="url(#beam-grad)" 
                      opacity="0.8" 
                      className="animate-beam-sway-2" 
                      style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
                    />
                    
                    {/* Left Beam - Slow Drift */}
                    <path 
                      d="M 38 -10 L 40 120 L 15 120 L 32 -10 Z" 
                      fill="url(#beam-grad)" 
                      opacity="0.8" 
                      className="animate-beam-sway-3" 
                      style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
                    />
                </g>
            </svg>
        </div>
        
        {/* 4. Top Light Source/Flare - Reduced for darker top background */}
        <div 
            className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[70%] h-[50%] rounded-full mix-blend-screen blur-[120px] opacity-30" 
            style={{ background: '#054C74' }}
        />
    </>
  );

  const renderNeonHorizon = () => (
    <>
        {/* Retro Purple/Blue Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0518] via-[#1a0b2e] to-[#2d0f45]" />
        
        {/* Horizon Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(200,50,255,0.15),transparent_60%)]" />

        {/* Moving Grid Floor */}
        <div className="absolute inset-0 perspective-container overflow-hidden opacity-50">
            <div 
                className="grid-floor w-full h-[150%] absolute -bottom-[20%] left-0 animate-grid-flow"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(236, 72, 153, 0.5) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(236, 72, 153, 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40%)'
                }}
            ></div>
        </div>

        {/* Floating Neon Particles (Programmatically generated) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {neonParticles.map((particle) => (
               <div 
                 key={particle.id}
                 className={`absolute rounded-full ${particle.color} ${particle.animation}`}
                 style={{
                   top: particle.top,
                   left: particle.left,
                   width: `${particle.size}px`,
                   height: `${particle.size}px`,
                   animationDelay: particle.delay,
                   filter: `blur(${particle.blur}px)`,
                   opacity: 0 // Initial opacity handled by keyframes, but ensuring no FOUC
                 }}
               />
             ))}
        </div>

        {/* Top Digital Mist */}
        <div className="absolute top-0 w-full h-1/2 bg-gradient-to-b from-black via-transparent to-transparent opacity-80" />
    </>
  );

  const renderZenParticles = () => (
    <>
        {/* Warm Golden Dark Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#12100e] via-[#1c1917] to-black" />
        
        {/* Ambient Warmth */}
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-[#ea580c]/10 to-transparent opacity-50" />

        {/* Floating Particles - Increased Opacity */}
        <div className="absolute inset-0 overflow-hidden">
             {/* Particle 1 */}
             <div className="absolute top-[60%] left-[20%] w-64 h-64 rounded-full bg-[#fb923c]/20 blur-[80px] animate-particle-float-1" />
             {/* Particle 2 */}
             <div className="absolute top-[30%] right-[25%] w-96 h-96 rounded-full bg-[#fed7aa]/10 blur-[100px] animate-particle-float-2" />
             {/* Particle 3 */}
             <div className="absolute bottom-[-10%] left-[50%] w-80 h-80 rounded-full bg-[#fff7ed]/10 blur-[60px] animate-particle-float-3" />
        </div>
        
        {/* Subtle Noise Texture on top of particles */}
         <div className="absolute inset-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` 
           }}>
         </div>
    </>
  );

  const renderArcticAurora = () => (
    <>
        {/* Deep Teal/Black Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#0f172a]" />

        {/* Aurora Waves - Using SVG for smoother curves - Increased Opacity */}
        <div className="absolute inset-0 w-full h-full overflow-hidden opacity-60">
            {/* Wave 1 (Green) */}
            <div
                className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] rounded-[100%] bg-gradient-to-r from-transparent via-[#2dd4bf]/20 to-transparent blur-[80px] animate-aurora-wave-1 mix-blend-screen"
                style={{ transformOrigin: 'center center' }}
            />

            {/* Wave 2 (Purple/Blue) */}
            <div
                className="absolute top-[10%] left-[-10%] w-[120%] h-[100%] rounded-[100%] bg-gradient-to-r from-transparent via-[#818cf8]/20 to-transparent blur-[90px] animate-aurora-wave-2 mix-blend-screen"
                style={{ transformOrigin: 'center center' }}
            />
        </div>

        {/* Starfield (Static dots) */}
        <div className="absolute inset-0"
            style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                opacity: 0.1
            }}
        />
    </>
  );

  // --- LIGHT THEMES ---

  const renderMorningMist = () => (
    <>
        {/* Soft Light Gray Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]" />

        {/* Subtle Warm Glow - Top Left */}
        <div
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] animate-mist-drift-1"
            style={{ background: 'radial-gradient(circle, rgba(147, 197, 253, 0.3) 0%, transparent 70%)' }}
        />

        {/* Subtle Cool Glow - Bottom Right */}
        <div
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[100px] animate-mist-drift-2"
            style={{ background: 'radial-gradient(circle, rgba(199, 210, 254, 0.35) 0%, transparent 70%)' }}
        />

        {/* Floating Soft Orbs */}
        <div className="absolute inset-0 overflow-hidden">
            <div
                className="absolute top-[20%] left-[15%] w-32 h-32 rounded-full bg-[#bfdbfe]/20 blur-[40px] animate-particle-float-1"
            />
            <div
                className="absolute top-[50%] right-[20%] w-48 h-48 rounded-full bg-[#c7d2fe]/20 blur-[50px] animate-particle-float-2"
            />
            <div
                className="absolute bottom-[25%] left-[40%] w-40 h-40 rounded-full bg-[#e0e7ff]/25 blur-[45px] animate-particle-float-3"
            />
        </div>

        {/* Very Subtle Grid Pattern */}
        <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(148, 163, 184, 0.5) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(148, 163, 184, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }}
        />
    </>
  );

  const renderCleanSlate = () => (
    <>
        {/* Cool Gray Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-[#e2e8f0] to-[#cbd5e1]" />

        {/* Subtle Blue Accent - Top */}
        <div
            className="absolute top-0 left-0 right-0 h-1/2"
            style={{
                background: 'linear-gradient(180deg, rgba(147, 197, 253, 0.08) 0%, transparent 100%)'
            }}
        />

        {/* Soft Vignette */}
        <div
            className="absolute inset-0"
            style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(148, 163, 184, 0.15) 100%)'
            }}
        />

        {/* Minimal Dot Pattern */}
        <div className="absolute inset-0"
            style={{
                backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.2) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                opacity: 0.5
            }}
        />
    </>
  );

  const renderSoftLinen = () => (
    <>
        {/* Warm Cream/Linen Base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf8f5] via-[#f5f3ef] to-[#ebe7e0]" />

        {/* Subtle Warm Glow - Center */}
        <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[80%] h-[60%] rounded-full blur-[150px]"
            style={{ background: 'radial-gradient(circle, rgba(253, 230, 138, 0.1) 0%, transparent 70%)' }}
        />

        {/* Soft Paper Texture */}
        <div className="absolute inset-0 opacity-[0.04]"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
            }}
        />

        {/* Subtle Warm Edge */}
        <div
            className="absolute inset-0"
            style={{
                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(217, 197, 169, 0.1) 100%)'
            }}
        />
    </>
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base Layer */}
      <div className="absolute inset-0 bg-[#0A0D12]" />

      {isCustom ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${theme.value})` }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
        </div>
      ) : (
        <>
            {theme.id === 'deep-void' && renderDeepVoid()}
            {theme.id === 'neon-horizon' && renderNeonHorizon()}
            {theme.id === 'zen-particles' && renderZenParticles()}
            {theme.id === 'arctic-aurora' && renderArcticAurora()}
            {theme.id === 'morning-mist' && renderMorningMist()}
            {theme.id === 'clean-slate' && renderCleanSlate()}
            {theme.id === 'soft-linen' && renderSoftLinen()}
            {/* Fallback for static presets */}
            {!['deep-void', 'neon-horizon', 'zen-particles', 'arctic-aurora', 'morning-mist', 'clean-slate', 'soft-linen'].includes(theme.id) && (
                 <div className={`absolute inset-0 transition-all duration-1000 ${theme.value}`}></div>
            )}
        </>
      )}

      {/* Global Noise Texture Overlay (Applied to dark themes only, light themes have their own textures) */}
      {!['zen-particles', 'morning-mist', 'clean-slate', 'soft-linen'].includes(theme.id) && (
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-10"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
            }}>
        </div>
      )}
    </div>
  );
};

export default BackgroundSystem;