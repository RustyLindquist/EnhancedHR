'use server';

/**
 * AI Insight Server Actions
 *
 * Handles saving, declining, and managing AI-generated insights.
 * Supports both manual approval and automatic modes.
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { embedContextItem } from '@/lib/context-embeddings';
import {
  ExtractedInsight,
  AIInsightContent,
  InsightSettings,
  INSIGHT_CATEGORY_LABELS,
} from '@/types/insights';
import {
  isNovelInsight,
  shouldMergeInsights,
} from '@/lib/ai/insight-analyzer';

/**
 * Resolve the Personal Context collection ID for a user.
 * Creates the collection if it doesn't exist.
 */
async function getPersonalContextCollectionId(userId: string): Promise<string | null> {
  const admin = createAdminClient();

  // Look for existing Personal Context collection
  const { data: existing } = await admin
    .from('user_collections')
    .select('id')
    .eq('user_id', userId)
    .eq('label', 'Personal Context')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return existing.id;
  }

  // Auto-create if missing
  const { data: created, error } = await admin
    .from('user_collections')
    .insert({
      user_id: userId,
      label: 'Personal Context',
      color: '#64748B' // Slate
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Insights] Failed to create Personal Context collection:', error);
    return null;
  }

  return created?.id || null;
}

/**
 * Get user's insight generation settings.
 */
export async function getInsightSettings(): Promise<InsightSettings> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { autoInsights: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('auto_insights')
    .eq('id', user.id)
    .single();

  return {
    autoInsights: profile?.auto_insights ?? false,
  };
}

/**
 * Update user's insight generation settings.
 */
export async function updateInsightSettings(
  settings: Partial<InsightSettings>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      auto_insights: settings.autoInsights,
    })
    .eq('id', user.id);

  if (error) {
    console.error('[Insights] Error updating settings:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Process and optionally save an extracted insight.
 * Handles novelty checking and returns the action taken.
 */
export async function processInsight(
  insight: ExtractedInsight,
  autoSave: boolean = false
): Promise<{
  success: boolean;
  action: 'saved' | 'merged' | 'skipped' | 'pending';
  insightId?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, action: 'skipped', error: 'Unauthorized' };
  }

  try {
    // 1. Check novelty
    const noveltyResult = await isNovelInsight(user.id, insight);

    if (noveltyResult.action === 'skip') {
      console.log('[Insights] Duplicate detected, skipping');
      return { success: true, action: 'skipped' };
    }

    if (noveltyResult.action === 'merge' && noveltyResult.similarInsights.length > 0) {
      // Handle merge case
      const mergeResult = await shouldMergeInsights(insight, noveltyResult.similarInsights[0]);

      if (mergeResult.action === 'skip') {
        return { success: true, action: 'skipped' };
      }

      if (mergeResult.shouldMerge && mergeResult.mergedContent) {
        // Update existing insight
        const existingId = noveltyResult.similarInsights[0].sourceId;
        const result = await updateInsightContent(existingId, mergeResult.mergedContent);
        return {
          success: result.success,
          action: 'merged',
          insightId: existingId,
          error: result.error,
        };
      }
    }

    // 2. If autoSave is true, save immediately
    if (autoSave) {
      const result = await saveInsight(insight);
      return {
        success: result.success,
        action: result.success ? 'saved' : 'skipped',
        insightId: result.insightId,
        error: result.error,
      };
    }

    // 3. Otherwise, return pending for user approval
    return { success: true, action: 'pending' };

  } catch (error) {
    console.error('[Insights] Error processing insight:', error);
    return { success: false, action: 'skipped', error: 'Processing failed' };
  }
}

/**
 * Save an insight to the user's Personal Context collection.
 */
