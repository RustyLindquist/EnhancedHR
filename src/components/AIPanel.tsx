import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Flame, MessageSquare, Sparkles, GraduationCap, Bot, User, Loader2, Library, Plus, Download, StickyNote } from 'lucide-react';
import { exportConversationAsMarkdown } from '@/lib/export-conversation';
import { getAgentResponse } from '@/lib/ai/engine';
import { AgentType, ContextScope } from '@/lib/ai/types';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { parseStreamResponse, stripInsightTags, StreamInsightMetadata } from '@/lib/ai/insight-stream-parser';
import { AIResponseFooter } from '@/components/ai';
import AIPanelNotesTab from './AIPanelNotesTab';

interface NoteDragItem {
  type: 'NOTE';
  id: string;
  title: string;
}

interface AIPanelProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // New Props for Context Engineering
  agentType?: AgentType; // Default agent to load
  contextScope?: ContextScope; // Scope for RAG
  initialPrompt?: string;
  conversationId?: string | null;
  onConversationIdChange?: (id: string) => void;
  onAddConversationToCollection?: (conversationId: string, title: string) => void;
  onOpenHelp?: (topicId: string) => void;
  // Notes tab handlers
  onAddNoteToCollection?: (item: { type: 'NOTE'; id: string; title: string }) => void;
  onNoteDragStart?: (item: NoteDragItem) => void;
}

import { Message } from '@/types';

