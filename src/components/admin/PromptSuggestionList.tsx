'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PromptSuggestion } from '@/lib/prompts';
import { Plus, Trash2, Edit2, Save, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';

type PageContext = 'user_dashboard' | 'employee_dashboard' | 'org_admin_dashboard';

interface PromptSuggestionListProps {
    initialContext?: PageContext;
}

const PromptSuggestionList: React.FC<PromptSuggestionListProps> = ({ initialContext = 'user_dashboard' }) => {
    const [context, setContext] = useState<PageContext>(initialContext);
    const [prompts, setPrompts] = useState<PromptSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newPrompt, setNewPrompt] = useState<Partial<PromptSuggestion> | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchPrompts();
    }, [context]);

    const fetchPrompts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('prompt_suggestions')
            .select('*')
            .eq('page_context', context)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching prompts:', error);
        } else {
            setPrompts(data || []);
        }
        setIsLoading(false);
    };

    const handleSave = async (prompt: Partial<PromptSuggestion>) => {
        if (!prompt.label || !prompt.prompt) return;

        const isNew = !prompt.id;
        const payload = {
            page_context: context,
            label: prompt.label,
            prompt: prompt.prompt,
            category: prompt.category || 'General',
            order_index: isNew ? prompts.length : prompt.order_index // Append to end if new
        };

        if (isNew) {
            const { error } = await supabase.from('prompt_suggestions').insert([payload]);
            if (error) console.error('Error creating prompt:', error);
        } else {
            const { error } = await supabase.from('prompt_suggestions').update(payload).eq('id', prompt.id);
            if (error) console.error('Error updating prompt:', error);
        }

        setEditingId(null);
        setNewPrompt(null);
        fetchPrompts();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this prompt?')) return;
        const { error } = await supabase.from('prompt_suggestions').delete().eq('id', id);
        if (error) console.error('Error deleting prompt:', error);
        fetchPrompts();
    };

    const handleReorder = async (id: string, direction: 'up' | 'down') => {
        const index = prompts.findIndex(p => p.id === id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === prompts.length - 1) return;

        const otherIndex = direction === 'up' ? index - 1 : index + 1;
        const otherPrompt = prompts[otherIndex];
        const currentPrompt = prompts[index];

        // Optimistic update
        const newPrompts = [...prompts];
        newPrompts[index] = otherPrompt;
        newPrompts[otherIndex] = currentPrompt;
        setPrompts(newPrompts);

        // DB Update
        await supabase.from('prompt_suggestions').update({ order_index: otherPrompt.order_index }).eq('id', currentPrompt.id);
        await supabase.from('prompt_suggestions').update({ order_index: currentPrompt.order_index }).eq('id', otherPrompt.id);

        // Refetch to ensure sync
        fetchPrompts();
    };

    return (
        <div className="space-y-6">
            {/* Context Switcher */}
            <div className="flex space-x-4 border-b border-white/10 pb-4">
                {(['user_dashboard', 'employee_dashboard', 'org_admin_dashboard'] as PageContext[]).map((ctx) => (
                    <button
                        key={ctx}
                        onClick={() => setContext(ctx)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${context === ctx
                                ? 'bg-brand-blue-light text-brand-black'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {ctx.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-brand-blue-light" size={32} />
                    </div>
                ) : (
                    <>
                        {prompts.map((prompt) => (
                            <div key={prompt.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start group hover:border-white/20 transition-colors">
                                {editingId === prompt.id ? (
                                    <PromptEditorForm
                                        initialData={prompt}
                                        onSave={handleSave}
                                        onCancel={() => setEditingId(null)}
                                    />
                                ) : (
                                    <>
                                        {/* Drag/Order Controls */}
                                        <div className="flex flex-col gap-1 pt-1">
                                            <button onClick={() => handleReorder(prompt.id, 'up')} className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/10"><ChevronUp size={16} /></button>
                                            <button onClick={() => handleReorder(prompt.id, 'down')} className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/10"><ChevronDown size={16} /></button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-white">{prompt.label}</span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400 border border-white/5">{prompt.category}</span>
                                            </div>
                                            <p className="text-sm text-slate-400 font-mono bg-black/30 p-2 rounded-lg border border-white/5">
                                                {prompt.prompt}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingId(prompt.id)} className="p-2 text-slate-400 hover:text-brand-blue-light hover:bg-brand-blue-light/10 rounded-lg transition-colors">
                                                <Edit2 size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(prompt.id)} className="p-2 text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Add New Button */}
                        {!newPrompt && (
                            <button
                                onClick={() => setNewPrompt({})}
                                className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
                            >
                                <Plus size={20} />
                                <span>Add New Prompt Suggestion</span>
                            </button>
                        )}

                        {/* New Prompt Form */}
                        {newPrompt && (
                            <div className="bg-white/5 border border-brand-blue-light/30 rounded-xl p-4">
                                <PromptEditorForm
                                    initialData={newPrompt}
                                    onSave={handleSave}
                                    onCancel={() => setNewPrompt(null)}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const PromptEditorForm = ({ initialData, onSave, onCancel }: { initialData: Partial<PromptSuggestion>, onSave: (data: Partial<PromptSuggestion>) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState(initialData);

    return (
        <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Label (User View)</label>
                    <input
                        type="text"
                        value={formData.label || ''}
                        onChange={e => setFormData({ ...formData, label: e.target.value })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-brand-blue-light focus:outline-none"
                        placeholder="e.g. Summarize this module"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Category</label>
                    <select
                        value={formData.category || 'General'}
                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-brand-blue-light focus:outline-none"
                    >
                        {['Leadership', 'Communication', 'Strategy', 'Wellness', 'General', 'Growth', 'Career', 'Productivity'].map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Full Prompt (System View)</label>
                <textarea
                    value={formData.prompt || ''}
                    onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-brand-blue-light focus:outline-none h-24"
                    placeholder="The full prompt that will be sent to the AI..."
                />
            </div>
            <div className="flex justify-end gap-2">
                <button onClick={onCancel} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
                <button
                    onClick={() => onSave(formData)}
                    disabled={!formData.label || !formData.prompt}
                    className="px-4 py-2 bg-brand-blue-light text-brand-black rounded-lg text-sm font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save size={16} /> Save Prompt
                </button>
            </div>
        </div>
    );
};

export default PromptSuggestionList;
