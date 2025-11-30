import React, { useState, useEffect } from 'react';
import { LucideIcon, Flame } from 'lucide-react';
import { COLLECTION_PORTALS } from '../constants';

interface PortalProps {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  onDrop: (collectionId: string) => void;
  isDragging: boolean;
  activeFlareId: string | null;
  onClick: (id: string) => void;
}

const PortalItem: React.FC<PortalProps> = ({ id, label, icon: Icon, color, onDrop, isDragging, activeFlareId, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlaring, setIsFlaring] = useState(false);

  // Handle Flare Animation Reset
  useEffect(() => {
    if (isFlaring) {
      const timer = setTimeout(() => setIsFlaring(false), 800); // Reset after animation
      return () => clearTimeout(timer);
    }
  }, [isFlaring]);

  // Handle External Flare Trigger
  useEffect(() => {
    if (activeFlareId === id) {
      setIsFlaring(true);
    }
  }, [activeFlareId, id]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsHovered(true);
  };

  const handleDragLeave = () => {
    setIsHovered(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    setIsFlaring(true); // Trigger flare
    onDrop(id);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      setIsFlaring(true);
      onClick(id);
    }
  };

  return (
    <div
      className="group relative flex flex-col items-center justify-center w-1/4 h-full transition-all duration-500 cursor-pointer pointer-events-auto"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {/* --- FLARE ANIMATION (Success State) --- */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[300px] bg-white mix-blend-screen rounded-t-full transition-all duration-700 ease-out pointer-events-none z-30 ${isFlaring ? 'opacity-40 scale-150 blur-3xl' : 'opacity-0 scale-50 blur-sm'}`}
        style={{ backgroundColor: color }}
      ></div>

      {/* The Glow/Flame Effect - The "Portal Light" */}
      <div
        className={`
            absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 rounded-t-full blur-2xl mix-blend-screen transform translate-y-8
            transition-all duration-700
            ${isHovered ? 'opacity-80 scale-125' : 'opacity-0 group-hover:opacity-40'}
            ${isDragging && !isHovered ? 'opacity-20 animate-pulse' : ''}
        `}
        style={{ backgroundColor: color }}
      ></div>

      {/* Secondary Glow */}
      <div
        className={`
            absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-16 rounded-t-full blur-xl mix-blend-screen
            transition-all duration-500
            ${isHovered ? 'opacity-100 scale-150' : 'opacity-0 group-hover:opacity-60'}
        `}
        style={{ backgroundColor: color }}
      ></div>

      {/* Stacked Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-2 mb-2">

        {/* Icon Container */}
        <div className={`transition-transform duration-500 ${isHovered ? '-translate-y-2 scale-110' : 'group-hover:-translate-y-1 group-hover:scale-105'}`}>
          <div
            className={`p-2.5 rounded-full bg-black border shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all ${isHovered ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'border-white/20 group-hover:border-white/40'}`}
            style={{ boxShadow: isHovered ? `0 0 30px ${color}` : `0 0 0 1px ${color}20` }}
          >
            <div className="relative">
              <Icon size={20} color={color} className={`drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] relative z-10 ${isFlaring ? 'animate-ping' : ''}`} />
            </div>
          </div>
        </div>

        {/* Label Group */}
        <div className="flex items-center gap-1.5">
          <Flame size={10} className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} color={color} fill={color} />
          <span
            className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors drop-shadow-sm ${isHovered ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
            style={{ textShadow: `0 0 20px ${color}` }}
          >
            {label}
          </span>
        </div>

      </div>
    </div>
  );
};

interface CollectionSurfaceProps {
  onDropCourse: (collectionId: string) => void;
  isDragging?: boolean;
  activeFlareId?: string | null;
  onCollectionClick?: (id: string) => void;
}

const CollectionSurface: React.FC<CollectionSurfaceProps> = ({
  onDropCourse,
  isDragging = false,
  activeFlareId = null,
  onCollectionClick
}) => {
  return (
    <div className="relative w-full h-28 flex-shrink-0 z-[60]">
      {/* Visual Background Footer Bar */}
      <div className="absolute inset-0 border-t border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.2)] z-10"></div>

      {/* Visual Gradients to blend surface with canvas */}
      <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-[#0A0D12]/90 via-[#0A0D12]/40 to-transparent pointer-events-none z-0"></div>

      {/* Content Container - Fits exactly within parent h-28 */}
      <div className="absolute inset-0 w-full h-full flex justify-between items-center px-12 pointer-events-none z-20">
        {COLLECTION_PORTALS.map(portal => (
          <PortalItem
            key={portal.id}
            id={portal.id}
            label={portal.label}
            icon={portal.icon}
            color={portal.color}
            onDrop={onDropCourse}
            isDragging={isDragging}
            activeFlareId={activeFlareId}
            onClick={(id) => {
              if (onCollectionClick) {
                onCollectionClick(id);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CollectionSurface;