# Organization-Scoped Content Architecture

> **Status**: Active
> **Last Updated**: 2026-01-13

## Overview

This document describes the architecture for organization-scoped content in EnhancedHR.ai. Organization-scoped content is data that belongs exclusively to a specific organization and must only be accessible to members of that organization.

## Core Principles

### 1. org_id as the Scoping Mechanism

All org-scoped content uses `org_id` as the primary scoping column:
- `org_id = NULL`: Platform-wide content (public)
- `org_id = <UUID>`: Organization-specific content (private to org)

### 2. Double-Layer Security

Org-scoped content is protected at two levels:
1. **Database Layer (RLS)**: Row-level security policies prevent unauthorized access
2. **Application Layer (RAG)**: AI context resolution filters by org membership

This ensures even if one layer fails, the other provides protection.

### 3. Opt-Out vs Opt-In

Platform-wide features explicitly exclude org content:
- Global searches filter `WHERE org_id IS NULL`
- RAG scopes 1 and 2 exclude org content by design
- This prevents accidental cross-org exposure

## Database Schema Patterns

### Adding org_id to a Table

```sql
-- Add org_id column with cascade delete
ALTER TABLE public.<table_name>
ADD COLUMN org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for efficient filtering
CREATE INDEX idx_<table_name>_org_id ON public.<table_name>(org_id);

-- Document the column
COMMENT ON COLUMN public.<table_name>.org_id IS
  'Organization ID for org-scoped content. NULL indicates platform-wide content.';
```

### Standard RLS Policy Pattern

```sql
-- SELECT: Org members can read their org's content, admins see all
CREATE POLICY "<table>_select_policy" ON public.<table>
    FOR SELECT TO authenticated
    USING (
        -- Platform admins see all
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR
        -- Platform-wide content visible to all
        (org_id IS NULL)
        OR
        -- Org content visible to org members
        (org_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND profiles.org_id = <table>.org_id
        ))
    );

-- INSERT: Org admins can create for their org
CREATE POLICY "<table>_insert_policy" ON public.<table>
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Platform admins can insert any
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR
        -- Org admins can create for their org
        (org_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND profiles.org_id = <table>.org_id
            AND profiles.membership_status = 'org_admin'
        ))
    );

-- UPDATE: Org admins can modify their org's content
CREATE POLICY "<table>_update_policy" ON public.<table>
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR
        (org_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND profiles.org_id = <table>.org_id
            AND profiles.membership_status = 'org_admin'
        ))
    );

-- DELETE: Org admins can delete their org's content
CREATE POLICY "<table>_delete_policy" ON public.<table>
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        OR
        (org_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND profiles.org_id = <table>.org_id
            AND profiles.membership_status = 'org_admin'
        ))
    );
```

## RAG Integration Architecture

### unified_embeddings Table

The `unified_embeddings` table stores all embedded content for AI retrieval:

```sql
unified_embeddings (
    id UUID PRIMARY KEY,
    user_id UUID,           -- For user-specific content
    course_id BIGINT,       -- For course content
    collection_id UUID,     -- For collection-scoped content
    org_id UUID,            -- For org-scoped content (NEW)
    source_type TEXT,       -- 'lesson', 'org_course', 'custom_context', etc.
    source_id TEXT,
    content TEXT,
    embedding vector(768),
    metadata JSONB
);
```

### match_unified_embeddings RPC Function

The RAG entry point supports 8 scope types:

| Scope | Flag/Parameter | Description |
|-------|---------------|-------------|
| 1 | `isGlobalAcademy=true` | All public course content (excludes org) |
| 2 | `isPlatformScope=true` | All public courses + user context (excludes org) |
| 3 | `allowedCourseIds` | Specific courses only |
| 4 | `collectionId` | Specific collection's context |
| 5 | `allowedItemIds` | Specific items by ID |
| 6 | `includePersonalContext=true` | User's global context (default) |
| 7 | `includeAllUserContext=true` | All user context across collections |
| 8 | `orgId` | **Org-scoped content for org members** |

### SCOPE 8: Org Content Filtering

```sql
-- SCOPE 8: Org-scoped content (ONLY for members of that org)
(
    scope_org_id IS NOT NULL
    AND ue.org_id = scope_org_id
)
```

This ensures:
- Org content only returns when explicitly requested
- The caller must provide the user's org_id
- Cross-org content is impossible to retrieve

### Context Resolver Pattern

```typescript
// In context-resolver.ts
export interface RAGScope {
    // ... existing fields ...
    orgId?: string;  // Filter to org-specific content
}

export interface PageContext {
    type: 'COLLECTION' | 'COURSE' | 'PAGE' | 'PLATFORM' | 'DASHBOARD' | 'USER' | 'ORG_COURSES';
    id?: string;
    collectionId?: string;
    agentType?: string;
    orgId?: string;  // For org-scoped contexts
}

// Handling org-scoped context
if (context.type === 'ORG_COURSES') {
    const userOrgId = context.orgId || profile?.org_id;
    if (userOrgId) {
        return {
            ...baseScope,
            orgId: userOrgId,
            isPlatformScope: true  // Also allow general questions
        };
    }
}
```

