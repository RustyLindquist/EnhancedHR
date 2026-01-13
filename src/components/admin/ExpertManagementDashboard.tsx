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
    Sparkles,
    ChevronRight,
    Shield,
    UserPlus,
    UserCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StandaloneExpert } from '@/types';

interface Expert {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string;
    author_bio: string;
    linkedin_url: string;
    author_status: 'pending' | 'approved' | 'rejected' | 'none';
    created_at: string;
    avatar_url?: string;
    credentials?: string;
    course_proposal_title?: string;
    course_proposal_description?: string;
    application_status?: string;
    application_submitted_at?: string;
    role?: string;
    expert_title?: string;
}

interface MonthlyStats {
    watchTimeMinutes: number;
    citations: number;
    courseCount: number;
}

interface ExpertManagementDashboardProps {
    experts: Expert[];
    standaloneExperts: StandaloneExpert[];
    monthlyStats: Record<string, MonthlyStats>;
    courseCountByAuthor: Record<string, number>;
    courseCountByStandaloneExpert: Record<string, number>;
    currentMonth: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'admin' | 'standalone';

export default function ExpertManagementDashboard({
    experts,
    standaloneExperts,
    monthlyStats,
    courseCountByAuthor,
    courseCountByStandaloneExpert,
    currentMonth
}: ExpertManagementDashboardProps) {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    const handleRowClick = (expertId: string) => {
        router.push(`/admin/experts/${expertId}`);
    };

    // Helper to check if expert is a platform admin
    const isAdmin = (expert: Expert) => expert.role === 'admin';

    // Filter experts
    const filteredExperts = experts.filter(expert => {
        let matchesStatus = false;
        if (statusFilter === 'all') {
            matchesStatus = true;
        } else if (statusFilter === 'admin') {
            matchesStatus = isAdmin(expert);
        } else {
            matchesStatus = expert.author_status === statusFilter && !isAdmin(expert);
        }
        const matchesSearch =
            expert.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expert.email?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Calculate summary stats
    const pendingCount = experts.filter(e => e.author_status === 'pending' && !isAdmin(e)).length;
    const approvedCount = experts.filter(e => e.author_status === 'approved' || isAdmin(e)).length;
    const adminCount = experts.filter(e => isAdmin(e)).length;
    const standaloneCount = standaloneExperts.filter(e => e.is_active).length;

    // Calculate total monthly watch time
    const totalWatchTime = Object.values(monthlyStats).reduce((sum, s) => sum + s.watchTimeMinutes, 0);
    const totalCitations = Object.values(monthlyStats).reduce((sum, s) => sum + s.citations, 0);

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

    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${Math.round(minutes)}m`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours}h ${mins}m`;
    };

    const formatPercent = (expertWatchTime: number) => {
        if (totalWatchTime === 0) return '0%';
        return `${((expertWatchTime / totalWatchTime) * 100).toFixed(1)}%`;
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
                    <p className="text-xs text-slate-500 mt-1">For profit share calculation</p>
                </div>

                {/* AI Citations */}
                <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                        <Sparkles className="text-purple-400" size={24} />
                        <span className="text-3xl font-bold text-purple-400">{totalCitations}</span>
                    </div>
                    <p className="text-sm text-slate-400">AI Citations ({currentMonth})</p>
                    <p className="text-xs text-slate-500 mt-1">Content quality indicator</p>
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
                    <div className="flex gap-1 flex-wrap">
                        {(['all', 'pending', 'approved', 'admin', 'standalone', 'rejected'] as StatusFilter[]).map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                                    ? status === 'admin' ? 'bg-purple-500 text-white'
                                    : status === 'standalone' ? 'bg-amber-500 text-white'
                                    : 'bg-brand-blue-light text-brand-black'
                                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                    }`}
                            >
                                {status === 'admin' ? 'Admins' : status === 'standalone' ? 'Standalone' : status.charAt(0).toUpperCase() + status.slice(1)}
                                {status === 'pending' && pendingCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                                        {pendingCount}
                                    </span>
                                )}
                                {status === 'admin' && adminCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                                        {adminCount}
                                    </span>
                                )}
                                {status === 'standalone' && standaloneCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded text-xs">
                                        {standaloneCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Add Expert Button */}
                <button
                    onClick={() => router.push('/admin/experts/standalone/new')}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-medium text-sm transition-colors flex items-center gap-2"
                >
                    <UserPlus size={16} />
                    Add Expert
                </button>
            </div>

            {/* Expert List */}
            <div className="space-y-3">
                {/* Regular Experts (when not filtering by standalone) */}
                {statusFilter !== 'standalone' && filteredExperts.map((expert) => {
                    const stats = monthlyStats[expert.id] || { watchTimeMinutes: 0, citations: 0, courseCount: 0 };
                    const totalCourses = courseCountByAuthor[expert.id] || 0;
                    const sharePercent = formatPercent(stats.watchTimeMinutes);

                    return (
                        <div
                            key={expert.id}
                            onClick={() => handleRowClick(expert.id)}
                            className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20 hover:bg-white/[0.07] cursor-pointer group"
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
                                            <h3 className="text-lg font-bold text-white truncate group-hover:text-brand-blue-light transition-colors">
                                                {expert.full_name || 'Unknown User'}
                                            </h3>
                                            {isAdmin(expert) ? (
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold border border-purple-500/20">
                                                    <Shield size={12} /> Platform Admin
                                                </span>
                                            ) : (
                                                getStatusBadge(expert.author_status)
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 truncate">{expert.email}</p>
                                        {expert.expert_title && (
                                            <p className="text-xs text-slate-600 truncate mt-0.5">{expert.expert_title}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Stats (for approved experts and admins) */}
                                {(expert.author_status === 'approved' || isAdmin(expert)) && (
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
                                            <p className="text-purple-400 font-bold">{stats.citations}</p>
                                            <p className="text-slate-500 text-xs">Citations</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-brand-blue-light font-bold">{sharePercent}</p>
                                            <p className="text-slate-500 text-xs">Share</p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {expert.author_status === 'pending' && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAction(expert.id, 'reject');
                                                }}
                                                disabled={!!processingId}
                                                className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm hover:bg-red-500/20 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            >
                                                {processingId === expert.id ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                                Reject
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAction(expert.id, 'approve');
                                                }}
                                                disabled={!!processingId}
                                                className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm hover:bg-green-500/20 disabled:opacity-50 transition-colors flex items-center gap-1"
                                            >
                                                {processingId === expert.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                                Approve
                                            </button>
                                        </>
                                    )}
                                    <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Standalone Experts (when filtering by all or standalone) */}
                {(statusFilter === 'all' || statusFilter === 'standalone') && standaloneExperts
                    .filter(expert =>
                        searchQuery === '' ||
                        expert.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        expert.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((expert) => {
                        const totalCourses = courseCountByStandaloneExpert[expert.id] || 0;

                        return (
                            <div
                                key={`standalone-${expert.id}`}
                                onClick={() => router.push(`/admin/experts/standalone/${expert.id}`)}
                                className="bg-white/5 border border-amber-500/20 rounded-xl overflow-hidden transition-all hover:border-amber-500/40 hover:bg-white/[0.07] cursor-pointer group"
                            >
                                {/* Main Row */}
                                <div className="p-5 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                    {/* Expert Info */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center flex-shrink-0">
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
                                                <h3 className="text-lg font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                                                    {expert.full_name || 'Unknown Expert'}
                                                </h3>
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                                                    <UserCircle size={12} /> Standalone
                                                </span>
                                                {!expert.is_active && (
                                                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-500/10 text-slate-400 text-xs font-bold">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            {expert.email && (
                                                <p className="text-sm text-slate-500 truncate">{expert.email}</p>
                                            )}
                                            {expert.expert_title && (
                                                <p className="text-xs text-slate-600 truncate mt-0.5">{expert.expert_title}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats for standalone experts */}
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-center">
                                            <p className="text-white font-bold">{totalCourses}</p>
                                            <p className="text-slate-500 text-xs">Courses</p>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-colors">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {/* Empty State */}
                {statusFilter !== 'standalone' && filteredExperts.length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                        No experts found matching your criteria.
                    </div>
                )}
                {statusFilter === 'standalone' && standaloneExperts.filter(e =>
                    searchQuery === '' ||
                    e.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    e.email?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                    <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                        No standalone experts found. Click &quot;Add Expert&quot; to create one.
                    </div>
                )}
            </div>
        </div>
    );
}
