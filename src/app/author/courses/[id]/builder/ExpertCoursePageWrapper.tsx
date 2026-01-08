'use client';

import React, { createContext, useContext } from 'react';
import { Course, Module, Resource } from '@/types';

// Panel types for the expert course builder (subset of admin panels)
export type ExpertCoursePanelType =
    | 'image'
    | 'description'
    | 'skills'
    | 'module'
    | 'lesson'
    | 'resources'
    | null;

// Context for expert mode state
interface ExpertCourseContextType {
    isExpertMode: boolean;
    activePanel: ExpertCoursePanelType;
    editingModuleId: string | null;
    editingLessonId: string | null;
    openPanel: (panel: ExpertCoursePanelType, moduleId?: string, lessonId?: string) => void;
    closePanel: () => void;
    refreshCourse: () => void;
    courseId: number;
}

const ExpertCourseContext = createContext<ExpertCourseContextType | null>(null);

export function useExpertCourse() {
    const context = useContext(ExpertCourseContext);
    if (!context) {
        throw new Error('useExpertCourse must be used within ExpertCoursePageWrapper');
    }
    return context;
}

// Hook for components that may or may not be in expert mode
export function useOptionalExpertCourse() {
    return useContext(ExpertCourseContext);
}

interface ExpertCoursePageWrapperProps {
    course: Course;
    syllabus: Module[];
    resources: Resource[];
    onRefresh: () => void;
    // Panel state - managed by parent (ExpertCourseBuilderClient)
    activePanel: ExpertCoursePanelType;
    editingModuleId: string | null;
    editingLessonId: string | null;
    onOpenPanel: (panel: ExpertCoursePanelType, moduleId?: string, lessonId?: string) => void;
    onClosePanel: () => void;
    children: React.ReactNode;
}

export default function ExpertCoursePageWrapper({
    course,
    syllabus,
    resources,
    onRefresh,
    activePanel,
    editingModuleId,
    editingLessonId,
    onOpenPanel,
    onClosePanel,
    children
}: ExpertCoursePageWrapperProps) {
    const contextValue: ExpertCourseContextType = {
        isExpertMode: true,
        activePanel,
        editingModuleId,
        editingLessonId,
        openPanel: onOpenPanel,
        closePanel: onClosePanel,
        refreshCourse: onRefresh,
        courseId: course.id
    };

    return (
        <ExpertCourseContext.Provider value={contextValue}>
            <div className="relative">
                {children}
            </div>
        </ExpertCourseContext.Provider>
    );
}
