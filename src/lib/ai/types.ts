export type AgentType = 'course_assistant' | 'course_tutor' | 'platform_assistant' | 'collection_assistant' | 'analytics_assistant' | 'org_engagement_analyst' | 'learning_roi_advisor' | 'skills_gap_detector' | 'conversation_insights_agent' | 'team_analytics_assistant' | 'org_course_assistant';

export type ContextScopeType = 'COURSE' | 'COLLECTION' | 'PLATFORM' | 'USER' | 'ORG_COURSES';

export interface ContextScope {
    type: ContextScopeType;
    id?: string; // Course ID (stringified), Collection ID, etc.
    userId?: string; // For User Profile context
}

export interface ContextItem {
    id: string;
    type: string; // 'LESSON', 'RESOURCE', 'COURSE', 'USER_INSIGHTS', etc.
    content: string;
    similarity?: number;
}

export interface AgentResponse {
    text: string;
    sources?: ContextItem[];
}
