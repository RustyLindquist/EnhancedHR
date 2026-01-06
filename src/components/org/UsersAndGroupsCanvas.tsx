import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Layers } from 'lucide-react';
import { getOrgGroups, EmployeeGroup } from '@/app/actions/groups';
import GroupCard from './GroupCard';
import GroupManagement from './GroupManagement';
import CanvasHeader from '../CanvasHeader';

interface UsersAndGroupsCanvasProps {
    onSelectAllUsers: () => void;
    onSelectGroup: (groupId: string) => void;
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

export default function UsersAndGroupsCanvas({ onSelectAllUsers, onSelectGroup }: UsersAndGroupsCanvasProps) {
    const [groups, setGroups] = useState<EmployeeGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
    const [totalMembers, setTotalMembers] = useState(0);

    const fetchGroups = async () => {
        setLoading(true);
        const fetchedGroups = await getOrgGroups();
        setGroups(fetchedGroups);
        setLoading(false);
    };

    // Fetch member count from org action
    useEffect(() => {
        const fetchMemberCount = async () => {
            try {
                const { getOrgMembers } = await import('@/app/actions/org');
                const { members } = await getOrgMembers();
                setTotalMembers(members.length);
            } catch (e) {
                console.error('Failed to fetch member count', e);
            }
        };
        fetchMemberCount();
    }, []);

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleGroupCreated = () => {
        setIsGroupPanelOpen(false);
        fetchGroups();
    };

    // Split groups into regular and dynamic
    const regularGroups = groups.filter(g => !g.is_dynamic).sort((a, b) => a.name.localeCompare(b.name));
    const dynamicGroups = groups.filter(g => g.is_dynamic).sort((a, b) => a.name.localeCompare(b.name));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-slate-400 animate-pulse">
                Loading...
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full relative">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50">
                <CanvasHeader
                    context="manage your"
                    title="Users and Groups"
                >
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsGroupPanelOpen(true)}
                            className="
                                flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all
                                bg-brand-blue-light text-brand-black hover:bg-white hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(120,192,240,0.3)]
                            "
                        >
                            <UserPlus size={16} />
                            Create Group
                        </button>
                    </div>
                </CanvasHeader>
            </div>

            {/* Scrollable Content Container */}
            <div className="w-full max-w-[1600px] mx-auto px-8 pb-32 animate-fade-in relative z-10 pt-8 pl-20">

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
            </div>

            {/* Create Group Panel */}
            <GroupManagement
                isOpen={isGroupPanelOpen}
                onClose={() => setIsGroupPanelOpen(false)}
                onSuccess={handleGroupCreated}
            />
        </div>
    );
}
