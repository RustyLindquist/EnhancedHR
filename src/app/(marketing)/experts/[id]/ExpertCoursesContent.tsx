'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock, Award, LayoutGrid, List, ChevronRight } from 'lucide-react';

interface CourseData {
    id: number;
    title: string;
    description: string | null;
    image_url: string | null;
    category: string | null;
    duration: string | null;
    badges: number | null;
}

interface ExpertCoursesContentProps {
    courses: CourseData[];
    expertFirstName: string;
}

export default function ExpertCoursesContent({ courses, expertFirstName }: ExpertCoursesContentProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Load view mode preference from localStorage on mount
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

    return (
        <section className="py-16 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white">Courses by {expertFirstName}</h2>
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

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <Link
                                key={course.id}
                                href={`/?courseId=${course.id}`}
                                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-brand-blue-light/30 transition-all hover:-translate-y-1"
                            >
                                {/* Course Image */}
                                <div className="aspect-video relative bg-slate-800">
                                    {course.image_url ? (
                                        <Image
                                            src={course.image_url}
                                            alt={course.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BookOpen size={48} className="text-slate-600" />
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    {course.category && (
                                        <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs text-white font-medium backdrop-blur-sm">
                                            {course.category}
                                        </div>
                                    )}
                                </div>

                                {/* Course Details */}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-white group-hover:text-brand-blue-light transition-colors line-clamp-2 mb-2">
                                        {course.title}
                                    </h3>

                                    {course.description && (
                                        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                                            {course.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        {course.duration && (
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                <span>{course.duration}</span>
                                            </div>
                                        )}

                                        {course.badges && course.badges > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Award size={12} />
                                                <span>{course.badges} Credits</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="flex flex-col gap-2">
                        {courses.map(course => (
                            <Link
                                key={course.id}
                                href={`/?courseId=${course.id}`}
                                className="group relative flex items-center gap-4 px-4 py-3
                                           bg-white/[0.03] hover:bg-white/[0.08]
                                           border border-white/[0.06] hover:border-white/20
                                           rounded-xl transition-all duration-300 cursor-pointer"
                                style={{
                                    borderLeftWidth: '3px',
                                    borderLeftColor: '#3b82f6',
                                }}
                            >
                                {/* Thumbnail */}
                                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
                                    {course.image_url ? (
                                        <Image
                                            src={course.image_url}
                                            alt={course.title}
                                            fill
                                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen size={20} className="text-slate-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Separator */}
                                <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h4 className="text-sm font-semibold text-white truncate group-hover:text-brand-blue-light transition-colors">
                                            {course.title}
                                        </h4>
                                        {course.category && (
                                            <>
                                                <span className="text-white/20 hidden lg:block">|</span>
                                                <span className="text-[11px] text-slate-500 hidden lg:block">
                                                    {course.category}
                                                </span>
                                            </>
                                        )}
                                        {course.duration && (
                                            <>
                                                <span className="text-white/20 hidden lg:block">|</span>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 hidden lg:flex">
                                                    <Clock size={10} />
                                                    {course.duration}
                                                </span>
                                            </>
                                        )}
                                        {course.badges && course.badges > 0 && (
                                            <>
                                                <span className="text-white/20 hidden lg:block">|</span>
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 hidden lg:flex">
                                                    <Award size={10} />
                                                    {course.badges} Credits
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {course.description && (
                                        <p className="text-xs text-slate-400 truncate mt-0.5 pr-6 group-hover:text-slate-300 transition-colors">
                                            {course.description}
                                        </p>
                                    )}
                                </div>

                                {/* Type Badge */}
                                <span
                                    className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md
                                               hidden sm:block w-24 text-center bg-blue-500/12 text-blue-400 border border-blue-500/20"
                                >
                                    COURSE
                                </span>

                                <ChevronRight size={16} className="text-slate-600 ml-1" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
