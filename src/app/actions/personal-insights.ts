'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { generateOpenRouterResponse } from '@/app/actions/ai';
import { updateContextEmbeddings, embedContextItem } from '@/lib/context-embeddings';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PersonalInsight {
  id: string;
  user_id: string;
  title: string;
  summary: string;
  full_content: string;
  category: 'growth_opportunity' | 'learning_pattern' | 'strength' | 'connection' | 'goal_alignment' | 'recommendation';
  confidence: 'high' | 'medium' | 'low';
  source_summary: {
    conversations?: number;
    courses?: number;
    contextItems?: number;
    notes?: number;
    aiInteractions?: number;
    certificates?: number;
  };
  reaction: 'helpful' | 'not_helpful' | null;
  status: 'active' | 'saved' | 'dismissed' | 'expired';
  generated_at: string;
  saved_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

// ── 1. generatePersonalInsights ──────────────────────────────────────────────

export async function generatePersonalInsights(userId: string): Promise<PersonalInsight[]> {
  try {
    const supabase = createAdminClient();

    // ── a) Gather ALL user data in parallel ──────────────────────────────────

    const [
      { data: conversations },
      { data: contextItems },
      { data: courseProgress },
      { data: certificates },
      { data: aiLogs },
      { data: notes },
      { data: creditsLedger },
      { data: pastReactions },
    ] = await Promise.all([
      supabase
        .from('conversations')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('user_context_items')
        .select('type, title, content, created_at')
        .eq('user_id', userId),
      supabase
        .from('user_progress')
        .select('course_id, lesson_id, view_time_seconds, is_completed, last_accessed')
        .eq('user_id', userId),
      supabase
        .from('certificates')
        .select('course_id, issued_at')
        .eq('user_id', userId),
      supabase
        .from('ai_logs')
        .select('agent_type, page_context, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('notes')
        .select('title, content, course_id, lesson_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('user_credits_ledger')
        .select('amount, description, created_at')
        .eq('user_id', userId),
      // Past reactions for feedback loop
      supabase
        .from('personal_insights')
        .select('title, summary, category, reaction, status, generated_at')
        .eq('user_id', userId)
        .or('reaction.neq.null,status.eq.dismissed')
        .order('generated_at', { ascending: false })
        .limit(50),
    ]);

    // Edge case: user with no data at all
    const hasAnyData =
      (conversations?.length ?? 0) > 0 ||
      (contextItems?.length ?? 0) > 0 ||
      (courseProgress?.length ?? 0) > 0 ||
      (certificates?.length ?? 0) > 0 ||
      (aiLogs?.length ?? 0) > 0 ||
      (notes?.length ?? 0) > 0;

    if (!hasAnyData) {
      return [];
    }

    // Batch-fetch conversation messages for all conversations at once
    const convIds = (conversations || []).map((c) => c.id);
    let allMessages: { conversation_id: string; role: string; content: string; created_at: string }[] = [];
    if (convIds.length > 0) {
      const { data: msgs } = await supabase
        .from('conversation_messages')
        .select('conversation_id, role, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: true });
      allMessages = msgs || [];
    }

    // Group messages by conversation and keep last 5 per conversation
    const messagesByConv = new Map<string, typeof allMessages>();
    for (const msg of allMessages) {
      const existing = messagesByConv.get(msg.conversation_id) || [];
      existing.push(msg);
      messagesByConv.set(msg.conversation_id, existing);
    }
    for (const [convId, msgs] of messagesByConv) {
      messagesByConv.set(convId, msgs.slice(-5));
    }

    // Collect all unique course IDs and fetch course info in a single query
    const courseIdSet = new Set<string>();
    (courseProgress || []).forEach((p) => { if (p.course_id) courseIdSet.add(p.course_id); });
    (certificates || []).forEach((c) => { if (c.course_id) courseIdSet.add(c.course_id); });
    (notes || []).forEach((n) => { if (n.course_id) courseIdSet.add(n.course_id); });

    const courseIds = Array.from(courseIdSet);
    let coursesMap = new Map<string, { id: string; title: string; category: string; duration: number; author: string }>();
    if (courseIds.length > 0) {
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, title, category, duration, author')
        .in('id', courseIds);
      (coursesData || []).forEach((c) => coursesMap.set(c.id, c));
    }

    // ── b) Count source items ────────────────────────────────────────────────

    const sourceSummary = {
      conversations: (conversations || []).length,
      courses: (courseProgress || []).length,
      contextItems: (contextItems || []).length,
      notes: (notes || []).length,
      aiInteractions: (aiLogs || []).length,
      certificates: (certificates || []).length,
    };

    // ── c) Build structured prompt ───────────────────────────────────────────

    let promptSections: string[] = [];
    promptSections.push('Analyze the following user data and generate personalized insights.\n');

    // User context
    promptSections.push('=== USER PROFILE & CONTEXT ===');
    if ((contextItems || []).length > 0) {
      for (const item of contextItems || []) {
        const contentPreview = typeof item.content === 'string'
          ? item.content.slice(0, 200)
          : JSON.stringify(item.content).slice(0, 200);
        promptSections.push(`- [${item.type}] ${item.title}: ${contentPreview}`);
      }
    } else {
      promptSections.push('No context items set.');
    }
    promptSections.push('');

    // Learning activity
    promptSections.push('=== LEARNING ACTIVITY ===');

    const completedCourseIds = new Set((certificates || []).map((c) => c.course_id));
    const inProgressCourses = (courseProgress || []).filter((p) => !completedCourseIds.has(p.course_id));

    // Group progress by course to compute completion %
    const progressByCourse = new Map<string, typeof courseProgress>();
    for (const p of courseProgress || []) {
      const existing = progressByCourse.get(p.course_id) || [];
      existing.push(p);
      progressByCourse.set(p.course_id, existing);
    }

    if (inProgressCourses.length > 0) {
      const uniqueInProgress = new Set(inProgressCourses.map((p) => p.course_id));
      promptSections.push('Courses In Progress:');
      for (const cid of uniqueInProgress) {
        const course = coursesMap.get(cid);
        const progress = progressByCourse.get(cid) || [];
        const completedLessons = progress.filter((p) => p.is_completed).length;
        const totalLessons = progress.length;
        const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        const lastAccessed = progress.reduce((latest, p) => {
          return p.last_accessed && p.last_accessed > latest ? p.last_accessed : latest;
        }, '');
        promptSections.push(`  - ${course?.title || cid} (${pct}% complete, last accessed ${lastAccessed || 'unknown'})`);
      }
    }

    if ((certificates || []).length > 0) {
      promptSections.push('Courses Completed:');
      for (const cert of certificates || []) {
        const course = coursesMap.get(cert.course_id);
        promptSections.push(`  - ${course?.title || cert.course_id} (completed ${cert.issued_at})`);
      }
    }

    const totalWatchSeconds = (courseProgress || []).reduce((sum, p) => sum + (p.view_time_seconds || 0), 0);
    const watchHours = Math.floor(totalWatchSeconds / 3600);
    const watchMinutes = Math.floor((totalWatchSeconds % 3600) / 60);
    promptSections.push(`Total Watch Time: ${watchHours}h ${watchMinutes}m`);

    const totalCredits = (creditsLedger || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    promptSections.push(`Credits Earned: ${totalCredits} total`);
    promptSections.push(`Certificates: ${(certificates || []).length} earned`);
    promptSections.push('');

    // Conversation history
    promptSections.push('=== CONVERSATION HISTORY (Last 50) ===');
    if ((conversations || []).length > 0) {
      for (const conv of conversations || []) {
        const msgs = messagesByConv.get(conv.id) || [];
        promptSections.push(`- ${conv.title || 'Untitled'} | ${msgs.length} messages | ${conv.created_at}`);
        // Include last 2-3 messages for context
        const recentMsgs = msgs.slice(-3);
        for (const msg of recentMsgs) {
          const contentPreview = (msg.content || '').slice(0, 300);
          promptSections.push(`    [${msg.role}]: ${contentPreview}`);
        }
      }
    } else {
      promptSections.push('No conversations.');
    }
    promptSections.push('');

    // AI interaction patterns
    promptSections.push('=== AI INTERACTION PATTERNS ===');
    promptSections.push(`Total interactions: ${(aiLogs || []).length}`);
    const agentUsage = new Map<string, number>();
    for (const log of aiLogs || []) {
      const agent = log.agent_type || 'unknown';
      agentUsage.set(agent, (agentUsage.get(agent) || 0) + 1);
    }
    const agentUsageStr = Array.from(agentUsage.entries())
      .map(([agent, count]) => `${agent}: ${count}`)
      .join(', ');
    promptSections.push(`Agent usage: ${agentUsageStr || 'none'}`);

    if ((aiLogs || []).length > 0) {
      const sortedDates = (aiLogs || []).map((l) => l.created_at).filter(Boolean).sort();
      if (sortedDates.length > 0) {
        promptSections.push(`Most active period: ${sortedDates[sortedDates.length - 1]} to ${sortedDates[0]}`);
      }
    }
    promptSections.push('');

    // Notes
    promptSections.push('=== NOTES ===');
    if ((notes || []).length > 0) {
      for (const note of notes || []) {
        const contentPreview = typeof note.content === 'string'
          ? note.content.slice(0, 200)
          : JSON.stringify(note.content).slice(0, 200);
        promptSections.push(`- ${note.title || 'Untitled'} | ${contentPreview} | ${note.created_at}`);
      }
    } else {
      promptSections.push('No notes.');
    }
    promptSections.push('');

    // Past insight reactions (feedback loop)
    promptSections.push('=== PAST INSIGHT REACTIONS ===');
    const reactedInsights = (pastReactions || []).filter((r: any) => r.reaction || r.status === 'dismissed');
    if (reactedInsights.length > 0) {
      promptSections.push('The user has reacted to previous insights. Use this to understand their preferences:\n');

      const helpful = reactedInsights.filter((r: any) => r.reaction === 'helpful');
      const notHelpful = reactedInsights.filter((r: any) => r.reaction === 'not_helpful');
      const dismissed = reactedInsights.filter((r: any) => r.status === 'dismissed' && !r.reaction);

      if (helpful.length > 0) {
        promptSections.push('INSIGHTS THE USER FOUND HELPFUL:');
        for (const r of helpful.slice(0, 15)) {
          promptSections.push(`  + [${r.category}] "${r.title}" — ${r.summary}`);
        }
      }

      if (notHelpful.length > 0) {
        promptSections.push('\nINSIGHTS THE USER DID NOT FIND HELPFUL:');
        for (const r of notHelpful.slice(0, 15)) {
          promptSections.push(`  - [${r.category}] "${r.title}" — ${r.summary}`);
        }
      }

      if (dismissed.length > 0) {
        promptSections.push('\nINSIGHTS THE USER DISMISSED:');
        for (const r of dismissed.slice(0, 10)) {
          promptSections.push(`  x [${r.category}] "${r.title}"`);
        }
      }

      // Category preference scores
      const scores = computeCategoryScores(reactedInsights);
      if (Object.keys(scores).length > 0) {
        promptSections.push('\nCATEGORY PREFERENCE SCORES (0-1, higher = more valued):');
        for (const [cat, score] of Object.entries(scores)) {
          promptSections.push(`  ${cat}: ${score.toFixed(2)}`);
        }
      }
    } else {
      promptSections.push('No past reactions yet (first generation).');
    }
    promptSections.push('');

    promptSections.push(`Generate 5-10 insights as a JSON array. Each insight must have: title (string), summary (string, 1-2 sentences), full_content (string, detailed paragraph), category (one of: growth_opportunity, learning_pattern, strength, connection, goal_alignment, recommendation), confidence (high, medium, or low).

IMPORTANT — Reaction-Aware Generation Rules:
1. Strongly favor categories with high preference scores (>0.7). Generate MORE insights in these categories.
2. Avoid repeating the exact topics or framing of insights marked "not helpful" or "dismissed".
3. For categories with low scores (<0.4), only include if you have HIGH confidence evidence.
4. Learn from HELPFUL insights: match that level of specificity, actionability, and tone.
5. If a user liked observational insights but disliked prescriptive ones, adjust accordingly.

Return ONLY the JSON array, no extra text.`);

    const structuredPrompt = promptSections.join('\n');

    // ── d) Get agent config ──────────────────────────────────────────────────

    const { data: agentConfig } = await supabase
      .from('ai_system_prompts')
      .select('system_instruction, model')
      .eq('agent_type', 'personal_insights_agent')
      .single();

    // ── e) Call AI ───────────────────────────────────────────────────────────

    const model = agentConfig?.model || 'google/gemini-2.0-flash-001';
    const systemPrompt = agentConfig?.system_instruction || '';

    const history = systemPrompt
      ? [{ role: 'model' as const, parts: systemPrompt }]
      : [];

    const response = await generateOpenRouterResponse(
      model,
      structuredPrompt,
      history,
      { agentType: 'personal_insights_agent', userId }
    );

    // ── f) Parse JSON response ───────────────────────────────────────────────

    let jsonStr = response.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    const insights = JSON.parse(jsonStr);

    if (!Array.isArray(insights) || insights.length === 0) {
      return [];
    }

    // ── g) Expire old active insights ────────────────────────────────────────

    await supabase
      .from('personal_insights')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // ── h) Insert new insights and return ────────────────────────────────────

    const insightRows = insights.map((insight: any) => ({
      user_id: userId,
      title: insight.title,
      summary: insight.summary,
      full_content: insight.full_content,
      category: insight.category,
      confidence: insight.confidence || 'medium',
      source_summary: sourceSummary,
      status: 'active',
    }));

    const { data: inserted } = await supabase
      .from('personal_insights')
      .insert(insightRows)
      .select();

    return (inserted as PersonalInsight[]) || [];
  } catch (error) {
    console.error('[generatePersonalInsights] Error:', error);
    return [];
  }
}

// ── 2. fetchPersonalInsights ─────────────────────────────────────────────────

export async function fetchPersonalInsights(userId: string): Promise<PersonalInsight[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('personal_insights')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('generated_at', { ascending: false });
  return (data as PersonalInsight[]) || [];
}

// ── 3. saveInsightToContext ──────────────────────────────────────────────────

export async function saveInsightToContext(
  insightId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // a) Fetch the insight
    const { data: insight, error: insightError } = await supabase
      .from('personal_insights')
      .select('*')
      .eq('id', insightId)
      .single();

    if (insightError || !insight) {
      return { success: false, error: 'Insight not found' };
    }

    // b) Find the user's personal-context collection
    const { data: collection } = await supabase
      .from('user_collections')
      .select('id')
      .eq('user_id', userId)
      .eq('label', 'Personal Context')
      .single();

    // c) Create a user_context_items entry
    const { error: insertError } = await supabase
      .from('user_context_items')
      .insert({
        user_id: userId,
        collection_id: collection?.id || null,
        type: 'AI_INSIGHT',
        title: insight.title,
        content: {
          insight: insight.full_content,
          category: insight.category,
          generated_at: insight.generated_at,
          source: 'personal_insights',
        },
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // d) Update insight status
    await supabase
      .from('personal_insights')
      .update({ status: 'saved', saved_at: new Date().toISOString() })
      .eq('id', insightId);

    return { success: true };
  } catch (error) {
    console.error('[saveInsightToContext] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ── 4. dismissInsight ────────────────────────────────────────────────────────

export async function dismissInsight(insightId: string, userId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('personal_insights')
    .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
    .eq('id', insightId);

  // Fire-and-forget: update preference profile in background
  updatePreferenceProfile(userId).catch(console.error);
}

// ── 5. reactToInsight ────────────────────────────────────────────────────────

export async function reactToInsight(
  insightId: string,
  reaction: 'helpful' | 'not_helpful',
  userId: string
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from('personal_insights')
    .update({ reaction })
    .eq('id', insightId);

  // Fire-and-forget: update preference profile in background
  updatePreferenceProfile(userId).catch(console.error);
}

// ── 6. shouldRegenerateInsights ──────────────────────────────────────────────

export async function shouldRegenerateInsights(
  userId: string
): Promise<{ shouldRegenerate: boolean; lastGenerated: string | null; activeCount: number }> {
  const supabase = createAdminClient();
  const { data, count } = await supabase
    .from('personal_insights')
    .select('generated_at', { count: 'exact' })
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('generated_at', { ascending: false })
    .limit(1);

  const activeCount = count || 0;
  const lastGenerated = data?.[0]?.generated_at || null;

  if (activeCount === 0 || !lastGenerated) {
    return { shouldRegenerate: true, lastGenerated: null, activeCount: 0 };
  }

  // Check if stale (> 24 hours old)
  const hoursSince = (Date.now() - new Date(lastGenerated).getTime()) / (1000 * 60 * 60);
  return {
    shouldRegenerate: hoursSince > 24,
    lastGenerated,
    activeCount,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeCategoryScores(
  reactions: { category: string; reaction: string | null; status: string }[]
): Record<string, number> {
  const categories: Record<string, { helpful: number; total: number }> = {};
  for (const r of reactions) {
    if (!categories[r.category]) categories[r.category] = { helpful: 0, total: 0 };
    categories[r.category].total++;
    if (r.reaction === 'helpful') categories[r.category].helpful++;
  }
  const scores: Record<string, number> = {};
  for (const [cat, data] of Object.entries(categories)) {
    scores[cat] = data.total > 0 ? data.helpful / data.total : 0.5;
  }
  return scores;
}

// ── 7. updatePreferenceProfile ───────────────────────────────────────────────

export async function updatePreferenceProfile(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // 1. Fetch ALL past reactions
    const { data: allReactions } = await supabase
      .from('personal_insights')
      .select('id, title, summary, category, reaction, status, generated_at')
      .eq('user_id', userId)
      .or('reaction.neq.null,status.eq.dismissed,status.eq.saved')
      .order('generated_at', { ascending: false });

    const reactions = allReactions || [];
    if (reactions.length === 0) {
      return { success: true }; // No reactions yet, nothing to profile
    }

    // 2. Aggregate by category
    const categoryPreferences: Record<string, { helpful: number; not_helpful: number; dismissed: number; score: number }> = {};
    for (const r of reactions) {
      if (!categoryPreferences[r.category]) {
        categoryPreferences[r.category] = { helpful: 0, not_helpful: 0, dismissed: 0, score: 0 };
      }
      if (r.reaction === 'helpful') categoryPreferences[r.category].helpful++;
      if (r.reaction === 'not_helpful') categoryPreferences[r.category].not_helpful++;
      if (r.status === 'dismissed') categoryPreferences[r.category].dismissed++;
    }
    // Compute scores
    for (const [, data] of Object.entries(categoryPreferences)) {
      const total = data.helpful + data.not_helpful + data.dismissed;
      data.score = total > 0 ? data.helpful / total : 0.5;
    }

    // 3. Extract topic keywords from titles
    const helpfulTitles = reactions.filter(r => r.reaction === 'helpful').map(r => r.title);
    const unhelpfulTitles = reactions.filter(r => r.reaction === 'not_helpful' || r.status === 'dismissed').map(r => r.title);

    // Simple keyword extraction: split titles, filter common words
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'your', 'you', 'in', 'of', 'to', 'and', 'for', 'on', 'with', 'has', 'have', 'it', 'its', 'this', 'that', 'be', 'been', 'being', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'from', 'by', 'at', 'or', 'not', 'no', 'but', 'so', 'if', 'than', 'too', 'very', 'just', 'about', 'over', 'more', 'also', 'how', 'what', 'when', 'where', 'why', 'all', 'each', 'every', 'both', 'few', 'some', 'any', 'most', 'into', 'through']);
    const extractTopics = (titles: string[]): string[] => {
      const wordCounts = new Map<string, number>();
      for (const title of titles) {
        const words = title.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
        // Extract bigrams too
        for (let i = 0; i < words.length - 1; i++) {
          const bigram = `${words[i]} ${words[i + 1]}`;
          wordCounts.set(bigram, (wordCounts.get(bigram) || 0) + 1);
        }
        for (const word of words) {
          wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
      }
      return Array.from(wordCounts.entries())
        .filter(([, count]) => count >= 1)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);
    };

    const topicsLiked = extractTopics(helpfulTitles);
    const topicsDisliked = extractTopics(unhelpfulTitles);

    // 4. Calculate engagement metrics
    const totalWithReaction = reactions.filter(r => r.reaction).length;
    const savedCount = reactions.filter(r => r.status === 'saved').length;
    const dismissedCount = reactions.filter(r => r.status === 'dismissed').length;
    const totalActioned = totalWithReaction + dismissedCount;
    const saveRate = totalActioned > 0 ? savedCount / totalActioned : 0;
    const dismissRate = totalActioned > 0 ? dismissedCount / totalActioned : 0;
    const engagementLevel = totalActioned >= 20 ? 'high' : totalActioned >= 5 ? 'medium' : 'low';

    // 5. Build recent reactions (last 20)
    const recentReactions = reactions.slice(0, 20).map(r => ({
      title: r.title,
      category: r.category,
      reaction: r.reaction || (r.status === 'dismissed' ? 'dismissed' : null),
      date: r.generated_at?.split('T')[0] || '',
    }));

    // 6. Build profile content
    const profileContent = {
      type: 'REACTION_PREFERENCE_PROFILE',
      lastUpdated: new Date().toISOString(),
      totalReactions: totalActioned,
      categoryPreferences,
      topicsLiked,
      topicsDisliked,
      saveRate: Math.round(saveRate * 100) / 100,
      dismissRate: Math.round(dismissRate * 100) / 100,
      engagementLevel,
      recentReactions,
    };

    // 7. Build embedding text (natural language for semantic matching)
    const sortedCategories = Object.entries(categoryPreferences)
      .sort((a, b) => b[1].score - a[1].score);
    const preferredCats = sortedCategories.filter(([, d]) => d.score >= 0.6).map(([c, d]) => `${c.replace(/_/g, ' ')} (${Math.round(d.score * 100)}%)`);
    const avoidedCats = sortedCategories.filter(([, d]) => d.score < 0.4).map(([c, d]) => `${c.replace(/_/g, ' ')} (${Math.round(d.score * 100)}%)`);

    const embeddingLines = [
      'User Preference Profile - Learning & Insight Preferences',
      '',
    ];
    if (preferredCats.length > 0) {
      embeddingLines.push(`This user strongly prefers insights about: ${preferredCats.join(', ')}.`);
    }
    if (avoidedCats.length > 0) {
      embeddingLines.push(`This user finds less value in insights about: ${avoidedCats.join(', ')}.`);
    }
    if (topicsLiked.length > 0) {
      embeddingLines.push(`Topics the user finds helpful: ${topicsLiked.join(', ')}.`);
    }
    if (topicsDisliked.length > 0) {
      embeddingLines.push(`Topics the user finds unhelpful: ${topicsDisliked.join(', ')}.`);
    }
    embeddingLines.push(`The user is ${engagementLevel}ly engaged with the insight system (${Math.round(saveRate * 100)}% save rate, ${Math.round(dismissRate * 100)}% dismiss rate).`);
    embeddingLines.push('They prefer actionable, growth-oriented insights over surface-level observations.');

    const embeddingText = embeddingLines.join('\n');

    // 8. Find user's personal-context collection
    const { data: collection } = await supabase
      .from('user_collections')
      .select('id')
      .eq('user_id', userId)
      .eq('label', 'Personal Context')
      .maybeSingle();

    const collectionId = collection?.id || null;

    // 9. Upsert the preference profile
    const { data: existing } = await supabase
      .from('user_context_items')
      .select('id')
      .eq('user_id', userId)
      .eq('title', 'Reaction Preference Profile')
      .eq('type', 'AI_INSIGHT')
      .maybeSingle();

    if (existing) {
      // Update existing
      await supabase
        .from('user_context_items')
        .update({
          content: profileContent,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      // Re-embed
      await updateContextEmbeddings(
        userId,
        existing.id,
        'AI_INSIGHT',
        embeddingText,
        collectionId,
        { title: 'Reaction Preference Profile', profileType: 'REACTION_PREFERENCE_PROFILE' }
      );
    } else {
      // Insert new
      const { data: inserted } = await supabase
        .from('user_context_items')
        .insert({
          user_id: userId,
          collection_id: collectionId,
          type: 'AI_INSIGHT',
          title: 'Reaction Preference Profile',
          content: profileContent,
        })
        .select('id')
        .single();

      if (inserted) {
        await embedContextItem(
          userId,
          inserted.id,
          'AI_INSIGHT',
          embeddingText,
          collectionId,
          { title: 'Reaction Preference Profile', profileType: 'REACTION_PREFERENCE_PROFILE' }
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[updatePreferenceProfile] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
