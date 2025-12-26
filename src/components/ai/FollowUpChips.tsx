'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  FollowUpChipsProps,
  INSIGHT_CATEGORY_COLORS,
} from '@/types/insights';

/**
 * FollowUpChips - Clickable follow-up suggestion chips.
 *
 * Displayed below AI responses when relevant user insights exist.
 * Helps guide users to deeper, more personalized conversations.
 */
const FollowUpChips: React.FC<FollowUpChipsProps> = ({
  suggestions,
  onChipClick,
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Sparkles size={12} className="text-[#FF9300]" />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
          Based on what I know about you
        </span>
      </div>

      {/* Chips container */}
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 3).map((suggestion, index) => {
          const categoryColor = suggestion.category
            ? INSIGHT_CATEGORY_COLORS[suggestion.category]
            : '#FF9300';

          return (
            <button
              key={index}
              onClick={() => onChipClick(suggestion.prompt)}
              className="
                group flex items-center gap-2
                px-3 py-2 rounded-xl
                bg-white/5 border border-white/10
                text-xs text-slate-300
                hover:bg-white/10 hover:border-white/20
                hover:text-white
                transition-all duration-200
                max-w-[90%]
              "
            >
              {/* Subtle category indicator */}
              {suggestion.category && (
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                />
              )}

              {/* Prompt text (truncated if too long) */}
              <span className="truncate">
                {suggestion.prompt}
              </span>

              {/* Arrow on hover */}
              <ArrowRight
                size={12}
                className="
                  flex-shrink-0 opacity-0 -translate-x-1
                  group-hover:opacity-100 group-hover:translate-x-0
                  transition-all duration-200
                "
                style={{ color: categoryColor }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FollowUpChips;
