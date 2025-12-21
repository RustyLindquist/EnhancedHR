import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon, Star, Search, Clock, Plus, Folder, ChevronUp, ChevronDown } from 'lucide-react';
import { COLLECTION_PORTALS } from '../constants';
import { Collection } from '../types';

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
      className="group relative flex flex-col items-center justify-center min-w-[100px] max-w-[160px] flex-1 h-full transition-all duration-500 cursor-pointer pointer-events-auto"
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

        {/* Icon */}
        <div className={`transition-transform duration-500 ${isHovered ? '-translate-y-2 scale-110' : 'group-hover:-translate-y-1 group-hover:scale-105'}`}>
          <Icon
            size={20}
            color={color}
            className={`drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all ${isFlaring ? 'animate-ping' : ''}`}
            style={{ filter: isHovered ? `drop-shadow(0 0 12px ${color})` : undefined }}
          />
        </div>

        {/* Label */}
        <span
          className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors drop-shadow-sm text-center ${isHovered ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}
          style={{ textShadow: `0 0 20px ${color}` }}
        >
          {label}
        </span>

      </div>
    </div>
  );
};

interface CollectionSurfaceProps {
  onDropCourse: (collectionId: string) => void;
  isDragging?: boolean;
  activeFlareId?: string | null;
  onCollectionClick?: (id: string) => void;
  customCollections?: Collection[];
  isOpen?: boolean;
  onToggle?: () => void;
}

// Default colors for custom collections that don't have one
const CUSTOM_COLLECTION_COLORS = [
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

const CollectionSurface: React.FC<CollectionSurfaceProps> = ({
  onDropCourse,
  isDragging = false,
  activeFlareId = null,
  onCollectionClick,
  customCollections = [],
  isOpen = true,
  onToggle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(4); // Default to base portals

  // Calculate how many portals can fit
  useEffect(() => {
    const calculateVisibleCount = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth - 96; // Subtract padding (px-12 = 48px each side)
      const minPortalWidth = 120; // Minimum width per portal
      const maxPortals = Math.floor(containerWidth / minPortalWidth);

      // Always show at least the 4 base portals, cap at reasonable max
      setVisibleCount(Math.max(4, Math.min(maxPortals, 8)));
    };

    calculateVisibleCount();
    window.addEventListener('resize', calculateVisibleCount);
    return () => window.removeEventListener('resize', calculateVisibleCount);
  }, []);

  // Build the list of portals to show
  // Base portals: Favorites, Workspace, Watchlist (3)
  // Then custom collections that fit
  // Finally: New/Other always at the end
  const basePortals = COLLECTION_PORTALS.filter(p => p.id !== 'new');
  const newOtherPortal = COLLECTION_PORTALS.find(p => p.id === 'new')!;

  // Only show truly custom collections (isCustom: true), not the default ones
  // Also filter by ID and label to be thorough
  const basePortalIds = new Set(basePortals.map(p => p.id));
  const basePortalLabels = new Set(['Favorites', 'Workspace', 'Watchlist']);
  const uniqueCustomCollections = customCollections.filter(col =>
    col.isCustom !== false &&
    !basePortalIds.has(col.id) &&
    !basePortalLabels.has(col.label)
  );

  // How many custom collections can we show?
  // visibleCount includes base portals (3) + custom + new/other (1)
  const customSlotsAvailable = Math.max(0, visibleCount - basePortals.length - 1);

  const visibleCustomCollections = uniqueCustomCollections.slice(0, customSlotsAvailable).map((col, index) => ({
    id: col.id,
    label: col.label,
    icon: Folder,
    color: col.color || CUSTOM_COLLECTION_COLORS[index % CUSTOM_COLLECTION_COLORS.length]
  }));

  const allVisiblePortals = [
    ...basePortals,
    ...visibleCustomCollections,
    newOtherPortal
  ];

  return (
    <div className={`relative w-full flex-shrink-0 z-[60] transition-all duration-300 ${isOpen ? 'h-28' : 'h-6'}`}>
      {/* Collapse Toggle Button - Always visible at top center */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute left-1/2 -translate-x-1/2 bg-white/10 border border-white/10 rounded-full p-1 text-white/40 hover:bg-[#5694C7] hover:border-white/20 hover:text-white hover:shadow-[0_0_10px_rgba(86,148,199,0.5)] transition-all shadow-lg z-50 backdrop-blur-md pointer-events-auto"
          style={{ top: isOpen ? '-12px' : '-6px' }}
        >
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      )}

      {/* Visual Background Footer Bar */}
      <div className={`absolute inset-0 border-t border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.2)] z-10 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Content Container - Fits exactly within parent h-28 */}
      <div
        ref={containerRef}
        className={`absolute inset-0 w-full h-full flex justify-center items-center gap-4 px-12 pointer-events-none z-20 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {allVisiblePortals.map(portal => (
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