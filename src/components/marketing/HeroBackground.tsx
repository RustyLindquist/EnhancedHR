import React from 'react';

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* 1. Atmospheric Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(circle at 50% -20%, #082f4d 0%, #0A0D12 60%, #000000 100%)',
          opacity: 0.7,
        }}
      />

      {/* 2. Tech Grid */}
      <div
        className="absolute inset-0 z-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(120, 192, 240, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(120, 192, 240, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '15px 15px',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 60%)',
        }}
      />

      {/* 3. SVG Light Beams */}
      <div className="absolute inset-0 z-0 mix-blend-screen opacity-80">
        <svg
          className="h-full w-full blur-[30px]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hero-beam-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#78C0F0" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#78C0F0" stopOpacity="0.15" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g>
            <path
              d="M 45 -10 L 70 120 L 35 120 L 42 -10 Z"
              fill="url(#hero-beam-grad)"
              className="animate-beam-sway-1"
              style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
            />
            <path
              d="M 52 -10 L 85 120 L 60 120 L 48 -10 Z"
              fill="url(#hero-beam-grad)"
              opacity="0.8"
              className="animate-beam-sway-2"
              style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
            />
            <path
              d="M 38 -10 L 40 120 L 15 120 L 32 -10 Z"
              fill="url(#hero-beam-grad)"
              opacity="0.8"
              className="animate-beam-sway-3"
              style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
            />
          </g>
        </svg>
      </div>

      {/* 4. Top Light Flare */}
      <div
        className="absolute left-1/2 top-[-25%] z-0 h-[50%] w-[70%] -translate-x-1/2 rounded-full mix-blend-screen blur-[120px] opacity-30"
        style={{ background: '#054C74' }}
      />
    </div>
  );
}
