'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationPanel from '@/components/NavigationPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import { BACKGROUND_THEMES, ADMIN_NAV_ITEMS } from '@/constants';
import { BackgroundTheme, Course } from '@/types';
import { fetchCoursesAction } from '@/app/actions/courses';
import CanvasHeader from '@/components/CanvasHeader';

interface AdminPageLayoutProps {
    children: React.ReactNode;
    activeNavId?: string;
    onThemeChange?: (theme: BackgroundTheme) => void;
}

export default function AdminPageLayout({ children, activeNavId = 'dashboard', onThemeChange }: AdminPageLayoutProps) {
    const router = useRouter();
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(false); // Default closed for admin
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [activeCollectionId, setActiveCollectionId] = useState<string>('dashboard');

    useEffect(() => {
        async function loadCourses() {
            const { courses } = await fetchCoursesAction();
            setCourses(courses);
        }
        loadCourses();
    }, []);

    const handleSelectCollection = (id: string) => {
        // Handle navigation for admin items or standard collection items
        if (id.startsWith('admin/')) {
            // NavigationPanel handles router.push for these
        } else {
            // For standard collections, redirect to main app
            router.push(`/dashboard?collection=${id}`);
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
                    className="bg-gradient-to-b from-[#054C74] to-[#022031] backdrop-blur-xl border-r border-white/10"
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
