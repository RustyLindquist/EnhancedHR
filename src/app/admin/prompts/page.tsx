import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Save } from 'lucide-react';
import PromptEditor from '@/components/admin/PromptEditor';

export default async function AdminPromptsPage() {
    const supabase = await createClient();

    const { data: prompts } = await supabase
        .from('ai_system_prompts')
        .select('*')
        .order('agent_type');

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">AI System Prompts</h1>
                <p className="text-slate-400">Configure the behavior of the AI agents.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {prompts?.map((prompt) => (
                    <PromptEditor key={prompt.id} prompt={prompt} />
                ))}
            </div>
        </div>
    );
}
