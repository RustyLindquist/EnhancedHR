'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Users, BookOpen, Brain,
  Award, Target, Clock, BarChart3, MessageSquare, Zap,
  Sparkles
} from 'lucide-react';
import { getOrgDashboardMetrics, getGroupsForFilter, DashboardMetrics, GroupFilterOption } from '@/app/actions/org-dashboard';
import DateRangePicker from '@/components/org/DateRangePicker';
import DashboardFilterDropdown from '@/components/org/DashboardFilterDropdown';
import LearningTrendChart from '@/components/org/charts/LearningTrendChart';
import EngagementChart from '@/components/org/charts/EngagementChart';
import SkillsChart from '@/components/org/charts/SkillsChart';

// Loading Skeleton Components
const DashboardSkeleton = () => (
  <div className="space-y-6 pb-20 animate-pulse">
    {/* Header skeleton */}
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
      <div>
        <div className="h-8 bg-white/10 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-64"></div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-10 bg-white/10 rounded-xl w-64"></div>
        <div className="h-10 bg-white/10 rounded-xl w-32"></div>
      </div>
    </div>

    {/* Group Filter skeleton */}
    <div className="max-w-sm">
      <div className="h-10 bg-white/10 rounded-xl w-full"></div>
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
      <div className="bg-white/5 p-6 rounded-xl border border-white/10">
        <div className="h-4 bg-white/10 rounded w-32 mb-4"></div>
        <div className="h-48 lg:h-64 bg-white/10 rounded"></div>
      </div>
    </div>

    {/* AI Usage skeleton */}
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

    {/* Certifications skeleton */}
    <div className="space-y-4">
      <div className="h-6 bg-white/10 rounded w-48"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
            <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
            <div className="h-8 bg-white/10 rounded w-16"></div>
          </div>
        ))}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <div className="h-4 bg-white/10 rounded w-24 mb-4"></div>
          <div className="h-64 bg-white/10 rounded"></div>
        </div>
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

export default function OrgDashboardPage() {
  const searchParams = useSearchParams();

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
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<GroupFilterOption[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for groupId in URL params
  const [isDeepLinked, setIsDeepLinked] = useState(false);

  useEffect(() => {
    const groupIdParam = searchParams.get('groupId');
    if (groupIdParam) {
      setSelectedGroupId(groupIdParam);
      setIsDeepLinked(true);
      // Clear the deep link indicator after 5 seconds
      setTimeout(() => setIsDeepLinked(false), 5000);
    }
  }, [searchParams]);

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
    // Rough estimate: active users as proxy for sessions
    return (metrics.activeUsers / totalUsers).toFixed(1);
  };

  // Show skeleton during initial load
  if (isLoading && !metrics) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Org Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Insights into your organization's learning journey
          </p>
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
      </div>

      {/* Deep Link Notice (when navigating from Group page) */}
      {isDeepLinked && selectedGroupId && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <TrendingUp size={16} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-300">
              Viewing: {groups.find(g => g.id === selectedGroupId)?.name || 'Group'}
            </p>
            <p className="text-xs text-purple-400/70">
              Full analytics for this group
            </p>
          </div>
        </div>
      )}

      {/* Group Filter */}
      <div className="max-w-sm">
        <DashboardFilterDropdown
          selectedGroupId={selectedGroupId}
          groups={groups}
          onGroupChange={handleGroupChange}
        />
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
          <h3 className="text-sm font-bold text-slate-300 mb-4">Daily Active Users</h3>
          {metrics?.dailyEngagement && metrics.dailyEngagement.length > 0 ? (
            <div className="h-48 lg:h-64">
              <EngagementChart data={metrics.dailyEngagement} />
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
  );
}
