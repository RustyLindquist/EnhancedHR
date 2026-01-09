'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import NavigationPanel from '@/components/NavigationPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import { ADMIN_NAV_ITEMS } from '@/constants';
import { Course } from '@/types';
import { fetchCoursesAction } from '@/app/actions/courses';
import CanvasHeader from '@/components/CanvasHeader';
import { useTheme } from '@/contexts/ThemeContext';

interface AdminPageLayoutProps {
    children: React.ReactNode;
    activeNavId?: string;
}

export default function AdminPageLayout({ children, activeNavId }: AdminPageLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { currentTheme, setTheme } = useTheme();
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(false); // Default closed for admin
    const [courses, setCourses] = useState<Course[]>([]);

    // Determine active nav item from pathname if not provided
    const currentActiveId = activeNavId || (pathname?.replace('/', '') || 'admin');

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
                    onThemeChange={setTheme}
                    courses={courses}
                    activeCollectionId={currentActiveId}
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
                        onBack={() => router.push('/dashboard')}
                        backLabel="Back to Dashboard"
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
