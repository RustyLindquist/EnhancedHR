'use client';

import React from 'react';
import { Edit3 } from 'lucide-react';
import { useOptionalAdminCourse, CourseBuilderPanelType } from './AdminCoursePageWrapper';

interface SectionEditOverlayProps {
    panelType: CourseBuilderPanelType;
    moduleId?: string;
    lessonId?: string;
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
}

/**
 * SectionEditOverlay wraps content and adds a hover overlay with edit icon when in admin mode.
 * Clicking the overlay opens the corresponding editor panel.
 */
export default function SectionEditOverlay({
    panelType,
    moduleId,
    lessonId,
    children,
    className = '',
    disabled = false
}: SectionEditOverlayProps) {
    const adminContext = useOptionalAdminCourse();

    // If not in admin mode, just render children
    if (!adminContext?.isAdminMode) {
        return <>{children}</>;
    }

    const handleClick = () => {
        if (!disabled && panelType) {
            adminContext.openPanel(panelType, moduleId, lessonId);
        }
    };

    return (
        <div
            className={`group relative ${disabled ? '' : 'cursor-pointer'} ${className}`}
            onClick={disabled ? undefined : handleClick}
        >
            {/* Original content */}
            {children}

            {/* Hover overlay - only when not disabled */}
            {!disabled && (
                <div className="absolute inset-0 bg-brand-blue-light/5 border-2 border-brand-blue-light/30 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center pointer-events-none z-10">
                    <div className="p-3 rounded-full bg-black/70 border border-brand-blue-light/50 shadow-lg">
                        <Edit3 size={20} className="text-brand-blue-light" />
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Inline Edit Button - Use this for smaller, more targeted edit buttons
 * that appear on hover without covering the whole section.
 */
interface SectionEditButtonProps {
    panelType: CourseBuilderPanelType;
    moduleId?: string;
    lessonId?: string;
    label?: string;
    size?: 'sm' | 'md';
    className?: string;
}

export function SectionEditButton({
    panelType,
    moduleId,
    lessonId,
    label = 'Edit',
    size = 'sm',
    className = ''
}: SectionEditButtonProps) {
    const adminContext = useOptionalAdminCourse();

    // If not in admin mode, don't render
    if (!adminContext?.isAdminMode) {
        return null;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (panelType) {
            adminContext.openPanel(panelType, moduleId, lessonId);
        }
    };

    const sizeClasses = size === 'sm'
        ? 'px-2 py-1 text-[10px] gap-1'
        : 'px-3 py-1.5 text-xs gap-1.5';

    return (
        <button
            onClick={handleClick}
            className={`
                flex items-center ${sizeClasses}
                rounded-full bg-brand-blue-light/10 hover:bg-brand-blue-light/20
                border border-brand-blue-light/30 hover:border-brand-blue-light/50
                text-brand-blue-light font-bold uppercase tracking-wider
                transition-all duration-200 hover:shadow-[0_0_15px_rgba(120,192,240,0.2)]
                ${className}
            `}
        >
            <Edit3 size={size === 'sm' ? 10 : 12} />
            {label}
        </button>
    );
}
