'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, LayoutGrid, List, ChevronRight } from 'lucide-react';

interface ExpertWithCourses {
    id: string;
    full_name: string;
    expert_title: string | null;
    avatar_url: string | null;
    author_bio: string | null;
    publishedCourseCount: number;
    isStandalone: boolean;
}

interface ExpertDirectoryContentProps {
    experts: ExpertWithCourses[];
}

export default function ExpertDirectoryContent({ experts }: ExpertDirectoryContentProps) {
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

    if (experts.length === 0) {
        return null;
    }

    return (
        <section className="py-32 bg-[#05080a] border-t border-white/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between mb-16">
                    <div className="text-center flex-1">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Meet Our Experts</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Learn from industry leaders who are shaping the future of HR.
                        </p>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {experts.map(expert => (
                            <Link
                                key={`${expert.id}-${expert.isStandalone ? 'standalone' : 'regular'}`}
                                href={expert.isStandalone ? `/experts/standalone/${expert.id}` : `/experts/${expert.id}`}
                                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-blue-light/30 transition-all hover:-translate-y-1"
                            >
                                {/* Avatar */}
                                <div className="flex justify-center mb-4">
                                    {expert.avatar_url ? (
                                        <Image
                                            src={expert.avatar_url}
                                            alt={expert.full_name}
                                            width={80}
                                            height={80}
                                            className="w-20 h-20 rounded-full object-cover border-2 border-white/10 group-hover:border-brand-blue-light/50 transition-colors"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-blue-light/20 to-brand-orange/20 flex items-center justify-center text-2xl font-bold text-white border-2 border-white/10">
                                            {expert.full_name.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Name & Title */}
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-white group-hover:text-brand-blue-light transition-colors">
                                        {expert.full_name}
                                    </h3>
                                    {expert.expert_title && (
                                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                            {expert.expert_title}
                                        </p>
                                    )}

                                    {/* Course Count */}
                                    <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-slate-500">
                                        <BookOpen size={14} />
                                        <span>{expert.publishedCourseCount} {expert.publishedCourseCount === 1 ? 'Course' : 'Courses'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="flex flex-col gap-2">
                        {experts.map(expert => (
                            <Link
                                key={`${expert.id}-${expert.isStandalone ? 'standalone' : 'regular'}`}
                                href={expert.isStandalone ? `/experts/standalone/${expert.id}` : `/experts/${expert.id}`}
                                className="group relative flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all border border-white/[0.06] hover:border-white/20"
                            >
                                {/* Avatar */}
                                {expert.avatar_url ? (
                                    <Image
                                        src={expert.avatar_url}
                                        alt={expert.full_name}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-brand-blue-light/50 transition-colors"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blue-light/20 to-brand-orange/20 flex items-center justify-center text-lg font-bold text-white border border-white/10 flex-shrink-0">
                                        {expert.full_name.charAt(0)}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-semibold group-hover:text-brand-blue-light transition-colors">
                                        {expert.full_name}
                                    </h4>
                                    {expert.expert_title && (
                                        <p className="text-slate-400 text-sm truncate">
                                            {expert.expert_title}
                                        </p>
                                    )}
                                </div>

                                {/* Course Count */}
                                <span className="text-sm text-slate-500 flex items-center gap-1.5 flex-shrink-0">
                                    <BookOpen size={14} />
                                    {expert.publishedCourseCount} {expert.publishedCourseCount === 1 ? 'course' : 'courses'}
                                </span>

                                <ChevronRight className="text-slate-600 flex-shrink-0" size={16} />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
