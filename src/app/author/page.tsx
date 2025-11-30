import React from 'react';
import { Users, DollarSign, Star, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import CSVExportButton from '@/components/CSVExportButton';

export default async function AuthorDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Mock Data for Author Stats
    // In production, we would query:
    // - courses where author_id = user.id
    // - count distinct user_course_progress.user_id for those courses
    // - sum earnings from a payouts table
    const stats = [
        { label: 'Total Students', value: 1240, icon: Users, color: 'text-brand-blue-light' },
        { label: 'Total Earnings', value: '$12,450', icon: DollarSign, color: 'text-green-400' },
        { label: 'Avg. Rating', value: '4.8', icon: Star, color: 'text-yellow-400' },
        { label: 'Course Views', value: '45.2k', icon: TrendingUp, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
                    <p className="text-slate-400">Track your course performance and earnings.</p>
                </div>
                <CSVExportButton
                    data={stats}
                    filename="author-stats.csv"
                />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors h-32">
                        <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">+5%</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-96">
                    <h3 className="text-lg font-bold text-white mb-6">Earnings History</h3>
                    <div className="h-full flex items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                        Chart Placeholder
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-96">
                    <h3 className="text-lg font-bold text-white mb-6">Top Performing Courses</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div>
                                    <p className="font-bold text-white">Advanced Leadership Strategies</p>
                                    <p className="text-xs text-slate-400">Published Oct 12, 2024</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-blue-light">$4,240</p>
                                    <p className="text-xs text-slate-500">320 students</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
