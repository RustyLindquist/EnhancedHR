'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, Send, AlertTriangle, Plus, Edit3, ChevronDown, Video, HelpCircle, FileText, Star, BookOpen, Layers, X, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { Course, Module, Resource, Lesson } from '@/types';
import ExpertCoursePageWrapper, { ExpertCoursePanelType } from './ExpertCoursePageWrapper';
import ExpertCourseDescriptionPanel from './ExpertCourseDescriptionPanel';
import { submitCourseForReview, reorderExpertLessons, moveExpertLessonToModule } from '@/app/actions/expert-course-builder';

// Drag and drop imports
import {
    DndContext,
    closestCenter,
    pointerWithin,
    rectIntersection,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useDroppable,
    CollisionDetection,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Custom collision detection that prioritizes module drop zones and add-lesson buttons
const customCollisionDetection: CollisionDetection = (args) => {
    // First check if we're over any droppable zones (module zones or add-lesson buttons)
    const pointerCollisions = pointerWithin(args);

    // Check for add-lesson button first (more specific target)
    const addLessonButton = pointerCollisions.find(c =>
        typeof c.id === 'string' && c.id.startsWith('add-lesson-drop-')
    );
    if (addLessonButton) {
        return [addLessonButton];
    }

    // Then check for module drop zones
    const moduleDropZone = pointerCollisions.find(c =>
        typeof c.id === 'string' && c.id.startsWith('module-drop-')
    );

    // If we're directly over a module drop zone, prioritize it
    if (moduleDropZone) {
        // But also check if there's a lesson underneath - if so, prefer the lesson
        const lessonCollisions = closestCenter(args);
        const lessonCollision = lessonCollisions.find(c =>
            typeof c.id === 'string' && !c.id.startsWith('module-drop-') && !c.id.startsWith('add-lesson-drop-')
        );

        // If there's a lesson collision, prefer it; otherwise use the module zone
        if (lessonCollision) {
            return [lessonCollision];
        }
        return [moduleDropZone];
    }

    // Fall back to closest center for lesson-to-lesson
    return closestCenter(args);
};

// Import reusable admin panels (these work with any action as long as we pass the right props)
import {
    CourseImageEditorPanel,
    SkillsEditorPanel,
    ResourcesEditorPanel
} from '@/components/admin/course-panels';

// Expert-specific module and lesson panels
import ExpertModuleEditorPanel from './ExpertModuleEditorPanel';
import ExpertLessonEditorPanel from './ExpertLessonEditorPanel';

// Sortable Lesson Card Component
interface SortableLessonCardProps {
    lesson: Lesson;
    moduleIndex: number;
    lessonIndex: number;
    moduleId: string;
    onOpenPanel: (panel: ExpertCoursePanelType, moduleId?: string, lessonId?: string) => void;
}

function SortableLessonCard({ lesson, moduleIndex, lessonIndex, moduleId, onOpenPanel }: SortableLessonCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lesson.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    const isQuiz = lesson.type === 'quiz';
    const isArticle = lesson.type === 'article';
    const lessonNumber = `${moduleIndex + 1}.${lessonIndex + 1}`;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-xl cursor-pointer transition-all duration-300 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 overflow-hidden ${isDragging ? 'shadow-2xl ring-2 ring-brand-blue-light/50' : ''}`}
        >
            {/* Drag Handle Bar - Full Width at Top */}
            <div
                {...attributes}
                {...listeners}
                className="w-full px-3 py-1.5 bg-brand-blue-light/10 hover:bg-brand-blue-light/20 border-b border-brand-blue-light/20 cursor-grab active:cursor-grabbing flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={12} className="text-brand-blue-light" />
                <span className="text-[10px] font-medium text-brand-blue-light uppercase tracking-wider">
                    Drag to Reorder
                </span>
                <GripVertical size={12} className="text-brand-blue-light" />
            </div>

            {/* Card Content - clickable area */}
            <div
                className="px-4 py-4"
                onClick={() => onOpenPanel('lesson', moduleId, lesson.id)}
            >
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

            {/* Hover Edit Overlay - hidden when dragging */}
            {!isDragging && (
                <div className="absolute inset-0 bg-brand-blue-light/5 border-2 border-brand-blue-light/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center pointer-events-none z-10">
                    <div className="p-2 rounded-full bg-black/70 border border-brand-blue-light/50 shadow-lg">
                        <Edit3 size={14} className="text-brand-blue-light" />
                    </div>
                </div>
            )}
        </div>
    );
}

// Drag Overlay Component - shows during drag
function LessonDragOverlay({ lesson, moduleIndex, lessonIndex }: { lesson: Lesson; moduleIndex: number; lessonIndex: number }) {
    const isQuiz = lesson.type === 'quiz';
    const isArticle = lesson.type === 'article';
    const lessonNumber = `${moduleIndex + 1}.${lessonIndex + 1}`;

    return (
        <div className="rounded-xl bg-slate-800 border-2 border-brand-blue-light shadow-2xl w-64">
            <div className="px-4 py-[26px]">
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
                <h4 className="text-sm font-semibold leading-tight text-white">
                    {lesson.title || 'Untitled Lesson'}
                </h4>
            </div>
        </div>
    );
}

// Droppable Module Zone - allows dropping lessons into modules (especially empty ones)
interface DroppableModuleZoneProps {
    moduleId: string;
    children: React.ReactNode;
    isExpanded: boolean;
    isEmpty: boolean;
}

function DroppableModuleZone({ moduleId, children, isExpanded, isEmpty }: DroppableModuleZoneProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `module-drop-${moduleId}`,
        data: {
            type: 'module',
            moduleId: moduleId,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                relative transition-all duration-200
                ${isEmpty ? 'min-h-[140px]' : ''}
                ${isOver && isExpanded ? 'ring-2 ring-brand-blue-light/50 ring-inset rounded-xl bg-brand-blue-light/5' : ''}
            `}
        >
            {children}
            {/* Empty state drop indicator */}
            {isEmpty && isOver && isExpanded && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-brand-blue-light text-sm font-medium">
                        Drop lesson here
                    </div>
                </div>
            )}
        </div>
    );
}

