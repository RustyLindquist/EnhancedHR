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
