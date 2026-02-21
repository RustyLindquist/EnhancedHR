'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  Sprout,
  BarChart3,
  Zap,
  Link2,
  Target,
  Lightbulb,
  LucideIcon,
} from 'lucide-react';
import {
  PersonalInsight,
  fetchPersonalInsights,
  generatePersonalInsights,
  shouldRegenerateInsights,
} from '@/app/actions/personal-insights';
import InsightGenerationOverlay from '@/components/PersonalInsights/InsightGenerationOverlay';

// Inline category config to avoid circular dependencies between Dashboard and PersonalInsights directories
const INSIGHT_CATEGORIES: Record<
  string,
  { label: string; icon: LucideIcon; colorClass: string; bgClass: string }
> = {
  growth_opportunity: {
    label: 'Growth',
    icon: Sprout,
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
  },
  learning_pattern: {
    label: 'Pattern',
    icon: BarChart3,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
  },
  strength: {
    label: 'Strength',
    icon: Zap,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10',
  },
  connection: {
    label: 'Connection',
    icon: Link2,
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
  },
  goal_alignment: {
    label: 'Goal',
    icon: Target,
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
  },
  recommendation: {
    label: 'Tip',
    icon: Lightbulb,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
  },
};

// --- sessionStorage cache helpers (avoid re-running expensive AI insight generation on remount) ---
const INSIGHTS_CACHE_KEY = 'ehr:insights-preview';
const CACHE_TTL = 600_000; // 10 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function readCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

interface PersonalInsightsPreviewProps {
  userId: string;
  onViewAll: () => void;
  onViewInsight: (insightId: string) => void;
}

export default function PersonalInsightsPreview({
  userId,
  onViewAll,
  onViewInsight,
}: PersonalInsightsPreviewProps) {
  const [insights, setInsights] = useState<PersonalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Check cache first — show cached insights immediately on remount
      const cached = readCache<PersonalInsight[]>(INSIGHTS_CACHE_KEY);
      if (cached && cached.data.length > 0) {
        setInsights(cached.data);
        setIsLoading(false);
        // If cache is fresh, skip regeneration check entirely
        if (Date.now() - cached.timestamp < CACHE_TTL) return;
      }

      // No cache or stale cache — run the full logic
      if (!cached) setIsLoading(true);
      const status = await shouldRegenerateInsights(userId);

      if (status.shouldRegenerate) {
        // Regenerate: either no insights, meaningful activity, or borderline activity
        if (!cached) setIsLoading(false);
        setIsGenerating(true);
        const generated = await generatePersonalInsights(userId, {
          noveltyMode: status.noveltyMode,
        });
        setIsGenerating(false);

        if (generated.length === 0) {
          // Brand new user with no platform activity
          setIsNewUser(true);
        } else {
          const sliced = generated.slice(0, 3);
          setInsights(sliced);
          writeCache(INSIGHTS_CACHE_KEY, sliced);
        }
      } else if (status.activeCount > 0) {
        // Show existing insights (already generated today or insufficient activity)
        const all = await fetchPersonalInsights(userId);
        const sliced = all.slice(0, 3);
        setInsights(sliced);
        writeCache(INSIGHTS_CACHE_KEY, sliced);
        setIsLoading(false);
      } else {
        // No insights and shouldn't regenerate (edge case)
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);

  // Invalidate insights cache when dashboard signals a reset
  useEffect(() => {
    const handler = () => {
      try {
        sessionStorage.removeItem(INSIGHTS_CACHE_KEY);
      } catch {}
    };
    window.addEventListener('dashboard:invalidate', handler);
    return () => window.removeEventListener('dashboard:invalidate', handler);
  }, []);

  return (
    <div className="mb-14">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Personal Insights</h2>
        </div>
        {!isGenerating && !isNewUser && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            See All Insights
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Content */}
      {isGenerating ? (
        /* Generation animation */
        <InsightGenerationOverlay isGenerating={isGenerating} compact />
      ) : isLoading ? (
        /* Loading skeleton */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 bg-white/[0.02] border border-white/[0.04] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : isNewUser ? (
        /* Brand new user — no platform activity yet */
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-8 text-center">
          <Sparkles size={24} className="text-purple-400/50 mx-auto mb-3" />
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            As you use the platform, insights about you will show up here, including tips,
            strengths, patterns, suggestions, and more. The more you use the platform, the more
            insightful these become.
          </p>
        </div>
      ) : insights.length === 0 ? (
        /* Fallback empty state */
        <div
          onClick={onViewAll}
          className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-8 text-center cursor-pointer hover:bg-white/[0.04] transition-all"
        >
          <Sparkles size={24} className="text-purple-400/50 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            Discover AI-powered insights about your learning journey
          </p>
          <p className="text-xs text-slate-500 mt-1">Click to generate your first insights</p>
        </div>
      ) : (
        /* Insight preview cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight) => {
            const cat =
              INSIGHT_CATEGORIES[insight.category] || INSIGHT_CATEGORIES.recommendation;
            const CatIcon = cat.icon;
            return (
              <button
                key={insight.id}
                onClick={() => onViewInsight(insight.id)}
                className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-5 transition-all group"
              >
                {/* Category pill */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cat.bgClass} ${cat.colorClass} mb-3`}
                >
                  <CatIcon size={12} />
                  {cat.label}
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 group-hover:text-white/90">
                  {insight.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-400 line-clamp-2">{insight.summary}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
