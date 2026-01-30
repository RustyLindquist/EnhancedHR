'use client';

import React from 'react';
import { OrgMember } from '@/app/actions/org';
import { Shield, Plus, BookOpen, Award, Clock, MessageSquare, ChevronRight } from 'lucide-react';

interface UserListItemProps {
    member: OrgMember;
    onClick: () => void;
    onAddToGroup?: () => void;
    showAddButton?: boolean;
}

export default function UserListItem({ member, onClick, onAddToGroup, showAddButton = true }: UserListItemProps) {
    const isAdmin = member.membership_status === 'org_admin' || member.role === 'org_admin' || member.role === 'admin';
    const initials = member.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

    // Glow color - emerald for admin, blue for regular users
    const glowColor = isAdmin ? 'rgba(52, 211, 153, 0.6)' : 'rgba(120, 192, 240, 0.6)';

    // Format time spent
    const formatTime = (minutes: number | undefined | null) => {
        if (!minutes) return '0m';
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
        return `${minutes}m`;
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

            {/* Avatar */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/10 group-hover:border-white/20 transition-colors">
                {member.avatar_url ? (
                    <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-blue-dark to-slate-800 flex items-center justify-center">
                        <span className="text-sm font-bold text-white/60">{initials}</span>
                    </div>
                )}
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />

            {/* Main Content */}
            <div className="flex-1 min-w-0 relative z-10">
                {/* Top row: Name, Role, Admin Badge */}
                <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-brand-blue-light transition-colors">
                        {member.full_name}
                    </h4>
                    {member.role_title && (
                        <>
                            <span className="text-white/20 hidden sm:block">|</span>
                            <span className="text-[11px] text-slate-400 flex-shrink-0 hidden sm:block">
                                {member.role_title}
                            </span>
                        </>
                    )}
                    {isAdmin && (
                        <>
                            <span className="text-white/20 hidden sm:block">|</span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                                <Shield size={10} fill="currentColor" />
                                Admin
                            </span>
                        </>
                    )}
                </div>

                {/* Bottom row: Stats */}
                <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                        <BookOpen size={12} className="text-brand-blue-light/60" />
                        {member.courses_completed || 0} Courses
                    </span>
                    <span className="flex items-center gap-1">
                        <Award size={12} className="text-amber-400/60" />
                        {member.credits_earned || 0} Credits
                    </span>
                    <span className="flex items-center gap-1 hidden md:flex">
                        <Clock size={12} className="text-emerald-400/60" />
                        {formatTime(member.total_time_spent_minutes)}
                    </span>
                    <span className="flex items-center gap-1 hidden lg:flex">
                        <MessageSquare size={12} className="text-purple-400/60" />
                        {member.conversations_count || 0} AI Chats
                    </span>
                </div>
            </div>

            {/* Right section - Type Badge */}
            <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />

                <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md hidden sm:block w-20 text-center"
                    style={{
                        backgroundColor: `${glowColor}12`,
                        color: glowColor,
                        border: `1px solid ${glowColor}20`
                    }}
                >
                    {isAdmin ? 'Admin' : 'Member'}
                </span>

                <ChevronRight size={16} className="text-slate-600 ml-1" />
            </div>

            {/* Sliding Action Panel */}
            {showAddButton && onAddToGroup && (
                <div
                    className="absolute right-0 top-0 bottom-0 flex items-center justify-end gap-2 pl-6 pr-4
                               transform translate-x-full group-hover:translate-x-0
                               transition-transform duration-300 ease-out
                               rounded-r-[10px] shadow-xl z-20"
                    style={{
                        background: 'linear-gradient(to right, transparent 0%, #1a3050 20%, #1a3050 100%)',
                    }}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddToGroup(); }}
                        className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors border border-white/10 hover:border-white/20"
                        title="Add to group"
                    >
                        <Plus size={16} className="text-white" />
                    </button>
                </div>
            )}
        </div>
    );
}
