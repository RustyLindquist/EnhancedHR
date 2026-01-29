'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Users, BookOpen, Brain,
  Award, Target, Clock, BarChart3, MessageSquare, Zap,
  Sparkles
} from 'lucide-react';
import { getOrgDashboardMetrics, getGroupsForFilter, DashboardMetrics, GroupFilterOption } from '@/app/actions/org-dashboard';
import DateRangePicker from '@/components/org/DateRangePicker';
import DashboardFilterDropdown from '@/components/org/DashboardFilterDropdown';
import LearningTrendChart from '@/components/org/charts/LearningTrendChart';
import EngagementTrendsChart from '@/components/org/charts/EngagementTrendsChart';
import SkillsChart from '@/components/org/charts/SkillsChart';
import CanvasHeader from '@/components/CanvasHeader';
import { useBackHandler } from '@/hooks/useBackHandler';

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
  onBack?: () => void;
}

export default function OrgAnalyticsCanvas({ initialGroupId, onBack }: OrgAnalyticsCanvasProps) {

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

  // Register browser back button handler to use parent's onBack
  useBackHandler(onBack, { enabled: !!onBack });

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
            onBack={onBack}
            backLabel="Go Back"
          />
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
          onBack={onBack}
          backLabel="Go Back"
        />
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
    </div>
  );
}
