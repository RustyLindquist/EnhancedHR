import React from 'react';
import { Instructor, Course } from '../types';
import { BookOpen, Globe, Linkedin, Award, Star, Users } from 'lucide-react';
import CanvasHeader from './CanvasHeader';

// Custom X (formerly Twitter) icon
const XIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);
import CardStack from './CardStack';

interface InstructorPageProps {
    instructor: Instructor;
    courses: Course[];
    onBack: () => void;
    onCourseClick: (courseId: number) => void;
}

const InstructorPage: React.FC<InstructorPageProps> = ({ instructor, courses, onBack, onCourseClick }) => {
    // Filter courses for this instructor
    // Note: In a real app, we might filter by author ID, but for now we'll match by name or just show all for demo if name doesn't match perfectly
    const instructorCourses = courses.filter(c => c.author === instructor.name);

    // Social/Connect icons
    const socialIcons = (
        <div className="flex gap-3">
            <button className="p-3 rounded-lg bg-white/5 hover:bg-[#0077b5] hover:text-white text-slate-400 transition-colors">
                <Linkedin size={20} />
            </button>
            <button className="p-3 rounded-lg bg-white/5 hover:bg-black hover:text-white text-slate-400 transition-colors">
                <XIcon size={20} />
            </button>
            <button className="p-3 rounded-lg bg-white/5 hover:bg-brand-blue-light hover:text-brand-black text-slate-400 transition-colors">
                <Globe size={20} />
            </button>
        </div>
    );

    // Stats for header
    const headerStats = (
        <div className="flex items-center gap-6 text-slate-300 text-sm">
            <div className="flex items-center gap-2">
                <Users size={16} className="text-brand-blue-light" />
                <span className="font-medium">{instructor.stats.students.toLocaleString()} Students</span>
            </div>
            <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-brand-blue-light" />
                <span className="font-medium">{instructor.stats.courses} Courses</span>
            </div>
            <div className="flex items-center gap-2">
                <Star size={16} className="text-brand-orange" fill="currentColor" />
                <span className="font-medium">{instructor.stats.rating} Expert Rating</span>
            </div>
        </div>
    );

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar bg-transparent relative z-20">
            <CanvasHeader
                context="Academy"
                title="Expert Details"
                onBack={onBack}
            >
                {headerStats}
            </CanvasHeader>

            {/* Profile Section */}
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="flex items-start gap-8 mb-12">
                    {/* Left Column: Avatar + Credentials */}
                    <div className="flex-shrink-0">
                        {/* Large Avatar */}
                        <div className="w-[320px] h-[320px] rounded-2xl overflow-hidden border-4 border-white/10 shadow-2xl">
                            <img
                                src={instructor.avatar}
                                alt={instructor.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Credentials - directly under photo */}
                        <section className="mt-6 w-[320px]">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                                Credentials & Expertise
                            </h3>
                            <div className="space-y-3">
                                {instructor.credentials.map((cred, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
                                        <Award size={18} className="text-brand-blue-light mt-0.5" />
                                        <span className="text-slate-300 text-sm font-medium">{cred}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Name and details */}
                    <div className="pt-4 flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                {instructor.name}
                            </h1>
                            {socialIcons}
                        </div>

                        {/* Professional title */}
                        {instructor.role && (
                            <p className="text-brand-blue-light text-lg mb-4">
                                {instructor.role}
                            </p>
                        )}

                        {instructor.featured && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-xs font-bold uppercase tracking-wider mb-4">
                                <Star size={10} fill="currentColor" /> Featured Expert
                            </span>
                        )}

                        {/* Bio - full width, smaller font, supports line breaks */}
                        <div className="text-slate-400 leading-relaxed text-sm whitespace-pre-line">
                            {instructor.bio}
                        </div>
                    </div>
                </div>

                {/* Courses Section */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            Courses by {instructor.name.split(' ')[0]}
                        </h2>
                        <span className="text-sm text-slate-500">
                            Showing {instructorCourses.length} courses
                        </span>
                    </div>

                    {instructorCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {instructorCourses.map(course => (
                                <div key={course.id} className="transform hover:-translate-y-1 transition-transform duration-300">
                                    <CardStack
                                        {...course}
                                        onClick={onCourseClick}
                                        onAddClick={() => { }} // No-op for now or pass handler
                                        onDragStart={() => { }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 rounded-2xl bg-white/5 border border-white/10 text-center">
                            <BookOpen size={48} className="text-slate-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Courses Found</h3>
                            <p className="text-slate-400">
                                It seems we couldn't find any courses linked to this instructor in the demo data.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstructorPage;
