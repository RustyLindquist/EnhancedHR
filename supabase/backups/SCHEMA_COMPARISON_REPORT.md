# Schema Comparison Report: Local vs Production
Generated: 2023-12-23

## Summary
Production database backup saved to: `prod_backup_20251223_090954.sql`

---

## Schema Differences Found

### 1. `courses` Table

**Production has:**
- id, title, author, category, description, image_url, duration, rating, badges, created_at
- drive_folder_id, sync_status, last_synced_at (for Google Drive sync)

**Local migrations add (NOT in prod):**
- `is_saved` (boolean) - from `20251130000005_update_courses_schema.sql`
- `status` (text, default 'draft') - from `20251130000005_update_courses_schema.sql`

**Analysis:** `is_saved` appears to be computed client-side (based on user collections), so it's not needed in the database. `status` might be useful for draft/published workflow but isn't currently used in the app.

---

### 2. `profiles` Table

**Production has:**
- Core fields: id, full_name, avatar_url, role, created_at, trial_minutes_used
- Org fields: org_id, membership_status
- Stripe fields: stripe_customer_id, stripe_subscription_id, stripe_price_id, billing_period_end
- Author fields: author_status, author_bio, linkedin_url
- AI fields: ai_insights

**Local migrations add (NOT in prod):**
- `credentials` (text) - expert qualifications
- `course_proposal_title` (text) - proposed course title
- `course_proposal_description` (text) - proposed course description
- `application_status` (text) - expert application workflow status
- `application_submitted_at` (timestamp) - application timestamp
- `phone_number` (text) - from `20251222000003_add_phone_number.sql`

**Analysis:** These fields are needed for the Expert Application feature. Should be added to production.

---

### 3. Tables Present in Both (Verified)
- ai_attribution_logs ✓
- ai_content_citations ✓
- ai_prompt_library ✓
- ai_system_prompts ✓ (has `model` column)
- certificates ✓
- collection_items ✓
- context_embeddings ✓
- conversation_messages ✓
- conversations ✓
- course_embeddings ✓
- course_ratings ✓
- lessons ✓
- modules ✓
- organizations ✓
- prompt_suggestions ✓
- resources ✓
- unified_embeddings ✓
- user_ai_memory ✓
- user_assessment_attempts ✓
- user_collections ✓
- user_context_items ✓
- user_credits_ledger ✓
- user_progress ✓

---

## Migrations NOT Applied to Production

Based on analysis, these migrations likely need to be run on production:

1. **`20251130000005_update_courses_schema.sql`** - Adds `is_saved` and `status` to courses
   - **SKIP `is_saved`** - Not actually used (computed client-side)
   - **SKIP `status`** - Not currently used in app

2. **`20251222000001_add_expert_application_fields.sql`** - Expert application fields
   - **NEEDED** - For expert application workflow

3. **`20251222000003_add_phone_number.sql`** - Adds phone_number to profiles
   - **NEEDED** - For expert application contact info

4. **`20251222000004_seed_backend_ai_agents.sql`** - Seeds AI agent configs
   - **CHECK** - May already have equivalent data

5. **`20251222100000_seed_hr_analytics_demo_course.sql`** - Demo course
   - **NEEDED** - After removing is_saved/status columns (ALREADY DONE)

---

## Recommended Sync Strategy

### Step 1: Apply Missing Schema Changes (Safe)
Run these migrations on production:
```sql
-- From 20251222000001_add_expert_application_fields.sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credentials text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course_proposal_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS course_proposal_description text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'draft'
  CHECK (application_status IN ('draft', 'submitted', 'reviewing', 'approved', 'rejected'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS application_submitted_at timestamp with time zone;

-- From 20251222000003_add_phone_number.sql
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number text;
```

### Step 2: Seed Demo Course (Safe)
Run the updated `20251222100000_seed_hr_analytics_demo_course.sql` (already fixed to not use is_saved/status)

### Step 3: Verify AI Prompts Data
Check if ai_system_prompts and ai_prompt_library tables have the latest agent configurations

---

## Data on Production to Preserve
- User accounts and profiles
- Course enrollments and progress
- Conversations and AI memory
- Collections and saved items
- Certificates issued

---

## Rollback Plan
If anything breaks, restore from: `prod_backup_20251223_090954.sql`
```bash
# To restore (USE WITH CAUTION):
# psql $PROD_DATABASE_URL < supabase/backups/prod_backup_20251223_090954.sql
```
