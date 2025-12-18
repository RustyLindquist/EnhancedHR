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

    const handleAskInstructor = () => {
        const prompt = `Tell me more about ${instructor.name} and their expertise in ${course.title}. What makes them qualified to teach this course?`;
        onAskPrometheus(prompt);
    };

    return (
        <div className="animate-fade-in">
            {/* Course Category Badges - at the very top */}
            <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] font-bold uppercase tracking-wider">
                    Leadership
                </span>
                <span className="px-3 py-1 rounded-full bg-brand-blue-light/20 text-brand-blue-light text-[10px] font-bold uppercase tracking-wider">
                    Communication
                </span>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Description + Skills + Credits */}
                <div className="space-y-6">
                    {/* Description */}
                    <div>
                        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange mb-3">
                            DESCRIPTION
                        </h3>
                        <div className="text-sm text-slate-300 leading-relaxed space-y-4">
                            <p>{course.description}</p>
                            <p className="text-slate-400">
                                Discover how to leverage modern talent including people analytics, trend sustainability, and strategy to drive your competencies. Get expert analysis and access to gain on analytics. Learn to gain the frameworks necessary to build a resilient culture that adapts to rapid technological change to lead in today's dynamic workplace.
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
                    {(hasSHRM || hasHRCI) && (
                        <div>
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange mb-3">
                                CREDITS YOU'LL EARN
                            </h3>
                            <div className="flex items-center gap-6">
                                {hasSHRM && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-bold text-brand-blue-light">2.0</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">SHRM</span>
                                    </div>
                                )}
                                {hasHRCI && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl font-bold text-[#c084fc]">1.5</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">HRCI</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Course Image */}
                <div className="relative">
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                        {course.image ? (
                            <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-blue-light/20 to-brand-orange/20 flex items-center justify-center">
                                <span className="text-6xl text-white/20">📚</span>
                            </div>
                        )}

                        {/* Rating Badge - Top Right */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm">
                            <Star size={12} fill="#fbbf24" className="text-amber-400" />
                            <span className="text-xs font-bold text-white">{course.rating?.toFixed(1) || '4.2'}</span>
                        </div>
                    </div>
                </div>

                {/* Column 3: Instructor Info */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light">
                        INSTRUCTOR
                    </h3>

                    {/* Instructor Name & Title */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-blue-light/30 flex-shrink-0">
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
                            This is the person's about bio. Within the Expert's Account, they will enter their bio information about themselves. When viewing a Course Overview page, this section will show a preview version of what the user put in for their bio.
                        </p>
                        <p>
                            The second will be a much shorter one that is used for Course descriptions.
                        </p>
                    </div>

                    {/* Ask Button */}
                    <button
                        onClick={handleAskInstructor}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(120,192,240,0.2)] active:scale-95"
                    >
                        <Sparkles size={14} />
                        Ask about {instructor.name.split(' ')[0]}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseDescriptionSection;
