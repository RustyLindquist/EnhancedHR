# Auth, Roles & RLS Foundation

This document covers the authentication, authorization, and Row-Level Security patterns used across EnhancedHR.ai. **Read this before any work touching auth, permissions, or protected data.**

## Role Hierarchy

```
PLATFORM_ADMIN (super-admin)
    └── ORG_ADMIN (org-level admin)
        └── ORG_MEMBER (employee in org)
            └── USER (individual subscriber)
                └── ANONYMOUS (unauthenticated)
```

### Role Definitions

| Role | Stored In | Grants |
|------|-----------|--------|
| `platform_admin` | `profiles.role` | Full system access, admin portal |
| `org_admin` | `profiles.is_org_admin` | Org dashboard, member management |
| `org_member` | `profiles.org_id IS NOT NULL` | Org content, shared collections |
| `user` | Authenticated session | Personal data, courses, AI |
| `anonymous` | No session | Public content only |

## Authentication Flow

### Session Establishment

```
User clicks login
    → Supabase Auth (email/magic link or OAuth)
    → Session cookie set
    → Profile loaded from profiles table
    → Role determined from profile
```

### Session Verification

```typescript
// Client-side
const { data: { user } } = await supabase.auth.getUser()

// Server-side (server actions)
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

## RLS Patterns

### Pattern 1: User-Owned Data

Most tables use owner-based RLS:

```sql
-- SELECT: User can read own rows
CREATE POLICY "users_select_own" ON table_name
FOR SELECT USING (auth.uid() = user_id);

-- INSERT: User can insert own rows
CREATE POLICY "users_insert_own" ON table_name
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: User can update own rows
CREATE POLICY "users_update_own" ON table_name
FOR UPDATE USING (auth.uid() = user_id);
```

### Pattern 2: Org-Scoped Data

Org data uses org_id check:

```sql
-- User can access if they belong to the org
CREATE POLICY "org_members_select" ON table_name
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);
```

### Pattern 3: Public Read, Owner Write

Content tables (courses, prompts) often allow public read:

```sql
-- Anyone authenticated can read
CREATE POLICY "authenticated_read" ON courses
FOR SELECT TO authenticated USING (true);

-- Only admins can write
CREATE POLICY "admin_write" ON courses
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin')
);
```

### Pattern 4: Platform Admin Override

Admin policies grant full access:

```sql
CREATE POLICY "admin_all" ON table_name
FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'platform_admin')
);
```

## Admin Client Usage

### When to Use `createAdminClient()`

**USE** when:
- Server action needs to bypass RLS for legitimate reasons
- Inserting system-generated data (AI insights, credits)
- Cross-user operations (admin managing users)
- Background jobs without user session

**NEVER USE** to:
- Bypass RLS because "it's easier"
- Skip permission checks you don't understand
- Access user data without authorization

### Safe Admin Client Pattern

```typescript
import { createAdminClient } from '@/utils/supabase/admin'

export async function awardCredits(userId: string, amount: number) {
  // ALWAYS verify authorization first
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Only proceed if admin or system process
  if (!user || !await isAdmin(user.id)) {
    throw new Error('Unauthorized')
  }

  // Now safe to use admin client
  const adminClient = createAdminClient()
  await adminClient.from('credit_ledger').insert({
    user_id: userId,
    amount,
    reason: 'system_award'
  })
}
```

## Common Pitfalls

### Pitfall 1: RLS Blocking Legitimate Access

**Symptom**: Query returns empty when data exists

**Fix**: Check if RLS policy expects user_id match:
```sql
-- Debug: Check what RLS sees
SELECT auth.uid();
SELECT * FROM table_name WHERE user_id = auth.uid();
```

### Pitfall 2: Admin Client Leaking

**Symptom**: Security audit shows unprotected admin access

**Fix**: Admin client should NEVER be exposed to client code. Keep in server actions only.

### Pitfall 3: Missing Auth Check

**Symptom**: Unauthenticated users accessing protected data

**Fix**: Always check auth before data access:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Not authenticated')
```

### Pitfall 4: Role Escalation

**Symptom**: User gaining unintended permissions

**Fix**: Never trust client-provided role. Always verify from database:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_org_admin, org_id')
  .eq('id', user.id)
  .single()
```

## Testing Auth Changes

### Local Testing Checklist

1. Test as anonymous (logged out)
2. Test as regular user
3. Test as org member
4. Test as org admin
5. Test as platform admin
6. Test cross-org access (should fail)
7. Test cross-user access (should fail)

### RLS Testing Query

```sql
-- Temporarily become a user to test RLS
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';

-- Run your query
SELECT * FROM protected_table;

-- Reset
RESET ROLE;
```

## Key Invariants

1. **Never bypass RLS without explicit authorization check**
2. **Admin client stays server-side only**
3. **Role comes from database, never client**
4. **Cross-org access is always blocked**
5. **User data ownership enforced at RLS level**

## Implementation Guidance

**Primary Agent**: Backend Agent
**Skills to Use**:
- `/doc-discovery` — Understand which features touch auth
- `/plan-lint` — Validate RLS changes don't break existing policies
- `/test-from-docs` — Generate auth test scenarios

**Before changing auth/RLS**:
1. Map all affected tables and policies
2. Test current behavior (document baseline)
3. Plan migration if needed
4. Test all role combinations after change

## Related Docs

- `docs/features/auth-accounts.md` — Auth feature doc
- `docs/features/organization-membership.md` — Org-level permissions
- `docs/features/admin-portal.md` — Admin access patterns
- `.claude/agents/SAFETY_RULES.md` — Safety rules for agents
