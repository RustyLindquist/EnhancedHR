
import React from 'react';
import { OrgMember } from '@/app/actions/org';
import { Shield, Plus } from 'lucide-react';

interface UserCardProps {
    member: OrgMember;
    onClick: () => void;
    onAddToGroup?: () => void;
}

export default function UserCard({ member, onClick, onAddToGroup }: UserCardProps) {
    const isAdmin = member.membership_status === 'org_admin' || member.role === 'org_admin' || member.role === 'admin';
    const initials = member.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

    return (
        <div
            onClick={onClick}
            className="group relative w-full h-[340px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_15px_40px_0_rgba(120,192,240,0.15)]"
        >
            {/* Animated rotating border */}
            <div className="card-hover-border rounded-2xl" />

            {/* Background Image / Avatar */}
            <div className="absolute inset-0">
                {member.avatar_url ? (
                    <img
                        src={member.avatar_url}
                        alt={member.full_name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    /* Fallback gradient with initials */
                    <div className="w-full h-full bg-gradient-to-br from-brand-blue-dark via-slate-800 to-slate-900 flex items-center justify-center">
                        <span className="text-6xl font-bold text-white/20">{initials}</span>
                    </div>
                )}
                {/* Gradient Overlay - Subtle glass-compatible overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 p-6 pb-[30px] flex flex-col justify-end">

                {/* Top Bar with Dark Overlay */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent pt-3 pb-6 px-4">
                    <div className="flex items-center justify-between">
                        {/* Admin Badge - Left side */}
                        <div className="flex items-center">
                            {isAdmin && (
                                <div className="bg-brand-orange/30 backdrop-blur-md border border-brand-orange/40 text-brand-orange px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                                    <Shield size={12} fill="currentColor" /> Admin
                                </div>
                            )}
                        </div>
                        {/* Add to Group Button - Right side, always in same position */}
                        <div className="flex items-center">
                            {onAddToGroup && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAddToGroup(); }}
                                    className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:bg-white/30 hover:border-white/60 transition-all shadow-lg"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">

                    {/* Role Title */}
                    {member.role_title && (
                        <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                            <span className="text-brand-blue-light text-xs font-bold uppercase tracking-widest">{member.role_title}</span>
                        </div>
                    )}

                    {/* Name */}
                    <h3 className="text-2xl font-bold text-white mb-5 leading-tight group-hover:text-brand-blue-light transition-colors">
                        {member.full_name}
                    </h3>

                    {/* Stats Grid - 2x2 layout */}
                    <div className="border-t border-white/10 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <span className="text-xs font-medium text-slate-300">{member.courses_completed || 0} Courses</span>
                            <span className="text-xs font-medium text-slate-300">{member.credits_earned || 0} Credits</span>
                            <span className="text-xs font-medium text-slate-300">{member.total_time_spent_minutes || 0}m Learning</span>
                            <span className="text-xs font-medium text-slate-300">{member.conversations_count || 0} AI Chats</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
