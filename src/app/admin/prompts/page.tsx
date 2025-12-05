import React from 'react';
import { createClient } from '@/lib/supabase/server';
import SystemPromptManager from '@/components/admin/SystemPromptManager';

export const dynamic = 'force-dynamic';

export default async function AdminPromptsPage() {
    const supabase = await createClient();

    const { data: prompts } = await supabase
        .from('ai_system_prompts')
        .select('*')
        .order('agent_type');

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">AI Agents</h1>
                <p className="text-slate-400">Configure the core instructions and models for the platform's AI agents.</p>
            </div>

            <SystemPromptManager initialPrompts={prompts || []} />
        </div>
    );
}
