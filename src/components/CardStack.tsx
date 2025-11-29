import React, { useRef } from 'react';
import { Plus, Star, Clock, Play, Award, Bookmark, ShieldCheck, CheckCircle } from 'lucide-react';
import { Course } from '../types';
import { DEFAULT_COURSE_IMAGE } from '../constants';

interface CardStackProps extends Course {
  onAddClick?: (courseId: number) => void;
  onDragStart?: (courseId: number) => void;
  onClick?: (courseId: number) => void;
  depth?: 'stack' | 'single' | 'flat'; // New prop to control visual depth
}

const CardStack: React.FC<CardStackProps> = ({
  id,
  title,
  author,
  category,
  progress,
  image,
  description,
  duration,
  rating,
  badges,
  isSaved,
  onAddClick,
  onDragStart,
  onClick,
  depth = 'stack' // Default to full stack for courses
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleDragStartEvent = (e: React.DragEvent<HTMLDivElement>) => {
    // Hide default ghost image
    const emptyImg = new Image();
    emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(emptyImg, 0, 0);

    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'copy';

    if (onDragStart) onDragStart(id);
  };

  // Determine Image to show
  const displayImage = image || DEFAULT_COURSE_IMAGE;

  // Star Rating Renderer
  const renderStars = (score: number) => {
    return (
      <div className="flex space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${star <= Math.round(score) ? 'text-brand-blue-light fill-brand-blue-light' : 'text-slate-600'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="relative group cursor-pointer active:cursor-grabbing w-full h-[28rem] perspective-1000"
      draggable="true"
      onDragStart={handleDragStartEvent}
      onClick={() => onClick && onClick(id)}
    >

      {/* --- Depth Layer 2 (Bottom) - Only for 'stack' --- */}
      {depth === 'stack' && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[94%] h-[98%] 
          bg-slate-800/40 backdrop-blur-[2px] border border-white/5 rounded-2xl shadow-2xl
          transform rotate-3 translate-y-4
          transition-all duration-500 ease-out 
          group-hover:translate-y-1.5 group-hover:rotate-4 group-hover:bg-slate-700/50 
          z-0">
        </div>
      )}

      {/* --- Depth Layer 1 (Middle) - For 'stack' and 'single' --- */}
      {(depth === 'stack' || depth === 'single') && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[98%] h-[99%] 
          bg-slate-800/60 backdrop-blur-[4px] border border-white/10 rounded-2xl shadow-xl
          transform ${depth === 'stack' ? '-rotate-2 translate-y-2.5' : 'rotate-1 translate-y-1'}
          transition-all duration-500 ease-out 
          group-hover:-translate-y-px group-hover:-rotate-1 group-hover:bg-slate-700/70 
          z-10`}>
        </div>
      )}

      {/* --- Main Card (Front - Liquid Glass) --- */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="
          relative w-full h-full z-20
          bg-[#0f172a]/70
          backdrop-blur-2xl 
          border border-white/10
          rounded-2xl flex flex-col
          shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]
          transition-all duration-300 group-hover:-translate-y-2 
          group-hover:shadow-[0_30px_70px_-12px_rgba(120,192,240,0.15)]
          group-hover:border-white/20
          overflow-hidden
        "
      >
        {/* --- Flashlight Effects --- */}
        <div
          className="absolute inset-0 z-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.1), transparent 40%)`
          }}
        ></div>

        <div
          className="absolute inset-0 z-50 rounded-2xl border border-brand-blue-light/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            maskImage: `radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`,
            WebkitMaskImage: `radial-gradient(300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent)`
          }}
        ></div>

        {/* --- Featured Image Section (Top 40%) --- */}
        <div className="relative h-44 w-full overflow-hidden flex-shrink-0">
          {/* Image */}
          <img
            src={displayImage}
            alt={title}
            onError={(e) => {
              e.currentTarget.src = DEFAULT_COURSE_IMAGE;
              e.currentTarget.onerror = null; // Prevent infinite loop
            }}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          />
          {/* Overlay Gradient for Text Contrast/Integration */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/30"></div>

          {/* Top Badges / Indicators */}
          <div className="absolute top-3 left-3 flex gap-2">
            {badges.includes('REQUIRED') && (
              <div className="bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg backdrop-blur-sm border border-white/10 flex items-center gap-1">
                <ShieldCheck size={12} />
                REQUIRED
              </div>
            )}
          </div>

          {/* BOOKMARK RIBBON */}
          <div className="absolute -top-0 right-6 z-30">
            {isSaved ? (
              /* Saved: Orange Ribbon draping down */
              <div
                className="bg-brand-orange text-white w-8 h-12 flex items-start justify-center pt-2 shadow-lg transition-transform duration-300 hover:scale-110 origin-top"
                style={{
                  clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)',
                  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                }}
              >
                <Bookmark size={16} className="fill-white" />
              </div>
            ) : (
              /* Not Saved: Standard ghost button on hover */
              <div className="mt-3 bg-black/40 text-slate-300 p-2 rounded-lg border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 hover:text-white">
                <Bookmark size={16} />
              </div>
            )}
          </div>

          {/* Category Tag on Image */}
          <div className="absolute bottom-3 left-3">
            <span className="
                text-[10px] font-bold tracking-widest uppercase 
                text-brand-blue-light bg-[#054C74]/90 border border-brand-blue-light/20 
                px-2 py-1 rounded backdrop-blur-md shadow-lg
              ">
              {category}
            </span>
          </div>
        </div>

        {/* --- Add to Collection FAB (Straddling Line) --- */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click logic
            if (onAddClick) onAddClick(id);
          }}
          className="absolute top-44 right-6 -translate-y-1/2 z-30 w-[25px] h-[25px] bg-brand-orange rounded-full flex items-center justify-center text-white shadow-lg hover:bg-brand-orange/90 hover:scale-110 transition-all duration-300 group/btn"
          title="Add to collection"
        >
          <Plus size={14} className="group-hover/btn:rotate-90 transition-transform duration-300" />
        </button>

        {/* --- Content Body --- */}
        <div className="flex-1 p-6 flex flex-col justify-between relative z-20">

          <div>
            {/* Header: Title & Badges */}
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-white leading-tight group-hover:text-brand-blue-light transition-colors line-clamp-2 drop-shadow-md">
                {title}
              </h3>
            </div>

            {/* Author & Rating */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-slate-400 font-medium tracking-wide">{author}</span>
              {renderStars(rating)}
            </div>

            {/* Accreditation Badges */}
            {(badges.includes('SHRM') || badges.includes('HRCI')) && (
              <div className="flex gap-2 mb-3">
                {badges.includes('SHRM') && (
                  <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">SHRM</span>
                )}
                {badges.includes('HRCI') && (
                  <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">HRCI</span>
                )}
              </div>
            )}

            {/* Description */}
            <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 opacity-80 group-hover:opacity-100 transition-opacity font-light">
              {description}
            </p>
          </div>

          {/* --- Footer Actions --- */}
          <div className="pt-4 mt-2 border-t border-white/5">
            {progress === 100 ? (
              /* COMPLETED STATE */
              <div className="flex justify-between items-center">
                <div className="flex items-center text-brand-blue-light space-x-2">
                  <CheckCircle size={18} className="fill-brand-blue-light/20" />
                  <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
                </div>
                <button className="flex items-center space-x-1 text-xs text-slate-200 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                  <Award size={16} className="text-brand-orange" />
                  <span>Credit</span>
                </button>
              </div>
            ) : progress > 0 ? (
              /* IN PROGRESS STATE */
              <div className="space-y-2">
                <div className="flex justify-between items-end text-[11px] text-slate-300 font-medium uppercase tracking-wider">
                  <span>{progress}% Complete</span>
                  <span className="text-white group-hover:text-brand-blue-light transition-colors flex items-center gap-1 cursor-pointer">
                    Resume <Play size={10} className="fill-current" />
                  </span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-1.5 border border-white/5 overflow-hidden">
                  <div
                    className="bg-brand-blue-light h-full rounded-full shadow-[0_0_10px_rgba(120,192,240,0.5)] relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              /* NOT STARTED STATE */
              <div className="flex justify-between items-center">
                <div className="flex items-center text-slate-500 text-xs font-medium">
                  <Clock size={14} className="mr-1.5" />
                  <span>{duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Start Button */}
                  <button className="
                            flex items-center space-x-1.5 
                            bg-white/5 hover:bg-brand-blue-light hover:text-brand-black 
                            border border-white/10 hover:border-brand-blue-light
                            text-white text-xs font-bold px-4 py-2 rounded-full 
                            transition-all duration-300 shadow-lg
                         ">
                    <span>Start</span>
                    <Play size={10} className="fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CardStack;
