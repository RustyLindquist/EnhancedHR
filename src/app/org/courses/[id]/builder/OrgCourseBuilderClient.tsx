'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Course, Module, Resource } from '@/types';
import { ExpertCredential } from '@/app/actions/credentials';
import AdminCoursePageWrapper, { CourseBuilderPanelType } from '@/components/admin/AdminCoursePageWrapper';
import CourseBuilderView from '@/app/admin/courses/[id]/builder/CourseBuilderView';
import { deleteOrgCourse, publishOrgCourse, unpublishOrgCourse } from '@/app/actions/org-courses';

// Import all editor panels
import {
    CourseImageEditorPanel,
    CourseDescriptionEditorPanel,
    SkillsEditorPanel,
    ExpertAssignmentPanel,
    ModuleEditorPanel,
    LessonEditorPanel,
    ResourcesEditorPanel
} from '@/components/admin/course-panels';
import BulkVideoUploadPanel from '@/components/admin/course-panels/BulkVideoUploadPanel';

// Delete confirmation dialog component
function DeleteConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    courseTitle,
    isDeleting
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    courseTitle: string;
    isDeleting: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-[#0B1120] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Delete Course</h3>
                </div>

                <p className="text-slate-400 mb-2">
                    Are you sure you want to delete this course?
                </p>
                <p className="text-white font-medium mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    {courseTitle}
                </p>
                <p className="text-sm text-red-400/80 mb-6">
                    This action cannot be undone. All modules, lessons, and progress data will be permanently deleted.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Course'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface OrgCourseBuilderClientProps {
    course: Course & { skills?: string[]; status?: string };
    syllabus: Module[];
    resources: Resource[];
    authorCredentials: ExpertCredential[];
    orgId: string;
}

