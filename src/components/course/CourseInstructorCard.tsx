'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface InstructorInfo {
    name: string;
    title: string;
    bio: string;
    avatar: string;
}

interface CourseInstructorCardProps {
    instructor: InstructorInfo;
    courseTopic: string;
    onAskPrometheus: (prompt: string) => void;
    className?: string;
}

const CourseInstructorCard: React.FC<CourseInstructorCardProps> = ({
    instructor,
    courseTopic,
    onAskPrometheus,
    className = ''
}) => {
    const handleAsk = () => {
        const prompt = `Tell me more about ${instructor.name} and their expertise in ${courseTopic}. What makes them qualified to teach this course?`;
        onAskPrometheus(prompt);
    };

    return (
        <div className={`group relative bg-white/5 border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:border-white/20 ${className}`}>
            {/* Animated rotating border */}
            <div className="card-hover-border rounded-2xl" />

            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light mb-4">
                INSTRUCTOR
            </h3>

            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-blue-light/30">
                        <img
                            src={instructor.avatar}
                            alt={instructor.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold text-white mb-0.5">
                        {instructor.name}
                    </h4>
                    <p className="text-xs text-brand-blue-light mb-2">
                        {instructor.title}
                    </p>
                    <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                        {instructor.bio}
                    </p>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 my-4" />

            {/* Bio Preview - Extended */}
            <p className="text-xs text-slate-500 italic mb-4 line-clamp-2">
                The content was crafted by this expert. Whilst viewing, you will notice their approach and be able to access more information about them on the Expert page.
            </p>

            {/* Ask Button */}
            <button
                onClick={handleAsk}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(120,192,240,0.2)] active:scale-95"
            >
                <Sparkles size={14} />
                Ask
            </button>
        </div>
    );
};

export default CourseInstructorCard;
