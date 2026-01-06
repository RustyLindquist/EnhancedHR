'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Loader2, TrendingUp, TrendingDown, Users, BookOpen, Brain,
  Award, Target, Clock, BarChart3, MessageSquare, Zap,
  Sparkles, Send, X
} from 'lucide-react';
import { getOrgDashboardMetrics, getGroupsForFilter, DashboardMetrics, GroupFilterOption } from '@/app/actions/org-dashboard';
import DateRangePicker from '@/components/org/DateRangePicker';
import DashboardFilterDropdown from '@/components/org/DashboardFilterDropdown';
import LearningTrendChart from '@/components/org/charts/LearningTrendChart';
import EngagementTrendsChart from '@/components/org/charts/EngagementTrendsChart';
import SkillsChart from '@/components/org/charts/SkillsChart';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CanvasHeader from '@/components/CanvasHeader';
import { getAnalyticsContextString } from '@/app/actions/cost-analytics';

// Loading Skeleton Components
const DashboardSkeleton = () => (
  <div className="space-y-6 pb-20 animate-pulse px-8 pt-8 pl-20">
    {/* Settings For Analysis skeleton */}
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <div className="h-4 bg-white/10 rounded w-40 mb-4"></div>
      <div className="flex flex-col sm:flex-row items-stretch gap-0">
        <div className="flex-shrink-0 min-w-[200px] max-w-sm pr-6">
          <div className="h-10 bg-white/10 rounded-xl w-full"></div>
        </div>
        <div className="hidden sm:block w-px bg-white/10 mx-2"></div>
        <div className="flex-1 pl-6 pt-4 sm:pt-0">
          <div className="flex flex-wrap gap-2 mb-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-7 bg-white/10 rounded-full w-14"></div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 bg-white/10 rounded-xl w-32"></div>
            <div className="h-4 bg-white/10 rounded w-6"></div>
            <div className="h-9 bg-white/10 rounded-xl w-32"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Engagement Metrics skeleton */}
    <div className="space-y-4">
      <div className="h-6 bg-white/10 rounded w-48"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-8 bg-white/10 rounded w-16"></div>
          </div>
        ))}
      </div>
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <div className="h-4 bg-white/10 rounded w-32 mb-4"></div>
        <div className="h-48 lg:h-64 bg-white/10 rounded"></div>
      </div>
    </div>

    {/* Learning Metrics skeleton */}
    <div className="space-y-4">
      <div className="h-6 bg-white/10 rounded w-48"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-8 bg-white/10 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Empty State Component
const EmptyState = ({ title, message, icon: Icon }: { title: string; message: string; icon: React.ElementType }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-slate-500" />
    </div>
    <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-md">{message}</p>
  </div>
);

// StatCard Component
interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon, color = 'text-white', trend }) => (
  <div className="bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-xs text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    {subtext && (
      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
        {trend === 'up' && <TrendingUp size={12} className="text-emerald-400" />}
        {trend === 'down' && <TrendingDown size={12} className="text-rose-400" />}
        {subtext}
      </div>
    )}
  </div>
);

interface OrgAnalyticsCanvasProps {
  initialGroupId?: string;
}

