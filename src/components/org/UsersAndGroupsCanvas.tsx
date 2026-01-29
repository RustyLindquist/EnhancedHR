'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Layers, Sparkles, Loader2 } from 'lucide-react';
import { getOrgGroups, getUserGroupMemberships, EmployeeGroup } from '@/app/actions/groups';
import { getOrgMembers, InviteInfo } from '@/app/actions/org';
import GroupCard from './GroupCard';
import GroupManagement from './GroupManagement';
import InviteMemberPanel from './InviteMemberPanel';
import CanvasHeader from '../CanvasHeader';
import { useBackHandler } from '@/hooks/useBackHandler';

interface UsersAndGroupsCanvasProps {
    onSelectAllUsers: () => void;
    onSelectGroup: (groupId: string) => void;
    onBack?: () => void;
    isAdmin?: boolean; // Whether the user is an org admin (or platform admin)
}

// Special card for "All Users" that leads to the existing user management view
const AllUsersCard: React.FC<{ onClick: () => void; memberCount: number }> = ({ onClick, memberCount }) => (
    <div
        onClick={onClick}
        className="group relative bg-[#131b2c] border border-white/5 rounded-3xl overflow-hidden hover:border-brand-blue-light/50 transition-all duration-300 cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4)] min-h-[200px] flex flex-col"
    >
        {/* Header / Icon Area */}
        <div className="p-6 pb-4 flex items-start justify-between">
            <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-900 to-emerald-500/30 flex items-center justify-center border border-white/10">
                    <Users size={24} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg group-hover:text-emerald-400 transition-colors truncate">
                        All Users
                    </h3>
                    <p className="text-slate-400 text-sm">View all organization members</p>
                </div>
            </div>
        </div>

        {/* Members Count */}
        <div className="px-6 pb-6 flex-1 flex flex-col justify-end">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5 group-hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-400">Total Members</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{memberCount}</span>
                </div>
            </div>
        </div>

        {/* Subtle hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
);

export default function UsersAndGroupsCanvas({ onSelectAllUsers, onSelectGroup, onBack, isAdmin = false }: UsersAndGroupsCanvasProps) {
    const [groups, setGroups] = useState<EmployeeGroup[]>([]);
    const [memberGroups, setMemberGroups] = useState<{ customGroups: EmployeeGroup[], dynamicGroups: EmployeeGroup[] }>({ customGroups: [], dynamicGroups: [] });
    const [loading, setLoading] = useState(true);
    const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
    const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);
    const [totalMembers, setTotalMembers] = useState(0);
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

    // Register browser back button handler to use parent's onBack
    useBackHandler(onBack, { enabled: !!onBack });

    const fetchGroups = async () => {
        setLoading(true);
        if (isAdmin) {
            // Admins see all org groups
            const fetchedGroups = await getOrgGroups();
            setGroups(fetchedGroups);
        } else {
            // Members only see groups they belong to
            const memberships = await getUserGroupMemberships();
            setMemberGroups(memberships);
        }
        setLoading(false);
    };

    // Fetch member count and invite info from org action (only for admins)
    const fetchMemberData = async () => {
        try {
            const { members, inviteInfo } = await getOrgMembers();
            setTotalMembers(members.length);
            setInviteInfo(inviteInfo);
        } catch (e) {
            console.error('Failed to fetch member data', e);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        fetchMemberData();
    }, [isAdmin]);

    useEffect(() => {
        fetchGroups();
    }, [isAdmin]);

    const handleGroupCreated = () => {
        setIsGroupPanelOpen(false);
        fetchGroups();
    };

    // Split groups into regular and dynamic (for admin view)
    const regularGroups = groups.filter(g => !g.is_dynamic).sort((a, b) => a.name.localeCompare(b.name));
    const dynamicGroups = groups.filter(g => g.is_dynamic).sort((a, b) => a.name.localeCompare(b.name));

    // For member view: use memberGroups state
    const memberCustomGroups = memberGroups.customGroups.sort((a, b) => a.name.localeCompare(b.name));
    const memberDynamicGroups = memberGroups.dynamicGroups.sort((a, b) => a.name.localeCompare(b.name));
    const hasMemberGroups = memberCustomGroups.length > 0 || memberDynamicGroups.length > 0;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] px-8">
                {/* Animated loader container */}
                <div className="relative mb-8">
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 w-20 h-20 rounded-full bg-brand-blue-light/20 animate-ping" />
                    {/* Inner container */}
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-brand-blue-light/30 to-brand-blue-light/10 border border-brand-blue-light/30 flex items-center justify-center">
                        <Loader2 size={32} className="text-brand-blue-light animate-spin" />
                    </div>
                </div>

                {/* Loading text */}
                <div className="text-center max-w-md">
                    <h3 className="text-white font-semibold text-lg mb-3">
                        Loading Users & Groups
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Please wait while we gather your most up-to-date user data and construct this page.
                    </p>
                </div>

                {/* Subtle animated dots */}
                <div className="flex items-center gap-1.5 mt-6">
                    <div className="w-2 h-2 rounded-full bg-brand-blue-light/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-blue-light/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-blue-light/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full relative">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50">
                <CanvasHeader
                    context={isAdmin ? "manage your" : "your"}
                    title="Users and Groups"
                    onBack={onBack}
                    backLabel="Go Back"
                >
                    {/* Only show admin buttons for admins */}
                    {isAdmin && (
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setIsInvitePanelOpen(true)}
                                className="
                                    flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all
                                    bg-brand-blue-light text-brand-black hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(120,192,240,0.3)]
                                "
                            >
                                <UserPlus size={16} />
                                Invite Members
                            </button>
                            <button
                                onClick={() => setIsGroupPanelOpen(true)}
                                className="
                                    flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all
                                    bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:scale-105 active:scale-95
                                "
                            >
                                <Users size={16} />
                                Create Group
                            </button>
                        </div>
                    )}
                </CanvasHeader>
            </div>

            {/* Scrollable Content Container */}
            <div className="w-full max-w-[1600px] mx-auto px-8 pb-32 animate-fade-in relative z-10 pt-8 pl-20">

                {/* ADMIN VIEW */}
                {isAdmin && (
                    <>
                        {/* Section 1: Your Users and Groups */}
                        <div className="mb-12">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Your Users and Groups</h2>
                            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                {/* All Users Card - Always First */}
                                <AllUsersCard onClick={onSelectAllUsers} memberCount={totalMembers} />

                                {/* Regular Group Cards */}
                                {regularGroups.map((group) => (
                                    <GroupCard
                                        key={group.id}
                                        group={group}
                                        onClick={() => onSelectGroup(group.id)}
                                        isDynamic={false}
                                    />
                                ))}

                                {/* Empty State Card - shown when no regular groups exist */}
                                {regularGroups.length === 0 && groups.length === 0 && (
                                    <div className="bg-[#131b2c]/50 border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[200px]">
                                        <Layers size={32} className="text-slate-600 mb-3" />
                                        <h3 className="text-white font-semibold mb-2">No Groups Yet</h3>
                                        <p className="text-slate-500 text-xs text-center max-w-[200px] mb-4">
                                            Create groups to organize your team
                                        </p>
                                        <button
                                            onClick={() => setIsGroupPanelOpen(true)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                                        >
                                            <UserPlus size={12} />
                                            Create Group
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Dynamic Groups */}
                        {dynamicGroups.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Dynamic Groups</h2>
                                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                    {dynamicGroups.map((group) => (
                                        <GroupCard
                                            key={group.id}
                                            group={group}
                                            onClick={() => onSelectGroup(group.id)}
                                            isDynamic={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* MEMBER VIEW */}
                {!isAdmin && (
                    <>
                        {/* All Users Card */}
                        <div className="mb-12">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">Organization</h2>
                            <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                <AllUsersCard onClick={onSelectAllUsers} memberCount={0} />
                            </div>
                        </div>

                        {/* My Groups Section */}
                        {memberCustomGroups.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">My Groups</h2>
                                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                    {memberCustomGroups.map((group) => (
                                        <GroupCard
                                            key={group.id}
                                            group={group}
                                            onClick={() => onSelectGroup(group.id)}
                                            isDynamic={false}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* My Achievements (Dynamic Groups) */}
                        {memberDynamicGroups.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                                    <Sparkles size={14} className="text-amber-400" />
                                    My Achievements
                                </h2>
                                <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                                    {memberDynamicGroups.map((group) => (
                                        <GroupCard
                                            key={group.id}
                                            group={group}
                                            onClick={() => onSelectGroup(group.id)}
                                            isDynamic={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State - Not in any groups */}
                        {!hasMemberGroups && (
                            <div className="mb-12">
                                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">My Groups</h2>
                                <div className="bg-[#131b2c]/50 border border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-4 border border-white/10">
                                        <Users size={28} className="text-slate-500" />
                                    </div>
                                    <h3 className="text-white font-semibold text-lg mb-2">Not in Any Groups Yet</h3>
                                    <p className="text-slate-400 text-sm text-center max-w-[300px]">
                                        Your organization admin can add you to groups. Dynamic groups are earned automatically based on your activity.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Invite Members Panel - Only for admins */}
            <InviteMemberPanel
                isOpen={isInvitePanelOpen}
                onClose={() => setIsInvitePanelOpen(false)}
                inviteInfo={inviteInfo}
                onUpdate={fetchMemberData}
            />

            {/* Create Group Panel - Only for admins */}
            {isAdmin && (
                <GroupManagement
                    isOpen={isGroupPanelOpen}
                    onClose={() => setIsGroupPanelOpen(false)}
                    onSuccess={handleGroupCreated}
                />
            )}
        </div>
    );
}
