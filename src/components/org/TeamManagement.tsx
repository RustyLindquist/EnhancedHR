import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { getOrgMembers, OrgMember, InviteInfo, getOrgSelectorData, switchPlatformAdminOrg } from '@/app/actions/org';
import InviteMemberPanel from './InviteMemberPanel';
import GroupManagement from './GroupManagement';
import AddToGroupModal from './AddToGroupModal';
import UserCard from './UserCard';
import UserDetailDashboard from './UserDetailDashboard';
import { Layers, UserPlus, Users, ChevronDown, Check, Shield, Building2 } from 'lucide-react';
import CanvasHeader from '../CanvasHeader';

interface OrgSelectorData {
    isPlatformAdmin: boolean;
    currentOrgId: string | null;
    currentOrgName: string | null;
    organizations: { id: string; name: string; slug: string; memberCount: number }[];
}

export default function TeamManagement() {
    const router = useRouter();
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
    const [isInvitePanelOpen, setIsInvitePanelOpen] = useState(false);
    const [isGroupPanelOpen, setIsGroupPanelOpen] = useState(false);
    const [addToGroupMember, setAddToGroupMember] = useState<OrgMember | null>(null);

    // Platform admin org selector state
    const [orgSelectorData, setOrgSelectorData] = useState<OrgSelectorData | null>(null);
    const [isOrgSelectorOpen, setIsOrgSelectorOpen] = useState(false);
    const [isSwitchingOrg, startTransition] = useTransition();

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

    const fetchOrgSelectorData = async () => {
        const data = await getOrgSelectorData();
        setOrgSelectorData(data);
    };

    useEffect(() => {
        fetchMembers();
        fetchOrgSelectorData();
    }, []);

    // Listen for avatar updates to refresh member data
    useEffect(() => {
        const handleAvatarUpdate = () => {
            fetchMembers();
        };
        window.addEventListener('avatarUpdated', handleAvatarUpdate);
        return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    }, []);

    const handleSelectOrg = (orgId: string) => {
        if (!orgSelectorData || orgId === orgSelectorData.currentOrgId) {
            setIsOrgSelectorOpen(false);
            return;
        }

        startTransition(async () => {
            const result = await switchPlatformAdminOrg(orgId);
            if (result.success) {
                setIsOrgSelectorOpen(false);
                // Refresh data after org switch
                setLoading(true);
                await fetchOrgSelectorData();
                await fetchMembers();
            } else {
                console.error('Failed to switch org:', result.error);
            }
        });
    };

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
                    context={orgSelectorData?.isPlatformAdmin ? "Platform Admin View" : "My Organization"}
                    title="Manage Users"
                    onBack={() => router.push('/dashboard')}
                    backLabel="Back to Dashboard"
                >
                    <div className="flex items-center space-x-4">
                        {/* Platform Admin Org Selector */}
                        {orgSelectorData?.isPlatformAdmin && orgSelectorData.organizations.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setIsOrgSelectorOpen(!isOrgSelectorOpen)}
                                    disabled={isSwitchingOrg}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                                >
                                    <Shield size={14} className="text-purple-400" />
                                    <span className="text-sm font-bold text-purple-300">
                                        {isSwitchingOrg ? 'Switching...' : orgSelectorData.currentOrgName || 'Select Org'}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className={`text-purple-400 transition-transform ${isOrgSelectorOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Dropdown */}
                                {isOrgSelectorOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setIsOrgSelectorOpen(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-2 z-50 bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl min-w-[280px] max-h-80 overflow-y-auto dropdown-scrollbar">
                                            <div className="p-2">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 py-2">
                                                    Switch Organization
                                                </p>
                                                {orgSelectorData.organizations.map((org) => (
                                                    <button
                                                        key={org.id}
                                                        onClick={() => handleSelectOrg(org.id)}
                                                        disabled={isSwitchingOrg}
                                                        className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-colors ${
                                                            org.id === orgSelectorData.currentOrgId
                                                                ? 'bg-brand-blue-light/10 text-brand-blue-light'
                                                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                                                                org.id === orgSelectorData.currentOrgId
                                                                    ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                                                    : 'bg-white/10 text-slate-400'
                                                            }`}>
                                                                {org.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-medium text-sm">{org.name}</p>
                                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                    <Users size={10} />
                                                                    {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {org.id === orgSelectorData.currentOrgId && (
                                                            <Check size={16} className="text-brand-blue-light" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex items-center space-x-2 text-brand-blue-light mr-4">
                            <div className="w-2 h-2 rounded-full bg-brand-blue-light animate-pulse"></div>
                            <span className="text-sm font-bold uppercase tracking-widest">{members.length} Members</span>
                        </div>

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
                ) : (
                    /* Grid of Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {members.map((member) => (
                            <UserCard
                                key={member.id}
                                member={member}
                                onClick={() => setSelectedMember(member)}
                                onAddToGroup={() => setAddToGroupMember(member)}
                            />
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
