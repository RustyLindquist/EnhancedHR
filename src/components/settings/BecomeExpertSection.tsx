'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import BecomeExpertBanner from './BecomeExpertBanner';
import { becomeExpert } from '@/app/actions/expert-application';

interface BecomeExpertSectionProps {
    userId: string;
    fullName: string;
    authorStatus: string | null;
}

export default function BecomeExpertSection({
    authorStatus,
}: BecomeExpertSectionProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    // Don't show anything if user is already an expert
    if (authorStatus === 'approved' || authorStatus === 'pending') {
        return null;
    }

    const handleBecomeExpert = () => {
        setError(null);
        startTransition(async () => {
            const result = await becomeExpert();
            if (result.success) {
                // Redirect to Expert Dashboard
                router.push('/author');
            } else {
                setError(result.error || 'Something went wrong');
            }
        });
    };

    return (
        <div className="relative">
            {isPending && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Setting up your Expert account...</span>
                    </div>
                </div>
            )}
            {error && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}
            <BecomeExpertBanner onSubmitProposal={handleBecomeExpert} />
        </div>
    );
}
