'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Drama, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Message, Tool } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CanvasHeader from '@/components/CanvasHeader';
import PracticeHistory from './PracticeHistory';

interface RoleplayDojoToolProps {
    tool: Tool;
    conversationId?: string;
    initialMessages?: Message[];
}

type TabType = 'new' | 'past';

const RoleplayDojoTool: React.FC<RoleplayDojoToolProps> = ({
    tool,
    conversationId: initialConversationId,
    initialMessages = []
}) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('new');
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(initialConversationId);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const justCreatedRef = useRef(false);

    const supabase = createClient();

    // Fetch messages if we have a conversation ID
    useEffect(() => {
        const fetchMessages = async () => {
            if (justCreatedRef.current) {
                justCreatedRef.current = false;
                return;
            }

            if (currentConversationId) {
                try {
                    if (messages.length === 0) setIsLoading(true);

                    const { data, error } = await supabase
                        .from('conversation_messages')
                        .select('*')
                        .eq('conversation_id', currentConversationId)
                        .order('created_at', { ascending: true });

                    if (error) throw error;

                    if (data && data.length > 0) {
                        const loadedMessages: Message[] = data.map((msg: any) => ({
                            id: msg.id,
                            role: msg.role,
                            content: msg.content,
                            created_at: msg.created_at
                        }));
                        setMessages(loadedMessages);
                    }
                } catch (error) {
                    console.error('Failed to load conversation messages:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        if (currentConversationId) {
            fetchMessages();
        }
    }, [currentConversationId]);

    // Scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const saveMessage = async (convId: string, role: 'user' | 'model', content: string) => {
        try {
            const { error } = await supabase
                .from('conversation_messages')
                .insert({
                    conversation_id: convId,
                    role,
                    content
                });

            if (error) throw error;
        } catch (error) {
            console.error('Failed to save message', error);
        }
    };

    const createConversation = async (title: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    user_id: user.id,
                    title,
                    is_saved: false,
                    metadata: {
                        tool_id: tool.id,
                        tool_slug: tool.slug,
                        tool_title: tool.title,
                        agent_type: tool.agent_type,
                        is_tool_conversation: true,
                        contextScope: { type: 'TOOL', id: tool.slug }
                    }
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to create conversation', error);
            throw error;
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;
        setErrorMsg(null);

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            let activeConvId = currentConversationId;
            if (!activeConvId) {
                try {
                    const newConv = await createConversation(`${tool.title} - ${new Date().toLocaleDateString()}`);
                    if (newConv) {
                        activeConvId = newConv.id;
                        justCreatedRef.current = true;
                        setCurrentConversationId(activeConvId);
                        window.history.replaceState({}, '', `/tools/${tool.slug}?conversationId=${activeConvId}`);
                    }
                } catch (convError: any) {
                    console.error("Failed to create conversation:", convError);
                    setErrorMsg(`Failed to create conversation: ${convError.message || convError}`);
                    throw convError;
                }
            }

            if (activeConvId) {
                saveMessage(activeConvId, 'user', text);
            }

            const history = messages.map(m => ({ role: m.role, parts: m.content }));

            // Create placeholder message for streaming
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            // Use streaming API with tool's agent type
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history,
                    agentType: tool.agent_type,
                    contextScope: { type: 'TOOL', id: tool.slug }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                fullContent += parsed.content;
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    newMsgs[newMsgs.length - 1] = { role: 'model', content: fullContent };
                                    return newMsgs;
                                });
                            }
                        } catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            // Save final AI response
            if (activeConvId) {
                saveMessage(activeConvId, 'model', fullContent);
            }

        } catch (error: any) {
            console.error('Error sending message:', error);
            setErrorMsg(error.message || 'Failed to get response');
            // Remove the placeholder message
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(input);
        }
    };

    const handleBack = () => {
        router.push('/');
    };

    const handleNewSession = () => {
        setMessages([]);
        setCurrentConversationId(undefined);
        setActiveTab('new');
        window.history.replaceState({}, '', `/tools/${tool.slug}`);
    };

    const handleSelectConversation = (convId: string) => {
        setCurrentConversationId(convId);
        setActiveTab('new');
        window.history.replaceState({}, '', `/tools/${tool.slug}?conversationId=${convId}`);
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Canvas Header */}
            <CanvasHeader
                context="TOOL"
                title={tool.title}
                onBack={handleBack}
                backLabel="Back to Tools"
            />

            {/* Tab Navigation */}
            <div className="flex items-center gap-3 px-10 py-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('new')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm
                        ${activeTab === 'new'
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    <Drama size={16} />
                    New Session
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm
                        ${activeTab === 'past'
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    <History size={16} />
                    Practice History
                </button>

                {/* New Session button when in conversation */}
                {messages.length > 0 && activeTab === 'new' && (
                    <button
                        onClick={handleNewSession}
                        className="ml-auto px-4 py-2 text-sm text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all"
                    >
                        + Start New
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'new' ? (
                <>
                    {/* Messages Container */}
                    <div
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto px-10 py-8 pb-48 custom-scrollbar"
                    >
                        <div className="max-w-4xl mx-auto space-y-6">
                            {messages.length === 0 && !isLoading ? (
                                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20 mb-6">
                                        <Drama className="text-teal-400" size={48} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        Welcome to Roleplay Dojo
                                    </h2>
                                    <p className="text-slate-400 max-w-md mb-8">
                                        Practice difficult workplace conversations in a safe environment.
                                        Master terminations, performance discussions, conflict resolution, and more.
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Type a message below to start your practice session
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                                                msg.role === 'user'
                                                    ? 'bg-[#0D9488] text-white'
                                                    : 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-sm'
                                            }`}
                                        >
                                            {msg.role === 'model' ? (
                                                <MarkdownRenderer content={msg.content || ''} />
                                            ) : (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}

                            {isLoading && messages[messages.length - 1]?.content === '' && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
                                        <div className="flex items-center gap-2 text-teal-400">
                                            <Loader2 className="animate-spin" size={16} />
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {errorMsg && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm backdrop-blur-sm">
                                    {errorMsg}
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="absolute bottom-32 left-0 right-0 px-10 z-[70]">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-end gap-3 p-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10">
                                <div className="flex-1 relative">
                                    <textarea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder={messages.length === 0
                                            ? "What conversation would you like to practice today?"
                                            : "Continue the conversation..."
                                        }
                                        rows={1}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
                                        style={{
                                            minHeight: '48px',
                                            maxHeight: '150px'
                                        }}
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    onClick={() => handleSendMessage(input)}
                                    disabled={!input.trim() || isLoading}
                                    className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                                        input.trim() && !isLoading
                                            ? 'bg-[#0D9488] text-white hover:bg-[#0D9488]/80'
                                            : 'bg-white/5 text-slate-500 cursor-not-allowed'
                                    }`}
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <Send size={20} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* Practice History Tab */
                <div className="flex-1 overflow-y-auto px-10 py-8 pb-48 custom-scrollbar">
                    <PracticeHistory
                        toolSlug={tool.slug}
                        onSelectConversation={handleSelectConversation}
                    />
                </div>
            )}
        </div>
    );
};

export default RoleplayDojoTool;
