'use client';

import React, { useState, useEffect } from 'react';
import { getUserAggregateAssignments, ContentAssignment } from '@/app/actions/assignments';
import { createClient } from '@/lib/supabase/client';
import { BookOpen, AlertCircle, Loader2, ClipboardList } from 'lucide-react';
import UniversalCard from '@/components/cards/UniversalCard';

const AssignedLearningCanvas: React.FC = () => {
    const [assignments, setAssignments] = useState<ContentAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {requiredAssignments.map((assignment) => (
                                        <AssignmentCard key={assignment.id} assignment={assignment} />
                                    ))}
                                </div>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {suggestedAssignments.map((assignment) => (
                                        <AssignmentCard key={assignment.id} assignment={assignment} />
                                    ))}
                                </div>
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

export default AssignedLearningCanvas;
