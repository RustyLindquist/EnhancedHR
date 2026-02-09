'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import NavigationPanel from '@/components/NavigationPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import { SALES_NAV_ITEMS } from '@/constants';
import { Course } from '@/types';
import { fetchCoursesAction } from '@/app/actions/courses';
import CanvasHeader from '@/components/CanvasHeader';
import { useTheme } from '@/contexts/ThemeContext';

interface SalesPageLayoutProps {
    children: React.ReactNode;
    activeNavId?: string;
}

export default function SalesPageLayout({ children, activeNavId }: SalesPageLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { currentTheme, setTheme } = useTheme();
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);

    const currentActiveId = activeNavId || (pathname?.replace('/', '') || 'sales');

    useEffect(() => {
        async function loadCourses() {
            const { courses } = await fetchCoursesAction();
            setCourses(courses);
        }
        loadCourses();
    }, []);

    const handleSelectCollection = (id: string) => {
        if (id.startsWith('sales/')) {
            // NavigationPanel handles router.push for these
        } else {
            router.push(`/dashboard?collection=${id}`);
        }
    };

    return (
        <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">
            <BackgroundSystem theme={currentTheme} />

            <div className="flex w-full h-full relative z-10">
                <NavigationPanel
                    isOpen={leftOpen}
                    setIsOpen={setLeftOpen}
                    currentTheme={currentTheme}
                    onThemeChange={setTheme}
                    courses={courses}
                    activeCollectionId={currentActiveId}
                    onSelectCollection={handleSelectCollection}
                    customNavItems={SALES_NAV_ITEMS}
                    className="bg-gradient-to-b from-[#3D2E1A] to-[#1A1208] backdrop-blur-xl border-r border-white/10"
                />

                <div className="flex-1 flex flex-col relative overflow-hidden bg-transparent">
                    <CanvasHeader
                        context="Sales"
                        title="Sales Console"
                        onBack={() => router.push('/dashboard')}
                        backLabel="Back to Dashboard"
                    />

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
