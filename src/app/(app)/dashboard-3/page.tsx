'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import NavigationPanel from '@/components/NavigationPanel';
import MainCanvas from '@/components/MainCanvas';
import AIPanel from '@/components/AIPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import AddCollectionModal from '@/components/AddCollectionModal';
import { BACKGROUND_THEMES, DEFAULT_COLLECTIONS } from '@/constants';
import { BackgroundTheme, Course, Collection, ContextCard } from '@/types';
import { fetchCourses } from '@/lib/courses';
import { useSearchParams } from 'next/navigation';
import { ContextScope } from '@/lib/ai/types';

function HomeContentV3() {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);

    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadCourses() {
            const data = await fetchCourses();
            setCourses(data);
            setIsLoading(false);
        }
        loadCourses();
    }, []);

    const [activeCollectionId, setActiveCollectionId] = useState<string>('dashboard');
    const [customCollections, setCustomCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalItem, setModalItem] = useState<ContextCard | null>(null);

    const handleUpdateCourse = (updatedCourses: Course[]) => {
        setCourses(updatedCourses);
    };

    const handleCreateCollection = (newCollection: Collection) => {
        setCustomCollections(prev => [...prev, newCollection]);
    };

    const handleSaveToCollection = (selectedCollectionIds: string[], newCollection?: { label: string; color: string }) => {
        if (newCollection) {
            const newId = `custom-${Date.now()}`;
            const created = { id: newId, label: newCollection.label, color: newCollection.color, isCustom: true };
            handleCreateCollection(created);
            if (!selectedCollectionIds.includes(newId)) {
                selectedCollectionIds.push(newId);
            }
        }

        if (modalItem) {
            if (modalItem.type === 'COURSE') {
                const updatedCourses = courses.map(c => {
                    if (c.id === modalItem.id) {
                        return {
                            ...c,
                            collections: selectedCollectionIds,
                            isSaved: selectedCollectionIds.length > 0
                        };
                    }
                    return c;
                });
                handleUpdateCourse(updatedCourses);
            } else if (modalItem.type === 'CONVERSATION') {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('updateConversationCollections', {
                        detail: { conversationId: modalItem.id, collectionIds: selectedCollectionIds }
                    }));
                }
            }
        }

        setIsAddModalOpen(false);
        setModalItem(null);
    };

    const handleOpenModal = (item?: ContextCard) => {
        setModalItem(item || null);
        setIsAddModalOpen(true);
    };

    const handleSelectCollection = (id: string) => {
        if (id === 'new') {
            handleOpenModal(undefined);
        } else {
            setActiveCollectionId(id);
        }
    };

    const handleImmediateAddToCollection = (courseId: number, collectionId: string) => {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const currentCollections = course.collections || [];
            if (!currentCollections.includes(collectionId)) {
                const updatedCollections = [...currentCollections, collectionId];
                const updatedCourses = courses.map(c => {
                    if (c.id === courseId) {
                        return {
                            ...c,
                            collections: updatedCollections,
                            isSaved: true
                        };
                    }
                    return c;
                });
                handleUpdateCourse(updatedCourses);
            }
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('addConversationToCollection', {
                detail: { conversationId: courseId.toString(), collectionId }
            }));
        }
    };

    const [aiPanelPrompt, setAiPanelPrompt] = useState('');
    const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    const handleOpenAIPanel = () => {
        if (activeCollectionId !== 'prometheus') {
            setRightOpen(true);
        }
    };

    const handleCourseSelect = (courseId: string | null) => {
        setActiveCourseId(courseId);
    };

    const handleResumeConversation = (conversation: any) => {
        const { metadata, id } = conversation;
        const scope = metadata?.contextScope;

        if (scope) {
            if (scope.type === 'COURSE') {
                setActiveCourseId(scope.id);
                setActiveCollectionId('academy');
            } else if (scope.type === 'COLLECTION') {
                setActiveCollectionId(scope.id);
                setActiveCourseId(null);
            } else if (scope.type === 'PLATFORM') {
                setActiveCollectionId('prometheus');
                setActiveCourseId(null);
            }
        } else {
            setActiveCollectionId('prometheus');
        }

        setActiveConversationId(id);
        setRightOpen(true);
    };

    const searchParams = useSearchParams();
    const courseIdParam = searchParams.get('courseId');

    useEffect(() => {
        if (courseIdParam) {
            setActiveCourseId(courseIdParam);
        }
    }, [courseIdParam]);

    const contextScope = useMemo<ContextScope>(() =>
        activeCourseId
            ? { type: 'COURSE', id: activeCourseId }
            : ['dashboard', 'academy', 'favorites', 'recents'].includes(activeCollectionId)
                ? { type: 'PLATFORM' }
                : { type: 'COLLECTION', id: activeCollectionId }
        , [activeCourseId, activeCollectionId]);

    return (
        <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">
            <BackgroundSystem theme={currentTheme} />

            {isAddModalOpen && (
                <AddCollectionModal
                    item={modalItem}
                    availableCollections={customCollections}
                    onClose={() => {
                        setIsAddModalOpen(false);
                        setModalItem(null);
                    }}
                    onSave={handleSaveToCollection}
                />
            )}

            <div className="flex w-full h-full relative z-10">
                <NavigationPanel
                    isOpen={leftOpen}
                    setIsOpen={setLeftOpen}
                    currentTheme={currentTheme}
                    onThemeChange={setCurrentTheme}
                    courses={courses}
                    activeCollectionId={activeCollectionId}
                    onSelectCollection={handleSelectCollection}
                />

                <MainCanvas
                    courses={courses}
                    activeCollectionId={activeCollectionId}
                    onSelectCollection={setActiveCollectionId}
                    customCollections={customCollections}
                    onOpenModal={handleOpenModal}
                    onImmediateAddToCollection={handleImmediateAddToCollection}
                    onOpenAIPanel={handleOpenAIPanel}
                    onSetAIPrompt={setAiPanelPrompt}
                    onCourseSelect={handleCourseSelect}
                    initialCourseId={activeCourseId ? parseInt(activeCourseId, 10) : undefined}
                    onResumeConversation={handleResumeConversation}
                    activeConversationId={activeConversationId}
                    useDashboardV3={true}
                />

                {activeCollectionId !== 'prometheus' && (
                    <AIPanel
                        isOpen={rightOpen}
                        setIsOpen={setRightOpen}
                        initialPrompt={aiPanelPrompt}
                        agentType={
                            activeCourseId
                                ? 'course_assistant'
                                : ['dashboard', 'academy', 'favorites', 'recents'].includes(activeCollectionId)
                                    ? 'platform_assistant'
                                    : 'collection_assistant'
                        }
                        contextScope={contextScope}
                        conversationId={activeConversationId}
                        onConversationIdChange={setActiveConversationId}
                    />
                )}
            </div>
        </div>
    );
}

export default function HomeV3() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#0A0D12] text-white">Loading...</div>}>
            <HomeContentV3 />
        </Suspense>
    );
}
