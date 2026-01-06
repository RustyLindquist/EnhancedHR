'use client';

import React from 'react';
import { ArrowLeft, ChevronRight, Play, Award, Plus } from 'lucide-react';
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
    onAddToCollection: () => void;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
    course,
    viewMode,
    currentModule,
    currentLesson,
    stats,
    onBack,
    onResume,
    onAddToCollection
}) => {
    // Determine button text based on state
    const getButtonText = () => {
        if (viewMode === 'player') return 'RESUME';
        if (stats.progressPercent > 0) return 'RESUME';
        return 'START';
    };

    const isComplete = stats.progressPercent === 100;

    return (
        <header className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-10">
            <div className="flex items-center justify-between gap-6 h-full">
                {/* Left Section: Back + Title/Breadcrumb */}
                <div className="flex items-center gap-6 min-w-0 flex-1">
                    {/* Back Button */}
                    <button
                        onClick={onBack}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                        aria-label="Go back"
                    >
                        <ArrowLeft size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>

                    {/* Title/Breadcrumb */}
                    <div className="min-w-0 flex-1">
                        {viewMode === 'description' ? (
                            <>
                                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)] block mb-1">
                                    COURSE
                                </span>
                                <h1 className="text-2xl lg:text-3xl font-light text-white truncate tracking-tight drop-shadow-lg">
                                    {course.title.split(' ')[0]} <span className="font-bold">{course.title.split(' ').slice(1).join(' ')}</span>
                                </h1>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 mb-1">
                                    <span className="text-brand-blue-light drop-shadow-[0_0_5px_rgba(120,192,240,0.5)] truncate max-w-[200px]">{currentModule?.title || 'Module'}</span>
                                    <ChevronRight size={12} className="flex-shrink-0 text-slate-600" />
                                </div>
                                <h1 className="text-2xl lg:text-3xl font-light text-white truncate tracking-tight drop-shadow-lg">
                                    {(currentLesson?.title || 'Lesson Title Goes Here').split(' ')[0]} <span className="font-bold">{(currentLesson?.title || 'Lesson Title Goes Here').split(' ').slice(1).join(' ')}</span>
                                </h1>
                            </>
                        )}
                    </div>
                </div>

                {/* Center Section: Stats */}
                <div className="hidden md:flex items-center gap-1 flex-shrink-0 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
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
                    {/* Add to Collection Button */}
                    <button
                        onClick={onAddToCollection}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:scale-105 active:scale-95"
                        title="Save this course to a Collection"
                    >
                        <Plus size={20} className="text-slate-400 group-hover:text-white transition-colors" />
                    </button>

                    {/* Certificate Button */}
                    <button
                        disabled={!isComplete}
                        className={`group flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                            isComplete
                                ? 'bg-amber-500/20 border border-amber-500/30 hover:bg-amber-500/30 hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                : 'bg-white/5 border border-white/10 cursor-not-allowed'
                        }`}
                        title="View Your Certificate For This Course"
                    >
                        <Award size={20} className={`transition-colors ${isComplete ? 'text-amber-400 group-hover:text-amber-300' : 'text-slate-500'}`} />
                    </button>

                    {/* Resume/Start Button */}
                    <button
                        onClick={onResume}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
                    >
                        <Play size={14} fill="currentColor" />
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default CourseHeader;
