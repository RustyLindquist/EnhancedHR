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

function HomeContent() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);

  // Lifted State: Courses source of truth
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

  // Navigation & Collection State
  const [activeCollectionId, setActiveCollectionId] = useState<string>('dashboard');
  const [customCollections, setCustomCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);

  // Global Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<ContextCard | null>(null);

  const handleUpdateCourse = (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
  };

  const handleCreateCollection = (newCollection: Collection) => {
    setCustomCollections(prev => [...prev, newCollection]);
  };

  // Logic to handle saving (triggered from Modal)
  const handleSaveToCollection = (selectedCollectionIds: string[], newCollection?: { label: string; color: string }) => {
    // 1. Handle New Collection Creation
    if (newCollection) {
      const newId = `custom-${Date.now()}`;
      const created = { id: newId, label: newCollection.label, color: newCollection.color, isCustom: true };
      handleCreateCollection(created);
      // Add new ID to selection
      if (!selectedCollectionIds.includes(newId)) {
        selectedCollectionIds.push(newId);
      }
    }

    // 2. Update Item Logic
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
        // Dispatch event for MainCanvas to handle conversation updates
        if (typeof window !== 'undefined') {
          // We need to send ALL selected collections, not just one
          // But our event listener expects { conversationId, collectionId }
          // We should update the listener or send multiple events
          // For now, let's send a new event type 'updateConversationCollections'
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
      // Instead of navigating, open the "Create Collection" modal
      handleOpenModal(undefined);
    } else {
      setActiveCollectionId(id);
      // We no longer force close the panel here. 
      // The render logic handles hiding it for Prometheus, 
      // so when we leave Prometheus, it will be in its previous state.
    }
  };

  // Immediate save (for drag and drop on existing portals)
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

    // Also trigger conversation collection update if this is a conversation
    // The MainCanvas will handle this through its own state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('addConversationToCollection', {
        detail: { conversationId: courseId.toString(), collectionId }
      }));
    }
  };

  // AI Panel State
  const [aiPanelPrompt, setAiPanelPrompt] = useState('');
  // Lifted state for Context Awareness
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);

  const handleOpenAIPanel = () => {
    // Don't open side panel if we are in full screen mode
    if (activeCollectionId !== 'prometheus') {
      setRightOpen(true);
    }
  };

  const handleCourseSelect = (courseId: string | null) => {
    setActiveCourseId(courseId);
  };

  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('courseId');
  const initialCourseId = courseIdParam ? parseInt(courseIdParam, 10) : undefined;

  const contextScope = useMemo<ContextScope>(() =>
    activeCourseId
      ? { type: 'COURSE', id: activeCourseId }
      : ['dashboard', 'academy', 'favorites', 'recents'].includes(activeCollectionId)
        ? { type: 'PLATFORM' }
        : { type: 'COLLECTION', id: activeCollectionId }
    , [activeCourseId, activeCollectionId]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">

      {/* Global Background System */}
      <BackgroundSystem theme={currentTheme} />

      {/* Global Modals */}
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
        />

        {/* Center Content */}
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
          initialCourseId={initialCourseId}
        />

        {/* Right AI Panel - Hidden if in Prometheus Full Page Mode */}
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
          />
        )}
      </div>

    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[#0A0D12] text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
