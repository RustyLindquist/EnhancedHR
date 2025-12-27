-- AI Analytics Schema Validation Script
-- Run this to verify all required migrations have been applied

-- Results will show: ✓ for present, ✗ for missing

SELECT '=== AI ANALYTICS SCHEMA VALIDATION ===' as section;

-- 1. Check ai_logs table columns (from 20251227000001_ai_cost_tracking.sql)
SELECT '--- ai_logs columns ---' as section;

SELECT
    'prompt_tokens' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'prompt_tokens'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

SELECT
    'completion_tokens' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'completion_tokens'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

SELECT
    'total_tokens' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'total_tokens'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

SELECT
    'model_id' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'model_id'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

SELECT
    'cost_usd' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'cost_usd'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

SELECT
    'org_id' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'org_id'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 2. Check ai_model_pricing_cache table
SELECT '--- ai_model_pricing_cache table ---' as section;

SELECT
    'ai_model_pricing_cache table' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_model_pricing_cache'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 3. Check ai_analytics_summaries table
SELECT '--- ai_analytics_summaries table ---' as section;

SELECT
    'ai_analytics_summaries table' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ai_analytics_summaries'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 4. Check analytics_assistant in ai_system_prompts (from 20251227000002)
SELECT '--- analytics_assistant agent ---' as section;

SELECT
    'analytics_assistant prompt' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM public.ai_system_prompts
        WHERE agent_type = 'analytics_assistant'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 5. Check RLS policies (from 20251227000003)
SELECT '--- RLS Policies ---' as section;

SELECT
    'Org Admins can view org logs policy' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'ai_logs' AND policyname = 'Org Admins can view org logs'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

SELECT
    'Admins can manage analytics summaries policy' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'ai_analytics_summaries' AND policyname = 'Admins can manage analytics summaries'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 6. Check indexes
SELECT '--- Indexes ---' as section;

SELECT
    'idx_ai_logs_org_id index' as check_item,
    CASE WHEN EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'ai_logs' AND indexname = 'idx_ai_logs_org_id'
    ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 7. Summary count
SELECT '=== SUMMARY ===' as section;

SELECT
    (SELECT COUNT(*) FROM (
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'prompt_tokens')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'completion_tokens')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'total_tokens')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'model_id')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'cost_usd')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'ai_logs' AND column_name = 'org_id')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_model_pricing_cache')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_analytics_summaries')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM public.ai_system_prompts WHERE agent_type = 'analytics_assistant')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_logs' AND policyname = 'Org Admins can view org logs')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_analytics_summaries' AND policyname = 'Admins can manage analytics summaries')
        UNION ALL SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'ai_logs' AND indexname = 'idx_ai_logs_org_id')
    ) as checks) || ' / 12 checks passed' as validation_result;
