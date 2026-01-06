-- AI Cost Tracking Migration
-- Adds infrastructure for tracking AI usage costs
-- Handles both fresh installs and upgrades

-- ============================================================================
-- 1. Create ai_model_pricing_cache table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_model_pricing_cache (
    model_id TEXT PRIMARY KEY,
    model_name TEXT NOT NULL,
    description TEXT,
    context_length INTEGER,

    -- Pricing per million tokens (for readability)
    prompt_price_per_million NUMERIC(10, 6) DEFAULT 0,
    completion_price_per_million NUMERIC(10, 6) DEFAULT 0,

    -- Provider and categorization
    provider TEXT,  -- 'google', 'openai', 'anthropic', 'meta', etc.
    quality_tier TEXT CHECK (quality_tier IN ('free', 'economy', 'standard', 'premium', 'flagship')),

    -- Cache management
    is_available BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_model_pricing_cache ENABLE ROW LEVEL SECURITY;

-- Admins can manage pricing cache (drop first to avoid conflict)
DROP POLICY IF EXISTS "Admins can manage pricing cache" ON public.ai_model_pricing_cache;
CREATE POLICY "Admins can manage pricing cache" ON public.ai_model_pricing_cache
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- All authenticated users can read pricing (for display in UI)
DROP POLICY IF EXISTS "Authenticated users can read pricing" ON public.ai_model_pricing_cache;
CREATE POLICY "Authenticated users can read pricing" ON public.ai_model_pricing_cache
    FOR SELECT
    TO authenticated
    USING (true);

-- ============================================================================
-- 2. Create ai_logs table if it doesn't exist (with all columns including cost tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id text,
    agent_type text NOT NULL,
    page_context text,
    prompt text NOT NULL,
    response text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Cost tracking columns
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    model_id TEXT,
    cost_usd NUMERIC(12, 8),
    request_duration_ms INTEGER,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- Enable RLS on ai_logs
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2b. Add cost tracking columns if table already exists but lacks them
-- ============================================================================
DO $$
BEGIN
    -- Add prompt_tokens if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'prompt_tokens') THEN
        ALTER TABLE public.ai_logs ADD COLUMN prompt_tokens INTEGER;
    END IF;

    -- Add completion_tokens if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'completion_tokens') THEN
        ALTER TABLE public.ai_logs ADD COLUMN completion_tokens INTEGER;
    END IF;

    -- Add total_tokens if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'total_tokens') THEN
        ALTER TABLE public.ai_logs ADD COLUMN total_tokens INTEGER;
    END IF;

    -- Add model_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'model_id') THEN
        ALTER TABLE public.ai_logs ADD COLUMN model_id TEXT;
    END IF;

    -- Add cost_usd if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'cost_usd') THEN
        ALTER TABLE public.ai_logs ADD COLUMN cost_usd NUMERIC(12, 8);
    END IF;

    -- Add request_duration_ms if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'request_duration_ms') THEN
        ALTER TABLE public.ai_logs ADD COLUMN request_duration_ms INTEGER;
    END IF;

    -- Add org_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'org_id') THEN
        ALTER TABLE public.ai_logs ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 2c. Create RLS policies for ai_logs (drop first to avoid conflicts)
-- ============================================================================
DROP POLICY IF EXISTS "Platform Admins can view all ai_logs" ON public.ai_logs;
CREATE POLICY "Platform Admins can view all ai_logs" ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can view their own ai_logs" ON public.ai_logs;
CREATE POLICY "Users can view their own ai_logs" ON public.ai_logs
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own ai_logs" ON public.ai_logs;
CREATE POLICY "Users can insert their own ai_logs" ON public.ai_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 3. Create indexes for analytics queries
-- ============================================================================
-- Index for cost aggregation by agent type and date
CREATE INDEX IF NOT EXISTS idx_ai_logs_agent_date
ON public.ai_logs(agent_type, created_at DESC);

-- Index for cost aggregation by model and date
CREATE INDEX IF NOT EXISTS idx_ai_logs_model_date
ON public.ai_logs(model_id, created_at DESC)
WHERE model_id IS NOT NULL;

-- Index for org-level analytics
CREATE INDEX IF NOT EXISTS idx_ai_logs_org_date
ON public.ai_logs(org_id, created_at DESC)
WHERE org_id IS NOT NULL;

-- Index for user-level analytics
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_date
ON public.ai_logs(user_id, created_at DESC);

-- Composite index for common analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_logs_analytics
ON public.ai_logs(created_at DESC, agent_type, model_id);

-- ============================================================================
-- 4. Create ai_analytics_summaries table for pre-aggregated data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_analytics_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Aggregation dimensions
    summary_date DATE NOT NULL,
    summary_period TEXT CHECK (summary_period IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    agent_type TEXT,
    model_id TEXT,

    -- Aggregated metrics
    total_requests INTEGER DEFAULT 0,
    total_prompt_tokens BIGINT DEFAULT 0,
    total_completion_tokens BIGINT DEFAULT 0,
    total_tokens BIGINT DEFAULT 0,
    total_cost_usd NUMERIC(12, 4) DEFAULT 0,
    avg_tokens_per_request NUMERIC(10, 2),
    avg_cost_per_request NUMERIC(10, 8),
    unique_users INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique summaries per dimension combination
    CONSTRAINT unique_summary UNIQUE (summary_date, summary_period, org_id, agent_type, model_id)
);

