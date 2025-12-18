'use client';

import React from 'react';
import { Monitor, FileText, Sparkles, Plus, CheckCircle } from 'lucide-react';
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

    // Format duration
    const formatDuration = (duration: string) => {
        // Already formatted like "7 Min" or "10 Min"
        if (duration.toLowerCase().includes('min')) {
            return duration.toUpperCase();
        }
        // If just a number, add MIN
        const num = parseInt(duration);
        if (!isNaN(num)) {
            return `${num} MIN`;
        }
        return duration.toUpperCase();
    };

    const handleAsk = (e: React.MouseEvent) => {
        e.stopPropagation();
        const prompt = `Explain the main points of lesson "${lesson.title}" from ${courseTitle} in more detail. What are the key takeaways?`;
        onAskPrometheus(prompt);
    };

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        const dragItem: DragItem = {
            type: 'LESSON',
            id: lesson.id,
            title: lesson.title,
            subtitle: `Module: ${moduleId}`,
            meta: lesson.duration
        };
        onAddToCollection(dragItem);
    };

    const handleDragStart = (e: React.DragEvent) => {
        const dragItem: DragItem = {
            type: 'LESSON',
            id: lesson.id,
            title: lesson.title,
            subtitle: `Module: ${moduleId}`,
            meta: lesson.duration
        };
        e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
        onDragStart(dragItem);
    };

    return (
        <div
            className={`
                group relative rounded-xl cursor-pointer transition-all duration-300
                ${isActive
                    ? 'bg-white/10 border-2 border-brand-blue-light shadow-[0_0_20px_rgba(120,192,240,0.3)]'
                    : 'bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20'
                }
            `}
            onClick={onClick}
            draggable
            onDragStart={handleDragStart}
        >
            {/* NOW PLAYING Badge */}
            {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-brand-blue-light text-brand-black text-[9px] font-bold uppercase tracking-wider rounded-full animate-pulse z-10">
                    NOW PLAYING
                </div>
            )}

            {/* Completed Checkmark */}
            {isCompleted && !isActive && (
                <div className="absolute top-2 right-2 z-10">
                    <CheckCircle size={16} className="text-emerald-400" fill="rgba(16, 185, 129, 0.2)" />
                </div>
            )}

            {/* Card Content */}
            <div className="p-4">
                {/* Top Row: Lesson Number + Duration */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {/* Type Icon */}
                        {isQuiz ? (
                            <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[10px] font-bold uppercase rounded">
                                QUIZ
                            </span>
                        ) : (
                            <Monitor size={14} className="text-brand-blue-light" />
                        )}
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            LESSON {lessonNumber}
                        </span>
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                        {formatDuration(lesson.duration)}
                    </span>
                </div>

                {/* Lesson Title */}
                <h4 className={`
                    text-sm font-semibold line-clamp-2 leading-tight
                    ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}
                    transition-colors
                `}>
                    {lesson.title}
                </h4>
            </div>

            {/* Hover Actions */}
            <div className={`
                absolute bottom-3 right-3 flex items-center gap-1.5
                opacity-0 translate-x-2 transition-all duration-200
                ${!isActive ? 'group-hover:opacity-100 group-hover:translate-x-0' : ''}
            `}>
                <button
                    onClick={handleAdd}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                    title="Add to collection"
                >
                    <Plus size={14} />
                </button>
                <button
                    onClick={handleAsk}
                    className="p-1.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 text-brand-blue-light transition-colors"
                    title="Ask Prometheus"
                >
                    <Sparkles size={14} />
                </button>
            </div>
        </div>
    );
};

export default CourseLessonCard;
