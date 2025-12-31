'use client';

import React from 'react';
import { ChevronDown, Sparkles, Bookmark } from 'lucide-react';
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
    courseTitle
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
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group"
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
            </button>

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

                        {/* Lessons Grid - 4 columns on larger screens */}
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
