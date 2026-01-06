-- Add dynamic group support to employee_groups table
ALTER TABLE employee_groups ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT false;
ALTER TABLE employee_groups ADD COLUMN IF NOT EXISTS dynamic_type TEXT CHECK (dynamic_type IS NULL OR dynamic_type IN (
    'recent_logins', 'no_logins', 'most_active', 'top_learners', 'most_talkative'
));
ALTER TABLE employee_groups ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}';
ALTER TABLE employee_groups ADD COLUMN IF NOT EXISTS last_computed_at TIMESTAMPTZ;

-- Index for faster dynamic group queries
CREATE INDEX IF NOT EXISTS idx_employee_groups_dynamic ON employee_groups(org_id, is_dynamic) WHERE is_dynamic = true;

-- Seed function to create default dynamic groups for an org
CREATE OR REPLACE FUNCTION seed_dynamic_groups_for_org(p_org_id UUID)
RETURNS void AS $$
BEGIN
    -- Recent Logins
    INSERT INTO employee_groups (org_id, name, is_dynamic, dynamic_type, criteria)
    VALUES (p_org_id, 'Recent Logins', true, 'recent_logins', '{"type": "recent_logins", "days": 30}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- No Logins
    INSERT INTO employee_groups (org_id, name, is_dynamic, dynamic_type, criteria)
    VALUES (p_org_id, 'No Logins', true, 'no_logins', '{"type": "no_logins", "days": 30}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Most Active
    INSERT INTO employee_groups (org_id, name, is_dynamic, dynamic_type, criteria)
    VALUES (p_org_id, 'Most Active', true, 'most_active', '{"type": "most_active", "metrics": ["streaks", "time_in_course", "courses_completed", "collection_utilization"], "period_days": 30, "threshold": 50}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Top Learners
    INSERT INTO employee_groups (org_id, name, is_dynamic, dynamic_type, criteria)
    VALUES (p_org_id, 'Top Learners', true, 'top_learners', '{"type": "top_learners", "metrics": ["time_spent", "courses_completed", "credits_earned"], "period_days": 30, "threshold": 50}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Most Talkative
    INSERT INTO employee_groups (org_id, name, is_dynamic, dynamic_type, criteria)
    VALUES (p_org_id, 'Most Talkative', true, 'most_talkative', '{"type": "most_talkative", "metrics": ["conversation_count", "message_count"], "period_days": 30, "threshold": 50}'::jsonb)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
