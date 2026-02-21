'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback, useRef } from 'react';
import NavigationPanel from '@/components/NavigationPanel';
import MainCanvas from '@/components/MainCanvas';
import AIPanel from '@/components/AIPanel';
import BackgroundSystem from '@/components/BackgroundSystem';
import AddCollectionModal from '@/components/AddCollectionModal';
import NewOrgCollectionModal from '@/components/NewOrgCollectionModal';
import HelpPanel from '@/components/help/HelpPanel';
import { HelpTopicId } from '@/components/help/HelpContent';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import { useDashboardData } from '@/hooks/useDashboardData';
import { BACKGROUND_THEMES, DEFAULT_COLLECTIONS } from '@/constants';
import { BackgroundTheme, Course, Collection, ContextCard, DragItem } from '@/types';
import { useSearchParams, useRouter } from 'next/navigation';
import { ContextScope } from '@/lib/ai/types';
import { useNavigationSafe } from '@/contexts/NavigationContext';

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

  // Help Panel State
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpTopicId, setHelpTopicId] = useState<HelpTopicId>('notes');

  // Dashboard data with caching
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData();

  // Onboarding state derived from dashboard data
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingProfile = dashboardData?.onboardingProfile ?? null;

  // Compute showOnboarding when dashboardData loads
  useEffect(() => {
    if (dashboardData?.onboardingProfile) {
      const p = dashboardData.onboardingProfile;
      setShowOnboarding(!p.onboarding_completed_at && !p.onboarding_skipped_at);
    }
  }, [dashboardData?.onboardingProfile]);

  const completeOnboarding = useCallback(async () => {
    const { completeOnboardingAction } = await import('@/app/actions/profile');
    await completeOnboardingAction();
    setShowOnboarding(false);
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    import('@/app/actions/profile').then(m => m.skipOnboardingAction()).catch(console.error);
  }, []);

  // Local state for courses (supports optimistic updates from mutations)
  const [courses, setCourses] = useState<Course[]>([]);
  const isLoading = dashboardLoading;

  // Navigation & Collection State
  const [customCollections, setCustomCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [collectionCounts, setCollectionCounts] = useState<Record<string, number>>({});
  const [orgMemberCount, setOrgMemberCount] = useState<number>(0);
  const [orgCollections, setOrgCollections] = useState<{ id: string; label: string; color: string; item_count: number }[]>([]);
  const [user, setUser] = useState<any>(null); // Track user for DB ops
  const [isOrgAdmin, setIsOrgAdmin] = useState<boolean>(false); // Track if user is org admin
  const [userOrgId, setUserOrgId] = useState<string | null>(null); // Track user's org ID for nav
  const [viewingGroupName, setViewingGroupName] = useState<string | null>(null); // Current group name for AI Panel title
  const [hasOrgCourses, setHasOrgCourses] = useState<boolean>(false); // Whether org has published courses

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

  // Sync server data to local state when dashboardData changes
  useEffect(() => {
    if (!dashboardData) return;

    // Set user
    setUser(dashboardData.user);

    // Sync courses
    setCourses(dashboardData.courses);

    // Sync collections (deduplicate by label to prevent UI bug)
    const uniqueMap = new Map<string, Collection>();
    dashboardData.collections.forEach((c) => {
      if (!uniqueMap.has(c.label)) {
        uniqueMap.set(c.label, c);
      }
    });
    setCustomCollections(Array.from(uniqueMap.values()));

    // Sync counts
    setCollectionCounts(dashboardData.collectionCounts);

    // Sync org data
    setOrgMemberCount(dashboardData.orgMemberCount);
    setOrgCollections(dashboardData.orgCollections);
    setIsOrgAdmin(dashboardData.isOrgAdmin);
    setUserOrgId(dashboardData.orgId);
    setHasOrgCourses(dashboardData.hasOrgCourses);
  }, [dashboardData]);

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
      } else if (modalItem.type === 'MODULE' || modalItem.type === 'LESSON' || modalItem.type === 'RESOURCE' || modalItem.type === 'ACTIVITY') {
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
      } else if (modalItem.type === 'NOTE') {
        // Notes use the addNoteToCollectionAction
        if (user) {
          const { addNoteToCollectionAction } = await import('@/app/actions/notes');

          const promises = finalSelectionIds
            .filter(id => id !== 'new')
            .map(collectionId => {
              return addNoteToCollectionAction(String(modalItem.id), collectionId);
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

    // Dispatch global event to refresh MainCanvas collection items
    // This ensures the item appears in the target collection when viewing it
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('collection:refresh'));
      window.dispatchEvent(new Event('dashboard:invalidate'));
    }

    setIsAddModalOpen(false);
    setModalItem(null);
  };

  const handleOpenModal = (item?: ContextCard) => {
    console.log('[Dashboard Debug] handleOpenModal called with:', item);
    setModalItem(item || null);
    setIsAddModalOpen(true);
  };

  // Handler for adding a conversation to a collection from AI Panel
  const handleAddConversationToCollection = (conversationId: string, title: string) => {
    handleOpenModal({
      type: 'CONVERSATION',
      id: conversationId,
      title: title
    });
  };

  // Handler for adding a note to a collection from AI Panel Notes tab
  const handleAddNoteToCollection = (item: { type: 'NOTE'; id: string; title: string }) => {
    handleOpenModal({
      type: 'NOTE',
      id: item.id,
      title: item.title
    });
  };

  // Ref to store MainCanvas's drag handler for note dragging from AIPanel
  const mainCanvasDragStartRef = useRef<((item: DragItem) => void) | null>(null);

  // Callback to receive drag handler from MainCanvas
  const handleExposeDragStart = useCallback((handler: (item: DragItem) => void) => {
    mainCanvasDragStartRef.current = handler;
  }, []);

  // Handler for note drag from AIPanel - triggers MainCanvas drag
  const handleNoteDragStart = useCallback((item: { type: 'NOTE'; id: string; title: string }) => {
    if (mainCanvasDragStartRef.current) {
      mainCanvasDragStartRef.current({
        type: 'NOTE',
        id: item.id,
        title: item.title
      });
    }
  }, []);

  // State for new org collection modal
  const [isNewOrgCollectionModalOpen, setIsNewOrgCollectionModalOpen] = useState(false);

  const handleSelectCollection = (id: string) => {
    if (id === 'new') {
      handleOpenModal(undefined);
    } else if (id === 'new-org-collection') {
      setIsNewOrgCollectionModalOpen(true);
    } else {
      // Track previous collection for back navigation (only if actually changing)
      if (id !== activeCollectionId) {
        // Push current collection to navigation history stack
        navigationHistoryRef.current.push(activeCollectionId);

        // Register a back handler for this navigation step
        // This pushes a history entry so browser back will intercept
        if (navigation) {
          navigation.registerBackHandler(handleGoBack);
        }

        // Clear active conversation when navigating to a different collection
        // This ensures the AI panel starts fresh with the new context/agent/RAG
        // Note: handleResumeConversation explicitly sets activeConversationId for resuming
        setActiveConversationId(null);

        // Clear initial insight ID when navigating away from personal insights
        if (activeCollectionId === 'personal-insights') {
          setInitialInsightId(null);
        }
      }

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
  // Initial status filter for Academy (e.g., ['IN_PROGRESS'] from "view all" on dashboard)
  const [initialStatusFilter, setInitialStatusFilter] = useState<string[]>([]);
  // Initial insight ID to auto-open when navigating to Personal Insights
  const [initialInsightId, setInitialInsightId] = useState<string | null>(null);

  const handleOpenAIPanel = () => {
    if (activeCollectionId !== 'prometheus') {
      setRightOpen(true);
    }
  };

  // Memoized to prevent useEffect re-runs in MainCanvas
  const handleCourseSelect = useCallback((courseId: string | null) => {
    // Only update if value actually changed to prevent loops
    setActiveCourseId(prev => {
      if (prev !== courseId) {
        // Clear active conversation when course context changes
        // This ensures AI panel starts fresh with the correct agent and RAG
        setActiveConversationId(null);
        return courseId;
      }
      return prev;
    });
  }, []);

  // Navigate to a collection with a pre-set status filter
  const handleNavigateWithFilter = useCallback((collectionId: string, statusFilter: string[]) => {
    setInitialStatusFilter(statusFilter);
    setActiveCollectionId(collectionId);
  }, []);

  // Navigate to Personal Insights with a specific insight pre-selected
  const handleNavigateToInsight = useCallback((insightId: string) => {
    setInitialInsightId(insightId);
    setActiveCollectionId('personal-insights');
  }, []);

  // Handle Resuming Conversation from MainCanvas
  // Navigates to the originating context so the conversation can resume with the correct RAG and agent
  const handleResumeConversation = (conversation: any) => {
    const { metadata, id } = conversation;
    const scope = metadata?.contextScope;

    if (scope) {
      if (scope.type === 'COURSE') {
        // Navigate to Academy with the course loaded
        setActiveCourseId(scope.id);
        setActiveCollectionId('academy');
      } else if (scope.type === 'COLLECTION') {
        // Navigate to the originating collection
        // Special handling for 'academy' which is a pseudo-collection
        if (scope.id === 'academy') {
          setActiveCollectionId('academy');
        } else {
          setActiveCollectionId(scope.id);
        }
        setActiveCourseId(null);
      } else if (scope.type === 'TOOL') {
        // Redirect to the tool page - this handles edge cases where a tool conversation
        // wasn't typed as TOOL_CONVERSATION. The tool slug is in scope.id
        window.location.href = `/tools/${scope.id}?conversationId=${id}`;
        return; // Exit early since we're doing a full page navigation
      } else {
        // PLATFORM or unknown scope type - default to Prometheus
        setActiveCollectionId('prometheus');
        setActiveCourseId(null);
      }
    } else {
      // No scope metadata - default to Prometheus (general AI)
      setActiveCollectionId('prometheus');
    }

    setActiveConversationId(id);
    setRightOpen(true);
  };

  // Navigation & Collection State
  const [activeCollectionId, setActiveCollectionId] = useState<string>(collectionParam || 'dashboard');
  // Navigation history stack for multi-level back support
  const navigationHistoryRef = useRef<string[]>([]);
  // Keep previousCollectionId as a computed value for backwards compatibility
  const previousCollectionId = navigationHistoryRef.current.length > 0
    ? navigationHistoryRef.current[navigationHistoryRef.current.length - 1]
    : null;

  // Get navigation context for registering back handlers
  const navigation = useNavigationSafe();

  // Go back to previous collection (pops from navigation stack)
  const handleGoBack = useCallback(() => {
    if (navigationHistoryRef.current.length > 0) {
      const previousId = navigationHistoryRef.current.pop()!;
      setActiveCollectionId(previousId);
    }
  }, []);

  // Open help panel with specific topic
  const handleOpenHelp = useCallback((topicId: string) => {
    setHelpTopicId(topicId as HelpTopicId);
    setIsHelpOpen(true);
  }, []);

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

  const contextScope = useMemo<ContextScope>(() => {
    if (activeCourseId) {
      return { type: 'COURSE', id: activeCourseId };
    }
    if (['dashboard', 'favorites', 'recents'].includes(activeCollectionId)) {
      return { type: 'PLATFORM' };
    }
    if (activeCollectionId === 'academy') {
      return { type: 'COLLECTION', id: 'academy' };
    }
    if (['users-and-groups', 'org-team'].includes(activeCollectionId)) {
      return { type: 'USER', id: 'all-users' };
    }
    if (activeCollectionId.startsWith('group-')) {
      return { type: 'USER', id: activeCollectionId.replace('group-', '') };
    }
    return { type: 'COLLECTION', id: activeCollectionId };
  }, [activeCourseId, activeCollectionId]);

  // Get the title of the active collection for the AI Panel header
  const contextTitle = useMemo(() => {
    if (activeCourseId) return undefined; // Course scope doesn't use contextTitle
    if (activeCollectionId === 'dashboard') return undefined; // Dashboard uses platform assistant

    // Map system collection IDs to display names
    const systemCollectionTitles: Record<string, string> = {
      'academy': 'Academy',
      'personal-context': 'Personal Context',
      'tools': 'Tools',
      'help': 'Help',
      'conversations': 'Conversations',
      'notes': 'Notes',
      'favorites': 'Favorites',
      'research': 'Workspace',
      'to_learn': 'Watchlist',
      'users-and-groups': 'Users and Groups',
      'org-team': 'Team',
      'org-analytics': 'Analytics',
      'org-collections': 'Company Collections',
      'assigned-learning': 'Assigned Learning',
      'recents': 'Recent Activity',
      'personal-insights': 'Personal Insights',
    };

    // Check system collections first
    if (systemCollectionTitles[activeCollectionId]) {
      return systemCollectionTitles[activeCollectionId];
    }

    // Check for group view (group-{id})
    if (activeCollectionId.startsWith('group-')) {
      // Use actual group name from MainCanvas callback
      return viewingGroupName || 'Group';
    }

    // Find in custom collections
    const customCollection = customCollections.find(c => c.id === activeCollectionId);
    if (customCollection) return customCollection.label;

    // Find in org collections
    const orgCollection = orgCollections.find(c => c.id === activeCollectionId);
    if (orgCollection) return orgCollection.label;

    return undefined;
  }, [activeCourseId, activeCollectionId, customCollections, orgCollections, viewingGroupName]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden font-sans selection:bg-brand-blue-light/30 selection:text-white bg-[#0A0D12]">

      {/* Global Background System */}
      <BackgroundSystem theme={currentTheme} />

      {/* Global Modals */}
      {isAddModalOpen && (
        <AddCollectionModal
          item={modalItem}
          availableCollections={customCollections}
          orgCollections={orgCollections}
          isOrgAdmin={isOrgAdmin}
          onClose={() => {
            setIsAddModalOpen(false);
            setModalItem(null);
          }}
          onSave={handleSaveToCollection}
        />
      )}

      {/* New Org Collection Modal */}
      <NewOrgCollectionModal
        isOpen={isNewOrgCollectionModalOpen}
        onClose={() => setIsNewOrgCollectionModalOpen(false)}
        onSuccess={async () => {
          const { getOrgCollections } = await import('@/app/actions/org');
          const updated = await getOrgCollections();
          setOrgCollections(updated);
        }}
      />

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
          orgMemberCount={orgMemberCount}
          orgCollections={orgCollections}
          orgId={userOrgId || undefined}
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
          onClearConversation={() => setActiveConversationId(null)}
          useDashboardV3={true}
          onCollectionUpdate={() => {
            if (user) refreshCollectionsAndCounts(user.id);
          }}
          academyResetKey={academyResetKey}
          initialStatusFilter={initialStatusFilter}
          onNavigateWithFilter={handleNavigateWithFilter}
          previousCollectionId={previousCollectionId}
          onGoBack={handleGoBack}
          onExposeDragStart={handleExposeDragStart}
          orgCollections={orgCollections}
          isOrgAdmin={isOrgAdmin}
          onOrgCollectionsUpdate={async () => {
            const { getOrgCollections } = await import('@/app/actions/org');
            const updated = await getOrgCollections();
            setOrgCollections(updated);
          }}
          onViewingGroupChange={setViewingGroupName}
          hasOrgCourses={hasOrgCourses}
          orgMemberCount={orgMemberCount}
          initialInsightId={initialInsightId}
          onNavigateToInsight={handleNavigateToInsight}
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
                : (activeCollectionId === 'dashboard' || activeCollectionId === 'my-org')
                  ? 'platform_assistant'
                  : activeCollectionId === 'personal-insights'
                    ? 'personal_insights_agent'
                    : ['users-and-groups', 'org-team'].includes(activeCollectionId)
                      ? 'team_analytics_assistant'
                      : 'collection_assistant'
            }
            contextScope={contextScope}
            contextTitle={contextTitle}
            conversationId={activeConversationId}
            onConversationIdChange={setActiveConversationId}
            onAddConversationToCollection={handleAddConversationToCollection}
            onAddNoteToCollection={handleAddNoteToCollection}
            onNoteDragStart={handleNoteDragStart}
            onOpenHelp={handleOpenHelp}
          />
        )}
      </div>

      {/* Help Panel */}
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        topicId={helpTopicId}
      />

      {/* Onboarding Modal - Shows for new users */}
      {!dashboardLoading && showOnboarding && user && (
        <OnboardingModal
          isOpen={showOnboarding}
          onClose={dismissOnboarding}
          onComplete={completeOnboarding}
          userId={user.id}
          userName={onboardingProfile?.full_name || undefined}
          currentAvatarUrl={onboardingProfile?.avatar_url}
        />
      )}
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
