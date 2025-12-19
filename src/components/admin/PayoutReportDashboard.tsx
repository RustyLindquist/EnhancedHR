'use client';

import React, { useState, useMemo } from 'react';
import {
    DollarSign,
    Clock,
    Sparkles,
    Download,
    ChevronDown,
    ChevronUp,
    Calendar,
    Users,
    TrendingUp,
    FileText,
    CheckCircle,
    AlertCircle,
    Percent
} from 'lucide-react';

interface CourseStats {
    courseId: number;
    courseTitle: string;
    watchTimeMinutes: number;
    citations: number;
}

interface MonthlyPayoutData {
    authorId: string;
    authorName: string;
    email: string;
    courses: CourseStats[];
    totalWatchTime: number;
    totalCitations: number;
}

interface GrandTotals {
    watchTime: number;
    citations: number;
}

interface MonthOption {
    label: string;
    startDate: string;
    endDate: string;
}

interface PayoutReportDashboardProps {
    payoutData: MonthlyPayoutData[];
    grandTotals: GrandTotals;
    months: MonthOption[];
    selectedMonth: string;
}

export default function PayoutReportDashboard({
    payoutData,
    grandTotals,
    months,
    selectedMonth
}: PayoutReportDashboardProps) {
    const [expandedAuthor, setExpandedAuthor] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(selectedMonth);
    const [profitAmount, setProfitAmount] = useState<string>('');

    const profitValue = parseFloat(profitAmount) || 0;

    // Calculate profit share for each expert based on watch time proportion
    const payoutWithShares = useMemo(() => {
        const totalWatchTime = grandTotals.watchTime;
        if (totalWatchTime === 0) return payoutData.map(a => ({ ...a, sharePercent: 0, payout: 0 }));

        return payoutData.map(author => {
            const sharePercent = (author.totalWatchTime / totalWatchTime) * 100;
            const payout = (sharePercent / 100) * profitValue;
            return {
                ...author,
                sharePercent,
                payout
            };
        });
    }, [payoutData, grandTotals.watchTime, profitValue]);

    const totalPayout = payoutWithShares.reduce((sum, a) => sum + a.payout, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes * 10) / 10}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const formatPercent = (percent: number) => {
        return `${percent.toFixed(2)}%`;
    };

    const exportToCSV = () => {
        const headers = ['Expert Name', 'Email', 'Watch Time (min)', 'Share %', 'Payout'];
        const rows = payoutWithShares.map(author => [
            author.authorName,
            author.email,
            author.totalWatchTime.toFixed(2),
            author.sharePercent.toFixed(2),
            author.payout.toFixed(2)
        ]);

        // Add totals row
        rows.push([
            'TOTAL',
            '',
            grandTotals.watchTime.toFixed(2),
            '100.00',
            totalPayout.toFixed(2)
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payout-report-${currentMonth.replace(' ', '-').toLowerCase()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Profit Input Section */}
            <div className="bg-gradient-to-r from-green-500/10 to-brand-blue-light/10 border border-green-500/30 rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                            <DollarSign size={20} className="text-green-400" />
                            Monthly Profit for Distribution
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Enter the total profit amount for this period. Expert payouts will be calculated as a percentage
                            of this amount based on their proportional watch time.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    value={profitAmount}
                                    onChange={(e) => setProfitAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="w-48 pl-8 pr-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white text-xl font-bold placeholder-slate-600 focus:outline-none focus:border-green-500/50"
                                />
                            </div>
                            <span className="text-slate-500 text-sm">for {currentMonth}</span>
                        </div>
                    </div>
                    {profitValue > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center min-w-[180px]">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Payout</p>
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalPayout)}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="text-brand-blue-light" size={20} />
                        <span className="text-2xl font-bold text-brand-blue-light">{payoutData.length}</span>
                    </div>
                    <p className="text-sm text-slate-400">Experts with Activity</p>
                </div>

                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="text-green-400" size={20} />
                        <span className="text-2xl font-bold text-green-400">{formatMinutes(grandTotals.watchTime)}</span>
                    </div>
                    <p className="text-sm text-slate-400">Total Watch Time</p>
                </div>

                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <Sparkles className="text-purple-400" size={20} />
                        <span className="text-2xl font-bold text-purple-400">{grandTotals.citations}</span>
                    </div>
                    <p className="text-sm text-slate-400">AI Citations</p>
                    <p className="text-xs text-slate-600 mt-1">For analytics only</p>
                </div>

                <div className="bg-gradient-to-r from-brand-blue-light/10 to-green-500/10 border border-white/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-2">
                        <Percent className="text-white" size={20} />
                        <span className="text-2xl font-bold text-white">
                            {profitValue > 0 ? formatCurrency(totalPayout) : '--'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-400">Total Payout Due</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                {/* Month Selector */}
                <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-slate-500" />
                    <select
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-blue-light/50"
                    >
                        {months.map(month => (
                            <option key={month.label} value={month.label}>{month.label}</option>
                        ))}
                    </select>
                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded">
                        Note: Month selection requires page refresh
                    </span>
                </div>

                {/* Export Button */}
                <button
                    onClick={exportToCSV}
                    disabled={profitValue <= 0}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-blue-light text-brand-black font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {/* Payout Model Info */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <AlertCircle size={20} className="text-brand-blue-light flex-shrink-0" />
                <div className="text-sm text-slate-400">
                    <strong className="text-white">Profit Share Model:</strong>{' '}
                    Each expert receives a percentage of the total profit based on their share of total watch time.
                    <span className="text-slate-500 ml-1">
                        (Expert Watch Time ÷ Total Watch Time × Profit = Payout)
                    </span>
                </div>
            </div>

            {/* Payout Table */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-white/5 border-b border-white/10 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-4">Expert</div>
                    <div className="col-span-2 text-right">Watch Time</div>
                    <div className="col-span-2 text-right">Citations</div>
                    <div className="col-span-2 text-right">Share %</div>
                    <div className="col-span-2 text-right">Payout</div>
                </div>

                {/* Table Body */}
                {payoutData.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No activity data for this month.
                    </div>
                ) : (
                    payoutWithShares.map((author, index) => {
                        const isExpanded = expandedAuthor === author.authorId;
                        return (
                            <div key={author.authorId}>
                                {/* Author Row */}
                                <div
                                    className={`grid grid-cols-12 gap-4 p-4 items-center cursor-pointer hover:bg-white/5 transition-colors ${index !== payoutWithShares.length - 1 ? 'border-b border-white/5' : ''
                                        }`}
                                    onClick={() => setExpandedAuthor(isExpanded ? null : author.authorId)}
                                >
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue-light/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-white">
                                                {author.authorName.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate">{author.authorName}</p>
                                            <p className="text-xs text-slate-500 truncate">{author.email}</p>
                                        </div>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                    <div className="col-span-2 text-right text-white font-medium">
                                        {formatMinutes(author.totalWatchTime)}
                                    </div>
                                    <div className="col-span-2 text-right text-purple-400 font-medium">
                                        {author.totalCitations}
                                    </div>
                                    <div className="col-span-2 text-right text-brand-blue-light font-medium">
                                        {formatPercent(author.sharePercent)}
                                    </div>
                                    <div className="col-span-2 text-right text-green-400 font-bold">
                                        {profitValue > 0 ? formatCurrency(author.payout) : '--'}
                                    </div>
                                </div>

                                {/* Expanded Course Details */}
                                {isExpanded && author.courses.length > 0 && (
                                    <div className="bg-black/20 border-t border-white/5 px-4 py-3">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <FileText size={12} /> Course Breakdown
                                        </p>
                                        <div className="space-y-2">
                                            {author.courses.map(course => {
                                                const courseSharePercent = grandTotals.watchTime > 0
                                                    ? (course.watchTimeMinutes / grandTotals.watchTime) * 100
                                                    : 0;
                                                const coursePayout = (courseSharePercent / 100) * profitValue;
                                                return (
                                                    <div key={course.courseId} className="grid grid-cols-12 gap-4 py-2 text-sm border-b border-white/5 last:border-0">
                                                        <div className="col-span-4 text-slate-300 truncate pl-11">
                                                            {course.courseTitle}
                                                        </div>
                                                        <div className="col-span-2 text-right text-slate-400">
                                                            {formatMinutes(course.watchTimeMinutes)}
                                                        </div>
                                                        <div className="col-span-2 text-right text-purple-400/70">
                                                            {course.citations}
                                                        </div>
                                                        <div className="col-span-2 text-right text-brand-blue-light/70">
                                                            {formatPercent(courseSharePercent)}
                                                        </div>
                                                        <div className="col-span-2 text-right text-green-400/70">
                                                            {profitValue > 0 ? formatCurrency(coursePayout) : '--'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Totals Row */}
                {payoutData.length > 0 && (
                    <div className="grid grid-cols-12 gap-4 p-4 bg-gradient-to-r from-brand-blue-light/10 to-green-500/10 border-t border-white/20 items-center">
                        <div className="col-span-4 font-bold text-white flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-400" />
                            TOTAL PAYOUT DUE
                        </div>
                        <div className="col-span-2 text-right text-white font-bold">
                            {formatMinutes(grandTotals.watchTime)}
                        </div>
                        <div className="col-span-2 text-right text-purple-400 font-bold">
                            {grandTotals.citations}
                        </div>
                        <div className="col-span-2 text-right text-brand-blue-light font-bold">
                            100.00%
                        </div>
                        <div className="col-span-2 text-right text-xl text-green-400 font-bold">
                            {profitValue > 0 ? formatCurrency(totalPayout) : '--'}
                        </div>
                    </div>
                )}
            </div>

            {/* Payment Instructions */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
                <h3 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
                    <AlertCircle size={20} /> Manual Payment Process
                </h3>
                <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                    <li>Enter the total profit amount for the period above</li>
                    <li>Review each expert's share percentage and calculated payout</li>
                    <li>Export the CSV report using the button above</li>
                    <li>Process payments via your preferred payment method (PayPal, Bank Transfer, etc.)</li>
                    <li>Keep records of all payments for tax purposes</li>
                </ol>
            </div>
        </div>
    );
}
