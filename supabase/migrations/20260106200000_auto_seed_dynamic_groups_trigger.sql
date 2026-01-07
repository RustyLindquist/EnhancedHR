-- Auto-seed dynamic groups when organization is created
-- This ensures dynamic groups always exist for every organization

CREATE OR REPLACE FUNCTION auto_seed_dynamic_groups()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM seed_dynamic_groups_for_org(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_seed_dynamic_groups ON organizations;
CREATE TRIGGER trigger_seed_dynamic_groups
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_seed_dynamic_groups();

-- Also seed for any existing organizations that don't have dynamic groups
DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN
        SELECT o.id
        FROM organizations o
        WHERE NOT EXISTS (
            SELECT 1 FROM employee_groups eg
            WHERE eg.org_id = o.id AND eg.is_dynamic = true
        )
    LOOP
        PERFORM seed_dynamic_groups_for_org(org_record.id);
    END LOOP;
END $$;
