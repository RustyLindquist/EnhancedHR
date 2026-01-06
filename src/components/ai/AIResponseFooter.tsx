'use client';

import React, { useState, useCallback } from 'react';
import InsightPreviewCard from './InsightPreviewCard';
import InsightCapturedNotice from './InsightCapturedNotice';
import FollowUpChips from './FollowUpChips';
import {
  PendingInsight,
  InsightFollowUp,
  ExtractedInsight,
} from '@/types/insights';
import { saveInsight, declineInsight } from '@/app/actions/insights';
import { dispatchCollectionRefresh } from '@/lib/collection-events';

interface AIResponseFooterProps {
  /** Pending insights for manual approval mode */
  pendingInsights: PendingInsight[];
  /** Number of auto-captured insights (for auto mode) */
  autoCapturedCount: number;
  /** Whether auto-capture mode is enabled */
  isAutoMode: boolean;
  /** Follow-up suggestions based on insights */
  followUpSuggestions: InsightFollowUp[];
  /** Called when user clicks a follow-up chip */
  onFollowUpClick: (prompt: string) => void;
  /** Called when user wants to view Personal Context */
  onViewPersonalContext: () => void;
  /** Called when insight status changes (for parent state update) */
  onInsightStatusChange?: (
    insightId: string,
    status: 'saved' | 'declined'
  ) => void;
}

/**
 * AIResponseFooter - Container for insight previews and follow-up chips.
 *
 * Renders below an AI response to show:
 * 1. Pending insight cards (manual mode) OR captured notice (auto mode)
 * 2. Follow-up suggestion chips based on user insights
 */
const AIResponseFooter: React.FC<AIResponseFooterProps> = ({
  pendingInsights,
  autoCapturedCount,
  isAutoMode,
  followUpSuggestions,
  onFollowUpClick,
  onViewPersonalContext,
  onInsightStatusChange,
}) => {
  const [processingInsights, setProcessingInsights] = useState<Set<string>>(
    new Set()
  );
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(
    new Set()
  );

  const handleSaveInsight = useCallback(
    async (pending: PendingInsight) => {
      setProcessingInsights((prev) => new Set([...prev, pending.id]));

      try {
        const result = await saveInsight(pending.insight);

        if (result.success) {
          setDismissedInsights((prev) => new Set([...prev, pending.id]));
          onInsightStatusChange?.(pending.id, 'saved');

          // Trigger collection count refresh via global event system
          // This ensures the nav panel count updates immediately
          dispatchCollectionRefresh();
        } else {
          console.error('[AIResponseFooter] Failed to save insight:', result.error);
        }
      } catch (error) {
        console.error('[AIResponseFooter] Error saving insight:', error);
      } finally {
        setProcessingInsights((prev) => {
          const next = new Set(prev);
          next.delete(pending.id);
          return next;
        });
      }
    },
    [onInsightStatusChange]
  );

  const handleDeclineInsight = useCallback(
    async (pending: PendingInsight) => {
      setProcessingInsights((prev) => new Set([...prev, pending.id]));

      try {
        await declineInsight(pending.insight);
        setDismissedInsights((prev) => new Set([...prev, pending.id]));
        onInsightStatusChange?.(pending.id, 'declined');
      } catch (error) {
        console.error('[AIResponseFooter] Error declining insight:', error);
      } finally {
        setProcessingInsights((prev) => {
          const next = new Set(prev);
          next.delete(pending.id);
          return next;
        });
      }
    },
    [onInsightStatusChange]
  );

  // Filter out dismissed insights
  const visibleInsights = pendingInsights.filter(
    (p) => !dismissedInsights.has(p.id) && p.status === 'pending'
  );

  // Don't render if there's nothing to show
  if (
    visibleInsights.length === 0 &&
    autoCapturedCount === 0 &&
    followUpSuggestions.length === 0
  ) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Manual mode: Show pending insight cards */}
      {!isAutoMode &&
        visibleInsights.map((pending) => (
          <InsightPreviewCard
            key={pending.id}
            insight={pending.insight}
            onSave={() => handleSaveInsight(pending)}
            onDecline={() => handleDeclineInsight(pending)}
            isLoading={processingInsights.has(pending.id)}
          />
        ))}

      {/* Auto mode: Show subtle captured notice */}
      {isAutoMode && autoCapturedCount > 0 && (
        <InsightCapturedNotice
          insightCount={autoCapturedCount}
          onViewClick={onViewPersonalContext}
        />
      )}

      {/* Follow-up suggestions */}
      <FollowUpChips
        suggestions={followUpSuggestions}
        onChipClick={onFollowUpClick}
      />
    </div>
  );
};

export default AIResponseFooter;
