'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, AlertCircle, Bot, RefreshCw, Cpu } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchOpenRouterModels, OpenRouterModel } from '@/app/actions/ai';

interface SystemPrompt {
    id: string;
    agent_type: string;
    system_instruction: string;
    model?: string;
}

interface SystemPromptManagerProps {
    initialPrompts: SystemPrompt[];
}

const DEFAULT_PROMPTS = [
    { agent_type: 'platform_assistant', system_instruction: 'You are the Platform Assistant for EnhancedHR. Your goal is to help users navigate the platform, find courses, and answer general HR questions. You have access to the entire library of courses and the user\'s profile.', model: 'google/gemini-2.0-flash-001' },
    { agent_type: 'collection_assistant', system_instruction: 'You are the Collection Assistant. You are context-aware of the specific collection the user is viewing. Help them synthesize information across the courses in this collection.', model: 'google/gemini-2.0-flash-001' },
    { agent_type: 'course_assistant', system_instruction: 'You are the Course Assistant. You are an expert on this specific course. Answer questions based ONLY on the course material provided in the transcript and resources.', model: 'google/gemini-2.0-flash-001' },
    { agent_type: 'course_tutor', system_instruction: 'You are the Course Tutor. Your goal is not just to answer, but to teach. Use Socratic methods, ask probing questions, and help the user apply the course concepts to their specific role and company context.', model: 'google/gemini-2.0-flash-001' }
];

// Google Gemini models available via Google AI Studio API
interface GeminiModel {
    id: string;
    name: string;
}

