'use client';

import React, { useState, useMemo } from 'react';
import { BookOpen, Plus, Edit3, ChevronDown, Video, HelpCircle, FileText, Layers } from 'lucide-react';
import { Course, Module, Resource, Lesson } from '@/types';
import { ExpertCredential } from '@/app/actions/credentials';
import CourseDescriptionSectionAdmin from './CourseDescriptionSectionAdmin';
import { useAdminCourse } from '@/components/admin/AdminCoursePageWrapper';

interface CourseBuilderViewProps {
    course: Course & { skills?: string[] };
    syllabus: Module[];
    resources: Resource[];
    authorCredentials: ExpertCredential[];
}

/**
 * CourseBuilderView renders the course page layout for admin editing.
 * It's a simplified version of CoursePageV2 focused on the description view
 * with admin edit overlays enabled.
 */
export default function CourseBuilderView({
    course,
    syllabus,
    resources,
    authorCredentials
}: CourseBuilderViewProps) {
    const { openPanel } = useAdminCourse();
    const [expandedModules, setExpandedModules] = useState<string[]>(
        syllabus.length > 0 ? [syllabus[0].id] : []
    );

    const handleToggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pt-6 pb-36">
                {/* Course Description Section with Admin Edit Overlays */}
                <CourseDescriptionSectionAdmin
                    course={course}
                    authorCredentials={authorCredentials}
                />

                {/* Modules Section */}
                <div>
                    {/* Section Header - Centered */}
                    <div className="flex items-center justify-center gap-3 py-[45px]">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                        <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-brand-blue-light" />
                            <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-400">
                                COURSE MODULES
                            </h2>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                    </div>

                    {/* Module List */}
                    <div className="space-y-4">
                        {syllabus.map((module, index) => (
                            <ModuleContainerAdmin
                                key={module.id}
                                module={module}
                                moduleIndex={index}
                                isExpanded={expandedModules.includes(module.id)}
                                onToggle={() => handleToggleModule(module.id)}
                                onEditModule={() => openPanel('module', module.id)}
                                onEditLesson={(lessonId) => openPanel('lesson', module.id, lessonId)}
                                onAddLesson={() => openPanel('lesson', module.id)}
                            />
                        ))}

                        {/* Add Module Button */}
                        <button
                            onClick={() => openPanel('module')}
                            className="w-full p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-blue-light/30 text-slate-500 hover:text-brand-blue-light transition-all flex items-center justify-center gap-3 group"
                        >
                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-blue-light/10 transition-colors">
                                <Plus size={20} />
                            </div>
                            <span className="font-medium">Add Module</span>
                        </button>
                    </div>
                </div>

                {/* Resources Section - with Edit Overlay */}
                <div className="mt-12">
                    <div
                        className="group relative cursor-pointer"
                        onClick={() => openPanel('resources')}
                    >
                        {/* Section Header */}
                        <div className="flex items-center justify-center gap-3 py-8">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                            <div className="flex items-center gap-2">
                                <FileText size={14} className="text-brand-blue-light" />
                                <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-400">
                                    COURSE RESOURCES
                                </h2>
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                        </div>

                        {/* Resources Preview */}
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                            {resources.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {resources.map((resource) => (
                                        <div
                                            key={resource.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <FileText size={16} className="text-slate-400" />
                                            <span className="text-sm text-slate-300 truncate">{resource.title}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <FileText size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm">No resources added yet</p>
                                    <p className="text-xs text-slate-600 mt-1">Click to add downloadable resources</p>
                                </div>
                            )}
                        </div>

                        {/* Edit Overlay */}
                        <div className="absolute inset-0 bg-brand-blue-light/5 border-2 border-brand-blue-light/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center pointer-events-none z-10">
                            <div className="p-3 rounded-full bg-black/70 border border-brand-blue-light/50 shadow-lg">
                                <Edit3 size={20} className="text-brand-blue-light" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Admin Module Container
// ============================================

interface ModuleContainerAdminProps {
    module: Module;
    moduleIndex: number;
    isExpanded: boolean;
    onToggle: () => void;
    onEditModule: () => void;
    onEditLesson: (lessonId: string) => void;
    onAddLesson: () => void;
}

function ModuleContainerAdmin({
    module,
    moduleIndex,
    isExpanded,
    onToggle,
    onEditModule,
    onEditLesson,
    onAddLesson
}: ModuleContainerAdminProps) {
    return (
        <div className={`
            rounded-2xl overflow-hidden transition-all duration-300
            ${isExpanded
                ? 'bg-white/[0.03] border border-white/10'
                : 'bg-transparent border border-white/5 hover:border-white/10'
            }
        `}>
            {/* Module Header */}
            <div className="flex items-center justify-between p-5 group">
                <button
                    onClick={onToggle}
                    className="flex items-center gap-3 min-w-0 flex-1"
                >
                    <ChevronDown
                        size={18}
                        className={`
                            text-slate-500 transition-transform duration-300 flex-shrink-0
                            ${isExpanded ? 'rotate-0' : '-rotate-90'}
                        `}
                    />
                    <h3 className="text-base font-semibold text-white truncate">
                        <span className="text-slate-400">{moduleIndex + 1}.</span>{' '}
                        {module.title || 'Untitled Module'}
                    </h3>
                </button>

                {/* Edit Module Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditModule();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border border-brand-blue-light/30 text-brand-blue-light text-[10px] font-bold uppercase tracking-wider transition-all opacity-0 group-hover:opacity-100"
                >
                    <Edit3 size={10} />
                    Edit
                </button>
            </div>

            {/* Module Content (Lessons) */}
            <div className={`
                grid transition-all duration-300 ease-out
                ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
            `}>
                <div className="overflow-hidden">
                    <div className="px-5 pt-3 pb-5">
                        {/* Lessons Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {module.lessons.map((lesson, lessonIndex) => (
                                <LessonCardAdmin
                                    key={lesson.id}
                                    lesson={lesson}
                                    lessonNumber={`${moduleIndex + 1}.${lessonIndex + 1}`}
                                    onEdit={() => onEditLesson(lesson.id)}
                                />
                            ))}

                            {/* Add Lesson Button */}
                            <button
                                onClick={onAddLesson}
                                className="rounded-xl border-2 border-dashed border-white/10 hover:border-brand-blue-light/30 p-6 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-brand-blue-light transition-all group min-h-[120px]"
                            >
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-blue-light/10 transition-colors">
                                    <Plus size={16} />
                                </div>
                                <span className="text-xs font-medium">Add Lesson</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Admin Lesson Card
// ============================================

interface LessonCardAdminProps {
    lesson: Lesson;
    lessonNumber: string;
    onEdit: () => void;
}

function LessonCardAdmin({ lesson, lessonNumber, onEdit }: LessonCardAdminProps) {
    const isQuiz = lesson.type === 'quiz';
    const isArticle = lesson.type === 'article';

    const typeIcon = isQuiz ? (
        <HelpCircle size={12} className="text-brand-orange" />
    ) : isArticle ? (
        <FileText size={12} className="text-purple-400" />
    ) : (
        <Video size={12} className="text-brand-blue-light" />
    );

    return (
        <div
            onClick={onEdit}
            className="group relative rounded-xl cursor-pointer transition-all duration-300 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20"
        >
            {/* Card Content */}
            <div className="px-4 py-[26px]">
                {/* Top Row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {isQuiz ? (
                            <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[9px] font-bold uppercase rounded border border-brand-orange/30">
                                QUIZ
                            </span>
                        ) : isArticle ? (
                            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold uppercase rounded border border-purple-500/30">
                                ARTICLE
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold tracking-wider text-brand-blue-light uppercase">
                                LESSON {lessonNumber}
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500">
                        {lesson.duration || '0m'}
                    </span>
                </div>

                {/* Lesson Title */}
                <h4 className="text-sm font-semibold leading-tight text-slate-200 group-hover:text-white transition-colors">
                    {lesson.title || 'Untitled Lesson'}
                </h4>

                {/* Video Status Indicator */}
                {!isQuiz && !isArticle && (
                    <div className="mt-2 flex items-center gap-1.5">
                        {typeIcon}
                        <span className="text-[10px] text-slate-500">
                            {lesson.video_url ? 'Video attached' : 'No video'}
                        </span>
                    </div>
                )}
            </div>

            {/* Hover Edit Overlay */}
            <div className="absolute inset-0 bg-brand-blue-light/5 border-2 border-brand-blue-light/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center pointer-events-none z-10">
                <div className="p-2 rounded-full bg-black/70 border border-brand-blue-light/50 shadow-lg">
                    <Edit3 size={14} className="text-brand-blue-light" />
                </div>
            </div>
        </div>
    );
}