const AIPanel: React.FC<AIPanelProps> = ({
  isOpen,
  setIsOpen,
  agentType = 'platform_assistant',
  contextScope = { type: 'PLATFORM' },
  initialPrompt,
  conversationId: propConversationId,
  onConversationIdChange,
  onAddConversationToCollection,
  onOpenHelp,
  onAddNoteToCollection,
  onNoteDragStart
}) => {
  const [width, setWidth] = useState(384); // Default w-96
  const [isDragging, setIsDragging] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);

  // Tab state for Course scope (AI Chat vs Notes)
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');

  // Trigger for note creation from header button
  const [createNoteTrigger, setCreateNoteTrigger] = useState(0);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Internal Mode State (Only relevant if toggling between Assistant/Tutor in Course Scope)
  const [mode, setMode] = useState<'assistant' | 'tutor'>('assistant');

  // Derived effective agent type based on internal toggle if in Course Scope
  const effectiveAgentType: AgentType = (contextScope.type === 'COURSE' && mode === 'tutor')
    ? 'course_tutor'
    : (contextScope.type === 'COURSE')
      ? 'course_assistant'
      : agentType;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialPromptRun = useRef(false);

  // Insight metadata from the last AI response
  const [insightMetadata, setInsightMetadata] = useState<StreamInsightMetadata | null>(null);

  // Store conversation state per mode (for Course scope - separate Assistant vs Tutor conversations)
  interface ConversationState {
    id: string | null;
    messages: Message[];
    title: string;
    insightMetadata: StreamInsightMetadata | null;
  }
  const assistantConversationRef = useRef<ConversationState>({
    id: null, messages: [], title: 'New Conversation', insightMetadata: null
  });
  const tutorConversationRef = useRef<ConversationState>({
    id: null, messages: [], title: 'New Conversation', insightMetadata: null
  });
  const prevModeRef = useRef<'assistant' | 'tutor'>(mode);

  // Handle Resizing logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging]);

  const lastProcessedPromptRef = useRef<string | undefined>(undefined);

  // Handle Initial Prompt
  useEffect(() => {
    if (initialPrompt && isOpen && initialPrompt !== lastProcessedPromptRef.current) {
      lastProcessedPromptRef.current = initialPrompt;
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Scroll to bottom - use scrollTop instead of scrollIntoView to prevent parent scroll containers from shifting
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('New Conversation');

  // Handle mode switching (Assistant <-> Tutor) - save current conversation, load the other
  useEffect(() => {
    // Only relevant in Course scope
    if (contextScope.type !== 'COURSE') return;

    const prevMode = prevModeRef.current;
    if (prevMode !== mode) {
      // Save current conversation to the previous mode's ref
      if (prevMode === 'assistant') {
        assistantConversationRef.current = {
          id: conversationId,
          messages: [...messages],
          title: conversationTitle,
          insightMetadata: insightMetadata
        };
      } else {
        tutorConversationRef.current = {
          id: conversationId,
          messages: [...messages],
          title: conversationTitle,
          insightMetadata: insightMetadata
        };
      }

      // Load the new mode's conversation
      const newConv = mode === 'assistant'
        ? assistantConversationRef.current
        : tutorConversationRef.current;

      setConversationId(newConv.id);
      setMessages(newConv.messages);
      setConversationTitle(newConv.title);
      setInsightMetadata(newConv.insightMetadata);

      // Update the mode ref
      prevModeRef.current = mode;
    }
  }, [mode, contextScope.type]);

  // Sync prop conversationId to local state and fetch messages
  useEffect(() => {
    if (propConversationId && propConversationId !== conversationId) {
      setConversationId(propConversationId);
      // Fetch messages for this conversation
      const fetchMessages = async () => {
        try {
          const res = await fetch(`/api/conversations/${propConversationId}/messages`);
          if (res.ok) {
            const data = await res.json();
            // Map DB messages to UI messages if needed, assuming API returns compatible format
            // The API returns { role, content, ... }
            setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
          }
        } catch (error) {
          console.error("Failed to load conversation history", error);
        }
      };
      fetchMessages();
    } else if (propConversationId === null && conversationId !== null) {
      // Reset if prop explicitly clears it (e.g. context switch)
      setConversationId(null);
      setMessages([]);
    }
  }, [propConversationId]);

  // Track previous context scope to detect scope changes
  const prevContextScopeRef = useRef<{ type: string; id?: string } | null>(null);

  // Reset conversation when context scope changes (e.g., switching courses)
  // But preserve conversation if we're resuming one (propConversationId is set)
  useEffect(() => {
    const prevScope = prevContextScopeRef.current;
    const scopeChanged = prevScope !== null && (
      prevScope.type !== contextScope.type ||
      prevScope.id !== contextScope.id
    );

    // Don't clear if we're resuming a conversation from another context
    // The propConversationId effect will handle loading that conversation
    if (scopeChanged && !propConversationId) {
      // Clear the conversation when switching contexts (but not when resuming)
      setConversationId(null);
      setMessages([]);
      setConversationTitle('New Conversation');
      setInsightMetadata(null);
      // Also reset the processed prompt to allow new initial prompts
      lastProcessedPromptRef.current = undefined;

      // Reset mode-specific conversation refs (both Assistant and Tutor start fresh)
      assistantConversationRef.current = { id: null, messages: [], title: 'New Conversation', insightMetadata: null };
      tutorConversationRef.current = { id: null, messages: [], title: 'New Conversation', insightMetadata: null };

      // Reset mode back to assistant (default) and sync the ref
      setMode('assistant');
      prevModeRef.current = 'assistant';
    }

    // Update the ref for next comparison
    prevContextScopeRef.current = { type: contextScope.type, id: contextScope.id };
  }, [contextScope.type, contextScope.id, propConversationId]);

  const createConversation = async (title: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          metadata: {
            agentType: effectiveAgentType,
            contextScope: contextScope
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Track if this is a new conversation (for title generation)
    const isNewConversation = !conversationId;

    let activeConvId = conversationId;
    if (!activeConvId) {
      const title = 'New Conversation';
      const newConv = await createConversation(title);
      if (newConv) {
        activeConvId = newConv.id;
        setConversationId(activeConvId);
        setConversationTitle(title);
        if (onConversationIdChange && activeConvId) {
          onConversationIdChange(activeConvId);
        }
        // Notify MainCanvas to refresh conversations list and counts
        window.dispatchEvent(new CustomEvent('collection:refresh'));
      }
    }

    if (activeConvId) {
      saveMessage(activeConvId, 'user', text);
    }

    try {
      const history = messages.map(m => ({ role: m.role, parts: m.content }));

      // Create placeholder message for streaming
      const placeholderIndex = messages.length + 1; // +1 for user message we just added
      setMessages(prev => [...prev, { role: 'model', content: '' }]);

      // Use streaming API
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentType: effectiveAgentType,
          contextScope,
          history,
          conversationId: activeConvId,
          pageContext: 'ai_panel'
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
              } catch {
                // Skip invalid JSON
              }
            } else if (line.includes('<!--__INSIGHT_META__:')) {
              // Capture metadata markers that come at the end
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

      // Save the complete message (raw content for potential re-processing)
      if (activeConvId && parsedResponse.rawContent) {
        saveMessage(activeConvId, 'model', parsedResponse.rawContent);
      }

      // Generate title for new conversations
      if (isNewConversation && activeConvId && fullText) {
        try {
          // Clean the response text for title generation
          const cleanedResponse = stripInsightTags(fullText).substring(0, 200);

          const titleResponse = await getAgentResponse(effectiveAgentType,
            `Based on this conversation where the user asked: "${text}" and you responded with: "${cleanedResponse}...", generate a very concise title (maximum 5 words) that captures the main topic or intent. Respond with ONLY the title, no quotes or extra text.`,
            contextScope, [], activeConvId, 'ai_panel_title_gen');
          const generatedTitle = titleResponse.text.trim().replace(/^["']|["']$/g, '');

          if (generatedTitle) {
            updateConversationTitle(activeConvId, generatedTitle);
            setConversationTitle(generatedTitle);
          }
        } catch (titleError) {
          console.error('Error generating title:', titleError);
          // Fallback to first few words of user message
          const fallbackTitle = text.split(' ').slice(0, 4).join(' ') + '...';
          updateConversationTitle(activeConvId, fallbackTitle);
          setConversationTitle(fallbackTitle);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => {
        // Remove the empty placeholder and add error message
        const updated = prev.filter(m => m.content !== '');
        return [...updated, { role: 'model', content: `I'm having trouble connecting to my knowledge base right now. Error: ${(error as any).message || String(error)}` }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get Agent Display Info
  const getAgentInfo = () => {
    switch (effectiveAgentType) {
      case 'course_assistant': return { name: 'Course Assistant', icon: Bot, color: 'text-brand-blue-light', themeColor: 'bg-brand-blue-light' };
      case 'course_tutor': return { name: 'Prometheus Tutor', icon: GraduationCap, color: 'text-brand-orange', themeColor: 'bg-brand-orange' };
      case 'collection_assistant': return { name: 'Collection Assistant', icon: Library, color: 'text-purple-400', themeColor: 'bg-purple-400' };
      case 'platform_assistant': return { name: 'Prometheus AI', icon: Sparkles, color: 'text-brand-orange', themeColor: 'bg-brand-orange' };
      default: return { name: 'AI Assistant', icon: Bot, color: 'text-white', themeColor: 'bg-white' };
    }
  };

  const agentInfo = getAgentInfo();

  return (
    <div
      className={`
        flex-shrink-0 
        bg-white/[0.02] backdrop-blur-xl 
        border-l border-white/10 
        flex flex-col z-[90] h-full shadow-[-5px_0_30px_0_rgba(0,0,0,0.3)]
        relative
        ${!isDragging ? 'transition-all duration-300 ease-in-out' : ''}
      `}
      style={{ width: isOpen ? width : 64 }}
    >
      {/* Vertical Beam Effect - 1px wide, slow expansion */}
      <div
        className={`
          absolute -left-[1px] top-0 bottom-0 w-px bg-brand-blue-light 
          shadow-[0_0_15px_rgba(120,192,240,0.8)] z-40 pointer-events-none
          transition-transform duration-[1500ms] ease-out origin-center
          ${isHandleHovered ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}
        `}
      ></div>

      {/* Resize Handle - Only visible when open */}
      {isOpen && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50 group cursor-col-resize p-4"
          onMouseDown={() => setIsDragging(true)}
          onMouseEnter={() => setIsHandleHovered(true)}
          onMouseLeave={() => setIsHandleHovered(false)}
        >
          {/* Interface Modifier Color: #5694C7 (Less bright blue) */}
          <div className="w-3 h-16 bg-[#5694C7] border border-white/20 rounded-full flex flex-col items-center justify-center gap-1.5 shadow-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(86,148,199,0.8)] hover:bg-[#5694C7]/90">
            <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-brand-black/60"></div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`h-24 flex-shrink-0 flex items-center ${isOpen ? 'justify-between pl-10 pr-6' : 'justify-center'} border-b border-white/5 bg-white/5 backdrop-blur-md relative`}>
        {/* Toggle Button - Placed on border */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -left-3 top-9 bg-white/10 border border-white/10 rounded-full p-1 text-white/40 hover:bg-[#5694C7] hover:border-white/20 hover:text-white hover:shadow-[0_0_10px_rgba(86,148,199,0.5)] transition-all shadow-lg z-50 backdrop-blur-md"
        >
          {isOpen ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {isOpen && (
          <div className="flex items-center overflow-hidden w-full justify-between">
            {/* Left side: Tabs (Course scope) or Agent name (other scopes) */}
            {contextScope.type === 'COURSE' ? (
              // AI Chat / Notes tabs in header for Course scope - fills available width
              <div className="flex-1 bg-black/30 p-1 rounded-xl flex border border-white/10 mr-4">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'chat' ? 'bg-[#5694C7] text-white shadow-[0_0_15px_rgba(86,148,199,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <MessageSquare size={14} /> Chat
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'notes' ? 'bg-[#5694C7] text-white shadow-[0_0_15px_rgba(86,148,199,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <StickyNote size={14} /> Notes
                </button>
              </div>
            ) : (
              // Original agent name display for non-Course scopes
              <div className="flex flex-col justify-center">
                <span className={`font-bold text-sm tracking-widest uppercase ${agentInfo.color} drop-shadow-[0_0_5px_rgba(255,147,0,0.5)] truncate leading-none`}>
                  {agentInfo.name}
                </span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider">Online</span>
                </div>
              </div>
            )}
            {/* Action Buttons - always show in Course scope for consistent header layout */}
            {contextScope.type === 'COURSE' ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                {activeTab === 'chat' ? (
                  <>
                    {/* Export Button - disabled when no conversation */}
                    <button
                      onClick={() => conversationId && messages.length > 0 && exportConversationAsMarkdown(messages, conversationTitle, agentInfo.name)}
                      disabled={!conversationId || messages.length === 0}
                      className={`group flex items-center justify-center w-8 h-8 rounded-full border border-white/10 transition-all ${
                        conversationId && messages.length > 0
                          ? 'bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer'
                          : 'bg-white/[0.02] cursor-not-allowed'
                      }`}
                      title={conversationId && messages.length > 0 ? "Export conversation as Markdown" : "Start a conversation to export"}
                    >
                      <Download size={16} className={`transition-colors ${conversationId && messages.length > 0 ? 'text-slate-400 group-hover:text-white' : 'text-slate-600'}`} />
                    </button>

                    {/* Add to Collection Button - disabled when no conversation */}
                    {onAddConversationToCollection && (
                      <button
                        onClick={() => conversationId && messages.length > 0 && onAddConversationToCollection(conversationId, conversationTitle)}
                        disabled={!conversationId || messages.length === 0}
                        className={`group flex items-center justify-center w-8 h-8 rounded-full border border-white/10 transition-all ${
                          conversationId && messages.length > 0
                            ? 'bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer'
                            : 'bg-white/[0.02] cursor-not-allowed'
                        }`}
                        title={conversationId && messages.length > 0 ? "Save this conversation to a Collection" : "Start a conversation to save"}
                      >
                        <Plus size={16} className={`transition-colors ${conversationId && messages.length > 0 ? 'text-slate-400 group-hover:text-white' : 'text-slate-600'}`} />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {/* Notes tab: Placeholder for Download button to maintain consistent spacing */}
                    <div className="w-8 h-8" />

                    {/* Add Note Button */}
                    <button
                      onClick={() => setCreateNoteTrigger(prev => prev + 1)}
                      disabled={isCreatingNote}
                      className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                      title="Create a new note"
                    >
                      {isCreatingNote ? (
                        <Loader2 size={16} className="text-slate-400 animate-spin" />
                      ) : (
                        <Plus size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  </>
                )}
              </div>
            ) : (
              // Non-Course scope: only show buttons when there's an active conversation
              conversationId && messages.length > 0 && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => exportConversationAsMarkdown(messages, conversationTitle, agentInfo.name)}
                    className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                    title="Export conversation as Markdown"
                  >
                    <Download size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                  </button>
                  {onAddConversationToCollection && (
                    <button
                      onClick={() => onAddConversationToCollection(conversationId, conversationTitle)}
                      className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                      title="Save this conversation to a Collection"
                    >
                      <Plus size={16} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* Assistant/Tutor Toggle (Only when in Course Scope + Chat tab active) */}
      {isOpen && contextScope.type === 'COURSE' && activeTab === 'chat' && (
        <div className="px-6 py-3 border-b border-white/5">
          <div className="bg-black/30 p-1 rounded-xl flex border border-white/10">
            <button
              onClick={() => setMode('assistant')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mode === 'assistant' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Bot size={14} /> Assistant
            </button>
            <button
              onClick={() => setMode('tutor')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mode === 'tutor' ? 'bg-brand-blue-light text-brand-black shadow-[0_0_15px_rgba(120,192,240,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <GraduationCap size={14} /> Tutor
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-transparent to-black/20">
        {isOpen ? (
          <>
            {/* Notes Tab Content (when in Course scope and Notes tab active) */}
            {contextScope.type === 'COURSE' && activeTab === 'notes' && contextScope.id ? (
              <div className="flex-1 px-6 pt-4 pb-6 overflow-hidden">
                <AIPanelNotesTab
                  courseId={parseInt(contextScope.id, 10)}
                  onOpenHelp={(topicId) => onOpenHelp?.(topicId)}
                  onAddToCollection={onAddNoteToCollection}
                  onDragStart={onNoteDragStart}
                  onCreatingChange={setIsCreatingNote}
                  createNoteTrigger={createNoteTrigger}
                />
              </div>
            ) : (
            <>
            {/* Chat Messages - pb-32 prevents overlap with input area */}
            <div ref={messagesContainerRef} className="flex-1 px-6 pt-8 pb-32 space-y-6 overflow-y-auto no-scrollbar">

              {messages.length === 0 ? (
                <>
                  {/* Dynamic Empty State Message based on Agent Type */}
                  <div className="flex items-start space-x-3 animate-float">
                    <div className="flex-shrink-0 pt-1">
                      <div className={`w-8 h-8 rounded-lg ${agentInfo.themeColor}/20 border ${agentInfo.themeColor}/30 flex items-center justify-center ${agentInfo.color} shadow-[0_0_15px_rgba(255,147,0,0.2)]`}>
                        <agentInfo.icon size={16} />
                      </div>
                    </div>

                    <div className="bg-white/10 border border-white/10 p-4 rounded-2xl rounded-tl-none text-sm text-slate-200 leading-relaxed shadow-lg backdrop-blur-md">
                      {effectiveAgentType === 'course_assistant' && (
                        <>
                          <p>I can help you navigate this course. Ask me to:</p>
                          <ul className="mt-2 space-y-2 list-disc list-inside text-slate-400 text-xs">
                            <li>Summarize the module</li>
                            <li>Explain key concepts</li>
                            <li>Draft an email based on this lesson</li>
                          </ul>
                        </>
                      )}
                      {effectiveAgentType === 'course_tutor' && (
                        <>
                          <p>I'm your personal Tutor. I'll help you master this material.</p>
                          <p className="mt-2 text-slate-400 text-xs">We can roleplay scenarios, I can quiz you on the content, or we can create a personalized study guide.</p>
                        </>
                      )}
                      {effectiveAgentType === 'platform_assistant' && (
                        <>
                          <p>I'm Prometheus, your Platform Assistant.</p>
                          <p className="mt-2 text-slate-400 text-xs">Ask me about any course, help finding content, or general HR questions.</p>
                        </>
                      )}
                      {effectiveAgentType === 'collection_assistant' && (
                        <>
                          <p>I'm the Collection Assistant.</p>
                          <p className="mt-2 text-slate-400 text-xs">I can help you synthesize information across all the items in this collection.</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-2 pl-11">
                    {effectiveAgentType === 'course_assistant' && (
                      <>
                        <button onClick={() => handleSendMessage("Summarize this module")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Summarize this module
                        </button>
                        <button onClick={() => handleSendMessage("What are the key takeaways?")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Key takeaways?
                        </button>
                      </>
                    )}
                    {effectiveAgentType === 'course_tutor' && (
                      <>
                        <button onClick={() => handleSendMessage("Quiz me on this")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Quiz me
                        </button>
                        <button onClick={() => handleSendMessage("Roleplay a scenario")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-blue-light/30 text-slate-400 hover:text-brand-blue-light px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Roleplay
                        </button>
                      </>
                    )}
                    {effectiveAgentType === 'platform_assistant' && (
                      <>
                        <button onClick={() => handleSendMessage("Find courses on Leadership")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          Find Leadership courses
                        </button>
                        <button onClick={() => handleSendMessage("How do I earn credits?")} className="text-[10px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-brand-orange/30 text-slate-400 hover:text-brand-orange px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                          How to earn credits?
                        </button>
                      </>
                    )}
                  </div>

                  {/* Disclaimer Text */}
                  <div className="w-full flex justify-center pt-4 pb-2">
                    <p className="text-[10px] text-center text-slate-500 opacity-60">
                      Prometheus can make mistakes. Verify important info.
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg, idx) => {
                    const isLastMessage = idx === messages.length - 1;
                    const isAIMessage = msg.role === 'model';
                    const showInsightFooter = isLastMessage && isAIMessage && insightMetadata && !isLoading;

                    return (
                      <div key={idx}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                            ? 'bg-brand-blue-light text-brand-black rounded-tr-none'
                            : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/10'
                            }`}>
                            <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] font-bold uppercase tracking-wider">
                              {msg.role === 'user' ? <User size={10} /> : <agentInfo.icon size={10} />}
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

            {/* Input Area (Footer) */}
            <div className="h-28 flex-shrink-0 p-6 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent backdrop-blur-md flex flex-col justify-center">
              <div className="relative group w-full">

                {/* --- GLOW EFFECTS --- */}
                <div
                  className={`
                    absolute -top-4 -left-4 w-16 h-16 
                    ${effectiveAgentType === 'course_tutor' ? 'bg-[#FF9300]' : 'bg-[#78C0F0]'} rounded-full blur-[20px] 
                    opacity-20 
                    group-hover:opacity-60 group-hover:w-32 group-hover:h-32 group-hover:-top-10 group-hover:-left-10 group-hover:blur-[40px]
                    group-focus-within:opacity-100 group-focus-within:w-48 group-focus-within:h-48 group-focus-within:-top-12 group-focus-within:-left-12 group-focus-within:blur-[60px]
                    transition-all duration-700 ease-out pointer-events-none mix-blend-screen
                  `}
                ></div>

                {/* Input Container */}
                <div className={`relative rounded-xl p-[1px] bg-gradient-to-br transition-all duration-500 shadow-lg z-10 ${effectiveAgentType === 'course_tutor' ? 'from-[#FF9300]/30 via-white/10 to-[#78C0F0]/10' : 'from-[#78C0F0]/30 via-white/10 to-[#FF9300]/10'}`}>
                  <div className="relative bg-[#0A0D12] rounded-xl overflow-hidden">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                      placeholder={effectiveAgentType === 'course_tutor' ? "Start tutoring session..." : "Ask a question..."}
                      className="
                        w-full bg-transparent
                        rounded-xl py-3.5 px-5 pr-12 
                        text-sm text-white 
                        placeholder-slate-500 
                        focus:outline-none 
                        transition-all duration-300
                      "
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20">
                      <button
                        onClick={() => handleSendMessage(input)}
                        className={`
                          p-2 rounded-lg 
                          bg-white/5 border border-white/10
                          text-slate-400
                          group-hover:text-white 
                          transition-all duration-300 
                          shadow-sm
                          ${effectiveAgentType === 'course_tutor' ? 'group-hover:bg-[#FF9300] group-hover:border-[#FF9300]' : 'group-hover:bg-[#78C0F0] group-hover:border-[#78C0F0] group-hover:text-black'}
                        `}>
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </>
        ) : (
          /* Collapsed State */
          <div
            className="flex-1 flex flex-col items-center pt-8 space-y-8 cursor-pointer hover:bg-white/5 transition-colors group"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-10 h-10 rounded-full bg-brand-blue/10 border border-brand-blue-light/30 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,147,0,0.4)] transition-all backdrop-blur-sm">
              <Flame size={18} className="text-brand-orange animate-pulse" />
            </div>
            <div className="vertical-text transform rotate-180 text-[10px] font-bold tracking-[0.3em] uppercase text-slate-500 group-hover:text-brand-orange whitespace-nowrap transition-colors drop-shadow-sm" style={{ writingMode: 'vertical-rl' }}>
              Ask Prometheus
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;