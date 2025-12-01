import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, Loader2, Sparkles, MessageSquare, Flame, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { getAgentResponse } from '@/lib/ai/engine';
import { AgentType, ContextScope } from '@/lib/ai/types';
import { HERO_PROMPTS, SUGGESTION_PANEL_PROMPTS, PromptSuggestion } from '@/lib/prompts';

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
}

interface Message {
    role: 'user' | 'model';
    text: string;
}

const PrometheusFullPage: React.FC<PrometheusFullPageProps> = ({
    initialPrompt,
    onSetAIPrompt,
    onTitleChange,
    onConversationStart,
    initialMessages = [],
    conversationId,
    initialTitle,
    onSaveConversation,
    isSaved
}) => {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastProcessedPromptRef = useRef<string | undefined>(undefined);
    const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Default to Platform Assistant for the full page view
    const agentType: AgentType = 'platform_assistant';
    const contextScope: ContextScope = { type: 'PLATFORM' };

    // Handle Initial Prompt
    useEffect(() => {
        if (initialPrompt && initialPrompt !== lastProcessedPromptRef.current) {
            lastProcessedPromptRef.current = initialPrompt;
            handleSendMessage(initialPrompt);
            // Clear the prompt in parent to prevent re-running on re-renders if needed
            // But since we track lastProcessedPromptRef, it should be fine.
        }
    }, [initialPrompt]);

    // Sync state with props when they change (e.g. switching conversations)
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        setCurrentConversationId(conversationId);
    }, [conversationId]);

    // Scroll to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        setIsPromptPanelOpen(false); // Close prompt panel if open

        try {
            const history = messages.map(m => ({ role: m.role, parts: m.text }));
            const response = await getAgentResponse(agentType, text, contextScope, history);
            const aiMsg: Message = { role: 'model', text: response.text };
            setMessages(prev => [...prev, aiMsg]);

            // Build the updated message array
            const updatedMessages = [...messages, userMsg, aiMsg];

            // Generate title after first AI response (so we have context)
            if (messages.length === 0 && onTitleChange) {
                try {
                    // Ask AI to generate a concise title based on the conversation
                    const titlePrompt = `Based on this conversation where the user asked: "${text}" and you responded with: "${response.text}", generate a very concise title (maximum 5 words) that captures the main topic or intent. Respond with ONLY the title, no quotes or extra text.`;
                    const titleResponse = await getAgentResponse(agentType, titlePrompt, contextScope, []);
                    const generatedTitle = titleResponse.text.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
                    onTitleChange(generatedTitle);

                    // Auto-save conversation when title is generated
                    if (onConversationStart) {
                        const newConvId = currentConversationId || Date.now().toString();
                        if (!currentConversationId) {
                            setCurrentConversationId(newConvId);
                        }
                        onConversationStart(newConvId, generatedTitle, updatedMessages);
                    }
                } catch (titleError) {
                    console.error('Error generating title:', titleError);
                    // Fallback to first few words if AI title generation fails
                    const fallbackTitle = text.split(' ').slice(0, 4).join(' ') + '...';
                    onTitleChange(fallbackTitle);

                    // Auto-save with fallback title
                    if (onConversationStart) {
                        const newConvId = currentConversationId || Date.now().toString();
                        if (!currentConversationId) {
                            setCurrentConversationId(newConvId);
                        }
                        onConversationStart(newConvId, fallbackTitle, updatedMessages);
                    }
                }
            } else if (currentConversationId && onConversationStart) {
                // For subsequent messages, update the existing conversation with full history
                // We need to get the current title from parent - for now, we'll just update messages
                // The parent will handle updating the conversation
                onConversationStart(currentConversationId, '', updatedMessages);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to my knowledge base right now. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromptClick = (prompt: string) => {
        handleSendMessage(prompt);
    };

    const isChatStarted = messages.length > 0;

    return (
        <div className="flex flex-col h-full w-full relative bg-transparent">

            {/* Chat Area - scrollable */}
            <div
                ref={chatContainerRef}
                className={`flex-1 overflow-y-auto custom-scrollbar relative px-4 py-8 transition-all duration-500 ${isChatStarted ? 'opacity-100' : 'opacity-0'} pb-32`}
                style={{ zIndex: 10 }}
            >
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="space-y-8 pb-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-6 rounded-2xl shadow-xl ${msg.role === 'user'
                                    ? 'bg-brand-blue-light text-brand-black rounded-tr-none'
                                    : 'bg-[#1e293b]/80 backdrop-blur-md text-slate-200 rounded-tl-none border border-white/10'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2 opacity-50 text-xs font-bold uppercase tracking-wider">
                                        {msg.role === 'user' ? <User size={12} /> : <Flame size={12} />}
                                        {msg.role === 'user' ? 'You' : 'Prometheus'}
                                    </div>
                                    <div className="text-base leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-[#1e293b]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl rounded-tl-none flex items-center gap-3 text-slate-400">
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Area Container - Fixed at bottom with high z-index */}
            <div className={`
                flex-shrink-0 p-8 relative transition-all duration-700 ease-in-out
                ${isChatStarted
                    ? 'border-t border-white/5 bg-[#0A0D12]/95 backdrop-blur-xl'
                    : 'absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-transparent'
                }
            `}
                style={{ zIndex: 70 }}
            >
                <div className={`w-full max-w-3xl mx-auto relative flex flex-col gap-6 ${!isChatStarted && 'mb-20'}`}>

                    {/* Hero Content (Logo & Title) - Only visible when no chat */}
                    {!isChatStarted && (
                        <div className="flex flex-col items-center gap-4 mb-4 animate-fade-in flex-shrink-0">
                            <img src="/images/logos/EnhancedHR-logo-mark-flame.png" alt="Prometheus AI" className="w-20 h-20 drop-shadow-[0_0_30px_rgba(255,147,0,0.4)] object-contain flex-shrink-0" />
                            <h1 className="text-4xl font-light text-white tracking-tight text-center">Prometheus AI</h1>
                        </div>
                    )}

                    {/* Prompts - Above Input */}
                    {!isChatStarted && (
                        <div className="w-full animate-fade-in" style={{ animationDelay: '100ms' }}>
                            <div className="flex flex-wrap gap-3 justify-center mb-4">
                                {HERO_PROMPTS.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePromptClick(p.prompt)}
                                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-sm text-slate-300 hover:text-white transition-all duration-200 shadow-lg backdrop-blur-sm"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setIsPromptPanelOpen(!isPromptPanelOpen)}
                                    className="px-4 py-2 rounded-xl bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/20 text-sm text-brand-blue-light hover:text-white transition-all duration-200 flex items-center gap-2"
                                >
                                    <Sparkles size={14} />
                                    See more
                                    {isPromptPanelOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Prompt Suggestion Panel (Slide Down from Top Overlay) */}
                    <div className={`
                        absolute top-full left-0 w-full z-50 mt-4
                        overflow-hidden transition-all duration-500 ease-in-out
                        ${isPromptPanelOpen && !isChatStarted ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}
                    `}>
                        <div className="bg-[#0f141c]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {SUGGESTION_PANEL_PROMPTS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handlePromptClick(p.prompt)}
                                    className="text-left p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group/prompt flex items-start gap-4"
                                >
                                    <div className="mt-1 p-2 rounded-lg bg-white/5 text-slate-500 group-hover/prompt:text-brand-blue-light group-hover/prompt:bg-brand-blue-light/10 transition-colors">
                                        <MessageSquare size={16} />
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-200 group-hover/prompt:text-white font-medium mb-1">{p.label}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{p.category}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Field */}
                    <div className="relative group/input w-full">
                        {/* Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-blue-light via-white to-brand-orange opacity-30 group-focus-within/input:opacity-100 blur-lg transition-opacity duration-500 rounded-2xl"></div>

                        <div className="relative bg-[#0A0D12]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                            <div className="flex items-center p-2">
                                {/* Removed Flame Icon from Input */}
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                                    placeholder="Ask Prometheus anything..."
                                    className="flex-1 bg-transparent border-none outline-none text-lg text-white placeholder-slate-500 px-6 font-light h-14"
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleSendMessage(input)}
                                    className="p-3 bg-brand-blue-light text-brand-black rounded-xl hover:bg-white transition-colors"
                                >
                                    <ArrowRight size={24} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PrometheusFullPage;
