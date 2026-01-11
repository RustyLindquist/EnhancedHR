import React from 'react';
import { Instructor, Course } from '../types';
import { ArrowLeft, BookOpen, Users, Star, Globe, Linkedin, Award, CheckCircle } from 'lucide-react';

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

    return (
        <div className="w-full h-full overflow-y-auto custom-scrollbar bg-[#0A0D12] relative z-20">

            {/* Hero Section */}
            <div className="relative w-full h-[500px]">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <img
                        src={instructor.image}
                        alt={instructor.name}
                        className="w-full h-full object-cover object-top opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0A0D12]/30 via-[#0A0D12]/80 to-[#0A0D12]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D12] via-[#0A0D12]/60 to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="absolute top-8 left-8 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all backdrop-blur-md group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Experts</span>
                </button>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 w-full p-12 max-w-5xl">
                    <div className="flex items-end gap-8">
                        {/* Avatar (overlap) */}
                        <div className="w-40 h-40 rounded-2xl overflow-hidden border-4 border-[#0A0D12] shadow-2xl flex-shrink-0 relative z-10 hidden md:block">
                            <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 mb-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 rounded-full bg-brand-blue-light/10 text-brand-blue-light border border-brand-blue-light/20 text-xs font-bold uppercase tracking-wider">
                                    {instructor.role}
                                </span>
                                {instructor.featured && (
                                    <span className="px-3 py-1 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Star size={10} fill="currentColor" /> Featured Expert
                                    </span>
                                )}
                            </div>

                            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                                {instructor.name}
                            </h1>

                            <div className="flex flex-wrap gap-6 text-slate-300">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-brand-blue-light" />
                                    <span className="font-medium">{instructor.stats.students.toLocaleString()} Students</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} className="text-brand-blue-light" />
                                    <span className="font-medium">{instructor.stats.courses} Courses</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-brand-orange" fill="currentColor" />
                                    <span className="font-medium">{instructor.stats.rating} Expert Rating</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

                {/* Left Column: Bio & Credentials */}
                <div className="lg:col-span-1 space-y-10">

                    {/* About */}
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            About {instructor.name.split(' ')[0]}
                        </h3>
                        <p className="text-slate-400 leading-relaxed text-lg">
                            {instructor.bio}
                        </p>
                    </section>

                    {/* Credentials */}
                    <section>
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

                    {/* Social Links */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                            Connect
                        </h3>
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
                    </section>
                </div>

                {/* Right Column: Courses */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-white">
                            Courses by {instructor.name.split(' ')[0]}
                        </h2>
                        <span className="text-sm text-slate-500">
                            Showing {instructorCourses.length} courses
                        </span>
                    </div>

                    {instructorCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
