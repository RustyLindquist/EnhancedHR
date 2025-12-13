'use client';

import { useEffect, useState } from 'react';
import { getOrgMembers, OrgMember, InviteInfo } from '@/app/actions/org';
import InviteLinkButton from './InviteLinkButton';
import UserCard from './UserCard';
import UserDetailDashboard from './UserDetailDashboard';
import { Layers } from 'lucide-react';
import CanvasHeader from '../CanvasHeader';

export default function TeamManagement() {
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            const { members, inviteInfo, error } = await getOrgMembers();
            if (error) {
                setError(error);
            } else {
                setMembers(members);
                setInviteInfo(inviteInfo);
            }
            setLoading(false);
        };
        fetchMembers();
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
                    title="Manage Users"
                >
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-brand-blue-light mr-4">
                            <div className="w-2 h-2 rounded-full bg-brand-blue-light animate-pulse"></div>
                            <span className="text-sm font-bold uppercase tracking-widest">{members.length} Members</span>
                        </div>
                        {inviteInfo && <InviteLinkButton inviteUrl={inviteInfo.inviteUrl} />}
                    </div>
                </CanvasHeader>
            </div>

            {/* Scrollable Content Container */}
            <div className="w-full max-w-[1600px] mx-auto px-8 pb-32 pt-8 animate-fade-in">
                {/* Empty State */}
                {members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-[#131b2c] border border-white/5 rounded-2xl">
                        <Layers size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Team Members Yet</h3>
                        <p className="text-slate-400 max-w-sm text-center mb-6">Start building your team by inviting members to join your organization.</p>
                        {/* Invite button is already in header, but keeping here for empty state context might be good? 
                            The prompt says "Invite Members" button in Navigation Panel. 
                            I'll leave it in header only to be clean. */}
                    </div>
                ) : (
                    /* Grid of Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {members.map((member) => (
                            <UserCard
                                key={member.id}
                                member={member}
                                onClick={() => setSelectedMember(member)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
