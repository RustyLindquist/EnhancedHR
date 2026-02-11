'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import {
  PersonalInsight,
  fetchPersonalInsights,
  generatePersonalInsights,
  saveInsightToContext,
  dismissInsight,
  reactToInsight,
  shouldRegenerateInsights,
} from '@/app/actions/personal-insights';
import PersonalInsightCard from './PersonalInsightCard';
import PersonalInsightListItem from './PersonalInsightListItem';
import PersonalInsightDetailPanel from './PersonalInsightDetailPanel';
import InsightGenerationOverlay from './InsightGenerationOverlay';
import PersonalInsightsWidget from '@/components/Dashboard/PersonalInsightsWidget';

// ── Types ────────────────────────────────────────────────────────────────────

interface PersonalInsightsCollectionViewProps {
  userId: string;
  viewMode: 'grid' | 'list';
  onAskPrometheus: (prompt: string) => void;
  onOpenAIPanel: () => void;
  initialInsightId?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

const PersonalInsightsCollectionView: React.FC<PersonalInsightsCollectionViewProps> = ({
  userId,
  viewMode,
  onAskPrometheus,
  onOpenAIPanel,
  initialInsightId,
}) => {
  const [insights, setInsights] = useState<PersonalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<PersonalInsight | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ── Load / Generate on Mount ─────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // Check if we need to regenerate
      const status = await shouldRegenerateInsights(userId);

      let loaded: PersonalInsight[] = [];

      if (status.shouldRegenerate) {
        setIsGenerating(true);
        loaded = await generatePersonalInsights(userId);
        setIsGenerating(false);
      } else {
        loaded = await fetchPersonalInsights(userId);
      }

      setInsights(loaded);
      setIsLoading(false);

      // If initialInsightId provided, auto-open that insight's detail panel
      if (initialInsightId && loaded.length > 0) {
        const target = loaded.find((i) => i.id === initialInsightId);
        if (target) {
          // Short timeout to ensure state is committed before opening panel
          setTimeout(() => {
            setSelectedInsight(target);
            setIsDetailOpen(true);
          }, 100);
        }
      }
    };

    init();
  }, [userId, initialInsightId]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsGenerating(true);
    const newInsights = await generatePersonalInsights(userId);
    setInsights(newInsights);
    setIsGenerating(false);
  }, [userId]);

  const handleViewDetail = useCallback((insight: PersonalInsight) => {
    setSelectedInsight(insight);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedInsight(null);
  }, []);

  const handleSave = useCallback(
    async (insightId: string) => {
      const result = await saveInsightToContext(insightId, userId);
      if (result.success) {
        // Update local state to reflect saved status
        setInsights((prev) =>
          prev.map((i) =>
            i.id === insightId
              ? { ...i, status: 'saved' as const, saved_at: new Date().toISOString() }
              : i,
          ),
        );
        // Also update detail panel if open
        setSelectedInsight((prev) =>
          prev?.id === insightId
            ? { ...prev, status: 'saved' as const, saved_at: new Date().toISOString() }
            : prev,
        );
      }
    },
    [userId],
  );

  const handleDismiss = useCallback(
    async (insightId: string) => {
      await dismissInsight(insightId, userId);
      // Remove from local state
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      // Close detail if viewing this insight
      setSelectedInsight((prev) => {
        if (prev?.id === insightId) {
          setIsDetailOpen(false);
          return null;
        }
        return prev;
      });
    },
    [userId],
  );

  const handleReact = useCallback(
    async (insightId: string, reaction: 'helpful' | 'not_helpful') => {
      await reactToInsight(insightId, reaction, userId);
      // Update local state
      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, reaction } : i)),
      );
      setSelectedInsight((prev) =>
        prev?.id === insightId ? { ...prev, reaction } : prev,
      );
    },
    [userId],
  );

  const handleAskPrometheus = useCallback(
    (insight: PersonalInsight) => {
      setIsDetailOpen(false);
      setSelectedInsight(null);
      onAskPrometheus(
        `I'd like to explore this insight with you:\n\n"${insight.title}"\n\n${insight.full_content}`,
      );
      onOpenAIPanel();
    },
    [onAskPrometheus, onOpenAIPanel],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full space-y-12">
      {/* ── Section: AI-Generated Insights ── */}
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Personal Insights</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                AI-generated insights based on your platform activity
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm text-slate-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
            Refresh Insights
          </button>
        </div>

        {/* Generation overlay or insight cards */}
        {isGenerating ? (
          <InsightGenerationOverlay isGenerating={isGenerating} />
        ) : isLoading ? (
          /* Simple loading skeleton */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white/[0.02] border border-white/[0.04] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : insights.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 bg-white/[0.02] border border-white/[0.04] rounded-2xl">
            <Sparkles size={32} className="text-purple-400/50 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">
              No insights yet. Click &quot;Refresh Insights&quot; to generate your first batch.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid view */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <PersonalInsightCard
                key={insight.id}
                insight={insight}
                onViewDetail={handleViewDetail}
                onSave={handleSave}
                onDismiss={handleDismiss}
                onReact={handleReact}
                animationDelay={index * 100}
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <PersonalInsightListItem
                key={insight.id}
                insight={insight}
                onViewDetail={handleViewDetail}
                onSave={handleSave}
                onDismiss={handleDismiss}
                onReact={handleReact}
                animationDelay={index * 80}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Section: Platform Activity ── */}
      <PersonalInsightsWidget userId={userId} />

      {/* ── Detail Panel ── */}
      <PersonalInsightDetailPanel
        insight={selectedInsight}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onSave={handleSave}
        onAskPrometheus={handleAskPrometheus}
        onReact={handleReact}
      />
    </div>
  );
};

export default PersonalInsightsCollectionView;
