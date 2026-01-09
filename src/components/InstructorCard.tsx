import React from 'react';
import { Instructor } from '../types';
import { Users, BookOpen, Star, Award, ChevronRight } from 'lucide-react';

interface InstructorCardProps {
    instructor: Instructor;
    onClick: (id: string) => void;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ instructor, onClick }) => {
    return (
        <div
            onClick={() => onClick(instructor.id)}
            className="group relative w-full h-[400px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-[0_0_40px_rgba(120,192,240,0.2)] border border-white/5 hover:border-brand-blue-light/30 bg-[#0f172a]"
        >
            {/* Animated rotating border */}
            <div className="card-hover-border rounded-2xl" />

            {/* Background Image (Portrait) */}
            <div className="absolute inset-0">
                <img
                    src={instructor.image}
                    alt={instructor.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient Overlay - Only at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent opacity-90" />
            </div>

            {/* Content Container */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">

                {/* Top Badge (Featured) */}
                {instructor.featured && (
                    <div className="absolute top-4 right-4 bg-brand-orange/20 backdrop-blur-md border border-brand-orange/30 text-brand-orange px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                        <Star size={12} fill="currentColor" /> Featured
                    </div>
                )}

                {/* Info */}
                <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">

                    {/* Role */}
                    <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        <span className="text-brand-blue-light text-xs font-bold uppercase tracking-widest">{instructor.role}</span>
                    </div>

                    {/* Name */}
                    <h3 className="text-3xl font-bold text-white mb-2 leading-tight group-hover:text-brand-blue-light transition-colors">
                        {instructor.name}
                    </h3>

                    {/* Bio Snippet */}
                    <p className="text-slate-400 text-sm line-clamp-2 mb-6 group-hover:text-slate-300 transition-colors">
                        {instructor.bio}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <BookOpen size={14} className="text-brand-blue-light" />
                                <span className="text-xs font-medium">{instructor.stats.courses} Courses</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-300">
                                <Users size={14} className="text-brand-orange" />
                                <span className="text-xs font-medium">{instructor.stats.students.toLocaleString()} Students</span>
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
