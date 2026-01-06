-- ============================================================================
-- Tools Table for AI-Powered HR Tools
-- Each tool is linked to an AI agent (agent_type in ai_system_prompts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tools (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,           -- URL-safe identifier: 'role-disruption-forecasting'
    title TEXT NOT NULL,                 -- Display name: 'Role Disruption Forecasting'
    description TEXT NOT NULL,           -- Card preview text
    agent_type TEXT NOT NULL,            -- Links to ai_system_prompts.agent_type
    icon_name TEXT,                      -- Lucide icon name (optional, e.g., 'TrendingUp')
    is_active BOOLEAN DEFAULT true,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read active tools"
    ON public.tools FOR SELECT TO authenticated
    USING (is_active = true);

CREATE POLICY "Admins can manage tools"
    ON public.tools FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Indexes
CREATE INDEX idx_tools_slug ON public.tools(slug);
CREATE INDEX idx_tools_agent_type ON public.tools(agent_type);
CREATE INDEX idx_tools_order ON public.tools(display_order);

-- Comments
COMMENT ON TABLE public.tools IS 'AI-powered HR tools accessible from the Tools collection';
COMMENT ON COLUMN public.tools.agent_type IS 'References ai_system_prompts.agent_type for the tool AI agent';
COMMENT ON COLUMN public.tools.slug IS 'URL-safe identifier used in /tools/[slug] routes';
COMMENT ON COLUMN public.tools.icon_name IS 'Lucide icon name for display (e.g., TrendingUp, Brain, Target)';
