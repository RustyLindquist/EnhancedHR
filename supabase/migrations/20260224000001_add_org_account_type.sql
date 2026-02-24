-- Add account_type column to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'trial';

-- Add check constraint
ALTER TABLE organizations
ADD CONSTRAINT organizations_account_type_check
CHECK (account_type IN ('trial', 'paid'));
