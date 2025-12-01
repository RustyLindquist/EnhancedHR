'use client';

import React, { useState, useEffect } from 'react';
import NavigationPanel from '@/components/NavigationPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import { BACKGROUND_THEMES, ADMIN_NAV_ITEMS } from '@/constants';
import { BackgroundTheme, Course } from '@/types';
import { fetchCourses } from '@/lib/courses';
import CanvasHeader from '@/components/CanvasHeader';

interface AdminPageLayoutProps {
    children: React.ReactNode;
}

export default function AdminPageLayout({ children }: AdminPageLayoutProps) {
    const [leftOpen, setLeftOpen] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCollectionId, setActiveCollectionId] = useState<string>('dashboard');

    useEffect(() => {
        async function loadCourses() {
            const data = await fetchCourses();
            setCourses(data);
        }
        loadCourses();
    }, []);

    const handleSelectCollection = (id: string) => {
        // Handle navigation for admin items or standard collection items
        if (id.startsWith('admin/')) {
            // NavigationPanel handles router.push for these
        } else {
            // For standard collections, we might want to redirect to main app or handle differently
            // For now, let's just set active to show selection state
            setActiveCollectionId(id);
            if (id === 'dashboard' || id === 'academy') {
                window.location.href = '/';
            }
        }
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
                    activeCollectionId={activeCollectionId}
                    onSelectCollection={handleSelectCollection}
                    customNavItems={ADMIN_NAV_ITEMS}
                />

                {/* Center Content (The Canvas) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">

                    {/* Canvas Header */}
                    <CanvasHeader
                        context="Platform Administration"
                        title="Admin Console"
                    />

                    {/* Main Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
