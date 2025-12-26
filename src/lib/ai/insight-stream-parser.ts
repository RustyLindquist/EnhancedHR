/**
 * Insight Stream Parser
 *
 * Client-side utilities for parsing insight metadata from streaming responses.
 * The streaming API appends metadata at the end of the response in a special format.
 */

import type { PendingInsight, InsightFollowUp } from '@/types/insights';

/**
 * Delimiters used to mark insight metadata in the stream.
 * Must match the server-side constants in /src/app/api/chat/stream/route.ts
 */
export const INSIGHT_META_START = '<!--__INSIGHT_META__:';
export const INSIGHT_META_END = ':__END_META__-->';

/**
 * Parsed insight metadata from a streaming response.
 */
export interface StreamInsightMetadata {
  pendingInsights: PendingInsight[];
  autoSavedCount: number;
  isAutoMode: boolean;
  followUpSuggestions: InsightFollowUp[];
}

/**
 * Result of parsing a streaming response.
 */
export interface ParsedStreamResponse {
  /** The clean message content (without metadata and insight tags) */
  content: string;
  /** The raw content before cleaning (for storage) */
  rawContent: string;
  /** Parsed insight metadata, if present */
  metadata: StreamInsightMetadata | null;
}

/**
 * Parse a streaming response to extract content and insight metadata.
 *
 * @param fullResponse - The complete streamed response
 * @returns Parsed content and metadata
 */
export function parseStreamResponse(fullResponse: string): ParsedStreamResponse {
  let content = fullResponse;
  let metadata: StreamInsightMetadata | null = null;

  // 1. Extract metadata if present
  const metaStartIdx = fullResponse.indexOf(INSIGHT_META_START);
  const metaEndIdx = fullResponse.indexOf(INSIGHT_META_END);

  if (metaStartIdx !== -1 && metaEndIdx !== -1 && metaEndIdx > metaStartIdx) {
    const metaStart = metaStartIdx + INSIGHT_META_START.length;
    const metaJson = fullResponse.substring(metaStart, metaEndIdx);

    try {
      metadata = JSON.parse(metaJson);
    } catch (e) {
      console.error('[InsightStreamParser] Failed to parse metadata:', e);
    }

    // Remove metadata from content
    content = fullResponse.substring(0, metaStartIdx);
  }

  // Store raw content (with insight tags, but without metadata)
  const rawContent = content;

  // 2. Strip insight tags from display content
  content = stripInsightTags(content);

  return {
    content: content.trim(),
    rawContent,
    metadata,
  };
}

/**
 * Strip insight tags from the AI response for display to user.
 * The insights are captured but shouldn't be visible in the response.
 *
 * Handles multiple formats:
 * - Enhanced: <INSIGHT category="..." confidence="...">...</INSIGHT>
 * - Legacy: [[INSIGHT: type|content]]
 * - Simple: <INSIGHT>...</INSIGHT>
 *
 * @param response - The AI response with insight tags
 * @returns Clean response without insight tags
 */
export function stripInsightTags(response: string): string {
  // Remove enhanced format
  let cleaned = response.replace(
    /<INSIGHT\s+category="\w+"\s+confidence="\w+">([\s\S]*?)<\/INSIGHT>/gi,
    ''
  );

  // Remove legacy format
  cleaned = cleaned.replace(/\[\[INSIGHT:\s*(.*?)\|(.*?)\]\]/g, '');

  // Remove simple format
  cleaned = cleaned.replace(/<INSIGHT>([\s\S]*?)<\/INSIGHT>/gi, '');

  // Clean up any extra whitespace from removed tags
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

  return cleaned.trim();
}

/**
 * Check if a response contains insight metadata.
 *
 * @param response - The streamed response text
 * @returns True if metadata is present
 */
export function hasInsightMetadata(response: string): boolean {
  return (
    response.includes(INSIGHT_META_START) &&
    response.includes(INSIGHT_META_END)
  );
}
