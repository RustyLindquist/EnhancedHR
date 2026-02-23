'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Linkedin, Globe } from 'lucide-react';
import CanvasHeader from '@/components/CanvasHeader';
import { useBackHandler } from '@/hooks/useBackHandler';

const XIcon = ({ size = 18 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

interface ExpertDetailsHeaderProps {
    linkedinUrl?: string | null;
    twitterUrl?: string | null;
    websiteUrl?: string | null;
}

const ExpertDetailsHeader: React.FC<ExpertDetailsHeaderProps> = ({ linkedinUrl, twitterUrl, websiteUrl }) => {
    const router = useRouter();

    const handleBack = () => {
        router.push('/experts');
    };

    // Register browser back button handler to go to experts page
    useBackHandler(handleBack);

    const hasSocials = linkedinUrl || twitterUrl || websiteUrl;

    return (
        <CanvasHeader
            context="Academy"
            title="Expert Details"
            onBack={handleBack}
        >
            {hasSocials && (
                <div className="flex items-center gap-2">
                    {linkedinUrl && (
                        <a
                            href={linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/20 text-[#0077B5] hover:bg-[#0077B5]/30 transition-colors text-sm font-medium"
                        >
                            <Linkedin size={18} />
                            LinkedIn
                        </a>
                    )}
                    {twitterUrl && (
                        <a
                            href={twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
                        >
                            <XIcon size={16} />
                            X
                        </a>
                    )}
                    {websiteUrl && (
                        <a
                            href={websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
                        >
                            <Globe size={18} />
                            Website
                        </a>
                    )}
                </div>
            )}
        </CanvasHeader>
    );
};

export default ExpertDetailsHeader;
