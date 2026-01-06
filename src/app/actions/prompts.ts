'use server';

import { createAdminClient } from '@/lib/supabase/admin';

export type PromptCategory =
    | 'General'
    | 'Growth'
    | 'Career'
    | 'Productivity'
    | 'Wellness'
    | 'Leadership'
    | 'Communication'
    | 'Strategy'
    | 'Analytics'
    | 'Reporting'
    | 'Management'
    | 'Inspiration'
    | 'Content Creation'
    | 'Financials';

export interface PromptSuggestion {
    id: string;
    label: string;
    prompt: string;
    category: PromptCategory;
    order_index?: number;
}

export type PageContext = 'user_dashboard' | 'employee_dashboard' | 'org_admin_dashboard' | 'instructor_dashboard';

export async function fetchPromptSuggestionsAction(context: PageContext): Promise<PromptSuggestion[]> {
    const admin = createAdminClient();

    const { data, error } = await admin
        .from('prompt_suggestions')
        .select('*')
        .eq('page_context', context)
        .order('order_index', { ascending: true });

    if (error) {
        console.error(`Error fetching prompts for ${context}:`, error);
        return [];
    }

    return (data || []).map(p => ({
        id: p.id.toString(),
        label: p.label,
        prompt: p.prompt,
        category: p.category as PromptCategory,
        order_index: p.order_index
    }));
}
