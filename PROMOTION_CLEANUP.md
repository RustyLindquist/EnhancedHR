# Course Promotion Feature Cleanup

After all courses are promoted to production, remove this temporary feature.

## When to Run This Cleanup

- All ~45 courses have been promoted
- All video processing is complete (check Admin > Promotions page)
- Production courses have been verified working

---

## Step 1: Delete Created Files

Remove all dedicated promotion files:

```bash
# API endpoints (production)
rm -rf src/app/api/course-import/

# Server actions (local)
rm src/app/actions/course-promotion.ts

# UI components (local)
rm src/components/admin/CoursePromotionButton.tsx

# Admin page (local)
rm -rf src/app/admin/promotions/

# This cleanup file
rm PROMOTION_CLEANUP.md
```

**Checklist:**
- [ ] `src/app/api/course-import/` (entire directory)
- [ ] `src/app/actions/course-promotion.ts`
- [ ] `src/components/admin/CoursePromotionButton.tsx`
- [ ] `src/app/admin/promotions/` (entire directory)
- [ ] `PROMOTION_CLEANUP.md` (this file)

---

## Step 2: Revert Modified Files

**File:** `src/app/admin/courses/page.tsx`

Remove these 2 lines:

```diff
- import CoursePromotionButton from '@/components/admin/CoursePromotionButton';
```

And remove the component usage (search for `CoursePromotionButton`):

```diff
- <CoursePromotionButton
-     course={course}
-     moduleCount={...}
-     lessonCount={...}
- />
```

---

## Step 3: Clean Environment Variables

**Local `.env.local`:**
```bash
# Remove these lines:
COURSE_IMPORT_SECRET=your-secret-here
PROD_APP_URL=https://enhancedhr.ai
```

**Production environment (Vercel):**
```bash
# Remove this variable:
COURSE_IMPORT_SECRET
```

---

## Step 4: Drop Status Table

Run this SQL on production Supabase:

```sql
DROP TABLE IF EXISTS course_import_status;
```

Or create a migration file:

```sql
-- supabase/migrations/XXXXXX_drop_course_import_status.sql
DROP TABLE IF EXISTS course_import_status;
```

---

## Step 5: Sync Local Database (Optional)

If you want local to match production exactly:

1. **Backup production database**
   ```bash
   pg_dump -h db.xxx.supabase.co -U postgres -d postgres > production_backup.sql
   ```

2. **Restore to local**
   ```bash
   # Reset local first
   supabase db reset

   # Then restore
   psql -h localhost -p 54322 -U postgres -d postgres < production_backup.sql
   ```

---

## Step 6: Deploy Cleanup

```bash
# Commit removal changes
git add -A
git commit -m "chore: Remove course promotion feature after migration complete"

# Push and deploy
git push origin main
```

---

## Files Summary

| Type | File | Action |
|------|------|--------|
| API | `src/app/api/course-import/route.ts` | Delete |
| API | `src/app/api/course-import/process-videos/route.ts` | Delete |
| API | `src/app/api/course-import/status/route.ts` | Delete |
| API | `src/app/api/course-import/status/all/route.ts` | Delete |
| Action | `src/app/actions/course-promotion.ts` | Delete |
| Component | `src/components/admin/CoursePromotionButton.tsx` | Delete |
| Page | `src/app/admin/promotions/page.tsx` | Delete |
| Modified | `src/app/admin/courses/page.tsx` | Remove 2 lines |
| Docs | `PROMOTION_CLEANUP.md` | Delete |
| Migration | `supabase/migrations/*_course_import_status.sql` | Keep (harmless) |
| DB Table | `course_import_status` | Drop |
| Env | `COURSE_IMPORT_SECRET` | Remove from local + prod |
| Env | `PROD_APP_URL` | Remove from local |

---

## Verification After Cleanup

1. **Build passes:** `pnpm build`
2. **No promotion UI:** Admin > Courses shouldn't show rocket icon
3. **No 404s:** `/admin/promotions` should 404
4. **App works normally:** Test course viewing, enrollment, etc.
