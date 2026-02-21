'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrgContext, OrgContext } from '@/lib/org-context';
import { Course, Collection } from '@/types';
// ============================================
// Types
// ============================================

export interface DashboardData {
  user: { id: string; email: string } | null;
  courses: Course[];
  collections: Collection[];
  collectionCounts: Record<string, number>;
  orgMemberCount: number;
  orgCollections: { id: string; label: string; color: string; is_required: boolean; due_date: string | null; item_count: number }[];
  isOrgAdmin: boolean;
  orgId: string | null;
  hasOrgCourses: boolean;
  onboardingProfile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    onboarding_completed_at: string | null;
    onboarding_skipped_at: string | null;
  } | null;
}

// ============================================
// System Collection Constants
// ============================================

const SYSTEM_COLLECTION_IDS: Record<string, string> = {
  favorites: 'Favorites',
  research: 'Workspace',
  to_learn: 'Watchlist',
  'personal-context': 'Personal Context',
  'personal-insights': 'Personal Insights',
};

const SYSTEM_COLORS: Record<string, string> = {
  favorites: '#FF2600',
  research: '#FF9300',
  to_learn: '#78C0F0',
  'personal-context': '#64748B',
  'personal-insights': '#A78BFA',
};

// ============================================
// Main Server Action
// ============================================

export async function getDashboardDataAction(): Promise<DashboardData> {
  noStore();

  // 1. Get authenticated user ONCE
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      courses: [],
      collections: [],
      collectionCounts: {},
      orgMemberCount: 0,
      orgCollections: [],
      isOrgAdmin: false,
      orgId: null,
      hasOrgCourses: false,
      onboardingProfile: null,
    };
  }

  const userId = user.id;

  // 2. Get org context ONCE
  const orgContext = await getOrgContext();

  // 3. Create admin client ONCE
  const admin = createAdminClient();

  // 4. Ensure system collections exist (prerequisite for other queries)
  await ensureSystemCollectionsInternal(supabase, userId);

  // 5. Run all data fetches in parallel
  const [
    courses,
    collections,
    collectionCounts,
    orgMemberCount,
    orgCollections,
    hasOrgCourses,
    onboardingProfile,
  ] = await Promise.all([
    fetchCoursesInternal(supabase, userId),
    fetchUserCollectionsInternal(supabase, userId),
    fetchCollectionCountsInternal(admin, userId),
    fetchOrgMemberCountInternal(admin, orgContext),
    fetchOrgCollectionsInternal(admin, orgContext),
    fetchHasPublishedOrgCoursesInternal(supabase, orgContext),
    fetchOnboardingProfileInternal(supabase, userId),
  ]);

  return {
    user: { id: userId, email: user.email || '' },
    courses,
    collections,
    collectionCounts,
    orgMemberCount,
    orgCollections,
    isOrgAdmin: orgContext?.isOrgAdmin || orgContext?.isPlatformAdmin || false,
    orgId: orgContext?.orgId || null,
    hasOrgCourses,
    onboardingProfile,
  };
}

// ============================================
// Internal Helpers (reuse pre-created clients)
// ============================================

/**
 * Ensure system collections exist for the user.
 * Creates Favorites, Workspace, Watchlist, Personal Context, Personal Insights if missing.
 */
async function ensureSystemCollectionsInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<void> {
  const systemLabels = Object.values(SYSTEM_COLLECTION_IDS);

  const { data: existing } = await supabase
    .from('user_collections')
    .select('id, label')
    .eq('user_id', userId)
    .in('label', systemLabels);

  const existingLabels = (existing || []).map((c: any) => c.label);

  const toCreate = Object.entries(SYSTEM_COLLECTION_IDS).filter(
    ([, label]) => !existingLabels.includes(label)
  );

  for (const [key, label] of toCreate) {
    const color = SYSTEM_COLORS[key] || '#3b82f6';

    await supabase
      .from('user_collections')
      .insert({
        user_id: userId,
        label,
        color,
        is_custom: false,
      })
      .select()
      .single();
  }
}

/**
 * Fetch published courses with collection membership data.
 */
