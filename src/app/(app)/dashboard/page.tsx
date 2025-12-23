'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import NavigationPanel from '@/components/NavigationPanel';
import MainCanvas from '@/components/MainCanvas';
import AIPanel from '@/components/AIPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import AddCollectionModal from '@/components/AddCollectionModal';
import { BACKGROUND_THEMES, DEFAULT_COLLECTIONS } from '@/constants';
import { BackgroundTheme, Course, Collection, ContextCard } from '@/types';
import { fetchCoursesAction } from '@/app/actions/courses';
import { useSearchParams, useRouter } from 'next/navigation';
import { ContextScope } from '@/lib/ai/types';

import {
  LayoutDashboard, Users, BookOpen, Settings, LogOut, ChevronLeft, ChevronRight, Menu, X, User,
  ImageIcon, Flame, Award, Building, MessageSquare, PenTool, Clock, ArrowLeft, Check, Upload, Brain,
  Star, Search, Plus, Folder
} from 'lucide-react';

function HomeContent() {
  // URL params and router - needed early for navigation handlers
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseIdParam = searchParams.get('courseId');
  const collectionParam = searchParams.get('collection');

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true); // Restore default open
  const [currentTheme, setCurrentTheme] = useState<BackgroundTheme>(BACKGROUND_THEMES[0]);


  // Lifted State: Courses source of truth
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      const { courses, debug } = await fetchCoursesAction();
      console.log('[Dashboard] Courses Loaded:', courses.length);
      if (debug) console.log('[Dashboard] Server Debug:', debug);
      setCourses(courses);
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
    // Use Server Action for counts to bypass RLS issues
    const { getCollectionCountsAction } = await import('@/app/actions/collections');

    const mappedCounts = await getCollectionCountsAction(user.id);

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
        // Deduplicate by label to prevent UI bug
        const uniqueMap = new Map();
        dbCollections.forEach((c: Collection) => {
          if (!uniqueMap.has(c.label)) {
            uniqueMap.set(c.label, c);
          }
        });
        setCustomCollections(Array.from(uniqueMap.values()) as Collection[]);

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
    const { getCollectionCountsAction } = await import('@/app/actions/collections');

    // Counts are now mapped server-side to system keys ('favorites', etc.) via Admin Client
    const mappedCounts = await getCollectionCountsAction(userId);

    setCollectionCounts(mappedCounts);
  };

  const refreshCollectionsAndCounts = async (userId: string) => {
    // Refresh Collections List
    const { fetchUserCollections } = await import('@/lib/collections');
    const dbCollections = await fetchUserCollections(userId);

    // Deduplicate by label
    const uniqueMap = new Map();
    dbCollections.forEach((c: Collection) => {
      if (!uniqueMap.has(c.label)) {
        uniqueMap.set(c.label, c);
      }
    });
    setCustomCollections(Array.from(uniqueMap.values()) as Collection[]);

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
    console.log('[Dashboard Debug] handleSaveToCollection called', { modalItem, selectedCollectionIds });
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
      console.log('[Dashboard Debug] Processing modalItem type:', modalItem.type);
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
          const { syncCourseCollectionsAction } = await import('@/app/actions/collections');
          const targetIds = finalSelectionIds.filter(id => id !== 'new');

          await syncCourseCollectionsAction(user.id, courseId, targetIds);
          await refreshCollectionCounts();
        }

      } else if (modalItem.type === 'CONVERSATION') {
        if (typeof window !== 'undefined') {
          // Optimistic UI Update
          window.dispatchEvent(new CustomEvent('updateConversationCollections', {
            detail: { conversationId: modalItem.id, collectionIds: finalSelectionIds }
          }));
        }

        // DB Sync
        if (user) {
          const { syncConversationCollectionsAction } = await import('@/app/actions/collections');
          const targetIds = finalSelectionIds.filter(id => id !== 'new');

          await syncConversationCollectionsAction(user.id, String(modalItem.id), targetIds);
          await refreshCollectionCounts();
        } else {
          console.error('User missing during save!');
        }
      } else if (modalItem.type === 'MODULE' || modalItem.type === 'LESSON' || modalItem.type === 'RESOURCE') {
        // Course content items (Module, Lesson, Resource) go to collection_items table
        if (user) {
          const { addToCollectionAction } = await import('@/app/actions/collections');

          const promises = finalSelectionIds
            .filter(id => id !== 'new')
            .map(collectionId => {
              return addToCollectionAction(String(modalItem.id), modalItem.type, collectionId);
            });

          await Promise.all(promises);
          await refreshCollectionCounts();
        }
      } else {
        // Other Context Items (AI_INSIGHT, CUSTOM_CONTEXT, FILE, etc.)
        if (user) {
          const { createContextItem } = await import('@/app/actions/context');

          // Persist each selected collection as a Context Item
          // We map 'modalItem' content into the JSON 'content' field.
          const promises = finalSelectionIds
            .filter(id => id !== 'new')
            .map(collectionId => {
              const itemAny = modalItem as any;
              const payload = {
                collection_id: collectionId,
                type: modalItem.type as any, // Cast to ContextItemType
                title: itemAny.title || 'Untitled',
                content: {
                  subtitle: itemAny.subtitle,
                  meta: itemAny.meta,
                  description: itemAny.description,
                  originalId: modalItem.id
                }
              };
              return createContextItem(payload);
            });

          await Promise.all(promises);
          await refreshCollectionCounts();
        }
      }
    }

    setIsAddModalOpen(false);
    setModalItem(null);
  };

  const handleOpenModal = (item?: ContextCard) => {
    console.log('[Dashboard Debug] handleOpenModal called with:', item);
    setModalItem(item || null);
    setIsAddModalOpen(true);
  };

  const handleSelectCollection = (id: string) => {
    if (id === 'new') {
      handleOpenModal(undefined);
    } else {
      // Always clear the active course when selecting a collection
      // This ensures clicking Academy always returns to All Courses view
      if (id === 'academy') {
        setActiveCourseId(null);
        // Increment reset key to trigger filter reset in MainCanvas
        // This works even if already on Academy (clicking Academy again)
        setAcademyResetKey(prev => prev + 1);
        // Clear URL params to prevent useEffect from re-setting the course
        if (courseIdParam) {
          router.replace('/dashboard?collection=academy', { scroll: false });
        }
      }
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
  // Reset trigger for Academy view - increments to force filter reset
  const [academyResetKey, setAcademyResetKey] = useState(0);

  const handleOpenAIPanel = () => {
    if (activeCollectionId !== 'prometheus') {
      setRightOpen(true);
    }
  };

  // Memoized to prevent useEffect re-runs in MainCanvas
  const handleCourseSelect = useCallback((courseId: string | null) => {
    // Only update if value actually changed to prevent loops
    setActiveCourseId(prev => prev === courseId ? prev : courseId);
  }, []);

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
          onSelectCollection={handleSelectCollection}
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
          academyResetKey={academyResetKey}
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
