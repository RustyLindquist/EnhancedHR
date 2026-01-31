'use client';

import { useEffect, useState } from 'react';
import { getOrgMembers, OrgMember, InviteInfo } from '@/app/actions/org';
import InviteMemberPanel from './InviteMemberPanel';
import GroupManagement from './GroupManagement';
import AddToGroupModal from './AddToGroupModal';
import UserCard from './UserCard';
import UserListItem from './UserListItem';
import UserDetailDashboard from './UserDetailDashboard';
import { Layers, UserPlus, Users, LayoutGrid, List } from 'lucide-react';
import CanvasHeader from '../CanvasHeader';
import { useBackHandler } from '@/hooks/useBackHandler';

interface TeamManagementProps {
    onBack?: () => void;
    isAdmin?: boolean; // Whether the user is an org admin (or platform admin)
}

export default function TeamManagement({ onBack, isAdmin = false }: TeamManagementProps) {
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
    const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);
    const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
    const [addToGroupMember, setAddToGroupMember] = useState<OrgMember | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Register browser back button handler to use parent's onBack
    // Note: When a member is selected, UserDetailDashboard handles its own back
    useBackHandler(onBack, { enabled: !selectedMember && !!onBack });

    // Load view preference from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem('enhancedhr-preferred-view-mode');
        if (savedViewMode === 'list' || savedViewMode === 'grid') {
            setViewMode(savedViewMode);
        }
    }, []);

    // Handle view mode change and persist to localStorage
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        localStorage.setItem('enhancedhr-preferred-view-mode', mode);
        setViewMode(mode);
    };

    const fetchMembers = async () => {
        // Don't set loading true on refresh to avoid flash, or handle gracefully
        const { members, inviteInfo, error } = await getOrgMembers();
        if (error) {
            setError(error);
        } else {
            setMembers(members);
            setInviteInfo(inviteInfo);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // Listen for avatar updates to refresh member data
    useEffect(() => {
        const handleAvatarUpdate = () => {
            fetchMembers();
        };
        window.addEventListener('avatarUpdated', handleAvatarUpdate);
        return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    }, []);

    // 1. Detail View
    if (selectedMember) {
        return (
            <UserDetailDashboard
                member={selectedMember}
                onBack={() => setSelectedMember(null)}
            />
        );
    }

    // 2. Loading State
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-slate-400 animate-pulse">
                Loading Organization...
            </div>
        );
    }

    // 3. Error State
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-400">
                <p>Error: {error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-white text-sm"
                >
                    Retry
                </button>
            </div>
        );
    }

    // 4. Main Grid View
    return (
        <div className="flex flex-col w-full relative">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50">
                <CanvasHeader
                    context="My Organization"
                    title="All Users"
                    onBack={onBack}
                    backLabel="Go Back"
                >
                    <div className="flex items-center space-x-4">
                        {/* Member count - only for admins */}
                        {isAdmin && (
                            <div className="flex items-center space-x-2 text-brand-blue-light mr-4">
                                <div className="w-2 h-2 rounded-full bg-brand-blue-light animate-pulse"></div>
                                <span className="text-sm font-bold uppercase tracking-widest">{members.length} Members</span>
                            </div>
                        )}

                        {/* Only show admin controls for admins */}
                        {isAdmin && (
                            <>
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
                            </>
                        )}

                        {/* View Toggle - Far Right */}
                        <div className="flex items-center gap-0.5 p-1 bg-black/40 border border-white/10 rounded-lg">
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Grid View"
                            >
                                <LayoutGrid size={14} />
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={`p-1.5 rounded-md transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="List View"
                            >
                                <List size={14} />
                            </button>
                        </div>
                    </div>
                </CanvasHeader>
            </div>

            {/* Scrollable Content Container */}
            <div className="w-full max-w-[1600px] mx-auto px-8 pb-32 animate-fade-in relative z-10 pt-8 pl-20">
                {/* Empty State */}
                {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#131b2c] border border-white/5 rounded-2xl">
                        <Layers size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Team Members Yet</h3>
                        <p className="text-slate-400 max-w-sm text-center mb-6">Start building your team by inviting members to join your organization.</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* Grid of Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {members.map((member) => (
                            <UserCard
                                key={member.id}
                                member={member}
                                onClick={() => setSelectedMember(member)}
                                onAddToGroup={isAdmin ? () => setAddToGroupMember(member) : undefined}
                                showAddButton={isAdmin}
                            />
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="flex flex-col gap-2">
                        {members.map((member, index) => (
                            <div key={member.id} style={{ animationDelay: `${index * 30}ms` }}>
                                <UserListItem
                                    member={member}
                                    onClick={() => setSelectedMember(member)}
                                    onAddToGroup={isAdmin ? () => setAddToGroupMember(member) : undefined}
                                    showAddButton={isAdmin}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Panel */}
            <InviteMemberPanel
                isOpen={isInvitePanelOpen}
                onClose={() => setIsInvitePanelOpen(false)}
                inviteInfo={inviteInfo}
                onUpdate={fetchMembers}
            />

            {/* Create Group Panel */}
            <GroupManagement
                isOpen={isGroupPanelOpen}
                onClose={() => setIsGroupPanelOpen(false)}
                onSuccess={() => {
                    // Dispatch event for NavigationPanel to refresh groups
                    window.dispatchEvent(new CustomEvent('groupsUpdated'));
                }}
            />

            {/* Add to Group Modal */}
            {addToGroupMember && (
                <AddToGroupModal
                    memberId={addToGroupMember.id}
                    memberName={addToGroupMember.full_name}
                    onClose={() => setAddToGroupMember(null)}
                    onSuccess={() => {
                        // Optionally refresh data or show success toast
                    }}
                />
            )}
        </div>
    );
}
