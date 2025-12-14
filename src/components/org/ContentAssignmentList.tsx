'use client';

import React from 'react';
import { Trash2, BookOpen, ExternalLink } from 'lucide-react';
import { ContentAssignment } from '@/app/actions/assignments';
import Link from 'next/link';
import { removeAssignment } from '@/app/actions/assignments';

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
        <div className="space-y-2">
            {assignments.map((assignment) => (
                <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-brand-blue-light/30 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${assignment.content_type === 'course' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400'}`}>
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <Link href={`/${assignment.content_type === 'course' ? 'admin/courses/' + assignment.content_id : '#'}`} className="text-sm font-semibold text-white hover:text-brand-blue-light flex items-center gap-1 transition-colors">
                                {assignment.content_details?.title || 'Untitled Content'}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${assignment.assignment_type === 'required'
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                    {assignment.assignment_type}
                                </span>
                                <span className="text-xs text-slate-400 capitalize">{assignment.content_type}</span>
                            </div>
                        </div>
                    </div>

                    {canManage && (
                        <button
                            onClick={() => handleRemove(assignment.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Remove Assignment"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ContentAssignmentList;
