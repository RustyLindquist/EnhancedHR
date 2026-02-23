'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { ActivityCategoryData } from './personal-activity';

// ============================================================================
// Types
// ============================================================================

export interface PlatformActivityFilters {
  startDate: string;
  endDate: string;
  includeHeatmap?: boolean;
}

export interface PlatformActivityStats {
  totalLogins: number;
  totalAiInteractions: number;
  totalCollectionUsage: number;
  totalNotes: number;
  totalPersonalContext: number;
  totalCustomContent: number;
  totalWatchTimeMinutes: number;
  totalCreditsEarned: number;
  totalCoursesCompleted: number;
  totalLessonsCompleted: number;
  activeUsers: number;
}

export interface PlatformActivityData {
  stats: PlatformActivityStats;
  dailyActivity: ActivityCategoryData[];
  heatmapData: { date: string; count: number }[];
}

// ============================================================================
// Helpers
// ============================================================================

function getAllDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function toDateStr(timestamp: string): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

type DailyBucket = {
  logins: number;
  aiInteractions: number;
  collectionUsage: number;
  notes: number;
  personalContext: number;
  customContent: number;
  watchTimeMinutes: number;
  creditsEarned: number;
  coursesCompleted: number;
  lessonsCompleted: number;
};

function emptyBucket(): DailyBucket {
  return {
    logins: 0,
    aiInteractions: 0,
    collectionUsage: 0,
    notes: 0,
    personalContext: 0,
    customContent: 0,
    watchTimeMinutes: 0,
    creditsEarned: 0,
    coursesCompleted: 0,
    lessonsCompleted: 0,
  };
}

// ============================================================================
// Main Server Action — Platform-wide (no user filter)
// ============================================================================