async function fetchCoursesInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Course[]> {
  // Fetch published courses with author profile
  const { data: coursesData, error } = await supabase
    .from('courses')
    .select(`
      *,
      author_profile:author_id (
        id,
        full_name,
        expert_title,
        author_bio,
        avatar_url,
        credentials
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getDashboardData] Error fetching courses:', error);
    return [];
  }

  // Build collection membership map
  let collectionMap: Record<string, string[]> = {};
  let uuidToSystemMap: Record<string, string> = {};

  // Fetch user collections for label-to-key mapping
  const { data: userCollections } = await supabase
    .from('user_collections')
    .select('id, label')
    .eq('user_id', userId);

  const labelToKeyMap: Record<string, string> = {
    'Favorites': 'favorites',
    'Workspace': 'research',
    'Watchlist': 'to_learn',
    'Personal Context': 'personal-context',
  };

  userCollections?.forEach((col: any) => {
    if (labelToKeyMap[col.label]) {
      uuidToSystemMap[col.id] = labelToKeyMap[col.label];
    }
  });

  // Fetch collection items with user ownership join
  const { data: items } = await supabase
    .from('collection_items')
    .select('collection_id, course_id, user_collections!inner(user_id)')
    .eq('user_collections.user_id', userId);

  items?.forEach((item: any) => {
    const colId = item.collection_id;
    if (item.course_id != null) {
      const cId = item.course_id.toString();
      if (!collectionMap[colId]) collectionMap[colId] = [];
      collectionMap[colId].push(cId);
    }
  });

  const getCollectionsForCourse = (courseId: number): string[] => {
    const result: string[] = [];
    for (const [colId, courseIds] of Object.entries(collectionMap)) {
      if (courseIds.includes(courseId.toString())) {
        const systemKey = uuidToSystemMap[colId];
        result.push(systemKey || colId);
      }
    }
    return result;
  };

  return coursesData.map((course: any) => {
    const courseCollections = getCollectionsForCourse(course.id);
    const authorProfile = course.author_profile;

    return {
      type: 'COURSE' as const,
      id: course.id,
      title: course.title,
      author: course.author,
      authorDetails: authorProfile
        ? {
            id: authorProfile.id,
            name: authorProfile.full_name || course.author,
            title: authorProfile.expert_title,
            bio: authorProfile.author_bio,
            avatar: authorProfile.avatar_url,
            credentials: authorProfile.credentials,
          }
        : undefined,
      progress: 0,
      category: course.category,
      categories: course.categories || (course.category ? [course.category] : ['General']),
      image: course.image_url,
      description: course.description,
      duration: course.duration,
      rating: Number(course.rating),
      badges: course.badges || [],
      shrm_pdcs: course.shrm_pdcs,
      hrci_credits: course.hrci_credits,
      shrm_activity_id: course.shrm_activity_id,
      hrci_program_id: course.hrci_program_id,
      shrm_eligible: course.shrm_eligible,
      hrci_eligible: course.hrci_eligible,
      isSaved: courseCollections.length > 0,
      collections: courseCollections,
      dateAdded: course.created_at,
    };
  });
}

/**
 * Fetch user's personal collections (excludes org collections).
 */
async function fetchUserCollectionsInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Collection[]> {
  const { data, error } = await supabase
    .from('user_collections')
    .select('*')
    .eq('user_id', userId)
    .or('is_org_collection.is.null,is_org_collection.eq.false')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[getDashboardData] Error fetching user collections:', error);
    return [];
  }

  return data.map((col: any) => ({
    id: col.id,
    label: col.label,
    color: col.color,
    isCustom: col.is_custom,
  }));
}

/**
 * Fetch collection counts using admin client (bypasses RLS).
 * Mirrors logic from getCollectionCountsAction.
 */
async function fetchCollectionCountsInternal(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  // Fetch user collections for alias mapping (exclude org collections)
  const { data: userCollections, error: userCollError } = await admin
    .from('user_collections')
    .select('id, label, is_custom, created_at')
    .eq('user_id', userId)
    .or('is_org_collection.is.null,is_org_collection.eq.false')
    .order('created_at', { ascending: true });

  if (userCollError) {
    console.error('[getDashboardData] Error fetching user collections for counts:', userCollError);
  }

  // Build UUID -> Alias map (first/oldest collection for each label wins)
  const uuidToAlias: Record<string, string> = {};
  const aliasToUuid: Record<string, string> = {};
  const labelToAlias: Record<string, string> = {
    'favorites': 'favorites',
    'workspace': 'research',
    'watchlist': 'to_learn',
    'personal context': 'personal-context',
  };

  let personalContextId: string | null = null;

  if (userCollections) {
    userCollections.forEach((c: any) => {
      const lowerLabel = c.label?.toLowerCase().trim();

      if (lowerLabel === 'personal context' && !personalContextId) {
        personalContextId = c.id;
      }

      if (lowerLabel && labelToAlias[lowerLabel]) {
        const alias = labelToAlias[lowerLabel];
        if (!aliasToUuid[alias]) {
          uuidToAlias[c.id] = alias;
          aliasToUuid[alias] = c.id;
        }
      }
    });
  }

  // 1. Count items from collection_items table
  const { data: collectionItems, error: itemsError } = await admin
    .from('collection_items')
    .select('collection_id, item_type, item_id')
    .in('collection_id', userCollections?.map(c => c.id) || []);

  if (itemsError) {
    console.error('[getDashboardData] Error fetching collection items:', itemsError);
  }

  if (collectionItems) {
    collectionItems.forEach((item: any) => {
      const id = item.collection_id;
      counts[id] = (counts[id] || 0) + 1;
    });
  }

  // 2. Count context items (exclude org collection items)
  const { data: orgCollections } = await admin
    .from('user_collections')
    .select('id')
    .eq('is_org_collection', true);
  const orgCollectionIds = new Set((orgCollections || []).map((c: any) => c.id));

  const { data: contextItems, error: contextError } = await admin
    .from('user_context_items')
    .select('collection_id, type')
    .eq('user_id', userId)
    .not('collection_id', 'is', null);

  if (contextError) {
    console.error('[getDashboardData] Error fetching context items:', contextError);
  }

  if (contextItems) {
    contextItems.forEach((item: any) => {
      const id = item.collection_id;
      if (id && !orgCollectionIds.has(id)) {
        counts[id] = (counts[id] || 0) + 1;
      }
    });
  }

  // 3. Count conversations
  const { data: conversations, error: conversationsError } = await admin
    .from('conversations')
    .select('id, metadata')
    .eq('user_id', userId);

  if (conversationsError) {
    console.error('[getDashboardData] Error fetching conversations:', conversationsError);
  }

  if (conversations) {
    counts['conversations'] = conversations.length;

    // Build set of conversations already counted via collection_items
    const linkedConversationIds = new Set<string>();
    if (collectionItems) {
      collectionItems
        .filter((item: any) => item.item_type === 'CONVERSATION')
        .forEach((item: any) => {
          linkedConversationIds.add(`${item.collection_id}:${item.item_id}`);
        });
    }

    // Count conversations from metadata.collection_ids (legacy) if not already in collection_items
    conversations.forEach((conv: any) => {
      const metadataCollections = conv.metadata?.collection_ids || conv.metadata?.collections;
      if (Array.isArray(metadataCollections)) {
        metadataCollections.forEach((cId: string) => {
          if (!linkedConversationIds.has(`${cId}:${conv.id}`)) {
            counts[cId] = (counts[cId] || 0) + 1;
          }
        });
      }
    });
  }

  // 4. Count certifications (courses with badges)
  const { count: certificationCount, error: certError } = await admin
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .not('badges', 'is', null)
    .neq('badges', '{}');

  if (!certError && certificationCount !== null) {
    counts['certifications'] = certificationCount;
  }

  // 4b. Count notes (personal only, exclude org notes)
  const { count: notesCount, error: notesError } = await admin
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('org_id', null);

  if (!notesError && notesCount !== null) {
    counts['notes'] = notesCount;
  }

  // 5. Virtual profile count for Personal Context
  if (personalContextId) {
    const hasProfileItem = contextItems?.some(
      (i: any) => i.collection_id === personalContextId && i.type === 'PROFILE'
    );
    if (!hasProfileItem) {
      counts[personalContextId] = (counts[personalContextId] || 0) + 1;
    }
  }

  // 6. Map UUID counts to system aliases
  userCollections?.forEach((col: any) => {
    const alias = uuidToAlias[col.id];
    if (alias && counts[col.id] !== undefined) {
      counts[alias] = counts[col.id];
    }
  });

  return counts;
}

/**
 * Fetch org member count.
 */
async function fetchOrgMemberCountInternal(
  admin: ReturnType<typeof createAdminClient>,
  orgContext: OrgContext | null
): Promise<number> {
  if (!orgContext?.orgId) {
    return 0;
  }

  const { count, error } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgContext.orgId);

  if (error) {
    console.error('[getDashboardData] Error fetching org member count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Fetch org collections with item counts.
 */
async function fetchOrgCollectionsInternal(
  admin: ReturnType<typeof createAdminClient>,
  orgContext: OrgContext | null
): Promise<{ id: string; label: string; color: string; is_required: boolean; due_date: string | null; item_count: number }[]> {
  if (!orgContext?.orgId) {
    return [];
  }

  const { data: collections, error } = await admin
    .from('user_collections')
    .select(`
      id,
      label,
      color,
      collection_items(count)
    `)
    .eq('org_id', orgContext.orgId)
    .eq('is_org_collection', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getDashboardData] Error fetching org collections:', error);
    return [];
  }

  return (collections || []).map((col: any) => ({
    id: col.id,
    label: col.label,
    color: col.color || '#64748B',
    is_required: false,
    due_date: null,
    item_count: (col.collection_items as any)?.[0]?.count || 0,
  }));
}

/**
 * Check if org has any published courses.
 */
async function fetchHasPublishedOrgCoursesInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgContext: OrgContext | null
): Promise<boolean> {
  if (!orgContext?.orgId) {
    return false;
  }

  const { count, error } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgContext.orgId)
    .eq('status', 'published')
    .limit(1);

  if (error) {
    console.error('[getDashboardData] Error checking published org courses:', error);
    return false;
  }

  return (count || 0) > 0;
}

/**
 * Fetch onboarding profile fields.
 */
async function fetchOnboardingProfileInternal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  onboarding_completed_at: string | null;
  onboarding_skipped_at: string | null;
} | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, onboarding_completed_at, onboarding_skipped_at')
    .eq('id', userId)
    .single();

  return profile;
}
