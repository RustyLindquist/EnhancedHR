'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Send, Sparkles, History } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Message, Tool } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CanvasHeader from '@/components/CanvasHeader';
import StructuredInputForm, { StructuredInput } from './StructuredInputForm';
import PastAssessments from './PastAssessments';
import { AssessmentRenderer } from './assessment';
import { parseAssessmentFromMessage, AssessmentData } from '@/lib/assessment-parser';

interface RoleDisruptionToolProps {
    tool: Tool;
    conversationId?: string;
    initialMessages?: Message[];
}

type TabType = 'new' | 'past';
type Phase = 'input' | 'conversation';

const RoleDisruptionTool: React.FC<RoleDisruptionToolProps> = ({
    tool,
    conversationId: initialConversationId,
    initialMessages = []
}) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('new');
    const [phase, setPhase] = useState<Phase>(initialConversationId ? 'conversation' : 'input');

    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(initialConversationId);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [structuredInput, setStructuredInput] = useState<StructuredInput | null>(null);

    // Track assessments found in messages
    const [assessments, setAssessments] = useState<Map<number, AssessmentData>>(new Map());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const justCreatedRef = useRef(false);

    const supabase = createClient();

    // Parse assessments from messages
    useEffect(() => {
        const newAssessments = new Map<number, AssessmentData>();
        messages.forEach((msg, idx) => {
            if (msg.role === 'model' && msg.content) {
                const result = parseAssessmentFromMessage(msg.content);
                if (result.hasAssessment && result.assessment) {
                    newAssessments.set(idx, result.assessment);
                }
            }
        });
        setAssessments(newAssessments);
    }, [messages]);

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
                        setPhase('conversation');
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

    const createConversation = async (title: string, roleTitle: string) => {
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
                        role_title: roleTitle,
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

    const handleStructuredInputSubmit = async (inputData: StructuredInput, formattedContext: string) => {
        setStructuredInput(inputData);
        setIsInitializing(true);
        setErrorMsg(null);

        try {
            // Create conversation
            const newConv = await createConversation(
                `${inputData.roleTitle} - ${new Date().toLocaleDateString()}`,
                inputData.roleTitle
            );

            if (newConv) {
                justCreatedRef.current = true;
                setCurrentConversationId(newConv.id);
                window.history.replaceState({}, '', `/tools/${tool.slug}?conversationId=${newConv.id}`);

                // Send the formatted context as the first message
                await handleSendMessage(formattedContext, newConv.id);
                setPhase('conversation');
            }
        } catch (error: any) {
            console.error('Failed to start assessment:', error);
            setErrorMsg(`Failed to start assessment: ${error.message || error}`);
        } finally {
            setIsInitializing(false);
        }
    };

    const handleSendMessage = async (text: string, conversationId?: string) => {
        if (!text.trim() || isLoading) return;
        setErrorMsg(null);

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const activeConvId = conversationId || currentConversationId;

            if (!activeConvId) {
                throw new Error('No active conversation');
            }

            saveMessage(activeConvId, 'user', text);

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
            saveMessage(activeConvId, 'model', fullContent);

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
        router.push('/dashboard?collection=tools');
    };

    const handleNewAssessment = () => {
        setMessages([]);
        setCurrentConversationId(undefined);
        setStructuredInput(null);
        setPhase('input');
        setActiveTab('new');
        window.history.replaceState({}, '', `/tools/${tool.slug}`);
    };

    const handleSelectConversation = (convId: string) => {
        setCurrentConversationId(convId);
        setPhase('conversation');
        setActiveTab('new');
        window.history.replaceState({}, '', `/tools/${tool.slug}?conversationId=${convId}`);
    };

    // Helper to strip assessment JSON from content for display
    const getDisplayContent = (content: string): string => {
        const result = parseAssessmentFromMessage(content);
        return result.cleanContent;
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
                    onClick={() => {
                        setActiveTab('new');
                        if (!currentConversationId) {
                            setPhase('input');
                        }
                    }}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm
                        ${activeTab === 'new'
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    <Sparkles size={16} />
                    New Assessment
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
                    Past Assessments
                </button>

                {/* New Assessment button when in conversation */}
                {phase === 'conversation' && activeTab === 'new' && (
                    <button
                        onClick={handleNewAssessment}
                        className="ml-auto px-4 py-2 text-sm text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all"
                    >
                        + Start New
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'new' ? (
                <>
                    {phase === 'input' ? (
                        /* Structured Input Form */
                        <div className="flex-1 overflow-y-auto px-10 py-8 pb-48 custom-scrollbar">
                            <div className="max-w-2xl mx-auto">
                                <div className="text-center mb-8">
                                    <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/20 mb-4">
                                        <Sparkles className="text-teal-400" size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        Role Disruption Assessment
                                    </h2>
                                    <p className="text-slate-400 max-w-md mx-auto">
                                        Analyze how AI and automation will impact any role. Start by telling us about the position you want to assess.
                                    </p>
                                </div>

                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <StructuredInputForm
                                        onSubmit={handleStructuredInputSubmit}
                                        isLoading={isInitializing}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Conversation View */
                        <>
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto px-10 py-8 pb-48 custom-scrollbar"
                            >
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {messages.map((msg, idx) => {
                                        const assessment = assessments.get(idx);
                                        const displayContent = msg.role === 'model' && msg.content
                                            ? getDisplayContent(msg.content)
                                            : msg.content;

                                        return (
                                            <div key={idx}>
                                                {/* Message bubble */}
                                                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div
                                                        className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                                                            msg.role === 'user'
                                                                ? 'bg-[#0D9488] text-white'
                                                                : 'bg-white/5 border border-white/10 text-slate-200 backdrop-blur-sm'
                                                        }`}
                                                    >
                                                        {msg.role === 'model' ? (
                                                            <MarkdownRenderer content={displayContent || ''} />
                                                        ) : (
                                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Assessment visualization (after model message) */}
                                                {assessment && (
                                                    <div className="mt-6">
                                                        <AssessmentRenderer assessment={assessment} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {isLoading && messages[messages.length - 1]?.content === '' && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-sm">
                                                <div className="flex items-center gap-2 text-teal-400">
                                                    <Loader2 className="animate-spin" size={16} />
                                                    <span className="text-sm">Analyzing role...</span>
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
                                                placeholder="Ask follow-up questions or request more details..."
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
                    )}
                </>
            ) : (
                /* Past Assessments Tab */
                <div className="flex-1 overflow-y-auto px-10 py-8 pb-48 custom-scrollbar">
                    <PastAssessments
                        toolSlug={tool.slug}
                        onSelectConversation={handleSelectConversation}
                    />
                </div>
            )}
        </div>
    );
};

export default RoleDisruptionTool;
