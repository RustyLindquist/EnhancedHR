'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageSquare,
  User,
  Loader2,
  Send,
  Download,
  Sparkles,
  Building2
} from 'lucide-react';
import { Message } from '@/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { parseStreamResponse, stripInsightTags, StreamInsightMetadata } from '@/lib/ai/insight-stream-parser';
import { AIResponseFooter } from '@/components/ai';
import { getAgentResponse } from '@/lib/ai/engine';
import { exportConversationAsMarkdown } from '@/lib/export-conversation';

interface OrgCourseAIPanelProps {
  orgId: string;
  orgName: string;
}

/**
 * OrgCourseAIPanel - Floating AI Assistant for Organization Courses
 *
 * A self-contained floating chat panel that provides AI assistance
 * scoped to all published org courses for the user's organization.
 * Features a floating trigger button and slide-in panel from the right.
 */
const OrgCourseAIPanel: React.FC<OrgCourseAIPanelProps> = ({
  orgId,
  orgName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('New Conversation');

  // Insight metadata from the last AI response
  const [insightMetadata, setInsightMetadata] = useState<StreamInsightMetadata | null>(null);

  // Input animation states
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showSubmitGlow, setShowSubmitGlow] = useState(false);

  // Ensure we only render the portal on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Agent info for org course assistant
  const agentInfo = {
    name: 'Organizational Course Assistant',
    icon: Building2,
    color: 'text-amber-400',
    themeColor: 'bg-amber-400'
  };

  // Context scope for org courses
  const contextScope = {
    type: 'PLATFORM' as const,
    id: orgId
  };

  const createConversation = async (title: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          metadata: {
            agentType: 'org_course_assistant',
            contextScope: contextScope,
            orgId: orgId
          }
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (error) {
      console.error('Failed to create conversation', error);
    }
    return null;
  };

  const saveMessage = async (convId: string, role: 'user' | 'model', content: string) => {
    try {
      await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content })
      });
    } catch (error) {
      console.error('Failed to save message', error);
    }
  };

  const updateConversationTitle = async (convId: string, title: string) => {
    try {
      await fetch(`/api/conversations/${convId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
    } catch (error) {
      console.error('Failed to update conversation title', error);
    }
  };

  // Handle textarea auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = textarea.scrollHeight;
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Handle submit with animation
  const handleSubmitWithAnimation = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Trigger submit glow animation
    setShowSubmitGlow(true);
    setTimeout(() => setShowSubmitGlow(false), 600);

    // Reset textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await handleSendMessage(text);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const isNewConversation = !conversationId;

    let activeConvId = conversationId;
    if (!activeConvId) {
      const title = 'New Conversation';
      const newConv = await createConversation(title);
      if (newConv) {
        activeConvId = newConv.id;
        setConversationId(activeConvId);
        setConversationTitle(title);
      }
    }

    if (activeConvId) {
      saveMessage(activeConvId, 'user', text);
    }

    try {
      const history = messages.map(m => ({ role: m.role, parts: m.content }));

      // Create placeholder message for streaming
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      // Use streaming API with org-scoped context
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentType: 'platform_assistant', // Use platform assistant for broad knowledge
          contextScope: {
            type: 'PLATFORM',
            id: orgId
          },
          history,
          conversationId: activeConvId,
          pageContext: 'org_courses',
          // Additional context to scope to org courses
          systemPromptAddendum: `You are the Organizational Course Assistant for ${orgName}. You help users with questions about their organization's custom courses and training content. Focus on org-specific learning content when possible.`
        })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorBody.error || `Streaming failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullText += parsed.content;

                  setMessages(prev => {
                    const updated = [...prev];
                    if (updated.length > 0) {
                      const displayContent = stripInsightTags(fullText);
                      updated[updated.length - 1] = { role: 'model', content: displayContent };
                    }
                    return updated;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            } else if (line.includes('<!--__INSIGHT_META__:')) {
              fullText += line;
            }
          }
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

      // Save the complete message
      if (activeConvId && parsedResponse.rawContent) {
        saveMessage(activeConvId, 'model', parsedResponse.rawContent);
      }

      // Generate title for new conversations
      if (isNewConversation && activeConvId && fullText) {
        try {
          const cleanedResponse = stripInsightTags(fullText).substring(0, 200);

          const titleResponse = await getAgentResponse(
            'platform_assistant',
            `Based on this conversation where the user asked: "${text}" and you responded with: "${cleanedResponse}...", generate a very concise title (maximum 5 words) that captures the main topic or intent. Respond with ONLY the title, no quotes or extra text.`,
            contextScope,
            [],
            activeConvId,
            'org_course_title_gen'
          );
          const generatedTitle = titleResponse.text.trim().replace(/^["']|["']$/g, '');

          if (generatedTitle) {
            updateConversationTitle(activeConvId, generatedTitle);
            setConversationTitle(generatedTitle);
          }
        } catch (titleError) {
          console.error('Error generating title:', titleError);
          const fallbackTitle = text.split(' ').slice(0, 4).join(' ') + '...';
          if (activeConvId) {
            updateConversationTitle(activeConvId, fallbackTitle);
          }
          setConversationTitle(fallbackTitle);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => {
        const updated = prev.filter(m => m.content !== '');
        return [...updated, { role: 'model', content: `I'm having trouble connecting right now. Error: ${(error as Error).message || String(error)}` }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new conversation
  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setConversationTitle('New Conversation');
    setInsightMetadata(null);
  };

  if (!mounted) {
    return null;
  }

  const panelContent = (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-[100]
          w-14 h-14 rounded-full
          bg-gradient-to-br from-amber-500 to-amber-600
          border border-amber-400/30
          shadow-lg shadow-amber-500/20
          flex items-center justify-center
          transition-all duration-300
          hover:scale-110 hover:shadow-xl hover:shadow-amber-500/30
          active:scale-95
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        title="Open Organization Course Assistant"
      >
        <MessageSquare size={24} className="text-white" />
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20"></span>
      </button>

      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-in Panel */}
      <div
        className={`
          fixed top-0 right-0 bottom-0 z-[120]
          w-full max-w-md
          bg-[#0B1120]/95 backdrop-blur-xl
          border-l border-white/10
          shadow-[-10px_0_50px_rgba(0,0,0,0.5)]
          flex flex-col
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-20 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Building2 size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">{agentInfo.name}</h2>
              <p className="text-[10px] text-amber-400/70 uppercase tracking-wider font-medium">{orgName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            {conversationId && messages.length > 0 && (
              <button
                onClick={() => exportConversationAsMarkdown(messages, conversationTitle, agentInfo.name)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                title="Export conversation"
              >
                <Download size={16} className="text-slate-400" />
              </button>
            )}

            {/* New Conversation Button */}
            {messages.length > 0 && (
              <button
                onClick={handleNewConversation}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                title="New conversation"
              >
                <Sparkles size={16} className="text-slate-400" />
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            >
              <X size={16} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={messagesContainerRef} className="flex-1 px-6 pt-6 pb-32 space-y-4 overflow-y-auto">
          {messages.length === 0 ? (
            <>
              {/* Welcome Message */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-1">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Building2 size={16} />
                  </div>
                </div>

                <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-lg backdrop-blur-md">
                  <p>Hello! I&apos;m your Organizational Course Assistant for <span className="text-amber-400 font-medium">{orgName}</span>.</p>
                  <ul className="mt-3 space-y-2 list-disc list-inside text-slate-400 text-xs">
                    <li>Ask about your organization&apos;s courses</li>
                    <li>Get help finding specific training content</li>
                    <li>Learn about course topics and objectives</li>
                    <li>Get recommendations based on learning goals</li>
                  </ul>
                </div>
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-2 pl-11">
                <button
                  onClick={() => handleSendMessage("What courses are available?")}
                  className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                >
                  What courses are available?
                </button>
                <button
                  onClick={() => handleSendMessage("Help me find training on compliance")}
                  className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                >
                  Find compliance training
                </button>
                <button
                  onClick={() => handleSendMessage("What should I learn first?")}
                  className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 text-slate-400 hover:text-amber-400 px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
                >
                  What should I learn first?
                </button>
              </div>

              {/* Disclaimer */}
              <div className="w-full flex justify-center pt-4 pb-2">
                <p className="text-[10px] text-center text-slate-500 opacity-60">
                  AI assistant can make mistakes. Verify important info.
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => {
                const isLastMessage = idx === messages.length - 1;
                const isAIMessage = msg.role === 'model';
                const showInsightFooter = isLastMessage && isAIMessage && insightMetadata && !isLoading;

                return (
                  <div key={idx}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                        ? 'bg-amber-500 text-white rounded-tr-none'
                        : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/10'
                        }`}>
                        <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-bold uppercase tracking-wider">
                          {msg.role === 'user' ? <User size={10} /> : <Building2 size={10} />}
                          {msg.role === 'user' ? 'You' : agentInfo.name}
                        </div>
                        {msg.role === 'user' ? (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <MarkdownRenderer content={msg.content} className="text-sm leading-relaxed" />
                        )}
                      </div>
                    </div>

                    {/* Show insight footer for last AI message */}
                    {showInsightFooter && (
                      <div className="mt-3 max-w-[85%]">
                        <AIResponseFooter
                          pendingInsights={insightMetadata.pendingInsights.filter(i => i.status === 'pending')}
                          autoCapturedCount={insightMetadata.autoSavedCount}
                          isAutoMode={insightMetadata.isAutoMode}
                          followUpSuggestions={insightMetadata.followUpSuggestions}
                          onFollowUpClick={(prompt) => handleSendMessage(prompt)}
                          onViewPersonalContext={() => {
                            window.location.href = '/collections/personal';
                          }}
                          onInsightStatusChange={(insightId, status) => {
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
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0B1120] via-[#0B1120] to-transparent">
          <div className="relative">
            {/* Glow effect */}
            <div
              className={`
                absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-2
                w-3/4 h-16 rounded-full blur-[30px] mix-blend-screen
                transition-all duration-500 ease-out pointer-events-none
                bg-amber-500
                ${isInputFocused ? 'opacity-30' : 'opacity-10'}
              `}
            />

            {/* Submit Glow Burst */}
            {showSubmitGlow && (
              <div className="absolute inset-0 rounded-xl pointer-events-none bg-amber-500 opacity-30 blur-xl animate-pulse" />
            )}

            {/* Input Container */}
            <div className={`
              relative rounded-xl p-[2px] z-10
              transition-all duration-300
              ${isInputFocused
                ? 'bg-gradient-to-r from-amber-500/50 via-amber-400/50 to-amber-500/50'
                : 'bg-gradient-to-r from-white/10 via-white/20 to-white/10'
              }
            `}>
              <div className="relative rounded-xl overflow-hidden bg-[#0B1120] border border-white/5">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitWithAnimation(input);
                    }
                  }}
                  placeholder="Ask about organization courses..."
                  rows={1}
                  className="
                    w-full bg-transparent resize-none
                    py-3 pl-4 pr-12
                    text-sm text-white leading-relaxed
                    placeholder-slate-500
                    focus:outline-none
                  "
                  style={{
                    minHeight: '44px',
                    maxHeight: '120px',
                  }}
                />

                {/* Send Button */}
                <button
                  onClick={() => handleSubmitWithAnimation(input)}
                  disabled={!input.trim() || isLoading}
                  className={`
                    absolute right-2 bottom-2 z-20
                    p-2 rounded-lg
                    transition-all duration-300
                    ${input.trim() && !isLoading
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 active:scale-95'
                      : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                    }
                  `}
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Use portal to render at document body level for proper stacking
  return createPortal(panelContent, document.body);
};

export default OrgCourseAIPanel;
