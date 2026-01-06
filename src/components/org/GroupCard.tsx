import React from 'react';
import { Users, Sparkles } from 'lucide-react';
import { EmployeeGroup } from '@/app/actions/groups';

interface GroupCardProps {
    group: EmployeeGroup;
    onClick: () => void;
    isDynamic?: boolean;
}

export default function GroupCard({ group, onClick, isDynamic = false }: GroupCardProps) {
    // Determine gradient and hover colors based on dynamic status
    const gradientClass = isDynamic
        ? 'from-purple-900 to-purple-500/30'
        : 'from-brand-blue-dark to-brand-blue-light/30';

    const iconColor = isDynamic ? 'text-purple-400' : 'text-brand-blue-light';
    const hoverBorderColor = isDynamic ? 'hover:border-purple-500/50' : 'hover:border-brand-blue-light/50';
    const hoverTextColor = isDynamic ? 'group-hover:text-purple-400' : 'group-hover:text-brand-blue-light';
    const hoverGlowColor = isDynamic ? 'from-purple-500/5' : 'from-brand-blue-light/5';

    // Get criteria summary for dynamic groups
    const getCriteriaSummary = () => {
        if (!isDynamic || !group.criteria) return 'Custom Group';
        const criteria = group.criteria;
        switch (group.dynamic_type) {
            case 'recent_logins':
                return `Active in last ${criteria.days || 30} days`;
            case 'no_logins':
                return `Inactive for ${criteria.days || 30}+ days`;
            case 'most_active':
                return `Activity score ≥ ${criteria.threshold || 50}%`;
            case 'top_learners':
                return `Learning score ≥ ${criteria.threshold || 50}%`;
            case 'most_talkative':
                return `AI usage score ≥ ${criteria.threshold || 50}%`;
            default:
                return 'Dynamic Group';
        }
    };

    return (
        <div
            onClick={onClick}
            className={`group relative bg-[#131b2c] border border-white/5 rounded-3xl overflow-hidden ${hoverBorderColor} transition-all duration-300 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4)] min-h-[200px] flex flex-col`}
        >
            {/* Dynamic Badge - positioned at top right */}
            {isDynamic && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                        <Sparkles size={10} />
                        Dynamic
                    </div>
                </div>
            )}

            {/* Header / Icon Area */}
            <div className="p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    {/* Icon - only show for non-dynamic groups */}
                    {!isDynamic && (
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center border border-white/10`}>
                            <Users size={24} className={iconColor} />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-white font-semibold text-lg ${hoverTextColor} transition-colors truncate`}>
                            {group.name}
                        </h3>
                        <p className="text-slate-400 text-sm">{getCriteriaSummary()}</p>
                    </div>
                </div>
            </div>

            {/* Members Count */}
            <div className="px-6 pb-6 flex-1 flex flex-col justify-end">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-slate-400" />
                            <span className="text-sm text-slate-400">Members</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{group.member_count || 0}</span>
                    </div>
                </div>
            </div>

            {/* Subtle hover glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-t ${hoverGlowColor} to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
        </div>
    );
}
