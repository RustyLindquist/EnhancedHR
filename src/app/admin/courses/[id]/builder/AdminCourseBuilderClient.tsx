'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Upload } from 'lucide-react';
import Link from 'next/link';
import { Course, Module, Resource, Lesson } from '@/types';
import { ExpertCredential } from '@/app/actions/credentials';
import AdminCoursePageWrapper, { CourseBuilderPanelType } from '@/components/admin/AdminCoursePageWrapper';
import CourseBuilderView from './CourseBuilderView';

// Import all editor panels
import {
    CourseImageEditorPanel,
    CourseDescriptionEditorPanel,
    SkillsEditorPanel,
    CreditsEditorPanel,
    ExpertAssignmentPanel,
    ModuleEditorPanel,
    LessonEditorPanel,
    ResourcesEditorPanel
} from '@/components/admin/course-panels';
import BulkVideoUploadPanel from '@/components/admin/course-panels/BulkVideoUploadPanel';

interface AdminCourseBuilderClientProps {
    course: Course & { skills?: string[]; status?: string };
    syllabus: Module[];
    resources: Resource[];
    authorCredentials: ExpertCredential[];
}

export default function AdminCourseBuilderClient({
    course: initialCourse,
    syllabus: initialSyllabus,
    resources: initialResources,
    authorCredentials: initialAuthorCredentials
}: AdminCourseBuilderClientProps) {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);

    // Panel state
    const [activePanel, setActivePanel] = useState<CourseBuilderPanelType>(null);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

    const handleRefresh = useCallback(() => {
        router.refresh();
        setRefreshKey(prev => prev + 1);
    }, [router]);

    const handleOpenPanel = useCallback((
        panel: CourseBuilderPanelType,
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

    // Get the current editing module's details
    const editingModule = useMemo(() => {
        if (!editingModuleId) return null;
        return initialSyllabus.find(m => m.id === editingModuleId);
    }, [editingModuleId, initialSyllabus]);

    // Get the current editing lesson's details
    const editingLesson = useMemo(() => {
        if (!editingLessonId || !editingModuleId) return null;
        const module = initialSyllabus.find(m => m.id === editingModuleId);
        return module?.lessons.find(l => l.id === editingLessonId);
    }, [editingLessonId, editingModuleId, initialSyllabus]);

    return (
        <div className="min-h-screen">
            {/* Course Builder Header Bar */}
            <div className="sticky top-0 z-40 h-16 bg-transparent px-6 flex items-center justify-between">
                {/* Left: Back Button and Course Title */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/courses"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Courses</span>
                    </Link>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-bold text-white truncate max-w-md">
                            {initialCourse.title}
                        </h1>
                        <button
                            onClick={() => handleOpenPanel('description')}
                            className={`
                                px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer
                                hover:scale-105 hover:shadow-lg transition-all
                                ${initialCourse.status === 'published'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                    : initialCourse.status === 'pending_review'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                                    : initialCourse.status === 'archived'
                                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30'
                                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                                }
                            `}
                            title="Click to change course status"
                        >
                            {initialCourse.status === 'pending_review' ? 'Pending Review' : (initialCourse.status || 'draft')}
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleOpenPanel('bulk_upload')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-brand-blue-light/30 transition-all text-sm font-medium"
                    >
                        <Upload size={16} />
                        Bulk Video Upload
                    </button>
                    <Link
                        href={`/?courseId=${initialCourse.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <Eye size={16} />
                        Preview
                    </Link>
                    {/* Admin Mode Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/20 border border-brand-orange/30">
                        <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
                        <span className="text-brand-orange text-xs font-bold uppercase tracking-wider">
                            Editor Mode
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div>
                <AdminCoursePageWrapper
                    course={initialCourse}
                    syllabus={initialSyllabus}
                    resources={initialResources}
                    authorCredentials={initialAuthorCredentials}
                    onRefresh={handleRefresh}
                    activePanel={activePanel}
                    editingModuleId={editingModuleId}
                    editingLessonId={editingLessonId}
                    onOpenPanel={handleOpenPanel}
                    onClosePanel={handleClosePanel}
                >
                    <CourseBuilderView
                        key={refreshKey}
                        course={initialCourse}
                        syllabus={initialSyllabus}
                        resources={initialResources}
                        authorCredentials={initialAuthorCredentials}
                    />
                </AdminCoursePageWrapper>
            </div>

            {/* ============================================ */}
            {/* Course Metadata Editor Panels */}
            {/* ============================================ */}

            <CourseImageEditorPanel
                isOpen={activePanel === 'image'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentImage={initialCourse.image}
                onSave={handlePanelSave}
            />

            <CourseDescriptionEditorPanel
                isOpen={activePanel === 'description'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentTitle={initialCourse.title}
                currentDescription={initialCourse.description}
                currentCategory={initialCourse.category}
                currentStatus={initialCourse.status}
                onSave={handlePanelSave}
            />

            <SkillsEditorPanel
                isOpen={activePanel === 'skills'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentSkills={initialCourse.skills || []}
                onSave={handlePanelSave}
            />

            <CreditsEditorPanel
                isOpen={activePanel === 'credits'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentBadges={initialCourse.badges}
                onSave={handlePanelSave}
            />

            <ExpertAssignmentPanel
                isOpen={activePanel === 'expert'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentExpertId={initialCourse.authorDetails?.id}
                currentExpertName={initialCourse.authorDetails?.name || initialCourse.author}
                onSave={handlePanelSave}
            />

            {/* ============================================ */}
            {/* Module & Lesson Editor Panels */}
            {/* ============================================ */}

            <ModuleEditorPanel
                isOpen={activePanel === 'module'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                moduleId={editingModuleId}
                moduleTitle={editingModule?.title || ''}
                moduleDescription={editingModule?.description || ''}
                moduleOrder={editingModule ? initialSyllabus.indexOf(editingModule) : 0}
                isNewModule={!editingModuleId}
                onSave={handlePanelSave}
                onDelete={handlePanelSave}
            />

            <LessonEditorPanel
                isOpen={activePanel === 'lesson'}
                onClose={handleClosePanel}
                moduleId={editingModuleId || ''}
                lessonId={editingLessonId}
                lessonTitle={editingLesson?.title || ''}
                lessonType={editingLesson?.type || 'video'}
                lessonVideoUrl={editingLesson?.video_url || ''}
                lessonContent={editingLesson?.content || ''}
                lessonDuration={editingLesson?.duration || ''}
                isNewLesson={!editingLessonId}
                onSave={handlePanelSave}
                onDelete={handlePanelSave}
            />

            {/* ============================================ */}
            {/* Resources Editor Panel */}
            {/* ============================================ */}

            <ResourcesEditorPanel
                isOpen={activePanel === 'resources'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                resources={initialResources}
                onSave={handlePanelSave}
            />

            {/* ============================================ */}
            {/* Bulk Video Upload Panel */}
            {/* ============================================ */}

            <BulkVideoUploadPanel
                isOpen={activePanel === 'bulk_upload'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                modules={initialSyllabus}
                onComplete={handlePanelSave}
            />
        </div>
    );
}