export default function OrgCourseBuilderClient({
    course: initialCourse,
    syllabus: initialSyllabus,
    resources: initialResources,
    authorCredentials: initialAuthorCredentials,
    orgId
}: OrgCourseBuilderClientProps) {
    const router = useRouter();
    const [refreshKey, setRefreshKey] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);

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

    // Handle delete course
    const handleDeleteCourse = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteOrgCourse(initialCourse.id, orgId);
            if (result.success) {
                router.push('/org/courses');
            } else {
                console.error('Failed to delete course:', result.error);
                alert('Failed to delete course: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('An error occurred while deleting the course');
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // Handle status toggle (publish/unpublish)
    const handleToggleStatus = async () => {
        setIsTogglingStatus(true);
        try {
            const isCurrentlyPublished = initialCourse.status === 'published';
            const action = isCurrentlyPublished ? unpublishOrgCourse : publishOrgCourse;
            const result = await action(initialCourse.id);

            if (result.success) {
                handleRefresh();
            } else {
                console.error('Failed to toggle status:', result.error);
                alert('Failed to update course status: ' + result.error);
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            alert('An error occurred while updating the course status');
        } finally {
            setIsTogglingStatus(false);
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

    const isPublished = initialCourse.status === 'published';

    return (
        <div className="min-h-screen">
            {/* Course Builder Header Bar */}
            <div className="sticky top-0 z-40 h-16 bg-transparent px-6 flex items-center justify-between">
                {/* Left: Back Button and Course Title */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/org/courses"
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
                        {/* Status Badge - Clickable to toggle */}
                        <button
                            onClick={handleToggleStatus}
                            disabled={isTogglingStatus}
                            className={`
                                px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer
                                hover:scale-105 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                ${isPublished
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                }
                            `}
                            title={isPublished ? 'Click to unpublish' : 'Click to publish'}
                        >
                            {isTogglingStatus ? (
                                <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                </span>
                            ) : (
                                isPublished ? 'Published' : 'Draft'
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Delete Course Button */}
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-medium rounded-full border border-red-500/30 transition-colors flex items-center gap-2"
                    >
                        <Trash2 size={16} />
                        Delete Course
                    </button>

                    {/* Bulk Upload Button */}
                    <button
                        onClick={() => handleOpenPanel('bulk_upload')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-brand-blue-light/30 transition-all text-sm font-medium"
                    >
                        <Upload size={16} />
                        Bulk Video Upload
                    </button>

                    {/* Preview Link */}
                    <Link
                        href={`/?courseId=${initialCourse.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        <Eye size={16} />
                        Preview
                    </Link>

                    {/* Editor Mode Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
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

            {/* Custom Description Panel for Org Courses (no pending_review status) */}
            <OrgCourseDescriptionPanel
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

            {/* ============================================ */}
            {/* Delete Confirmation Dialog */}
            {/* ============================================ */}

            <DeleteConfirmDialog
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
                onConfirm={handleDeleteCourse}
                courseTitle={initialCourse.title}
                isDeleting={isDeleting}
            />
        </div>
    );
}

// ============================================
// Custom Description Panel for Org Courses
// Only shows draft/published status options
// ============================================

import { X, Check, Plus } from 'lucide-react';
import { updateCourseDetails, generateCourseDescription, getPublishedCategories } from '@/app/actions/course-builder';

function OrgCourseDescriptionPanel({
    isOpen,
    onClose,
    courseId,
    currentTitle,
    currentDescription,
    currentCategories,
    currentStatus,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentTitle: string;
    currentDescription: string;
    currentCategories: string[];
    currentStatus?: string;
    onSave: () => void;
}) {
    const [title, setTitle] = useState(currentTitle);
    const [description, setDescription] = useState(currentDescription);
    const [categories, setCategories] = useState<string[]>(currentCategories.length > 0 ? currentCategories : ['General']);
    const [status, setStatus] = useState<'draft' | 'published'>(
        currentStatus === 'published' ? 'published' : 'draft'
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Dynamic categories state
    const [availableCategories, setAvailableCategories] = useState<string[]>(['General']);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Fetch available categories on mount
    React.useEffect(() => {
        async function loadCategories() {
            setIsLoadingCategories(true);
            const result = await getPublishedCategories();
            if (result.success && result.categories) {
                let cats = result.categories;
                currentCategories.forEach(cat => {
                    if (cat && !cats.includes(cat)) {
                        cats = [...cats, cat];
                    }
                });
                setAvailableCategories(cats.sort());
            }
            setIsLoadingCategories(false);
        }
        loadCategories();
    }, [currentCategories]);

    // Reset form when panel opens
    React.useEffect(() => {
        if (isOpen) {
            setTitle(currentTitle);
            setDescription(currentDescription);
            setCategories(currentCategories.length > 0 ? currentCategories : ['General']);
            setStatus(currentStatus === 'published' ? 'published' : 'draft');
        }
    }, [isOpen, currentTitle, currentDescription, currentCategories, currentStatus]);

    // Toggle a category selection
    const toggleCategory = (category: string) => {
        const isSelected = categories.includes(category);
        if (isSelected) {
            if (categories.length <= 1) return;
            setCategories(categories.filter(c => c !== category));
        } else {
            setCategories([...categories, category].sort());
        }
    };

    // Handle adding a new category
    const handleAddCategory = () => {
        const trimmed = newCategoryName.trim();
        if (trimmed) {
            if (!availableCategories.includes(trimmed)) {
                setAvailableCategories(prev => [...prev, trimmed].sort());
            }
            if (!categories.includes(trimmed)) {
                setCategories([...categories, trimmed].sort());
            }
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };

    const handleSave = async () => {
        if (categories.length === 0) {
            alert('At least one category is required');
            return;
        }

        setIsSaving(true);
        try {
            const result = await updateCourseDetails(courseId, {
                title,
                description,
                categories,
                status
            });

            if (result.success) {
                onSave();
            } else {
                console.error('Failed to update course:', result.error);
                alert('Failed to save changes: ' + result.error);
            }
        } catch (error) {
            console.error('Error saving course:', error);
            alert('An error occurred while saving');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateDescription = async () => {
        setIsGenerating(true);
        try {
            const result = await generateCourseDescription(courseId);
            if (result.success && result.description) {
                setDescription(result.description);
            } else {
                alert(result.error || 'Failed to generate description');
            }
        } catch (error) {
            console.error('Error generating description:', error);
            alert('An error occurred while generating the description');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative bg-[#0B1120] border border-white/10 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Course Details</h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Course Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                            placeholder="Enter course title"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Description
                            </label>
                            <button
                                onClick={handleGenerateDescription}
                                disabled={isGenerating}
                                className="text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    'Generate with AI'
                                )}
                            </button>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                            placeholder="Enter course description"
                        />
                    </div>

                    {/* Categories - Multi-select */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Categories
                        </label>

                        {/* Selected categories display */}
                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                            {categories.map(cat => (
                                <span
                                    key={cat}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium"
                                >
                                    {cat}
                                    {categories.length > 1 && (
                                        <button
                                            onClick={() => toggleCategory(cat)}
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>

                        {/* Add category input or dropdown toggle */}
                        {isAddingCategory ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddCategory();
                                        if (e.key === 'Escape') {
                                            setIsAddingCategory(false);
                                            setNewCategoryName('');
                                        }
                                    }}
                                    placeholder="New category name"
                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-sm"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddCategory}
                                    disabled={!newCategoryName.trim()}
                                    className="px-3 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
                                >
                                    Add
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingCategory(false);
                                        setNewCategoryName('');
                                    }}
                                    className="px-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                    disabled={isLoadingCategories}
                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-left text-slate-400 hover:border-white/20 transition-colors disabled:opacity-50 text-sm"
                                >
                                    {isLoadingCategories ? 'Loading categories...' : 'Select categories...'}
                                </button>

                                {/* Dropdown */}
                                {showCategoryDropdown && (
                                    <div className="absolute z-50 top-full left-0 right-0 mt-1 p-2 rounded-lg bg-slate-900 border border-white/10 shadow-xl max-h-60 overflow-y-auto">
                                        {availableCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => toggleCategory(cat)}
                                                className={`
                                                    w-full flex items-center justify-between px-3 py-2 rounded-md text-left text-sm transition-colors
                                                    ${categories.includes(cat)
                                                        ? 'bg-amber-500/20 text-amber-400'
                                                        : 'text-white hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <span>{cat}</span>
                                                {categories.includes(cat) && (
                                                    <Check size={16} />
                                                )}
                                            </button>
                                        ))}

                                        {/* Add new category button */}
                                        <button
                                            onClick={() => {
                                                setShowCategoryDropdown(false);
                                                setIsAddingCategory(true);
                                            }}
                                            className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-md text-left text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10 pt-3"
                                        >
                                            <Plus size={14} />
                                            Add new category
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Click outside to close dropdown */}
                        {showCategoryDropdown && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowCategoryDropdown(false)}
                            />
                        )}
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Status
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStatus('draft')}
                                className={`
                                    flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                                    ${status === 'draft'
                                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }
                                `}
                            >
                                Draft
                            </button>
                            <button
                                onClick={() => setStatus('published')}
                                className={`
                                    flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                                    ${status === 'published'
                                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                    }
                                `}
                            >
                                Published
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            {status === 'draft'
                                ? 'Draft courses are only visible to org admins.'
                                : 'Published courses are visible to all organization members.'}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
