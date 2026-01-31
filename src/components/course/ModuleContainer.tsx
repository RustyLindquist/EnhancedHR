'use client';

import React from 'react';
import { ChevronDown, Sparkles, Bookmark, Play, CheckCircle, ChevronRight, FileQuestion } from 'lucide-react';
import { Module, Lesson, DragItem } from '../../types';
import CourseLessonCard from './CourseLessonCard';

interface ModuleContainerProps {
    module: Module;
    moduleIndex: number;
    isExpanded: boolean;
    isFirstModule: boolean;
    activeLessonId: string | null;
    completedLessons: Set<string>;
    onToggle: () => void;
    onLessonClick: (lesson: Lesson) => void;
    onAskPrometheus: (prompt: string) => void;
    onAddToCollection: (item: DragItem) => void;
    onDragStart: (item: DragItem) => void;
    courseTitle: string;
    lessonViewMode?: 'grid' | 'list';
}

const ModuleContainer: React.FC<ModuleContainerProps> = ({
    module,
    moduleIndex,
    isExpanded,
    isFirstModule,
    activeLessonId,
    completedLessons,
    onToggle,
    onLessonClick,
    onAskPrometheus,
    onAddToCollection,
    onDragStart,
    courseTitle,
    lessonViewMode = 'grid'
}) => {
    // Calculate module progress
    const completedInModule = module.lessons.filter(l => completedLessons.has(l.id)).length;
    const moduleProgress = module.lessons.length > 0
        ? Math.round((completedInModule / module.lessons.length) * 100)
        : 0;

    const handleAskModule = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prompt = `Summarize the key concepts covered in module "${module.title}" of ${courseTitle}. What are the main learning objectives?`;
        onAskPrometheus(prompt);
    };

    const handleSaveModule = (e: React.MouseEvent) => {
        e.stopPropagation();
        const dragItem: DragItem = {
            type: 'MODULE',
            id: module.id,
            title: module.title,
            subtitle: courseTitle,
            meta: `${module.lessons.length} lessons`
        };
        onAddToCollection(dragItem);
    };

    return (
        <div className={`
            rounded-2xl overflow-hidden transition-all duration-300
            ${isExpanded
                ? 'bg-white/[0.03] border border-white/10'
                : 'bg-transparent border border-white/5 hover:border-white/10'
            }
        `}>
            {/* Module Header */}
            <div
                role="button"
                tabIndex={0}
                onClick={onToggle}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); }}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
            >
                {/* Left: Chevron + Module Number + Title */}
                <div className="flex items-center gap-3 min-w-0">
                    <ChevronDown
                        size={18}
                        className={`
                            text-slate-500 transition-transform duration-300 flex-shrink-0
                            ${isExpanded ? 'rotate-0' : '-rotate-90'}
                        `}
                    />
                    <h3 className="text-base font-semibold text-white truncate group-hover:text-brand-blue-light transition-colors">
                        <span className="text-slate-400">{moduleIndex + 1}.</span>{' '}
                        {module.title || 'Module Title Goes Here'}
                    </h3>
                </div>

                {/* Right: Progress + Actions (when expanded) */}
                <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Progress indicator - only show when collapsed */}
                    {!isExpanded && (
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500/70 rounded-full transition-all duration-500"
                                    style={{ width: `${moduleProgress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-500 w-8 text-right">
                                {moduleProgress}%
                            </span>
                        </div>
                    )}

                    {/* Action buttons (visible when expanded) */}
                    {isExpanded && (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={handleAskModule}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-[10px] font-bold uppercase tracking-wider transition-all hover:shadow-[0_0_10px_rgba(120,192,240,0.2)]"
                            >
                                <Sparkles size={12} />
                                ASK
                            </button>
                            <button
                                onClick={handleSaveModule}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all"
                            >
                                <Bookmark size={12} />
                                SAVE MODULE
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Module Content (Lessons Grid) */}
            <div
                className={`
                    grid transition-all duration-300 ease-out
                    ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                `}
            >
                <div className="overflow-hidden">
                    <div className="px-5 pt-3 pb-5">
                        {/* Module Description - shown when available */}
                        {module.description && (
                            <p className="text-sm text-slate-400 leading-relaxed mb-4 pb-4 border-b border-white/5">
                                {module.description}
                            </p>
                        )}

                        {/* Lessons Grid or List */}
                        {lessonViewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {module.lessons.map((lesson, lessonIndex) => (
                                    <CourseLessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        lessonNumber={`${moduleIndex + 1}.${lessonIndex + 1}`}
                                        moduleId={module.id}
                                        courseTitle={courseTitle}
                                        isActive={activeLessonId === lesson.id}
                                        isCompleted={completedLessons.has(lesson.id)}
                                        onClick={() => onLessonClick(lesson)}
                                        onAskPrometheus={onAskPrometheus}
                                        onAddToCollection={onAddToCollection}
                                        onDragStart={onDragStart}
                                    />
                                ))}
                            </div>
                        ) : (
                            /* List View */
                            <div className="flex flex-col gap-2">
                                {module.lessons.map((lesson, lessonIndex) => {
                                    const isActive = activeLessonId === lesson.id;
                                    const isCompleted = completedLessons.has(lesson.id);
                                    const isQuiz = lesson.type === 'quiz';
                                    const glowColor = isQuiz
                                        ? 'rgba(255, 147, 0, 0.6)'
                                        : isActive
                                            ? 'rgba(120, 192, 240, 0.6)'
                                            : 'rgba(120, 192, 240, 0.4)';

                                    return (
                                        <div
                                            key={lesson.id}
                                            onClick={() => onLessonClick(lesson)}
                                            className={`group relative flex items-center gap-4 px-4 py-3
                                                ${isQuiz
                                                    ? 'bg-brand-orange/5 hover:bg-brand-orange/10 border-brand-orange/20 hover:border-brand-orange/40'
                                                    : isActive
                                                        ? 'bg-brand-blue-light/10 border-brand-blue-light/50'
                                                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/20'}
                                                border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden`}
                                            style={{
                                                borderLeftWidth: '3px',
                                                borderLeftColor: isQuiz
                                                    ? 'rgb(255, 147, 0)'
                                                    : isActive
                                                        ? 'rgb(120, 192, 240)'
                                                        : glowColor,
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isActive) {
                                                    e.currentTarget.style.boxShadow = `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, inset 0 0 20px ${glowColor}08`;
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isActive) {
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            {/* Subtle gradient overlay on hover */}
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[10px]"
                                                style={{
                                                    background: `linear-gradient(135deg, ${glowColor}08 0%, transparent 50%)`
                                                }}
                                            />

                                            {/* Icon */}
                                            <div
                                                className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0
                                                    transition-transform duration-200 group-hover:scale-105
                                                    ${isQuiz
                                                        ? 'bg-brand-orange/20'
                                                        : isActive
                                                            ? 'bg-brand-blue-light/20'
                                                            : 'bg-brand-blue-light/10'}`}
                                            >
                                                {isQuiz ? (
                                                    <FileQuestion size={16} className="text-brand-orange" />
                                                ) : (
                                                    <Play size={16} className={`${isActive ? 'text-brand-blue-light' : 'text-brand-blue-light/70'}`} />
                                                )}
                                            </div>

                                            {/* Separator */}
                                            <div className={`w-px h-8 ${isQuiz ? 'bg-brand-orange/20' : 'bg-white/10'} flex-shrink-0`} />

                                            {/* Main Content */}
                                            <div className="flex-1 min-w-0 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isQuiz ? 'text-brand-orange' : 'text-brand-blue-light'}`}>
                                                        {isQuiz ? 'Quiz' : `Lesson ${moduleIndex + 1}.${lessonIndex + 1}`}
                                                    </span>
                                                    {isCompleted && (
                                                        <CheckCircle size={12} className="text-green-400" />
                                                    )}
                                                    {isActive && !isQuiz && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-blue-light animate-pulse">
                                                            Now Playing
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className={`text-sm font-semibold truncate transition-colors
                                                    ${isQuiz
                                                        ? 'text-brand-orange group-hover:text-white'
                                                        : isActive
                                                            ? 'text-white'
                                                            : 'text-white group-hover:text-brand-blue-light'}`}>
                                                    {lesson.title}
                                                </h4>
                                            </div>

                                            {/* Right section */}
                                            <div className="flex items-center gap-4 flex-shrink-0 relative z-10">
                                                {/* Duration */}
                                                {lesson.duration && (
                                                    <span className="text-[11px] text-slate-500 hidden sm:block">
                                                        {lesson.duration}
                                                    </span>
                                                )}

                                                <ChevronRight size={16} className={`${isQuiz ? 'text-brand-orange/60' : 'text-slate-600'} ml-1`} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty state */}
                        {module.lessons.length === 0 && (
                            <div className="text-center py-8 text-slate-500">
                                <p className="text-sm">No lessons in this module yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModuleContainer;
