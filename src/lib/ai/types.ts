export type AgentType = 'course_assistant' | 'course_tutor' | 'platform_assistant' | 'collection_assistant';

export type ContextScopeType = 'COURSE' | 'COLLECTION' | 'PLATFORM' | 'USER';

export interface ContextScope {
    type: ContextScopeType;
    id?: string; // Course ID (stringified), Collection ID, etc.
    userId?: string; // For User Profile context
}

export interface ContextItem {
    id: string;
    type: string; // 'LESSON', 'RESOURCE', 'COURSE', etc.
    content: string;
    similarity?: number;
}

export interface AgentResponse {
    text: string;
    sources?: ContextItem[];
}