export async function fetchPlatformActivityData(
  filters: PlatformActivityFilters
): Promise<PlatformActivityData> {
  const supabase = createAdminClient();
  const { startDate, endDate, includeHeatmap = true } = filters;

  const startISO = `${startDate}T00:00:00.000Z`;
  const endISO = `${endDate}T23:59:59.999Z`;

  // Heatmap date range (always 91 days, independent of filter range)
  let heatmapStartDate = '';
  let heatmapEndDate = '';
  if (includeHeatmap) {
    const ninetyOneDaysAgo = new Date();
    ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91);
    heatmapStartDate = ninetyOneDaysAgo.toISOString().split('T')[0];
    heatmapEndDate = new Date().toISOString().split('T')[0];
  }
  const heatmapStartISO = `${heatmapStartDate}T00:00:00.000Z`;
  const heatmapEndISO = `${heatmapEndDate}T23:59:59.999Z`;

  const emptyResult = Promise.resolve({ data: [] as any[] });

  // All queries platform-wide (no .eq('user_id', ...))
  const [
    loginsResult,
    aiResult,
    collectionItemsResult,
    collectionsCreatedResult,
    notesResult,
    personalContextResult,
    customContentResult,
    progressResult,
    creditsResult,
    certsResult,
    heatLogins,
    heatAI,
    heatNotes,
    heatContext,
    heatProgress,
  ] = await Promise.all([
    // 1. Logins (include user_id for active user counting)
    supabase
      .from('login_events')
      .select('created_at, user_id')
      .gte('created_at', startISO)
      .lte('created_at', endISO),

    // 2. AI Interactions
    supabase
      .from('ai_logs')
      .select('created_at, user_id')
      .gte('created_at', startISO)
      .lte('created_at', endISO),

    // 3. Collection items added (all collections, no user filter)
    supabase
      .from('collection_items')
      .select('added_at')
      .gte('added_at', startISO)
      .lte('added_at', endISO),

    // 3b. Collections created
    supabase
      .from('user_collections')
      .select('created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO),

    // 4. Notes
    supabase
      .from('notes')
      .select('created_at')
      .gte('created_at', startISO)
      .lte('created_at', endISO),

    // 5. Personal Context
    supabase
      .from('user_context_items')
      .select('created_at')
      .in('type', ['CUSTOM_CONTEXT', 'PROFILE'])
      .gte('created_at', startISO)
      .lte('created_at', endISO),

    // 6. Custom Content
    supabase
      .from('user_context_items')
      .select('created_at')
      .in('type', ['FILE', 'VIDEO', 'AI_INSIGHT'])
      .gte('created_at', startISO)
      .lte('created_at', endISO),

    // 7. Watch time + lessons completed (include user_id for active users)
    supabase
      .from('user_progress')
      .select('last_accessed, view_time_seconds, is_completed, lesson_id, user_id')
      .gte('last_accessed', startISO)
      .lte('last_accessed', endISO),

    // 8. Credits earned
    supabase
      .from('user_credits_ledger')
      .select('created_at, amount')
      .gte('created_at', startISO)
      .lte('created_at', endISO),

    // 9. Courses completed
    supabase
      .from('certificates')
      .select('issued_at')
      .gte('issued_at', startISO)
      .lte('issued_at', endISO),

    // === Heatmap queries (91-day fixed range) ===
    includeHeatmap ? supabase
      .from('login_events')
      .select('created_at')
      .gte('created_at', heatmapStartISO)
      .lte('created_at', heatmapEndISO) : emptyResult,
    includeHeatmap ? supabase
      .from('ai_logs')
      .select('created_at')
      .gte('created_at', heatmapStartISO)
      .lte('created_at', heatmapEndISO) : emptyResult,
    includeHeatmap ? supabase
      .from('notes')
      .select('created_at')
      .gte('created_at', heatmapStartISO)
      .lte('created_at', heatmapEndISO) : emptyResult,
    includeHeatmap ? supabase
      .from('user_context_items')
      .select('created_at')
      .gte('created_at', heatmapStartISO)
      .lte('created_at', heatmapEndISO) : emptyResult,
    includeHeatmap ? supabase
      .from('user_progress')
      .select('last_accessed')
      .gte('last_accessed', heatmapStartISO)
      .lte('last_accessed', heatmapEndISO) : emptyResult,
  ]);

  // Collect unique active user IDs
  const activeUserIds = new Set<string>();
  (loginsResult.data || []).forEach((r: any) => { if (r.user_id) activeUserIds.add(r.user_id); });
  (aiResult.data || []).forEach((r: any) => { if (r.user_id) activeUserIds.add(r.user_id); });
  (progressResult.data || []).forEach((r: any) => { if (r.user_id) activeUserIds.add(r.user_id); });

  // Build daily buckets
  const allDates = getAllDatesInRange(startDate, endDate);
  const buckets = new Map<string, DailyBucket>();
  allDates.forEach(d => buckets.set(d, emptyBucket()));

  const addToBucket = (date: string, key: keyof DailyBucket, amount: number = 1) => {
    if (!buckets.has(date)) buckets.set(date, emptyBucket());
    buckets.get(date)![key] += amount;
  };

  (loginsResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.created_at), 'logins'));
  (aiResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.created_at), 'aiInteractions'));
  (collectionItemsResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.added_at), 'collectionUsage'));
  (collectionsCreatedResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.created_at), 'collectionUsage'));
  (notesResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.created_at), 'notes'));
  (personalContextResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.created_at), 'personalContext'));
  (customContentResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.created_at), 'customContent'));

  (progressResult.data || []).forEach((r: any) => {
    if (r.last_accessed) {
      const date = toDateStr(r.last_accessed);
      const minutes = Math.round((r.view_time_seconds || 0) / 60);
      if (minutes > 0) addToBucket(date, 'watchTimeMinutes', minutes);
      if (r.is_completed && r.lesson_id) addToBucket(date, 'lessonsCompleted');
    }
  });

  (creditsResult.data || []).forEach((r: any) => {
    addToBucket(toDateStr(r.created_at), 'creditsEarned', Number(r.amount) || 0);
  });

  (certsResult.data || []).forEach((r: any) => addToBucket(toDateStr(r.issued_at), 'coursesCompleted'));

  // Convert buckets to dailyActivity array
  const dailyActivity: ActivityCategoryData[] = allDates.map(date => ({
    date,
    ...buckets.get(date)!,
  }));

  // Compute stats
  const stats: PlatformActivityStats = {
    totalLogins: 0,
    totalAiInteractions: 0,
    totalCollectionUsage: 0,
    totalNotes: 0,
    totalPersonalContext: 0,
    totalCustomContent: 0,
    totalWatchTimeMinutes: 0,
    totalCreditsEarned: 0,
    totalCoursesCompleted: 0,
    totalLessonsCompleted: 0,
    activeUsers: activeUserIds.size,
  };
  dailyActivity.forEach(day => {
    stats.totalLogins += day.logins;
    stats.totalAiInteractions += day.aiInteractions;
    stats.totalCollectionUsage += day.collectionUsage;
    stats.totalNotes += day.notes;
    stats.totalPersonalContext += day.personalContext;
    stats.totalCustomContent += day.customContent;
    stats.totalWatchTimeMinutes += day.watchTimeMinutes;
    stats.totalCreditsEarned += day.creditsEarned;
    stats.totalCoursesCompleted += day.coursesCompleted;
    stats.totalLessonsCompleted += day.lessonsCompleted;
  });

  // Heatmap data
  const heatmapCounts = new Map<string, number>();
  const allHeatmapDates = getAllDatesInRange(heatmapStartDate, heatmapEndDate);
  allHeatmapDates.forEach(d => heatmapCounts.set(d, 0));

  const addHeat = (date: string) => {
    heatmapCounts.set(date, (heatmapCounts.get(date) || 0) + 1);
  };

  (heatLogins.data || []).forEach((r: any) => addHeat(toDateStr(r.created_at)));
  (heatAI.data || []).forEach((r: any) => addHeat(toDateStr(r.created_at)));
  (heatNotes.data || []).forEach((r: any) => addHeat(toDateStr(r.created_at)));
  (heatContext.data || []).forEach((r: any) => addHeat(toDateStr(r.created_at)));
  (heatProgress.data || []).forEach((r: any) => {
    if (r.last_accessed) addHeat(toDateStr(r.last_accessed));
  });

  const heatmapData = allHeatmapDates.map(date => ({
    date,
    count: heatmapCounts.get(date) || 0,
  }));

  return { stats, dailyActivity, heatmapData };
}
