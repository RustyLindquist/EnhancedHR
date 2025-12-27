'use server';

/**
 * AI Cost Analytics Server Actions
 *
 * Provides cost tracking, analytics, and pricing management
 * for AI usage across the platform.
 */

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface ModelPricing {
  model_id: string;
  model_name: string;
  provider: string | null;
  prompt_price_per_million: number;
  completion_price_per_million: number;
  context_length: number | null;
  quality_tier: string | null;
}

export interface CostAnalyticsParams {
  startDate?: Date;
  endDate?: Date;
  agentType?: string;
  modelId?: string;
  orgId?: string;
  groupBy?: 'agent' | 'model' | 'day' | 'user';
}

export interface AgentCostSummary {
  agent_type: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_tokens_per_request: number;
  avg_cost_per_request: number;
}

export interface UsageOverview {
  totalRequests: number;
  totalCost: number;
  totalTokens: number;
  avgConversationLength: number;
  requestsChange: number;  // Week-over-week percentage
  costChange: number;
  tokensChange: number;
}

export interface DailyCostData {
  date: string;
  requests: number;
  cost: number;
  tokens: number;
}

// ============================================================================
// Pricing Management
// ============================================================================

/**
 * Fetch model pricing from cache
 */
export async function getCachedPricing(modelId: string): Promise<ModelPricing | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_model_pricing_cache')
    .select('*')
    .eq('model_id', modelId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as ModelPricing;
}

/**
 * Get all cached model pricing
 */
export async function getAllModelPricing(): Promise<ModelPricing[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_model_pricing_cache')
    .select('*')
    .eq('is_available', true)
    .order('provider')
    .order('prompt_price_per_million');

  if (error) {
    console.error('[CostAnalytics] Error fetching pricing:', error);
    return [];
  }

  return data as ModelPricing[];
}

/**
 * Calculate cost from tokens and pricing
 * Note: Made async to satisfy 'use server' requirements
 */
export async function calculateCost(
  promptTokens: number,
  completionTokens: number,
  pricing: ModelPricing | null
): Promise<number> {
  if (!pricing) return 0;

  const promptCost = (promptTokens / 1_000_000) * pricing.prompt_price_per_million;
  const completionCost = (completionTokens / 1_000_000) * pricing.completion_price_per_million;

  return promptCost + completionCost;
}

/**
 * Sync pricing from OpenRouter API
 */
export async function syncModelPricingFromOpenRouter(): Promise<{
  success: boolean;
  updated: number;
  error?: string;
}> {
  const supabase = await createClient();

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, updated: 0, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, updated: 0, error: 'Admin access required' };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'EnhancedHR',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    const admin = createAdminClient();
    let updated = 0;

    for (const model of models) {
      const promptPrice = parseFloat(model.pricing?.prompt || '0') * 1_000_000;
      const completionPrice = parseFloat(model.pricing?.completion || '0') * 1_000_000;

      const { error } = await admin
        .from('ai_model_pricing_cache')
        .upsert({
          model_id: model.id,
          model_name: model.name,
          description: model.description?.substring(0, 500),
          context_length: model.context_length,
          prompt_price_per_million: promptPrice,
          completion_price_per_million: completionPrice,
          provider: model.id.split('/')[0],
          quality_tier: determineQualityTier(promptPrice, completionPrice),
          is_available: true,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'model_id',
        });

      if (!error) updated++;
    }

    return { success: true, updated };
  } catch (error) {
    console.error('[CostAnalytics] Error syncing pricing:', error);
    return { success: false, updated: 0, error: String(error) };
  }
}

function determineQualityTier(promptPrice: number, completionPrice: number): string {
  const avgPrice = (promptPrice + completionPrice) / 2;

  if (avgPrice === 0) return 'free';
  if (avgPrice < 0.2) return 'economy';
  if (avgPrice < 2) return 'standard';
  if (avgPrice < 10) return 'premium';
  return 'flagship';
}

// ============================================================================
// Analytics Queries
// ============================================================================

/**
 * Get usage overview for dashboard
 */
