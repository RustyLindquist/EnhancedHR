'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, RefreshCw, Loader2, Check, ChevronDown, Plus, X, FileText } from 'lucide-react';
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
import { resetCourseDurations, regenerateCourseTranscripts, updateCourseDetails, getPublishedCategories } from '@/app/actions/course-builder';

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
    const [isResettingTimes, setIsResettingTimes] = useState(false);
    const [isRegeneratingTranscripts, setIsRegeneratingTranscripts] = useState(false);

    // Panel state
    const [activePanel, setActivePanel] = useState<CourseBuilderPanelType>(null);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

    // Status dropdown state
    const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<'draft' | 'pending_review' | 'published' | 'archived'>(initialCourse.status || 'draft');

    // Categories dropdown state
    const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
    const [currentCategories, setCurrentCategories] = useState<string[]>(initialCourse.categories || []);
    const [availableCategories, setAvailableCategories] = useState<string[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const STATUS_OPTIONS: { value: 'draft' | 'pending_review' | 'published' | 'archived'; label: string; colorClass: string }[] = [
        { value: 'draft', label: 'Draft', colorClass: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' },
        { value: 'pending_review', label: 'Pending Review', colorClass: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
        { value: 'published', label: 'Published', colorClass: 'text-green-400 bg-green-500/20 border-green-500/30' },
        { value: 'archived', label: 'Archived', colorClass: 'text-orange-400 bg-orange-500/20 border-orange-500/30' },
    ];

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

    // Load available categories on mount
    useEffect(() => {
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            const result = await getPublishedCategories();
            if (result.success && result.categories) {
                setAvailableCategories(result.categories);
            }
            setIsLoadingCategories(false);
        };
        loadCategories();
    }, []);

    const handleStatusChange = async (newStatus: 'draft' | 'pending_review' | 'published' | 'archived') => {
        const result = await updateCourseDetails(initialCourse.id, {
            status: newStatus
        });
        if (result.success) {
            setCurrentStatus(newStatus);
            setStatusDropdownOpen(false);
            handleRefresh();
        }
    };

    const handleCategoryToggle = async (category: string) => {
        let newCategories: string[];
        if (currentCategories.includes(category)) {
            // Don't allow removing the last category
            if (currentCategories.length <= 1) return;
            newCategories = currentCategories.filter(c => c !== category);
        } else {
            newCategories = [...currentCategories, category];
        }

        const result = await updateCourseDetails(initialCourse.id, { categories: newCategories });
        if (result.success) {
            setCurrentCategories(newCategories);
            handleRefresh();
        }
    };

    const handleAddNewCategory = async () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) return;

        // Check if category already exists (case-insensitive)
        if (availableCategories.some(c => c.toLowerCase() === trimmedName.toLowerCase())) {
            // Just select it if it exists
            if (!currentCategories.includes(trimmedName)) {
                await handleCategoryToggle(trimmedName);
            }
            setNewCategoryName('');
            setIsAddingCategory(false);
            return;
        }

        // Add new category to the course
        const newCategories = [...currentCategories, trimmedName];
        const result = await updateCourseDetails(initialCourse.id, { categories: newCategories });
        if (result.success) {
            setCurrentCategories(newCategories);
            setAvailableCategories(prev => [...prev, trimmedName].sort());
            setNewCategoryName('');
            setIsAddingCategory(false);
            handleRefresh();
        }
    };

    const handleResetCourseTimes = async () => {
        if (!confirm('This will recalculate durations for all video lessons in this course. Continue?')) {
            return;
        }

        setIsResettingTimes(true);
        try {
            const result = await resetCourseDurations(initialCourse.id);
            if (result.success && result.results) {
                const { lessonsUpdated, lessonsSkipped, lessonsFailed, totalDuration, details } = result.results;

                // Build detailed message
                let message = `Duration reset complete!\n\nUpdated: ${lessonsUpdated} lessons\nSkipped: ${lessonsSkipped}\nFailed: ${lessonsFailed}\n\nNew course duration: ${totalDuration}`;

                // Show failed lessons with their errors
                if (lessonsFailed > 0) {
                    const failedDetails = details
                        .filter(d => d.status === 'failed')
                        .map(d => `• ${d.lessonTitle}: ${d.error}`)
                        .join('\n');
                    message += `\n\n--- Failed Lessons ---\n${failedDetails}`;
                }

                alert(message);
                handleRefresh();
            } else {
                alert(`Error: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            alert(`Error resetting durations: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsResettingTimes(false);
        }
    };

    const handleRegenerateTranscripts = async () => {
        if (!confirm('This will regenerate AI transcripts for all video lessons in this course.\n\n• User-entered transcripts will NOT be overwritten\n• Each lesson takes ~5-10 seconds due to API rate limits\n• A course with 15 lessons may take 2-3 minutes\n\nContinue?')) {
            return;
        }

        setIsRegeneratingTranscripts(true);
        try {
            const result = await regenerateCourseTranscripts(initialCourse.id);
            if (result.success && result.results) {
                const { lessonsGenerated, lessonsSkipped, lessonsFailed, details } = result.results;

                // Build detailed message
                let message = `Transcript regeneration complete!\n\nGenerated: ${lessonsGenerated} lessons\nSkipped: ${lessonsSkipped}\nFailed: ${lessonsFailed}`;

                // Show failed lessons with their errors
                if (lessonsFailed > 0) {
                    const failedDetails = details
                        .filter(d => d.status === 'failed')
                        .map(d => `• ${d.lessonTitle}: ${d.error}`)
                        .join('\n');
                    message += `\n\n--- Failed Lessons ---\n${failedDetails}`;
                }

                alert(message);
                handleRefresh();
            } else {
                alert(`Error: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            alert(`Error regenerating transcripts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsRegeneratingTranscripts(false);
        }
    };

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
                        {/* Status Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer
                                    transition-all border
                                    ${STATUS_OPTIONS.find(s => s.value === currentStatus)?.colorClass || 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'}
                                `}
                            >
                                {STATUS_OPTIONS.find(s => s.value === currentStatus)?.label || 'Draft'}
                                <ChevronDown size={12} className={`transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {statusDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setStatusDropdownOpen(false)} />
                                    <div className="absolute z-50 top-full left-0 mt-2 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                        {STATUS_OPTIONS.map(option => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleStatusChange(option.value)}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors
                                                    ${currentStatus === option.value
                                                        ? 'bg-white/10 ' + option.colorClass.split(' ')[0]
                                                        : 'text-white hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <span>{option.label}</span>
                                                {currentStatus === option.value && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Categories Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-brand-blue-light/30 transition-all text-xs font-medium"
                            >
                                <span className="max-w-32 truncate">
                                    {currentCategories.length > 0
                                        ? (currentCategories.length === 1
                                            ? currentCategories[0]
                                            : `${currentCategories.length} categories`)
                                        : 'No categories'}
                                </span>
                                <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {categoriesDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => { setCategoriesDropdownOpen(false); setIsAddingCategory(false); setNewCategoryName(''); }} />
                                    <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col">
                                        {/* Header */}
                                        <div className="p-3 border-b border-white/10 flex items-center justify-between flex-shrink-0">
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</span>
                                            {!isAddingCategory && (
                                                <button
                                                    onClick={() => setIsAddingCategory(true)}
                                                    className="flex items-center gap-1 text-xs text-brand-blue-light hover:text-white transition-colors"
                                                >
                                                    <Plus size={14} />
                                                    Add New
                                                </button>
                                            )}
                                        </div>

                                        {/* Add New Category Input */}
                                        {isAddingCategory && (
                                            <div className="p-3 border-b border-white/10 flex-shrink-0">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddNewCategory();
                                                            if (e.key === 'Escape') { setIsAddingCategory(false); setNewCategoryName(''); }
                                                        }}
                                                        placeholder="New category name..."
                                                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue-light/50"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={handleAddNewCategory}
                                                        disabled={!newCategoryName.trim()}
                                                        className="p-2 bg-brand-blue-light/20 text-brand-blue-light rounded-lg hover:bg-brand-blue-light/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }}
                                                        className="p-2 bg-white/5 text-slate-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Category List */}
                                        <div className="overflow-y-auto flex-1">
                                            {isLoadingCategories ? (
                                                <div className="p-4 text-sm text-slate-400 text-center">Loading categories...</div>
                                            ) : availableCategories.length === 0 ? (
                                                <div className="p-4 text-sm text-slate-400 text-center">No categories yet. Add one above.</div>
                                            ) : (
                                                <div className="p-2">
                                                    {availableCategories.map(category => (
                                                        <button
                                                            key={category}
                                                            onClick={() => handleCategoryToggle(category)}
                                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors mb-1
                                                                ${currentCategories.includes(category)
                                                                    ? 'bg-brand-blue-light/20 text-brand-blue-light'
                                                                    : 'text-white hover:bg-white/5'
                                                                }
                                                            `}
                                                        >
                                                            <span>{category}</span>
                                                            {currentCategories.includes(category) && <Check size={14} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer showing selected count */}
                                        <div className="p-2 border-t border-white/10 flex-shrink-0">
                                            <span className="text-xs text-slate-500">
                                                {currentCategories.length} selected
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleResetCourseTimes}
                        disabled={isResettingTimes}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-brand-blue-light/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResettingTimes ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {isResettingTimes ? 'Resetting...' : 'Reset Course Times'}
                    </button>
                    <button
                        onClick={handleRegenerateTranscripts}
                        disabled={isRegeneratingTranscripts}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-brand-blue-light/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRegeneratingTranscripts ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <FileText size={16} />
                        )}
                        {isRegeneratingTranscripts ? 'Regenerating...' : 'Regenerate Transcripts'}
                    </button>
                    <Link
                        href={`/dashboard?courseId=${initialCourse.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
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
                currentCategories={initialCourse.categories || [initialCourse.category || 'General']}
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
                lessonQuizData={editingLesson?.quiz_data}
                isNewLesson={!editingLessonId}
                onSave={handlePanelSave}
                onDelete={handlePanelSave}
                // Transcript props - use undefined instead of '' for proper fallback to lessonContent
                lessonAiTranscript={editingLesson?.ai_transcript || undefined}
                lessonUserTranscript={editingLesson?.user_transcript || ''}
                lessonTranscriptStatus={editingLesson?.transcript_status || 'pending'}
                lessonTranscriptSource={editingLesson?.transcript_source || 'none'}
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
