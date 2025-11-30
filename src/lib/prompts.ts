import { createClient } from '@/lib/supabase/client';

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
  | 'Management';

export interface PromptSuggestion {
    id: string;
    label: string; // Short display text
    prompt: string; // Full engineered prompt
    category: PromptCategory;
    order_index?: number;
}

export async function fetchPromptSuggestions(context: 'user_dashboard' | 'employee_dashboard' | 'org_admin_dashboard'): Promise<PromptSuggestion[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('prompt_suggestions')
        .select('*')
        .eq('page_context', context)
        .order('order_index', { ascending: true });

    if (error) {
        console.error(`Error fetching prompts for ${context}:`, error);
        return [];
    }

    return data.map(p => ({
        id: p.id.toString(),
        label: p.label,
        prompt: p.prompt,
        category: p.category as any,
        order_index: p.order_index
    }));
}

export const HERO_PROMPTS: PromptSuggestion[] = [
    {
        id: 'hero-1',
        label: 'Role-play a difficult conversation',
        prompt: 'I need to have a difficult conversation with an employee who is underperforming. Can you role-play this with me? You act as the employee (defensive but open to feedback), and I will be the manager. Start by asking me for the context of the situation.',
        category: 'Communication'
    },
    {
        id: 'hero-2',
        label: 'Draft a policy announcement',
        prompt: 'I need to draft an email announcing a new "Return to Office" policy (3 days a week). The tone should be empathetic but firm, emphasizing collaboration while acknowledging the shift. Please draft 3 variations: one direct, one softer, and one focusing purely on the benefits.',
        category: 'Communication'
    },
    {
        id: 'hero-3',
        label: 'Analyze my leadership style',
        prompt: 'I want to analyze my leadership style based on a recent situation. I will describe a scenario and how I handled it, and I want you to critique it using the Situational Leadership II framework. Ready?',
        category: 'Leadership'
    }
];

export const SUGGESTION_PANEL_PROMPTS: PromptSuggestion[] = [
    {
        id: 'sugg-1',
        label: 'Prepare for a salary negotiation',
        prompt: 'I have an employee asking for a raise that is outside our budget. Help me prepare for this negotiation. What are some non-monetary benefits I can offer, and how should I structure the conversation to maintain their motivation?',
        category: 'Leadership'
    },
    {
        id: 'sugg-2',
        label: 'Create an onboarding checklist',
        prompt: 'Create a comprehensive onboarding checklist for a new Senior Marketing Manager. Break it down by: Pre-boarding, Day 1, Week 1, Month 1, and Month 3. Focus on cultural integration as much as tactical tasks.',
        category: 'Strategy'
    },
    {
        id: 'sugg-3',
        label: 'Summarize key HR trends',
        prompt: 'What are the top 5 trends in Human Resources for 2025 regarding AI and automation? Please provide a brief summary of each and one actionable step a mid-sized company can take to prepare.',
        category: 'Strategy'
    },
    {
        id: 'sugg-4',
        label: 'Write a job description',
        prompt: 'I need a job description for a "People Operations Coordinator". The culture is fast-paced and startup-like. Include responsibilities, required skills, and a "Why you\'ll love us" section that highlights autonomy and growth.',
        category: 'General'
    },
    {
        id: 'sugg-5',
        label: 'Mediate a team conflict',
        prompt: 'Two of my direct reports are in conflict over project ownership. One feels stepped on, the other feels they are just being proactive. Guide me through a mediation process to resolve this and clarify roles.',
        category: 'Leadership'
    },
    {
        id: 'sugg-6',
        label: 'Design a wellness initiative',
        prompt: 'I want to launch a wellness initiative for a remote-first team. It needs to be low-cost but high-impact. Give me 5 creative ideas that go beyond just "yoga classes".',
        category: 'Wellness'
    },
    {
        id: 'sugg-7',
        label: 'Explain a complex benefit',
        prompt: 'Explain how an HSA (Health Savings Account) works to a young employee who has never had one. Use simple analogies and bullet points. Focus on the triple tax advantage.',
        category: 'Communication'
    },
    {
        id: 'sugg-8',
        label: 'Conduct a stay interview',
        prompt: 'I want to conduct stay interviews with my top performers to ensure they are happy. What are the 5 most powerful questions I should ask to uncover their true feelings and retention risks?',
        category: 'Leadership'
    },
    {
        id: 'sugg-9',
        label: 'Draft a termination script',
        prompt: 'I have to terminate an employee for repeated policy violations (attendance). Please write a script for the meeting. It needs to be professional, direct, and legally sound (standard at-will employment context), minimizing conflict.',
        category: 'Communication'
    },
    {
        id: 'sugg-10',
        label: 'Brainstorm team building',
        prompt: 'I need 3 unique team-building activity ideas for a hybrid team (some in office, some remote) that actually build trust and aren\'t just "forced fun".',
        category: 'General'
    }
];
