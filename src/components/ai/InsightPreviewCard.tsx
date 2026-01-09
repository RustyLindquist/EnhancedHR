'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  InsightPreviewCardProps,
  INSIGHT_CATEGORY_LABELS,
  INSIGHT_CATEGORY_COLORS,
} from '@/types/insights';
import { HelpPanel } from '@/components/help';

/**
 * InsightPreviewCard - Displays a pending AI insight for user approval.
 *
 * Shown inline at the end of an AI response when an insight is detected.
 * User can Save (adds to Personal Context) or Decline (discards).
 */
const InsightPreviewCard: React.FC<InsightPreviewCardProps> = ({
  insight,
  onSave,
  onDecline,
  isLoading = false,
}) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [actionTaken, setActionTaken] = useState<'save' | 'decline' | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const categoryLabel = INSIGHT_CATEGORY_LABELS[insight.category];
  const categoryColor = INSIGHT_CATEGORY_COLORS[insight.category];

  const handleSave = () => {
    setActionTaken('save');
    setIsAnimatingOut(true);
    // Wait for animation before calling onSave
    setTimeout(() => {
      onSave();
    }, 300);
  };

  const handleDecline = () => {
    setActionTaken('decline');
    setIsAnimatingOut(true);
    // Wait for animation before calling onDecline
    setTimeout(() => {
      onDecline();
    }, 300);
  };

  return (
    <>
      <div
        className={`
          mt-4 rounded-xl overflow-hidden
          transition-all duration-300 ease-out
          ${isAnimatingOut
            ? actionTaken === 'save'
              ? 'opacity-0 scale-95 translate-y-2'
              : 'opacity-0 scale-95 -translate-x-4'
            : 'opacity-100 scale-100 translate-y-0'
          }
        `}
      >
        {/* Card with gradient border inspired by AI Insight styling */}
        <div
          className="group relative p-[1px] rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}20, transparent)`,
          }}
        >
          {/* Animated rotating border */}
          <div className="card-hover-border rounded-xl" />

          <div className="bg-[#0A0D12]/90 backdrop-blur-xl rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `${categoryColor}20`,
                  border: `1px solid ${categoryColor}40`,
                }}
              >
                <Sparkles size={12} style={{ color: categoryColor }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Insight Detected
              </span>
              <span
                className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: `${categoryColor}20`,
                  color: categoryColor,
                }}
              >
                {categoryLabel}
              </span>
            </div>

            {/* Insight Content */}
            <p className="text-sm text-slate-200 leading-relaxed mb-4 pl-8">
              {insight.content}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pl-8">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className={`
                  flex items-center justify-center
                  py-1.5 px-3 rounded-md
                  bg-emerald-500/20 border border-emerald-500/40
                  text-emerald-400 text-xs font-medium
                  hover:bg-emerald-500/30 hover:border-emerald-500/60
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                `}
              >
                {isLoading && actionTaken === 'save' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  'Save Insight'
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={isLoading}
                className={`
                  flex items-center justify-center
                  py-1.5 px-3 rounded-md
                  bg-white/5 border border-white/10
                  text-slate-400 text-xs font-medium
                  hover:bg-white/10 hover:text-slate-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                `}
              >
                {isLoading && actionTaken === 'decline' ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  'Decline'
                )}
              </button>
            </div>

            {/* Learn More Link */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="mt-3 pl-8 text-[10px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
            >
              Learn more
            </button>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        topicId="ai-insights"
      />
    </>
  );
};

export default InsightPreviewCard;
