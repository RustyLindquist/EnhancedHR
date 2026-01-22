'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, Clock, Star, Download, Paperclip } from 'lucide-react';

// =============================================================================
// COLOR SCHEME - Course Card Family with Gradients
// =============================================================================
const courseCardColors = {
  COURSE: {
    gradientStart: '#23355B',    // Top-left
    gradientEnd: '#0B1120',      // Bottom-right
    border: 'rgba(120, 192, 240, 0.3)',
    glow: 'rgba(120, 192, 240, 0.6)',
  },
  MODULE: {
    gradientStart: '#384E6F',    // Top-left
    gradientEnd: '#377AA4',      // Bottom-right
    border: 'rgba(120, 192, 240, 0.3)',
    glow: 'rgba(55, 122, 164, 0.6)',
  },
  LESSON: {
    gradientStart: '#054C74',    // Top-left
    gradientEnd: '#50A7E2',      // Bottom-right
    border: 'rgba(80, 167, 226, 0.3)',
    glow: 'rgba(80, 167, 226, 0.6)',
  },
  ACTIVITY: {
    gradientStart: '#800725',    // Top-left
    gradientEnd: '#9E031A',      // Bottom-right
    border: 'rgba(158, 3, 26, 0.4)',
    glow: 'rgba(158, 3, 26, 0.6)',
  },
};

