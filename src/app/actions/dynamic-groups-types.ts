// Type definitions for dynamic group criteria
// This file is separate from dynamic-groups.ts because "use server" files can only export async functions

export interface RecentLoginsCriteria {
  type: 'recent_logins';
  days: number;
}

export interface NoLoginsCriteria {
  type: 'no_logins';
  days: number;
}

export interface MostActiveCriteria {
  type: 'most_active';
  metrics: ('streaks' | 'time_in_course' | 'courses_completed' | 'collection_utilization')[];
  period_days: number;
  threshold: number; // 0-100 percentile score
}

export interface TopLearnersCriteria {
  type: 'top_learners';
  metrics: ('time_spent' | 'courses_completed' | 'credits_earned')[];
  period_days: number;
  threshold: number; // 0-100 percentile score
}

export interface MostTalkativeCriteria {
  type: 'most_talkative';
  metrics: ('conversation_count' | 'message_count')[];
  period_days: number;
  threshold: number; // 0-100 percentile score
}

export type DynamicGroupCriteria =
  | RecentLoginsCriteria
  | NoLoginsCriteria
  | MostActiveCriteria
  | TopLearnersCriteria
  | MostTalkativeCriteria;

export type DynamicGroupType = 'recent_logins' | 'no_logins' | 'most_active' | 'top_learners' | 'most_talkative';

// Metadata for each dynamic group type
export const DYNAMIC_GROUP_TYPES = {
  recent_logins: {
    name: 'Recent Logins',
    description: 'Users who have been active within the specified time period',
    defaultCriteria: { type: 'recent_logins', days: 30 } as RecentLoginsCriteria,
  },
  no_logins: {
    name: 'No Logins',
    description: 'Users who have not been active within the specified time period',
    defaultCriteria: { type: 'no_logins', days: 30 } as NoLoginsCriteria,
  },
  most_active: {
    name: 'Most Active',
    description: 'Users with highest overall platform engagement',
    defaultCriteria: {
      type: 'most_active',
      metrics: ['streaks', 'time_in_course', 'courses_completed', 'collection_utilization'],
      period_days: 30,
      threshold: 50,
    } as MostActiveCriteria,
  },
  top_learners: {
    name: 'Top Learners',
    description: 'Users with highest learning metrics',
    defaultCriteria: {
      type: 'top_learners',
      metrics: ['time_spent', 'courses_completed', 'credits_earned'],
      period_days: 30,
      threshold: 50,
    } as TopLearnersCriteria,
  },
  most_talkative: {
    name: 'Most Talkative',
    description: 'Users with highest conversation activity',
    defaultCriteria: {
      type: 'most_talkative',
      metrics: ['conversation_count', 'message_count'],
      period_days: 30,
      threshold: 50,
    } as MostTalkativeCriteria,
  },
} as const;