// Droppable Add Lesson Button - acts as drop target when dragging lessons
interface DroppableAddLessonButtonProps {
    moduleId: string;
    onClick: () => void;
}

function DroppableAddLessonButton({ moduleId, onClick }: DroppableAddLessonButtonProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `add-lesson-drop-${moduleId}`,
        data: {
            type: 'add-lesson-button',
            moduleId: moduleId,
        },
    });

    return (
        <button
            ref={setNodeRef}
            onClick={onClick}
            className={`
                rounded-xl border-2 border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all group min-h-[120px]
                ${isOver
                    ? 'border-brand-blue-light bg-brand-blue-light/10 text-brand-blue-light'
                    : 'border-white/10 hover:border-brand-blue-light/30 text-slate-500 hover:text-brand-blue-light'
                }
            `}
        >
            <div className={`p-2 rounded-lg transition-colors ${isOver ? 'bg-brand-blue-light/20' : 'bg-white/5 group-hover:bg-brand-blue-light/10'}`}>
                <Plus size={16} />
            </div>
            <span className="text-xs font-medium">
                {isOver ? 'Drop here' : 'Add Lesson'}
            </span>
        </button>
    );
}

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

    // Local syllabus state for optimistic updates during drag
    const [syllabus, setSyllabus] = useState(initialSyllabus);

    // Sync syllabus with props when they change (e.g., after refresh)
    React.useEffect(() => {
        setSyllabus(initialSyllabus);
    }, [initialSyllabus]);

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

    // Drag and drop state
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const [activeDragModuleId, setActiveDragModuleId] = useState<string | null>(null);

    // Configure drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement to start drag (prevents accidental drags)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Find lesson and module info for drag overlay
    const activeDragLesson = useMemo(() => {
        if (!activeDragId || !activeDragModuleId) return null;
        const module = syllabus.find(m => m.id === activeDragModuleId);
        if (!module) return null;
        const lessonIndex = module.lessons?.findIndex((l: Lesson) => l.id === activeDragId) ?? -1;
        const lesson = module.lessons?.[lessonIndex];
        if (!lesson) return null;
        const moduleIndex = syllabus.findIndex(m => m.id === activeDragModuleId);
        return { lesson, moduleIndex, lessonIndex };
    }, [activeDragId, activeDragModuleId, syllabus]);

    // Handle drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);
        // Find which module contains this lesson
        for (const module of syllabus) {
            if (module.lessons?.some((l: Lesson) => l.id === active.id)) {
                setActiveDragModuleId(module.id);
                break;
            }
        }
    }, [syllabus]);

    // Handle drag end
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveDragId(null);
        setActiveDragModuleId(null);

        if (!over || active.id === over.id) return;

        // Find which module contains the dragged lesson
        let sourceModuleId: string | null = null;
        let sourceModule: Module | null = null;

        for (const module of syllabus) {
            if (module.lessons?.some((l: Lesson) => l.id === active.id)) {
                sourceModuleId = module.id;
                sourceModule = module;
                break;
            }
        }

        if (!sourceModuleId || !sourceModule || !sourceModule.lessons) return;

        // Check if dropped on a module zone or add-lesson button (for empty modules or end of module)
        const overId = over.id as string;
        if (overId.startsWith('module-drop-') || overId.startsWith('add-lesson-drop-')) {
            const targetModuleId = overId.replace('module-drop-', '').replace('add-lesson-drop-', '');
            const targetModule = syllabus.find(m => m.id === targetModuleId);

            if (!targetModule) return;

            // Don't do anything if dropped on the same module it came from
            if (targetModuleId === sourceModuleId) return;

            const draggedLesson = sourceModule.lessons.find((l: Lesson) => l.id === active.id);
            if (!draggedLesson) return;

            // Add to end of target module
            const newSourceLessons = sourceModule.lessons.filter((l: Lesson) => l.id !== active.id);
            const newTargetLessons = [...(targetModule.lessons || []), draggedLesson];

            const newSyllabus = syllabus.map(m => {
                if (m.id === sourceModuleId) {
                    return { ...m, lessons: newSourceLessons };
                }
                if (m.id === targetModuleId) {
                    return { ...m, lessons: newTargetLessons };
                }
                return m;
            });
            setSyllabus(newSyllabus);

            // Persist to database (add to end)
            const result = await moveExpertLessonToModule(
                active.id as string,
                targetModuleId,
                initialCourse.id,
                newTargetLessons.length - 1
            );

            if (!result.success) {
                console.error('Failed to move lesson:', result.error);
                setSyllabus(initialSyllabus);
            }
            return;
        }

        // Find which module contains the target lesson
        let targetModuleId: string | null = null;
        let targetModule: Module | null = null;

        for (const module of syllabus) {
            if (module.lessons?.some((l: Lesson) => l.id === over.id)) {
                targetModuleId = module.id;
                targetModule = module;
                break;
            }
        }

        if (!targetModuleId || !targetModule || !targetModule.lessons) return;

        // Check if moving within the same module or across modules
        if (sourceModuleId === targetModuleId) {
            // Reorder within the same module
            const oldIndex = sourceModule.lessons.findIndex((l: Lesson) => l.id === active.id);
            const newIndex = sourceModule.lessons.findIndex((l: Lesson) => l.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // Optimistic update
                const newLessons = arrayMove(sourceModule.lessons, oldIndex, newIndex);
                const newSyllabus = syllabus.map(m =>
                    m.id === sourceModuleId
                        ? { ...m, lessons: newLessons }
                        : m
                );
                setSyllabus(newSyllabus);

                // Persist to database
                const lessonIds = newLessons.map((l: Lesson) => l.id);
                const result = await reorderExpertLessons(lessonIds, initialCourse.id);

                if (!result.success) {
                    // Revert on error
                    console.error('Failed to reorder lessons:', result.error);
                    setSyllabus(initialSyllabus);
                }
            }
        } else {
            // Move lesson to a different module
            const draggedLesson = sourceModule.lessons.find((l: Lesson) => l.id === active.id);
            if (!draggedLesson) return;

            // Find the target position in the target module
            const targetIndex = targetModule.lessons.findIndex((l: Lesson) => l.id === over.id);

            // Optimistic update: remove from source, add to target
            const newSourceLessons = sourceModule.lessons.filter((l: Lesson) => l.id !== active.id);
            const newTargetLessons = [...targetModule.lessons];
            newTargetLessons.splice(targetIndex, 0, draggedLesson);

            const newSyllabus = syllabus.map(m => {
                if (m.id === sourceModuleId) {
                    return { ...m, lessons: newSourceLessons };
                }
                if (m.id === targetModuleId) {
                    return { ...m, lessons: newTargetLessons };
                }
                return m;
            });
            setSyllabus(newSyllabus);

            // Persist to database
            const result = await moveExpertLessonToModule(
                active.id as string,
                targetModuleId,
                initialCourse.id,
                targetIndex
            );

            if (!result.success) {
                // Revert on error
                console.error('Failed to move lesson:', result.error);
                setSyllabus(initialSyllabus);
            }
        }
    }, [syllabus, initialCourse.id, initialSyllabus]);

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
                        href={`/dashboard?courseId=${initialCourse.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
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

                            {/* Category Badges */}
                            <div className="absolute top-4 right-4 px-4 py-2.5 rounded-xl bg-black/70 backdrop-blur-sm border border-white/10 flex flex-wrap gap-1.5 max-w-[200px]">
                                {(initialCourse.categories || [initialCourse.category || 'General']).map((cat, idx) => (
                                    <span key={idx} className="px-2.5 py-1 rounded-full bg-white/10 text-brand-orange text-[10px] font-bold uppercase tracking-wider">
                                        {cat}
                                    </span>
                                ))}
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
                        <DndContext
                            sensors={sensors}
                            collisionDetection={customCollisionDetection}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                        <div className="space-y-4">
                            {syllabus.map((module, index) => (
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
                                            <DroppableModuleZone moduleId={module.id} isExpanded={expandedModules.includes(module.id)} isEmpty={!module.lessons || module.lessons.length === 0}>
                                                <div className="px-5 pt-3 pb-5">
                                                    {/* Lessons Card Grid with Drag and Drop */}
                                                    <SortableContext
                                                        items={module.lessons?.map((l: Lesson) => l.id) || []}
                                                        strategy={rectSortingStrategy}
                                                    >
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {module.lessons?.map((lesson: Lesson, lessonIndex: number) => (
                                                                <SortableLessonCard
                                                                    key={lesson.id}
                                                                    lesson={lesson}
                                                                    moduleIndex={index}
                                                                    lessonIndex={lessonIndex}
                                                                    moduleId={module.id}
                                                                    onOpenPanel={handleOpenPanel}
                                                                />
                                                            ))}

                                                            {/* Add Lesson Button - also acts as drop target */}
                                                            <DroppableAddLessonButton
                                                                moduleId={module.id}
                                                                onClick={() => handleOpenPanel('lesson', module.id)}
                                                            />
                                                        </div>
                                                    </SortableContext>
                                                </div>
                                            </DroppableModuleZone>
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

                        {/* Drag Overlay - Shows while dragging */}
                        <DragOverlay>
                            {activeDragLesson && (
                                <LessonDragOverlay
                                    lesson={activeDragLesson.lesson}
                                    moduleIndex={activeDragLesson.moduleIndex}
                                    lessonIndex={activeDragLesson.lessonIndex}
                                />
                            )}
                        </DragOverlay>
                        </DndContext>
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
                currentCategories={initialCourse.categories || [initialCourse.category || 'General']}
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
