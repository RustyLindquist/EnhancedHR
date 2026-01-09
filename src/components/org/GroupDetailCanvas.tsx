import React, { useState, useEffect } from 'react';
import { getGroupDetails, getGroupStats, getGroupMembersWithStats, GroupStats, GroupMemberWithStats } from '@/app/actions/groups';
import { ContentAssignment, getDirectAssignments, removeAssignment } from '@/app/actions/assignments';
import { Users, BookOpen, BarChart3, Plus, Sparkles, TrendingUp } from 'lucide-react';
import ContentPickerModal from './ContentPickerModal';
import UserCard from './UserCard';
import UserDetailDashboard from './UserDetailDashboard';
import AddToGroupModal from './AddToGroupModal';
import { OrgMember } from '@/app/actions/org';
import UniversalCard from '@/components/cards/UniversalCard';
import UniversalCollectionCard, { CollectionItemDetail } from '@/components/UniversalCollectionCard';
import { DragItem } from '@/types';

interface GroupDetailCanvasProps {
    group: any;
    onBack: () => void;
    manageTrigger?: number;
    onViewingMember?: (member: OrgMember | null) => void;
    onDragStart?: (item: DragItem) => void;
    onCourseClick?: (courseId: number) => void;
    onModuleClick?: (moduleItem: any) => void;
    onLessonClick?: (lessonItem: any, autoPlay?: boolean) => void;
    onConversationClick?: (conversationId: string) => void;
}