export async function getUsageOverview(
  daysBack: number = 7
): Promise<UsageOverview> {
  const supabase = await createClient();

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - daysBack);

  // Current period
  const { data: currentData } = await supabase
    .from('ai_logs')
    .select('id, total_tokens, cost_usd, conversation_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Previous period for comparison
  const { data: prevData } = await supabase
    .from('ai_logs')
    .select('id, total_tokens, cost_usd')
    .gte('created_at', prevStartDate.toISOString())
    .lt('created_at', startDate.toISOString());

  const current = {
    requests: currentData?.length || 0,
    cost: currentData?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0,
    tokens: currentData?.reduce((sum, r) => sum + (r.total_tokens || 0), 0) || 0,
  };

  const prev = {
    requests: prevData?.length || 0,
    cost: prevData?.reduce((sum, r) => sum + (r.cost_usd || 0), 0) || 0,
    tokens: prevData?.reduce((sum, r) => sum + (r.total_tokens || 0), 0) || 0,
  };

  // Calculate conversation lengths
  const conversationCounts: Record<string, number> = {};
  currentData?.forEach(r => {
    if (r.conversation_id) {
      conversationCounts[r.conversation_id] = (conversationCounts[r.conversation_id] || 0) + 1;
    }
  });
  const avgConvLength = Object.values(conversationCounts).length > 0
    ? Object.values(conversationCounts).reduce((a, b) => a + b, 0) / Object.values(conversationCounts).length
    : 0;

  // Calculate changes
  const calcChange = (curr: number, prev: number) =>
    prev > 0 ? ((curr - prev) / prev) * 100 : 0;

  return {
    totalRequests: current.requests,
    totalCost: current.cost,
    totalTokens: current.tokens,
    avgConversationLength: avgConvLength,
    requestsChange: calcChange(current.requests, prev.requests),
    costChange: calcChange(current.cost, prev.cost),
    tokensChange: calcChange(current.tokens, prev.tokens),
  };
}

/**
 * Get cost breakdown by agent type
 */
export async function getCostByAgent(
  daysBack: number = 30
): Promise<AgentCostSummary[]> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('ai_logs')
    .select('agent_type, total_tokens, cost_usd')
    .gte('created_at', startDate.toISOString())
    .not('agent_type', 'is', null);

  if (error || !data) {
    console.error('[CostAnalytics] Error fetching agent costs:', error);
    return [];
  }

  // Aggregate by agent type
  const agentMap: Record<string, { requests: number; tokens: number; cost: number }> = {};

  data.forEach(row => {
    if (!agentMap[row.agent_type]) {
      agentMap[row.agent_type] = { requests: 0, tokens: 0, cost: 0 };
    }
    agentMap[row.agent_type].requests++;
    agentMap[row.agent_type].tokens += row.total_tokens || 0;
    agentMap[row.agent_type].cost += row.cost_usd || 0;
  });

  return Object.entries(agentMap).map(([agent, stats]) => ({
    agent_type: agent,
    total_requests: stats.requests,
    total_tokens: stats.tokens,
    total_cost: stats.cost,
    avg_tokens_per_request: stats.requests > 0 ? stats.tokens / stats.requests : 0,
    avg_cost_per_request: stats.requests > 0 ? stats.cost / stats.requests : 0,
  })).sort((a, b) => b.total_cost - a.total_cost);
}

/**
 * Get daily cost trend data
 */
export async function getDailyCostTrend(
  daysBack: number = 30
): Promise<DailyCostData[]> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('ai_logs')
    .select('created_at, total_tokens, cost_usd')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  // Aggregate by day
  const dailyMap: Record<string, { requests: number; tokens: number; cost: number }> = {};

  data.forEach(row => {
    const date = new Date(row.created_at).toISOString().split('T')[0];
    if (!dailyMap[date]) {
      dailyMap[date] = { requests: 0, tokens: 0, cost: 0 };
    }
    dailyMap[date].requests++;
    dailyMap[date].tokens += row.total_tokens || 0;
    dailyMap[date].cost += row.cost_usd || 0;
  });

  return Object.entries(dailyMap).map(([date, stats]) => ({
    date,
    requests: stats.requests,
    cost: stats.cost,
    tokens: stats.tokens,
  }));
}

/**
 * Estimate cost if using a different model
 */
