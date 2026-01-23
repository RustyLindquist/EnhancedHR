'use client';

import React from 'react';
import { Sparkles, Plus, CheckCircle } from 'lucide-react';
import { Lesson, DragItem } from '../../types';

interface CourseLessonCardProps {
    lesson: Lesson;
    lessonNumber: string;
    moduleId: string;
    courseTitle: string;
    isActive: boolean;
    isCompleted: boolean;
    onClick: () => void;
    onAskPrometheus: (prompt: string) => void;
    onAddToCollection: (item: DragItem) => void;
    onDragStart: (item: DragItem) => void;
}

const CourseLessonCard: React.FC<CourseLessonCardProps> = ({
    lesson,
    lessonNumber,
    moduleId,
    courseTitle,
    isActive,
    isCompleted,
    onClick,
    onAskPrometheus,
    onAddToCollection,
    onDragStart
}) => {
    const isQuiz = lesson.type === 'quiz';
    const isActivity = lesson.type === 'article'; // Activities are stored as 'article' type

    // Format duration
    const formatDuration = (duration: string) => {
        if (!duration) return '5 Min';
        // Already formatted like "7 Min" or "10 Min"
        if (duration.toLowerCase().includes('min')) {
            return duration;
        }
        // If just a number, add Min
        const num = parseInt(duration);
        if (!isNaN(num)) {
            return `${num} Min`;
        }
        return duration;
    };

    const handleAsk = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prompt = `Explain the main points of lesson "${lesson.title}" from ${courseTitle} in more detail. What are the key takeaways?`;
        onAskPrometheus(prompt);
    };

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isActivityOrQuiz = isActivity || isQuiz;
        const dragItem: DragItem = {
            type: isActivityOrQuiz ? 'ACTIVITY' : 'LESSON',
            id: lesson.id,
            title: lesson.title,
            subtitle: courseTitle,
            meta: isActivityOrQuiz ? undefined : lesson.duration // Activities and quizzes don't show duration
        };
        onAddToCollection(dragItem);
    };

    const handleDragStart = (e: React.DragEvent) => {
        // Hide native drag preview since we use CustomDragLayer
        const emptyImg = new Image();
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(emptyImg, 0, 0);

        const isActivityOrQuiz = isActivity || isQuiz;
        const dragItem: DragItem = {
            type: isActivityOrQuiz ? 'ACTIVITY' : 'LESSON',
            id: lesson.id,
            title: lesson.title,
            subtitle: courseTitle,
            meta: isActivityOrQuiz ? undefined : lesson.duration // Activities and quizzes don't show duration
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
        onDragStart(dragItem);
    };

    // Description placeholder text
    const descriptionText = 'Lesson title goes here, and will wrap as necessary';

    return (
        <div
            className={`
                group relative rounded-xl cursor-pointer transition-all duration-300 overflow-visible
                ${isActive
                    ? 'bg-white/10 border-2 border-brand-blue-light shadow-[0_0_25px_rgba(120,192,240,0.25)]'
                    : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                }
            `}
            onClick={onClick}
            draggable
            onDragStart={handleDragStart}
        >
            {/* Animated rotating border - only show when not active */}
            {!isActive && <div className="card-hover-border rounded-xl" />}

            {/* NOW PLAYING Badge */}
            {isActive && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-brand-blue-light text-brand-black text-[8px] font-bold uppercase tracking-wider rounded-full shadow-lg z-20 whitespace-nowrap">
                    NOW PLAYING
                </div>
            )}

            {/* Card Content */}
            <div className="px-4 py-[26px]">
                {/* Top Row: Lesson Number/Quiz/Activity Badge + Duration */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {isQuiz ? (
                            <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[9px] font-bold uppercase rounded border border-brand-orange/30">
                                QUIZ
                            </span>
                        ) : isActivity ? (
                            <span className="px-2 py-0.5 bg-red-700/20 text-red-400 text-[9px] font-bold uppercase rounded border border-red-700/30">
                                ACTIVITY
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold tracking-wider text-brand-blue-light uppercase">
                                LESSON {lessonNumber}
                            </span>
                        )}
                    </div>
                    {!isActivity && (
                        <span className="text-[10px] font-medium text-slate-500 transition-opacity duration-200 group-hover:opacity-0">
                            {formatDuration(lesson.duration)}
                        </span>
                    )}
                </div>

                {/* Lesson Title */}
                <h4 className={`
                    text-sm font-semibold leading-tight mb-2
                    ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}
                    transition-colors
                `}>
                    {lesson.title || 'Lesson Title Goes Here'}
                </h4>

                {/* Description Text */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                    {descriptionText}
                </p>

                {/* Completed Checkmark - positioned in bottom right */}
                {isCompleted && !isActive && (
                    <div className="absolute bottom-3 right-3">
                        <CheckCircle size={16} className="text-emerald-400" fill="rgba(16, 185, 129, 0.2)" />
                    </div>
                )}
            </div>

            {/* Hover Actions - positioned top right */}
            <div className={`
                absolute top-3 right-3 flex items-center gap-1
                opacity-0 translate-y-1 transition-all duration-200
                group-hover:opacity-100 group-hover:translate-y-0
            `}>
                <button
                    onClick={handleAdd}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all backdrop-blur-sm"
                    title="Add to collection"
                >
                    <Plus size={14} />
                </button>
                <button
                    onClick={handleAsk}
                    className="p-1.5 rounded-lg bg-brand-blue-light/20 hover:bg-brand-blue-light/30 text-brand-blue-light transition-all backdrop-blur-sm"
                    title="Ask Prometheus"
                >
                    <Sparkles size={14} />
                </button>
            </div>
        </div>
    );
};

export default CourseLessonCard;
