import React from 'react';
import { Users, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export default async function OrgDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get Org ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user?.id)
        .single();

    if (!profile?.org_id) return <div>Access Denied</div>;

    // Fetch Stats (Mocked for now, but structure is ready)
    // In real implementation, we'd do a count on profiles where org_id = profile.org_id
    const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', profile.org_id);

    const stats = [
        { label: 'Total Members', value: memberCount || 1, icon: Users, color: 'text-brand-blue-light' },
        { label: 'Active Learners', value: Math.ceil((memberCount || 1) * 0.8), icon: TrendingUp, color: 'text-green-400' },
        { label: 'Learning Hours', value: 124, icon: Clock, color: 'text-brand-orange' },
        { label: 'Courses Completed', value: 45, icon: BookOpen, color: 'text-purple-400' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
                <p className="text-slate-400">Welcome back. Here's how your team is performing.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/10 transition-colors h-32">
                        <div className="flex justify-between items-start">
                            <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts / Activity Area (Placeholder) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-96">
                    <h3 className="text-lg font-bold text-white mb-6">Learning Activity</h3>
                    <div className="h-full flex items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                        Chart Placeholder
                    </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-96">
                    <h3 className="text-lg font-bold text-white mb-6">Top Learners</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        JD
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Jane Doe</p>
                                        <p className="text-xs text-slate-400">Product Designer</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-blue-light">1,240 pts</p>
                                    <p className="text-xs text-slate-500">12 hrs</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
