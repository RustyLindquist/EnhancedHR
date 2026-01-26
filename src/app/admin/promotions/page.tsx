'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Rocket, RefreshCw, CheckCircle, Clock, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { getAllPromotionStatuses } from '@/app/actions/course-promotion';

interface PromotionStatus {
    id: string;
    course_id: number;
    course_title: string;
    total_videos: number;
    processed_videos: number;
    status: 'pending' | 'processing' | 'complete' | 'error';
    error_message?: string;
    created_at: string;
    updated_at: string;
}

// Only allow in development
const isDevelopment = process.env.NODE_ENV === 'development';

export default function PromotionsPage() {
    const [statuses, setStatuses] = useState<PromotionStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatuses = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const result = await getAllPromotionStatuses();

        if (result.success && result.statuses) {
            setStatuses(result.statuses);
        } else {
            setError(result.error || 'Failed to fetch statuses');
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (isDevelopment) {
            fetchStatuses();
        }
    }, [fetchStatuses]);

    // Auto-refresh every 10 seconds if any are processing
    useEffect(() => {
        if (!isDevelopment) return;

        const hasProcessing = statuses.some(s => s.status === 'processing' || s.status === 'pending');
        if (!hasProcessing) return;

        const interval = setInterval(() => {
            fetchStatuses();
        }, 10000);

        return () => clearInterval(interval);
    }, [statuses, fetchStatuses]);

    if (!isDevelopment) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-slate-400">This page is only available in development mode.</p>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'complete':
                return <CheckCircle className="text-green-400" size={16} />;
            case 'processing':
                return <Loader2 className="text-blue-400 animate-spin" size={16} />;
            case 'pending':
                return <Clock className="text-yellow-400" size={16} />;
            case 'error':
                return <AlertTriangle className="text-red-400" size={16} />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete': return 'bg-green-500/20 text-green-400';
            case 'processing': return 'bg-blue-500/20 text-blue-400';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400';
            case 'error': return 'bg-red-500/20 text-red-400';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Rocket className="text-purple-400" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Course Promotions</h1>
                        <p className="text-slate-400">Track courses promoted to production</p>
                    </div>
                </div>
                <button
                    onClick={fetchStatuses}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Development Warning */}
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <p className="text-sm text-yellow-400">
                    Development Mode Only - This page tracks courses promoted from local to production.
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}

            {/* Status List */}
            {isLoading && statuses.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-slate-400" size={24} />
                </div>
            ) : statuses.length === 0 ? (
                <div className="text-center py-12">
                    <Rocket className="mx-auto text-slate-600 mb-4" size={48} />
                    <p className="text-slate-400">No courses have been promoted yet.</p>
                    <p className="text-sm text-slate-500 mt-2">
                        Go to Admin Console - Courses and click the rocket icon to promote a course.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {statuses.map((item) => (
                        <div
                            key={item.id}
                            className="p-4 bg-white/5 border border-white/10 rounded-xl"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-medium text-white">{item.course_title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${getStatusColor(item.status)}`}>
                                            {getStatusIcon(item.status)}
                                            {item.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <span>Production ID: {item.course_id}</span>
                                        <span>-</span>
                                        <span>
                                            Videos: {item.processed_videos} / {item.total_videos}
                                        </span>
                                        <span>-</span>
                                        <span>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    {item.total_videos > 0 && (
                                        <div className="mt-3">
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${
                                                        item.status === 'complete'
                                                            ? 'bg-green-500'
                                                            : 'bg-blue-500'
                                                    }`}
                                                    style={{
                                                        width: `${(item.processed_videos / item.total_videos) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {item.error_message && (
                                        <p className="mt-2 text-sm text-red-400">{item.error_message}</p>
                                    )}
                                </div>

                                {item.status === 'complete' && (
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_PROD_URL || 'https://enhancedhr.ai'}/admin/courses/${item.course_id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                        View on Production
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
