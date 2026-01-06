'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchOpenRouterModels, OpenRouterModel, initializeInsightInstructions } from '@/app/actions/ai';
import { getAllModelPricing, getCostByAgent, type ModelPricing, type AgentCostSummary } from '@/app/actions/cost-analytics';
import { Save, CheckCircle, AlertCircle, Bot, RefreshCw, Cpu, ChevronDown, ChevronRight, Plus, X, Trash2, Sparkles, MessageSquare, Database, FileText, Info, Wand2, DollarSign, TrendingDown } from 'lucide-react';

interface SystemPrompt {
    id: string;
    agent_type: string;
    system_instruction: string;
    insight_instructions?: string;
    model?: string;
}

interface PromptLibraryItem {
    id: string;
    key: string;
    prompt_text: string;
    description: string;
    input_variables: string[];
    model?: string;
    has_prompt?: boolean;
    category?: string;
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
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Latest)' },
    { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (Stable)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro (Stable)' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash (Stable)' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B (Smallest)' },
    { id: 'google/gemma-2-27b-it:free', name: 'Gemma 2 27B (Free - OpenRouter)' },
];

export default function SystemPromptManager({ initialPrompts }: SystemPromptManagerProps) {
    // Agent Prompts State
    const [prompts, setPrompts] = useState<SystemPrompt[]>(initialPrompts);
    const [selectedPromptId, setSelectedPromptId] = useState<string | null>(initialPrompts.length > 0 ? initialPrompts[0].id : null);
    const [editedInstruction, setEditedInstruction] = useState<string>('');
    const [editedInsightInstructions, setEditedInsightInstructions] = useState<string>('');
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error' | 'seeding'>('idle');
    const [activeTab, setActiveTab] = useState<'base' | 'insights'>('base');

    // Prompt Library State
    const [libraryItems, setLibraryItems] = useState<PromptLibraryItem[]>([]);
    const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
    const [libraryStatus, setLibraryStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('idle');
    const [viewMode, setViewMode] = useState<'agents' | 'library'>('agents');

    const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [modelTab, setModelTab] = useState<'production' | 'developer'>('production');
    const [isInitializingInsights, setIsInitializingInsights] = useState(false);

    // Pricing state
    const [modelPricing, setModelPricing] = useState<Map<string, ModelPricing>>(new Map());
    const [agentCosts, setAgentCosts] = useState<AgentCostSummary[]>([]);
    const [isLoadingPricing, setIsLoadingPricing] = useState(false);

    // Fetch available models and pricing on mount
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

        const loadPricing = async () => {
            setIsLoadingPricing(true);
            try {
                const [pricing, costs] = await Promise.all([
                    getAllModelPricing(),
                    getCostByAgent(30)
                ]);
                const pricingMap = new Map(pricing.map(p => [p.model_id, p]));
                setModelPricing(pricingMap);
                setAgentCosts(costs);
            } catch (error) {
                console.error('Error loading pricing:', error);
            } finally {
                setIsLoadingPricing(false);
            }
        };
        loadPricing();
    }, []);

    // Fetch Library Items
    useEffect(() => {
        const fetchLibrary = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('ai_prompt_library').select('*').order('key');
            if (data) setLibraryItems(data);
        };
        fetchLibrary();
    }, []);

    // Sync edited instruction, model, and model tab when selection changes
    useEffect(() => {
        if (viewMode === 'agents' && selectedPromptId) {
            const prompt = prompts.find(p => p.id === selectedPromptId);
            if (prompt) {
                setEditedInstruction(prompt.system_instruction);
                setEditedInsightInstructions(prompt.insight_instructions || '');
                const model = prompt.model || 'google/gemini-2.0-flash-001';
                setSelectedModel(model);
                syncModelTab(model);
            }
        } else if (viewMode === 'library' && selectedLibraryId) {
            const item = libraryItems.find(i => i.id === selectedLibraryId);
            if (item) {
                setEditedInstruction(item.prompt_text);
                setEditedInsightInstructions(''); // Library items don't have insight instructions
                const model = item.model || '';
                setSelectedModel(model);
                syncModelTab(model);
            }
        } else if (viewMode === 'library' && !selectedLibraryId) {
            setEditedInstruction('');
            setEditedInsightInstructions('');
            setSelectedModel('');
        }
    }, [selectedPromptId, selectedLibraryId, viewMode, prompts, libraryItems]);

    const syncModelTab = (model: string) => {
        const isDeveloperModel = GEMINI_MODELS.some(gm => gm.id === model);
        setModelTab(isDeveloperModel ? 'developer' : 'production');
    }

    const handleSave = async () => {
        if (viewMode === 'agents' && !selectedPromptId) return;
        if (viewMode === 'library' && !selectedLibraryId) return; // For update only here

        setStatus('saving');
        const supabase = createClient();

        if (viewMode === 'agents' && selectedPromptId) {
            const { data, error } = await supabase
                .from('ai_system_prompts')
                .update({
                    system_instruction: editedInstruction,
                    insight_instructions: editedInsightInstructions,
                    model: selectedModel,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedPromptId)
                .select();

            if (error) {
                handleError(error);
            } else {
                setPrompts(prompts.map(p => p.id === selectedPromptId ? { ...p, system_instruction: editedInstruction, insight_instructions: editedInsightInstructions, model: selectedModel } : p));
                handleSuccess();
            }
        } else if (viewMode === 'library' && selectedLibraryId) {
            const { data, error } = await supabase
                .from('ai_prompt_library')
                .update({
                    prompt_text: editedInstruction,
                    model: selectedModel, // Optional override
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedLibraryId)
                .select();

            if (error) {
                handleError(error);
            } else {
                setLibraryItems(libraryItems.map(i => i.id === selectedLibraryId ? { ...i, prompt_text: editedInstruction, model: selectedModel } : i));
                handleSuccess();
            }
        }
    };

    const handleError = (error: any) => {
        console.error('Error saving:', error);
        setStatus('error');
        alert(`Error saving: ${error.message}`);
    }

    const handleSuccess = () => {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    }

    const handleInitializeInsightInstructions = async () => {
        if (!selectedPrompt) return;

        setIsInitializingInsights(true);
        try {
            const result = await initializeInsightInstructions(selectedPrompt.agent_type);
            if (result.success) {
                // Update local state directly with the returned instructions
                setEditedInsightInstructions(result.instructions);
                // Also update the prompts array to keep in sync
                setPrompts(prompts.map(p =>
                    p.id === selectedPromptId
                        ? { ...p, insight_instructions: result.instructions }
                        : p
                ));
                alert(result.message);
            } else {
                alert(`Failed to load default: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsInitializingInsights(false);
        }
    };

    const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
    const selectedLibraryItem = libraryItems.find(i => i.id === selectedLibraryId);

    // Get current agent's cost summary
    const currentAgentCost = viewMode === 'agents' && selectedPrompt
        ? agentCosts.find(c => c.agent_type === selectedPrompt.agent_type)
        : null;

    // Helper to format pricing
    const formatPricing = (modelId: string): string => {
        const pricing = modelPricing.get(modelId);
        if (!pricing) return '';
        const promptPrice = pricing.prompt_price_per_million;
        const completionPrice = pricing.completion_price_per_million;
        if (promptPrice === 0 && completionPrice === 0) return ' (Free)';
        return ` ($${promptPrice.toFixed(2)}/$${completionPrice.toFixed(2)} per M)`;
    };

    // Helper to get quality tier badge color
    const getTierColor = (tier: string | null) => {
        switch (tier) {
            case 'free': return 'text-emerald-400';
            case 'economy': return 'text-blue-400';
            case 'standard': return 'text-yellow-400';
            case 'premium': return 'text-purple-400';
            case 'flagship': return 'text-rose-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">

            {/* View Toggle */}
            <div className="flex border-b border-white/10 px-6 -mx-6 pb-0">
                <button
                    onClick={() => setViewMode('agents')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${viewMode === 'agents' ? 'border-brand-blue-light text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Agent System Prompts
                </button>
                <button
                    onClick={() => setViewMode('library')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${viewMode === 'library' ? 'border-brand-blue-light text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                >
                    Backend AI Agents
                </button>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Sidebar List */}
                <div className="w-1/3 flex flex-col gap-2 overflow-y-auto pr-2 pb-[100px] custom-scrollbar">
                    {viewMode === 'agents' ? (
                        prompts.map((prompt) => (
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
                        ))
                    ) : (
                        <>
                            {/* Group items by category */}
                            {['recommendations', 'chat', 'embeddings', 'backend'].map(category => {
                                const categoryItems = libraryItems.filter(item => (item.category || 'backend') === category);
                                if (categoryItems.length === 0) return null;

                                const categoryLabels: Record<string, string> = {
                                    recommendations: 'Recommendations',
                                    chat: 'Chat & Conversations',
                                    embeddings: 'Embeddings (RAG)',
                                    backend: 'Other Backend AI'
                                };

                                const CategoryIcon = category === 'embeddings' ? Database :
                                                    category === 'chat' ? MessageSquare :
                                                    category === 'recommendations' ? Sparkles : Bot;

                                return (
                                    <div key={category} className="space-y-2">
                                        <div className="flex items-center gap-2 px-2 pt-4 pb-1">
                                            <CategoryIcon size={12} className="text-slate-500" />
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                {categoryLabels[category] || category}
                                            </span>
                                        </div>
                                        {categoryItems.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setSelectedLibraryId(item.id)}
                                                className={`
                                                    flex items-center gap-3 p-4 rounded-xl text-left transition-all border w-full
                                                    ${selectedLibraryId === item.id
                                                        ? 'bg-brand-blue-light/10 border-brand-blue-light/30 shadow-[0_0_15px_rgba(120,192,240,0.1)]'
                                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'}
                                                `}
                                            >
                                                <div className={`
                                                    w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                                                    ${selectedLibraryId === item.id ? 'bg-brand-blue-light text-brand-black' : 'bg-white/10 text-slate-400'}
                                                `}>
                                                    {item.has_prompt === false ? <Database size={18} /> : <Bot size={18} />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className={`font-bold truncate ${selectedLibraryId === item.id ? 'text-white' : 'text-slate-300'}`}>
                                                        {item.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500 truncate">
                                                            {item.model || 'No model set'}
                                                        </span>
                                                        {item.has_prompt === false && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">
                                                                Model Only
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Editor Area */}
                <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {(viewMode === 'agents' && selectedPrompt) || (viewMode === 'library' && selectedLibraryItem) ? (
                        <>
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <Bot size={24} className="text-brand-blue-light" />
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {viewMode === 'agents'
                                                ? selectedPrompt?.agent_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                                : selectedLibraryItem?.key
                                            }
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            {viewMode === 'agents' ? 'Edit Agent Configuration' : selectedLibraryItem?.description}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={
                                        status === 'saving' ||
                                        (viewMode === 'agents' && (editedInstruction === selectedPrompt?.system_instruction && editedInsightInstructions === (selectedPrompt?.insight_instructions || '') && selectedModel === selectedPrompt?.model)) ||
                                        (viewMode === 'library' && (editedInstruction === selectedLibraryItem?.prompt_text && selectedModel === selectedLibraryItem?.model))
                                    }
                                    className={`
                                        flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all
                                        ${status === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                                            status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                                                'bg-brand-blue-light text-brand-black hover:bg-white shadow-[0_0_15px_rgba(120,192,240,0.3)]'}
                                    `}
                                >
                                    {status === 'saving' ? 'Saving...' :
                                        status === 'success' ? <><CheckCircle size={16} /> Saved</> :
                                            status === 'error' ? <><AlertCircle size={16} /> Error</> :
                                                <><Save size={16} /> Save Changes</>}
                                </button>
                            </div>

                            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                                {/* Model Selection */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <Cpu size={14} /> AI Model {viewMode === 'library' && '(Optional Override)'}
                                    </label>

                                    {/* Tab Navigation */}
                                    <div className="flex items-center gap-1 mb-3">
                                        <button
                                            onClick={() => setModelTab('production')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${modelTab === 'production'
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                                }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Cpu size={14} /> Production Models
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
                                                <Bot size={14} /> Developer Models
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
                                            <option value="">{viewMode === 'library' ? 'Inherit from Agent (Default)' : 'Select a model...'}</option>
                                            {modelTab === 'production' ? (
                                                availableModels.length > 0 ? (
                                                    availableModels.map(model => (
                                                        <option key={model.id} value={model.id}>
                                                            {model.name}{formatPricing(model.id)}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value={selectedModel}>{selectedModel || 'No model selected'}</option>
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

                                    {/* Selected Model Pricing Info */}
                                    {selectedModel && modelPricing.get(selectedModel) && (
                                        <div className="bg-slate-800/50 border border-white/5 rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign size={14} className="text-emerald-400" />
                                                    <span className="text-xs text-slate-400">Pricing:</span>
                                                </div>
                                                <div className="text-xs">
                                                    <span className={getTierColor(modelPricing.get(selectedModel)?.quality_tier || null)}>
                                                        {modelPricing.get(selectedModel)?.quality_tier?.toUpperCase() || 'UNKNOWN'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-4 text-xs">
                                                <div>
                                                    <span className="text-slate-500">Prompt:</span>
                                                    <span className="ml-1 text-slate-300">${modelPricing.get(selectedModel)?.prompt_price_per_million.toFixed(2)}/M</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Completion:</span>
                                                    <span className="ml-1 text-slate-300">${modelPricing.get(selectedModel)?.completion_price_per_million.toFixed(2)}/M</span>
                                                </div>
                                                {modelPricing.get(selectedModel)?.context_length && (
                                                    <div>
                                                        <span className="text-slate-500">Context:</span>
                                                        <span className="ml-1 text-slate-300">{(modelPricing.get(selectedModel)!.context_length! / 1000).toFixed(0)}K</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Agent Cost Summary (30 days) */}
                                    {currentAgentCost && currentAgentCost.total_cost > 0 && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingDown size={14} className="text-emerald-400" />
                                                <span className="text-xs font-bold text-emerald-400">Last 30 Days Usage</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div>
                                                    <span className="text-slate-500">Requests:</span>
                                                    <span className="ml-1 text-slate-300">{currentAgentCost.total_requests.toLocaleString()}</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Tokens:</span>
                                                    <span className="ml-1 text-slate-300">{(currentAgentCost.total_tokens / 1000).toFixed(0)}K</span>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Cost:</span>
                                                    <span className="ml-1 text-emerald-400 font-medium">${currentAgentCost.total_cost.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>


                                {/* Instruction/Prompt Text */}
                                <div className="space-y-2 flex-1 flex flex-col">
                                    {/* Tab navigation for agents view */}
                                    {viewMode === 'agents' && (
                                        <div className="flex items-center gap-1 border-b border-white/10 mb-2">
                                            <button
                                                onClick={() => setActiveTab('base')}
                                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-[1px] ${
                                                    activeTab === 'base'
                                                        ? 'border-brand-blue-light text-white'
                                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Bot size={14} /> Base System Prompt
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('insights')}
                                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-all -mb-[1px] ${
                                                    activeTab === 'insights'
                                                        ? 'border-orange-400 text-white'
                                                        : 'border-transparent text-slate-500 hover:text-slate-300'
                                                }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Sparkles size={14} className={activeTab === 'insights' ? 'text-orange-400' : ''} /> Insight Training
                                                    {editedInsightInstructions && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                                            Active
                                                        </span>
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {viewMode === 'library' && (
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                            <Bot size={14} /> Task Prompt Template
                                        </label>
                                    )}

                                    {/* Show info message for model-only instances */}
                                    {viewMode === 'library' && selectedLibraryItem && selectedLibraryItem.has_prompt === false ? (
                                        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black/20 rounded-xl border border-white/5 p-8">
                                            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                                                <Info size={32} className="text-slate-500" />
                                            </div>
                                            <div className="text-center max-w-md">
                                                <h3 className="text-lg font-bold text-slate-300 mb-2">No System Prompt Required</h3>
                                                <p className="text-sm text-slate-500 leading-relaxed">
                                                    This AI instance uses the selected model for <strong className="text-slate-400">embedding generation</strong> only.
                                                    It doesn't require a system prompt — just select the embedding model above.
                                                </p>
                                            </div>
                                            <div className="text-xs text-slate-600 bg-slate-800/50 px-4 py-2 rounded-lg">
                                                Used by: {selectedLibraryItem.description || 'Backend process'}
                                            </div>
                                        </div>
                                    ) : viewMode === 'agents' ? (
                                        <>
                                            {activeTab === 'base' ? (
                                                <>
                                                    <p className="text-xs text-slate-500 mb-2">
                                                        The core personality and behavior instructions for this agent.
                                                    </p>
                                                    <textarea
                                                        value={editedInstruction}
                                                        onChange={(e) => setEditedInstruction(e.target.value)}
                                                        className="w-full flex-1 bg-black/30 border border-white/10 rounded-xl p-6 text-slate-200 focus:outline-none focus:border-brand-blue-light/50 focus:ring-1 focus:ring-brand-blue-light/20 font-mono text-sm leading-relaxed resize-none custom-scrollbar min-h-[300px]"
                                                        placeholder="Enter system instruction..."
                                                        spellCheck={false}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-xs text-orange-400/80 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20 flex-1">
                                                            <strong>Insight Training Appendix:</strong> These instructions teach the agent how to identify, capture, and use insights about users. They are appended to the base prompt at runtime.
                                                        </div>
                                                        {!editedInsightInstructions && (
                                                            <button
                                                                onClick={handleInitializeInsightInstructions}
                                                                disabled={isInitializingInsights}
                                                                className="ml-3 flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                                                            >
                                                                {isInitializingInsights ? (
                                                                    <RefreshCw size={14} className="animate-spin" />
                                                                ) : (
                                                                    <Wand2 size={14} />
                                                                )}
                                                                {isInitializingInsights ? 'Loading...' : 'Load Default'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    {!editedInsightInstructions ? (
                                                        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-black/20 rounded-xl border border-orange-500/10 p-8">
                                                            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                                                                <Sparkles size={32} className="text-orange-400" />
                                                            </div>
                                                            <div className="text-center max-w-md">
                                                                <h3 className="text-lg font-bold text-slate-300 mb-2">No Insight Training Configured</h3>
                                                                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                                                                    Click <strong className="text-orange-400">"Load Default"</strong> above to load the default insight training instructions for this agent, or write your own below.
                                                                </p>
                                                            </div>
                                                            <textarea
                                                                value={editedInsightInstructions}
                                                                onChange={(e) => setEditedInsightInstructions(e.target.value)}
                                                                className="w-full bg-black/30 border border-orange-500/20 rounded-xl p-6 text-slate-200 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/20 font-mono text-sm leading-relaxed resize-none custom-scrollbar min-h-[200px]"
                                                                placeholder="Enter insight identification and usage instructions..."
                                                                spellCheck={false}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <textarea
                                                            value={editedInsightInstructions}
                                                            onChange={(e) => setEditedInsightInstructions(e.target.value)}
                                                            className="w-full flex-1 bg-black/30 border border-orange-500/20 rounded-xl p-6 text-slate-200 focus:outline-none focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/20 font-mono text-sm leading-relaxed resize-none custom-scrollbar min-h-[300px]"
                                                            placeholder="Enter insight identification and usage instructions..."
                                                            spellCheck={false}
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {selectedLibraryItem && selectedLibraryItem.input_variables && selectedLibraryItem.input_variables.length > 0 && (
                                                <div className="text-xs text-brand-blue-light bg-brand-blue-light/10 p-2 rounded-lg border border-brand-blue-light/20">
                                                    <strong>Available Variables:</strong> {selectedLibraryItem.input_variables.map(v => ` {${v}}`).join(', ')}
                                                </div>
                                            )}
                                            <textarea
                                                value={editedInstruction}
                                                onChange={(e) => setEditedInstruction(e.target.value)}
                                                className="w-full flex-1 bg-black/30 border border-white/10 rounded-xl p-6 text-slate-200 focus:outline-none focus:border-brand-blue-light/50 focus:ring-1 focus:ring-brand-blue-light/20 font-mono text-sm leading-relaxed resize-none custom-scrollbar min-h-[300px]"
                                                placeholder="Enter prompt template..."
                                                spellCheck={false}
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            Select an item to edit
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
