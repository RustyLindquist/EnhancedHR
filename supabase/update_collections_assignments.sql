-- Add assignment fields to user_collections
ALTER TABLE public.user_collections
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Update RLS to ensure these are visible/editable by Org Admins (already covered by previous policy, but good to verify)
-- The previous policy "Org Admins can manage org collections" covers ALL operations, so updates to these columns are allowed.
