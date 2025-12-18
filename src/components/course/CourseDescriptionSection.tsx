'use client';

import React from 'react';
import { Star, CheckCircle, Sparkles } from 'lucide-react';
import { Course } from '../../types';

interface CourseDescriptionSectionProps {
    course: Course;
    onStartLearning: () => void;
    onAskPrometheus: (prompt: string) => void;
}

// Default skills if not provided by course
const DEFAULT_SKILLS = [
    'This is one of the skills you\'ll learn in this course',
    'This is one of the skills you\'ll learn in this course',
    'This is one of the skills you\'ll learn in this course',
    'This is one of the skills you\'ll learn in this course',
];

const CourseDescriptionSection: React.FC<CourseDescriptionSectionProps> = ({
    course,
    onStartLearning,
    onAskPrometheus
}) => {
    // Parse skills from course or use defaults
    const skills = (course as any).skills || DEFAULT_SKILLS;

    // Check for credit badges
    const hasSHRM = course.badges?.includes('SHRM');
    const hasHRCI = course.badges?.includes('HRCI');

    // Mock instructor data (would come from course in real implementation)
    const instructor = {
        name: course.author || 'Rusty Lindquist',
        title: 'CEO | HR Engineering',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    };

    const handleAskCourse = () => {
        const prompt = `Give me a detailed summary of the course "${course.title}". What are the key topics covered and what will I learn?`;
        onAskPrometheus(prompt);
    };

    const handleAskInstructor = () => {
        const prompt = `Tell me more about ${instructor.name} and their expertise in ${course.title}. What makes them qualified to teach this course?`;
        onAskPrometheus(prompt);
    };

    return (
        <div className="animate-fade-in">
            {/* Course Category Badges - at the very top */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] font-bold uppercase tracking-wider border border-brand-orange/20">
                    Leadership
                </span>
                <span className="px-3 py-1 rounded-full bg-brand-blue-light/20 text-brand-blue-light text-[10px] font-bold uppercase tracking-wider border border-brand-blue-light/20">
                    Communication
                </span>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Column 1: Description + Skills + Credits (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange">
                                DESCRIPTION
                            </h3>
                            <span className="text-[10px] text-slate-500">{course.duration}</span>
                        </div>
                        <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                            <p>{course.description || 'Transform from a transactional administrator to a transformational business leader. In this comprehensive course, you will learn how to align human capital strategies directly with your organization\'s most critical business objectives. We move beyond the basics of compliance to explore how HR can drive genuine career differentiation, bridging the gap between workforce potential and bottom line results.'}</p>
                            <p className="text-slate-400">
                                Discover how to leverage modern talent including people analytics, trend sustainability, and AI augmentation. We forecast workforce needs and solve complex organizational challenges before they arise. You will gain the frameworks necessary to build a resilient culture that adapts to rapid technological change.
                            </p>
                        </div>
                    </div>

                    {/* Skills You'll Learn */}
                    <div>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange mb-3">
                            SKILLS YOU'LL LEARN
                        </h3>
                        <ul className="space-y-2">
                            {skills.map((skill: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                                    <CheckCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                                    <span>{skill}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Credits You'll Earn - Inline */}
                    <div>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange mb-3">
                            CREDITS YOU'LL EARN
                        </h3>
                        <div className="flex items-center gap-8">
                            {(hasSHRM || !hasSHRM && !hasHRCI) && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-brand-blue-light">2</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 uppercase">SHRM</span>
                                        <span className="text-[10px] text-slate-500">RECERTIFICATION</span>
                                    </div>
                                </div>
                            )}
                            {(hasHRCI || !hasSHRM && !hasHRCI) && (
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-[#c084fc]">1.5</span>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-400 uppercase">HRCI</span>
                                        <span className="text-[10px] text-slate-500">CREDIT HOURS</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Column 2: Course Image (4 cols) */}
                <div className="lg:col-span-4">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-[0_0_40px_rgba(0,0,0,0.3)]">
                        {course.image ? (
                            <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-6xl">📊</span>
                                    <p className="text-slate-500 text-sm mt-2">Course Preview</p>
                                </div>
                            </div>
                        )}

                        {/* Rating Badge - Top Right */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10">
                            <Star size={14} fill="#fbbf24" className="text-amber-400" />
                            <span className="text-sm font-bold text-white">{course.rating?.toFixed(1) || '4.2'}</span>
                        </div>

                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Column 3: Instructor Info (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light">
                        INSTRUCTOR
                    </h3>

                    {/* Instructor Name & Title */}
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-blue-light/30 flex-shrink-0 shadow-[0_0_20px_rgba(120,192,240,0.15)]">
                            <img
                                src={instructor.avatar}
                                alt={instructor.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">
                                {instructor.name}
                            </h4>
                            <p className="text-xs text-brand-blue-light">
                                {instructor.title}
                            </p>
                        </div>
                    </div>

                    {/* Bio Paragraphs */}
                    <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                        <p>
                            This is the person's about bio. Within the Expert's Account, they will enter their bio information about themselves. When viewing a Course Overview page, this section will show a preview version of what the user put in for their bio, one thing you might want to say is that the Expert page is the full bio.
                        </p>
                        <p className="text-slate-500 italic text-xs">
                            The second will be a much shorter one that is used for Course descriptions, like this one.
                        </p>
                    </div>

                    {/* Ask About Expert Button */}
                    <button
                        onClick={handleAskInstructor}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(120,192,240,0.2)] active:scale-95"
                    >
                        <Sparkles size={14} />
                        Ask About Expert
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseDescriptionSection;
