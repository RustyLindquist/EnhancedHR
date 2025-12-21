'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import { Course, Module, Resource, DragItem, Lesson } from '../../types';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import CourseHeader from './CourseHeader';
import CourseDescriptionSection from './CourseDescriptionSection';
import LessonPlayerSection from './LessonPlayerSection';
import ModuleContainer from './ModuleContainer';
import CourseResourcesSection from './CourseResourcesSection';

interface CoursePageV2Props {
    course: Course;
    syllabus: Module[];
    resources: Resource[];
    onBack: () => void;
    onDragStart: (item: DragItem) => void;
    onAddToCollection: (item: DragItem) => void;
    onAskPrometheus: (prompt: string) => void;
    onViewExpert?: (expertId: string) => void;
    userId: string;
    initialLessonId?: string;
    initialModuleId?: string;
}

type ViewMode = 'description' | 'player';

const CoursePageV2: React.FC<CoursePageV2Props> = ({
    course,
    syllabus,
    resources,
    onBack,
    onDragStart,
    onAddToCollection,
    onAskPrometheus,
    onViewExpert,
    userId,
    initialLessonId,
    initialModuleId
}) => {
    // View mode state
    const [viewMode, setViewMode] = useState<ViewMode>('description');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionDirection, setTransitionDirection] = useState<'enter' | 'exit'>('enter');

    // Active content state
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

    // UI state
    const [expandedModules, setExpandedModules] = useState<string[]>(() => {
        // Default: first module expanded
        return syllabus.length > 0 ? [syllabus[0].id] : [];
    });

    // Progress state
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(() => {
        const completed = new Set<string>();
        syllabus.forEach(module => {
            module.lessons.forEach(lesson => {
                if (lesson.isCompleted) {
                    completed.add(lesson.id);
                }
            });
        });
        return completed;
    });

    // Progress tracking hook
    const { markLessonComplete, updateProgress, updateLastAccessed } = useCourseProgress(userId, course.id);

    // Calculate course stats
    const courseStats = useMemo(() => {
        const totalLessons = syllabus.reduce((acc, m) => acc + m.lessons.length, 0);
        const completedCount = completedLessons.size;
        const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

        // Parse duration string (e.g., "2h 30m" -> minutes)
        const durationMatch = course.duration.match(/(\d+)h?\s*(\d+)?m?/);
        let totalMinutes = 0;
        if (durationMatch) {
            const hours = parseInt(durationMatch[1]) || 0;
            const mins = parseInt(durationMatch[2]) || 0;
            totalMinutes = hours * 60 + mins;
        }

        const remainingMinutes = Math.round(totalMinutes * (1 - progressPercent / 100));

        return {
            totalDuration: course.duration,
            progressPercent,
            remainingMinutes,
            totalLessons,
            completedCount
        };
    }, [course.duration, syllabus, completedLessons]);

    // Get current lesson and module
    const currentLesson = useMemo(() => {
        if (!activeLessonId) return null;
        for (const module of syllabus) {
            const lesson = module.lessons.find(l => l.id === activeLessonId);
            if (lesson) return lesson;
        }
        return null;
    }, [activeLessonId, syllabus]);

    const currentModule = useMemo(() => {
        if (!activeModuleId) return null;
        return syllabus.find(m => m.id === activeModuleId) || null;
    }, [activeModuleId, syllabus]);

    // Find lesson index within module
    const getLessonIndex = useCallback((lessonId: string): { moduleIndex: number; lessonIndex: number } | null => {
        for (let moduleIndex = 0; moduleIndex < syllabus.length; moduleIndex++) {
            const lessonIndex = syllabus[moduleIndex].lessons.findIndex(l => l.id === lessonId);
            if (lessonIndex !== -1) {
                return { moduleIndex, lessonIndex };
            }
        }
        return null;
    }, [syllabus]);

    // Get lesson number string (e.g., "1.2")
    const getLessonNumber = useCallback((lessonId: string): string => {
        const indices = getLessonIndex(lessonId);
        if (!indices) return '';
        return `${indices.moduleIndex + 1}.${indices.lessonIndex + 1}`;
    }, [getLessonIndex]);

    // Navigation functions
    const goToNextLesson = useCallback(() => {
        if (!activeLessonId) return;

        const indices = getLessonIndex(activeLessonId);
        if (!indices) return;

        const currentModule = syllabus[indices.moduleIndex];

        // Try next lesson in same module
        if (indices.lessonIndex < currentModule.lessons.length - 1) {
            const nextLesson = currentModule.lessons[indices.lessonIndex + 1];
            setActiveLessonId(nextLesson.id);
            return;
        }

        // Try first lesson of next module
        if (indices.moduleIndex < syllabus.length - 1) {
            const nextModule = syllabus[indices.moduleIndex + 1];
            if (nextModule.lessons.length > 0) {
                setActiveModuleId(nextModule.id);
                setActiveLessonId(nextModule.lessons[0].id);
                // Expand next module
                setExpandedModules(prev =>
                    prev.includes(nextModule.id) ? prev : [...prev, nextModule.id]
                );
            }
        }
    }, [activeLessonId, getLessonIndex, syllabus]);

    const goToPreviousLesson = useCallback(() => {
        if (!activeLessonId) return;

        const indices = getLessonIndex(activeLessonId);
        if (!indices) return;

        // Try previous lesson in same module
        if (indices.lessonIndex > 0) {
            const prevLesson = syllabus[indices.moduleIndex].lessons[indices.lessonIndex - 1];
            setActiveLessonId(prevLesson.id);
            return;
        }

        // Try last lesson of previous module
        if (indices.moduleIndex > 0) {
            const prevModule = syllabus[indices.moduleIndex - 1];
            if (prevModule.lessons.length > 0) {
                setActiveModuleId(prevModule.id);
                setActiveLessonId(prevModule.lessons[prevModule.lessons.length - 1].id);
                // Expand previous module
                setExpandedModules(prev =>
                    prev.includes(prevModule.id) ? prev : [...prev, prevModule.id]
                );
            }
        }
    }, [activeLessonId, getLessonIndex, syllabus]);

    // Check if there's a next/previous lesson
    const hasNextLesson = useMemo(() => {
        if (!activeLessonId) return false;
        const indices = getLessonIndex(activeLessonId);
        if (!indices) return false;

        const currentMod = syllabus[indices.moduleIndex];
        if (indices.lessonIndex < currentMod.lessons.length - 1) return true;
        if (indices.moduleIndex < syllabus.length - 1) {
            return syllabus[indices.moduleIndex + 1].lessons.length > 0;
        }
        return false;
    }, [activeLessonId, getLessonIndex, syllabus]);

    const hasPreviousLesson = useMemo(() => {
        if (!activeLessonId) return false;
        const indices = getLessonIndex(activeLessonId);
        if (!indices) return false;

        if (indices.lessonIndex > 0) return true;
        if (indices.moduleIndex > 0) {
            return syllabus[indices.moduleIndex - 1].lessons.length > 0;
        }
        return false;
    }, [activeLessonId, getLessonIndex, syllabus]);

    // View mode transition handlers
    const transitionToPlayer = useCallback((lessonId?: string, moduleId?: string) => {
        setIsTransitioning(true);
        setTransitionDirection('exit');

        // Determine which lesson to start
        let targetLessonId = lessonId;
        let targetModuleId = moduleId;

        if (!targetLessonId) {
            // Find first incomplete lesson, or first lesson
            for (const module of syllabus) {
                for (const lesson of module.lessons) {
                    if (!completedLessons.has(lesson.id)) {
                        targetLessonId = lesson.id;
                        targetModuleId = module.id;
                        break;
                    }
                }
                if (targetLessonId) break;
            }

            // If all complete, start from first
            if (!targetLessonId && syllabus.length > 0 && syllabus[0].lessons.length > 0) {
                targetLessonId = syllabus[0].lessons[0].id;
                targetModuleId = syllabus[0].id;
            }
        }

        setTimeout(() => {
            setViewMode('player');
            setActiveLessonId(targetLessonId || null);
            setActiveModuleId(targetModuleId || null);
            setTransitionDirection('enter');

            // Expand the module containing the active lesson
            if (targetModuleId && !expandedModules.includes(targetModuleId)) {
                setExpandedModules(prev => [...prev, targetModuleId!]);
            }

            setTimeout(() => {
                setIsTransitioning(false);
            }, 400);
        }, 400);
    }, [syllabus, completedLessons, expandedModules]);

    const transitionToDescription = useCallback(() => {
        setIsTransitioning(true);
        setTransitionDirection('exit');

        setTimeout(() => {
            setViewMode('description');
            setTransitionDirection('enter');

            setTimeout(() => {
                setIsTransitioning(false);
            }, 400);
        }, 400);
    }, []);

    // Handle lesson click
    const handleLessonClick = useCallback((lesson: Lesson, moduleId: string) => {
        if (viewMode === 'description') {
            transitionToPlayer(lesson.id, moduleId);
        } else {
            // Already in player mode, just switch lesson
            setActiveLessonId(lesson.id);
            setActiveModuleId(moduleId);

            // Ensure module is expanded
            if (!expandedModules.includes(moduleId)) {
                setExpandedModules(prev => [...prev, moduleId]);
            }
        }
    }, [viewMode, transitionToPlayer, expandedModules]);

    // Handle module toggle
    const handleModuleToggle = useCallback((moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId]
        );
    }, []);

    // Handle lesson completion
    const handleLessonComplete = useCallback((lessonId: string) => {
        markLessonComplete(lessonId);
        setCompletedLessons(prev => new Set([...prev, lessonId]));
    }, [markLessonComplete]);

    // Handle back button
    const handleBack = useCallback(() => {
        if (viewMode === 'player') {
            transitionToDescription();
        } else {
            onBack();
        }
    }, [viewMode, transitionToDescription, onBack]);

    // Initialize with initial lesson/module if provided
    useEffect(() => {
        if (initialLessonId) {
            transitionToPlayer(initialLessonId, initialModuleId);
        }
    }, []);

    // Compute transition classes
    const getTransitionClass = () => {
        if (!isTransitioning) return 'course-view-enter';
        return transitionDirection === 'exit' ? 'course-view-exit' : 'course-view-enter';
    };

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {/* Header */}
            <CourseHeader
                course={course}
                viewMode={viewMode}
                currentModule={currentModule}
                currentLesson={currentLesson}
                stats={courseStats}
                onBack={handleBack}
                onResume={() => {
                    if (viewMode === 'description') {
                        transitionToPlayer();
                    }
                }}
            />

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 py-6">
                <div className={`${getTransitionClass()}`}>
                    {/* Course Description or Player */}
                    {viewMode === 'description' ? (
                        <CourseDescriptionSection
                            course={course}
                            onStartLearning={() => transitionToPlayer()}
                            onAskPrometheus={onAskPrometheus}
                            onViewExpert={onViewExpert}
                        />
                    ) : (
                        currentLesson && (
                            <LessonPlayerSection
                                lesson={currentLesson}
                                lessonNumber={getLessonNumber(currentLesson.id)}
                                course={course}
                                onLessonComplete={handleLessonComplete}
                                onNextLesson={goToNextLesson}
                                onPreviousLesson={goToPreviousLesson}
                                hasNext={hasNextLesson}
                                hasPrevious={hasPreviousLesson}
                                onAskPrometheus={onAskPrometheus}
                                onAddToCollection={onAddToCollection}
                                userId={userId}
                            />
                        )
                    )}
                </div>

                {/* Modules Section */}
                <div className="mt-8">
                    {/* Section Header - Centered */}
                    <div className="flex items-center justify-center gap-3 py-[25px]">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
                        <div className="flex items-center gap-2">
                            <BookOpen size={14} className="text-brand-blue-light" />
                            <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-400">
                                COURSE MODULES
                            </h2>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
                    </div>
                    <div className="space-y-4">
                        {syllabus.map((module, index) => (
                            <ModuleContainer
                                key={module.id}
                                module={module}
                                moduleIndex={index}
                                isExpanded={expandedModules.includes(module.id)}
                                isFirstModule={index === 0}
                                activeLessonId={activeLessonId}
                                completedLessons={completedLessons}
                                onToggle={() => handleModuleToggle(module.id)}
                                onLessonClick={(lesson) => handleLessonClick(lesson, module.id)}
                                onAskPrometheus={onAskPrometheus}
                                onAddToCollection={onAddToCollection}
                                onDragStart={onDragStart}
                                courseTitle={course.title}
                            />
                        ))}
                    </div>
                </div>

                {/* Resources Section */}
                {resources.length > 0 && (
                    <CourseResourcesSection
                        resources={resources}
                        courseTitle={course.title}
                        onAddToCollection={onAddToCollection}
                        onDragStart={onDragStart}
                    />
                )}
            </div>
        </div>
    );
};

export default CoursePageV2;
