'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Video, Users, Clock, Plus, Edit3, LayoutGrid, List, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CourseData {
    id: number;
    title: string;
    description: string | null;
    status: string;
    created_at: string;
    image_url: string | null;
}

interface CourseStats {
    totalMinutes: number;
    studentCount: number;
}

interface AuthorCoursesContentProps {
    courses: CourseData[];
    courseStats: Record<number, CourseStats>;
}

const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export default function AuthorCoursesContent({ courses, courseStats }: AuthorCoursesContentProps) {
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

    const getStatusBadge = (status: string) => {
        const isPublished = status === 'published';
        const isPendingReview = status === 'pending_review';
        return {
            className: isPublished
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : isPendingReview
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            label: isPublished ? 'Published' : isPendingReview ? 'Pending Review' : 'Draft'
        };
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
                    <p className="text-slate-400">
                        Create, edit, and track your courses.
                    </p>
                </div>
                <div className="flex items-center gap-4">
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
                    <Link
                        href="/author/courses/new/builder"
                        className="flex items-center gap-2 px-5 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold hover:bg-brand-blue-light/90 transition-colors"
                    >
                        <Plus size={18} />
                        Add Course
                    </Link>
                </div>
            </div>

            {/* Courses */}
            {courses && courses.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => {
                            const stats = courseStats[course.id] || { totalMinutes: 0, studentCount: 0 };
                            const isDraft = course.status === 'draft';
                            const statusBadge = getStatusBadge(course.status);

                            return (
                                <div
                                    key={course.id}
                                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors group relative"
                                >
                                    {/* Thumbnail - Link to course view */}
                                    <Link href={`/courses/${course.id}`} className="block">
                                        <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 relative">
                                            {course.image_url ? (
                                                <img
                                                    src={course.image_url}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Video size={48} className="text-slate-600" />
                                                </div>
                                            )}
                                            {/* Status Badge */}
                                            <div className={`absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold ${statusBadge.className}`}>
                                                {statusBadge.label}
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Content */}
                                    <div className="p-5">
                                        <Link href={`/courses/${course.id}`}>
                                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-brand-blue-light transition-colors">
                                                {course.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                            {course.description || 'No description'}
                                        </p>

                                        {/* Stats & Edit Button Row */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs text-slate-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    <span>{formatMinutes(stats.totalMinutes)} watched</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users size={12} />
                                                    <span>{stats.studentCount} students</span>
                                                </div>
                                            </div>

                                            {/* Edit Button - Only for draft courses */}
                                            {isDraft && (
                                                <Link
                                                    href={`/author/courses/${course.id}/builder`}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue-light/10 border border-brand-blue-light/30 text-brand-blue-light text-xs font-bold hover:bg-brand-blue-light/20 transition-colors"
                                                >
                                                    <Edit3 size={12} />
                                                    Edit
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* List View */
                    <div className="flex flex-col gap-2">
                        {courses.map((course) => {
                            const stats = courseStats[course.id] || { totalMinutes: 0, studentCount: 0 };
                            const isDraft = course.status === 'draft';
                            const statusBadge = getStatusBadge(course.status);

                            return (
                                <Link
                                    key={course.id}
                                    href={`/courses/${course.id}`}
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
                                            <img
                                                src={course.image_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Video size={20} className="text-slate-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Separator */}
                                    <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-white/95">
                                                {course.title}
                                            </h4>
                                            <span className="text-white/20 hidden lg:block">|</span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusBadge.className}`}>
                                                {statusBadge.label}
                                            </span>
                                            <span className="text-white/20 hidden lg:block">|</span>
                                            <span className="text-[11px] text-slate-500 flex items-center gap-1 hidden lg:flex">
                                                <Clock size={10} />
                                                {formatMinutes(stats.totalMinutes)} watched
                                            </span>
                                            <span className="text-white/20 hidden lg:block">|</span>
                                            <span className="text-[11px] text-slate-500 flex items-center gap-1 hidden lg:flex">
                                                <Users size={10} />
                                                {stats.studentCount} students
                                            </span>
                                        </div>
                                        {course.description && (
                                            <p className="text-xs text-slate-400 truncate mt-0.5 pr-6 group-hover:text-slate-300 transition-colors">
                                                {course.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Right Actions */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {isDraft && (
                                            <Link
                                                href={`/author/courses/${course.id}/builder`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue-light/10 border border-brand-blue-light/30 text-brand-blue-light text-xs font-bold hover:bg-brand-blue-light/20 transition-colors"
                                            >
                                                <Edit3 size={12} />
                                                Edit
                                            </Link>
                                        )}
                                        <ChevronRight size={16} className="text-slate-600" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                    <BookOpen size={64} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No courses yet</h3>
                    <p className="text-slate-400 mb-6">
                        Create your first course and share your expertise with learners.
                    </p>
                    <Link
                        href="/author/courses/new/builder"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue-light text-brand-black font-bold hover:bg-brand-blue-light/90 transition-colors"
                    >
                        <Plus size={18} />
                        Create Your First Course
                    </Link>
                </div>
            )}
        </div>
    );
}
