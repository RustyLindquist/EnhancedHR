'use client';

import React from 'react';
import { Star, CheckCircle, ExternalLink } from 'lucide-react';
import { Course } from '../../types';

interface CourseDescriptionSectionProps {
    course: Course;
    onStartLearning: () => void;
    onAskPrometheus: (prompt: string) => void;
    onViewExpert?: (expertId: string) => void;
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
    onAskPrometheus,
    onViewExpert
}) => {
    // Parse skills from course or use defaults
    const skills = (course as any).skills || DEFAULT_SKILLS;

    // Check for credit badges
    const hasSHRM = course.badges?.includes('SHRM');
    const hasHRCI = course.badges?.includes('HRCI');

    // Mock instructor data (would come from course in real implementation)
    const instructor = {
        id: (course as any).authorId || 'expert-1',
        name: course.author || 'Rusty Lindquist',
        title: 'CEO | HR Engineering',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    };

    const handleAskCourse = () => {
        const prompt = `Give me a detailed summary of the course "${course.title}". What are the key topics covered and what will I learn?`;
        onAskPrometheus(prompt);
    };

    const handleViewExpertPage = () => {
        if (onViewExpert) {
            onViewExpert(instructor.id);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Featured Course Image - Full Width at Top */}
            <div className="relative w-full h-[350px] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_8px_25px_rgba(0,0,0,0.4)]">
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

                {/* Rating & Categories Badge - Top Right */}
                <div className="absolute top-4 right-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/10">
                    {/* Category Tags */}
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-white/10 text-brand-orange text-[10px] font-bold uppercase tracking-wider">
                            Leadership
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white/10 text-brand-blue-light text-[10px] font-bold uppercase tracking-wider">
                            Communication
                        </span>
                    </div>
                    {/* Divider */}
                    <div className="w-px h-5 bg-white/20" />
                    {/* Star Rating */}
                    <div className="flex items-center gap-1.5">
                        <Star size={16} fill="#fbbf24" className="text-amber-400" />
                        <span className="text-base font-bold text-white">{course.rating?.toFixed(1) || '4.2'}</span>
                    </div>
                </div>

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Two Column Layout - 70/30 Split with Divider */}
            <div className="flex flex-col lg:flex-row pb-[75px] mt-8">
                {/* Column 1: Course Description (70%) */}
                <div className="lg:w-[70%] space-y-6">
                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]">
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

                    {/* Skills and Credits - 60/40 Split */}
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Skills You'll Learn (60%) */}
                        <div className="lg:w-[60%]">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)] mb-3">
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

                        {/* Credits You'll Earn (40%) */}
                        <div className="lg:w-[40%]">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)] mb-3">
                                CREDITS YOU'LL EARN
                            </h3>
                            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
                                <div className="grid grid-cols-2 gap-6">
                                    {/* SHRM Column */}
                                    {(hasSHRM || !hasSHRM && !hasHRCI) && (
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-4xl font-bold text-brand-blue-light">2</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase mt-1">SHRM</span>
                                            <span className="text-[10px] text-slate-500">Recertification</span>
                                        </div>
                                    )}
                                    {/* HRCI Column */}
                                    {(hasHRCI || !hasSHRM && !hasHRCI) && (
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-4xl font-bold text-[#c084fc]">1.5</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase mt-1">HRCI</span>
                                            <span className="text-[10px] text-slate-500">Credit Hours</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block w-px bg-white/10 flex-shrink-0 mx-[15px]" />

                {/* Column 2: Instructor Info (30%) */}
                <div className="lg:w-[30%] space-y-4">
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

                    {/* Expert Page Button */}
                    <button
                        onClick={handleViewExpertPage}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-xs font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(120,192,240,0.2)] active:scale-95"
                    >
                        <ExternalLink size={14} />
                        Expert Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseDescriptionSection;
