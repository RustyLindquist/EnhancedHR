/**
 * AI Insight System Type Definitions
 *
 * These types define the structure for the AI insight identification,
 * storage, and usage system that enables agents to learn about users
 * over time.
 */

/**
 * Categories of insights that can be identified by AI agents.
 * Each category represents a different type of information about the user.
 */
export type InsightCategory =
  | 'project'      // Current work initiatives (e.g., "Onboarding Project")
  | 'role'         // Job function and responsibilities
  | 'challenge'    // Pain points and obstacles they're facing
  | 'goal'         // Aspirations and learning objectives
  | 'preference'   // How they like to work, learn, or communicate
  | 'experience'   // Past relevant experiences they reference
  | 'skill'        // Abilities, competencies, or areas of expertise
  | 'context'      // Organizational/situational context (industry, team size)
  | 'deadline';    // Time-sensitive information (deadlines, milestones)

/**
 * Confidence level of an extracted insight.
 * Used to determine priority in storage and usage decisions.
 */
export type InsightConfidence = 'high' | 'medium' | 'low';

/**
 * An insight extracted from an AI response before storage.
 * This is the intermediate format between extraction and database storage.
 */
export interface ExtractedInsight {
  category: InsightCategory;
  content: string;
  confidence: InsightConfidence;
  sourceAgent: string;
  conversationId?: string;
}

/**
 * The content structure for AI_INSIGHT items stored in user_context_items.
 * This extends the basic insight with metadata for tracking usage and lifecycle.
 */
export interface AIInsightContent {
  insight: string;                    // The actual insight text
  category: InsightCategory;          // Type classification
  confidence: InsightConfidence;      // How certain the AI was
  sourceAgent: string;                // Which agent discovered this
  sourceConversationId?: string;      // The conversation where it was found
  extractedAt: string;                // ISO timestamp of extraction
  lastReferencedAt?: string;          // When AI last used this insight
  referenceCount: number;             // How often it's been referenced
  isValidated?: boolean;              // User confirmed accuracy
  expiresAt?: string;                 // Optional expiration (for deadlines)
}

/**
 * Result of novelty analysis for a potential insight.
 */
export interface NoveltyCheckResult {
  isNovel: boolean;
  similarInsights: SimilarInsight[];
  action: 'save' | 'merge' | 'skip';
}

/**
 * An existing insight found during novelty checking.
 */
export interface SimilarInsight {
  id: string;
  sourceId: string;
  content: string;
  category: InsightCategory;
  similarity: number;
  metadata?: Record<string, any>;
}

/**
 * Result of merge analysis between two similar insights.
 */
export interface MergeResult {
  shouldMerge: boolean;
  action: 'merge' | 'skip' | 'replace';
  mergedContent?: string;
}

/**
 * Pending insight awaiting user approval (for manual mode).
 */
export interface PendingInsight {
  id: string;                         // Temporary ID for tracking
  insight: ExtractedInsight;          // The extracted insight data
  status: 'pending' | 'saved' | 'declined';
  createdAt: string;
}

/**
 * User settings for AI insight generation.
 */
export interface InsightSettings {
  autoInsights: boolean;              // Whether to auto-save insights
  // Future: additional settings like categories to ignore, etc.
}

/**
 * Relevance tier for insights in context formatting.
 * Determines how the AI should reference the insight.
 */
export type InsightRelevanceTier = 'high' | 'medium' | 'low';

/**
 * Formatted insights grouped by relevance tier for AI prompt injection.
 */
export interface FormattedInsights {
  highRelevance: string[];     // Directly applicable to current query
  mediumRelevance: string[];   // Potentially useful context
  lowRelevance: string[];      // Background info only
}

/**
 * Follow-up suggestion generated based on insights.
 */
export interface InsightFollowUp {
  prompt: string;              // The suggested follow-up question
  relatedInsightId?: string;   // The insight it's based on
  category?: InsightCategory;  // Category of related insight
}

/**
 * Props for the InsightPreviewCard component.
 */
export interface InsightPreviewCardProps {
  insight: ExtractedInsight;
  onSave: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

/**
 * Props for the InsightCapturedNotice component (auto mode).
 */
export interface InsightCapturedNoticeProps {
  insightCount: number;
  onViewClick: () => void;
}

/**
 * Props for the FollowUpChips component.
 */
export interface FollowUpChipsProps {
  suggestions: InsightFollowUp[];
  onChipClick: (prompt: string) => void;
}

/**
 * Constants for similarity thresholds in novelty detection.
 */
export const INSIGHT_THRESHOLDS = {
  /** Similarity above this = definitely duplicate, skip */
  DUPLICATE: 0.92,
  /** Similarity above this = consider merging */
  MERGE: 0.80,
  /** Similarity above this in usage = highly relevant */
  HIGH_RELEVANCE: 0.7,
  /** Similarity above this in usage = potentially relevant */
  MEDIUM_RELEVANCE: 0.5,
  /** Threshold for novelty check RAG query */
  NOVELTY_CHECK: 0.75,
} as const;

/**
 * Category display names for UI.
 */
export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  project: 'Project',
  role: 'Role',
  challenge: 'Challenge',
  goal: 'Goal',
  preference: 'Preference',
  experience: 'Experience',
  skill: 'Skill',
  context: 'Context',
  deadline: 'Deadline',
};

/**
 * Category colors for UI badges.
 */
export const INSIGHT_CATEGORY_COLORS: Record<InsightCategory, string> = {
  project: '#3B82F6',    // Blue
  role: '#8B5CF6',       // Purple
  challenge: '#EF4444',  // Red
  goal: '#10B981',       // Green
  preference: '#F59E0B', // Amber
  experience: '#6366F1', // Indigo
  skill: '#14B8A6',      // Teal
  context: '#64748B',    // Slate
  deadline: '#F97316',   // Orange
};
