'use client';

import React, { useState, useEffect } from 'react';
import { Instructor, Course } from '../types';
import { BookOpen, Globe, Linkedin, Award, Star, Users, LayoutGrid, List, Clock, ChevronRight } from 'lucide-react';
import CanvasHeader from './CanvasHeader';
import { useBackHandler } from '@/hooks/useBackHandler';

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
    // Register browser back button handler to use parent's onBack
    useBackHandler(onBack);

    // View mode state synced with localStorage
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load view preference from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem('enhancedhr-preferred-view-mode');
        if (savedViewMode === 'list' || savedViewMode === 'grid') {
            setViewMode(savedViewMode);
        }
    }, []);

    // Handle view mode change and persist to localStorage
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        localStorage.setItem('enhancedhr-preferred-view-mode', mode);
        setViewMode(mode);
    };

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
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Credentials & Expertise
                            </h3>
                            <div className="space-y-2">
                                {instructor.credentials.map((cred, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <Award size={14} className="text-brand-blue-light flex-shrink-0" />
                                        <span className="text-slate-400 text-sm">{cred}</span>
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
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">
                                Showing {instructorCourses.length} courses
                            </span>
                            {/* View Toggle */}
                            <div className="flex items-center gap-0.5 p-1 bg-black/40 border border-white/10 rounded-lg">
                                <button
                                    onClick={() => handleViewModeChange('grid')}
                                    className={`p-1.5 rounded-md transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-white/20 text-white'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                    title="Grid View"
                                >
                                    <LayoutGrid size={14} />
                                </button>
                                <button
                                    onClick={() => handleViewModeChange('list')}
                                    className={`p-1.5 rounded-md transition-all ${
                                        viewMode === 'list'
                                            ? 'bg-white/20 text-white'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                    title="List View"
                                >
                                    <List size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {instructorCourses.length > 0 ? (
                        viewMode === 'grid' ? (
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
                            /* List View - Matching Academy/UniversalCollectionListItem style */
                            <div className="flex flex-col gap-2">
                                {instructorCourses.map((course, index) => {
                                    const glowColor = 'rgba(120, 192, 240, 0.6)'; // Brand blue for courses
                                    return (
                                        <div
                                            key={course.id}
                                            onClick={() => onCourseClick(course.id)}
                                            className="group relative flex items-center gap-4 px-4 py-3
                                                       bg-white/[0.03] hover:bg-white/[0.08]
                                                       border border-white/[0.06] hover:border-white/20
                                                       rounded-xl transition-all duration-300 cursor-pointer
                                                       overflow-hidden"
                                            style={{
                                                borderLeftWidth: '3px',
                                                borderLeftColor: glowColor,
                                                animationDelay: `${index * 30}ms`,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, inset 0 0 20px ${glowColor}08`;
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Subtle gradient overlay on hover */}
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[10px]"
                                                style={{
                                                    background: `linear-gradient(135deg, ${glowColor}08 0%, transparent 50%)`
                                                }}
                                            />

                                            {/* Thumbnail */}
                                            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
                                                {course.image ? (
                                                    <img
                                                        src={course.image}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                                        <BookOpen size={20} className="text-slate-600" />
                                                    </div>
                                                )}
                                                {/* Small type indicator overlay */}
                                                <div className="absolute bottom-0.5 right-0.5 p-1 rounded bg-black/60 backdrop-blur-sm">
                                                    <BookOpen size={10} style={{ color: glowColor }} />
                                                </div>
                                            </div>

                                            {/* Separator */}
                                            <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 relative z-10">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-white/95">
                                                        {course.title}
                                                    </h4>
                                                    {course.rating && (
                                                        <>
                                                            <span className="text-white/20 hidden lg:block">|</span>
                                                            <span className="flex items-center gap-1 text-amber-400/50 flex-shrink-0">
                                                                <Star size={14} fill="currentColor" />
                                                                <span className="text-sm font-bold">{course.rating.toFixed(1)}</span>
                                                            </span>
                                                        </>
                                                    )}
                                                    {course.duration && (
                                                        <>
                                                            <span className="text-white/20 hidden lg:block">|</span>
                                                            <span className="text-[11px] text-slate-500 flex-shrink-0 hidden lg:block">
                                                                {course.duration}
                                                            </span>
                                                        </>
                                                    )}
                                                    {course.badges && course.badges.length > 0 && (
                                                        <>
                                                            <span className="text-white/20 hidden md:block">|</span>
                                                            {course.badges.includes('SHRM') && (
                                                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0 hidden md:block">
                                                                    SHRM
                                                                </span>
                                                            )}
                                                            {course.badges.includes('HRCI') && (
                                                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 hidden md:block">
                                                                    HRCI
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                {course.description && (
                                                    <p className="text-xs text-slate-400 truncate mt-0.5 pr-6 group-hover:text-slate-300 transition-colors">
                                                        {course.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Right section */}
                                            <div className="flex items-center gap-3 flex-shrink-0 relative z-10">
                                                <div className="w-px h-8 bg-white/10 flex-shrink-0 hidden sm:block" />
                                                <span
                                                    className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md hidden sm:block w-24 text-center"
                                                    style={{
                                                        backgroundColor: `${glowColor}12`,
                                                        color: glowColor,
                                                        border: `1px solid ${glowColor}20`
                                                    }}
                                                >
                                                    Course
                                                </span>
                                                <ChevronRight size={16} className="text-slate-600 ml-1" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
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
