/**
 * Lesson Transcript Resolution
 *
 * Utility for resolving which transcript to use for a lesson.
 * User-entered transcripts take priority over AI-generated ones.
 */

export type TranscriptSource = 'user' | 'ai' | 'none';
export type TranscriptStatus = 'pending' | 'generating' | 'ready' | 'failed';
export type TranscriptOrigin = 'none' | 'ai' | 'user' | 'mux-caption' | 'whisper' | 'youtube' | 'legacy';

export interface LessonTranscript {
    content: string | null;
    source: TranscriptSource;
    origin: TranscriptOrigin;
    hasUserOverride: boolean;
    hasAiTranscript: boolean;
    status: TranscriptStatus;
}

export interface LessonTranscriptData {
    ai_transcript?: string | null;
    user_transcript?: string | null;
    transcript_source?: TranscriptOrigin | null;
    transcript_status?: TranscriptStatus | null;
    // Legacy field - some lessons may still use 'content' for transcript
    content?: string | null;
}

/**
 * Resolve which transcript to use for a lesson
 *
 * Priority:
 * 1. User transcript (if non-empty)
 * 2. AI transcript (if non-empty)
 * 3. Legacy content field (for backward compatibility)
 * 4. None
 */
export function resolveTranscript(lesson: LessonTranscriptData): LessonTranscript {
    const userTranscript = lesson.user_transcript?.trim() || null;
    const aiTranscript = lesson.ai_transcript?.trim() || null;
    const legacyContent = lesson.content?.trim() || null;

    const hasUserOverride = !!userTranscript;
    const hasAiTranscript = !!aiTranscript || !!legacyContent;

    // Determine status
    const status: TranscriptStatus = lesson.transcript_status ||
        (hasUserOverride || hasAiTranscript ? 'ready' : 'pending');

    // User transcript takes priority
    if (userTranscript) {
        return {
            content: userTranscript,
            source: 'user',
            origin: 'user',
            hasUserOverride: true,
            hasAiTranscript,
            status: 'ready'
        };
    }

    // Fall back to AI transcript
    if (aiTranscript) {
        return {
            content: aiTranscript,
            source: 'ai',
            origin: lesson.transcript_source || 'ai',
            hasUserOverride: false,
            hasAiTranscript: true,
            status
        };
    }

    // Fall back to legacy content field
    if (legacyContent) {
        return {
            content: legacyContent,
            source: 'ai',
            origin: 'legacy',
            hasUserOverride: false,
            hasAiTranscript: true,
            status: 'ready'
        };
    }

    // No transcript available
    return {
        content: null,
        source: 'none',
        origin: 'none',
        hasUserOverride: false,
        hasAiTranscript: false,
        status
    };
}

/**
 * Get the effective transcript content for a lesson
 * Convenience wrapper that just returns the transcript text
 */
export function getTranscriptContent(lesson: LessonTranscriptData): string | null {
    return resolveTranscript(lesson).content;
}

/**
 * Check if a lesson has any transcript (user or AI)
 */
export function hasTranscript(lesson: LessonTranscriptData): boolean {
    const resolved = resolveTranscript(lesson);
    return resolved.content !== null && resolved.content.length > 0;
}

/**
 * Check if a lesson needs transcript generation
 * Returns true if:
 * - No AI transcript exists AND
 * - No user transcript exists AND
 * - Video URL is present
 */
export function needsTranscriptGeneration(lesson: LessonTranscriptData & { video_url?: string | null }): boolean {
    if (!lesson.video_url) {
        return false; // No video, no transcript needed
    }

    const resolved = resolveTranscript(lesson);
    return resolved.source === 'none' || resolved.status === 'failed';
}

/**
 * Get transcript display info for UI
 * Returns user-friendly strings for displaying transcript status
 */
export function getTranscriptDisplayInfo(lesson: LessonTranscriptData): {
    statusLabel: string;
    sourceLabel: string;
    statusColor: 'green' | 'yellow' | 'red' | 'blue' | 'gray';
    canRegenerate: boolean;
} {
    const resolved = resolveTranscript(lesson);

    // Status labels
    const statusLabels: Record<TranscriptStatus, string> = {
        pending: 'Pending',
        generating: 'Generating...',
        ready: 'Ready',
        failed: 'Failed'
    };

    // Source labels
    const sourceLabels: Record<TranscriptOrigin, string> = {
        none: 'None',
        ai: 'AI Generated',
        user: 'User Entered',
        'mux-caption': 'Mux Auto-Caption',
        whisper: 'Whisper AI',
        youtube: 'YouTube',
        legacy: 'Legacy'
    };

    // Status colors
    const statusColors: Record<TranscriptStatus, 'green' | 'yellow' | 'red' | 'blue' | 'gray'> = {
        ready: 'green',
        generating: 'blue',
        pending: 'yellow',
        failed: 'red'
    };

    // Override color if user transcript is present
    const statusColor = resolved.hasUserOverride ? 'green' : statusColors[resolved.status];

    // Can regenerate AI transcript if not currently generating
    const canRegenerate = resolved.status !== 'generating';

    return {
        statusLabel: resolved.hasUserOverride ? 'User Override' : statusLabels[resolved.status],
        sourceLabel: sourceLabels[resolved.origin],
        statusColor,
        canRegenerate
    };
}

/**
 * Prepare lesson data for RAG embedding
 * Returns the transcript content to use for vector embedding
 */
export function getTranscriptForEmbedding(lesson: LessonTranscriptData): string | null {
    // Use the resolved transcript (user takes priority)
    return getTranscriptContent(lesson);
}
