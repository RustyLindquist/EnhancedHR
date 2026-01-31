-- Fix Function Search Path Mutable warnings
-- Sets explicit search_path for all flagged functions to prevent search_path injection attacks
-- Particularly important for SECURITY DEFINER functions

-- SECURITY DEFINER functions (higher priority)
ALTER FUNCTION public.match_unified_embeddings SET search_path = public;
ALTER FUNCTION public.award_course_credits SET search_path = public;
ALTER FUNCTION public.get_monthly_payout_report SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;
ALTER FUNCTION public.increment_trial_minutes SET search_path = public;

-- Non-SECURITY DEFINER functions (lower priority but good practice)
ALTER FUNCTION public.update_standalone_experts_updated_at SET search_path = public;
ALTER FUNCTION public.update_notes_updated_at SET search_path = public;
ALTER FUNCTION public.match_course_embeddings SET search_path = public;
ALTER FUNCTION public.update_standalone_expert_credentials_updated_at SET search_path = public;
ALTER FUNCTION public.seed_dynamic_groups_for_org SET search_path = public;
ALTER FUNCTION public.update_course_proposal_updated_at SET search_path = public;
ALTER FUNCTION public.record_user_activity SET search_path = public;
ALTER FUNCTION public.update_expert_credentials_updated_at SET search_path = public;
ALTER FUNCTION public.calculate_ai_cost SET search_path = public;
ALTER FUNCTION public.get_user_streak SET search_path = public;
