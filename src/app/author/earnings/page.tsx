import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
    DollarSign, TrendingUp, Clock, Percent, Calendar,
    ArrowUpRight, ArrowDownRight, CreditCard
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AuthorEarningsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Get the user's profile to find when they became an approved author
    const { data: profile } = await supabase
        .from('profiles')
        .select('author_status, application_submitted_at, created_at')
        .eq('id', user.id)
        .single();

    // Get current and previous month date ranges
    const now = new Date();
    const currentMonthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Determine the earliest date to show (when they became approved)
    // For now, we'll use their profile created_at as the approval date approximation
    // In a real system, you'd have an 'approved_at' timestamp
    const approvalDate = profile?.application_submitted_at
        ? new Date(profile.application_submitted_at)
        : new Date(profile?.created_at || now);

    // Calculate months since approval (max 12 months)
    const monthsSinceApproval = Math.min(
        12,
        Math.max(1, Math.ceil((now.getTime() - approvalDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
    );

    // Calculate months for history (only months since they were approved)
    const months = [];
    for (let i = 0; i < monthsSinceApproval; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        // Only include if this month is after or equal to approval date
        if (date >= new Date(approvalDate.getFullYear(), approvalDate.getMonth(), 1)) {
            months.push({
                label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
                end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString()
            });
        }
    }

    // Get author's courses
    const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .eq('author_id', user.id);

    const courseIds = courses?.map(c => c.id) || [];

    // Get monthly watch time for the author
    const monthlyData = await Promise.all(
        months.map(async (month) => {
            const { data: watchData } = await supabase
                .from('user_progress')
                .select('view_time_seconds')
                .in('course_id', courseIds.length > 0 ? courseIds : [-1])
                .gte('last_accessed', month.start)
                .lte('last_accessed', month.end);

            const { data: platformData } = await supabase
                .from('user_progress')
                .select('view_time_seconds')
                .gte('last_accessed', month.start)
                .lte('last_accessed', month.end);

            const authorMinutes = (watchData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
            const platformMinutes = (platformData?.reduce((sum, p) => sum + (p.view_time_seconds || 0), 0) || 0) / 60;
            const sharePercent = platformMinutes > 0 ? (authorMinutes / platformMinutes) * 100 : 0;

            return {
                ...month,
                authorMinutes,
                platformMinutes,
                sharePercent,
                // Mock earnings based on share (in a real app, this would come from actual payout records)
                estimatedPayout: sharePercent * 50 // Assume $5000 monthly pool
            };
        })
    );

    const currentMonth = monthlyData[0] || { sharePercent: 0, authorMinutes: 0, platformMinutes: 0, estimatedPayout: 0 };
    const previousMonth = monthlyData[1] || { sharePercent: 0, authorMinutes: 0, platformMinutes: 0, estimatedPayout: 0 };

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const shareTrend = previousMonth.sharePercent > 0
        ? ((currentMonth.sharePercent - previousMonth.sharePercent) / previousMonth.sharePercent) * 100
        : currentMonth.sharePercent > 0 ? 100 : 0;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Earnings</h1>
                <p className="text-slate-400">
                    Track your profit share and payout history.
                </p>
            </div>

            {/* Current Month Overview */}
            <div className="bg-gradient-to-r from-green-500/10 via-brand-blue-light/10 to-purple-500/10 border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-green-400" />
                        <h2 className="text-lg font-bold text-white">{currentMonthLabel}</h2>
                    </div>
                    <span className="text-xs text-slate-500">Current Period</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <Percent size={20} className="text-green-400" />
                            {shareTrend !== 0 && (
                                <span className={`text-xs font-bold flex items-center gap-0.5 ${shareTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {shareTrend > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(shareTrend).toFixed(0)}%
                                </span>
                            )}
                        </div>
                        <p className="text-3xl font-bold text-white">{currentMonth.sharePercent.toFixed(1)}%</p>
                        <p className="text-xs text-slate-500 mt-1">Profit Share</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5">
                        <Clock size={20} className="text-brand-blue-light mb-2" />
                        <p className="text-3xl font-bold text-white">{formatMinutes(currentMonth.authorMinutes)}</p>
                        <p className="text-xs text-slate-500 mt-1">Your Watch Time</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5">
                        <TrendingUp size={20} className="text-purple-400 mb-2" />
                        <p className="text-3xl font-bold text-white">{formatMinutes(currentMonth.platformMinutes)}</p>
                        <p className="text-xs text-slate-500 mt-1">Platform Total</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-5">
                        <DollarSign size={20} className="text-green-400 mb-2" />
                        <p className="text-3xl font-bold text-green-400">{formatCurrency(currentMonth.estimatedPayout)}</p>
                        <p className="text-xs text-slate-500 mt-1">Estimated Payout</p>
                    </div>
                </div>
            </div>

            {/* How Earnings Work */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-400" />
                    How You Earn
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-brand-blue-light/20 flex items-center justify-center text-brand-blue-light font-bold">1</div>
                        <h4 className="font-bold text-white">Watch Time</h4>
                        <p className="text-sm text-slate-400">
                            Learners watch your courses, accumulating watch time that counts toward your share.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 font-bold">2</div>
                        <h4 className="font-bold text-white">Share Calculation</h4>
                        <p className="text-sm text-slate-400">
                            Your profit share = Your watch time / Platform total watch time for the month.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">3</div>
                        <h4 className="font-bold text-white">Monthly Payout</h4>
                        <p className="text-sm text-slate-400">
                            Payouts are processed at the end of each month based on your share percentage.
                        </p>
                    </div>
                </div>
            </div>

            {/* Payout History */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CreditCard size={20} className="text-brand-blue-light" />
                        Payout History
                    </h3>
                </div>

                {monthlyData.length > 0 ? (
                    <div className="divide-y divide-white/5">
                        {/* Table Header */}
                        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div>Period</div>
                            <div className="text-right">Watch Time</div>
                            <div className="text-right">Share %</div>
                            <div className="text-right">Estimated Payout</div>
                            <div className="text-right">Status</div>
                        </div>

                        {monthlyData.map((month, index) => (
                            <div
                                key={month.label}
                                className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors"
                            >
                                <div className="font-medium text-white">{month.label}</div>
                                <div className="text-right text-slate-300">{formatMinutes(month.authorMinutes)}</div>
                                <div className="text-right">
                                    <span className="text-green-400 font-bold">{month.sharePercent.toFixed(1)}%</span>
                                </div>
                                <div className="text-right font-bold text-white">{formatCurrency(month.estimatedPayout)}</div>
                                <div className="text-right">
                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                                        index === 0
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : 'bg-green-500/20 text-green-400'
                                    }`}>
                                        {index === 0 ? 'In Progress' : 'Paid'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400">No payout history yet. Your earnings will appear here once you have watch time on your courses.</p>
                    </div>
                )}
            </div>

            {/* Payment Settings */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Payment Settings</h3>
                <p className="text-slate-400 mb-4">
                    Contact the platform administrator to update your payment details.
                </p>
                <a
                    href="mailto:experts@enhancedhr.ai"
                    className="inline-flex items-center gap-2 text-brand-blue-light hover:text-white transition-colors"
                >
                    Contact Support
                    <ArrowUpRight size={14} />
                </a>
            </div>
        </div>
    );
}
