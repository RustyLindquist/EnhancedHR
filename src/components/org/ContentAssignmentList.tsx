'use client';

import React from 'react';
import { ContentAssignment } from '@/app/actions/assignments';
import Link from 'next/link';
import { removeAssignment } from '@/app/actions/assignments';
import UniversalCard, { CardType } from '../cards/UniversalCard';

interface ContentAssignmentListProps {
    assignments: ContentAssignment[];
    onRemove?: (id: string) => void;
    canManage?: boolean;
}

const ContentAssignmentList: React.FC<ContentAssignmentListProps> = ({ assignments, onRemove, canManage = false }) => {

    const handleRemove = async (id: string) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return;

        const res = await removeAssignment(id);
        if (res.success) {
            if (onRemove) onRemove(id);
        } else {
            alert('Failed to remove assignment');
        }
    };

    if (assignments.length === 0) {
        return (
            <div className="p-4 text-sm text-slate-400 italic bg-white/5 rounded-lg text-center border border-white/10">
                No content assigned yet.
            </div>
        );
    }

    return (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {assignments.map((assignment) => {
                // Map Type
                let cardType: CardType = 'RESOURCE';
                const typeUpper = assignment.content_type.toUpperCase();
                if (['COURSE', 'MODULE', 'LESSON'].includes(typeUpper)) {
                    cardType = typeUpper as CardType;
                }

                // Map Attributes
                const title = assignment.content_details?.title || 'Untitled Content';
                const imageUrl = assignment.content_details?.thumbnail_url;
                const badges = [assignment.assignment_type.toUpperCase()];

                const href = `/${assignment.content_type === 'course' ? 'admin/courses/' + assignment.content_id : '#'}`;

                return (
                    <div key={assignment.id} className="relative">
                        <Link href={href} className="block h-full">
                            <UniversalCard
                                type={cardType}
                                title={title}
                                description={`Assigned as ${assignment.assignment_type}`}
                                imageUrl={imageUrl}
                                categories={badges}
                                actionLabel="OPEN"
                                onRemove={canManage ? () => handleRemove(assignment.id) : undefined}
                                onAction={() => { }} // Let Link handle click, but button exists visually
                            />
                        </Link>
                    </div>
                );
            })}
        </div>
    );
};

export default ContentAssignmentList;