const GroupDetailCanvas: React.FC<GroupDetailCanvasProps> = ({
    group,
    onBack,
    manageTrigger,
    onViewingMember,
    onDragStart,
    onCourseClick,
    onModuleClick,
    onLessonClick,
    onConversationClick
}) => {
    const [assignments, setAssignments] = useState<ContentAssignment[]>([]);
    const [showPicker, setShowPicker] = useState(false);
    const [fullGroup, setFullGroup] = useState<any>(group);
    const [stats, setStats] = useState<GroupStats | null>(null);
    const [members, setMembers] = useState<GroupMemberWithStats[]>([]);
    const [addToGroupMember, setAddToGroupMember] = useState<OrgMember | null>(null);
    const [pickerAssignmentType, setPickerAssignmentType] = useState<'required' | 'recommended'>('required');
    const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);

    // Notify parent when viewing member changes
    useEffect(() => {
        onViewingMember?.(selectedMember);
    }, [selectedMember, onViewingMember]);

    // Clear selected member when group changes
    useEffect(() => {
        setSelectedMember(null);
    }, [group?.id]);

    useEffect(() => {
        if (group?.id) {
            loadData();
        }
    }, [group?.id]);

    // Note: manageTrigger is passed from parent but should NOT auto-open panels
    // Panels should only open when user explicitly clicks buttons
    // The manageTrigger prop can be used for other management actions if needed in the future

    const loadData = async () => {
        const [details, assigns, groupStats, memberStats] = await Promise.all([
            getGroupDetails(group.id),
            getDirectAssignments('group', group.id),
            getGroupStats(group.id),
            getGroupMembersWithStats(group.id)
        ]);

        if (details) setFullGroup(details);
        setAssignments(assigns);
        setStats(groupStats);
        setMembers(memberStats);
    };

    // Separate required and recommended assignments
    const requiredAssignments = assignments.filter(a => a.assignment_type === 'required');
    const recommendedAssignments = assignments.filter(a => a.assignment_type === 'recommended');

    const openPickerForType = (type: 'required' | 'recommended') => {
        setPickerAssignmentType(type);
        setShowPicker(true);
    };

    // Handle click on assignment cards
    const handleAssignmentClick = (item: CollectionItemDetail) => {
        if (item.itemType === 'COURSE' && onCourseClick) {
            onCourseClick(item.id as number);
        } else if (item.itemType === 'MODULE' && onModuleClick) {
            onModuleClick(item);
        } else if (item.itemType === 'LESSON' && onLessonClick) {
            onLessonClick(item);
        } else if (item.itemType === 'CONVERSATION' && onConversationClick) {
            onConversationClick(item.id as string);
        }
    };

    const navigateToGroupAnalysis = (groupId: string) => {
        // Navigate to Org Dashboard with group pre-selected
        window.location.href = `/org/analytics?groupId=${groupId}`;
    };

    if (!fullGroup) return null;

    // Show employee detail view when a member is selected
    if (selectedMember) {
        return (
            <UserDetailDashboard
                member={selectedMember}
                onBack={() => setSelectedMember(null)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent overflow-y-auto pb-36 animate-fade-in custom-scrollbar">
            {/* Note: Header is provided by MainCanvas when viewing a group */}

            {/* Section 1: Platform Usage Stats */}
            <div className="px-8 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 size={16} className="text-brand-blue-light" />
                        Platform Usage
                    </h3>
                    <button
                        onClick={() => navigateToGroupAnalysis(group.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400 text-xs font-semibold uppercase tracking-wider hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
                    >
                        <TrendingUp size={14} />
                        Full Analysis
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard
                        label="Total Learning"
                        value={stats ? formatMinutes(stats.totalLearningMinutes) : '—'}
                        color="blue"
                    />
                    <StatCard
                        label="Avg per Member"
                        value={stats ? formatMinutes(stats.avgLearningMinutes) : '—'}
                        color="purple"
                    />
                    <StatCard
                        label="Courses Completed"
                        value={stats?.coursesCompleted?.toString() || '0'}
                        color="emerald"
                    />
                    <StatCard
                        label="AI Conversations"
                        value={stats?.totalConversations?.toString() || '0'}
                        color="cyan"
                    />
                    <StatCard
                        label="Active Members"
                        value={`${stats?.activeMembers || 0}/${stats?.totalMembers || 0}`}
                        color="orange"
                    />
                    <StatCard
                        label="Total Members"
                        value={stats?.totalMembers?.toString() || '0'}
                        color="slate"
                    />
                </div>
            </div>

            {/* Section 2: Group Members Grid */}
            <div className="px-8 py-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    Group Members
                    <span className="text-brand-blue-light ml-2">({members.length})</span>
                    {fullGroup.is_dynamic && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                            <Sparkles size={10} />
                            Auto-updating
                        </span>
                    )}
                </h3>
                {members.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {members.map((member) => (
                            <UserCard
                                key={member.id}
                                member={{
                                    id: member.id,
                                    email: member.email,
                                    full_name: member.full_name,
                                    avatar_url: member.avatar_url,
                                    role: member.role,
                                    role_title: '',
                                    membership_status: member.membership_status,
                                    created_at: '',
                                    is_owner: false,
                                    courses_completed: member.courses_completed,
                                    total_time_spent_minutes: member.total_time_spent_minutes,
                                    credits_earned: member.credits_earned,
                                    last_login: '',
                                    conversations_count: member.conversations_count
                                }}
                                onClick={() => setSelectedMember({
                                    id: member.id,
                                    email: member.email,
                                    full_name: member.full_name,
                                    avatar_url: member.avatar_url,
                                    role: member.role,
                                    role_title: '',
                                    membership_status: member.membership_status,
                                    created_at: '',
                                    is_owner: false,
                                    courses_completed: member.courses_completed,
                                    total_time_spent_minutes: member.total_time_spent_minutes,
                                    credits_earned: member.credits_earned,
                                    last_login: '',
                                    conversations_count: member.conversations_count
                                })}
                                onAddToGroup={() => setAddToGroupMember({
                                    id: member.id,
                                    email: member.email,
                                    full_name: member.full_name,
                                    avatar_url: member.avatar_url,
                                    role: member.role,
                                    role_title: '',
                                    membership_status: member.membership_status,
                                    created_at: '',
                                    is_owner: false,
                                    courses_completed: member.courses_completed,
                                    total_time_spent_minutes: member.total_time_spent_minutes,
                                    credits_earned: member.credits_earned,
                                    last_login: '',
                                    conversations_count: member.conversations_count
                                })}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Users size={40} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-400">No members in this group yet.</p>
                        <p className="text-sm text-slate-500 mt-1">Use "Manage" to add members.</p>
                    </div>
                )}
            </div>

            {/* Section 3 & 4: Content Assignments (hidden for dynamic groups) */}
            {!fullGroup.is_dynamic && (
                <>
                    {/* Section 3: Required Content */}
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <BookOpen size={16} className="text-brand-red" />
                                Required Content
                                <span className="text-brand-red ml-2">({requiredAssignments.length})</span>
                            </h3>
                            <button
                                onClick={() => openPickerForType('required')}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-red/10 text-brand-red rounded-lg hover:bg-brand-red/20 transition-colors text-sm font-medium"
                            >
                                <Plus size={14} />
                                Add Required
                            </button>
                        </div>
                        {requiredAssignments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {requiredAssignments.map((assignment) => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        onRemove={() => loadData()}
                                        onClick={handleAssignmentClick}
                                        onDragStart={onDragStart}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <BookOpen size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-slate-400 text-sm">No required content assigned.</p>
                            </div>
                        )}
                    </div>

                    {/* Section 4: Suggested Content */}
                    <div className="px-8 py-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <BookOpen size={16} className="text-brand-blue-light" />
                                Suggested Content
                                <span className="text-brand-blue-light ml-2">({recommendedAssignments.length})</span>
                            </h3>
                            <button
                                onClick={() => openPickerForType('recommended')}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-blue-light/10 text-brand-blue-light rounded-lg hover:bg-brand-blue-light/20 transition-colors text-sm font-medium"
                            >
                                <Plus size={14} />
                                Add Suggested
                            </button>
                        </div>
                        {recommendedAssignments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {recommendedAssignments.map((assignment) => (
                                    <AssignmentCard
                                        key={assignment.id}
                                        assignment={assignment}
                                        onRemove={() => loadData()}
                                        onClick={handleAssignmentClick}
                                        onDragStart={onDragStart}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                                <BookOpen size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-slate-400 text-sm">No suggested content assigned.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Content Picker Modal */}
            <ContentPickerModal
                isOpen={showPicker}
                onClose={() => setShowPicker(false)}
                assigneeType="group"
                assigneeId={group.id}
                defaultAssignmentType={pickerAssignmentType}
                onSuccess={() => loadData()}
            />

            {/* Add to Group Modal */}
            {addToGroupMember && (
                <AddToGroupModal
                    memberId={addToGroupMember.id}
                    memberName={addToGroupMember.full_name}
                    onClose={() => setAddToGroupMember(null)}
                    onSuccess={() => {
                        window.dispatchEvent(new CustomEvent('groupsUpdated'));
                    }}
                />
            )}
        </div>
    );
};

// Helper to format minutes into readable time
const formatMinutes = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
};

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => {
    const valueColors: Record<string, string> = {
        blue: 'text-blue-400',
        emerald: 'text-emerald-400',
        purple: 'text-purple-400',
        orange: 'text-orange-400',
        cyan: 'text-cyan-400',
        slate: 'text-slate-300'
    };
    return (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-lg backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className={`text-2xl font-bold ${valueColors[color] || valueColors.slate}`}>{value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide font-medium mt-1">{label}</div>
        </div>
    );
};

const AssignmentCard = ({
    assignment,
    onRemove,
    onClick,
    onDragStart
}: {
    assignment: ContentAssignment;
    onRemove: () => void;
    onClick?: (item: CollectionItemDetail) => void;
    onDragStart?: (item: DragItem) => void;
}) => {
    const handleRemove = async () => {
        const result = await removeAssignment(assignment.id);
        if (result.success) {
            onRemove();
        }
    };

    const details = assignment.content_details;

    // Map assignment to CollectionItemDetail format
    const mapToCollectionItem = (): CollectionItemDetail => {
        const baseData = {
            id: assignment.content_id,
            title: details?.title || 'Unknown Content',
        };

        // Use type assertion to access extended fields that may exist
        const extendedDetails = details as any;

        switch (assignment.content_type) {
            case 'course':
                return {
                    ...baseData,
                    itemType: 'COURSE',
                    type: 'COURSE',
                    author: details?.author || '',
                    progress: 0,
                    category: details?.category || '',
                    image: details?.thumbnail_url,
                    description: details?.description || '',
                    duration: details?.duration || '',
                    rating: details?.rating || 0,
                    badges: details?.badges || [],
                    isSaved: false,
                    collections: [],
                    dateAdded: assignment.created_at || new Date().toISOString(),
                } as any;

            case 'module':
                return {
                    ...baseData,
                    itemType: 'MODULE',
                    author: details?.author,
                    courseTitle: extendedDetails?.course_title,
                    duration: details?.duration,
                    image: details?.thumbnail_url,
                    course_id: extendedDetails?.course_id,
                } as any;

            case 'lesson':
                return {
                    ...baseData,
                    itemType: 'LESSON',
                    moduleTitle: extendedDetails?.module_title,
                    courseTitle: extendedDetails?.course_title,
                    duration: details?.duration,
                    image: details?.thumbnail_url,
                    module_id: extendedDetails?.module_id,
                    course_id: extendedDetails?.course_id,
                } as any;

            default:
                // Handle resource and any other types
                return {
                    ...baseData,
                    itemType: 'RESOURCE',
                    description: details?.description,
                } as any;
        }
    };

    const collectionItem = mapToCollectionItem();

    return (
        <UniversalCollectionCard
            item={collectionItem}
            onRemove={() => handleRemove()}
            onClick={(item) => onClick?.(item)}
            onDragStart={onDragStart}
        />
    );
};

export default GroupDetailCanvas;
