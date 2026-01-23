'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Send, AlertTriangle, Plus, Edit3, ChevronDown, Video, HelpCircle, FileText, Star, BookOpen, Layers, X } from 'lucide-react';
import Link from 'next/link';
import { Course, Module, Resource, Lesson } from '@/types';
import ExpertCoursePageWrapper, { ExpertCoursePanelType } from './ExpertCoursePageWrapper';
import ExpertCourseDescriptionPanel from './ExpertCourseDescriptionPanel';
import { submitCourseForReview } from '@/app/actions/expert-course-builder';

// Import reusable admin panels (these work with any action as long as we pass the right props)
import {
    CourseImageEditorPanel,
    SkillsEditorPanel,
    ResourcesEditorPanel
} from '@/components/admin/course-panels';

// Expert-specific module and lesson panels
import ExpertModuleEditorPanel from './ExpertModuleEditorPanel';
import ExpertLessonEditorPanel from './ExpertLessonEditorPanel';

interface ExpertCourseBuilderClientProps {
    course: Course & { skills?: string[]; status?: string };
    syllabus: Module[];
    resources: Resource[];
}

export default function ExpertCourseBuilderClient({
    course: initialCourse,
    syllabus: initialSyllabus,
    resources: initialResources
}: ExpertCourseBuilderClientProps) {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    // Panel state
    const [activePanel, setActivePanel] = useState<ExpertCoursePanelType>(null);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

    // Submit modal state
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Module expansion state
    const [expandedModules, setExpandedModules] = useState<string[]>(
        initialSyllabus.length > 0 ? [initialSyllabus[0].id] : []
    );

    const handleRefresh = useCallback(() => {
        router.refresh();
        setRefreshKey(prev => prev + 1);
    }, [router]);

    const handleOpenPanel = useCallback((
        panel: ExpertCoursePanelType,
        moduleId?: string,
        lessonId?: string
    ) => {
        setActivePanel(panel);
        setEditingModuleId(moduleId || null);
        setEditingLessonId(lessonId || null);
    }, []);

    const handleClosePanel = useCallback(() => {
        setActivePanel(null);
        setEditingModuleId(null);
        setEditingLessonId(null);
    }, []);

    const handlePanelSave = useCallback(() => {
        handleClosePanel();
        handleRefresh();
    }, [handleClosePanel, handleRefresh]);

    const handleToggleModule = useCallback((moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    }, []);

    const handleSubmitForReview = useCallback(async () => {
        setIsSubmitting(true);
        setSubmitError(null);

        const result = await submitCourseForReview(initialCourse.id);

        setIsSubmitting(false);

        if (result.success) {
            setShowSubmitModal(false);
            router.push('/author/courses');
        } else {
            setSubmitError(result.error || 'Failed to submit for review');
        }
    }, [initialCourse.id, router]);

    // Get the current editing module's details
    const editingModule = useMemo(() => {
        if (!editingModuleId) return null;
        return initialSyllabus.find(m => m.id === editingModuleId);
    }, [editingModuleId, initialSyllabus]);

    // Get the current editing lesson's details
    const editingLesson = useMemo(() => {
        if (!editingLessonId || !editingModuleId) return null;
        const module = initialSyllabus.find(m => m.id === editingModuleId);
        return module?.lessons?.find((l: Lesson) => l.id === editingLessonId);
    }, [editingLessonId, editingModuleId, initialSyllabus]);

    const skills = initialCourse.skills || [];

    return (
        <div className="min-h-screen">
            {/* Expert Course Builder Header */}
            <div className="sticky top-0 z-40 h-16 bg-transparent px-6 flex items-center justify-between">
                {/* Left: Back Button and Course Title */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/author/courses"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">My Courses</span>
                    </Link>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-white truncate max-w-md">
                            {initialCourse.title}
                        </h1>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            Draft
                        </span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    <Link
                        href={`/courses/${initialCourse.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <Eye size={16} />
                        Preview
                    </Link>

                    <button
                        onClick={() => setShowSubmitModal(true)}
                        className="flex items-center gap-2 px-5 py-2 bg-brand-orange text-white rounded-lg text-sm font-bold hover:bg-brand-orange/80 transition-colors"
                    >
                        <Send size={16} />
                        Submit for Review
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <ExpertCoursePageWrapper
                course={initialCourse}
                syllabus={initialSyllabus}
                resources={initialResources}
                onRefresh={handleRefresh}
                activePanel={activePanel}
                editingModuleId={editingModuleId}
                editingLessonId={editingLessonId}
                onOpenPanel={handleOpenPanel}
                onClosePanel={handleClosePanel}
            >
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pt-6 pb-36">
                    {/* Course Image - Editable */}
                    <div
                        className="group relative cursor-pointer"
                        onClick={() => handleOpenPanel('image')}
                    >
                        <div className="relative w-full h-[350px] rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
                            {initialCourse.image ? (
                                <img
                                    src={initialCourse.image}
                                    alt={initialCourse.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="text-6xl">📊</span>
                                        <p className="text-slate-500 text-sm mt-2">Click to add course image</p>
                                    </div>
                                </div>
                            )}

                            {/* Category Badge */}
                            <div className="absolute top-4 right-4 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/10">
                                <span className="px-2.5 py-1 rounded-full bg-white/10 text-brand-orange text-[10px] font-bold uppercase tracking-wider">
                                    {initialCourse.category || 'General'}
                                </span>
                            </div>
                        </div>

                        {/* Edit Overlay */}
                        <div className="absolute inset-0 bg-brand-blue-light/0 group-hover:bg-brand-blue-light/10 rounded-2xl transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3 rounded-xl bg-black/80 backdrop-blur-sm border border-brand-blue-light/30">
                                <Edit3 size={20} className="text-brand-blue-light" />
                            </div>
                        </div>
                    </div>

                    {/* Course Title & Description - Editable */}
                    <div
                        className="group relative cursor-pointer mt-8"
                        onClick={() => handleOpenPanel('description')}
                    >
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h1 className="text-3xl font-bold text-white mb-4">
                                {initialCourse.title}
                            </h1>
                            <p className="text-slate-400 leading-relaxed">
                                {initialCourse.description || 'Click to add a course description...'}
                            </p>
                        </div>

                        {/* Edit Overlay */}
                        <div className="absolute inset-0 bg-brand-blue-light/0 group-hover:bg-brand-blue-light/5 rounded-2xl transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3 rounded-xl bg-black/80 backdrop-blur-sm border border-brand-blue-light/30">
                                <Edit3 size={20} className="text-brand-blue-light" />
                            </div>
                        </div>
                    </div>

                    {/* Skills Section - Editable */}
                    <div
                        className="group relative cursor-pointer mt-8"
                        onClick={() => handleOpenPanel('skills')}
                    >
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                                What You'll Learn
                            </h3>
                            {skills.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {skills.map((skill, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <Star size={14} className="text-brand-blue-light mt-1 flex-shrink-0" />
                                            <span className="text-sm text-slate-300">{skill}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">Click to add skills learners will gain...</p>
                            )}
                        </div>

                        {/* Edit Overlay */}
                        <div className="absolute inset-0 bg-brand-blue-light/0 group-hover:bg-brand-blue-light/5 rounded-2xl transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3 rounded-xl bg-black/80 backdrop-blur-sm border border-brand-blue-light/30">
                                <Edit3 size={20} className="text-brand-blue-light" />
                            </div>
                        </div>
                    </div>

                    {/* Modules Section */}
                    <div className="mt-12">
                        <div className="flex items-center justify-center gap-3 py-8">
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
                            {initialSyllabus.map((module, index) => (
                                <div
                                    key={module.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                                >
                                    {/* Module Header */}
                                    <div
                                        className="group relative cursor-pointer"
                                        onClick={() => handleOpenPanel('module', module.id)}
                                    >
                                        <div className="flex items-center gap-4 p-5">
                                            <div className="w-10 h-10 rounded-xl bg-brand-blue-light/10 flex items-center justify-center">
                                                <span className="text-brand-blue-light font-bold text-lg">{index + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white">{module.title}</h3>
                                                <p className="text-xs text-slate-500">
                                                    {module.lessons?.length || 0} lessons • {module.duration || '0m'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleModule(module.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                            >
                                                <ChevronDown
                                                    size={20}
                                                    className={`text-slate-400 transition-transform ${
                                                        expandedModules.includes(module.id) ? 'rotate-180' : ''
                                                    }`}
                                                />
                                            </button>
                                        </div>

                                        {/* Edit Overlay */}
                                        <div className="absolute inset-0 bg-brand-blue-light/0 group-hover:bg-brand-blue-light/5 transition-all duration-200 flex items-center justify-center pointer-events-none">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-black/80 border border-brand-blue-light/30">
                                                <Edit3 size={16} className="text-brand-blue-light" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lessons Grid (expanded) */}
                                    <div className={`
                                        grid transition-all duration-300 ease-out
                                        ${expandedModules.includes(module.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
                                    `}>
                                        <div className="overflow-hidden">
                                            <div className="px-5 pt-3 pb-5">
                                                {/* Lessons Card Grid */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {module.lessons?.map((lesson: Lesson, lessonIndex: number) => {
                                                        const isQuiz = lesson.type === 'quiz';
                                                        const isArticle = lesson.type === 'article';
                                                        const lessonNumber = `${index + 1}.${lessonIndex + 1}`;

                                                        return (
                                                            <div
                                                                key={lesson.id}
                                                                onClick={() => handleOpenPanel('lesson', module.id, lesson.id)}
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
                                                                            <Video size={12} className="text-brand-blue-light" />
                                                                            <span className="text-[10px] text-slate-500">
                                                                                {(lesson as any).video_url ? 'Video attached' : 'No video'}
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
                                                    })}

                                                    {/* Add Lesson Button */}
                                                    <button
                                                        onClick={() => handleOpenPanel('lesson', module.id)}
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
                            ))}

                            {/* Add Module Button */}
                            <button
                                onClick={() => handleOpenPanel('module')}
                                className="w-full p-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-brand-blue-light/30 text-slate-500 hover:text-brand-blue-light transition-all flex items-center justify-center gap-3 group"
                            >
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-blue-light/10 transition-colors">
                                    <Plus size={20} />
                                </div>
                                <span className="font-medium">Add Module</span>
                            </button>
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="mt-12">
                        <div
                            className="group relative cursor-pointer"
                            onClick={() => handleOpenPanel('resources')}
                        >
                            <div className="flex items-center justify-center gap-3 py-8">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                                <div className="flex items-center gap-2">
                                    <Layers size={14} className="text-brand-blue-light" />
                                    <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-400">
                                        COURSE RESOURCES
                                    </h2>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                            </div>

                            {initialResources.length > 0 ? (
                                <div className="space-y-2">
                                    {initialResources.map((resource) => (
                                        <div
                                            key={resource.id}
                                            className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <FileText size={20} className="text-slate-400" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">{resource.title}</p>
                                                <p className="text-xs text-slate-500">{resource.type} • {resource.size || 'Unknown size'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center">
                                    <Layers size={32} className="mx-auto text-slate-600 mb-2" />
                                    <p className="text-slate-500 text-sm">No resources yet. Click to add.</p>
                                </div>
                            )}

                            {/* Edit Overlay */}
                            <div className="absolute inset-0 bg-brand-blue-light/0 group-hover:bg-brand-blue-light/5 rounded-2xl transition-all duration-200 flex items-center justify-center pointer-events-none">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-3 rounded-xl bg-black/80 backdrop-blur-sm border border-brand-blue-light/30">
                                    <Edit3 size={20} className="text-brand-blue-light" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ExpertCoursePageWrapper>

            {/* Editor Panels */}
            <CourseImageEditorPanel
                isOpen={activePanel === 'image'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentImage={initialCourse.image}
                onSave={handlePanelSave}
            />

            <ExpertCourseDescriptionPanel
                isOpen={activePanel === 'description'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentTitle={initialCourse.title}
                currentDescription={initialCourse.description}
                currentCategory={initialCourse.category}
                onSave={handlePanelSave}
            />

            <SkillsEditorPanel
                isOpen={activePanel === 'skills'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentSkills={initialCourse.skills || []}
                onSave={handlePanelSave}
            />

            <ExpertModuleEditorPanel
                isOpen={activePanel === 'module'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                moduleId={editingModuleId}
                moduleTitle={editingModule?.title || ''}
                moduleDescription={editingModule?.description || ''}
                isNewModule={!editingModuleId}
                onSave={handlePanelSave}
                onDelete={handlePanelSave}
            />

            <ExpertLessonEditorPanel
                isOpen={activePanel === 'lesson'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                moduleId={editingModuleId || ''}
                lessonId={editingLessonId}
                lessonTitle={editingLesson?.title || ''}
                lessonType={editingLesson?.type || 'video'}
                lessonVideoUrl={(editingLesson as any)?.video_url || ''}
                lessonContent={editingLesson?.content || ''}
                lessonDuration={editingLesson?.duration || ''}
                lessonQuizData={editingLesson?.quiz_data}
                isNewLesson={!editingLessonId}
                onSave={handlePanelSave}
                onDelete={handlePanelSave}
            />

            <ResourcesEditorPanel
                isOpen={activePanel === 'resources'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                resources={initialResources}
                onSave={handlePanelSave}
            />

            {/* Submit for Review Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <AlertTriangle size={24} className="text-yellow-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Submit for Review</h2>
                        </div>

                        <p className="text-slate-400 mb-6">
                            Once you submit this course for review, <strong className="text-white">you will no longer be able to edit it</strong>.
                            A platform administrator will review your course and publish it when ready.
                        </p>

                        {submitError && (
                            <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {submitError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-slate-400 font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitForReview}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-3 rounded-xl bg-brand-orange text-white font-bold hover:bg-brand-orange/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={16} />
                                        Submit
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