const GEMINI_MODELS: GeminiModel[] = [
    { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro Preview (06-05)' },
    { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview (05-20)' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B' },
];

export default function SystemPromptManager({ initialPrompts }: SystemPromptManagerProps) {
    const [prompts, setPrompts] = useState<SystemPrompt[]>(initialPrompts);
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(initialPrompts.length > 0 ? initialPrompts[0].id : null);
    const [editedInstruction, setEditedInstruction] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'seeding'>('idle');
    const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelTab, setModelTab] = useState<'production' | 'developer'>('production');

    // Fetch available models on mount
    useEffect(() => {
        const loadModels = async () => {
            setIsLoadingModels(true);
            const models = await fetchOpenRouterModels();
            // Sort models by name
            models.sort((a, b) => a.name.localeCompare(b.name));
            setAvailableModels(models);
            setIsLoadingModels(false);
        };
        loadModels();
    }, []);

    // Sync edited instruction, model, and model tab when selection changes
    useEffect(() => {
        if (selectedPromptId) {
            const prompt = prompts.find(p => p.id === selectedPromptId);
            if (prompt) {
                setEditedInstruction(prompt.system_instruction);
                const model = prompt.model || 'google/gemini-2.0-flash-001';
                setSelectedModel(model);

                // Determine which tab based on model format
                // Developer models are direct Gemini IDs (e.g., 'gemini-2.0-flash')
                // Production models are OpenRouter format (e.g., 'google/gemini-2.0-flash-001')
                const isDeveloperModel = GEMINI_MODELS.some(gm => gm.id === model);
                setModelTab(isDeveloperModel ? 'developer' : 'production');
            }
        }
    }, [selectedPromptId, prompts]);


    const handleSave = async () => {
        if (!selectedPromptId) return;
        setStatus('saving');
        const supabase = createClient();

        const { data, error } = await supabase
            .from('ai_system_prompts')
            .update({
                system_instruction: editedInstruction,
                model: selectedModel,
                updated_at: new Date().toISOString()
            })
            .eq('id', selectedPromptId)
            .select();

        if (error) {
            console.error('Error updating prompt:', error);
            setStatus('error');
            alert(`Error saving: ${error.message}`);
        } else if (!data || data.length === 0) {
            console.error('No data returned after update. RLS might be blocking it.');
            setStatus('error');
            alert('Save failed. You may not have permission to update this record. Please ensure you are an Admin.');
        } else {
            // Update local state
            setPrompts(prompts.map(p => p.id === selectedPromptId ? { ...p, system_instruction: editedInstruction, model: selectedModel } : p));
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    const handleSeed = async () => {
        setStatus('seeding');
        const supabase = createClient();

        try {
            for (const defaultPrompt of DEFAULT_PROMPTS) {
                await supabase
                    .from('ai_system_prompts')
                    .upsert(defaultPrompt, { onConflict: 'agent_type' });
            }

            // Refresh data
            const { data } = await supabase.from('ai_system_prompts').select('*').order('agent_type');
            if (data) {
                setPrompts(data);
                if (data.length > 0) setSelectedPromptId(data[0].id);
            }
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (error) {
            console.error('Error seeding prompts:', error);
            setStatus('error');
        }
    };

    const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

    if (prompts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white/5 rounded-2xl border border-white/10">
                <Bot size={48} className="text-slate-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No AI Agents Found</h3>
                <p className="text-slate-400 mb-6 max-w-md">The database appears to be empty. Initialize the system with default agents.</p>
                <button
                    onClick={handleSeed}
                    disabled={status === 'seeding'}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-blue-light text-brand-black rounded-full font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                    {status === 'seeding' ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                    Initialize Defaults
                </button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-200px)] gap-6">
            {/* Sidebar List */}
            <div className="w-1/3 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {prompts.map((prompt) => (
                    <button
                        key={prompt.id}
                        onClick={() => setSelectedPromptId(prompt.id)}
                        className={`
                            flex items-center gap-3 p-4 rounded-xl text-left transition-all border
                            ${selectedPromptId === prompt.id
                                ? 'bg-brand-blue-light/10 border-brand-blue-light/30 shadow-[0_0_15px_rgba(120,192,240,0.1)]'
                                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}
                        `}
                    >
                        <div className={`
                            w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
                            ${selectedPromptId === prompt.id ? 'bg-brand-blue-light text-brand-black' : 'bg-white/10 text-slate-400'}
                        `}>
                            {prompt.agent_type.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className={`font-bold ${selectedPromptId === prompt.id ? 'text-white' : 'text-slate-300'}`}>
                                {prompt.agent_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[180px]">
                                {prompt.model || 'Default Model'}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {selectedPrompt ? (
                    <>
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <Bot size={24} className="text-brand-blue-light" />
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {selectedPrompt.agent_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </h2>
                                    <p className="text-xs text-slate-400">Edit Agent Configuration</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={status === 'saving' || (editedInstruction === selectedPrompt.system_instruction && selectedModel === selectedPrompt.model)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all
                                    ${status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                                        status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                            (editedInstruction !== selectedPrompt.system_instruction || selectedModel !== selectedPrompt.model)
                                                ? 'bg-brand-blue-light text-brand-black hover:bg-white shadow-[0_0_15px_rgba(120,192,240,0.3)]'
                                                : 'bg-white/10 text-slate-400 cursor-not-allowed'}
                                `}
                            >
                                {status === 'saving' ? 'Saving...' :
                                    status === 'success' ? <><CheckCircle size={16} /> Saved</> :
                                        status === 'error' ? <><AlertCircle size={16} /> Error</> :
                                            <><Save size={16} /> Save Changes</>}
                            </button>
                        </div>

                        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                            {/* Model Selection with Production/Developer Tabs */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Cpu size={14} /> AI Model
                                </label>

                                {/* Tab Navigation - Dashboard V3 Style */}
                                <div className="flex items-center gap-1 mb-3">
                                    <button
                                        onClick={() => setModelTab('production')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${modelTab === 'production'
                                            ? 'bg-white/10 text-white'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Cpu size={14} />
                                            Production Models
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setModelTab('developer')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${modelTab === 'developer'
                                            ? 'bg-white/10 text-white'
                                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Bot size={14} />
                                            Developer Models
                                        </span>
                                    </button>
                                </div>

                                {/* Model Dropdown */}
                                <div className="relative">
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-blue-light/50 focus:ring-1 focus:ring-brand-blue-light/20 appearance-none"
                                        disabled={modelTab === 'production' && isLoadingModels}
                                    >
                                        <option value="" disabled>Select a model...</option>
                                        {modelTab === 'production' ? (
                                            availableModels.length > 0 ? (
                                                availableModels.map(model => (
                                                    <option key={model.id} value={model.id}>
                                                        {model.name}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value={selectedModel}>{selectedModel} (Current)</option>
                                            )
                                        ) : (
                                            GEMINI_MODELS.map(model => (
                                                <option key={model.id} value={model.id}>
                                                    {model.name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        {modelTab === 'production' && isLoadingModels ? <RefreshCw size={14} className="animate-spin" /> : '▼'}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {modelTab === 'production'
                                        ? (isLoadingModels ? 'Loading available production models from OpenRouter...' : 'Production models are served via OpenRouter for reliability and fallback support.')
                                        : 'Developer models use Google AI Studio API directly. Best for testing new Gemini features.'}
                                </p>
                            </div>


                            {/* System Instruction */}
                            <div className="space-y-2 flex-1 flex flex-col">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Bot size={14} /> System Instruction
                                </label>
                                <textarea
                                    value={editedInstruction}
                                    onChange={(e) => setEditedInstruction(e.target.value)}
                                    className="w-full flex-1 bg-black/30 border border-white/10 rounded-xl p-6 text-slate-200 focus:outline-none focus:border-brand-blue-light/50 focus:ring-1 focus:ring-brand-blue-light/20 font-mono text-sm leading-relaxed resize-none custom-scrollbar min-h-[300px]"
                                    placeholder="Enter system instruction..."
                                    spellCheck={false}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        Select an agent to edit
                    </div>
                )}
            </div>
        </div>
    );
}
