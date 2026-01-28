'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Linkedin } from 'lucide-react';
import CanvasHeader from '@/components/CanvasHeader';

interface ExpertDetailsHeaderProps {
    linkedinUrl?: string | null;
}

const ExpertDetailsHeader: React.FC<ExpertDetailsHeaderProps> = ({ linkedinUrl }) => {
    const router = useRouter();

    const handleBack = () => {
        router.push('/experts');
    };

    return (
        <CanvasHeader
            context="Academy"
            title="Expert Details"
            onBack={handleBack}
        >
            {linkedinUrl && (
                <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B5]/20 text-[#0077B5] hover:bg-[#0077B5]/30 transition-colors text-sm font-medium"
                >
                    <Linkedin size={18} />
                    LinkedIn Profile
                </a>
            )}
        </CanvasHeader>
    );
};

export default ExpertDetailsHeader;
