'use client';

import React, { useState, useEffect } from 'react';
import NavigationPanel from '@/components/NavigationPanel';
import AIPanel from '@/components/AIPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import { BACKGROUND_THEMES } from '@/constants';
import { BackgroundTheme, Course } from '@/types';
import { fetchCourses } from '@/lib/courses';

interface StandardPageLayoutProps {
    children: React.ReactNode;
    activeNavId?: string; // To highlight the correct nav item
}

export default function StandardPageLayout({ children, activeNavId = 'dashboard' }: StandardPageLayoutProps) {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
    const [courses, setCourses] = useState<Course[]>([]);

    useEffect(() => {
        async function loadCourses() {
            const data = await fetchCourses();
            setCourses(data);
        }
        loadCourses();
    }, []);

    const handleSelectCollection = (id: string) => {
        // For now, standard pages might not handle collection switching like the home page.
        // If clicking a nav item, we might want to navigate.
        // But for this layout, we assume it's used for specific pages (like Billing).
        // Navigation logic should be handled by the NavigationPanel's router.push if it's a link,
        // or we might need to inject a handler.
        // The current NavigationPanel calls onSelectCollection.

        if (id === 'academy') {
            window.location.href = '/'; // Simple redirect for now
        } else if (id === 'dashboard') {
            window.location.href = '/';
        }
        // Add more navigation logic as needed
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
                    onThemeChange={setCurrentTheme}
                    courses={courses}
                    activeCollectionId={activeNavId}
                    onSelectCollection={handleSelectCollection}
                />

                {/* Center Content (The Canvas) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
                    {children}
                </div>

                {/* Right AI Panel */}
                <AIPanel isOpen={rightOpen} setIsOpen={setRightOpen} />
            </div>
        </div>
    );
}
