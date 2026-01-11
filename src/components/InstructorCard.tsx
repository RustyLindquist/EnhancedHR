import React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { ExpertWithPublishedCourses } from '@/app/actions/experts';

interface InstructorCardProps {
    instructor: ExpertWithPublishedCourses;
    onClick: (id: string) => void;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ instructor, onClick }) => {
    // Get initials for fallback avatar
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div
            onClick={() => onClick(instructor.id)}
            className="group relative w-full h-[400px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(120,192,240,0.2)] border border-white/5 hover:border-brand-blue-light/30 bg-[#0f172a]"
        >
            {/* Animated rotating border */}
            <div className="card-hover-border rounded-2xl" />

            {/* Background - Avatar or Gradient */}
            <div className="absolute inset-0">
                {instructor.avatar ? (
                    <img
                        src={instructor.avatar}
                        alt={instructor.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-blue-light/20 via-slate-800 to-brand-orange/20 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center text-5xl font-bold text-white/60">
                            {getInitials(instructor.name)}
                        </div>
                    </div>
                )}
                {/* Gradient Overlay - Only at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent opacity-90" />
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">

                {/* Info */}
                <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">

                    {/* Name */}
                    <h3 className="text-3xl font-bold text-white mb-1 leading-tight group-hover:text-brand-blue-light transition-colors">
                        {instructor.name}
                    </h3>

                    {/* Expert Title - only show if set */}
                    {instructor.role && (
                        <p className="text-brand-blue-light text-sm font-medium mb-3">
                            {instructor.role}
                        </p>
                    )}

                    {/* Bio Snippet - only show if set */}
                    {instructor.bio && (
                        <p className="text-slate-400 text-sm line-clamp-2 mb-4 group-hover:text-slate-300 transition-colors">
                            {instructor.bio}
                        </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <BookOpen size={14} className="text-brand-blue-light" />
                                <span className="text-xs font-medium">
                                    {instructor.publishedCourseCount} {instructor.publishedCourseCount === 1 ? 'Course' : 'Courses'}
                                </span>
                            </div>
                        </div>

                        {/* Action Icon */}
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-blue-light group-hover:text-brand-black transition-all duration-300">
                            <ChevronRight size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstructorCard;
