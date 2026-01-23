'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import NavigationPanel from '@/components/NavigationPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import { EXPERT_NAV_ITEMS } from '@/constants';
import { Course } from '@/types';
import { fetchCoursesAction } from '@/app/actions/courses';
import CanvasHeader from '@/components/CanvasHeader';
import { useTheme } from '@/contexts/ThemeContext';

interface ExpertPageLayoutProps {
    children: React.ReactNode;
    activeNavId?: string;
    title?: string;
    headerActions?: React.ReactNode;
}

export default function ExpertPageLayout({ children, activeNavId, title = 'Expert Console', headerActions }: ExpertPageLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { currentTheme, setTheme } = useTheme();
    const [leftOpen, setLeftOpen] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);

    // Determine active nav item from pathname if not provided
    const currentActiveId = activeNavId || (pathname?.replace('/', '') || 'author');

    // Dynamic title based on route if not provided
    const ROUTE_TITLES: Record<string, string> = {
        'author': 'Expert Dashboard',
        'author/courses': 'My Courses',
        'author/resources': 'Expert Resources',
        'author/analytics': 'AI Analytics',
        'author/earnings': 'Earnings',
        'author/profile': 'Expert Profile',
    };
    const displayTitle = title !== 'Expert Console' ? title : (ROUTE_TITLES[currentActiveId] || title);

    useEffect(() => {
        async function loadCourses() {
            const { courses } = await fetchCoursesAction();
            setCourses(courses);
        }
        loadCourses();
    }, []);

    const handleSelectCollection = (id: string) => {
        // Handle navigation for expert items
        if (id.startsWith('author')) {
            router.push(`/${id}`);
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
            <div className="flex w-full h-full relative">
                {/* Left Navigation - Expert Orange/Amber theme */}
                <NavigationPanel
                    isOpen={leftOpen}
                    setIsOpen={setLeftOpen}
                    currentTheme={currentTheme}
                    onThemeChange={setTheme}
                    courses={courses}
                    activeCollectionId={currentActiveId}
                    onSelectCollection={handleSelectCollection}
                    customNavItems={EXPERT_NAV_ITEMS}
                    className="bg-gradient-to-b from-[#48171E] to-[#1A0A0C] backdrop-blur-xl border-r border-white/10"
                />

                {/* Center Content (The Canvas) */}
                <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">

                    {/* Canvas Header */}
                    <CanvasHeader
                        context="Expert Portal"
                        title={displayTitle}
                        onBack={() => router.push('/dashboard')}
                        backLabel="Back to Dashboard"
                    >
                        {headerActions}
                    </CanvasHeader>

                    {/* Main Content Area */}
                    <div className="flex-1 w-full max-w-7xl mx-auto overflow-y-auto pl-10 pr-6 pb-48 mt-[60px] relative custom-scrollbar">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
