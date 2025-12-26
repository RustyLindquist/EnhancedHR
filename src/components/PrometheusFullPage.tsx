import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Loader2, Sparkles, MessageSquare, Flame, ArrowRight, ChevronUp, ChevronDown, Zap, Shield, Brain, Lightbulb, Compass, Send } from 'lucide-react';
import { getAgentResponse } from '@/lib/ai/engine';
import { createClient } from '@/lib/supabase/client';
import { AgentType, ContextScope } from '@/lib/ai/types';
import { HERO_PROMPTS, SUGGESTION_PANEL_PROMPTS, PromptSuggestion } from '@/lib/prompts';
import { Message } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { parseStreamResponse, stripInsightTags, StreamInsightMetadata } from '@/lib/ai/insight-stream-parser';
import { AIResponseFooter } from '@/components/ai';

interface PrometheusFullPageProps {
    initialPrompt?: string;
    onSetAIPrompt?: (prompt: string) => void;
    onTitleChange?: (title: string) => void;
    onConversationStart?: (conversationId: string, title: string, messages: Message[]) => void;
    initialMessages?: Message[];
    conversationId?: string;
    initialTitle?: string;
    onSaveConversation?: () => void;
    isSaved?: boolean;
    onPromptConsumed?: () => void;
    onOpenDrawer?: () => void;
}

// Enhanced Capability Card Data
interface CapabilityCardData {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    prompt: string;
    color: string;
}

const CAPABILITY_CARDS: CapabilityCardData[] = [
    {
        id: 'cap-1',
        icon: MessageSquare,
        title: 'Difficult Conversations',
        description: 'Role-play and prepare for challenging discussions with employees.',
        prompt: 'I need to have a difficult conversation with an employee who is underperforming. Can you role-play this with me? You act as the employee (defensive but open to feedback), and I will be the manager. Start by asking me for the context of the situation.',
        color: 'text-blue-400'
    },
    {
        id: 'cap-2',
        icon: Shield,
        title: 'Policy & Compliance',
        description: 'Draft clear, empathetic policies and ensure compliance.',
        prompt: 'I need to draft an email announcing a new "Return to Office" policy (3 days a week). The tone should be empathetic but firm, emphasizing collaboration while acknowledging the shift. Please draft 3 variations: one direct, one softer, and one focusing purely on the benefits.',
        color: 'text-emerald-400'
    },
    {
        id: 'cap-3',
        icon: Brain,
        title: 'Strategic Analysis',
        description: 'Analyze leadership styles and organizational trends.',
        prompt: 'I want to analyze my leadership style based on a recent situation. I will describe a scenario and how I handled it, and I want you to critique it using the Situational Leadership II framework. Ready?',
        color: 'text-purple-400'
    },
    {
        id: 'cap-4',
        icon: Lightbulb,
        title: 'Creative Solutions',
        description: 'Brainstorm wellness initiatives and team building ideas.',
        prompt: 'I want to launch a wellness initiative for a remote-first team. It needs to be low-cost but high-impact. Give me 5 creative ideas that go beyond just "yoga classes".',
        color: 'text-amber-400'
    }
];

// Helper to clean AI response for display - uses imported stripInsightTags
const cleanMessageContent = (content: string): string => {
    // First parse to extract any metadata at end of stream
    const parsed = parseStreamResponse(content);
    return parsed.content;
};

