'use client';

import React, { useState, useCallback, useMemo, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Upload, Trash2, X, User, Search, Loader2, CheckCircle, Shield } from 'lucide-react';
import Link from 'next/link';
import { Course, Module, Resource } from '@/types';
import { ExpertCredential } from '@/app/actions/credentials';
import AdminCoursePageWrapper, { CourseBuilderPanelType } from '@/components/admin/AdminCoursePageWrapper';
import CourseBuilderView from '@/app/admin/courses/[id]/builder/CourseBuilderView';
import { deleteOrgCourse, publishOrgCourse, unpublishOrgCourse, getOrgMembersForAuthor, assignOrgCourseAuthor, OrgMemberOption } from '@/app/actions/org-courses';
import DropdownPanel from '@/components/DropdownPanel';

// Import all editor panels (except ExpertAssignmentPanel - we use our own for org courses)
import {
    CourseImageEditorPanel,
    OrgCourseDescriptionPanel,
    SkillsEditorPanel,
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

// Org Author Assignment Panel - uses org members instead of platform experts
function OrgAuthorAssignmentPanel({
    isOpen,
    onClose,
    courseId,
    currentAuthorId,
    currentAuthorName,
    orgId,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    courseId: number;
    currentAuthorId?: string;
    currentAuthorName?: string;
    orgId: string;
    onSave: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [members, setMembers] = useState<OrgMemberOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(currentAuthorId || null);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Fetch org members on mount
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getOrgMembersForAuthor(orgId).then((data) => {
                setMembers(data);
                setLoading(false);
            });
        }
    }, [isOpen, orgId]);

    // Reset selection when panel opens
    useEffect(() => {
        if (isOpen) {
            setSelectedAuthorId(currentAuthorId || null);
        }
    }, [isOpen, currentAuthorId]);

    // Filter members by search query
    const filteredMembers = members.filter(member => {
        const name = member.full_name?.toLowerCase() || '';
        const title = member.expert_title?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return name.includes(query) || title.includes(query);
    });

    const handleSelectAuthor = (member: OrgMemberOption) => {
        setSelectedAuthorId(member.id);
    };

    const handleSave = useCallback(() => {
        setError(null);
        startTransition(async () => {
            const result = await assignOrgCourseAuthor(courseId, selectedAuthorId);
            if (result.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSave();
                }, 1000);
            } else {
                setError(result.error || 'Failed to assign author');
            }
        });
    }, [courseId, selectedAuthorId, onSave]);

    const handleRemoveAuthor = useCallback(() => {
        setSelectedAuthorId(null);
    }, []);

    const headerActions = (
        <div className="flex items-center gap-4">
            {showSuccess && (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle size={16} />
                    <span>Saved!</span>
                </div>
            )}
            <button
                onClick={handleSave}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
                {isPending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                    </>
                ) : (
                    'Save Changes'
                )}
            </button>
        </div>
    );

    // Get selected author details
    const selectedAuthor = members.find(m => m.id === selectedAuthorId);

    return (
        <DropdownPanel
            isOpen={isOpen}
            onClose={onClose}
            title="Assign Author"
            icon={User}
            iconColor="text-amber-400"
            headerActions={headerActions}
        >
            <div className="max-w-2xl space-y-6">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-slate-300">
                        Assign an organization member as the author of this course. The course belongs to the organization,
                        so it will persist even if the author&apos;s account is removed. In that case, it will show as
                        &quot;Unassigned&quot; until a new author is selected.
                    </p>
                </div>

                {/* Current Selection */}
                {selectedAuthorId && selectedAuthor && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-amber-500/30">
                                    {selectedAuthor.avatar_url ? (
                                        <img
                                            src={selectedAuthor.avatar_url}
                                            alt={selectedAuthor.full_name || ''}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">
                                            {selectedAuthor.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold text-white">{selectedAuthor.full_name}</h4>
                                        {selectedAuthor.role === 'org_admin' && (
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                                <Shield size={10} /> Admin
                                            </span>
                                        )}
                                    </div>
                                    {selectedAuthor.expert_title && (
                                        <p className="text-sm text-amber-400">
                                            {selectedAuthor.expert_title}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleRemoveAuthor}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* No Author Selected State */}
                {!selectedAuthorId && (
                    <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/20 text-center">
                        <User size={24} className="mx-auto mb-2 text-slate-500" />
                        <p className="text-sm text-slate-400">No author assigned</p>
                        <p className="text-xs text-slate-500 mt-1">Select an organization member below</p>
                    </div>
                )}

                {/* Search */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Search Organization Members
                    </label>
                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or title..."
                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 outline-none focus:border-amber-500/50"
                        />
                    </div>
                </div>

                {/* Member List */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Organization Members ({filteredMembers.length})
                    </label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto dropdown-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center py-8 text-slate-500">
                                <Loader2 size={24} className="animate-spin" />
                            </div>
                        ) : filteredMembers.length > 0 ? (
                            filteredMembers.map((member) => {
                                const isSelected = selectedAuthorId === member.id;
                                return (
                                    <button
                                        key={member.id}
                                        onClick={() => handleSelectAuthor(member)}
                                        className={`
                                            w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left
                                            ${isSelected
                                                ? 'bg-amber-500/10 border-amber-500/30'
                                                : 'bg-white/5 border-white/10 hover:border-white/20'
                                            }
                                        `}
                                    >
                                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-800">
                                            {member.avatar_url ? (
                                                <img
                                                    src={member.avatar_url}
                                                    alt={member.full_name || ''}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-white">
                                                    {member.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-white truncate">{member.full_name || 'Unnamed'}</h4>
                                                {member.role === 'org_admin' && (
                                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex-shrink-0">
                                                        <Shield size={10} /> Admin
                                                    </span>
                                                )}
                                            </div>
                                            {member.expert_title && (
                                                <p className="text-xs text-slate-400 truncate">{member.expert_title}</p>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <CheckCircle size={18} className="text-amber-400 flex-shrink-0" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                                <User size={24} className="mx-auto mb-2 opacity-30" />
                                <p className="text-sm">
                                    {searchQuery ? 'No members match your search' : 'No organization members found'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DropdownPanel>
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
                router.push('/org-courses');
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
        <div className="flex flex-col h-full">
            {/* Glassy Header - Canvas Style */}
            <div className="h-24 flex-shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex items-center justify-between px-10">
                <div className="flex items-center gap-6">
                    {/* Back Button */}
                    <Link
                        href="/org-courses"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>

                    <div className="w-px h-10 bg-white/10" />

                    {/* Title Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                                Organization Course
                            </span>
                            {/* Status Badge - Clickable to toggle */}
                            <button
                                onClick={handleToggleStatus}
                                disabled={isTogglingStatus}
                                className={`
                                    px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer
                                    hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                    ${isPublished
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30'
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
                        <h1 className="text-2xl font-light text-white tracking-tight truncate max-w-lg">
                            {initialCourse.title}
                        </h1>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Delete Course Button */}
                    <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition-all"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>

                    {/* Bulk Upload Button */}
                    <button
                        onClick={() => handleOpenPanel('bulk_upload')}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <Upload size={14} />
                        Bulk Upload
                    </button>

                    {/* Preview Link */}
                    <Link
                        href={`/?courseId=${initialCourse.id}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <Eye size={14} />
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

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
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

            <OrgAuthorAssignmentPanel
                isOpen={activePanel === 'expert'}
                onClose={handleClosePanel}
                courseId={initialCourse.id}
                currentAuthorId={initialCourse.authorDetails?.id}
                currentAuthorName={initialCourse.authorDetails?.name || initialCourse.author}
                orgId={orgId}
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
