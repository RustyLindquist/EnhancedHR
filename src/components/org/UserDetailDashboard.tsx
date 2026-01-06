
import React, { useTransition } from 'react';
import { OrgMember, toggleOrgMemberStatus, updateUserRole } from '@/app/actions/org';
import { User, Clock, Award, MessageSquare, ArrowLeft, Trash2, Ban, Shield, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import RemoveUserButton from './RemoveUserButton';
import CanvasHeader from '../CanvasHeader';

interface UserDetailDashboardProps {
    member: OrgMember;
    onBack: () => void;
}

export default function UserDetailDashboard({ member, onBack }: UserDetailDashboardProps) {
    const [isPending, startTransition] = useTransition();
    const isPaused = member.membership_status === 'inactive'; // Assuming inactive means paused for now

    return (
        <div className="flex flex-col w-full relative">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50">
                <CanvasHeader
                    context="User Details"
                    title={member.full_name}
                    onBack={onBack}
                    backLabel="Back to Users"
                >
                    <div className="flex items-center space-x-3">
                        {/* Role Management */}
                        {member.membership_status !== 'inactive' && (
                            member.is_owner ? (
                                <div className="flex items-center space-x-2 px-4 py-2 bg-brand-orange/10 border border-brand-orange/20 rounded-full">
                                    <Shield size={14} className="text-brand-orange" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-brand-orange">Primary Account Holder</span>
                                </div>
                            ) : (
                                member.role === 'org_admin' ? (
                                    <button
                                        onClick={async () => {
                                            if (isPending || !confirm('Are you sure you want to demote this Admin to a regular Member?')) return;
                                            startTransition(async () => {
                                                const res = await updateUserRole(member.id, 'user');
                                                if (res.success) window.location.reload();
                                                else alert(res.error);
                                            });
                                        }}
                                        disabled={isPending}
                                        className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all"
                                    >
                                        <ArrowDownCircle size={14} />
                                        <span>Demote to Member</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (isPending || !confirm('Are you sure you want to promote this user to Organization Admin?')) return;
                                            startTransition(async () => {
                                                const res = await updateUserRole(member.id, 'org_admin');
                                                if (res.success) window.location.reload();
                                                else alert(res.error);
                                            });
                                        }}
                                        disabled={isPending}
                                        className="flex items-center space-x-2 px-4 py-2 bg-brand-blue-light/10 border border-brand-blue-light/20 rounded-full text-xs font-bold uppercase tracking-wider text-brand-blue-light hover:bg-brand-blue-light hover:text-brand-black transition-all"
                                    >
                                        <ArrowUpCircle size={14} />
                                        <span>Promote to Admin</span>
                                    </button>
                                )
                            )
                        )}

                        <div className="w-px h-6 bg-white/10 mx-2"></div>

                        {/* Status Management */}
                        <button
                            onClick={async () => {
                                if (isPending) return;
                                startTransition(async () => {
                                    const res = await toggleOrgMemberStatus(member.id, member.membership_status);
                                    if (res.success) {
                                        // Optional: toast or local state update if not relying solely on revalidate
                                        window.location.reload(); // Simple reload to reflect status change if revalidate isn't enough for client component prop drill
                                    } else {
                                        alert(res.error || 'Failed to update status');
                                    }
                                });
                            }}
                            disabled={isPending}
                            className={`flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/10 transition-all ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Ban size={14} />
                            <span>{isPending ? 'Updating...' : (isPaused ? 'Resume' : 'Pause')}</span>
                        </button>
                        <RemoveUserButton userId={member.id} userName={member.full_name} variant="icon" />
                    </div>
                </CanvasHeader>
            </div>

            <div className="w-full max-w-7xl mx-auto pb-32 pt-8 px-8 animate-fade-in">
                {/* Navigation / Header */}
                <div className="flex items-center justify-between mb-8">
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Profile Card */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-blue-dark to-brand-blue-light/20"></div>
                            <div className="relative flex flex-col items-center">
                                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-[#131b2c] flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                                    {member.avatar_url ? (
                                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        member.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-white text-center">{member.full_name}</h2>
                                <p className="text-slate-400 text-center mb-2">{member.role_title || member.role}</p>

                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 ${member.membership_status === 'active' || member.membership_status === 'org_admin' ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-400'
                                    }`}>
                                    {member.membership_status === 'org_admin' ? 'Organization Admin' : (member.membership_status === 'inactive' ? 'Paused' : 'Active Member')}
                                </div>

                                <div className="w-full border-t border-white/5 pt-6 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Joined</div>
                                        <div className="text-white font-medium">{new Date(member.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Last Active</div>
                                        <div className="text-white font-medium">{member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & ROI */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Top Stats Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {/* ... stats ... */}
                            <div className="bg-[#131b2c] p-6 rounded-2xl border border-white/5 shadow-lg">
                                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Courses Completed</h4>
                                <div className="text-3xl font-bold text-brand-blue-light">{member.courses_completed}</div>
                            </div>
                            <div className="bg-[#131b2c] p-6 rounded-2xl border border-white/5 shadow-lg">
                                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Credits Earned</h4>
                                <div className="text-3xl font-bold text-brand-orange">{member.credits_earned}</div>
                            </div>
                            <div className="bg-[#131b2c] p-6 rounded-2xl border border-white/5 shadow-lg">
                                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Hours Learning</h4>
                                <div className="text-3xl font-bold text-purple-400">{(member.total_time_spent_minutes / 60).toFixed(1)}</div>
                            </div>
                            <div className="bg-[#131b2c] p-6 rounded-2xl border border-white/5 shadow-lg">
                                <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">AI Conversations</h4>
                                <div className="text-3xl font-bold text-pink-400">{member.conversations_count}</div>
                            </div>
                        </div>

                        {/* Activity / ROI Graph Placeholder */}
                        <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-8 shadow-xl min-h-[300px] flex flex-col justify-center items-center text-center relative overflow-hidden group">
                            {/* ... content remains same ... */}
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-dark/20 to-transparent opacity-50"></div>
                            <div className="relative z-10 opacity-40 group-hover:opacity-60 transition-opacity">
                                <svg width="100%" height="150" viewBox="0 0 600 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-brand-blue-light/20">
                                    <path d="M0 150 C 100 140, 150 100, 200 110 S 300 140, 350 90 S 450 100, 500 60 S 550 50, 600 20" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path d="M0 150 L 600 150 L 600 20 L 0 20 Z" fill="url(#gradient)" opacity="0.1" />
                                    <defs>
                                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <div className="relative z-10 mt-6">
                                <h3 className="text-xl font-bold text-white mb-2">Learning Velocity</h3>
                                <p className="text-slate-400 max-w-sm mx-auto">
                                    View detailed learning milestones and platform engagement over time.
                                    <br /><span className="text-xs text-brand-blue-light mt-2 inline-block font-mono bg-brand-blue-light/10 px-2 py-1 rounded">Coming Soon</span>
                                </p>
                            </div>
                        </div>

                        {/* Enrolled Courses / Activity Feed Placeholder */}
                        <div className="bg-[#131b2c] border border-white/5 rounded-2xl p-6 shadow-xl">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Recent Activity</h3>
                            <div className="space-y-4">
                                {member.courses_completed > 0 ? (
                                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-white font-medium">Course Completed</h4>
                                                <p className="text-xs text-slate-400">Recent completion</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500">Just now</span>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-500 italic">
                                        No recent activity recorded.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
