'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, Filter, MessageSquare, User, Bot, Calendar, ChevronRight, X, Layout, TrendingUp, TrendingDown, DollarSign, Zap, Clock, Hash, Sparkles, Send, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { getUsageOverview, getCostByAgent, getAgentTypes, getAnalyticsContextString, type UsageOverview, type AgentCostSummary } from '@/app/actions/cost-analytics';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface AILog {
    id: string;
    user_id: string;
    conversation_id: string | null;
    agent_type: string;
    page_context: string | null;
    prompt: string;
    response: string;
    created_at: string;
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    cost_usd?: number;
    model_id?: string;
    metadata: any;
    user?: {
        full_name: string;
        avatar_url: string;
        email: string;
    };
}

// Agent type display configuration
const AGENT_LABELS: Record<string, { label: string; color: string }> = {
    platform_assistant: { label: 'Platform', color: 'from-blue-500 to-blue-600' },
    course_assistant: { label: 'Course Assistant', color: 'from-emerald-500 to-emerald-600' },
    course_tutor: { label: 'Course Tutor', color: 'from-purple-500 to-purple-600' },
    collection_assistant: { label: 'Collection', color: 'from-amber-500 to-amber-600' },
};

// Agent types to exclude from filter buttons (backend-only agents)
const HIDDEN_AGENT_TYPES = ['recommendations', 'title_generation', 'embeddings', 'insight_extraction'];

