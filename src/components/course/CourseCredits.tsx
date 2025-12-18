'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { CourseBadge } from '../../types';

interface CourseCreditsProps {
    badges: CourseBadge[];
    shrmCredits?: number;
    hrciCredits?: number;
    className?: string;
}

const CourseCredits: React.FC<CourseCreditsProps> = ({
    badges,
    shrmCredits = 2.0,
    hrciCredits = 1.5,
    className = ''
}) => {
    const hasSHRM = badges.includes('SHRM');
    const hasHRCI = badges.includes('HRCI');

    if (!hasSHRM && !hasHRCI) {
        return null;
    }

    return (
        <div className={`${className}`}>
            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange mb-3">
                CREDITS YOU'LL EARN
            </h3>
            <div className="flex flex-wrap gap-3">
                {hasSHRM && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4f46e5]/10 border border-[#4f46e5]/30">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#4f46e5]/20">
                            <Award size={16} className="text-[#818cf8]" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-[#818cf8]">{shrmCredits.toFixed(1)}</span>
                            <span className="text-[10px] font-bold tracking-wider text-[#818cf8]/70 ml-1.5 uppercase">SHRM</span>
                        </div>
                    </div>
                )}

                {hasHRCI && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#9333ea]/10 border border-[#9333ea]/30">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#9333ea]/20">
                            <Award size={16} className="text-[#c084fc]" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-[#c084fc]">{hrciCredits.toFixed(1)}</span>
                            <span className="text-[10px] font-bold tracking-wider text-[#c084fc]/70 ml-1.5 uppercase">HRCI</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCredits;
