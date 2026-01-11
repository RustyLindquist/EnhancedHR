---
description: Spawn the Security Agent (Security Auditor) for security review and vulnerability detection
---

# Spawn Security Agent

<!-- Version: 1.0.0 | Last Updated: 2026-01-10 -->

> **Cost**: ~4× token usage. Uses **Opus** model for security-critical analysis.

Spawn the Security Agent (Security Auditor) to perform security reviews, vulnerability detection, and security best practices enforcement.

## When to Use

Use this command for security work:
- Pre-deployment security review
- RLS policy auditing
- Authentication flow review
- Vulnerability assessment
- Security incident response
- New feature security review

## When NOT to Use

Skip the Security Agent ONLY when ALL are true:
- Pure styling/content change
- No data access involved
- No auth implications
- No user input handling

### Examples: Skip Security Agent

| Task | Why Skip |
|------|----------|
| "Change button color" | No security implications |
| "Update page title" | Content only |
| "Fix CSS alignment" | Styling only |

### Examples: DO NOT Skip Security Agent

| Task | Why Spawn |
|------|-----------|
| "Add new server action for payments" | Billing security |
| "Review auth implementation" | Auth security |
| "Add file upload feature" | Input validation |
| "Pre-deployment check" | Security gate |
| "New RLS policy needed" | Data access security |

## What Happens

1. Security Agent spawns with **Opus** model and:
   - Loads auth-roles-rls foundation doc
   - Identifies trust boundaries
   - Loads relevant feature docs

2. For security review:
   - Models potential threats
   - Audits code for vulnerabilities
   - Reviews RLS policies
   - Checks OWASP Top 10

3. Returns security report with:
   - Risk assessment
   - Categorized findings
   - Remediation recommendations
   - Verification steps

## How to Delegate Work

```
@security-agent: Review the security of the new enrollment server action

@security-agent: Audit RLS policies for the courses table

@security-agent: Pre-deployment security check for the payments feature

@security-agent: Review auth flow for potential vulnerabilities

@security-agent: Check for SQL injection in the search implementation
```

## Severity Levels

| Severity | Response | Examples |
|----------|----------|----------|
| **Critical** | Immediate fix | RLS bypass, no auth check |
| **High** | Same day | Privilege escalation |
| **Medium** | Within week | Missing validation |
| **Low** | Track | Best practice violation |

## Coordination

After Security Agent identifies issues:
- **Backend Agent** implements security fixes
- **Architect Agent** reviews if architectural changes needed
- **Test Agent** verifies fixes don't break functionality

## Expected Output Format

```
## Security Audit Report: [Area]

### Risk Assessment
- Overall Risk: [Level]
- Data Sensitivity: [Level]

### Findings

#### Finding 1: [Title] (CRITICAL)
- Location: [file:line]
- Issue: [description]
- Impact: [what could happen]
- Recommendation: [how to fix]

### RLS Policy Review
| Table | Policy | Status |
|-------|--------|--------|

### Recommendations Summary
| Priority | Finding | Effort |
|----------|---------|--------|
```

## Security Checklist

The Security Agent verifies:
- [ ] All server actions check auth
- [ ] RLS policies prevent cross-tenant access
- [ ] Input validation on all user data
- [ ] No sensitive data in client code
- [ ] Dependencies have no known vulnerabilities
- [ ] Error messages don't leak schema info

## Full Specification

See `.claude/agents/security-agent.md` for the complete agent prompt.
