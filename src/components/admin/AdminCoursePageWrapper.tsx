'use client';

import React, { createContext, useContext } from 'react';
import { Course, Module, Resource } from '@/types';
import { ExpertCredential } from '@/app/actions/credentials';

// Panel types for the course builder
export type CourseBuilderPanelType =
    | 'image'
    | 'description'
    | 'skills'
    | 'credits'
    | 'expert'
    | 'module'
    | 'lesson'
    | 'resources'
    | 'bulk_upload'
    | null;

// Context for admin mode state
interface AdminCourseContextType {
    isAdminMode: boolean;
    activePanel: CourseBuilderPanelType;
    editingModuleId: string | null;
    editingLessonId: string | null;
    editingResourceId: string | null;
    openPanel: (panel: CourseBuilderPanelType, moduleId?: string, lessonId?: string, resourceId?: string) => void;
    closePanel: () => void;
    refreshCourse: () => void;
}

const AdminCourseContext = createContext<AdminCourseContextType | null>(null);

export function useAdminCourse() {
    const context = useContext(AdminCourseContext);
    if (!context) {
        throw new Error('useAdminCourse must be used within AdminCoursePageWrapper');
    }
    return context;
}

// Hook for components that may or may not be in admin mode
export function useOptionalAdminCourse() {
    return useContext(AdminCourseContext);
}

interface AdminCoursePageWrapperProps {
    course: Course;
    syllabus: Module[];
    resources: Resource[];
    authorCredentials?: ExpertCredential[];
    onRefresh: () => void;
    // Panel state - managed by parent (AdminCourseBuilderClient)
    activePanel: CourseBuilderPanelType;
    editingModuleId: string | null;
    editingLessonId: string | null;
    editingResourceId?: string | null;
    onOpenPanel: (panel: CourseBuilderPanelType, moduleId?: string, lessonId?: string, resourceId?: string) => void;
    onClosePanel: () => void;
    children: React.ReactNode;
}

export default function AdminCoursePageWrapper({
    course,
    syllabus,
    resources,
    authorCredentials = [],
    onRefresh,
    activePanel,
    editingModuleId,
    editingLessonId,
    editingResourceId = null,
    onOpenPanel,
    onClosePanel,
    children
}: AdminCoursePageWrapperProps) {
    const contextValue: AdminCourseContextType = {
        isAdminMode: true,
        activePanel,
        editingModuleId,
        editingLessonId,
        editingResourceId,
        openPanel: onOpenPanel,
        closePanel: onClosePanel,
        refreshCourse: onRefresh
    };

    return (
        <AdminCourseContext.Provider value={contextValue}>
            <div className="relative">
                {/* Course Page Content */}
                {children}
            </div>
        </AdminCourseContext.Provider>
    );
}
