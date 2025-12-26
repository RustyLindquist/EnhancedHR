/**
 * AI Insight Analyzer
 *
 * Handles novelty detection and merge logic for AI-generated insights.
 * Prevents duplicate insights by comparing against existing user insights
 * using semantic similarity via embeddings.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from './embedding';
import {
  ExtractedInsight,
  NoveltyCheckResult,
  SimilarInsight,
  MergeResult,
  INSIGHT_THRESHOLDS,
} from '@/types/insights';

/**
 * Check if a new insight is novel compared to existing user insights.
 * Uses semantic similarity to detect duplicates or merge candidates.
 *
 * @param userId - The user's ID
 * @param newInsight - The insight to check for novelty
 * @returns NoveltyCheckResult with action recommendation
 */
export async function isNovelInsight(
  userId: string,
  newInsight: ExtractedInsight
): Promise<NoveltyCheckResult> {
  const admin = createAdminClient();

  try {
    // 1. Generate embedding for the new insight
    const insightText = `${newInsight.category}: ${newInsight.content}`;
    const embedding = await generateEmbedding(insightText);

    if (!embedding || embedding.length === 0) {
      console.warn('[InsightAnalyzer] Failed to generate embedding, treating as novel');
      return { isNovel: true, similarInsights: [], action: 'save' };
    }

    // 2. Search for similar existing insights using RAG
    const { data: similarItems, error } = await admin.rpc('match_unified_embeddings', {
      query_embedding: embedding,
      match_threshold: INSIGHT_THRESHOLDS.NOVELTY_CHECK,
      match_count: 5,
      filter_scope: {
        userId,
        includePersonalContext: true,
        includeAllUserContext: true,
      }
    });

    if (error) {
      console.error('[InsightAnalyzer] Error searching for similar insights:', error);
      // On error, default to saving (better to have a potential duplicate than lose insight)
      return { isNovel: true, similarInsights: [], action: 'save' };
    }

    // 3. Filter to only AI_INSIGHT items
    const existingInsights: SimilarInsight[] = (similarItems || [])
      .filter((item: any) => item.metadata?.item_type === 'AI_INSIGHT')
      .map((item: any) => ({
        id: item.id,
        sourceId: item.source_id,
        content: item.content,
        category: item.metadata?.category || 'context',
        similarity: item.similarity,
        metadata: item.metadata,
      }));

    // 4. No existing insights = definitely novel
    if (existingInsights.length === 0) {
      console.log('[InsightAnalyzer] No similar insights found, saving as novel');
      return { isNovel: true, similarInsights: [], action: 'save' };
    }

    // 5. Determine action based on highest similarity
    const highestSimilarity = Math.max(...existingInsights.map(i => i.similarity));
    console.log(`[InsightAnalyzer] Highest similarity: ${highestSimilarity.toFixed(3)}`);

    if (highestSimilarity > INSIGHT_THRESHOLDS.DUPLICATE) {
      // Very similar - skip (likely duplicate)
      console.log('[InsightAnalyzer] Duplicate detected, skipping');
      return { isNovel: false, similarInsights: existingInsights, action: 'skip' };
    }

    if (highestSimilarity > INSIGHT_THRESHOLDS.MERGE) {
      // Somewhat similar - consider merging/updating
      console.log('[InsightAnalyzer] Similar insight found, recommending merge');
      return { isNovel: false, similarInsights: existingInsights, action: 'merge' };
    }

    // Different enough - save as new
    console.log('[InsightAnalyzer] Sufficiently different, saving as novel');
    return { isNovel: true, similarInsights: existingInsights, action: 'save' };

  } catch (error) {
    console.error('[InsightAnalyzer] Unexpected error in novelty check:', error);
    // On error, default to saving
    return { isNovel: true, similarInsights: [], action: 'save' };
  }
}

/**
 * Analyze two insights to determine if they should be merged.
 * Uses AI to make an intelligent decision about merging vs replacing.
 *
 * @param newInsight - The newly extracted insight
 * @param existingInsight - The similar existing insight
 * @returns MergeResult with action and optional merged content
 */
export async function shouldMergeInsights(
  newInsight: ExtractedInsight,
  existingInsight: SimilarInsight
): Promise<MergeResult> {
  try {
    // Use a quick AI call to decide on merge strategy
    const prompt = `Compare these two insights about the same user and determine if they should be merged:

EXISTING INSIGHT: "${existingInsight.content}"
NEW INSIGHT: "${newInsight.content}"

Analyze and respond with EXACTLY one of these actions:
1. MERGE|<combined insight text> - If the NEW insight adds meaningful new information to EXISTING
2. SKIP - If the NEW insight is essentially the same as EXISTING (no new value)
3. REPLACE|<the new insight text> - If the NEW insight contradicts or supersedes EXISTING

Rules:
- Respond with just the action and content, nothing else
- For MERGE, create a concise combined insight that includes both pieces of information
- For REPLACE, include the replacement text after the pipe
- For SKIP, just respond with SKIP

Example responses:
MERGE|User is an HR Manager leading a 50-person team and working on an Onboarding Project for Q1
SKIP
REPLACE|User has switched roles to Director of HR`;

    // Import and use a quick AI response function
    const { generateQuickAIResponse } = await import('./quick-ai');
    const response = await generateQuickAIResponse(prompt);

    // Parse the response
    const trimmed = response.trim();

    if (trimmed === 'SKIP') {
      return { shouldMerge: false, action: 'skip' };
    }

    if (trimmed.startsWith('MERGE|')) {
      const mergedContent = trimmed.substring(6).trim();
      return { shouldMerge: true, action: 'merge', mergedContent };
    }

    if (trimmed.startsWith('REPLACE|')) {
      const replacementContent = trimmed.substring(8).trim();
      return { shouldMerge: true, action: 'replace', mergedContent: replacementContent };
    }

    // If we can't parse, default to saving the new insight
    console.warn('[InsightAnalyzer] Could not parse merge response:', trimmed);
    return { shouldMerge: false, action: 'skip' };

  } catch (error) {
    console.error('[InsightAnalyzer] Error in merge analysis:', error);
    // On error, skip the merge (don't create duplicates)
    return { shouldMerge: false, action: 'skip' };
  }
}

