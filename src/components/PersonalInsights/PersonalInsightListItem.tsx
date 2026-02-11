'use client';

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { PersonalInsight } from '@/app/actions/personal-insights';
import { INSIGHT_CATEGORIES } from './PersonalInsightCard';

// ── Relative Time Helper ────────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return `${Math.floor(diffDay / 7)}w ago`;
}

// ── Component ───────────────────────────────────────────────────────────────

interface PersonalInsightListItemProps {
  insight: PersonalInsight;
  onViewDetail: (insight: PersonalInsight) => void;
  onSave: (insightId: string) => void;
  onDismiss: (insightId: string) => void;
  onReact: (insightId: string, reaction: 'helpful' | 'not_helpful') => void;
  animationDelay?: number;
}

const PersonalInsightListItem = React.memo(function PersonalInsightListItem({
  insight,
  onViewDetail,
  onSave,
  onDismiss,
  onReact,
  animationDelay = 0,
}: PersonalInsightListItemProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const category = INSIGHT_CATEGORIES[insight.category];
  const CategoryIcon = category?.icon;
  const isSaved = insight.status === 'saved';

  return (
    <div
      onClick={() => onViewDetail(insight)}
      className={`
        bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.08]
        rounded-xl p-4 cursor-pointer
        transition-[background-color,border-color,color,opacity,transform] duration-200
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Category icon */}
        {CategoryIcon && (
          <div
            className={`
              shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center
              border ${category.bgClass} ${category.borderClass}
            `}
          >
            <CategoryIcon className={`w-4 h-4 ${category.colorClass}`} />
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {/* Top row: title + actions */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-sm font-semibold text-white truncate leading-snug">
              {insight.title}
            </h3>

            {/* Actions cluster */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Reaction buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (insight.reaction !== 'helpful') onReact(insight.id, 'helpful');
                }}
                className={`
                  p-1.5 rounded-lg transition-[background-color,border-color,color,opacity,transform] duration-200
                  ${insight.reaction === 'helpful'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                  }
                `}
                title="Helpful"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (insight.reaction !== 'not_helpful') onReact(insight.id, 'not_helpful');
                }}
                className={`
                  p-1.5 rounded-lg transition-[background-color,border-color,color,opacity,transform] duration-200
                  ${insight.reaction === 'not_helpful'
                    ? 'text-red-400 bg-red-500/10'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                  }
                `}
                title="Not helpful"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

              {/* Save */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSaved) onSave(insight.id);
                }}
                className={`
                  p-1.5 rounded-lg transition-[background-color,border-color,color,opacity,transform] duration-200
                  ${isSaved
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                  }
                `}
                title={isSaved ? 'Saved' : 'Save insight'}
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </button>

              {/* Dismiss */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(insight.id);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-[background-color,border-color,color,opacity,transform] duration-200"
                title="Dismiss insight"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom row: summary + time */}
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-400 truncate flex-1">
              {insight.summary}
            </p>
            <span className="text-xs text-slate-500 shrink-0">
              {getRelativeTime(insight.generated_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PersonalInsightListItem;
