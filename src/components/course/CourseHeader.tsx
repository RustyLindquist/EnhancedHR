'use client';

import React from 'react';
import { ArrowLeft, Star, ChevronRight, Play, Award } from 'lucide-react';
import { Course, Module, Lesson } from '../../types';

interface CourseStats {
    totalDuration: string;
    progressPercent: number;
    remainingMinutes: number;
    totalLessons: number;
    completedCount: number;
}

interface CourseHeaderProps {
    course: Course;
    viewMode: 'description' | 'player';
    currentModule: Module | null;
    currentLesson: Lesson | null;
    stats: CourseStats;
    onBack: () => void;
    onResume: () => void;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
    course,
    viewMode,
    currentModule,
    currentLesson,
    stats,
    onBack,
    onResume
}) => {
    // Determine button text based on state
    const getButtonText = () => {
        if (viewMode === 'player') return 'RESUME';
        if (stats.progressPercent > 0) return 'RESUME';
        return 'START';
    };

    const isComplete = stats.progressPercent === 100;

    return (
        <header className="flex-shrink-0 bg-gradient-to-b from-brand-black to-brand-black/95 border-b border-white/5 px-6 lg:px-10 py-4 z-20">
            <div className="flex items-center justify-between gap-6">
                {/* Left Section: Back + Title/Breadcrumb */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Title/Breadcrumb */}
                    <div className="min-w-0 flex-1">
                        {viewMode === 'description' ? (
                            <>
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange block mb-1">
                                    COURSE DESCRIPTION
                                </span>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl lg:text-2xl font-bold text-white truncate">
                                        {course.title}
                                    </h1>
                                    {/* Star Rating */}
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 flex-shrink-0">
                                        <Star size={12} fill="#fbbf24" className="text-amber-400" />
                                        <span className="text-xs font-bold text-white">{course.rating?.toFixed(1) || '4.2'}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-1">
                                    <span className="text-brand-orange truncate max-w-[200px]">{currentModule?.title || 'Module'}</span>
                                    <ChevronRight size={12} className="flex-shrink-0 text-slate-600" />
                                </div>
                                <h1 className="text-xl lg:text-2xl font-bold text-white truncate">
                                    {currentLesson?.title || 'Lesson Title Goes Here'}
                                </h1>
                            </>
                        )}
                    </div>
                </div>

                {/* Center Section: Stats */}
                <div className="hidden md:flex items-center gap-1 flex-shrink-0 bg-white/5 rounded-lg px-4 py-2">
                    {/* Duration */}
                    <span className="text-sm font-semibold text-white">
                        {stats.totalDuration}
                    </span>
                    <span className="text-slate-500 mx-2">|</span>
                    {/* Progress */}
                    <span className="text-sm font-semibold text-emerald-400">
                        {stats.progressPercent}% Complete
                    </span>
                    <span className="text-slate-500 mx-2">|</span>
                    {/* Time Remaining */}
                    <span className="text-sm font-semibold text-slate-300">
                        {stats.remainingMinutes} Min Remaining
                    </span>
                </div>

                {/* Right Section: Action Buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Certificate Button */}
                    <button
                        disabled={!isComplete}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all
                            ${isComplete
                                ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed'
                            }
                        `}
                    >
                        <Award size={14} />
                        CERTIFICATE
                    </button>

                    {/* Resume/Start Button */}
                    <button
                        onClick={onResume}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
                    >
                        <Play size={14} fill="currentColor" />
                        {getButtonText()}
                    </button>
                </div>
            </div>

            {/* Mobile Stats Row */}
            <div className="flex md:hidden items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5">
                <span className="text-xs font-semibold text-white">{stats.totalDuration}</span>
                <span className="text-slate-500">|</span>
                <span className="text-xs font-semibold text-emerald-400">{stats.progressPercent}%</span>
                <span className="text-slate-500">|</span>
                <span className="text-xs font-semibold text-slate-300">{stats.remainingMinutes}m left</span>
            </div>
        </header>
    );
};

export default CourseHeader;