export async function estimateCostWithModel(
  agentType: string,
  newModelId: string,
  daysBack: number = 30
): Promise<{
  currentCost: number;
  estimatedCost: number;
  savings: number;
  savingsPercent: number;
}> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Get current usage for this agent
  const { data: logs } = await supabase
    .from('ai_logs')
    .select('prompt_tokens, completion_tokens, cost_usd')
    .eq('agent_type', agentType)
    .gte('created_at', startDate.toISOString());

  if (!logs || logs.length === 0) {
    return { currentCost: 0, estimatedCost: 0, savings: 0, savingsPercent: 0 };
  }

  // Get new model pricing
  const newPricing = await getCachedPricing(newModelId);

  const currentCost = logs.reduce((sum, r) => sum + (r.cost_usd || 0), 0);

  // Calculate estimated costs in parallel
  const estimatedCosts = await Promise.all(
    logs.map(r => calculateCost(
      r.prompt_tokens || 0,
      r.completion_tokens || 0,
      newPricing
    ))
  );
  const estimatedCost = estimatedCosts.reduce((sum, cost) => sum + cost, 0);

  const savings = currentCost - estimatedCost;
  const savingsPercent = currentCost > 0 ? (savings / currentCost) * 100 : 0;

  return {
    currentCost,
    estimatedCost,
    savings,
    savingsPercent,
  };
}

/**
 * Get logs filtered by agent type (for AI Logs page)
 */
