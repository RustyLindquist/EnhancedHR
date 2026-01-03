-- Add rejection_notes field to profiles for expert application feedback
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_notes text;

-- Add admin_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid REFERENCES profiles(id),
    action text NOT NULL,
    target_type text NOT NULL,
    target_id uuid NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON admin_audit_log(created_at DESC);

-- RLS policies for admin_audit_log
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON admin_audit_log FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Only admins can insert audit logs (via admin client)
CREATE POLICY "Admins can insert audit logs"
    ON admin_audit_log FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
