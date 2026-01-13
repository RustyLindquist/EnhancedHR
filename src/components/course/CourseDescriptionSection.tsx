'use client';

import React from 'react';
import { Star, CheckCircle, ExternalLink, Award, GraduationCap, Briefcase, BookOpen, Trophy } from 'lucide-react';
import { Course } from '../../types';
import { ExpertCredential, CredentialType } from '@/app/actions/credentials';

// Icon mapping for credential types
const credentialIconMap: Record<CredentialType, React.ReactNode> = {
    certification: <Award size={12} className="text-amber-400" />,
    degree: <GraduationCap size={12} className="text-blue-400" />,
    experience: <Briefcase size={12} className="text-green-400" />,
    expertise: <Star size={12} className="text-purple-400" />,
    publication: <BookOpen size={12} className="text-pink-400" />,
    achievement: <Trophy size={12} className="text-orange-400" />,
};

interface CourseDescriptionSectionProps {
    course: Course;
    authorCredentials?: ExpertCredential[];
    onStartLearning: () => void;
    onAskPrometheus: (prompt: string) => void;
    onViewExpert?: (expertId: string) => void;
    isOrgCourse?: boolean;
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
    authorCredentials = [],
    onStartLearning,
    onAskPrometheus,
    onViewExpert,
    isOrgCourse = false
}) => {
    // Parse skills from course or use defaults
    const skills = (course as any).skills || DEFAULT_SKILLS;

    // Check for credit badges
    const hasSHRM = course.badges?.includes('SHRM');
    const hasHRCI = course.badges?.includes('HRCI');

    // Get instructor data from course authorDetails or fallback to basic info
    const authorDetails = course.authorDetails;
    const instructor = {
        id: authorDetails?.id || 'expert-1',
        name: authorDetails?.name || course.author || 'Expert',
        title: authorDetails?.title || null,
        bio: authorDetails?.bio || null,
        credentials: authorDetails?.credentials || null,
        avatar: authorDetails?.avatar || '/images/default-avatar.png'
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

                {/* Organization Course Banner - Top Left */}
                {isOrgCourse && (
                    <div className="absolute top-0 left-0 bg-amber-600/90 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-br-xl">
                        Organization Course
                    </div>
                )}

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Two Column Layout - 70/30 Split with Divider */}
            <div className="flex flex-col lg:flex-row mt-8">
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

                        {/* Credits You'll Earn (40%) - Hidden for org courses */}
                        {!isOrgCourse && (
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
                        )}
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block w-px bg-white/10 flex-shrink-0 mx-[40px]" />

                {/* Column 2: Instructor Info (30%) */}
                <div className="lg:w-[30%] space-y-4">
                    {/* Instructor Name & Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-brand-blue-light/30 flex-shrink-0 shadow-[0_0_20px_rgba(120,192,240,0.15)] bg-slate-800">
                            {instructor.avatar ? (
                                <img
                                    src={instructor.avatar}
                                    alt={instructor.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                                    {instructor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">
                                {instructor.name}
                            </h4>
                            {instructor.title && (
                                <p className="text-sm text-slate-400 mt-0.5">
                                    {instructor.title}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Credentials - Itemized with Icons */}
                    {authorCredentials.length > 0 ? (
                        <div className="space-y-2">
                            <h5 className="text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500">
                                Credentials
                            </h5>
                            <div className="space-y-1.5">
                                {authorCredentials.slice(0, 4).map((credential) => (
                                    <div
                                        key={credential.id}
                                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/5"
                                    >
                                        {credentialIconMap[credential.type]}
                                        <span className="text-xs text-slate-300">{credential.title}</span>
                                    </div>
                                ))}
                                {authorCredentials.length > 4 && (
                                    <p className="text-[10px] text-slate-500 pl-2">
                                        +{authorCredentials.length - 4} more
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : instructor.credentials && (
                        <p className="text-xs text-brand-blue-light line-clamp-2">
                            {instructor.credentials}
                        </p>
                    )}

                    {/* Bio */}
                    <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                        {instructor.bio ? (
                            <p className="line-clamp-6">{instructor.bio}</p>
                        ) : (
                            <p className="text-slate-500 italic">
                                Expert bio not available.
                            </p>
                        )}
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
