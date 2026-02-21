'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BookOpen, LayoutGrid, List, FileText, Download, Paperclip, ChevronLeft, ChevronRight, Sparkles, Bookmark } from 'lucide-react';
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
    const [activeResourceId, setActiveResourceId] = useState<string | null>(null);

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

    // Get active resource (when viewing an inline module resource)
    const activeResource = useMemo(() => {
        if (!activeResourceId) return null;
        return resources.find(r => r.id === activeResourceId) || null;
    }, [activeResourceId, resources]);

    // Split resources: course-level vs module-level
    const courseResources = useMemo(() => resources.filter(r => !r.module_id), [resources]);
    const moduleResourcesMap = useMemo(() => {
        const map: Record<string, Resource[]> = {};
        resources.forEach(r => {
            if (r.module_id) {
                if (!map[r.module_id]) map[r.module_id] = [];
                map[r.module_id].push(r);
            }
        });
        return map;
    }, [resources]);

    // Build flat navigation list across all modules (lessons + resources merged by order)
    const navigationItems = useMemo(() => {
        const items: Array<{ kind: 'lesson' | 'resource'; id: string; moduleId: string }> = [];
        for (const module of syllabus) {
            const moduleRes = moduleResourcesMap[module.id] || [];
            const merged: Array<{ kind: 'lesson' | 'resource'; id: string; order: number }> = [
                ...module.lessons.map((l, i) => ({ kind: 'lesson' as const, id: l.id, order: l.order ?? i })),
                ...moduleRes.map((r, i) => ({ kind: 'resource' as const, id: r.id, order: r.order ?? (1000 + i) })),
            ];
            merged.sort((a, b) => a.order - b.order);
            for (const item of merged) {
                items.push({ kind: item.kind, id: item.id, moduleId: module.id });
            }
        }
        return items;
    }, [syllabus, moduleResourcesMap]);

    // Find current position in the flat navigation list
    const currentItemIndex = useMemo(() => {
        if (activeLessonId) {
            return navigationItems.findIndex(item => item.kind === 'lesson' && item.id === activeLessonId);
        }
        if (activeResourceId) {
            return navigationItems.findIndex(item => item.kind === 'resource' && item.id === activeResourceId);
        }
        return -1;
    }, [navigationItems, activeLessonId, activeResourceId]);

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

    // Navigation functions with slide transitions (unified for lessons + resources)
    const goToNextItem = useCallback(() => {
        if (currentItemIndex < 0 || currentItemIndex >= navigationItems.length - 1 || isTransitioning) return;

        const nextItem = navigationItems[currentItemIndex + 1];

        // Enable auto-play only when navigating to a lesson
        if (nextItem.kind === 'lesson') {
            setShouldAutoPlay(true);
        }

        // Animate transition: slide left (forward)
        setIsTransitioning(true);
        setSlideDirection('left');
        setTransitionPhase('exit');

        setTimeout(() => {
            if (nextItem.kind === 'lesson') {
                setActiveLessonId(nextItem.id);
                setActiveResourceId(null);
                updateLastAccessed(nextItem.id);
            } else {
                setActiveResourceId(nextItem.id);
                setActiveLessonId(null);
            }
            setActiveModuleId(nextItem.moduleId);
            if (!expandedModules.includes(nextItem.moduleId)) {
                setExpandedModules(prev => [...prev, nextItem.moduleId]);
            }
            setTransitionPhase('enter');

            setTimeout(() => {
                setTransitionPhase('stable');
                setIsTransitioning(false);
            }, 350);
        }, 350);
    }, [currentItemIndex, navigationItems, isTransitioning, expandedModules, updateLastAccessed]);

    const goToPreviousItem = useCallback(() => {
        if (currentItemIndex <= 0 || isTransitioning) return;

        const prevItem = navigationItems[currentItemIndex - 1];

        // Animate transition: slide right (backward)
        setIsTransitioning(true);
        setSlideDirection('right');
        setTransitionPhase('exit');

        setTimeout(() => {
            if (prevItem.kind === 'lesson') {
                setActiveLessonId(prevItem.id);
                setActiveResourceId(null);
                updateLastAccessed(prevItem.id);
            } else {
                setActiveResourceId(prevItem.id);
                setActiveLessonId(null);
            }
            setActiveModuleId(prevItem.moduleId);
            if (!expandedModules.includes(prevItem.moduleId)) {
                setExpandedModules(prev => [...prev, prevItem.moduleId]);
            }
            setTransitionPhase('enter');

            setTimeout(() => {
                setTransitionPhase('stable');
                setIsTransitioning(false);
            }, 350);
        }, 350);
    }, [currentItemIndex, navigationItems, isTransitioning, expandedModules, updateLastAccessed]);

    // Check if there's a next/previous item
    const hasNextItem = useMemo(() => currentItemIndex >= 0 && currentItemIndex < navigationItems.length - 1, [currentItemIndex, navigationItems]);
    const hasPreviousItem = useMemo(() => currentItemIndex > 0, [currentItemIndex]);

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
            // Clear active lesson/module/resource when returning to description
            setActiveLessonId(null);
            setActiveModuleId(null);
            setActiveResourceId(null);
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

        // Clear any active resource when switching to a lesson
        setActiveResourceId(null);

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

    // Handle resource click (inline module resource or course-level resource)
    const handleResourceClick = useCallback((resource: Resource, moduleId: string | null) => {
        if (isTransitioning) return;

        // Clear lesson, set resource
        setActiveLessonId(null);
        setActiveResourceId(resource.id);
        setActiveModuleId(moduleId);

        if (viewMode === 'description') {
            // Transition to player mode showing the resource
            setIsTransitioning(true);
            setSlideDirection('left');
            setTransitionPhase('exit');

            setTimeout(() => {
                setViewMode('player');
                if (moduleId && !expandedModules.includes(moduleId)) {
                    setExpandedModules(prev => [...prev, moduleId]);
                }
                setTransitionPhase('enter');
                setTimeout(() => {
                    setTransitionPhase('stable');
                    setIsTransitioning(false);
                }, 350);
            }, 350);
        } else {
            // Already in player mode — animate transition
            setIsTransitioning(true);
            setSlideDirection('left');
            setTransitionPhase('exit');

            setTimeout(() => {
                if (moduleId && !expandedModules.includes(moduleId)) {
                    setExpandedModules(prev => [...prev, moduleId]);
                }
                setTransitionPhase('enter');
                setTimeout(() => {
                    setTransitionPhase('stable');
                    setIsTransitioning(false);
                }, 350);
            }, 350);
        }
    }, [viewMode, expandedModules, isTransitioning]);

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
        // Navigate to next item after panel closes
        setTimeout(() => {
            goToNextItem();
        }, 500); // Wait for panel close animation
    }, [goToNextItem, savedAssessmentProgress?.lessonId, activeLessonId]);

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
                    ) : activeResource ? (
                        /* Resource Viewer */
                        <div className="relative animate-fade-in">
                            {activeResource.type === 'IMG' || /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?|$)/i.test(activeResource.url) ? (
                                /* Image Resource — inline preview */
                                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/5">
                                    <img
                                        src={activeResource.url}
                                        alt={activeResource.title}
                                        className="w-full h-full object-contain"
                                    />
                                    {/* Title overlay — top left */}
                                    <div className="absolute top-4 left-4 max-w-[60%]">
                                        <div className="px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
                                            <span className="px-1.5 py-0.5 bg-red-700/30 text-red-400 text-[8px] font-bold uppercase rounded border border-red-700/40 inline-block mb-1">
                                                RESOURCE
                                            </span>
                                            <h2 className="text-sm font-semibold text-white/90 truncate">{activeResource.title}</h2>
                                        </div>
                                    </div>
                                    {/* Download button — top right */}
                                    <div className="absolute top-4 right-4">
                                        <a
                                            href={activeResource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                                        >
                                            <Download size={14} />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                /* Non-image Resource — title + download */
                                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative shadow-[0_0_80px_rgba(0,0,0,0.6)] border border-white/5 flex flex-col items-center justify-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-red-700/20 border border-red-700/30 flex items-center justify-center">
                                            <FileText size={32} className="text-red-400" />
                                        </div>
                                        <div className="text-center">
                                            <span className="px-2.5 py-0.5 bg-red-700/20 text-red-400 text-[9px] font-bold uppercase rounded border border-red-700/30 mb-3 inline-block">
                                                RESOURCE
                                            </span>
                                            <h2 className="text-xl font-bold text-white mb-1">{activeResource.title}</h2>
                                            <p className="text-sm text-slate-400">
                                                {activeResource.type} file{activeResource.size ? ` · ${activeResource.size}` : ''}
                                            </p>
                                        </div>
                                        <a
                                            href={activeResource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download
                                            className="flex items-center gap-2 px-6 py-3 bg-red-700/20 hover:bg-red-700/30 border border-red-700/30 hover:border-red-700/50 text-red-400 hover:text-red-300 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:shadow-[0_0_20px_rgba(185,28,28,0.2)]"
                                        >
                                            <Download size={16} />
                                            Download
                                        </a>
                                    </div>
                                </div>
                            )}
                            {/* Resource Info Bar with Navigation */}
                            <div className="mt-4 flex items-center gap-4">
                                {/* Previous Item Arrow */}
                                <button
                                    onClick={goToPreviousItem}
                                    disabled={!hasPreviousItem}
                                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                        hasPreviousItem
                                            ? 'bg-white/[0.05] border border-white/20 text-white hover:bg-white/10 hover:border-white/40 hover:scale-105'
                                            : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                                    }`}
                                    aria-label="Previous item"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                {/* Resource Info Container */}
                                <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3 mb-0.5">
                                                <span className="text-[10px] font-bold tracking-wider text-red-400 uppercase">
                                                    RESOURCE
                                                </span>
                                                {activeResource.size && (
                                                    <span className="text-[10px] text-slate-500">{activeResource.size}</span>
                                                )}
                                            </div>
                                            <h2 className="text-base font-bold text-white truncate">{activeResource.title}</h2>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        <Paperclip size={14} className="text-red-400" />
                                        <span className="text-sm text-slate-400">{activeResource.type} file</span>
                                    </div>
                                </div>

                                {/* Next Item Arrow */}
                                <button
                                    onClick={goToNextItem}
                                    disabled={!hasNextItem}
                                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                        hasNextItem
                                            ? 'bg-white/[0.05] border border-white/20 text-white hover:bg-white/10 hover:border-white/40 hover:scale-105'
                                            : 'bg-white/[0.02] border border-white/5 text-slate-600 cursor-not-allowed'
                                    }`}
                                    aria-label="Next item"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        currentLesson && (
                            <LessonPlayerSection
                                lesson={currentLesson}
                                lessonNumber={getLessonNumber(currentLesson.id)}
                                course={course}
                                onLessonComplete={handleLessonComplete}
                                onNextLesson={goToNextItem}
                                onPreviousLesson={goToPreviousItem}
                                hasNext={hasNextItem}
                                hasPrevious={hasPreviousItem}
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
                                activeResourceId={activeResourceId}
                                completedLessons={completedLessons}
                                onToggle={() => handleModuleToggle(module.id)}
                                onLessonClick={(lesson) => handleLessonClick(lesson, module.id)}
                                onResourceClick={(resource) => handleResourceClick(resource, module.id)}
                                onAskPrometheus={onAskPrometheus}
                                onAddToCollection={onAddToCollection}
                                onDragStart={onDragStart}
                                courseTitle={course.title}
                                lessonViewMode={lessonViewMode}
                                moduleResources={moduleResourcesMap[module.id] || []}
                            />
                        ))}
                    </div>
                </div>

                {/* Resources Section (course-level only) */}
                {courseResources.length > 0 && (
                    <CourseResourcesSection
                        resources={courseResources}
                        courseTitle={course.title}
                        onAddToCollection={onAddToCollection}
                        onDragStart={onDragStart}
                        onResourceClick={(resource) => handleResourceClick(resource, null)}
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
                    hasNextLesson={hasNextItem}
                    savedProgress={currentLessonSavedProgress}
                    onSaveProgress={handleSaveAssessmentProgress}
                />
            )}
        </div>
    );
};

export default CoursePageV2;
