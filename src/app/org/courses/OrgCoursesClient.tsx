'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface OrgCoursesClientProps {
    currentStatus: 'published' | 'draft';
    publishedCount: number;
    draftCount: number;
}

export default function OrgCoursesClient({
    currentStatus,
    publishedCount,
    draftCount
}: OrgCoursesClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleStatusChange = (newStatus: 'published' | 'draft') => {
        const params = new URLSearchParams(searchParams.toString());

        if (newStatus === 'published') {
            params.delete('status');
        } else {
            params.set('status', newStatus);
        }

        const queryString = params.toString();
        router.push(`/org/courses${queryString ? `?${queryString}` : ''}`);
    };

    return (
        <div className="flex items-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-full p-1">
            {/* Published Toggle */}
            <button
                onClick={() => handleStatusChange('published')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    currentStatus === 'published'
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-white'
                }`}
            >
                Published ({publishedCount})
            </button>

            {/* Drafts Toggle */}
            <button
                onClick={() => handleStatusChange('draft')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    currentStatus === 'draft'
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-white'
                }`}
            >
                Drafts ({draftCount})
            </button>
        </div>
    );
}
