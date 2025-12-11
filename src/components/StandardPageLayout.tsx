'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
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
