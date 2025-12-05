'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, Filter, MessageSquare, User, Bot, Calendar, ChevronRight, X, Layout } from 'lucide-react';
import { format } from 'date-fns';

interface AILog {
    id: string;
    user_id: string;
    conversation_id: string | null;
    agent_type: string;
    page_context: string | null;
    prompt: string;
    response: string;
    created_at: string;
    metadata: any;
    user?: {
        full_name: string;
        avatar_url: string;
        email: string;
    };
}

export default function AdminAILogsPage() {
    const [logs, setLogs] = useState<AILog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLog, setSelectedLog] = useState<AILog | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'conversation'>('list');
    const [conversationLogs, setConversationLogs] = useState<AILog[]>([]);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            // Fetch logs with user details
            // Note: We need to join with profiles. Since Supabase client doesn't support deep joins easily without foreign keys set up perfectly for this view,
            // we might need to fetch profiles separately or rely on the view.
            // Let's try a direct join if the foreign key exists.

            const { data, error } = await supabase
                .from('ai_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

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

    return (
        <div className="flex h-full bg-transparent text-white">
            {/* Main List Area */}
            <div className={`flex-1 flex flex-col min-w-0 ${selectedLog ? 'hidden md:flex md:w-1/2 lg:w-2/5 border-r border-white/10' : 'w-full'}`}>

                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-[#0f172a]/50 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-light tracking-wide">AI Conversation Logs</h1>
                        <button onClick={fetchLogs} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <Layout size={20} className="text-slate-400" />
                        </button>
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

                                <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-wider">
                                    <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                        <Bot size={10} /> {log.agent_type}
                                    </span>
                                    {log.page_context && (
                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                            <Layout size={10} /> {log.page_context}
                                        </span>
                                    )}
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
        </div>
    );
}
