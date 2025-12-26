'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { InsightCapturedNoticeProps } from '@/types/insights';

/**
 * InsightCapturedNotice - Subtle notification for auto-captured insights.
 *
 * Shown briefly when automatic insight capture is enabled.
 * Provides a non-intrusive way to inform users that insights were saved.
 */
const InsightCapturedNotice: React.FC<InsightCapturedNoticeProps> = ({
  insightCount,
  onViewClick,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const handleViewClick = () => {
    handleDismiss();
    onViewClick();
  };

  if (!isVisible) return null;

  const insightText = insightCount === 1 ? 'insight' : 'insights';

  return (
    <div
      className={`
        mt-3 flex items-center gap-3
        transition-all duration-300 ease-out
        ${isAnimatingOut
          ? 'opacity-0 translate-y-2'
          : 'opacity-100 translate-y-0'
        }
      `}
    >
      {/* Glowing dot indicator */}
      <div className="relative">
        <div className="w-2 h-2 rounded-full bg-[#FF9300] animate-pulse" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#FF9300] animate-ping opacity-50" />
      </div>

      {/* Message */}
      <span className="text-xs text-slate-400">
        {insightCount} AI {insightText} captured
      </span>

      {/* View link */}
      <button
        onClick={handleViewClick}
        className="
          flex items-center gap-1
          text-xs text-[#FF9300] font-medium
          hover:text-[#FFB347]
          transition-colors duration-200
        "
      >
        View in Personal Context
        <ArrowRight size={12} />
      </button>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="
          ml-auto p-1 rounded-full
          text-slate-500 hover:text-slate-300
          hover:bg-white/5
          transition-all duration-200
        "
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default InsightCapturedNotice;