-- Enable RLS
ALTER TABLE public.ai_analytics_summaries ENABLE ROW LEVEL SECURITY;

-- Admins can manage summaries (drop first to avoid conflict)
DROP POLICY IF EXISTS "Admins can manage analytics summaries" ON public.ai_analytics_summaries;
CREATE POLICY "Admins can manage analytics summaries" ON public.ai_analytics_summaries
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ============================================================================
-- 5. Seed initial model pricing data (common models)
-- ============================================================================
INSERT INTO public.ai_model_pricing_cache (model_id, model_name, provider, prompt_price_per_million, completion_price_per_million, context_length, quality_tier) VALUES
-- Google Gemini models
('google/gemini-2.0-flash-001', 'Gemini 2.0 Flash', 'google', 0.10, 0.40, 1048576, 'standard'),
('google/gemini-2.0-flash-exp:free', 'Gemini 2.0 Flash (Free)', 'google', 0, 0, 1048576, 'free'),
('google/gemini-1.5-flash', 'Gemini 1.5 Flash', 'google', 0.075, 0.30, 1048576, 'economy'),
('google/gemini-1.5-flash-002', 'Gemini 1.5 Flash 002', 'google', 0.075, 0.30, 1048576, 'economy'),
('google/gemini-1.5-flash-8b', 'Gemini 1.5 Flash 8B', 'google', 0.0375, 0.15, 1048576, 'economy'),
('google/gemini-1.5-pro', 'Gemini 1.5 Pro', 'google', 1.25, 5.00, 2097152, 'premium'),
('google/gemini-1.5-pro-002', 'Gemini 1.5 Pro 002', 'google', 1.25, 5.00, 2097152, 'premium'),
('google/gemma-2-27b-it:free', 'Gemma 2 27B (Free)', 'google', 0, 0, 8192, 'free'),

-- OpenAI models
('openai/gpt-4o', 'GPT-4o', 'openai', 2.50, 10.00, 128000, 'flagship'),
('openai/gpt-4o-mini', 'GPT-4o Mini', 'openai', 0.15, 0.60, 128000, 'standard'),
('openai/gpt-4-turbo', 'GPT-4 Turbo', 'openai', 10.00, 30.00, 128000, 'flagship'),

-- Anthropic models
('anthropic/claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', 3.00, 15.00, 200000, 'premium'),
('anthropic/claude-3-haiku', 'Claude 3 Haiku', 'anthropic', 0.25, 1.25, 200000, 'standard'),

-- Meta models
('meta-llama/llama-3.1-70b-instruct', 'Llama 3.1 70B', 'meta', 0.52, 0.75, 131072, 'standard'),
('meta-llama/llama-3.1-8b-instruct', 'Llama 3.1 8B', 'meta', 0.055, 0.055, 131072, 'economy')

ON CONFLICT (model_id) DO UPDATE SET
    prompt_price_per_million = EXCLUDED.prompt_price_per_million,
    completion_price_per_million = EXCLUDED.completion_price_per_million,
    last_updated = NOW();

-- ============================================================================
-- 6. Create helper function for cost calculation
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_ai_cost(
    p_prompt_tokens INTEGER,
    p_completion_tokens INTEGER,
    p_model_id TEXT
) RETURNS NUMERIC AS $$
DECLARE
    v_prompt_price NUMERIC;
    v_completion_price NUMERIC;
    v_cost NUMERIC;
BEGIN
    -- Get pricing from cache
    SELECT
        prompt_price_per_million / 1000000.0,
        completion_price_per_million / 1000000.0
    INTO v_prompt_price, v_completion_price
    FROM public.ai_model_pricing_cache
    WHERE model_id = p_model_id;

    -- If no pricing found, return 0
    IF v_prompt_price IS NULL THEN
        RETURN 0;
    END IF;

    -- Calculate cost
    v_cost := (COALESCE(p_prompt_tokens, 0) * v_prompt_price) +
              (COALESCE(p_completion_tokens, 0) * v_completion_price);

    RETURN v_cost;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 7. Comments for documentation
-- ============================================================================
COMMENT ON TABLE public.ai_model_pricing_cache IS 'Cache of AI model pricing from OpenRouter. Updated periodically.';
COMMENT ON TABLE public.ai_analytics_summaries IS 'Pre-aggregated AI usage analytics for dashboard performance.';
COMMENT ON COLUMN public.ai_logs.prompt_tokens IS 'Number of input tokens used in the request';
COMMENT ON COLUMN public.ai_logs.completion_tokens IS 'Number of output tokens generated';
COMMENT ON COLUMN public.ai_logs.cost_usd IS 'Calculated cost in USD based on token usage and model pricing';
COMMENT ON COLUMN public.ai_logs.org_id IS 'Organization ID for org-level analytics (denormalized from user profile)';
