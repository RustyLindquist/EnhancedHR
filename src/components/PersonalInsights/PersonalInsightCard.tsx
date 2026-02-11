'use client';

import React, { useState, useEffect } from 'react';
import {
  Sprout,
  BarChart3,
  Zap,
  Link2,
  Target,
  Lightbulb,
  Bookmark,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  LucideIcon,
} from 'lucide-react';
import { PersonalInsight } from '@/app/actions/personal-insights';

// ── Category Visual Config ──────────────────────────────────────────────────

export const INSIGHT_CATEGORIES: Record<
  string,
  { label: string; icon: LucideIcon; colorClass: string; bgClass: string; borderClass: string }
> = {
  growth_opportunity: {
    label: 'Growth Opportunity',
    icon: Sprout,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
  },
  learning_pattern: {
    label: 'Learning Pattern',
    icon: BarChart3,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
  },
  strength: {
    label: 'Strength',
    icon: Zap,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
  },
  connection: {
    label: 'Connection',
    icon: Link2,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
  },
  goal_alignment: {
    label: 'Goal Alignment',
    icon: Target,
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
  },
  recommendation: {
    label: 'Recommendation',
    icon: Lightbulb,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/20',
  },
};

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

// ── Source Summary Formatter ────────────────────────────────────────────────

function formatSourceSummary(source: PersonalInsight['source_summary']): string {
  const parts: string[] = [];
  if (source.conversations) parts.push(`${source.conversations} conversation${source.conversations !== 1 ? 's' : ''}`);
  if (source.courses) parts.push(`${source.courses} course${source.courses !== 1 ? 's' : ''}`);
  if (source.contextItems) parts.push(`${source.contextItems} context item${source.contextItems !== 1 ? 's' : ''}`);
  if (source.notes) parts.push(`${source.notes} note${source.notes !== 1 ? 's' : ''}`);
  if (source.aiInteractions) parts.push(`${source.aiInteractions} AI interaction${source.aiInteractions !== 1 ? 's' : ''}`);
  if (source.certificates) parts.push(`${source.certificates} certificate${source.certificates !== 1 ? 's' : ''}`);
  return parts.join(' \u00b7 ');
}

// ── Component ───────────────────────────────────────────────────────────────

interface PersonalInsightCardProps {
  insight: PersonalInsight;
  onViewDetail: (insight: PersonalInsight) => void;
  onSave: (insightId: string) => void;
  onDismiss: (insightId: string) => void;
  onReact: (insightId: string, reaction: 'helpful' | 'not_helpful') => void;
  animationDelay?: number;
}

const PersonalInsightCard = React.memo(function PersonalInsightCard({
  insight,
  onViewDetail,
  onSave,
  onDismiss,
  onReact,
  animationDelay = 0,
}: PersonalInsightCardProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const category = INSIGHT_CATEGORIES[insight.category];
  const CategoryIcon = category?.icon ?? Lightbulb;
  const isSaved = insight.status === 'saved';
  const sourceLine = formatSourceSummary(insight.source_summary);

  return (
    <div
      onClick={() => onViewDetail(insight)}
      className={`
        bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 cursor-pointer
        hover:bg-white/[0.06] hover:border-white/[0.12]
        transition-[background-color,border-color,color,opacity,transform] duration-200
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      {/* Header: Category badge + action buttons */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Category pill */}
        <div
          className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            border ${category?.bgClass ?? ''} ${category?.borderClass ?? ''} ${category?.colorClass ?? 'text-slate-400'}
          `}
        >
          <CategoryIcon className="w-3.5 h-3.5" />
          {category?.label ?? insight.category}
        </div>

        {/* Save & Dismiss */}
        <div className="flex items-center gap-1 shrink-0">
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
            {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(insight.id);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-[background-color,border-color,color,opacity,transform] duration-200"
            title="Dismiss insight"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-white mb-2 leading-snug">
        {insight.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-slate-400 line-clamp-3 mb-3 leading-relaxed">
        {insight.summary}
      </p>

      {/* Source summary */}
      {sourceLine && (
        <div className="mb-3">
          <span className="inline-block text-xs text-slate-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1">
            {sourceLine}
          </span>
        </div>
      )}

      {/* Footer: Reactions + relative time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (insight.reaction !== 'helpful') onReact(insight.id, 'helpful');
            }}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-[background-color,border-color,color,opacity,transform] duration-200
              ${insight.reaction === 'helpful'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
              }
            `}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Helpful
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (insight.reaction !== 'not_helpful') onReact(insight.id, 'not_helpful');
            }}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-[background-color,border-color,color,opacity,transform] duration-200
              ${insight.reaction === 'not_helpful'
                ? 'text-red-400 bg-red-500/10'
                : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
              }
            `}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            Not helpful
          </button>
        </div>

        <span className="text-xs text-slate-500">
          {getRelativeTime(insight.generated_at)}
        </span>
      </div>
    </div>
  );
});

export default PersonalInsightCard;
