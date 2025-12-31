'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StickyNote } from 'lucide-react';
import NavigationPanel from '@/components/NavigationPanel';
import NotesPanel from '@/components/NotesPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import CollectionSurface from '@/components/CollectionSurface';
import HelpPanel from '@/components/help/HelpPanel';
import { HelpTopicId } from '@/components/help/HelpContent';
import { BACKGROUND_THEMES, DEFAULT_COLLECTIONS } from '@/constants';
import { BackgroundTheme, Course } from '@/types';
import { fetchCoursesAction } from '@/app/actions/courses';
import { addNoteToCollectionAction } from '@/app/actions/notes';

// Drag item for notes
interface NoteDragItem {
    type: 'NOTE';
    id: string;
    title: string;
}

// Custom Drag Layer for Notes
const NoteDragLayer: React.FC<{ item: NoteDragItem | null; x: number; y: number }> = ({ item, x, y }) => {
    if (!item) return null;

    return (
        <div
            className="fixed pointer-events-none z-[150] transform -translate-x-1/2 -translate-y-1/2 opacity-90 scale-90"
            style={{ left: x, top: y }}
        >
            <div className="w-64 h-32 bg-slate-800/90 backdrop-blur-xl border border-[#9A9724]/50 rounded-xl shadow-2xl p-4 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-[#9A9724]/20 rounded text-[#9A9724]">
                        <StickyNote size={18} />
                    </div>
                    <span className="text-xs font-bold text-[#9A9724] uppercase tracking-wider">Note</span>
                </div>
                <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
            </div>
        </div>
    );
};

interface ToolPageLayoutProps {
    children: React.ReactNode;
    activeNavId?: string;
}

export default function ToolPageLayout({ children, activeNavId = 'tools' }: ToolPageLayoutProps) {
    const router = useRouter();
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isCollectionSurfaceOpen, setIsCollectionSurfaceOpen] = useState(true);

    // Help Panel State
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [helpTopicId, setHelpTopicId] = useState<HelpTopicId>('notes');

    // Drag state
    const [isDragging, setIsDragging] = useState(false);
    const [draggedItem, setDraggedItem] = useState<NoteDragItem | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [flaringPortalId, setFlaringPortalId] = useState<string | null>(null);

    useEffect(() => {
        async function loadCourses() {
            const { courses } = await fetchCoursesAction();
            setCourses(courses);
        }
        loadCourses();
    }, []);

    // Track mouse position during drag
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isDragging]);

    const handleSelectCollection = (id: string) => {
        router.push(`/dashboard?collection=${id}`);
    };

    const handleAddNoteToCollection = useCallback(async (item: { type: 'NOTE'; id: string; title: string }) => {
        // Direct add - opens a collection modal or performs inline add
        // For now, log it - can be enhanced with a modal
        console.log('[ToolPageLayout] Add note to collection:', item);
    }, []);

    const handleNoteDragStart = useCallback((item: { type: 'NOTE'; id: string; title: string }) => {
        setIsDragging(true);
        setDraggedItem(item);
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDraggedItem(null);
    }, []);

    const handleDropOnCollection = useCallback(async (collectionId: string) => {
        if (!draggedItem) return;

        try {
            const result = await addNoteToCollectionAction(draggedItem.id, collectionId);
            if (result.success) {
                setFlaringPortalId(collectionId);
                setTimeout(() => setFlaringPortalId(null), 500);
            }
        } catch (error) {
            console.error('[ToolPageLayout] Failed to add note to collection:', error);
        }

        setIsDragging(false);
        setDraggedItem(null);
    }, [draggedItem]);

    const handleOpenHelp = useCallback((topicId: string) => {
        setHelpTopicId(topicId as HelpTopicId);
        setIsHelpOpen(true);
    }, []);

    return (
        <div
            className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]"
            onDragOver={(e) => {
                e.preventDefault();
                if (isDragging) {
                    setMousePos({ x: e.clientX, y: e.clientY });
                }
            }}
            onDragEnd={handleDragEnd}
            onDrop={() => setIsDragging(false)}
        >

            {/* Global Background System */}
            <BackgroundSystem theme={currentTheme} />

            {/* Custom Drag Layer */}
            {isDragging && draggedItem && (
                <NoteDragLayer
                    item={draggedItem}
                    x={mousePos.x}
                    y={mousePos.y}
                />
            )}

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

                    {/* Collection Surface at bottom */}
                    <div className="absolute bottom-0 left-0 w-full z-[60] pointer-events-none">
                        <CollectionSurface
                            isDragging={isDragging}
                            activeFlareId={flaringPortalId}
                            customCollections={DEFAULT_COLLECTIONS}
                            isOpen={isCollectionSurfaceOpen}
                            onToggle={() => setIsCollectionSurfaceOpen(!isCollectionSurfaceOpen)}
                            onCollectionClick={(id) => {
                                handleSelectCollection(id);
                            }}
                            onDropCourse={(collectionId) => {
                                handleDropOnCollection(collectionId);
                            }}
                        />
                    </div>
                </div>

                {/* Right Notes Panel (instead of AI Panel) */}
                <NotesPanel
                    isOpen={rightOpen}
                    setIsOpen={setRightOpen}
                    onAddNoteToCollection={handleAddNoteToCollection}
                    onNoteDragStart={handleNoteDragStart}
                    onOpenHelp={handleOpenHelp}
                />
            </div>

            {/* Help Panel */}
            <HelpPanel
                isOpen={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
                topicId={helpTopicId}
            />
        </div>
    );
}
