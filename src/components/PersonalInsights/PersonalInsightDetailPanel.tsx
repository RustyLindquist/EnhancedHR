'use client';

import React from 'react';
import DropdownPanel from '@/components/DropdownPanel';
import { INSIGHT_CATEGORIES } from './PersonalInsightCard';
import { PersonalInsight } from '@/app/actions/personal-insights';
import { Sparkles, Bookmark, MessageCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface PersonalInsightDetailPanelProps {
  insight: PersonalInsight | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (insightId: string) => void;
  onAskPrometheus: (insight: PersonalInsight) => void;
  onReact: (insightId: string, reaction: 'helpful' | 'not_helpful') => void;
}

// ── Source Label Map ─────────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  conversations: 'conversations',
  courses: 'courses',
  contextItems: 'context items',
  notes: 'notes',
  aiInteractions: 'AI interactions',
  certificates: 'certificates',
};

// ── Component ────────────────────────────────────────────────────────────────

const PersonalInsightDetailPanel: React.FC<PersonalInsightDetailPanelProps> = ({
  insight,
  isOpen,
  onClose,
  onSave,
  onAskPrometheus,
  onReact,
}) => {
  if (!insight) return null;

  const category = INSIGHT_CATEGORIES[insight.category] || INSIGHT_CATEGORIES.recommendation;
  const CategoryIcon = category.icon;

  // ── Header Actions ───────────────────────────────────────────────────────

  const headerActions = (
    <div className="flex items-center gap-3">
      {insight.status !== 'saved' && (
        <button
          onClick={() => onSave(insight.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-sm text-white transition-all"
        >
          <Bookmark size={16} />
          Save Insight
        </button>
      )}
      <button
        onClick={() => onAskPrometheus(insight)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-sm text-purple-300 transition-all"
      >
        <MessageCircle size={16} />
        Ask Prometheus
      </button>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DropdownPanel
      isOpen={isOpen}
      onClose={onClose}
      title={insight.title}
      icon={CategoryIcon}
      iconColor={category.colorClass}
      headerActions={headerActions}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${category.bgClass} ${category.colorClass} border ${category.borderClass}`}
          >
            <CategoryIcon size={12} />
            {category.label}
          </span>
          {insight.confidence === 'high' && (
            <span className="text-xs text-slate-500">High confidence</span>
          )}
        </div>

        {/* Full content — rendered as paragraphs */}
        <div className="prose prose-invert max-w-none">
          {insight.full_content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-slate-300 text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Source summary */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-2">Data analyzed:</p>
          <div className="flex flex-wrap gap-3">
            {Object.entries(insight.source_summary)
              .filter(([, count]) => count && count > 0)
              .map(([key, count]) => (
                <span key={key} className="text-sm text-slate-400">
                  {count} {SOURCE_LABELS[key] || key}
                </span>
              ))}
          </div>
        </div>

        {/* Reactions */}
        <div className="flex items-center gap-4 pt-2">
          <span className="text-xs text-slate-500">Was this insight helpful?</span>
          <button
            onClick={() => onReact(insight.id, 'helpful')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              insight.reaction === 'helpful'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] border border-transparent'
            }`}
          >
            <ThumbsUp size={14} />
            Helpful
          </button>
          <button
            onClick={() => onReact(insight.id, 'not_helpful')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              insight.reaction === 'not_helpful'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] border border-transparent'
            }`}
          >
            <ThumbsDown size={14} />
            Not helpful
          </button>
        </div>

        {/* Generated timestamp */}
        <p className="text-xs text-slate-600">
          Generated{' '}
          {new Date(insight.generated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </DropdownPanel>
  );
};

export default PersonalInsightDetailPanel;