export default function OrgAnalyticsCanvas({ initialGroupId }: OrgAnalyticsCanvasProps) {
  // Calculate default date range (30 days ago to today)
  const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return { start, end };
  };

  const { start: defaultStart, end: defaultEnd } = getDefaultDates();

  // State
  const [startDate, setStartDate] = useState<Date>(defaultStart);
  const [endDate, setEndDate] = useState<Date>(defaultEnd);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId || null);
  const [groups, setGroups] = useState<GroupFilterOption[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI Analytics Panel state
  const [isAnalyticsPanelOpen, setIsAnalyticsPanelOpen] = useState(false);
  const [analyticsMessages, setAnalyticsMessages] = useState<Array<{ role: 'user' | 'model'; content: string }>>([]);
  const [analyticsInput, setAnalyticsInput] = useState('');
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const analyticsMessagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      const groupsData = await getGroupsForFilter();
      setGroups(groupsData);
    };
    fetchGroups();
  }, []);

  // Fetch metrics when filters change
  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await getOrgDashboardMetrics({
          startDate,
          endDate,
          groupId: selectedGroupId || undefined,
        });
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, [startDate, endDate, selectedGroupId]);

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
      // Get analytics context (role-scoped automatically)
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
          pageContext: 'org_analytics'
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

  // Suggested prompts for org admins
  const suggestedPrompts = [
    "What topics are my team members asking about?",
    "Suggest L&D priorities based on conversations",
    "What skill gaps do you identify?",
    "Propose a training plan based on patterns"
  ];

  const handleDateChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleGroupChange = (groupId: string | null) => {
    setSelectedGroupId(groupId);
  };

  // Format helpers
  const formatMinutes = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.round(minutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  };

  const formatAvgSessions = (totalUsers: number) => {
    if (!metrics || totalUsers === 0) return '0';
    return (metrics.activeUsers / totalUsers).toFixed(1);
  };

  // Show skeleton during initial load
  if (isLoading && !metrics) {
    return (
      <div className="flex flex-col w-full relative">
        <div className="sticky top-0 z-50">
          <CanvasHeader
            context="organization"
            title="Analytics"
          >
            <div className="h-10 bg-white/10 rounded-xl w-32 animate-pulse"></div>
          </CanvasHeader>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full relative">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50">
        <CanvasHeader
          context="organization"
          title="Analytics"
        >
          <button
            onClick={() => setIsAnalyticsPanelOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 hover:from-purple-600 hover:to-purple-700 transition-all whitespace-nowrap text-sm"
          >
            <Sparkles size={16} />
            AI Insights
          </button>
        </CanvasHeader>
      </div>

      {/* Scrollable Content */}
      <div className="w-full max-w-[1600px] mx-auto px-8 pb-32 animate-fade-in relative z-10 pt-8 pl-20 space-y-6">
        {/* Settings For Analysis Container */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Settings For Analysis</h3>
          <div className="flex flex-col sm:flex-row items-stretch gap-0">
            {/* Group Selector (Left) */}
            <div className="flex-shrink-0 min-w-[200px] max-w-sm pr-6">
              <DashboardFilterDropdown
                selectedGroupId={selectedGroupId}
                groups={groups}
                onGroupChange={handleGroupChange}
              />
            </div>
            {/* Vertical Separator */}
            <div className="hidden sm:block w-px bg-white/10 mx-2" />
            {/* Date Range Picker (Right) */}
            <div className="flex-1 pl-6 pt-4 sm:pt-0">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onDateChange={handleDateChange}
              />
            </div>
          </div>
        </div>

        {/* Engagement Metrics Row */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-brand-blue-light" />
            Engagement Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Users"
              value={metrics?.activeUsers.toLocaleString() || '0'}
              subtext={`of ${metrics?.totalUsers || 0} total`}
              icon={<Users size={16} className="text-brand-blue-light" />}
              color="text-brand-blue-light"
            />
            <StatCard
              label="Engagement Rate"
              value={`${metrics?.engagementRate || 0}%`}
              icon={<Target size={16} className="text-emerald-400" />}
              color="text-emerald-400"
            />
            <StatCard
              label="Total Members"
              value={metrics?.totalUsers.toLocaleString() || '0'}
              icon={<Users size={16} className="text-slate-400" />}
            />
            <StatCard
              label="Avg Sessions/User"
              value={formatAvgSessions(metrics?.totalUsers || 0)}
              icon={<BarChart3 size={16} className="text-purple-400" />}
              color="text-purple-400"
            />
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Engagement Trends</h3>
            {metrics?.dailyEngagementTrends && metrics.dailyEngagementTrends.length > 0 ? (
              <div className="h-56 lg:h-72">
                <EngagementTrendsChart data={metrics.dailyEngagementTrends} />
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No Engagement Data Yet"
                message="Engagement data will appear as team members start exploring courses and content."
              />
            )}
          </div>
        </div>

        {/* Learning Metrics Row */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-purple-400" />
            Learning Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Learning Time"
              value={formatMinutes(metrics?.totalLearningMinutes || 0)}
              icon={<Clock size={16} className="text-purple-400" />}
              color="text-purple-400"
            />
            <StatCard
              label="Avg Per User"
              value={formatMinutes(metrics?.avgLearningMinutes || 0)}
              icon={<Clock size={16} className="text-cyan-400" />}
              color="text-cyan-400"
            />
            <StatCard
              label="Courses Completed"
              value={metrics?.coursesCompleted.toLocaleString() || '0'}
              icon={<BookOpen size={16} className="text-emerald-400" />}
              color="text-emerald-400"
            />
            <StatCard
              label="Lessons Completed"
              value={metrics?.lessonsCompleted.toLocaleString() || '0'}
              icon={<Target size={16} className="text-amber-400" />}
              color="text-amber-400"
            />
          </div>
          <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <h3 className="text-sm font-bold text-slate-300 mb-4">Learning Trend (Minutes)</h3>
            {metrics?.dailyLearning && metrics.dailyLearning.length > 0 ? (
              <div className="h-48 lg:h-64">
                <LearningTrendChart data={metrics.dailyLearning} />
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No Learning Activity Yet"
                message="Learning trends will appear as team members complete lessons and courses. Encourage your team to start exploring!"
              />
            )}
          </div>
        </div>

        {/* AI Usage Metrics Row */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Brain size={20} className="text-purple-400" />
            AI Usage Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Conversations"
              value={metrics?.totalConversations.toLocaleString() || '0'}
              icon={<MessageSquare size={16} className="text-purple-400" />}
              color="text-purple-400"
            />
            <StatCard
              label="Total Interactions"
              value={metrics?.totalInteractions.toLocaleString() || '0'}
              icon={<Zap size={16} className="text-amber-400" />}
              color="text-amber-400"
            />
            <StatCard
              label="Avg Per User"
              value={metrics?.avgConversationsPerUser.toFixed(1) || '0'}
              icon={<BarChart3 size={16} className="text-cyan-400" />}
              color="text-cyan-400"
            />
            <StatCard
              label="Insights Generated"
              value={Math.round((metrics?.totalInteractions || 0) * 0.7).toLocaleString()}
              subtext="Estimated from interactions"
              icon={<Sparkles size={16} className="text-purple-400" />}
              color="text-purple-400"
            />
          </div>
        </div>

        {/* Certifications & Skills Row */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award size={20} className="text-amber-400" />
            Certifications & Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="SHRM Credits"
              value={metrics?.shrmiCredits.toFixed(1) || '0'}
              icon={<Award size={16} className="text-amber-400" />}
              color="text-amber-400"
            />
            <StatCard
              label="HRCI Credits"
              value={metrics?.hrciCredits.toFixed(1) || '0'}
              icon={<Award size={16} className="text-emerald-400" />}
              color="text-emerald-400"
            />
            <div className="md:col-span-1 bg-white/5 p-6 rounded-xl border border-white/10">
              <h3 className="text-sm font-bold text-slate-300 mb-4">Top Skills</h3>
              {metrics?.topSkills && metrics.topSkills.length > 0 ? (
                <SkillsChart data={metrics.topSkills} />
              ) : (
                <EmptyState
                  icon={Target}
                  title="No Skills Data Yet"
                  message="Skills data will appear as team members complete courses and earn certifications."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analytics Panel (Right Side) */}
      <div
        className={`
          fixed right-0 top-0 h-full z-50
          bg-[#0A0D12] border-l border-white/10
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isAnalyticsPanelOpen ? 'w-full sm:w-96 translate-x-0' : 'w-0 translate-x-full'}
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
                  <p className="text-[10px] text-slate-500">Org insights & L&D recommendations</p>
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
                      <p>I can analyze your organization&apos;s AI conversations to identify learning needs, skill gaps, and training opportunities.</p>
                      <p className="mt-2 text-slate-500 text-xs">Your team&apos;s privacy is protected - I only see aggregated patterns.</p>
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
                        Analyzing your organization&apos;s data...
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
                  placeholder="Ask about team patterns..."
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
              <p className="text-[9px] text-slate-600 text-center mt-2">Privacy-preserving analytics for your organization</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
