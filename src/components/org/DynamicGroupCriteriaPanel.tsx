'use client';

import React, { useState, useTransition, useCallback } from 'react';
import { Sparkles, Loader2, CheckCircle, Users } from 'lucide-react';
import DropdownPanel from '@/components/DropdownPanel';
import { EmployeeGroup } from '@/app/actions/groups';

interface DynamicGroupCriteriaPanelProps {
    isOpen: boolean;
    onClose: () => void;
    group: EmployeeGroup; // Must have is_dynamic=true
    onSuccess: () => void;
}

export default function DynamicGroupCriteriaPanel({
    isOpen,
    onClose,
    group,
    onSuccess
}: DynamicGroupCriteriaPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Initialize criteria state from group
    const [criteria, setCriteria] = useState(group.criteria || {});

    // Type-specific state
    const [days, setDays] = useState<number>(criteria.days || 30);
    const [threshold, setThreshold] = useState<number>(criteria.threshold || 50);
    const [metrics, setMetrics] = useState<string[]>(criteria.metrics || []);

    const handleSave = useCallback(() => {
        setError(null);
        startTransition(async () => {
            // TODO: Call updateDynamicGroupCriteria action when implemented
            // For now, just show success
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onSuccess();
            }, 1000);
        });
    }, [group.id, days, threshold, metrics, onSuccess]);

    const toggleMetric = (metric: string) => {
        setMetrics(prev =>
            prev.includes(metric)
                ? prev.filter(m => m !== metric)
                : [...prev, metric]
        );
    };

    const renderTypeControls = () => {
        switch (group.dynamic_type) {
            case 'recent_logins':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Days Active
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Users active in the last {days} days
                            </p>
                        </div>
                    </div>
                );

            case 'no_logins':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Days Inactive
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Users inactive for {days}+ days
                            </p>
                        </div>
                    </div>
                );

            case 'most_active':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Activity Metrics
                            </label>
                            <div className="space-y-2">
                                {['Streaks', 'Time in Course', 'Courses Completed', 'Collection Utilization'].map(metric => (
                                    <label key={metric} className="flex items-center space-x-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                            metrics.includes(metric)
                                                ? 'bg-purple-500 border-purple-500'
                                                : 'border-slate-600 group-hover:border-slate-400'
                                        }`}>
                                            {metrics.includes(metric) && (
                                                <CheckCircle size={12} className="text-white" />
                                            )}
                                        </div>
                                        <span className={`text-sm transition-colors ${
                                            metrics.includes(metric)
                                                ? 'text-white'
                                                : 'text-slate-400 group-hover:text-slate-200'
                                        }`}>
                                            {metric}
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={metrics.includes(metric)}
                                            onChange={() => toggleMetric(metric)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Period (Days)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Threshold (%)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Include users with activity score above {threshold}%
                            </p>
                        </div>
                    </div>
                );

            case 'top_learners':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Learning Metrics
                            </label>
                            <div className="space-y-2">
                                {['Time Spent', 'Courses Completed', 'Credits Earned'].map(metric => (
                                    <label key={metric} className="flex items-center space-x-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                            metrics.includes(metric)
                                                ? 'bg-purple-500 border-purple-500'
                                                : 'border-slate-600 group-hover:border-slate-400'
                                        }`}>
                                            {metrics.includes(metric) && (
                                                <CheckCircle size={12} className="text-white" />
                                            )}
                                        </div>
                                        <span className={`text-sm transition-colors ${
                                            metrics.includes(metric)
                                                ? 'text-white'
                                                : 'text-slate-400 group-hover:text-slate-200'
                                        }`}>
                                            {metric}
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={metrics.includes(metric)}
                                            onChange={() => toggleMetric(metric)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Period (Days)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Threshold (%)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Learning score ≥ {threshold}%
                            </p>
                        </div>
                    </div>
                );

            case 'most_talkative':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                AI Usage Metrics
                            </label>
                            <div className="space-y-2">
                                {['Conversation Count', 'Message Count'].map(metric => (
                                    <label key={metric} className="flex items-center space-x-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                            metrics.includes(metric)
                                                ? 'bg-purple-500 border-purple-500'
                                                : 'border-slate-600 group-hover:border-slate-400'
                                        }`}>
                                            {metrics.includes(metric) && (
                                                <CheckCircle size={12} className="text-white" />
                                            )}
                                        </div>
                                        <span className={`text-sm transition-colors ${
                                            metrics.includes(metric)
                                                ? 'text-white'
                                                : 'text-slate-400 group-hover:text-slate-200'
                                        }`}>
                                            {metric}
                                        </span>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={metrics.includes(metric)}
                                            onChange={() => toggleMetric(metric)}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Period (Days)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="7"
                                    max="365"
                                    value={days}
                                    onChange={(e) => setDays(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Threshold (%)
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="flex-1 accent-purple-500"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={threshold}
                                    onChange={(e) => setThreshold(Number(e.target.value))}
                                    className="w-20 p-2 rounded-lg bg-white/5 border border-white/10 text-white text-center"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                AI usage score ≥ {threshold}%
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    const getTypeName = () => {
        switch (group.dynamic_type) {
            case 'recent_logins': return 'Recent Logins';
            case 'no_logins': return 'Inactive Users';
            case 'most_active': return 'Most Active';
            case 'top_learners': return 'Top Learners';
            case 'most_talkative': return 'Most Talkative';
            default: return 'Dynamic Group';
        }
    };

    const headerActions = (
        <div className="flex items-center gap-4">
            {showSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>Saved!</span>
                </div>
            )}
            <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Group Criteria"
            icon={Sparkles}
            iconColor="text-purple-400"
            headerActions={headerActions}
        >
            <div className="max-w-3xl space-y-8">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Group Type Badge */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Group Type
                    </label>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                        <Sparkles size={16} className="text-purple-400" />
                        <span className="text-purple-400 font-bold">{getTypeName()}</span>
                    </div>
                </div>

                {/* Configuration Section */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                        Configuration
                    </h3>
                    {renderTypeControls()}
                </div>

                {/* Preview Section */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users size={16} className="text-purple-400" />
                        Preview
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400">
                        <div className="flex -space-x-2">
                            {/* Placeholder avatars */}
                            {[1, 2, 3].map(i => (
                                <div
                                    key={i}
                                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-[#0B1120]"
                                />
                            ))}
                        </div>
                        <span className="text-sm">
                            {group.member_count || 0} users match this criteria
                        </span>
                    </div>
                </div>
            </div>
        </DropdownPanel>
    );
}