// =============================================================================
// SAMPLE DATA
// =============================================================================
const sampleData = {
  course: {
    type: 'COURSE' as const,
    title: 'This is the course title',
    expert: 'Dr. Sarah Chen',
    duration: '45 Min',
    rating: 4.9,
    shrm: true,
    hrci: true,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
  module: {
    type: 'MODULE' as const,
    title: 'This is the module title',
    expert: 'Dr. Sarah Chen',
    course: 'This is the course title',
    duration: '45 Min',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
  lesson: {
    type: 'LESSON' as const,
    title: 'This is the lesson title',
    expert: 'Dr. Sarah Chen',
    course: 'This is the course title',
    duration: '45 Min',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
  activity: {
    type: 'ACTIVITY' as const,
    title: 'This is the activity title',
    expert: 'Dr. Sarah Chen',
    course: 'This is the course title',
    duration: '45 Min',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  },
};

// =============================================================================
// INTERACTIVE CARD WRAPPER (Enhanced hover effects with animated border)
// =============================================================================
interface InteractiveWrapperProps {
  children: React.ReactNode;
  glowColor: string;
}

const InteractiveWrapper: React.FC<InteractiveWrapperProps> = ({ children, glowColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [gradientAngle, setGradientAngle] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Gradient rotation animation - faster on hover
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setGradientAngle((prev) => (prev + (isHovered ? 4 : 1)) % 360);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePosition({ x, y });
  };

  const tiltX = isHovered ? mousePosition.y * -4 : 0;
  const tiltY = isHovered ? mousePosition.x * 4 : 0;

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="relative cursor-pointer"
      style={{
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.02 : 1})`,
        transition: 'transform 0.2s ease-out',
      }}
    >
      {/* Animated border glow - more pronounced */}
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          padding: '3px',
          background: `conic-gradient(
            from ${gradientAngle}deg,
            transparent 0%,
            ${glowColor} 5%,
            rgba(255, 255, 255, 0.5) 8%,
            ${glowColor} 12%,
            rgba(255, 255, 255, 0.3) 15%,
            ${glowColor} 20%,
            transparent 30%,
            transparent 100%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Spotlight effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 0.2 : 0,
          background: `radial-gradient(
            circle at ${(mousePosition.x + 1) * 50}% ${(mousePosition.y + 1) * 50}%,
            rgba(255, 255, 255, 0.4) 0%,
            transparent 50%
          )`,
        }}
      />

      {/* Outer glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`,
        }}
      />

      {children}
    </div>
  );
};

// =============================================================================
// COURSE CARD MOCK (New Layout with Gradients)
// =============================================================================
interface CourseCardMockProps {
  type: 'COURSE' | 'MODULE' | 'LESSON' | 'ACTIVITY';
  title: string;
  expert: string;
  course?: string;
  duration?: string;
  rating?: number;
  shrm?: boolean;
  hrci?: boolean;
  image: string;
}

const CourseCardMock: React.FC<CourseCardMockProps> = ({
  type,
  title,
  expert,
  course,
  duration,
  rating,
  shrm,
  hrci,
  image,
}) => {
  const colors = courseCardColors[type];
  const isCourse = type === 'COURSE';

  return (
    <InteractiveWrapper glowColor={colors.glow}>
      <div
        className="relative w-full aspect-[4/3] min-h-[320px] rounded-2xl overflow-hidden border shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]"
        style={{
          background: `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`,
          borderColor: colors.border,
        }}
      >
        {/* HEADER - Card type label and icons */}
        <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white/80">
              {type}
            </span>
            <div className="flex items-center gap-1">
              <button className="text-white/50 hover:text-white transition-colors p-1">
                <Trash2 size={14} />
              </button>
              <button className="text-white/50 hover:text-white transition-colors p-1">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* IMAGE SECTION - Featured image placeholder */}
        <div className="absolute top-[48px] left-4 right-4 h-[38%] rounded-xl overflow-hidden bg-black/20 flex items-center justify-center">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover opacity-60"
          />
          <span className="absolute text-white/30 text-xs font-medium tracking-widest uppercase">
            Featured Image
          </span>
        </div>

        {/* CONTENT SECTION */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4" style={{ top: 'calc(48px + 38% + 12px)' }}>
          {/* Title with star rating for Course cards */}
          <div className="flex items-start gap-2 mb-2">
            <h3 className="font-semibold text-white text-[15px] leading-tight line-clamp-2 flex-1">
              {title}
            </h3>
            {isCourse && rating && (
              <div className="flex items-center gap-1 text-amber-400 flex-shrink-0 mt-0.5">
                <Star size={14} fill="currentColor" />
                <span className="text-[13px] font-bold">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Originating Course (for non-Course cards) */}
          {course && !isCourse && (
            <p className="text-[11px] text-white/60 mb-1 truncate">
              From: {course}
            </p>
          )}

          {/* Expert */}
          <p className="text-[11px] text-white/60 truncate">
            By {expert}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10">
            {/* Left: Duration */}
            <div className="flex items-center gap-2 text-white/50">
              <Clock size={12} />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {duration}
              </span>
            </div>

            {/* Right: Badges for Course */}
            {isCourse && (shrm || hrci) && (
              <div className="flex items-center gap-1.5">
                {shrm && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#4f46e5]/30 text-[#a5b4fc] border border-[#4f46e5]/40">
                    SHRM
                  </span>
                )}
                {hrci && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#9333ea]/30 text-[#d8b4fe] border border-[#9333ea]/40">
                    HRCI
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </InteractiveWrapper>
  );
};

// =============================================================================
// ORIGINAL RESOURCE CARD (Unchanged from current implementation)
// =============================================================================
const OriginalResourceCard: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [gradientAngle, setGradientAngle] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setGradientAngle((prev) => (prev + (isHovered ? 4 : 1)) % 360);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    setMousePosition({ x, y });
  };

  const tiltX = isHovered ? mousePosition.y * -4 : 0;
  const tiltY = isHovered ? mousePosition.x * 4 : 0;
  const glowColor = 'rgba(239, 68, 68, 0.5)';

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      className="relative cursor-pointer"
      style={{
        transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${isHovered ? 1.02 : 1})`,
        transition: 'transform 0.2s ease-out',
      }}
    >
      {/* Animated border glow */}
      <div
        className="absolute inset-0 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          padding: '3px',
          background: `conic-gradient(
            from ${gradientAngle}deg,
            transparent 0%,
            ${glowColor} 5%,
            rgba(255, 255, 255, 0.5) 8%,
            ${glowColor} 12%,
            rgba(255, 255, 255, 0.3) 15%,
            ${glowColor} 20%,
            transparent 30%,
            transparent 100%
          )`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none transition-all duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          boxShadow: `0 0 40px ${glowColor}, 0 0 80px ${glowColor}`,
        }}
      />

      {/* Card content - matching original RESOURCE card design */}
      <div className="relative w-full aspect-[4/3] min-h-[320px] rounded-3xl overflow-hidden border border-red-500/30 bg-[#0B1120] shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]">
        {/* Top Section - Red header */}
        <div className="relative h-[45%] w-full overflow-hidden bg-[#4A2020]">
          {/* Header Badge */}
          <div className="absolute top-0 left-0 w-full p-3 z-20">
            <div className="flex items-center justify-between bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/5 shadow-sm">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/70">
                RESOURCE
              </span>
              <div className="flex items-center gap-2">
                <button className="text-white/40 hover:text-white transition-colors p-1">
                  <Trash2 size={14} />
                </button>
                <button className="text-white/40 hover:text-white transition-colors p-1">
                  <Download size={14} />
                </button>
                <button className="text-white/40 hover:text-white transition-colors p-1">
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Title in header area */}
          <div className="absolute left-0 right-0 z-10 px-4 top-1/2 -translate-y-1/2 pt-8">
            <h3 className="font-bold text-white leading-tight mb-1 text-[17px] line-clamp-2">
              Pay Equity Analysis Checklist
            </h3>
            <p className="text-xs font-medium text-white/70 tracking-wide truncate">
              HR Analytics Fundamentals
            </p>
          </div>

          {/* Background icon */}
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-[-15deg] pointer-events-none">
            <Paperclip size={160} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="h-[55%] px-5 py-4 flex flex-col justify-between bg-[#0B1120]">
          <div className="flex-1 min-h-0">
            <p className="text-[13px] text-slate-300 leading-relaxed line-clamp-3 font-light">
              Course resource attachment
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-2 border-t border-white/5 gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
              PDF
            </span>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Clock size={12} />
              <span className="text-[10px] font-bold tracking-wider uppercase">
                JAN 12, 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN PAGE
// =============================================================================
export default function CardTestPage() {
  return (
    <div className="min-h-screen bg-[#0B1120] p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Course Card Redesign v2</h1>
        <p className="text-slate-400 text-lg mb-4">
          Gradient backgrounds, star rating next to title, enhanced animated border effects.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
            Diagonal gradients
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
            Star rating by title
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
            Enhanced animated border
          </span>
          <span className="px-3 py-1 rounded-full bg-white/5 text-slate-300 border border-white/10">
            No header icon
          </span>
        </div>
      </div>

      {/* Row 1: Course-related cards (4 cards, wider) */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="space-y-3">
          <CourseCardMock {...sampleData.course} />
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Course Card</p>
            <p className="text-[#78C0F0] font-mono text-[10px]">
              {courseCardColors.COURSE.gradientStart} → {courseCardColors.COURSE.gradientEnd}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <CourseCardMock {...sampleData.module} />
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Module Card</p>
            <p className="text-[#78C0F0] font-mono text-[10px]">
              {courseCardColors.MODULE.gradientStart} → {courseCardColors.MODULE.gradientEnd}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <CourseCardMock {...sampleData.lesson} />
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Lesson Card</p>
            <p className="text-[#78C0F0] font-mono text-[10px]">
              {courseCardColors.LESSON.gradientStart} → {courseCardColors.LESSON.gradientEnd}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <CourseCardMock {...sampleData.activity} />
          <div className="text-center">
            <p className="text-white font-semibold text-sm">Activity Card</p>
            <p className="text-[#78C0F0] font-mono text-[10px]">
              {courseCardColors.ACTIVITY.gradientStart} → {courseCardColors.ACTIVITY.gradientEnd}
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Course Resource Card (Original design, unchanged) */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-lg font-semibold text-white mb-4">Course Resource Card (Original Design - Unchanged)</h2>
        <div className="max-w-sm">
          <OriginalResourceCard />
        </div>
      </div>

      {/* Color Palette Reference */}
      <div className="max-w-7xl mx-auto p-6 bg-white/5 rounded-2xl border border-white/10 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Gradient Color Palette</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(courseCardColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg border border-white/20"
                style={{ background: `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)` }}
              />
              <div>
                <p className="text-white text-sm font-medium">{type}</p>
                <p className="text-slate-400 font-mono text-[9px]">{colors.gradientStart}</p>
                <p className="text-slate-400 font-mono text-[9px]">{colors.gradientEnd}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Design Notes */}
      <div className="max-w-7xl mx-auto p-6 bg-[#78C0F0]/10 rounded-2xl border border-[#78C0F0]/20">
        <h3 className="text-[#78C0F0] font-bold mb-3">Design Updates (v2):</h3>
        <ul className="text-[#78C0F0]/80 text-sm space-y-2 list-disc list-inside">
          <li><strong>Diagonal Gradients</strong> - 135° gradient from top-left to bottom-right</li>
          <li><strong>Star Rating Moved</strong> - Now appears next to the title (Course cards only)</li>
          <li><strong>No Header Icon</strong> - Removed icon next to card type label</li>
          <li><strong>No Background Watermark</strong> - Removed the large background icon</li>
          <li><strong>Enhanced Border Animation</strong> - Multi-layer glow with white highlights, faster rotation on hover</li>
          <li><strong>Course Resource Card</strong> - Unchanged from current implementation (red/maroon header)</li>
          <li><strong>Activity Card</strong> - Red/maroon gradient to distinguish assessments from lessons</li>
        </ul>
      </div>

      {/* Hover Instructions */}
      <div className="max-w-7xl mx-auto mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
        <p className="text-amber-300 text-sm">
          <strong>Hover over cards</strong> to see the enhanced animated border glow, 3D tilt, and spotlight effects
        </p>
      </div>
    </div>
  );
}
