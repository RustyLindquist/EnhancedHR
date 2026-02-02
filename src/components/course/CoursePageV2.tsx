'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BookOpen, LayoutGrid, List } from 'lucide-react';
import { Course, Module, Resource, DragItem, Lesson } from '../../types';
import { useCourseProgress } from '../../hooks/useCourseProgress';
import { useBackHandler } from '@/hooks/useBackHandler';
import { getAuthorCredentialsAction } from '@/app/actions/courses';
import { ExpertCredential } from '@/app/actions/credentials';
import CourseHeader from './CourseHeader';
import CourseDescriptionSection from './CourseDescriptionSection';
import LessonPlayerSection from './LessonPlayerSection';
import ModuleContainer from './ModuleContainer';
import CourseResourcesSection from './CourseResourcesSection';
import AssessmentPanel from '../assessment/AssessmentPanel';

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
    const [transitionPhase, setTransitionPhase] = useState<'stable' | 'exit' | 'enter'>('stable');
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left'); // left = forward, right = backward

    // Active content state
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

    // UI state
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    // Assessment panel state
    const [assessmentPanelOpen, setAssessmentPanelOpen] = useState(false);
    const [savedAssessmentProgress, setSavedAssessmentProgress] = useState<{
        lessonId: string;
        responses: Record<string, string>;
        currentIndex: number;
    } | null>(null);

    // Author credentials state
    const [authorCredentials, setAuthorCredentials] = useState<ExpertCredential[]>([]);

    // Lesson view mode state (grid vs list)
    const [lessonViewMode, setLessonViewMode] = useState<'grid' | 'list'>('grid');

    // Auto-play state - triggers video to auto-play when navigating to a lesson
    const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

    // Load lesson view preference from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem('enhancedhr-preferred-view-mode');
        if (savedViewMode === 'list' || savedViewMode === 'grid') {
            setLessonViewMode(savedViewMode);
        }
    }, []);

    // Handle lesson view mode change and persist to localStorage
    const handleLessonViewModeChange = (mode: 'grid' | 'list') => {
        localStorage.setItem('enhancedhr-preferred-view-mode', mode);
        setLessonViewMode(mode);
    };

    // Expand first module by default when syllabus loads
    useEffect(() => {
        if (syllabus.length > 0 && expandedModules.length === 0) {
            setExpandedModules([syllabus[0].id]);
        }
    }, [syllabus]);

    // Fetch author credentials when course has author details
    useEffect(() => {
        const authorId = course.authorDetails?.id;
        if (authorId) {
            getAuthorCredentialsAction(authorId).then(setAuthorCredentials);
        }
    }, [course.authorDetails?.id]);

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
        let totalMinutes = 0;
        if (course.duration) {
            const durationMatch = course.duration.match(/(\d+)h?\s*(\d+)?m?/);
            if (durationMatch) {
                const hours = parseInt(durationMatch[1]) || 0;
                const mins = parseInt(durationMatch[2]) || 0;
                totalMinutes = hours * 60 + mins;
            }
        }

        const remainingMinutes = Math.round(totalMinutes * (1 - progressPercent / 100));

        return {
            totalDuration: course.duration || '',
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

    // Navigation functions with slide transitions
    const goToNextLesson = useCallback(() => {
        if (!activeLessonId || isTransitioning) return;

        const indices = getLessonIndex(activeLessonId);
        if (!indices) return;

        const currentMod = syllabus[indices.moduleIndex];
        let nextLessonId: string | null = null;
        let nextModuleId: string | null = null;

        // Try next lesson in same module
        if (indices.lessonIndex < currentMod.lessons.length - 1) {
            nextLessonId = currentMod.lessons[indices.lessonIndex + 1].id;
            nextModuleId = currentMod.id;
        }
        // Try first lesson of next module
        else if (indices.moduleIndex < syllabus.length - 1) {
            const nextModule = syllabus[indices.moduleIndex + 1];
            if (nextModule.lessons.length > 0) {
                nextLessonId = nextModule.lessons[0].id;
                nextModuleId = nextModule.id;
            }
        }

        if (!nextLessonId) return;

        // Enable auto-play for the next lesson
        setShouldAutoPlay(true);

        // Animate transition: slide left (forward)
        setIsTransitioning(true);
        setSlideDirection('left');
        setTransitionPhase('exit');

        // Record that user accessed next lesson
        if (nextLessonId) {
            updateLastAccessed(nextLessonId);
        }

        setTimeout(() => {
            setActiveLessonId(nextLessonId);
            setActiveModuleId(nextModuleId);
            if (nextModuleId && !expandedModules.includes(nextModuleId)) {
                setExpandedModules(prev => [...prev, nextModuleId!]);
            }
            setTransitionPhase('enter');

            setTimeout(() => {
                setTransitionPhase('stable');
                setIsTransitioning(false);
            }, 350);
        }, 350);
    }, [activeLessonId, getLessonIndex, syllabus, isTransitioning, expandedModules, updateLastAccessed]);

    const goToPreviousLesson = useCallback(() => {
        if (!activeLessonId || isTransitioning) return;

        const indices = getLessonIndex(activeLessonId);
        if (!indices) return;

        let prevLessonId: string | null = null;
        let prevModuleId: string | null = null;

        // Try previous lesson in same module
        if (indices.lessonIndex > 0) {
            prevLessonId = syllabus[indices.moduleIndex].lessons[indices.lessonIndex - 1].id;
            prevModuleId = syllabus[indices.moduleIndex].id;
        }
        // Try last lesson of previous module
        else if (indices.moduleIndex > 0) {
            const prevModule = syllabus[indices.moduleIndex - 1];
            if (prevModule.lessons.length > 0) {
                prevLessonId = prevModule.lessons[prevModule.lessons.length - 1].id;
                prevModuleId = prevModule.id;
            }
        }

        if (!prevLessonId) return;

        // Animate transition: slide right (backward)
        setIsTransitioning(true);
        setSlideDirection('right');
        setTransitionPhase('exit');

        // Record that user accessed previous lesson
        updateLastAccessed(prevLessonId);

        setTimeout(() => {
            setActiveLessonId(prevLessonId);
            setActiveModuleId(prevModuleId);
            if (prevModuleId && !expandedModules.includes(prevModuleId)) {
                setExpandedModules(prev => [...prev, prevModuleId!]);
            }
            setTransitionPhase('enter');

            setTimeout(() => {
                setTransitionPhase('stable');
                setIsTransitioning(false);
            }, 350);
        }, 350);
    }, [activeLessonId, getLessonIndex, syllabus, isTransitioning, expandedModules, updateLastAccessed]);

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
        if (isTransitioning) return;

        // Enable auto-play when transitioning to player (Start/Resume clicked)
        setShouldAutoPlay(true);

        setIsTransitioning(true);
        setSlideDirection('left'); // Forward: description slides left, player comes from right
        setTransitionPhase('exit');

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

        // Record that user accessed this lesson (for progress tracking)
        if (targetLessonId) {
            updateLastAccessed(targetLessonId);
        }

        setTimeout(() => {
            setViewMode('player');
            setActiveLessonId(targetLessonId || null);
            setActiveModuleId(targetModuleId || null);
            setTransitionPhase('enter');

            // Expand the module containing the active lesson
            if (targetModuleId && !expandedModules.includes(targetModuleId)) {
                setExpandedModules(prev => [...prev, targetModuleId!]);
            }

            setTimeout(() => {
                setTransitionPhase('stable');
                setIsTransitioning(false);
            }, 350);
        }, 350);
    }, [syllabus, completedLessons, expandedModules, isTransitioning, updateLastAccessed]);

    const transitionToDescription = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setSlideDirection('right'); // Backward: player slides right, description comes from left
        setTransitionPhase('exit');

        setTimeout(() => {
            setViewMode('description');
            // Clear active lesson/module when returning to description
            setActiveLessonId(null);
            setActiveModuleId(null);
            setTransitionPhase('enter');

            setTimeout(() => {
                setTransitionPhase('stable');
                setIsTransitioning(false);
            }, 350);
        }, 350);
    }, [isTransitioning]);

    // Handle lesson click
    const handleLessonClick = useCallback((lesson: Lesson, moduleId: string) => {
        if (isTransitioning) return;

        if (viewMode === 'description') {
            transitionToPlayer(lesson.id, moduleId);
        } else {
            // Already in player mode - determine direction based on lesson order
            const currentIndices = activeLessonId ? getLessonIndex(activeLessonId) : null;
            const targetIndices = getLessonIndex(lesson.id);

            if (!currentIndices || !targetIndices || lesson.id === activeLessonId) {
                // Same lesson or can't determine - just set without animation
                setActiveLessonId(lesson.id);
                setActiveModuleId(moduleId);
                if (!expandedModules.includes(moduleId)) {
                    setExpandedModules(prev => [...prev, moduleId]);
                }
                return;
            }

            // Enable auto-play when clicking a lesson in the sidebar
            setShouldAutoPlay(true);

            // Record that user accessed this lesson
            updateLastAccessed(lesson.id);

            // Determine if going forward or backward
            const isForward = targetIndices.moduleIndex > currentIndices.moduleIndex ||
                (targetIndices.moduleIndex === currentIndices.moduleIndex && targetIndices.lessonIndex > currentIndices.lessonIndex);

            // Animate transition
            setIsTransitioning(true);
            setSlideDirection(isForward ? 'left' : 'right');
            setTransitionPhase('exit');

            setTimeout(() => {
                setActiveLessonId(lesson.id);
                setActiveModuleId(moduleId);
                if (!expandedModules.includes(moduleId)) {
                    setExpandedModules(prev => [...prev, moduleId]);
                }
                setTransitionPhase('enter');

                setTimeout(() => {
                    setTransitionPhase('stable');
                    setIsTransitioning(false);
                }, 350);
            }, 350);
        }
    }, [viewMode, transitionToPlayer, expandedModules, isTransitioning, activeLessonId, getLessonIndex, updateLastAccessed]);

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

    // Assessment panel handlers
    const handleOpenAssessmentPanel = useCallback(() => {
        setAssessmentPanelOpen(true);
    }, []);

    const handleCloseAssessmentPanel = useCallback(() => {
        setAssessmentPanelOpen(false);
    }, []);

    const handleAssessmentComplete = useCallback((score: number, passed: boolean) => {
        // Mark lesson as complete regardless of pass/fail
        if (activeLessonId) {
            handleLessonComplete(activeLessonId);
        }
        // Clear saved progress for this lesson
        if (savedAssessmentProgress?.lessonId === activeLessonId) {
            setSavedAssessmentProgress(null);
        }
    }, [activeLessonId, handleLessonComplete, savedAssessmentProgress?.lessonId]);

    const handleAssessmentContinueToNext = useCallback(() => {
        setAssessmentPanelOpen(false);
        // Clear saved progress for this lesson
        if (savedAssessmentProgress?.lessonId === activeLessonId) {
            setSavedAssessmentProgress(null);
        }
        // Navigate to next lesson after panel closes
        setTimeout(() => {
            goToNextLesson();
        }, 500); // Wait for panel close animation
    }, [goToNextLesson, savedAssessmentProgress?.lessonId, activeLessonId]);

    const handleSaveAssessmentProgress = useCallback((responses: Record<string, string>, currentIndex: number) => {
        if (activeLessonId) {
            setSavedAssessmentProgress({
                lessonId: activeLessonId,
                responses,
                currentIndex
            });
        }
    }, [activeLessonId]);

    // Auto-open assessment panel when quiz lesson is selected
    useEffect(() => {
        if (currentLesson?.type === 'quiz' && currentLesson?.quiz_data && viewMode === 'player') {
            setAssessmentPanelOpen(true);
        }
    }, [currentLesson?.id, currentLesson?.type, currentLesson?.quiz_data, viewMode]);

    // Get saved progress for current lesson
    const currentLessonSavedProgress = useMemo(() => {
        if (savedAssessmentProgress?.lessonId === activeLessonId) {
            return {
                responses: savedAssessmentProgress.responses,
                currentIndex: savedAssessmentProgress.currentIndex
            };
        }
        return undefined;
    }, [savedAssessmentProgress, activeLessonId]);

    // Handle back button
    const handleBack = useCallback(() => {
        if (viewMode === 'player') {
            transitionToDescription();
        } else {
            onBack();
        }
    }, [viewMode, transitionToDescription, onBack]);

    // Register browser back button handler - conditionally based on view mode
    // When in player mode, back goes to description; when in description mode, back calls onBack
    useBackHandler(handleBack);

    // Initialize with initial lesson/module if provided
    useEffect(() => {
        if (initialLessonId) {
            transitionToPlayer(initialLessonId, initialModuleId);
        }
    }, []);

    // Compute transition classes based on direction and phase
    const getTransitionClass = () => {
        if (transitionPhase === 'stable') return 'course-view-stable';

        if (slideDirection === 'left') {
            // Forward transition (description->player, current->next)
            return transitionPhase === 'exit' ? 'course-slide-out-left' : 'course-slide-in-right';
        } else {
            // Backward transition (player->description, current->previous)
            return transitionPhase === 'exit' ? 'course-slide-out-right' : 'course-slide-in-left';
        }
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
                onAddToCollection={() => onAddToCollection({
                    type: 'COURSE',
                    id: course.id,
                    title: course.title
                })}
            />

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 pt-6 pb-36">
                <div className={`${getTransitionClass()}`}>
                    {/* Course Description or Player */}
                    {viewMode === 'description' ? (
                        <CourseDescriptionSection
                            course={course}
                            authorCredentials={authorCredentials}
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
                                onStartAssessment={handleOpenAssessmentPanel}
                                hasAssessmentProgress={savedAssessmentProgress?.lessonId === currentLesson.id}
                                autoPlay={shouldAutoPlay}
                                onAutoPlayConsumed={() => setShouldAutoPlay(false)}
                            />
                        )
                    )}
                </div>

                {/* Modules Section */}
                <div>
                    {/* Section Header - Label left, Toggle right */}
                    <div className="flex items-center justify-between py-[45px] gap-4">
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <BookOpen size={14} className="text-brand-blue-light" />
                                <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase text-slate-400">
                                    COURSE MODULES
                                </h2>
                            </div>
                        </div>
                        <div className="flex-1 h-px bg-white/10" />
                        {/* View Toggle */}
                        <div className="flex items-center gap-0.5 p-1 bg-black/40 border border-white/10 rounded-lg">
                            <button
                                onClick={() => handleLessonViewModeChange('grid')}
                                className={`p-1.5 rounded-md transition-all ${
                                    lessonViewMode === 'grid'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="Card View"
                            >
                                <LayoutGrid size={14} />
                            </button>
                            <button
                                onClick={() => handleLessonViewModeChange('list')}
                                className={`p-1.5 rounded-md transition-all ${
                                    lessonViewMode === 'list'
                                        ? 'bg-white/20 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                                title="List View"
                            >
                                <List size={14} />
                            </button>
                        </div>
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
                                lessonViewMode={lessonViewMode}
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

            {/* Assessment Panel */}
            {currentLesson?.type === 'quiz' && currentLesson?.quiz_data && (
                <AssessmentPanel
                    isOpen={assessmentPanelOpen}
                    onClose={handleCloseAssessmentPanel}
                    lessonId={currentLesson.id}
                    lessonTitle={currentLesson.title}
                    quizData={currentLesson.quiz_data}
                    onComplete={handleAssessmentComplete}
                    onContinueToNext={handleAssessmentContinueToNext}
                    hasNextLesson={hasNextLesson}
                    savedProgress={currentLessonSavedProgress}
                    onSaveProgress={handleSaveAssessmentProgress}
                />
            )}
        </div>
    );
};

export default CoursePageV2;
