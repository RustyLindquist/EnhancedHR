'use client';

import React, { useState } from 'react';
import { Check, X, ExternalLink, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PendingAuthor {
    id: string;
    full_name: string;
    email: string;
    author_bio: string;
    linkedin_url: string;
    created_at: string;
}

interface AuthorApprovalListProps {
    authors: PendingAuthor[];
}

export default function AuthorApprovalList({ authors }: AuthorApprovalListProps) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    const handleAction = async (userId: string, action: 'approve' | 'reject') => {
        setProcessingId(userId);
        try {
            const res = await fetch('/api/admin/authors/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action }),
            });

            if (!res.ok) throw new Error('Failed to process request');

            router.refresh();
        } catch (error) {
            console.error('Error processing author:', error);
            alert('Failed to process request. Please try again.');
        } finally {
            setProcessingId(null);
        }
    };

    if (authors.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-white/5 rounded-2xl border border-white/10">
                No pending applications.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {authors.map((author) => (
                <div key={author.id} className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">{author.full_name || 'Unknown User'}</h3>
                            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">{author.email}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <a
                                href={author.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-brand-blue-light hover:underline flex items-center gap-1"
                            >
                                LinkedIn Profile <ExternalLink size={12} />
                            </a>
                        </div>

                        <p className="text-sm text-slate-400 bg-black/20 p-3 rounded-lg border border-white/5">
                            {author.author_bio}
                        </p>
                    </div>

                    <div className="flex gap-3 shrink-0">
                        <button
                            onClick={() => handleAction(author.id, 'reject')}
                            disabled={!!processingId}
                            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-sm hover:bg-red-500/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {processingId === author.id ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
                            Reject
                        </button>
                        <button
                            onClick={() => handleAction(author.id, 'approve')}
                            disabled={!!processingId}
                            className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 font-bold text-sm hover:bg-green-500/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {processingId === author.id ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                            Approve
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
