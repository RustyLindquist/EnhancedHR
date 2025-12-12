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

import {
  LayoutDashboard, Users, BookOpen, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X, User,
  ImageIcon, Flame, Award, Building, MessageSquare, PenTool, Clock, ArrowLeft, Check, Upload, Brain,
  Star, Search, Plus, Folder
} from 'lucide-react';

function HomeContent() {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true); // Restore default open
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);
  // ...


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
  const [customCollections, setCustomCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});
  const [user, setUser] = useState<any>(null); // Track user for DB ops

  // Global Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<ContextCard | null>(null);

  // Load User and Collections
  // Function to refresh counts (passed to children)
  const refreshCollectionCounts = async () => {
    if (!user) return;

    // Dynamically import to ensure client-side execution context is respected
    // (Though could be top-level, this matches existing pattern)
    const { fetchCollectionCounts, ensureSystemCollections } = await import('@/lib/collections');

    const rawCounts = await fetchCollectionCounts(user.id);
    const systemMap = await ensureSystemCollections(user.id);

    const uuidToSystemMap: Record<string, string> = {};
    Object.entries(systemMap).forEach(([key, uuid]) => {
      uuidToSystemMap[uuid] = key;
    });

    const mappedCounts: Record<string, number> = {};

    Object.entries(rawCounts).forEach(([uuid, count]) => {
      const systemKey = uuidToSystemMap[uuid];
      if (systemKey) {
        mappedCounts[systemKey] = count;
      } else {
        mappedCounts[uuid] = count;
      }
    });

    setCollectionCounts(mappedCounts);
  };

  useEffect(() => {
    async function initUserAndCollections() {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { fetchUserCollections, ensureSystemCollections } = await import('@/lib/collections');

        // 0. Ensure System Collections exist (Sync)
        await ensureSystemCollections(user.id);

        // 1. Fetch ALL Collections (System + Custom)
        const dbCollections = await fetchUserCollections(user.id);

        // Merge logic: DB is source of truth now.
        setCustomCollections(dbCollections);

        // 2. Initial Count Fetch
        // We can call the new function here, but need to be careful with closure/dependency interaction
        // Since refreshCollectionCounts depends on 'user' state which might not be set in closure yet if we just set it.
        // Actually, we define refreshCollectionCounts to use 'user' state, but inside this useEffect 'user' variable is local.
        // So let's duplicate the logic slightly or pass user to the function? 
        // Better: pass user ID to function to avoid state dependency issues.

        await refreshCountsForUser(user.id);
      }
    }
    initUserAndCollections();
  }, []);

  const refreshCountsForUser = async (userId: string) => {
    const { fetchCollectionCounts, ensureSystemCollections } = await import('@/lib/collections');

    const rawCounts = await fetchCollectionCounts(userId);
    const systemMap = await ensureSystemCollections(userId);

    const uuidToSystemMap: Record<string, string> = {};
    Object.entries(systemMap).forEach(([key, uuid]) => {
      uuidToSystemMap[uuid] = key;
    });

    const mappedCounts: Record<string, number> = {};

    Object.entries(rawCounts).forEach(([uuid, count]) => {
      const systemKey = uuidToSystemMap[uuid];
      if (systemKey) {
        mappedCounts[systemKey] = count;
      } else {
        mappedCounts[uuid] = count;
      }
    });

    setCollectionCounts(mappedCounts);
  };

  const refreshCollectionsAndCounts = async (userId: string) => {
    // Refresh Collections List
    const { fetchUserCollections } = await import('@/lib/collections');
    const dbCollections = await fetchUserCollections(userId);
    setCustomCollections(dbCollections);

    // Refresh Counts
    await refreshCountsForUser(userId);
  };





  const handleUpdateCourse = (updatedCourses: Course[]) => {
    setCourses(updatedCourses);
  };

  const handleCreateCollection = (newCollection: Collection) => {
    setCustomCollections(prev => [...prev, newCollection]);
  };

  // Logic to handle saving (triggered from Modal)
  const handleSaveToCollection = async (selectedCollectionIds: string[], newCollection?: { label: string; color: string }) => {
    let finalSelectionIds = [...selectedCollectionIds];

    // 1. Handle New Collection Creation
    if (newCollection && user) {
      const { createCollection } = await import('@/lib/collections');
      const created = await createCollection(user.id, newCollection.label, newCollection.color);

      if (created) {
        handleCreateCollection(created);
        // Add new ID to selection
        if (!finalSelectionIds.includes(created.id)) {
          finalSelectionIds.push(created.id);
        }
      }
    } else if (newCollection && !user) {
      // Fallback for demo/offline logic? (Shouldn't happen given auth requirements)
      const newId = `custom-${Date.now()}`;
      const created = { id: newId, label: newCollection.label, color: newCollection.color, isCustom: true };
      handleCreateCollection(created);
      finalSelectionIds.push(newId);
    }

    // 2. Update Item Logic
    if (modalItem) {
      if (modalItem.type === 'COURSE') {
        const courseId = modalItem.id;

        // Optimistic Update
        const updatedCourses = courses.map(c => {
          if (c.id === courseId) {
            return {
              ...c,
              collections: finalSelectionIds,
              isSaved: true // Keep true if saved
            };
          }
          return c;
        });
        handleUpdateCourse(updatedCourses);

        // DB Sync
        if (user) {
          const { syncCourseCollections, ensureSystemCollections, fetchCollectionCounts } = await import('@/lib/collections');

          // MAP System IDs ('favorites', 'workspace') to UUIDs
          const systemMap = await ensureSystemCollections(user.id);

          const dbCollectionIds = finalSelectionIds
            .filter(id => id !== 'new')
            .map(id => {
              // if id match a key in systemMap, return uuid
              if (systemMap[id]) return systemMap[id];
              return id;
            });

          await syncCourseCollections(user.id, courseId, dbCollectionIds);

          // Refresh counts
          const rawCounts = await fetchCollectionCounts(user.id);
          const uuidToSystemMap: Record<string, string> = {};
          Object.entries(systemMap).forEach(([key, uuid]) => uuidToSystemMap[uuid] = key);

          const mappedCounts: Record<string, number> = {};
          Object.entries(rawCounts).forEach(([uuid, count]) => {
            const systemKey = uuidToSystemMap[uuid];
            if (systemKey) mappedCounts[systemKey] = count;
            else mappedCounts[uuid] = count;
          });
          setCollectionCounts(mappedCounts);
        }

      } else if (modalItem.type === 'CONVERSATION') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('updateConversationCollections', {
            detail: { conversationId: modalItem.id, collectionIds: finalSelectionIds }
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
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleOpenAIPanel = () => {
    if (activeCollectionId !== 'prometheus') {
      setRightOpen(true);
    }
  };

  const handleCourseSelect = (courseId: string | null) => {
    setActiveCourseId(courseId);
  };

  // Handle Resuming Conversation from MainCanvas
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
  const collectionParam = searchParams.get('collection');

  // Navigation & Collection State
  const [activeCollectionId, setActiveCollectionId] = useState<string>(collectionParam || 'dashboard');

  useEffect(() => {
    if (courseIdParam) {
      setActiveCourseId(courseIdParam);
    }
  }, [courseIdParam]);

  useEffect(() => {
    if (collectionParam) {
      setActiveCollectionId(collectionParam);
    }
  }, [collectionParam]);

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
          collectionCounts={collectionCounts}
          customCollections={customCollections}
        />

        {/* Center Content - Using Dashboard V3 */}
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
          onCollectionUpdate={() => {
            if (user) refreshCollectionsAndCounts(user.id);
          }}
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
            conversationId={activeConversationId}
            onConversationIdChange={setActiveConversationId}
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
