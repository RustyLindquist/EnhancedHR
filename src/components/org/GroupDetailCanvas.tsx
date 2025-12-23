import React, { useState, useEffect } from 'react';
import { GroupMember, getGroupDetails } from '@/app/actions/groups';
import { ContentAssignment, getDirectAssignments } from '@/app/actions/assignments';
import { Users, BookOpen, BarChart3, Clock, CheckCircle2, TrendingUp, Plus, Settings } from 'lucide-react';
import ContentAssignmentList from './ContentAssignmentList';
import ContentPickerModal from './ContentPickerModal';
import GroupManagement from './GroupManagement';
import { UserContextItem } from '@/types';
import UniversalCollectionCard from '../UniversalCollectionCard';

interface GroupDetailCanvasProps {
    group: any;
    onBack: () => void;
    manageTrigger?: number;
}

const GroupDetailCanvas: React.FC<GroupDetailCanvasProps> = ({ group, onBack, manageTrigger }) => {
    const [assignments, setAssignments] = useState<ContentAssignment[]>([]);
    const [showPicker, setShowPicker] = useState(false);
    const [showEditGroup, setShowEditGroup] = useState(false);
    const [fullGroup, setFullGroup] = useState<any>(group); // Initialize with prop, upgrade with fetch

    useEffect(() => {
        if (group?.id) {
            loadData();
        }
    }, [group?.id]);

    // Lifted state handler
    useEffect(() => {
        if (manageTrigger && manageTrigger > 0) {
            setShowEditGroup(true);
        }
    }, [manageTrigger]);

    const loadData = async () => {
        // Parallel fetch for speed
        const [details, assigns] = await Promise.all([
            getGroupDetails(group.id),
            getDirectAssignments('group', group.id)
        ]);

        if (details) {
            setFullGroup(details);
        }
        setAssignments(assigns);
    };

    if (!fullGroup) return null;

    return (
        <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-36 animate-fade-in">
            {/* Header Content moved to MainCanvas GlobalTopPanel */}

            {/* Platform Usage (Aggregated Mock) */}
            <div className="px-8 py-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart3 size={16} className="text-brand-blue-light" />
                    Group Platform Usage
                </h3>
                <div className="grid grid-cols-4 gap-4">
                    <StatCard label="Avg. Learning Hours" value="12.4h" icon={Clock} color="blue" />
                    <StatCard label="Courses Completed" value="156" icon={CheckCircle2} color="emerald" />
                    <StatCard label="Avg. Engagement" value="84%" icon={TrendingUp} color="purple" />
                    <StatCard label="Active Members" value={`${fullGroup.member_count}`} icon={Users} color="orange" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8 px-8 py-4">
                {/* Assignments Column */}
                <div className="col-span-1">
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-white">Required & Recommended</h3>
                                <p className="text-xs text-slate-400 mt-1">Content assigned to this group</p>
                            </div>
                            <button
                                onClick={() => setShowPicker(true)}
                                className="p-2 bg-brand-blue-light/10 text-brand-blue-light rounded-lg hover:bg-brand-blue-light/20 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <ContentAssignmentList
                            assignments={assignments}
                            onRemove={(id) => loadData()}
                            canManage={true}
                        />
                    </div>
                </div>

                {/* Members Column */}
                <div className="col-span-2">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users size={16} className="text-slate-400" />
                        Group Members
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {fullGroup.members?.map((member: any) => (
                            <div key={member.user_id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center gap-4 hover:bg-white/10 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold overflow-hidden border border-white/10">
                                    {(member.profile_image_url || member.profile?.avatar_url) ? (
                                        <img src={member.profile_image_url || member.profile?.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        ((member.full_name || member.profile?.full_name || 'U') as string).charAt(0)
                                    )}
                                </div>
                                <div>
                                    <div className="font-bold text-white">{member.full_name || member.profile?.full_name || 'Unknown User'}</div>
                                    <div className="text-xs text-slate-400">{member.role || member.profile?.role || 'Member'} • {member.headline || member.profile?.headline || 'No specific role'}</div>
                                </div>
                            </div>
                        ))}
                        {(!fullGroup.members || fullGroup.members.length === 0) && (
                            <div className="col-span-2 text-center py-8 text-slate-500 italic bg-white/5 rounded-xl border border-dashed border-white/10">
                                No members in this group yet. Use "Manage" to add members.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ContentPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                assigneeType="group"
                assigneeId={group.id}
                onSuccess={() => loadData()}
            />

            <GroupManagement
                isOpen={showEditGroup}
                onClose={() => setShowEditGroup(false)}
                editGroup={fullGroup}
                onSuccess={() => {
                    window.location.reload();
                }}
            />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => {
    // Adjusted specific colors for dark mode visibility
    const colors: any = {
        blue: 'bg-blue-500/20 text-blue-400',
        emerald: 'bg-emerald-500/20 text-emerald-400',
        purple: 'bg-purple-500/20 text-purple-400',
        orange: 'bg-orange-500/20 text-orange-400'
    };
    return (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className={`p-3 rounded-lg ${colors[color]}`}>
                <Icon size={20} />
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</div>
            </div>
        </div>
    );
};

export default GroupDetailCanvas;

