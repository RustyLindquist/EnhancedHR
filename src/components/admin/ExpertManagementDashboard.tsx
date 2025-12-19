'use client';

import React, { useState } from 'react';
import {
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    ExternalLink,
    Loader2,
    Search,
    Filter,
    DollarSign,
    BookOpen,
    TrendingUp,
    Eye,
    ChevronDown,
    ChevronUp,
    Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Expert {
    id: string;
    full_name: string;
    email: string;
    author_bio: string;
    linkedin_url: string;
    author_status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    avatar_url?: string;
}

interface MonthlyStats {
    watchTimeMinutes: number;
    citations: number;
    courseCount: number;
}

interface ExpertManagementDashboardProps {
    experts: Expert[];
    monthlyStats: Record<string, MonthlyStats>;
    courseCountByAuthor: Record<string, number>;
    currentMonth: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function ExpertManagementDashboard({
    experts,
    monthlyStats,
    courseCountByAuthor,
    currentMonth
}: ExpertManagementDashboardProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const router = useRouter();

    // Filter experts
    const filteredExperts = experts.filter(expert => {
        const matchesStatus = statusFilter === 'all' || expert.author_status === statusFilter;
        const matchesSearch =
            expert.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expert.email?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Calculate summary stats
    const pendingCount = experts.filter(e => e.author_status === 'pending').length;
    const approvedCount = experts.filter(e => e.author_status === 'approved').length;
    const rejectedCount = experts.filter(e => e.author_status === 'rejected').length;

    // Calculate total monthly watch time and earnings
    const totalWatchTime = Object.values(monthlyStats).reduce((sum, s) => sum + s.watchTimeMinutes, 0);
    const totalCitations = Object.values(monthlyStats).reduce((sum, s) => sum + s.citations, 0);
    const totalEstimatedPayout = (totalWatchTime * 0.10) + (totalCitations * 0.50);

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        setProcessingId(userId);
        try {
            const res = await fetch('/api/admin/authors/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });

            if (!res.ok) throw new Error('Failed to process request');
            router.refresh();
        } catch (error) {
            console.error('Error processing expert:', error);
            alert('Failed to process request. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold">
                        <Clock size={12} /> Pending
                    </span>
                );
            case 'approved':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-bold">
                        <CheckCircle size={12} /> Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold">
                        <XCircle size={12} /> Rejected
                    </span>
                );
            default:
                return null;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pending Applications */}
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <AlertCircle className="text-yellow-400" size={24} />
                        <span className="text-3xl font-bold text-yellow-400">{pendingCount}</span>
                    </div>
                    <p className="text-sm text-slate-400">Pending Applications</p>
                    <p className="text-xs text-slate-500 mt-1">Awaiting review</p>
                </div>

                {/* Active Experts */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <Users className="text-green-400" size={24} />
                        <span className="text-3xl font-bold text-green-400">{approvedCount}</span>
                    </div>
                    <p className="text-sm text-slate-400">Active Experts</p>
                    <p className="text-xs text-slate-500 mt-1">Publishing content</p>
                </div>

                {/* Monthly Watch Time */}
                <div className="bg-brand-blue-light/5 border border-brand-blue-light/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <Clock className="text-brand-blue-light" size={24} />
                        <span className="text-3xl font-bold text-brand-blue-light">{formatMinutes(totalWatchTime)}</span>
                    </div>
                    <p className="text-sm text-slate-400">Watch Time ({currentMonth})</p>
                    <p className="text-xs text-slate-500 mt-1">{totalCitations} AI citations</p>
                </div>

                {/* Estimated Payout */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <DollarSign className="text-purple-400" size={24} />
                        <span className="text-3xl font-bold text-purple-400">{formatCurrency(totalEstimatedPayout)}</span>
                    </div>
                    <p className="text-sm text-slate-400">Est. Payout ({currentMonth})</p>
                    <p className="text-xs text-slate-500 mt-1">$0.10/min + $0.50/citation</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue-light/50"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-slate-500" />
                    <div className="flex gap-1">
                        {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                    ? 'bg-brand-blue-light text-brand-black'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                {status === 'pending' && pendingCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expert List */}
            <div className="space-y-3">
                {filteredExperts.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                        No experts found matching your criteria.
                    </div>
                ) : (
                    filteredExperts.map((expert) => {
                        const stats = monthlyStats[expert.id] || { watchTimeMinutes: 0, citations: 0, courseCount: 0 };
                        const totalCourses = courseCountByAuthor[expert.id] || 0;
                        const estimatedPayout = (stats.watchTimeMinutes * 0.10) + (stats.citations * 0.50);
                        const isExpanded = expandedId === expert.id;

                        return (
                            <div
                                key={expert.id}
                                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20"
                            >
                                {/* Main Row */}
                                <div className="p-5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                    {/* Expert Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue-light/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                                            {expert.avatar_url ? (
                                                <img src={expert.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold text-white">
                                                    {expert.full_name?.charAt(0) || '?'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-white truncate">
                                                    {expert.full_name || 'Unknown User'}
                                                </h3>
                                                {getStatusBadge(expert.author_status)}
                                            </div>
                                            <p className="text-sm text-slate-500 truncate">{expert.email}</p>
                                        </div>
                                    </div>

                                    {/* Stats (for approved experts) */}
                                    {expert.author_status === 'approved' && (
                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="text-center">
                                                <p className="text-white font-bold">{totalCourses}</p>
                                                <p className="text-slate-500 text-xs">Courses</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white font-bold">{formatMinutes(stats.watchTimeMinutes)}</p>
                                                <p className="text-slate-500 text-xs">Watch Time</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white font-bold">{stats.citations}</p>
                                                <p className="text-slate-500 text-xs">Citations</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-purple-400 font-bold">{formatCurrency(estimatedPayout)}</p>
                                                <p className="text-slate-500 text-xs">Est. Payout</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {expert.author_status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleAction(expert.id, 'reject')}
                                                    disabled={!!processingId}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm hover:bg-red-500/20 disabled:opacity-50 transition-colors flex items-center gap-1"
                                                >
                                                    {processingId === expert.id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAction(expert.id, 'approve')}
                                                    disabled={!!processingId}
                                                    className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm hover:bg-green-500/20 disabled:opacity-50 transition-colors flex items-center gap-1"
                                                >
                                                    {processingId === expert.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                                    Approve
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : expert.id)}
                                            className="p-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4">
                                        {/* Bio */}
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Professional Bio</h4>
                                            <p className="text-sm text-slate-300 bg-black/20 p-3 rounded-lg border border-white/5">
                                                {expert.author_bio || 'No bio provided'}
                                            </p>
                                        </div>

                                        {/* Links & Metadata */}
                                        <div className="flex flex-wrap gap-4">
                                            {expert.linkedin_url && (
                                                <a
                                                    href={expert.linkedin_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-brand-blue-light hover:underline flex items-center gap-1"
                                                >
                                                    LinkedIn Profile <ExternalLink size={12} />
                                                </a>
                                            )}
                                            <span className="text-sm text-slate-500">
                                                Applied: {new Date(expert.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-sm text-slate-500">
                                                Updated: {new Date(expert.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Monthly Performance (for approved) */}
                                        {expert.author_status === 'approved' && (
                                            <div className="bg-gradient-to-r from-purple-500/5 to-brand-blue-light/5 border border-white/10 rounded-lg p-4">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                    <TrendingUp size={14} /> {currentMonth} Performance
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-2xl font-bold text-white">{formatMinutes(stats.watchTimeMinutes)}</p>
                                                        <p className="text-xs text-slate-500">Total Watch Time</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-white">{stats.citations}</p>
                                                        <p className="text-xs text-slate-500">AI Citations</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.watchTimeMinutes * 0.10)}</p>
                                                        <p className="text-xs text-slate-500">Watch Earnings</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-2xl font-bold text-purple-400">{formatCurrency(stats.citations * 0.50)}</p>
                                                        <p className="text-xs text-slate-500">Citation Earnings</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                                                    <span className="text-sm text-slate-400">Estimated Total Payout</span>
                                                    <span className="text-xl font-bold text-brand-blue-light">{formatCurrency(estimatedPayout)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
