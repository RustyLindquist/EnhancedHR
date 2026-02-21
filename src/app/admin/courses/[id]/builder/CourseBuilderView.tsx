'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { BookOpen, Plus, Edit3, ChevronDown, Video, HelpCircle, FileText, Layers, GripVertical, Paperclip } from 'lucide-react';
import { Course, Module, Resource, Lesson } from '@/types';
import { ExpertCredential } from '@/app/actions/credentials';
import CourseDescriptionSectionAdmin from './CourseDescriptionSectionAdmin';
import { useAdminCourse } from '@/components/admin/AdminCoursePageWrapper';
import { reorderLessons, moveLessonToModule } from '@/app/actions/course-builder';

// Drag and drop imports
import {
    DndContext,
    closestCenter,
    pointerWithin,
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
    syllabus: initialSyllabus,
    resources,
    authorCredentials
}: CourseBuilderViewProps) {
    const { openPanel } = useAdminCourse();

    // Local syllabus state for optimistic updates during drag
    const [syllabus, setSyllabus] = useState(initialSyllabus);

    // Sync syllabus with props when they change (e.g., after refresh)
    React.useEffect(() => {
        setSyllabus(initialSyllabus);
    }, [initialSyllabus]);

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

    // Find resource info for drag overlay
    const activeDragResource = useMemo(() => {
        if (!activeDragId || !activeDragId.startsWith('resource-')) return null;
        const resourceId = activeDragId.replace('resource-', '');
        return resources.find(r => r.id === resourceId) || null;
    }, [activeDragId, resources]);

    // Handle drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        setActiveDragId(active.id as string);
        const activeId = active.id as string;
        // Find which module contains this lesson or resource
        for (const module of syllabus) {
            if (module.lessons?.some((l: Lesson) => l.id === activeId)) {
                setActiveDragModuleId(module.id);
                break;
            }
        }
        // Also check resources
        if (activeId.startsWith('resource-')) {
            const resourceId = activeId.replace('resource-', '');
            const resource = resources.find(r => r.id === resourceId);
            if (resource?.module_id) {
                setActiveDragModuleId(resource.module_id);
            }
        }
    }, [syllabus, resources]);

    // Handle drag end
    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveDragId(null);
        setActiveDragModuleId(null);

        if (!over || active.id === over.id) return;

        // Handle resource reordering within module
        const activeId = active.id as string;
        if (activeId.startsWith('resource-')) {
            // Resource was dragged - just do visual reorder within the merged items
            // Resources don't persist reorder separately, they use the order field
            // For now, silently succeed - the visual reorder is handled by SortableContext
            return;
        }

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
            const result = await moveLessonToModule(
                active.id as string,
                targetModuleId,
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
                const result = await reorderLessons(lessonIds);

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
            const result = await moveLessonToModule(
                active.id as string,
                targetModuleId,
                targetIndex
            );

            if (!result.success) {
                // Revert on error
                console.error('Failed to move lesson:', result.error);
                setSyllabus(initialSyllabus);
            }
        }
    }, [syllabus, initialSyllabus]);

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

                    {/* Module List with Drag and Drop */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={customCollisionDetection}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
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
                                    onEditResource={(resourceId) => openPanel('lesson', module.id, undefined, resourceId)}
                                    onAddLesson={() => openPanel('lesson', module.id)}
                                    moduleResources={resources.filter(r => r.module_id === module.id)}
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

                        {/* Drag Overlay - Shows while dragging */}
                        <DragOverlay>
                            {activeDragLesson && (
                                <LessonDragOverlay
                                    lesson={activeDragLesson.lesson}
                                    lessonNumber={`${activeDragLesson.moduleIndex + 1}.${activeDragLesson.lessonIndex + 1}`}
                                />
                            )}
                            {activeDragResource && (
                                <ResourceDragOverlayAdmin resource={activeDragResource} />
                            )}
                        </DragOverlay>
                    </DndContext>
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

                        {/* Resources Preview (course-level only) */}
                        {(() => {
                            const courseLevelResources = resources.filter(r => !r.module_id);
                            return (
                        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
                            {courseLevelResources.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {courseLevelResources.map((resource) => (
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
                            );
                        })()}

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
// Droppable Module Zone - allows dropping lessons into modules (especially empty ones)
// ============================================

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
                {isOver ? 'Drop here' : 'Add Item'}
            </span>
        </button>
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
    onEditResource: (resourceId: string) => void;
    onAddLesson: () => void;
    moduleResources?: Resource[];
}

function ModuleContainerAdmin({
    module,
    moduleIndex,
    isExpanded,
    onToggle,
    onEditModule,
    onEditLesson,
    onEditResource,
    onAddLesson,
    moduleResources = []
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
                    <DroppableModuleZone moduleId={module.id} isExpanded={isExpanded} isEmpty={!module.lessons || (module.lessons.length === 0 && moduleResources.length === 0)}>
                        <div className="px-5 pt-3 pb-5">
                            {/* Merged Lessons + Resources Grid with Drag and Drop */}
                            <SortableContext
                                items={[
                                    ...(module.lessons?.map((l: Lesson) => l.id) || []),
                                    ...moduleResources.map(r => `resource-${r.id}`)
                                ]}
                                strategy={rectSortingStrategy}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {/* Merge lessons and resources by order, then render */}
                                    {(() => {
                                        const items: Array<{ type: 'lesson'; data: Lesson; order: number } | { type: 'resource'; data: Resource; order: number }> = [
                                            ...module.lessons.map((l, i) => ({ type: 'lesson' as const, data: l, order: l.order ?? i })),
                                            ...moduleResources.map((r, i) => ({ type: 'resource' as const, data: r, order: r.order ?? (1000 + i) }))
                                        ];
                                        items.sort((a, b) => a.order - b.order);

                                        let lessonCounter = 0;
                                        return items.map((item) => {
                                            if (item.type === 'lesson') {
                                                lessonCounter++;
                                                return (
                                                    <SortableLessonCardAdmin
                                                        key={item.data.id}
                                                        lesson={item.data}
                                                        lessonNumber={`${moduleIndex + 1}.${lessonCounter}`}
                                                        onEdit={() => onEditLesson(item.data.id)}
                                                    />
                                                );
                                            } else {
                                                return (
                                                    <ModuleResourceCardAdmin
                                                        key={`resource-${item.data.id}`}
                                                        resource={item.data}
                                                        onEdit={() => onEditResource(item.data.id)}
                                                    />
                                                );
                                            }
                                        });
                                    })()}

                                    {/* Add Item Button - also acts as drop target */}
                                    <DroppableAddLessonButton
                                        moduleId={module.id}
                                        onClick={onAddLesson}
                                    />
                                </div>
                            </SortableContext>
                        </div>
                    </DroppableModuleZone>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Sortable Admin Lesson Card (with drag handle)
// ============================================

interface SortableLessonCardAdminProps {
    lesson: Lesson;
    lessonNumber: string;
    onEdit: () => void;
}

function SortableLessonCardAdmin({ lesson, lessonNumber, onEdit }: SortableLessonCardAdminProps) {
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

    const typeIcon = isQuiz ? (
        <HelpCircle size={12} className="text-brand-orange" />
    ) : isArticle ? (
        <FileText size={12} className="text-purple-400" />
    ) : (
        <Video size={12} className="text-brand-blue-light" />
    );

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
            <div className="px-4 py-4" onClick={onEdit}>
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

// ============================================
// Module Resource Card (Admin)
// ============================================

function ModuleResourceCardAdmin({ resource, onEdit }: { resource: Resource; onEdit: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `resource-${resource.id}` });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative rounded-xl cursor-pointer transition-all duration-300 bg-white/[0.03] border border-red-500/20 hover:bg-red-500/5 hover:border-red-500/30 overflow-hidden ${isDragging ? 'shadow-2xl ring-2 ring-red-500/50' : ''}`}
        >
            {/* Drag Handle Bar - Full Width at Top */}
            <div
                {...attributes}
                {...listeners}
                className="w-full px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border-b border-red-500/20 cursor-grab active:cursor-grabbing flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={12} className="text-red-400" />
                <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                    Drag to Reorder
                </span>
                <GripVertical size={12} className="text-red-400" />
            </div>

            {/* Card Content - clickable area */}
            <div className="px-4 py-4" onClick={onEdit}>
                {/* Top Row */}
                <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-red-700/20 text-red-400 text-[9px] font-bold uppercase rounded border border-red-700/30">
                        RESOURCE
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                        {resource.size || ''}
                    </span>
                </div>

                {/* Resource Title */}
                <h4 className="text-sm font-semibold leading-tight text-slate-200 group-hover:text-white transition-colors">
                    {resource.title || 'Untitled Resource'}
                </h4>

                {/* File Type Indicator */}
                <div className="mt-2 flex items-center gap-1.5">
                    <Paperclip size={12} className="text-red-400" />
                    <span className="text-[10px] text-slate-500">
                        {resource.type} file
                    </span>
                </div>
            </div>

            {/* Hover Edit Overlay - hidden when dragging */}
            {!isDragging && (
                <div className="absolute inset-0 bg-red-500/5 border-2 border-red-500/30 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center pointer-events-none z-10">
                    <div className="p-2 rounded-full bg-black/70 border border-red-500/50 shadow-lg">
                        <Edit3 size={14} className="text-red-400" />
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Drag Overlay Component - shows during drag
// ============================================

function LessonDragOverlay({ lesson, lessonNumber }: { lesson: Lesson; lessonNumber: string }) {
    const isQuiz = lesson.type === 'quiz';
    const isArticle = lesson.type === 'article';

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

// Drag Overlay for Resources - shows during drag
function ResourceDragOverlayAdmin({ resource }: { resource: Resource }) {
    return (
        <div className="rounded-xl bg-slate-800 border-2 border-red-500 shadow-2xl w-64">
            <div className="px-4 py-[26px]">
                <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-red-700/20 text-red-400 text-[9px] font-bold uppercase rounded border border-red-700/30">
                        RESOURCE
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">
                        {resource.size || ''}
                    </span>
                </div>
                <h4 className="text-sm font-semibold leading-tight text-white">
                    {resource.title || 'Untitled Resource'}
                </h4>
            </div>
        </div>
    );
}

// ============================================
// Admin Lesson Card (non-sortable, kept for reference)
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
