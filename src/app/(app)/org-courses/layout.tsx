'use client';

import React, { useState, useEffect } from 'react';
import NavigationPanel from '@/components/NavigationPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import { BACKGROUND_THEMES, DEFAULT_COLLECTIONS } from '@/constants';
import { BackgroundTheme, Course, Collection } from '@/types';
import { useRouter } from 'next/navigation';

export default function OrgCoursesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [leftOpen, setLeftOpen] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);

    // Navigation State
    const [customCollections, setCustomCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
    const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});
    const [orgMemberCount, setOrgMemberCount] = useState<number>(0);
    const [orgCollections, setOrgCollections] = useState<{ id: string; label: string; color: string; item_count: number }[]>([]);
    const [userOrgId, setUserOrgId] = useState<string | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);

    // Load user data and collections
    useEffect(() => {
        async function initData() {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch collections
                const { fetchUserCollections, ensureSystemCollections } = await import('@/lib/collections');
                await ensureSystemCollections(user.id);
                const dbCollections = await fetchUserCollections(user.id);

                const uniqueMap = new Map();
                dbCollections.forEach((c: Collection) => {
                    if (!uniqueMap.has(c.label)) {
                        uniqueMap.set(c.label, c);
                    }
                });
                setCustomCollections(Array.from(uniqueMap.values()) as Collection[]);

                // Fetch org data
                const { getOrgMemberCount, getOrgCollections, getCurrentOrgId } = await import('@/app/actions/org');
                const memberCount = await getOrgMemberCount();
                setOrgMemberCount(memberCount);

                const orgColls = await getOrgCollections();
                setOrgCollections(orgColls);

                const currentOrgId = await getCurrentOrgId();
                setUserOrgId(currentOrgId);

                // Fetch collection counts
                const { getCollectionCountsAction } = await import('@/app/actions/collections');
                const mappedCounts = await getCollectionCountsAction(user.id);
                setCollectionCounts(mappedCounts);
            }
        }
        initData();
    }, []);

    const handleSelectCollection = (id: string) => {
        // Handle navigation based on collection ID
        if (id === 'dashboard') {
            router.push('/dashboard');
        } else if (id === 'academy') {
            router.push('/dashboard?collection=academy');
        } else if (id === 'org-courses') {
            router.push('/org-courses');
        } else if (id.startsWith('admin/') || id === 'admin') {
            router.push(`/${id}`);
        } else {
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
                    activeCollectionId="org-courses"
                    onSelectCollection={handleSelectCollection}
                    collectionCounts={collectionCounts}
                    customCollections={customCollections}
                    orgMemberCount={orgMemberCount}
                    orgCollections={orgCollections}
                    orgId={userOrgId || undefined}
                />

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden flex flex-col">
                    {/* Content - no padding here, pages handle their own padding */}
                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
