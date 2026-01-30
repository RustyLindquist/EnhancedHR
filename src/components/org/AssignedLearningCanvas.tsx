'use client';

import React, { useState, useEffect } from 'react';
import { getUserAggregateAssignments, ContentAssignment } from '@/app/actions/assignments';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, AlertCircle, Loader2, ClipboardList, LayoutGrid, List } from 'lucide-react';
import UniversalCard from '@/components/cards/UniversalCard';
import UniversalCollectionListItem from '@/components/UniversalCollectionListItem';
import { CollectionItemDetail } from '@/components/UniversalCollectionCard';

const AssignedLearningCanvas: React.FC = () => {
    const [assignments, setAssignments] = useState<ContentAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load view mode preference from localStorage on mount
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

    useEffect(() => {
        const loadAssignments = async () => {
            setLoading(true);
            setError(null);

            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setError('Please log in to view your assigned learning.');
                    setLoading(false);
                    return;
                }

                const data = await getUserAggregateAssignments(user.id);
                setAssignments(data);
            } catch (err) {
                console.error('Error loading assignments:', err);
                setError('Failed to load assigned learning.');
            }

            setLoading(false);
        };

        loadAssignments();
    }, []);

    // Separate required and suggested assignments
    const requiredAssignments = assignments.filter(a => a.assignment_type === 'required');
    const suggestedAssignments = assignments.filter(a => a.assignment_type === 'recommended');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] text-slate-400">
                <Loader2 className="animate-spin mr-2" />
                Loading your assigned learning...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-400">
                <AlertCircle size={40} className="mb-4" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full relative">
            {/* Note: Header is provided by MainCanvas */}
            {/* Scrollable Content */}
            <div className="w-full max-w-[1600px] mx-auto px-8 pb-32 animate-fade-in relative z-10 pl-20 pt-8 custom-scrollbar">
                {assignments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <ClipboardList size={48} className="text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Assigned Learning</h3>
                        <p className="text-slate-400 max-w-sm text-center">
                            You don't have any assigned content yet. Check back later or explore the Academy to find courses.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* View Toggle - at top right */}
                        <div className="flex justify-end">
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

                        {/* Required Content Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-brand-red/10 rounded-lg">
                                    <BookOpen size={20} className="text-brand-red" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Required Content</h2>
                                    <p className="text-sm text-slate-400">
                                        {requiredAssignments.length} {requiredAssignments.length === 1 ? 'item' : 'items'} assigned to you
                                    </p>
                                </div>
                            </div>

                            {requiredAssignments.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {requiredAssignments.map((assignment) => (
                                            <AssignmentCard key={assignment.id} assignment={assignment} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {requiredAssignments.map((assignment) => (
                                            <AssignmentListItem key={assignment.id} assignment={assignment} />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <BookOpen size={32} className="mx-auto text-slate-600 mb-2" />
                                    <p className="text-slate-400 text-sm">No required content assigned.</p>
                                </div>
                            )}
                        </section>

                        {/* Suggested Content Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <BookOpen size={20} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Suggested Content</h2>
                                    <p className="text-sm text-slate-400">
                                        {suggestedAssignments.length} {suggestedAssignments.length === 1 ? 'item' : 'items'} recommended for you
                                    </p>
                                </div>
                            </div>

                            {suggestedAssignments.length > 0 ? (
                                viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {suggestedAssignments.map((assignment) => (
                                            <AssignmentCard key={assignment.id} assignment={assignment} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {suggestedAssignments.map((assignment) => (
                                            <AssignmentListItem key={assignment.id} assignment={assignment} />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <BookOpen size={32} className="mx-auto text-slate-600 mb-2" />
                                    <p className="text-slate-400 text-sm">No suggested content assigned.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};

// Assignment Card Component
const AssignmentCard = ({ assignment }: { assignment: ContentAssignment }) => {
    // Map content_type to CardType
    const cardTypeMap: Record<string, 'COURSE' | 'MODULE' | 'LESSON' | 'RESOURCE'> = {
        course: 'COURSE',
        module: 'MODULE',
        lesson: 'LESSON',
        resource: 'RESOURCE'
    };

    const details = assignment.content_details;

    // Determine badge based on assignment source
    const getSourceBadge = () => {
        switch (assignment.assignee_type) {
            case 'org':
                return 'Organization-wide';
            case 'group':
                return 'Team Assignment';
            case 'user':
                return 'Personal Assignment';
            default:
                return undefined;
        }
    };

    return (
        <UniversalCard
            type={cardTypeMap[assignment.content_type] || 'COURSE'}
            title={details?.title || 'Unknown Content'}
            subtitle={details?.author}
            description={details?.description}
            imageUrl={details?.thumbnail_url}
            meta={details?.duration}
            categories={details?.category ? [details.category] : undefined}
            rating={details?.rating}
            credits={{
                shrm: details?.badges?.includes('SHRM'),
                hrci: details?.badges?.includes('HRCI')
            }}
            actionLabel="START"
        />
    );
};

// Assignment List Item Component for list view
const AssignmentListItem = ({ assignment }: { assignment: ContentAssignment }) => {
    const details = assignment.content_details;

    // Convert assignment to CollectionItemDetail format
    // Using unknown cast because assignment data has different shape than full Course/Module/etc types
    const itemAsCollectionDetail = {
        id: assignment.id,
        title: details?.title || 'Unknown Content',
        itemType: assignment.content_type.toUpperCase() as 'COURSE' | 'MODULE' | 'LESSON' | 'RESOURCE',
        description: details?.description,
        rating: details?.rating,
        badges: details?.badges,
        author: details?.author,
        duration: details?.duration,
        image: details?.thumbnail_url,
    } as unknown as CollectionItemDetail;

    const handleClick = () => {
        // Navigate to course - onAdd acts as the START action
    };

    const handleAdd = () => {
        // START action - navigates to course
        // This mimics the START button behavior from the card
    };

    return (
        <UniversalCollectionListItem
            item={itemAsCollectionDetail}
            onClick={handleClick}
            onAdd={handleAdd}
        />
    );
};

export default AssignedLearningCanvas;
