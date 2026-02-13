'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, History, Bookmark, Info } from 'lucide-react';
import {
  PersonalInsight,
  fetchPersonalInsights,
  fetchPastInsights,
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
  const [pastInsightsList, setPastInsightsList] = useState<PersonalInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<PersonalInsight | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ── Load / Generate on Mount ─────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      try {
        // Check if we need to regenerate
        const status = await shouldRegenerateInsights(userId);

        let loaded: PersonalInsight[] = [];

        if (status.shouldRegenerate) {
          setIsGenerating(true);
          loaded = await generatePersonalInsights(userId, {
            noveltyMode: status.noveltyMode,
          });
          setIsGenerating(false);
        } else {
          loaded = await fetchPersonalInsights(userId);
        }

        setInsights(loaded);

        // Fetch past insights (previous generation batch)
        const past = await fetchPastInsights(userId);
        setPastInsightsList(past);

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
      } catch (err) {
        console.error('Failed to load personal insights:', err);
        setIsGenerating(false);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [userId, initialInsightId]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    setIsGenerating(true);
    try {
      const newInsights = await generatePersonalInsights(userId, { noveltyMode: true });
      setInsights(newInsights);
      // After refresh, the previous active batch is now expired — re-fetch past insights
      const past = await fetchPastInsights(userId);
      setPastInsightsList(past);
    } catch (err) {
      console.error('Failed to refresh insights:', err);
    } finally {
      setIsGenerating(false);
    }
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
        const savedUpdate = { status: 'saved' as const, saved_at: new Date().toISOString() };
        // Update both recent and past local state
        setInsights((prev) =>
          prev.map((i) => (i.id === insightId ? { ...i, ...savedUpdate } : i)),
        );
        setPastInsightsList((prev) =>
          prev.map((i) => (i.id === insightId ? { ...i, ...savedUpdate } : i)),
        );
        // Also update detail panel if open
        setSelectedInsight((prev) =>
          prev?.id === insightId ? { ...prev, ...savedUpdate } : prev,
        );
      }
    },
    [userId],
  );

  const handleDismiss = useCallback(
    async (insightId: string) => {
      await dismissInsight(insightId, userId);
      // Remove from both recent and past local state
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      setPastInsightsList((prev) => prev.filter((i) => i.id !== insightId));
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
      // Update both recent and past local state
      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, reaction } : i)),
      );
      setPastInsightsList((prev) =>
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
              <h2 className="text-xl font-bold text-white">Recent Insights</h2>
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

      {/* ── Retention Note + Past Insights ── */}
      {!isLoading && !isGenerating && insights.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl bg-blue-500/[0.06] border border-blue-400/[0.1] px-5 py-4">
          <Info size={18} className="text-blue-400/70 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400 leading-relaxed">
            Personal Insights are automatically saved for 30 days. If there&apos;s an insight you
            want to keep longer, click the{' '}
            <Bookmark size={13} className="inline-block text-slate-300 -mt-0.5" />{' '}
            bookmark icon to add it to your Personal Context Collection, where you can manage
            it separately.
          </p>
        </div>
      )}

      {pastInsightsList.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-3 mb-6">
              <History size={20} className="text-slate-500" />
              <div>
                <h2 className="text-xl font-bold text-white">Past Insights</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Previous insights from the last 30 days
                </p>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pastInsightsList.map((insight, index) => (
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
              <div className="space-y-2">
                {pastInsightsList.map((insight, index) => (
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
        </>
      )}

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