## Adding New Org-Scoped Content Types

### Step 1: Database Changes

1. Add `org_id` column to the content table
2. Create appropriate RLS policies
3. If the content should be searchable via AI:
   - Add a new `embedding_source_type` enum value
   - Create embedding generation logic

### Step 2: Type System Updates

1. Update `ContextScopeType` in `src/lib/ai/types.ts`:
```typescript
export type ContextScopeType = 'COURSE' | 'COLLECTION' | 'PLATFORM' | 'USER' | 'ORG_COURSES' | 'NEW_ORG_TYPE';
```

2. Update `AgentType` if needed:
```typescript
export type AgentType = ... | 'new_org_agent';
```

### Step 3: Context Resolver

Add handling in `ContextResolver.resolve()`:
```typescript
if (context.type === 'NEW_ORG_TYPE') {
    return {
        ...baseScope,
        orgId: userOrgId,
        // Additional scope configuration
    };
}
```

### Step 4: AI Panel Integration

Configure the agent display in `AIPanel.tsx`:
```typescript
case 'new_org_agent': return {
    name: 'New Org Feature',
    icon: SomeIcon,
    color: 'text-amber-400',
    themeColor: 'bg-amber-400'
};
```

### Step 5: Layout Integration

Include AIPanel in the feature's layout:
```tsx
<AIPanel
    isOpen={rightOpen}
    setIsOpen={setRightOpen}
    agentType="new_org_agent"
    contextScope={{ type: 'NEW_ORG_TYPE', id: userOrgId } as ContextScope}
    contextTitle="New Org Feature"
/>
```

## Security Considerations

### Verifying Org Membership

Always verify org membership before returning org content:

```typescript
// In server actions
const orgContext = await getOrgContext();

if (!orgContext) {
    return { error: 'No organization context' };
}

// Verify user can access this specific org
if (!orgContext.isPlatformAdmin && orgContext.orgId !== targetOrgId) {
    return { error: 'Access denied to this organization' };
}
```

### Service Role Usage

When using `createAdminClient()` (service role):
- Always verify user permissions before the operation
- Include org_id in all queries to prevent cross-org operations
- Log sensitive operations for audit

```typescript
// CORRECT: Verify permissions, then use admin client
const orgContext = await getOrgContext();
if (!orgContext.isOrgAdmin) {
    return { error: 'Only org admins can perform this action' };
}

const admin = createAdminClient();
// Now safe to proceed with admin operations
```

### Embedding Security

When generating embeddings for org content:
- ALWAYS set `org_id` on the embedding row
- Use `source_type` to distinguish org content from platform content
- Delete embeddings when content is deleted or access is revoked

```typescript
await admin.from('unified_embeddings').insert({
    user_id: null,  // Org content is not user-specific
    course_id: courseId,
    org_id: orgId,  // REQUIRED for org content
    source_type: 'org_course',
    content: chunk,
    embedding: embedding,
    metadata: { ... }
});
```

## Current Implementations

### Organization Courses
- **Table**: `courses` with `org_id` column
- **Embeddings**: `unified_embeddings` with `source_type='org_course'`
- **Context Type**: `ORG_COURSES`
- **Agent Type**: `org_course_assistant`
- **Documentation**: `docs/features/org-courses.md`

### Organization Collections
- **Table**: `user_collections` with `org_id` and `is_org_collection` flag
- **Context Type**: Uses collection scope with org validation
- **Documentation**: `docs/features/organization-membership.md`

### Organization Groups
- **Table**: `employee_groups` with `org_id`
- **Used for**: Content assignments, team analytics
- **Documentation**: `docs/features/dynamic-groups.md`

## Testing Org-Scoped Features

### Cross-Org Isolation Test
1. Create test data in Org A
2. Authenticate as user in Org B
3. Attempt to access Org A's content via:
   - Direct API call
   - UI navigation
   - RAG query
4. Verify all access is denied

### Permission Escalation Test
1. Authenticate as regular employee
2. Attempt to:
   - Create org content (should fail)
   - Edit org content (should fail)
   - Delete org content (should fail)
3. Verify all actions require org_admin role

### RAG Scope Test
1. Create org-specific content
2. Authenticate as org member
3. Query AI with org context scope
4. Verify org content is returned
5. Query AI with platform scope
6. Verify org content is NOT returned

## Related Documentation

- `docs/features/organization-membership.md` - Org membership model
- `docs/features/org-courses.md` - Organization courses feature
- `docs/features/ai-context-engine.md` - RAG system overview
- `docs/foundation/auth-roles-rls.md` - RLS patterns and practices
