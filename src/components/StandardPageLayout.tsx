'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NavigationPanel from '@/components/NavigationPanel';
import AIPanel from '@/components/AIPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import CollectionSurface from '@/components/CollectionSurface';
import { DEFAULT_COLLECTIONS } from '@/constants';
import { Course } from '@/types';
import { fetchCoursesAction } from '@/app/actions/courses';
import { useTheme } from '@/contexts/ThemeContext';
import { getCollectionSurfacePreferenceAction, updateCollectionSurfacePreferenceAction } from '@/app/actions/profile';

interface StandardPageLayoutProps {
    children: React.ReactNode;
    activeNavId?: string; // To highlight the correct nav item
}

export default function StandardPageLayout({ children, activeNavId = 'dashboard' }: StandardPageLayoutProps) {
    const router = useRouter();
    const { currentTheme, setTheme } = useTheme();
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCollectionSurfaceOpen, setIsCollectionSurfaceOpen] = useState(false); // Default closed

    useEffect(() => {
        async function loadCourses() {
            const { courses } = await fetchCoursesAction();
            setCourses(courses);
        }
        loadCourses();
    }, []);

    // Fetch Collection Surface preference on mount
    useEffect(() => {
        async function loadCollectionSurfacePreference() {
            const result = await getCollectionSurfacePreferenceAction();
            if (result.success && result.isOpen !== undefined) {
                setIsCollectionSurfaceOpen(result.isOpen);
            }
        }
        loadCollectionSurfacePreference();
    }, []);

    // Handler for toggling collection surface (persists to database)
    const handleToggleCollectionSurface = useCallback(() => {
        const newState = !isCollectionSurfaceOpen;
        setIsCollectionSurfaceOpen(newState);
        // Persist preference (fire-and-forget)
        updateCollectionSurfacePreferenceAction(newState).catch(err => {
            console.error('Failed to save collection surface preference:', err);
        });
    }, [isCollectionSurfaceOpen]);

    const handleSelectCollection = (id: string) => {
        // Redirect to dashboard with collection param
        router.push(`/dashboard?collection=${id}`);
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">

            {/* Global Background System */}
            <BackgroundSystem theme={currentTheme} />

            {/* Main Application Layer */}
            <div className="flex w-full h-full relative z-10">
                {/* Left Navigation */}
                <NavigationPanel
                    isOpen={leftOpen}
                    setIsOpen={setLeftOpen}
                    currentTheme={currentTheme}
                    onThemeChange={setTheme}
                    courses={courses}
                    activeCollectionId={activeNavId}
                    onSelectCollection={handleSelectCollection}
                />

                {/* Center Content (The Canvas) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
                    {children}

                    {/* Collection Surface at bottom */}
                    <div className="absolute bottom-0 left-0 w-full z-[60] pointer-events-none">
                        <CollectionSurface
                            isDragging={false}
                            activeFlareId={null}
                            customCollections={DEFAULT_COLLECTIONS}
                            isOpen={isCollectionSurfaceOpen}
                            onToggle={handleToggleCollectionSurface}
                            onCollectionClick={(id) => {
                                handleSelectCollection(id);
                            }}
                            onDropCourse={() => {
                                // No-op for standard pages - drag/drop handled elsewhere
                            }}
                        />
                    </div>
                </div>

                {/* Right AI Panel */}
                {/* Right AI Panel */}
                <AIPanel
                    isOpen={rightOpen}
                    setIsOpen={setRightOpen}
                    agentType="platform_assistant"
                    contextScope={{ type: 'PLATFORM' }}
                />
            </div>
        </div>
    );
}
