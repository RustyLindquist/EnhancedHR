'use client';

import React from 'react';
import { ArrowLeft, Clock, TrendingUp, Timer, Play, ChevronRight } from 'lucide-react';
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

    const getButtonIcon = () => {
        return <Play size={14} fill="currentColor" />;
    };

    return (
        <header className="flex-shrink-0 bg-brand-black/80 backdrop-blur-sm border-b border-white/5 px-6 lg:px-10 py-4 z-20">
            <div className="flex items-center justify-between gap-4">
                {/* Left Section: Back + Title/Breadcrumb */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* Title/Breadcrumb */}
                    <div className="min-w-0 flex-1">
                        {viewMode === 'description' ? (
                            <>
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-orange block mb-0.5">
                                    COURSE DESCRIPTION
                                </span>
                                <h1 className="text-lg lg:text-xl font-bold text-white truncate">
                                    {course.title}
                                </h1>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light mb-0.5">
                                    <span className="truncate max-w-[200px]">{currentModule?.title || 'Module'}</span>
                                    <ChevronRight size={12} className="flex-shrink-0 text-slate-500" />
                                    <span className="truncate max-w-[200px] text-white/70">{currentLesson?.title || 'Lesson'}</span>
                                </div>
                                <h1 className="text-lg lg:text-xl font-bold text-white truncate">
                                    {currentLesson?.title || course.title}
                                </h1>
                            </>
                        )}
                    </div>
                </div>

                {/* Center Section: Stats */}
                <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                    {/* Duration */}
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} className="text-brand-blue-light" />
                        <span className="text-xs font-medium">
                            {stats.totalDuration}
                        </span>
                    </div>

                    {/* Progress */}
                    <div className="flex items-center gap-2 text-slate-400">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-xs font-medium">
                            {stats.progressPercent}% Complete
                        </span>
                    </div>

                    {/* Time Remaining */}
                    <div className="flex items-center gap-2 text-slate-400">
                        <Timer size={14} className="text-amber-400" />
                        <span className="text-xs font-medium">
                            {stats.remainingMinutes} Min Remaining
                        </span>
                    </div>
                </div>

                {/* Right Section: Action Button */}
                <div className="flex-shrink-0">
                    <button
                        onClick={onResume}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
                    >
                        {getButtonIcon()}
                        {getButtonText()}
                    </button>
                </div>
            </div>

            {/* Mobile Stats Row */}
            <div className="flex md:hidden items-center justify-center gap-4 mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={12} className="text-brand-blue-light" />
                    <span className="text-[10px] font-medium">{stats.totalDuration}</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5 text-slate-400">
                    <TrendingUp size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-medium">{stats.progressPercent}%</span>
                </div>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Timer size={12} className="text-amber-400" />
                    <span className="text-[10px] font-medium">{stats.remainingMinutes}m left</span>
                </div>
            </div>
        </header>
    );
};

export default CourseHeader;
