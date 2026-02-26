-- Phase 1: Billing schema updates for Stripe integration
-- 1. Add 'past_due' to membership_status CHECK constraint
-- 2. Add stripe_subscription_id to organizations
-- 3. Create webhook_events table for idempotency

-- Add 'past_due' to membership_status CHECK constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_membership_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_membership_status_check
  CHECK (membership_status IN ('trial','active','inactive','past_due','employee','org_admin'));

-- Add stripe_subscription_id to organizations (fixes live bug in remove-user)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed_at ON public.webhook_events(processed_at);
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
