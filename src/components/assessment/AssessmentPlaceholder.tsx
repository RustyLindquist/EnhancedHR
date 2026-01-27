'use client';

import React from 'react';
import { ClipboardCheck } from 'lucide-react';

interface AssessmentPlaceholderProps {
    lessonTitle: string;
    hasProgress: boolean;
    onStartAssessment: () => void;
}

const AssessmentPlaceholder: React.FC<AssessmentPlaceholderProps> = ({
    lessonTitle,
    hasProgress,
    onStartAssessment
}) => {
    return (
        <div className="aspect-video bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/10 rounded-2xl flex flex-col items-center justify-center">
            {/* Icon */}
            <div className="mb-6">
                <ClipboardCheck size={72} className="text-brand-blue-light" />
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-white mb-2">
                Knowledge Assessment
            </h2>

            {/* Subtext */}
            <p className="text-slate-400 mb-8 text-center px-4">
                This assessment opens in a dropdown panel above
            </p>

            {/* Start/Resume Button */}
            <button
                onClick={onStartAssessment}
                className="bg-brand-blue-light text-brand-black font-bold rounded-full px-8 py-3 hover:bg-white transition-all"
            >
                {hasProgress ? 'Resume Assessment' : 'Start Assessment'}
            </button>
        </div>
    );
};

export default AssessmentPlaceholder;