export async function getLogsByAgent(
  agentType: string | null,
  limit: number = 100
): Promise<any[]> {
  const supabase = await createClient();

  let query = supabase
    .from('ai_logs')
    .select(`
      id,
      user_id,
      conversation_id,
      agent_type,
      page_context,
      prompt,
      response,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      cost_usd,
      model_id,
      metadata,
      created_at,
      profiles!inner(full_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agentType && agentType !== 'all') {
    query = query.eq('agent_type', agentType);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[CostAnalytics] Error fetching logs:', error);
    return [];
  }

  return data || [];
}

/**
 * Get unique agent types from logs
 */
export async function getAgentTypes(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_logs')
    .select('agent_type')
    .not('agent_type', 'is', null);

  if (error || !data) {
    return [];
  }

  const unique = [...new Set(data.map(r => r.agent_type))];
  return unique.filter(Boolean).sort();
}

// ============================================================================
// Analytics Context for AI Assistant
// ============================================================================

export type AnalyticsAccessLevel = 'platform_admin' | 'org_admin' | 'expert';
export type ExpertScopeFilter = 'personal' | 'platform';

export interface AnalyticsScope {
  accessLevel: AnalyticsAccessLevel;
  orgId?: string;
  courseIds?: number[];  // For experts
  expertScopeFilter?: ExpertScopeFilter;  // Allow experts to toggle between personal/platform view
}

export interface AnalyticsContext {
  usageMetrics: {
    totalRequests: number;
    totalCost: number;
    totalTokens: number;
    avgTokensPerRequest: number;
    avgCostPerRequest: number;
    requestsTrend: string;
    costTrend: string;
  };
  agentBreakdown: Array<{
    agent: string;
    requests: number;
    cost: number;
    tokens: number;
    percentOfTotal: number;
  }>;
  topicSummary: Array<{
    topic: string;
    count: number;
    percentage: number;
  }>;
  recentQuestions: string[];
  timeRange: string;
  scope: string;  // Description of the data scope
}

/**
 * Determine the user's analytics access scope based on their role
 */
export async function getAnalyticsScope(): Promise<AnalyticsScope | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user profile with org and role info
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, membership_status, org_id')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  // Platform Admin - full access
  if (profile.role === 'admin') {
    return { accessLevel: 'platform_admin' };
  }

  // Org Admin - org-scoped access
  if (profile.membership_status === 'org_admin' && profile.org_id) {
    return { accessLevel: 'org_admin', orgId: profile.org_id };
  }

  // Expert - check if they have authored courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id')
    .eq('author_id', user.id);

  if (courses && courses.length > 0) {
    return {
      accessLevel: 'expert',
      courseIds: courses.map(c => c.id)
    };
  }

  return null;  // No analytics access
}

/**
 * Get comprehensive analytics context for the analytics assistant
 * This provides aggregated, anonymized data for AI analysis
 * Respects role-based access controls
 */
export async function getAnalyticsContext(
  daysBack: number = 30,
  scope?: AnalyticsScope
): Promise<AnalyticsContext> {
  const supabase = await createClient();

  // If no scope provided, determine from user role
  const effectiveScope = scope || await getAnalyticsScope();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Build base query
  let query = supabase
    .from('ai_logs')
    .select('agent_type, prompt, total_tokens, cost_usd, created_at, page_context, org_id')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(500);

  // Apply scope filters
  let scopeDescription = 'Platform-wide';
  let isExpertPlatformView = false;

  if (effectiveScope?.accessLevel === 'org_admin' && effectiveScope.orgId) {
    query = query.eq('org_id', effectiveScope.orgId);
    scopeDescription = 'Your organization';
  } else if (effectiveScope?.accessLevel === 'expert') {
    // Expert can toggle between personal (their courses) and platform-wide
    const scopeFilter = effectiveScope.expertScopeFilter || 'personal';

    if (scopeFilter === 'personal' && effectiveScope.courseIds?.length) {
      // Filter to course-related conversations
      const coursePatterns = effectiveScope.courseIds.map(id => `course-${id}`);
      query = query.or(coursePatterns.map(p => `page_context.like.${p}%`).join(','));
      scopeDescription = 'Your courses';
    } else {
      // Platform-wide view for experts - aggregated data only
      scopeDescription = 'Platform-wide (aggregated)';
      isExpertPlatformView = true;
    }
  }

  // Fetch logs for the period
  const { data: logs, error } = await query;

  if (error || !logs) {
    return {
      usageMetrics: {
        totalRequests: 0,
        totalCost: 0,
        totalTokens: 0,
        avgTokensPerRequest: 0,
        avgCostPerRequest: 0,
        requestsTrend: 'stable',
        costTrend: 'stable',
      },
      agentBreakdown: [],
      topicSummary: [],
      recentQuestions: [],
      timeRange: `Last ${daysBack} days`,
      scope: scopeDescription,
    };
  }

  // Calculate usage metrics
  const totalRequests = logs.length;
  const totalCost = logs.reduce((sum, r) => sum + (r.cost_usd || 0), 0);
  const totalTokens = logs.reduce((sum, r) => sum + (r.total_tokens || 0), 0);

  // Get overview for trend calculation
  const overview = await getUsageOverview(daysBack);

  // Calculate agent breakdown
  const agentMap: Record<string, { requests: number; cost: number; tokens: number }> = {};
  logs.forEach(log => {
    if (!agentMap[log.agent_type]) {
      agentMap[log.agent_type] = { requests: 0, cost: 0, tokens: 0 };
    }
    agentMap[log.agent_type].requests++;
    agentMap[log.agent_type].cost += log.cost_usd || 0;
    agentMap[log.agent_type].tokens += log.total_tokens || 0;
  });

  const agentBreakdown = Object.entries(agentMap)
    .map(([agent, stats]) => ({
      agent,
      requests: stats.requests,
      cost: stats.cost,
      tokens: stats.tokens,
      percentOfTotal: totalRequests > 0 ? (stats.requests / totalRequests) * 100 : 0,
    }))
    .sort((a, b) => b.requests - a.requests);

  // Extract topic patterns from prompts (simple keyword extraction)
  const topicKeywords: Record<string, number> = {};
  const commonTopics = [
    'onboarding', 'performance', 'review', 'training', 'compliance',
    'leadership', 'management', 'policy', 'benefits', 'compensation',
    'recruiting', 'hiring', 'interview', 'feedback', 'development',
    'career', 'promotion', 'termination', 'harassment', 'diversity',
    'remote', 'hybrid', 'engagement', 'retention', 'culture'
  ];

  logs.forEach(log => {
    const promptLower = log.prompt.toLowerCase();
    commonTopics.forEach(topic => {
      if (promptLower.includes(topic)) {
        topicKeywords[topic] = (topicKeywords[topic] || 0) + 1;
      }
    });
  });

  const topicSummary = Object.entries(topicKeywords)
    .map(([topic, count]) => ({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      count,
      percentage: totalRequests > 0 ? (count / totalRequests) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get recent unique questions
  // For expert platform view, show topic-based summaries instead of raw questions for privacy
  let recentQuestions: string[];

  if (isExpertPlatformView) {
    // For experts viewing platform data, provide anonymized topic-based insights instead
    recentQuestions = topicSummary.slice(0, 5).map(t =>
      `Questions about "${t.topic}" (${t.count} conversations)`
    );
  } else {
    // For personal views (own courses, org, or platform admin), show actual questions
    recentQuestions = logs
      .slice(0, 20)
      .map(log => {
        const prompt = log.prompt.substring(0, 100);
        return prompt.length === 100 ? prompt + '...' : prompt;
      })
      .filter((q, i, arr) => arr.indexOf(q) === i)
      .slice(0, 10);
  }

  return {
    usageMetrics: {
      totalRequests,
      totalCost,
      totalTokens,
      avgTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      requestsTrend: overview.requestsChange > 5 ? 'increasing' : overview.requestsChange < -5 ? 'decreasing' : 'stable',
      costTrend: overview.costChange > 5 ? 'increasing' : overview.costChange < -5 ? 'decreasing' : 'stable',
    },
    agentBreakdown,
    topicSummary,
    recentQuestions,
    timeRange: `Last ${daysBack} days`,
    scope: scopeDescription,
  };
}

/**
 * Format analytics context as a string for AI consumption
 * Respects role-based access and includes scope information
 */
export async function getAnalyticsContextString(
  daysBack: number = 30,
  scopeFilter?: ExpertScopeFilter
): Promise<string> {
  // Get the user's base scope
  const baseScope = await getAnalyticsScope();

  // Apply scope filter override for experts
  let scope = baseScope;
  if (baseScope?.accessLevel === 'expert' && scopeFilter) {
    scope = { ...baseScope, expertScopeFilter: scopeFilter };
  }

  const context = await getAnalyticsContext(daysBack, scope || undefined);

  const sections = [
    `## AI Usage Analytics (${context.timeRange})`,
    `**Data Scope:** ${context.scope}`,
    '',
    '### Usage Metrics',
    `- Total Requests: ${context.usageMetrics.totalRequests.toLocaleString()}`,
    `- Total Cost: $${context.usageMetrics.totalCost.toFixed(2)}`,
    `- Total Tokens: ${(context.usageMetrics.totalTokens / 1000).toFixed(0)}K`,
    `- Avg Tokens/Request: ${context.usageMetrics.avgTokensPerRequest.toFixed(0)}`,
    `- Avg Cost/Request: $${context.usageMetrics.avgCostPerRequest.toFixed(4)}`,
    `- Request Trend: ${context.usageMetrics.requestsTrend}`,
    `- Cost Trend: ${context.usageMetrics.costTrend}`,
    '',
    '### Usage by Agent',
    ...context.agentBreakdown.map(a =>
      `- ${a.agent}: ${a.requests} requests (${a.percentOfTotal.toFixed(1)}%), $${a.cost.toFixed(2)}`
    ),
    '',
    '### Top Topics (from user queries)',
    ...context.topicSummary.map(t =>
      `- ${t.topic}: ${t.count} mentions (${t.percentage.toFixed(1)}%)`
    ),
    '',
    '### Sample Recent Questions',
    ...context.recentQuestions.map(q => `- "${q}"`),
  ];

  return sections.join('\n');
}

/**
 * Get analytics context for Org Admins
 * Returns aggregated, privacy-preserving data (no raw conversations)
 */
export async function getOrgAnalyticsContext(
  orgId: string,
  daysBack: number = 30
): Promise<AnalyticsContext> {
  return getAnalyticsContext(daysBack, {
    accessLevel: 'org_admin',
    orgId
  });
}

/**
 * Get analytics context for Experts (course authors)
 * Returns data filtered to their courses only
 */
export async function getExpertAnalyticsContext(
  courseIds: number[],
  daysBack: number = 30
): Promise<AnalyticsContext> {
  return getAnalyticsContext(daysBack, {
    accessLevel: 'expert',
    courseIds
  });
}
