# Spawn Backend Agent

<!-- Version: 1.0.0 | Last Updated: 2026-01-07 -->

> **Cost**: ~4× token usage for single agent spawn. Ensure task warrants dedicated agent.

Spawn the Backend Agent (API Guardian) to handle server-side implementation work.

## When to Use

Use this command for ANY backend work:
- Creating or modifying server actions
- Creating or modifying RLS policies
- Creating database migrations
- Implementing API routes
- Using createAdminClient() for admin operations
- Implementing Edge Functions
- Modifying database queries or data access patterns

## When NOT to Use

Skip the Backend Agent ONLY when ALL of these are true:
- Pure frontend/UI work (that's Frontend Agent)
- Content/text changes with no backend logic
- Documentation-only updates
- No database, API, or server action involvement

### Examples: Skip Backend Agent

| Task | Why Skip |
|------|----------|
| "Change button text" | Frontend only |
| "Update component styling" | Frontend only |
| "Fix typo in page content" | Content only |
| "Update README" | Documentation only |

### Examples: DO NOT Skip Backend Agent

| Task | Why Spawn |
|------|-----------|
| "Add user profile update action" | Server action implementation |
| "Create RLS policy for new table" | Security/RLS work |
| "Add new API endpoint" | Backend API work |
| "Implement course enrollment logic" | Server action + data |
| "Create migration for new feature" | Database schema change |
| "Add admin dashboard analytics query" | Server action + possibly admin client |
| "Fix permission error in action" | Backend security issue |

**When in doubt, spawn.** The Backend Agent ensures security and pattern consistency.

## What Happens

1. Backend Agent spawns and:
   - Queries Doc Agent (if available) for feature context
   - Loads relevant feature docs to understand constraints
   - Identifies affected tables and data models

2. For each task, the agent follows this workflow:
   - Understand scope (features, tables, data)
   - Check existing patterns (how we do this currently)
   - Analyze RLS implications (security policies)
   - Implement safely (following patterns)
   - Document & verify (update docs, provide SQL)

3. Returns completed, validated work with:
   - Implementation details
   - Security verification
   - Migration SQL (if applicable)
   - Documentation updates

## How to Delegate Work

```
@backend-agent: Create a server action for updating user profile settings

@backend-agent: Add RLS policies for the new `notes` table

@backend-agent: Implement course enrollment action with entitlement check

@backend-agent: Create migration to add `skills` column to courses table

@backend-agent: Fix the permission error in deleteConversationAction
```

## Backend Agent Skills

The agent has access to these conceptual skills:

| Skill | Purpose |
|-------|---------|
| `action-pattern` | Server action implementation templates |
| `rls-check` | Verify RLS policies before changes |
| `migration-safety` | Safe migration workflow |
| `admin-client-usage` | When/how to use admin client |
| `backend-validation` | Security and pattern validation |

## Patterns the Agent Enforces

### Server Actions
- Always start with `'use server'`
- Check authentication via `supabase.auth.getUser()`
- Validate input from FormData or parameters
- Handle errors gracefully (never leak schema info)
- Revalidate paths where needed
- Return consistent shape: `{ error } | { success, data }`

### RLS Policies
- Users can only access own data
- Org admins can access org-scoped data
- Platform admins have controlled broad access
- No data leakage across organizations
- Policies named clearly and consistently

### Migrations
- Always test locally first
- Additive changes are preferred (safe)
- Destructive changes require explicit approval
- Provide production SQL script
- Include rollback plan for risky changes

### Admin Client
- Check user permissions BEFORE using admin client
- Document reason for admin access
- Never bypass security for convenience
- Log admin operations for audit trail

## Anti-Patterns Prevented

- Using admin client without permission checks
- Skipping auth checks ("I'll add it later")
- Hardcoding user/org IDs
- Silent error catching (always log)
- RLS policies that leak data
- Dropping columns without approval
- Bypassing RLS for convenience
- Returning raw database errors to users
- Modifying existing migrations
- Not testing locally before committing

## Coordination with Doc Agent

For complex backend features, the Backend Agent will coordinate with Doc Agent:
- Query for feature invariants and constraints
- Understand data model relationships
- Verify RLS requirements
- Check integration points with other features

## Coordination with Frontend Agent

When backend changes affect frontend:
- Backend Agent provides API contract (parameters, return types)
- Frontend Agent updates components to use new actions
- Both agents ensure type safety at the boundary

## Coordination with Test Agent

After implementation:
- Backend Agent provides test scenarios
- Test Agent verifies:
  - Authenticated users can perform actions
  - Unauthenticated users get proper errors
  - RLS prevents cross-user/org access
  - Migrations run successfully

## Security Checklist

The Backend Agent ensures:
- [ ] Auth verified in all actions
- [ ] RLS considered for all data access
- [ ] Input validated and sanitized
- [ ] Errors handled without leaking schema
- [ ] Admin client usage justified and documented
- [ ] Migrations are safe (or have approval)
- [ ] Rollback plan for destructive changes
- [ ] Locally tested before committing
- [ ] Patterns followed consistently
- [ ] Documentation updated

## High-Risk Areas

The Backend Agent pays EXTRA attention to:
- **Auth & Sessions**: Never trust client-side state
- **Org Scoping**: Always verify org_id matches
- **Billing & Entitlements**: Server-side validation only
- **AI Context**: Sanitize input, respect boundaries
- **File Uploads**: Validate type/size server-side

For these areas, Doc Agent consultation is MANDATORY.

## Migration Workflow

For database schema changes:

1. **Planning**: Understand change, review constraints, plan rollback
2. **Local Development**: Create migration, test locally, verify
3. **Production Preparation**: Create production SQL, document impact
4. **Approval & Handoff**: Present to user, wait for approval, provide SQL

Migration risk levels:
- **Low**: Add column/table, add index
- **Medium**: Modify index, create RLS
- **High**: Modify column type, modify RLS, drop column
- **Critical**: Drop table (data loss)

## Expected Output Format

```
## Task Completed: [description]

### Implementation Summary
- Server actions: [created/modified files]
- RLS policies: [affected policies]
- Migrations: [migration files]
- Admin client usage: [Yes/No + justification]

### Security Verification
✓ Auth checked
✓ RLS respects boundaries
✓ Input validated
✓ Errors handled safely

### Migration SQL (if applicable)
[Production-ready SQL with rollback plan]

### Files Changed
- src/app/actions/[file].ts
- supabase/migrations/[file].sql

### Verification Steps
- [How to test this works]

### Documentation
- [Docs updated or "Follows existing patterns"]
```

## Full Specification

See `.claude/agents/backend-agent.md` for the complete agent prompt.
