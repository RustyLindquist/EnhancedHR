import React from 'react';
import Link from 'next/link';
import { BookOpen, Users, BarChart3, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Fetch quick stats
    const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    // Mock stats for now
    const stats = [
        { label: 'Total Courses', value: courseCount || 0, icon: BookOpen, color: 'text-brand-blue-light' },
        { label: 'Total Users', value: userCount || 0, icon: Users, color: 'text-purple-400' },
        { label: 'Active Trials', value: 12, icon: BarChart3, color: 'text-brand-orange' }, // Mock
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                    <p className="text-slate-400">Overview of platform activity.</p>
                </div>
                <Link
                    href="/admin/courses/new"
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-light text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-colors"
                >
                    <Plus size={16} /> New Course
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/10 transition-colors">
                        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity (Placeholder) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                <div className="text-center py-12 text-slate-500 border border-dashed border-white/10 rounded-xl">
                    No recent activity to show.
                </div>
            </div>
        </div>
    );
}
