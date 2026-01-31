'use client';

import React from 'react';
import { Users, Sparkles, ChevronRight } from 'lucide-react';
import { EmployeeGroup } from '@/app/actions/groups';

interface GroupListItemProps {
    group: EmployeeGroup;
    onClick: () => void;
    isDynamic?: boolean;
}

export default function GroupListItem({ group, onClick, isDynamic = false }: GroupListItemProps) {
    // Glow colors - purple for dynamic, blue for regular
    const glowColor = isDynamic ? 'rgba(168, 85, 247, 0.6)' : 'rgba(120, 192, 240, 0.6)';
    const iconBgColor = isDynamic ? 'rgba(168, 85, 247, 0.15)' : 'rgba(120, 192, 240, 0.15)';
    const iconColor = isDynamic ? '#a855f7' : '#78c0f0';

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
            className="group relative flex items-center gap-4 px-4 py-3
                       bg-white/[0.03] hover:bg-white/[0.08]
                       border border-white/[0.06] hover:border-white/20
                       rounded-xl transition-all duration-300 cursor-pointer
                       overflow-hidden"
            style={{
                borderLeftWidth: '3px',
                borderLeftColor: glowColor,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, inset 0 0 20px ${glowColor}08`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            {/* Subtle gradient overlay on hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[10px]"
                style={{
                    background: `linear-gradient(135deg, ${glowColor}08 0%, transparent 50%)`
                }}
            />

            {/* Icon */}
            <div
                className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0
                           transition-transform duration-200 group-hover:scale-105"
                style={{
                    backgroundColor: iconBgColor,
                    boxShadow: `0 0 20px ${glowColor}10`
                }}
            >
                {isDynamic ? (
                    <Sparkles size={20} style={{ color: iconColor }} />
                ) : (
                    <Users size={20} style={{ color: iconColor }} />
                )}
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />

            {/* Main Content */}
            <div className="flex-1 min-w-0 relative z-10">
                {/* Top row: Name, Dynamic Badge */}
                <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-brand-blue-light transition-colors">
                        {group.name}
                    </h4>
                    {isDynamic && (
                        <>
                            <span className="text-white/20 hidden sm:block">|</span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                                <Sparkles size={10} />
                                Dynamic
                            </span>
                        </>
                    )}
                </div>

                {/* Bottom row: Criteria/description */}
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {getCriteriaSummary()}
                </p>
            </div>

            {/* Right section - Member Count & Type Badge */}
            <div className="flex items-center gap-4 flex-shrink-0 relative z-10">
                {/* Member count */}
                <div className="flex items-center gap-2 text-slate-400 hidden sm:flex">
                    <Users size={14} />
                    <span className="text-sm font-medium text-white">{group.member_count || 0}</span>
                    <span className="text-[11px]">members</span>
                </div>

                <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

                {/* Type Badge */}
                <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md hidden sm:block w-20 text-center"
                    style={{
                        backgroundColor: `${glowColor}12`,
                        color: glowColor,
                        border: `1px solid ${glowColor}20`
                    }}
                >
                    {isDynamic ? 'Dynamic' : 'Group'}
                </span>

                <ChevronRight size={16} className="text-slate-600 ml-1" />
            </div>
        </div>
    );
}
