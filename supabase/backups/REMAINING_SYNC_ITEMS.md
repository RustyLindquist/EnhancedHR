# Remaining Production Sync Items
Generated: 2023-12-23

## Summary of Analysis

After comprehensive comparison of all 35 migration files against the production backup, here's what's still needed:

---

## 1. TABLES MISSING FROM PRODUCTION

### Employee Groups & Assignments (from `20251213000000_create_groups_and_assignments.sql`)

**Tables needed:**
- `employee_groups` - For organizing employees into groups
- `employee_group_members` - Junction table for group membership
- `content_assignments` - For assigning courses/content to users/groups

**Impact:** These are needed for the Org Admin dashboard to assign content to employees.

**SQL to run:**
```sql
-- Full contents of: supabase/migrations/20251213000000_create_groups_and_assignments.sql
```

---

## 2. STORAGE BUCKET MISSING

### User Context Files Bucket (from `20251219000002_create_storage_bucket.sql`)

**What's needed:**
- Create `user-context-files` bucket
- Set up RLS policies for file uploads/access

**Impact:** Users won't be able to upload context files (PDFs, documents) for AI context.

**SQL to run:**
```sql
-- Full contents of: supabase/migrations/20251219000002_create_storage_bucket.sql
```

---

## 3. DATA SEEDS MISSING

### Backend AI Agents (from `20251222000004_seed_backend_ai_agents.sql`)

**What's needed:**
- Seed `ai_prompt_library` with backend agent configurations:
  - `embed_query` - For RAG query embedding
  - `embed_context_item` - For user context embedding
  - `embed_course_transcript` - For course content embedding
  - `embed_file_content` - For uploaded file embedding
  - `generate_conversation_title` - For chat title generation

**Impact:** Without these, the AI system won't know which models to use for various backend operations.

**SQL to run:**
```sql
-- Full contents of: supabase/migrations/20251222000004_seed_backend_ai_agents.sql
```

### Demo Course (from `20251222100000_seed_hr_analytics_demo_course.sql`)

**Status:** User indicated they ran this manually. Should verify course ID 1000 exists.

---

## 4. ALREADY IN SYNC (Verified)

- `profiles` table with expert application fields ✓ (just applied)
- `ai_prompt_library` table schema (has_prompt, category columns) ✓
- `match_unified_embeddings` function ✓
- All base tables ✓
- All RLS policies for core tables ✓

---

## RECOMMENDED EXECUTION ORDER

1. **Groups & Assignments Tables** (safe - creates new tables)
2. **Storage Bucket** (safe - creates new bucket)
3. **Backend AI Agents Seed** (safe - uses ON CONFLICT)
4. **Verify Demo Course** (check if course 1000 exists)

---

## COMBINED SQL SCRIPT

See: `supabase/backups/prod_final_sync.sql` for a single script containing all missing items.