/**
 * Extract insights from an AI response using the enhanced format.
 *
 * @param response - The AI response text
 * @param agentType - The agent that generated the response
 * @param conversationId - Optional conversation ID for tracking
 * @returns Array of extracted insights
 */
export function extractInsights(
  response: string,
  agentType: string,
  conversationId?: string
): ExtractedInsight[] {
  const insights: ExtractedInsight[] = [];

  // Enhanced format: <INSIGHT category="type" confidence="level">content</INSIGHT>
  const enhancedRegex = /<INSIGHT\s+category="(\w+)"\s+confidence="(\w+)">([\s\S]*?)<\/INSIGHT>/gi;
  let match;

  while ((match = enhancedRegex.exec(response)) !== null) {
    const category = match[1].toLowerCase();
    const confidence = match[2].toLowerCase();
    const content = match[3].trim();

    // Validate category
    const validCategories = ['project', 'role', 'challenge', 'goal', 'preference', 'experience', 'skill', 'context', 'deadline'];
    if (!validCategories.includes(category)) {
      console.warn(`[InsightAnalyzer] Invalid category: ${category}, defaulting to 'context'`);
    }

    // Validate confidence
    const validConfidence = ['high', 'medium', 'low'];
    if (!validConfidence.includes(confidence)) {
      console.warn(`[InsightAnalyzer] Invalid confidence: ${confidence}, defaulting to 'medium'`);
    }

    insights.push({
      category: validCategories.includes(category) ? category as any : 'context',
      confidence: validConfidence.includes(confidence) ? confidence as any : 'medium',
      content,
      sourceAgent: agentType,
      conversationId,
    });
  }

  // Also support legacy format: [[INSIGHT: type|content]]
  const legacyRegex = /\[\[INSIGHT:\s*(.*?)\|(.*?)\]\]/g;
  while ((match = legacyRegex.exec(response)) !== null) {
    const type = match[1].trim().toLowerCase();
    const content = match[2].trim();

    // Map legacy type to category if possible
    const categoryMap: Record<string, string> = {
      'role': 'role',
      'project': 'project',
      'goal': 'goal',
      'challenge': 'challenge',
      'preference': 'preference',
      'experience': 'experience',
      'skill': 'skill',
      'deadline': 'deadline',
    };

    insights.push({
      category: (categoryMap[type] || 'context') as any,
      confidence: 'medium', // Legacy format doesn't include confidence
      content,
      sourceAgent: agentType,
      conversationId,
    });
  }

  // Also support simple format: <INSIGHT>content</INSIGHT>
  const simpleRegex = /<INSIGHT>([\s\S]*?)<\/INSIGHT>/gi;
  // Only match if not already matched by enhanced regex
  const alreadyMatched = new Set<string>();
  let simpleMatch;
  response.replace(enhancedRegex, (match) => { alreadyMatched.add(match); return match; });

  while ((simpleMatch = simpleRegex.exec(response)) !== null) {
    const fullMatch = simpleMatch[0];
    if (!alreadyMatched.has(fullMatch) && !fullMatch.includes('category=')) {
      insights.push({
        category: 'context',
        confidence: 'medium',
        content: simpleMatch[1].trim(),
        sourceAgent: agentType,
        conversationId,
      });
    }
  }

  console.log(`[InsightAnalyzer] Extracted ${insights.length} insights from response`);
  return insights;
}

/**
 * Strip insight tags from the AI response for display to user.
 * The insights are captured but shouldn't be visible in the response.
 *
 * @param response - The AI response with insight tags
 * @returns Clean response without insight tags
 */
export function stripInsightTags(response: string): string {
  // Remove enhanced format
  let cleaned = response.replace(/<INSIGHT\s+category="\w+"\s+confidence="\w+">([\s\S]*?)<\/INSIGHT>/gi, '');

  // Remove legacy format
  cleaned = cleaned.replace(/\[\[INSIGHT:\s*(.*?)\|(.*?)\]\]/g, '');

  // Remove simple format
  cleaned = cleaned.replace(/<INSIGHT>([\s\S]*?)<\/INSIGHT>/gi, '');

  // Clean up any extra whitespace from removed tags
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  return cleaned.trim();
}
