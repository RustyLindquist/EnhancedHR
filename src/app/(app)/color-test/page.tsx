'use client';

import React from 'react';
import { StickyNote, Clock } from 'lucide-react';

// Color options for Note cards
const colorOptions = [
  {
    name: 'Current',
    hex: '#F5E6A3',
    description: 'Current pale yellow (too light for dark theme)',
    textColor: 'text-slate-800',
    metaColor: 'text-slate-600',
    borderColor: 'border-[#D4C078]/60',
    iconBg: 'bg-slate-800/60',
    iconText: 'text-white/90',
  },
  {
    name: 'Darker Olive-Gold',
    hex: '#B8A844',
    description: 'Rich olive-gold with warm undertones',
    textColor: 'text-slate-900',
    metaColor: 'text-slate-700',
    borderColor: 'border-[#9E8B3A]/60',
    iconBg: 'bg-slate-900/60',
    iconText: 'text-white/90',
  },
  {
    name: 'Muted Golden Yellow',
    hex: '#C4A94D',
    description: 'Balanced golden yellow, still visible',
    textColor: 'text-slate-900',
    metaColor: 'text-slate-700',
    borderColor: 'border-[#A89040]/60',
    iconBg: 'bg-slate-900/60',
    iconText: 'text-white/90',
  },
  {
    name: 'Dark Muted Gold',
    hex: '#9E8B3A',
    description: 'Deep muted gold, more subdued',
    textColor: 'text-white',
    metaColor: 'text-white/70',
    borderColor: 'border-[#7A6C2E]/60',
    iconBg: 'bg-black/40',
    iconText: 'text-white/90',
  },
  {
    name: 'Olive-Khaki',
    hex: '#A89F4A',
    description: 'Olive-khaki blend, earthy feel',
    textColor: 'text-slate-900',
    metaColor: 'text-slate-700',
    borderColor: 'border-[#8A823C]/60',
    iconBg: 'bg-slate-900/60',
    iconText: 'text-white/90',
  },
  {
    name: 'Deep Muted Yellow',
    hex: '#8B7D3B',
    description: 'Deepest option, very subtle',
    textColor: 'text-white',
    metaColor: 'text-white/70',
    borderColor: 'border-[#6E632F]/60',
    iconBg: 'bg-black/40',
    iconText: 'text-white/90',
  },
  {
    name: 'Medium Golden',
    hex: '#BBA94F',
    description: 'Medium golden, good balance',
    textColor: 'text-slate-900',
    metaColor: 'text-slate-700',
    borderColor: 'border-[#9A8C40]/60',
    iconBg: 'bg-slate-900/60',
    iconText: 'text-white/90',
  },
  {
    name: 'Antique Gold',
    hex: '#A0893D',
    description: 'Antique gold, sophisticated',
    textColor: 'text-white',
    metaColor: 'text-white/70',
    borderColor: 'border-[#7F6D30]/60',
    iconBg: 'bg-black/40',
    iconText: 'text-white/90',
  },
];

// Mock Note Card component matching the actual UniversalCard NOTE styling
const NoteCardMock: React.FC<{
  color: typeof colorOptions[0];
}> = ({ color }) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Card */}
      <div
        className={`relative w-full aspect-[4/3] min-h-[280px] rounded-3xl overflow-hidden border ${color.borderColor} shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]`}
        style={{ backgroundColor: color.hex }}
      >
        {/* Top Section - Header */}
        <div className="relative h-[45%] w-full overflow-hidden" style={{ backgroundColor: color.hex }}>
          {/* Header Badge */}
          <div className="absolute top-0 left-0 w-full p-3 z-20">
            <div className={`flex items-center justify-between ${color.iconBg} backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 shadow-sm`}>
              <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${color.iconText} truncate`}>NOTE</span>
              <div className="flex items-center gap-2">
                <StickyNote size={14} className={color.iconText} />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="absolute left-0 right-0 z-10 px-4 top-[calc(50%+20px)] -translate-y-1/2">
            <h3 className={`font-bold ${color.textColor} leading-tight mb-1 text-[17px]`}>
              Sample Note Title
            </h3>
          </div>

          {/* Icon Overlay */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-[-15deg] pointer-events-none">
            <StickyNote size={140} />
          </div>
        </div>

        {/* Bottom Section - Body */}
        <div className="h-[55%] px-5 py-4 flex flex-col justify-between" style={{ backgroundColor: color.hex }}>
          <div className="flex-1 min-h-0">
            <p className={`text-[13px] ${color.textColor} leading-relaxed line-clamp-3 font-light opacity-80`}>
              This is sample note content to demonstrate how text appears on this background color. The goal is to find a color that works well in a dark theme.
            </p>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between mt-4 pt-2 border-t border-black/10 gap-2`}>
            <span className={`text-[10px] font-medium ${color.metaColor}`}>
              My Collection
            </span>
            <div className={`flex items-center gap-1.5 ${color.metaColor}`}>
              <Clock size={12} />
              <span className="text-[10px] font-bold tracking-wider uppercase">Jan 18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Color Info */}
      <div className="text-center space-y-1">
        <p className="text-white font-semibold text-sm">{color.name}</p>
        <p className="text-[#78C0F0] font-mono text-xs">{color.hex}</p>
        <p className="text-slate-400 text-xs">{color.description}</p>
      </div>
    </div>
  );
};

export default function ColorTestPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Note Card Color Options</h1>
        <p className="text-slate-400 text-lg">
          Comparing muted yellow options for Note cards that work better with the dark theme.
          The current color (#F5E6A3) is too light and creates high contrast.
        </p>
      </div>

      {/* Color Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {colorOptions.map((color) => (
          <NoteCardMock key={color.hex} color={color} />
        ))}
      </div>

      {/* Summary Section */}
      <div className="max-w-7xl mx-auto mt-16 p-6 bg-white/5 rounded-2xl border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Color Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {colorOptions.map((color) => (
            <div key={color.hex} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg border border-white/20"
                style={{ backgroundColor: color.hex }}
              />
              <div>
                <p className="text-white text-sm font-medium">{color.name}</p>
                <p className="text-slate-400 font-mono text-xs">{color.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="max-w-7xl mx-auto mt-8 p-6 bg-amber-500/10 rounded-2xl border border-amber-500/20">
        <h3 className="text-amber-400 font-bold mb-2">Recommendation Notes:</h3>
        <ul className="text-amber-200/80 text-sm space-y-1 list-disc list-inside">
          <li><strong>#B8A844</strong> (Darker Olive-Gold) - Good balance, still reads as "sticky note"</li>
          <li><strong>#9E8B3A</strong> (Dark Muted Gold) - More subtle, needs light text</li>
          <li><strong>#A0893D</strong> (Antique Gold) - Sophisticated feel, good for dark themes</li>
          <li>Colors below <strong>#A0893D</strong> brightness may need white text for readability</li>
        </ul>
      </div>
    </div>
  );
}
