import React from 'react';
import Link from 'next/link';
import { BookOpen, UserCheck, TrendingUp, Users, Plus } from 'lucide-react';
import { fetchAdminDashboardStats, AdminDashboardStats } from '@/app/actions/admin-stats';
import CSVExportButton from '@/components/CSVExportButton';
import PlatformActivityWidget from '@/components/admin/PlatformActivityWidget';

// Category card group configurations
const CATEGORIES: {
    key: keyof AdminDashboardStats;
    title: string;
    icon: React.ElementType;
    iconColor: string;
    stats: { key: string; label: string; color: string; format?: 'hours' }[];
}[] = [
    {
        key: 'courses',
        title: 'Courses',
        icon: BookOpen,
        iconColor: 'text-brand-blue-light',
        stats: [
            { key: 'published', label: 'Published', color: 'text-emerald-400' },
            { key: 'pendingReview', label: 'Pending Review', color: 'text-blue-400' },
            { key: 'draft', label: 'Draft', color: 'text-slate-400' },
            { key: 'archived', label: 'Archived', color: 'text-slate-500' },
            { key: 'totalHours', label: 'Hours', color: 'text-brand-blue-light', format: 'hours' },
            { key: 'totalWatchTimeHours', label: 'Watch Time', color: 'text-purple-400', format: 'hours' },
            { key: 'aiCitations', label: 'AI Citations', color: 'text-amber-400' },
            { key: 'modules', label: 'Modules', color: 'text-cyan-400' },
            { key: 'lessons', label: 'Lessons', color: 'text-indigo-400' },
            { key: 'resources', label: 'Resources', color: 'text-pink-400' },
            { key: 'quizzes', label: 'Quizzes', color: 'text-orange-400' },
        ],
    },
    {
        key: 'experts',
        title: 'Experts',
        icon: UserCheck,
        iconColor: 'text-purple-400',
        stats: [
            { key: 'approved', label: 'Approved', color: 'text-emerald-400' },
            { key: 'pending', label: 'Pending', color: 'text-amber-400' },
            { key: 'rejected', label: 'Rejected', color: 'text-red-400' },
            { key: 'standalone', label: 'Standalone', color: 'text-slate-400' },
        ],
    },
    {
        key: 'leads',
        title: 'Leads',
        icon: TrendingUp,
        iconColor: 'text-emerald-400',
        stats: [
            { key: 'new', label: 'New', color: 'text-brand-blue-light' },
            { key: 'contacted', label: 'Contacted', color: 'text-amber-400' },
            { key: 'qualified', label: 'Qualified', color: 'text-purple-400' },
            { key: 'converted', label: 'Converted', color: 'text-emerald-400' },
            { key: 'closed', label: 'Closed', color: 'text-slate-500' },
        ],
    },
    {
        key: 'accounts',
        title: 'Accounts',
        icon: Users,
        iconColor: 'text-amber-400',
        stats: [
            { key: 'active', label: 'Active', color: 'text-emerald-400' },
            { key: 'trials', label: 'Trials', color: 'text-brand-blue-light' },
            { key: 'individualPaid', label: 'Individual Paid', color: 'text-purple-400' },
            { key: 'orgs', label: 'Orgs', color: 'text-amber-400' },
            { key: 'employees', label: 'Employees', color: 'text-cyan-400' },
        ],
    },
];

function flattenStats(stats: AdminDashboardStats): Record<string, string | number>[] {
    return CATEGORIES.flatMap(cat =>
        cat.stats.map(s => ({
            category: cat.title,
            stat: s.label,
            value: (stats[cat.key] as any)[s.key] ?? 0,
        }))
    );
}

function formatStatValue(value: number, format?: string): string {
    if (format === 'hours') {
        return value >= 1 ? `${value}h` : `${Math.round(value * 60)}m`;
    }
    return value.toLocaleString();
}

export default async function AdminDashboardPage() {
    const stats = await fetchAdminDashboardStats();

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-slate-400">Overview of platform activity.</p>
                </div>
                <div className="flex gap-4">
                    <CSVExportButton
                        data={flattenStats(stats)}
                        filename="platform-stats.csv"
                    />
                    <Link
                        href="/admin/courses/new"
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-colors"
                    >
                        <Plus size={16} /> New Course
                    </Link>
                </div>
            </div>

            {/* Category Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const categoryData = stats[cat.key] as Record<string, number>;
                    return (
                        <div key={cat.key} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Icon size={18} className={cat.iconColor} />
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{cat.title}</h3>
                            </div>
                            <div className={`grid gap-3 ${
                                cat.stats.length <= 5 ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-3 sm:grid-cols-4'
                            }`}>
                                {cat.stats.map((s) => (
                                    <div
                                        key={s.key}
                                        className="bg-white/[0.03] rounded-xl p-3 hover:bg-white/[0.06] transition-[background-color,transform] duration-300 hover:scale-[1.03] flex flex-col items-center justify-center text-center cursor-default"
                                    >
                                        <div className={`text-xl font-bold ${s.color} leading-none`}>
                                            {formatStatValue(categoryData[s.key] ?? 0, s.format)}
                                        </div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-1.5">
                                            {s.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Activity Separator */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Recent Activity</span>
                <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Platform Activity Widget */}
            <PlatformActivityWidget />
        </div>
    );
}