const PrometheusFullPage: React.FC<PrometheusFullPageProps> = ({
    initialPrompt,
    onSetAIPrompt,
    onTitleChange,
    onConversationStart,
    initialMessages,
    conversationId,
    initialTitle,
    onSaveConversation,
    isSaved = false,
    onPromptConsumed,
    onOpenDrawer
}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages || []);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastProcessedPromptRef = useRef<string | undefined>(undefined);
    const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);

    // Insight metadata from the last AI response
    const [insightMetadata, setInsightMetadata] = useState<StreamInsightMetadata | null>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Default to Platform Assistant for the full page view
    const agentType: AgentType = 'platform_assistant';
    const contextScope: ContextScope = { type: 'PLATFORM' };

    // Ref to track if we just created the conversation to avoid race condition/overwriting state
    const justCreatedRef = useRef(false);

    // Handle Initial Prompt
    useEffect(() => {
        if (initialPrompt && initialPrompt !== lastProcessedPromptRef.current) {
            lastProcessedPromptRef.current = initialPrompt;
            handleSendMessage(initialPrompt);
            if (onPromptConsumed) onPromptConsumed();
        }
    }, [initialPrompt, onPromptConsumed]);

    // Sync state with props when they change (e.g. switching conversations)
    useEffect(() => {
        // ROBUST FIX: If we are already in this conversation and have local messages,
        // we likely have 'fresher' state (e.g. streaming content) than the props being passed down.
        // We should ONLY sync from props if we are switching to a DIFFERENT conversation,
        // or if our local state is empty.
        if (conversationId === currentConversationId && messages.length > 0) {
            return;
        }

        if (initialMessages) {
            setMessages(initialMessages);
        } else if (conversationId !== currentConversationId) {
            // If we switched conversations (or started a new one where ID is undefined)
            // and we have no initial messages, we MUST clear the state.
            setMessages([]);
        }
    }, [initialMessages, conversationId, currentConversationId, messages.length]);

    useEffect(() => {
        setCurrentConversationId(conversationId);
    }, [conversationId]);

    // Fetch messages always if we have a conversation ID (ensure freshness / persistence fix)
    useEffect(() => {
        const fetchMessages = async () => {
            // If we just created the conversation locally, we have the latest state in memory.
            // Fetching from DB now might return empty/incomplete data due to async writing.
            // So we skip the fetch once.
            if (justCreatedRef.current) {
                justCreatedRef.current = false;
                return;
            }

            if (conversationId) {
                try {
                    // Only show loader if we don't have messages yet
                    if (messages.length === 0) setIsLoading(true);

                    const { data, error } = await supabase
                        .from('conversation_messages')
                        .select('*')
                        .eq('conversation_id', conversationId)
                        .order('created_at', { ascending: true });

                    if (error) throw error;

                    if (data && data.length > 0) {
                        const loadedMessages: Message[] = data.map((msg: any) => ({
                            role: msg.role,
                            content: msg.content
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

        if (conversationId) {
            fetchMessages();
        }
    }, [conversationId]); // Removed initialMessages dependency to rely on DB fetch for established convos

    // Scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const supabase = createClient();

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

    const updateConversationTitle = async (convId: string, title: string) => {
        try {
            const { error } = await supabase
                .from('conversations')
                .update({ title })
                .eq('id', convId);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to update title', error);
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
                    is_saved: false // Default to false so it doesn't show as 'Saved to Collection' immediately
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

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;
        setErrorMsg(null);

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setIsPromptPanelOpen(false);

        try {
            // Ensure we have a conversation ID
            let activeConvId = currentConversationId;
            if (!activeConvId) {
                // Create new conversation on first message
                try {
                    const newConv = await createConversation('New Conversation');
                    if (newConv) {
                        activeConvId = newConv.id;
                        justCreatedRef.current = true; // Mark as just created to skip next fetch
                        setCurrentConversationId(activeConvId);
                        if (onConversationStart && activeConvId) {
                            onConversationStart(activeConvId, 'New Conversation', [userMsg]);
                        }
                    }
                } catch (convError: any) {
                    console.error("Failed to create conversation:", convError);
                    const realError = convError.message || convError;
                    setErrorMsg(`Failed to create conversation: ${realError}`);
                    throw new Error(`Could not start a new conversation: ${realError}`);
                }
            }

            if (activeConvId) {
                saveMessage(activeConvId, 'user', text);
            }

            const history = messages.map(m => ({ role: m.role, parts: m.content }));

            // Create placeholder message for streaming
            setMessages(prev => [...prev, { role: 'model', content: '' }]);

            // Use streaming API
            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    agentType,
                    contextScope,
                    history,
                    conversationId: activeConvId,
                    pageContext: 'prometheus_full_page'
                })
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('[PrometheusFullPage] API Error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorBody
                });
                throw new Error(errorBody.error || 'Streaming failed');
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

                    // Update the last message with accumulated text (cleaned for display)
                    setMessages(prev => {
                        const updated = [...prev];
                        if (updated.length > 0) {
                            // Display cleaned content while streaming
                            const displayContent = stripInsightTags(fullText);
                            updated[updated.length - 1] = { role: 'model', content: displayContent };
                        }
                        return updated;
                    });
                }
            }

            // Parse the complete response to extract insight metadata
            const parsedResponse = parseStreamResponse(fullText);

            // Update the final message with fully parsed content
            setMessages(prev => {
                const updated = [...prev];
                if (updated.length > 0) {
                    updated[updated.length - 1] = { role: 'model', content: parsedResponse.content };
                }
                return updated;
            });

            // Set insight metadata if present
            if (parsedResponse.metadata) {
                setInsightMetadata(parsedResponse.metadata);
            } else {
                setInsightMetadata(null);
            }

            // Save the complete message (raw content for potential re-processing)
            if (activeConvId && parsedResponse.rawContent) {
                saveMessage(activeConvId, 'model', parsedResponse.rawContent);
            }

            // Build the updated message array for title generation
            const aiMsg: Message = { role: 'model', content: fullText };
            const updatedMessages = [...messages, userMsg, aiMsg];

            // Generate title logic...
            if (messages.length === 0 && onTitleChange && fullText) {
                try {
                    // Use non-streaming for title generation (simpler)
                    const titleResponse = await getAgentResponse(agentType,
                        `Based on this conversation where the user asked: "${text}" and you responded with: "${fullText.substring(0, 200)}...", generate a very concise title (maximum 5 words) that captures the main topic or intent. Respond with ONLY the title, no quotes or extra text.`,
                        contextScope, [], activeConvId, 'prometheus_full_page_title_gen');
                    const generatedTitle = titleResponse.text.trim().replace(/^["']|["']$/g, '');

                    onTitleChange(generatedTitle);

                    if (activeConvId) {
                        updateConversationTitle(activeConvId, generatedTitle);
                        if (onConversationStart) {
                            onConversationStart(activeConvId, generatedTitle, updatedMessages);
                        }
                    }
                } catch (titleError) {
                    console.error('Error generating title:', titleError);
                    // Fallback
                    const fallbackTitle = text.split(' ').slice(0, 4).join(' ') + '...';
                    onTitleChange(fallbackTitle);
                    if (activeConvId) {
                        updateConversationTitle(activeConvId, fallbackTitle);
                        if (onConversationStart) {
                            onConversationStart(activeConvId, fallbackTitle, updatedMessages);
                        }
                    }
                }
            } else if (activeConvId && onConversationStart) {
                onConversationStart(activeConvId, '', updatedMessages);
            }
        } catch (error: any) {
            console.error('Error getting AI response:', error);
            setMessages(prev => {
                // Remove empty placeholder and add error message
                const updated = prev.filter(m => m.content !== '');
                return [...updated, { role: 'model', content: `I'm having trouble connecting to my knowledge base right now. Error: ${error.message || error}` }];
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handlePromptClick = (prompt: string) => {
        handleSendMessage(prompt);
    };

    const isChatStarted = messages.length > 0;

    return (
        <div className="flex flex-col h-full w-full relative overflow-hidden bg-transparent">

            {/* --- Dynamic Background Removed to show Platform Background --- */}

            {/* --- Dynamic Background Removed to show Platform Background --- */}

            {/* Chat Area - scrollable with generous padding to avoid input overlap */}
            <div
                ref={chatContainerRef}
                className={`flex-1 overflow-y-auto custom-scrollbar relative px-4 py-8 transition-all duration-700 ease-in-out z-10 ${isChatStarted ? 'opacity-100' : 'opacity-0'} pb-56`}
            >
                <div className="max-w-4xl mx-auto space-y-8">
                    {messages.map((msg, idx) => {
                        const isLastMessage = idx === messages.length - 1;
                        const isAIMessage = msg.role === 'model';
                        const showInsightFooter = isLastMessage && isAIMessage && insightMetadata && !isLoading;

                        return (
                            <div key={idx} className="animate-slide-up">
                                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-6 rounded-2xl shadow-lg backdrop-blur-md border ${msg.role === 'user'
                                        ? 'bg-brand-blue-light text-brand-black rounded-tr-none border-brand-blue-light'
                                        : 'bg-white/5 text-slate-200 rounded-tl-none border-white/10'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-2 opacity-60 text-xs font-bold uppercase tracking-wider">
                                            {msg.role === 'user' ? <User size={12} /> : <Flame size={12} className="text-brand-orange" />}
                                            {msg.role === 'user' ? 'You' : 'Prometheus'}
                                        </div>
                                        {msg.role === 'user' ? (
                                            <div className="text-base leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                        ) : (
                                            <MarkdownRenderer content={cleanMessageContent(msg.content)} className="text-base leading-relaxed" />
                                        )}
                                    </div>
                                </div>

                                {/* Show insight footer for last AI message */}
                                {showInsightFooter && (
                                    <div className="mt-4 ml-0 max-w-[80%]">
                                        <AIResponseFooter
                                            pendingInsights={insightMetadata.pendingInsights.filter(i => i.status === 'pending')}
                                            autoCapturedCount={insightMetadata.autoSavedCount}
                                            isAutoMode={insightMetadata.isAutoMode}
                                            followUpSuggestions={insightMetadata.followUpSuggestions}
                                            onFollowUpClick={(prompt) => handleSendMessage(prompt)}
                                            onViewPersonalContext={() => {
                                                // Navigate to Personal Context
                                                window.location.href = '/collections/personal';
                                            }}
                                            onInsightStatusChange={(insightId, status) => {
                                                // Update local metadata state
                                                setInsightMetadata(prev => {
                                                    if (!prev) return null;
                                                    return {
                                                        ...prev,
                                                        pendingInsights: prev.pendingInsights.map(i =>
                                                            i.id === insightId ? { ...i, status } : i
                                                        ),
                                                    };
                                                });
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isLoading && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl rounded-tl-none flex items-center gap-3 text-slate-400 backdrop-blur-md">
                                <Loader2 size={18} className="animate-spin text-brand-orange" />
                                <span className="text-sm font-medium tracking-wide">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* --- Hero Section (Empty State) --- */}
            <div className={`
                absolute inset-0 z-20 flex flex-col items-center justify-start pt-32 p-8 transition-all duration-700 ease-in-out
                ${isChatStarted ? 'opacity-0 pointer-events-none translate-y-[-20px]' : 'opacity-100 translate-y-0'}
            `}>
                <div className="max-w-5xl w-full flex flex-col items-center">

                    {/* Logo & Title */}
                    <div className="flex flex-col items-center mb-12 animate-float">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-brand-blue-light/20 blur-[60px] rounded-full animate-pulse-slow"></div>
                            <img src="/images/logos/EnhancedHR-logo-mark-flame.png" alt="Prometheus AI" className="w-56 h-56 relative z-10 drop-shadow-[0_0_50px_rgba(120,192,240,0.5)] object-contain" />
                        </div>
                        <h1 className="text-5xl md:text-6xl font-thin text-white tracking-tight text-center mb-3">
                            Prometheus <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-yellow">AI</span>
                        </h1>
                        <p className="text-lg text-slate-400 font-light tracking-wide">Your personal engine for human relevance.</p>
                    </div>

                    {/* Capability Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                        {CAPABILITY_CARDS.map((card, idx) => (
                            <button
                                key={card.id}
                                onClick={() => handlePromptClick(card.prompt)}
                                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] overflow-hidden"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="relative z-10 flex items-start gap-4">
                                    <div className={`p-3 rounded-xl bg-white/5 border border-white/5 ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                                        <card.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-blue-light transition-colors">{card.title}</h3>
                                        <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* View More Prompts Button */}
                    <div className="flex justify-center w-full mt-6">
                        <button
                            onClick={() => onOpenDrawer && onOpenDrawer()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-slate-400 hover:text-brand-blue-light hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-300 group"
                        >
                            <Sparkles size={14} className="group-hover:text-brand-orange transition-colors" />
                            <span>More Prompts</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Input Area (Fixed at bottom) --- */}
            <div className="absolute bottom-0 left-0 w-full z-[70] bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/95 to-transparent pt-8 pb-6 px-6 md:px-10">
                <div className="max-w-4xl mx-auto relative group/input">
                    {/* Glow Effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-blue via-brand-orange to-brand-blue opacity-20 group-focus-within/input:opacity-100 blur-xl transition-opacity duration-700 rounded-2xl"></div>

                    <div className="relative bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center p-2 overflow-hidden">

                        {/* More Prompts Toggle */}
                        <button
                            onClick={() => setIsPromptPanelOpen(!isPromptPanelOpen)}
                            className="p-3 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors mr-2"
                            title="More Prompts"
                        >
                            <Sparkles size={20} />
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                            placeholder="Ask Prometheus anything..."
                            className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 px-2 font-light h-12"
                            autoFocus
                        />

                        <button
                            onClick={() => handleSendMessage(input)}
                            disabled={!input.trim() || isLoading}
                            className={`
                                p-3 rounded-xl transition-all duration-300 flex items-center justify-center
                                ${input.trim() && !isLoading
                                    ? 'bg-brand-blue-light text-brand-black hover:bg-white hover:scale-105 shadow-[0_0_20px_rgba(120,192,240,0.5)]'
                                    : 'bg-white/5 text-slate-600 cursor-not-allowed'}
                            `}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>

                    {/* Suggestion Panel (Slide Up) */}
                    <div className={`
                        absolute bottom-full left-0 w-full mb-4
                        transition-all duration-500 ease-in-out origin-bottom
                        ${isPromptPanelOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
                    `}>
                        <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {SUGGESTION_PANEL_PROMPTS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePromptClick(p.prompt)}
                                    className="text-left p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/prompt flex items-start gap-3"
                                >
                                    <div className="mt-1 text-slate-500 group-hover/prompt:text-brand-orange transition-colors">
                                        <MessageSquare size={14} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-200 group-hover/prompt:text-white font-medium">{p.label}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.category}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Text */}
                <div className={`text-center mt-4 transition-opacity duration-500 ${isChatStarted ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-xs text-slate-600">Prometheus can make mistakes. Verify important information.</p>
                </div>
            </div>
        </div>
    );
};

export default PrometheusFullPage;
