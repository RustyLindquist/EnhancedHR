'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2, TrendingUp, TrendingDown, Zap, Hash,
  Sparkles, Send, X, BarChart2, Lightbulb, Globe, BookOpen
} from 'lucide-react';
import {
  getAnalyticsScope,
  getAnalyticsContextString,
  getAnalyticsContext,
  type AnalyticsScope,
  type AnalyticsContext,
  type ExpertScopeFilter
} from '@/app/actions/cost-analytics';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function ExpertAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [scope, setScope] = useState<AnalyticsScope | null>(null);
  const [context, setContext] = useState<AnalyticsContext | null>(null);
  const [scopeFilter, setScopeFilter] = useState<ExpertScopeFilter>('personal');

  // AI Analytics Panel state
  const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(false);
  const [analyticsMessages, setAnalyticsMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
  const [analyticsInput, setAnalyticsInput] = useState('');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const analyticsMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [scopeFilter]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const userScope = await getAnalyticsScope();
      setScope(userScope);

      if (userScope && userScope.accessLevel === 'expert') {
        // Create scoped request with the filter
        const scopedRequest = {
          ...userScope,
          expertScopeFilter: scopeFilter
        };
        const analyticsData = await getAnalyticsContext(30, scopedRequest);
        setContext(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      // Get analytics context with current scope filter
      const analyticsContext = await getAnalyticsContextString(30, scopeFilter);

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
          pageContext: 'expert_analytics'
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

  // Suggested prompts for experts
  const suggestedPrompts = scopeFilter === 'platform' ? [
    "What topics are learners asking about most?",
    "What content gaps exist on the platform?",
    "What courses should I create to meet demand?",
    "What are the trending L&D topics?"
  ] : [
    "What questions do learners have about my courses?",
    "How can I improve my course content?",
    "What topics should I add to my courses?",
    "What are learners struggling with?"
  ];

  if (isLoading && !context) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  if (!scope || scope.accessLevel !== 'expert') {
    return (
      <div className="text-center py-20">
        <BarChart2 size={48} className="mx-auto text-slate-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Analytics Access</h2>
        <p className="text-slate-400">You need to be an approved expert to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Discover what learners are asking about and identify content opportunities
          </p>
        </div>
        <button
          onClick={() => setIsAnalyticsPanelOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium flex items-center gap-2 hover:from-amber-600 hover:to-orange-700 transition-all"
        >
          <Sparkles size={16} />
          Ask AI Analytics
        </button>
      </div>

      {/* Scope Toggle */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        <button
          onClick={() => setScopeFilter('personal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            scopeFilter === 'personal'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen size={16} />
          My Courses
        </button>
        <button
          onClick={() => setScopeFilter('platform')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
            scopeFilter === 'platform'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Globe size={16} />
          Platform-Wide
        </button>
      </div>

      {/* Scope Description */}
      <div className={`text-sm px-4 py-2 rounded-lg border ${
        scopeFilter === 'platform'
          ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
      }`}>
        {scopeFilter === 'platform'
          ? 'Viewing aggregated platform-wide insights. Individual conversations are anonymized for privacy.'
          : 'Viewing analytics for your courses only.'}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Requests Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Total Requests</span>
                <Hash size={16} className="text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-white">
                {context?.usageMetrics.totalRequests.toLocaleString() || '0'}
              </div>
              {context?.usageMetrics.requestsTrend && (
                <div className={`text-xs mt-1 flex items-center gap-1 ${
                  context.usageMetrics.requestsTrend === 'increasing' ? 'text-emerald-400' :
                  context.usageMetrics.requestsTrend === 'decreasing' ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {context.usageMetrics.requestsTrend === 'increasing' ? <TrendingUp size={12} /> :
                   context.usageMetrics.requestsTrend === 'decreasing' ? <TrendingDown size={12} /> : null}
                  {context.usageMetrics.requestsTrend}
                </div>
              )}
            </div>

            {/* Tokens Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Total Tokens</span>
                <Zap size={16} className="text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-white">
                {context?.usageMetrics.totalTokens ? (context.usageMetrics.totalTokens / 1000).toFixed(0) + 'K' : '0'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Avg: {context?.usageMetrics.avgTokensPerRequest.toFixed(0) || '0'} per request
              </div>
            </div>

            {/* Top Topic Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Top Topic</span>
                <Lightbulb size={16} className="text-slate-500" />
              </div>
              <div className="text-lg font-bold text-white truncate">
                {context?.topicSummary[0]?.topic || 'N/A'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {context?.topicSummary[0]?.percentage.toFixed(0) || '0'}% of conversations
              </div>
            </div>

            {/* Top Agent Card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Top Agent</span>
                <BarChart2 size={16} className="text-slate-500" />
              </div>
              <div className="text-lg font-bold text-white truncate">
                {context?.agentBreakdown[0]?.agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {context?.agentBreakdown[0]?.percentOfTotal.toFixed(0) || '0'}% of requests
              </div>
            </div>
          </div>

          {/* Topics & Agent Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Topics - This is the key insight for experts! */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-400" />
                {scopeFilter === 'platform' ? 'Platform Trending Topics' : 'Topics in Your Courses'}
              </h3>
              <div className="space-y-3">
                {context?.topicSummary.slice(0, 8).map((topic, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{topic.topic}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            scopeFilter === 'platform'
                              ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                              : 'bg-gradient-to-r from-amber-500 to-orange-600'
                          }`}
                          style={{ width: `${Math.min(topic.percentage * 2, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{topic.count}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-slate-500">No topics found yet</p>
                )}
              </div>
            </div>

            {/* Agent Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 size={16} className="text-purple-400" />
                Agent Usage
              </h3>
              <div className="space-y-3">
                {context?.agentBreakdown.slice(0, 5).map((agent, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      {agent.agent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          style={{ width: `${agent.percentOfTotal}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-12 text-right">{agent.requests}</span>
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-slate-500">No agent data yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Recent Questions / Topic Insights */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Lightbulb size={16} className="text-blue-400" />
              {scopeFilter === 'platform' ? 'Content Opportunity Insights' : 'Recent Learner Questions'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {context?.recentQuestions.slice(0, 6).map((question, i) => (
                <div key={i} className="p-3 bg-white/5 rounded-xl text-sm text-slate-300 border border-white/5">
                  {scopeFilter === 'platform' ? question : `"${question}"`}
                </div>
              )) || (
                <p className="text-sm text-slate-500">No recent data</p>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="text-center text-xs text-slate-500 py-4">
            {scopeFilter === 'platform'
              ? 'Platform analytics shows aggregated patterns only. Individual conversations are not accessible.'
              : 'Showing analytics from learner interactions with your courses.'}
          </div>
        </>
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
            <div className={`p-4 border-b border-white/10 flex items-center justify-between ${
              scopeFilter === 'platform'
                ? 'bg-gradient-to-r from-purple-500/10 to-purple-600/10'
                : 'bg-gradient-to-r from-amber-500/10 to-orange-600/10'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                  scopeFilter === 'platform'
                    ? 'bg-purple-500/20 border-purple-500/30'
                    : 'bg-amber-500/20 border-amber-500/30'
                }`}>
                  <Sparkles size={16} className={scopeFilter === 'platform' ? 'text-purple-400' : 'text-amber-400'} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">AI Analytics</h2>
                  <p className="text-[10px] text-slate-500">
                    {scopeFilter === 'platform' ? 'Platform insights' : 'Your course insights'}
                  </p>
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
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                      scopeFilter === 'platform'
                        ? 'bg-purple-500/20 border-purple-500/30'
                        : 'bg-amber-500/20 border-amber-500/30'
                    }`}>
                      <Sparkles size={14} className={scopeFilter === 'platform' ? 'text-purple-400' : 'text-amber-400'} />
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-xl rounded-tl-none text-sm text-slate-300">
                      {scopeFilter === 'platform' ? (
                        <>
                          <p>I can help you discover platform-wide content opportunities and trending topics.</p>
                          <p className="mt-2 text-slate-500 text-xs">Use these insights to create courses that meet learner demand.</p>
                        </>
                      ) : (
                        <>
                          <p>I can analyze your course conversations to help you improve your content.</p>
                          <p className="mt-2 text-slate-500 text-xs">Ask me about learner questions, struggles, or improvement ideas.</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Suggested Prompts */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Suggested Questions</p>
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => sendAnalyticsMessage(prompt)}
                        className={`w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white transition-all ${
                          scopeFilter === 'platform' ? 'hover:border-purple-500/30' : 'hover:border-amber-500/30'
                        }`}
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
                          ? scopeFilter === 'platform'
                            ? 'bg-purple-500/20 border border-purple-500/30 text-white rounded-tr-none'
                            : 'bg-amber-500/20 border border-amber-500/30 text-white rounded-tr-none'
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
                  placeholder={scopeFilter === 'platform' ? "Ask about platform trends..." : "Ask about your courses..."}
                  className={`w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 ${
                    scopeFilter === 'platform'
                      ? 'focus:border-purple-500/50 focus:ring-purple-500/20'
                      : 'focus:border-amber-500/50 focus:ring-amber-500/20'
                  }`}
                />
                <button
                  onClick={() => sendAnalyticsMessage(analyticsInput)}
                  disabled={isAnalyticsLoading || !analyticsInput.trim()}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    scopeFilter === 'platform'
                      ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-500/30 text-purple-400'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-400'
                  }`}
                >
                  <Send size={14} />
                </button>
              </div>
              <p className="text-[9px] text-slate-600 text-center mt-2">
                {scopeFilter === 'platform'
                  ? 'Platform data is aggregated and anonymized'
                  : 'Analyzing your course data'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