export async function saveInsight(
  insight: ExtractedInsight
): Promise<{ success: boolean; insightId?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const admin = createAdminClient();

  try {
    // Resolve the Personal Context collection ID
    const personalContextId = await getPersonalContextCollectionId(user.id);

    // Build the content object
    const insightContent: AIInsightContent = {
      insight: insight.content,
      category: insight.category,
      confidence: insight.confidence,
      sourceAgent: insight.sourceAgent,
      sourceConversationId: insight.conversationId,
      extractedAt: new Date().toISOString(),
      referenceCount: 0,
    };

    // Create the title with category label
    const categoryLabel = INSIGHT_CATEGORY_LABELS[insight.category] || 'Insight';
    const title = `AI Insight: ${categoryLabel}`;

    // Insert into user_context_items with the resolved Personal Context collection ID
    const { data: created, error } = await admin
      .from('user_context_items')
      .insert({
        user_id: user.id,
        collection_id: personalContextId, // Use resolved Personal Context collection ID
        type: 'AI_INSIGHT',
        title,
        content: insightContent,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Insights] Error saving insight:', error);
      return { success: false, error: error.message };
    }

    // Generate embedding for the insight
    if (created) {
      const embeddingText = `${insight.category}: ${insight.content}`;
      await embedContextItem(
        user.id,
        created.id,
        'AI_INSIGHT',
        embeddingText,
        personalContextId, // Use resolved Personal Context collection ID
        {
          item_type: 'AI_INSIGHT',
          category: insight.category,
          confidence: insight.confidence,
        }
      );
    }

    revalidatePath('/dashboard');
    revalidatePath('/personal-context');
    return { success: true, insightId: created?.id };

  } catch (error) {
    console.error('[Insights] Error in saveInsight:', error);
    return { success: false, error: 'Failed to save insight' };
  }
}

/**
 * Update the content of an existing insight (for merge operations).
 */
async function updateInsightContent(
  insightId: string,
  newContent: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const admin = createAdminClient();

  try {
    // Get existing insight
    const { data: existing } = await admin
      .from('user_context_items')
      .select('content')
      .eq('id', insightId)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return { success: false, error: 'Insight not found' };
    }

    // Update content while preserving metadata
    const updatedContent = {
      ...existing.content,
      insight: newContent,
      lastReferencedAt: new Date().toISOString(),
    };

    const { error } = await admin
      .from('user_context_items')
      .update({ content: updatedContent })
      .eq('id', insightId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Re-embed with updated content
    const category = existing.content?.category || 'context';
    await embedContextItem(
      user.id,
      insightId,
      'AI_INSIGHT',
      `${category}: ${newContent}`,
      null,
      {
        item_type: 'AI_INSIGHT',
        category,
        updated: true,
      }
    );

    revalidatePath('/dashboard');
    return { success: true };

  } catch (error) {
    console.error('[Insights] Error updating insight:', error);
    return { success: false, error: 'Failed to update insight' };
  }
}

/**
 * Decline a pending insight (user chose not to save it).
 * This is a no-op since pending insights aren't stored,
 * but we log it for analytics.
 */
export async function declineInsight(
  insight: ExtractedInsight
): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false };
  }

  // Log the decline for analytics (optional)
  console.log(`[Insights] User ${user.id} declined insight: ${insight.content.substring(0, 50)}...`);

  return { success: true };
}

/**
 * Get all AI insights for the current user.
 */
export async function getUserInsights(): Promise<{
  success: boolean;
  insights?: any[];
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('user_context_items')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'AI_INSIGHT')
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, insights: data || [] };
}

/**
 * Increment the reference count for an insight (when AI uses it).
 */
export async function recordInsightUsage(insightId: string): Promise<void> {
  const admin = createAdminClient();

  try {
    // Get current content
    const { data: existing } = await admin
      .from('user_context_items')
      .select('content')
      .eq('id', insightId)
      .single();

    if (existing) {
      const updatedContent = {
        ...existing.content,
        referenceCount: (existing.content?.referenceCount || 0) + 1,
        lastReferencedAt: new Date().toISOString(),
      };

      await admin
        .from('user_context_items')
        .update({ content: updatedContent })
        .eq('id', insightId);
    }
  } catch (error) {
    console.error('[Insights] Error recording usage:', error);
  }
}