export default function AdminAILogsPage() {
    const [logs, setLogs] = useState<AILog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'conversation'>('list');
    const [conversationLogs, setConversationLogs] = useState<AILog[]>([]);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);

    // Analytics state
    const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
    const [agentTypes, setAgentTypes] = useState<string[]>([]);
    const [usageOverview, setUsageOverview] = useState<UsageOverview | null>(null);
    const [agentCosts, setAgentCosts] = useState<AgentCostSummary[]>([]);
    const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);

    // AI Analytics Panel state
    const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(false);
    const [analyticsMessages, setAnalyticsMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
    const [analyticsInput, setAnalyticsInput] = useState('');
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const analyticsMessagesEndRef = useRef<HTMLDivElement>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
        fetchAnalytics();
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [selectedAgentFilter]);

    const fetchAnalytics = async () => {
        setIsLoadingAnalytics(true);
        try {
            const [overview, agents, types] = await Promise.all([
                getUsageOverview(7),
                getCostByAgent(30),
                getAgentTypes()
            ]);
            setUsageOverview(overview);
            setAgentCosts(agents);
            setAgentTypes(types);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoadingAnalytics(false);
        }
    };

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            // Build query with optional agent filter
            let query = supabase
                .from('ai_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            // Apply agent filter if not 'all'
            if (selectedAgentFilter && selectedAgentFilter !== 'all') {
                query = query.eq('agent_type', selectedAgentFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Fetch profiles for names/avatars (since auth.users isn't public.profiles)
            // Actually, let's fetch profiles.
            const userIds = Array.from(new Set(data.map(log => log.user_id)));
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const enrichedLogs = data.map(log => ({
                ...log,
                user: {
                    ...log.user, // email from auth (if we could join auth, but we can't usually from client)
                    // Wait, we can't join auth.users from client usually.
                    // We should rely on profiles.
                    full_name: profileMap.get(log.user_id)?.full_name || 'Unknown User',
                    avatar_url: profileMap.get(log.user_id)?.avatar_url || '',
                    email: 'N/A' // Can't get email easily from client unless in profiles
                }
            }));

            setLogs(enrichedLogs);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConversation = async (conversationId: string) => {
        setIsLoadingConversation(true);
        try {
            const { data, error } = await supabase
                .from('ai_logs')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setConversationLogs(data);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        } finally {
            setIsLoadingConversation(false);
        }
    };

    const handleLogClick = async (log: AILog) => {
        setSelectedLog(log);
        if (log.conversation_id) {
            await fetchConversation(log.conversation_id);
        } else {
            setConversationLogs([log]);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.response?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.agent_type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Scroll to bottom of analytics messages
    useEffect(() => {
        analyticsMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [analyticsMessages, isAnalyticsLoading]);

    // Send message to analytics assistant
    const sendAnalyticsMessage = async (text: string) => {
        if (!text.trim() || isAnalyticsLoading) return;

        const userMsg = { role: 'user' as const, content: text };
        setAnalyticsMessages(prev => [...prev, userMsg]);
        setAnalyticsInput('');
        setIsAnalyticsLoading(true);

        try {
            // Get analytics context
            const analyticsContext = await getAnalyticsContextString(30);

            // Build history
            const history = analyticsMessages.map(m => ({ role: m.role, parts: m.content }));

            // Add placeholder for streaming
            setAnalyticsMessages(prev => [...prev, { role: 'model', content: '' }]);

            // Call streaming API with analytics_assistant agent
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `${text}\n\n---\nANALYTICS DATA:\n${analyticsContext}`,
                    agentType: 'analytics_assistant',
                    contextScope: { type: 'PLATFORM' },
                    history,
                    pageContext: 'admin_ai_logs'
                })
            });

            if (!response.ok) {
                throw new Error(`Streaming failed: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    fullText += chunk;

                    // Update the last message with accumulated text
                    // Strip any insight metadata tags
                    const cleanText = fullText.replace(/<!--__INSIGHT_META__:[\s\S]*?:__END_META__-->/, '');
                    setAnalyticsMessages(prev => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                            updated[updated.length - 1] = { role: 'model', content: cleanText };
                        }
                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error('Analytics assistant error:', error);
            setAnalyticsMessages(prev => {
                const updated = prev.filter(m => m.content !== '');
                return [...updated, { role: 'model', content: 'Sorry, I encountered an error analyzing the data. Please try again.' }];
            });
        } finally {
            setIsAnalyticsLoading(false);
        }
    };

    // Suggested prompts for analytics
    const suggestedPrompts = [
        "What topics are users asking about most?",
        "Which agent is most cost-effective?",
        "What content gaps do you see?",
        "Suggest L&D priorities based on queries"
    ];

    return (
        <div className="flex h-full bg-transparent text-white">
            {/* Main List Area */}
            <div className={`flex-1 flex flex-col min-w-0 ${selectedLog ? 'hidden md:flex md:w-1/2 lg:w-2/5 border-r border-white/10' : 'w-full'}`}>

                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-[#0f172a]/50 backdrop-blur-xl sticky top-0 z-10 space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-light tracking-wide">AI Conversation Logs</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsAnalyticsPanelOpen(!isAnalyticsPanelOpen)}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                                    isAnalyticsPanelOpen
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                }`}
                            >
                                <Sparkles size={14} />
                                AI Analytics
                            </button>
                            <button onClick={() => { fetchLogs(); fetchAnalytics(); }} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <Layout size={20} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Usage Analytics Dashboard */}
                    <div className="grid grid-cols-4 gap-3">
                        {/* Requests Card */}
                        <div className="bg-[#1e293b]/50 border border-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Requests (7d)</span>
                                <Hash size={12} className="text-slate-500" />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-white">
                                    {isLoadingAnalytics ? '...' : usageOverview?.totalRequests.toLocaleString() || '0'}
                                </span>
                                {!isLoadingAnalytics && usageOverview && usageOverview.requestsChange !== 0 && (
                                    <span className={`text-[10px] flex items-center gap-0.5 ${usageOverview.requestsChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {usageOverview.requestsChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {Math.abs(usageOverview.requestsChange).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Cost Card */}
                        <div className="bg-[#1e293b]/50 border border-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Cost (7d)</span>
                                <DollarSign size={12} className="text-slate-500" />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-white">
                                    ${isLoadingAnalytics ? '...' : usageOverview?.totalCost.toFixed(2) || '0.00'}
                                </span>
                                {!isLoadingAnalytics && usageOverview && usageOverview.costChange !== 0 && (
                                    <span className={`text-[10px] flex items-center gap-0.5 ${usageOverview.costChange < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {usageOverview.costChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {Math.abs(usageOverview.costChange).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Tokens Card */}
                        <div className="bg-[#1e293b]/50 border border-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Tokens (7d)</span>
                                <Zap size={12} className="text-slate-500" />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-white">
                                    {isLoadingAnalytics ? '...' : (usageOverview?.totalTokens ? (usageOverview.totalTokens / 1000).toFixed(0) + 'K' : '0')}
                                </span>
                                {!isLoadingAnalytics && usageOverview && usageOverview.tokensChange !== 0 && (
                                    <span className={`text-[10px] flex items-center gap-0.5 ${usageOverview.tokensChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {usageOverview.tokensChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {Math.abs(usageOverview.tokensChange).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Avg Conversation Length Card */}
                        <div className="bg-[#1e293b]/50 border border-white/5 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Length</span>
                                <Clock size={12} className="text-slate-500" />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-xl font-bold text-white">
                                    {isLoadingAnalytics ? '...' : usageOverview?.avgConversationLength.toFixed(1) || '0'}
                                </span>
                                <span className="text-[10px] text-slate-500">msgs</span>
                            </div>
                        </div>
                    </div>

                    {/* Agent Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedAgentFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedAgentFilter === 'all'
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            All Agents
                        </button>
                        {agentTypes
                            .filter(agent => !HIDDEN_AGENT_TYPES.includes(agent))
                            .map((agent) => {
                                const config = AGENT_LABELS[agent] || { label: agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), color: 'from-slate-500 to-slate-600' };
                                return (
                                    <button
                                        key={agent}
                                        onClick={() => setSelectedAgentFilter(agent)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            selectedAgentFilter === agent
                                                ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                                                : 'bg-white/5 text-slate-400 border border-transparent hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {config.label}
                                    </button>
                                );
                            })}
                    </div>

                    {/* Search */}
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue to-brand-orange opacity-20 group-focus-within:opacity-100 blur transition-opacity duration-500 rounded-lg"></div>
                        <div className="relative bg-[#0A0D12] rounded-lg flex items-center px-4 py-3 border border-white/10">
                            <Search size={18} className="text-slate-500 mr-3" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search prompts, responses, users..."
                                className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-600 w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 size={30} className="animate-spin text-brand-blue-light" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">No logs found</div>
                    ) : (
                        filteredLogs.map(log => (
                            <div
                                key={log.id}
                                onClick={() => handleLogClick(log)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                                    ${selectedLog?.id === log.id
                                        ? 'bg-brand-blue-light/10 border-brand-blue-light/50 shadow-[0_0_15px_rgba(120,192,240,0.1)]'
                                        : 'bg-[#1e293b]/50 border-white/5 hover:bg-[#1e293b] hover:border-white/10'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-[10px] font-bold">
                                            {log.user?.full_name.charAt(0)}
                                        </div>
                                        <span className="text-xs font-bold text-slate-300">{log.user?.full_name}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {format(new Date(log.created_at), 'MMM d, HH:mm')}
                                    </span>
                                </div>

                                <div className="mb-2">
                                    <p className="text-sm text-white line-clamp-2 font-medium">{log.prompt}</p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                            <Bot size={10} /> {AGENT_LABELS[log.agent_type]?.label || log.agent_type}
                                        </span>
                                        {log.page_context && (
                                            <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                                <Layout size={10} /> {log.page_context}
                                            </span>
                                        )}
                                    </div>
                                    {/* Token & Cost Info */}
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                        {log.total_tokens != null && log.total_tokens > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Zap size={10} /> {log.total_tokens.toLocaleString()}
                                            </span>
                                        )}
                                        {log.cost_usd != null && log.cost_usd > 0 && (
                                            <span className="flex items-center gap-1 text-emerald-400/80">
                                                <DollarSign size={10} /> {log.cost_usd.toFixed(4)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail View (Right Panel) */}
            {selectedLog && (
                <div className="flex-1 flex flex-col bg-[#0A0D12] border-l border-white/10 absolute inset-0 md:relative z-20 md:z-0">
                    {/* Detail Header */}
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0A0D12]/95 backdrop-blur-xl">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <MessageSquare size={18} className="text-brand-blue-light" />
                                Conversation Detail
                            </h2>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                ID: <span className="font-mono text-slate-400">{selectedLog.conversation_id || selectedLog.id}</span>
                            </p>
                        </div>
                        <button
                            onClick={() => setSelectedLog(null)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Conversation Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {isLoadingConversation ? (
                            <div className="flex justify-center py-10">
                                <Loader2 size={30} className="animate-spin text-brand-blue-light" />
                            </div>
                        ) : (
                            conversationLogs.map((msg, idx) => (
                                <div key={msg.id} className="space-y-4 animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>

                                    {/* User Message */}
                                    <div className="flex justify-end">
                                        <div className="max-w-[85%]">
                                            <div className="flex items-center justify-end gap-2 mb-1">
                                                <span className="text-[10px] text-slate-500">{format(new Date(msg.created_at), 'HH:mm:ss')}</span>
                                                <span className="text-xs font-bold text-brand-blue-light">User</span>
                                            </div>
                                            <div className="bg-brand-blue-light/10 border border-brand-blue-light/20 text-white p-4 rounded-2xl rounded-tr-none">
                                                {msg.prompt}
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Response */}
                                    <div className="flex justify-start">
                                        <div className="max-w-[85%]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-brand-orange">AI ({msg.agent_type})</span>
                                                <span className="text-[10px] text-slate-500">{format(new Date(msg.created_at), 'HH:mm:ss')}</span>
                                            </div>
                                            <div className="bg-[#1e293b] border border-white/10 text-slate-200 p-4 rounded-2xl rounded-tl-none whitespace-pre-wrap">
                                                {msg.response}
                                            </div>
                                            {/* Metadata / Context */}
                                            {msg.metadata?.sources?.length > 0 && (
                                                <div className="mt-2 ml-2">
                                                    <details className="text-xs text-slate-500 cursor-pointer group">
                                                        <summary className="hover:text-brand-blue-light transition-colors list-none flex items-center gap-1">
                                                            <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                                                            Used {msg.metadata.sources.length} Context Sources
                                                        </summary>
                                                        <div className="mt-2 pl-4 border-l border-white/10 space-y-1">
                                                            {msg.metadata.sources.map((source: any, i: number) => (
                                                                <div key={i} className="truncate">
                                                                    [{source.type}] {source.content?.substring(0, 50)}...
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider if not last */}
                                    {idx < conversationLogs.length - 1 && (
                                        <div className="flex items-center justify-center my-4">
                                            <div className="h-px bg-white/5 w-full max-w-[200px]"></div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* AI Analytics Panel (Right Side) */}
            <div
                className={`
                    fixed right-0 top-0 h-full z-50
                    bg-[#0A0D12] border-l border-white/10
                    flex flex-col
                    transition-all duration-300 ease-in-out
                    ${isAnalyticsPanelOpen ? 'w-96 translate-x-0' : 'w-0 translate-x-full'}
                `}
            >
                {isAnalyticsPanelOpen && (
                    <>
                        {/* Panel Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-purple-600/10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                    <Sparkles size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-white">AI Analytics</h2>
                                    <p className="text-[10px] text-slate-500">Ask about patterns & trends</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAnalyticsPanelOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X size={16} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {analyticsMessages.length === 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                                            <Sparkles size={14} className="text-purple-400" />
                                        </div>
                                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl rounded-tl-none text-sm text-slate-300">
                                            <p>I can analyze your AI conversation data to identify patterns, trends, and opportunities.</p>
                                            <p className="mt-2 text-slate-500 text-xs">Try asking me about topics, costs, or content gaps.</p>
                                        </div>
                                    </div>

                                    {/* Suggested Prompts */}
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Suggested Questions</p>
                                        {suggestedPrompts.map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => sendAnalyticsMessage(prompt)}
                                                className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-lg text-sm text-slate-300 hover:text-white transition-all"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {analyticsMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[90%] p-3 rounded-xl text-sm ${
                                                msg.role === 'user'
                                                    ? 'bg-purple-500/20 border border-purple-500/30 text-white rounded-tr-none'
                                                    : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                                            }`}>
                                                {msg.role === 'user' ? (
                                                    <div>{msg.content}</div>
                                                ) : (
                                                    <MarkdownRenderer content={msg.content} className="text-sm" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isAnalyticsLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 border border-white/10 p-3 rounded-xl rounded-tl-none flex items-center gap-2 text-slate-400 text-sm">
                                                <Loader2 size={14} className="animate-spin" />
                                                Analyzing...
                                            </div>
                                        </div>
                                    )}
                                    <div ref={analyticsMessagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-white/10 bg-black/20">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={analyticsInput}
                                    onChange={(e) => setAnalyticsInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendAnalyticsMessage(analyticsInput)}
                                    placeholder="Ask about patterns..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
                                />
                                <button
                                    onClick={() => sendAnalyticsMessage(analyticsInput)}
                                    disabled={isAnalyticsLoading || !analyticsInput.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={14} />
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-600 text-center mt-2">AI analyzes aggregated data only</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
