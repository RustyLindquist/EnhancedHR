import React from 'react';
import PromptSuggestionList from '@/components/admin/PromptSuggestionList';

export default function AdminPromptSuggestionsPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Prompt Suggestions</h1>
                <p className="text-slate-400">Manage the "Quick Chat" suggestions displayed on various dashboards.</p>
            </div>

            <PromptSuggestionList />
        </div>
    );
}
