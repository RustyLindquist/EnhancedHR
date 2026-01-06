# Platform Administrator Workflows

> **Status**: Stub — to be populated as workflows are discovered and documented
> **Last Updated**: 2026-01-04

## Role Overview

Platform Administrators have full access to manage the EnhancedHR.ai platform. They handle user management, course oversight, billing administration, AI configuration, and system health monitoring.

**Primary Goals**:
- Ensure platform operates smoothly
- Manage users and organizations
- Oversee content quality and approval
- Configure AI behavior
- Handle billing and payouts

**Access Level**: Full platform access via `/admin/*` routes

## Primary Workflows

### User Management

**Goal**: Add, modify, or deactivate user accounts
**Frequency**: Daily
**Features Involved**: `admin-portal`, `auth-accounts`

#### Steps
1. Navigate to Admin Portal (`/admin`)
2. Select Users section
3. Search/filter for user
4. View user details
5. Modify permissions/status as needed
6. Save changes

#### Variations
- Bulk user operations
- Organization assignment changes
- Role elevation/demotion

#### Success Criteria
- User account reflects intended changes
- User can/cannot access appropriate features

#### Related Workflows
- Organization Management
- Billing Administration

---

### Course Approval

**Goal**: Review and approve/reject submitted courses
**Frequency**: Weekly
**Features Involved**: `admin-portal`, `author-portal`, `academy`

#### Steps
1. Navigate to Admin Portal → Courses
2. Filter by "Pending Approval"
3. Select course for review
4. Review content, pricing, metadata
5. Approve or request changes
6. Course becomes visible (if approved)

#### Variations
- Request revisions from author
- Reject with feedback

#### Success Criteria
- Approved courses appear in Academy
- Authors notified of decision

#### Related Workflows
- Expert Payout Management

---

### AI Configuration

**Goal**: Manage system prompts and AI behavior
**Frequency**: Monthly / As needed
**Features Involved**: `admin-portal`, `ai-context-engine`, `prometheus-chat`

#### Steps
1. Navigate to Admin Portal → AI / Prompts
2. Select prompt category to modify
3. Edit prompt content
4. Test changes (if available)
5. Save and deploy

#### Variations
- A/B testing prompts
- Role-specific prompt overrides

#### Success Criteria
- AI behavior reflects intended changes
- No degradation in response quality

#### Related Workflows
- AI Log Review

---

### Billing Administration

**Goal**: Manage subscriptions, handle billing issues, process payouts
**Frequency**: Weekly
**Features Involved**: `admin-portal`, `membership-billing`

#### Steps
1. Navigate to Admin Portal → Billing
2. Review subscription status / issues
3. Handle refunds or adjustments as needed
4. Process expert payouts

#### Variations
- Subscription upgrades/downgrades
- Dispute resolution
- Payout schedule management

#### Success Criteria
- Billing issues resolved
- Payouts processed accurately

#### Related Workflows
- Organization Management (seat billing)

---

## Workflows To Document

The following workflows have been identified but not yet documented:
- [ ] Organization Management
- [ ] Expert Payout Management
- [ ] AI Log Review
- [ ] System Health Monitoring
- [ ] Content Moderation

---

## Notes for Agents

When working on features that affect Platform Admin:
1. Check if workflow is documented above
2. If not, document it before making changes
3. Verify changes don't break existing workflow steps
4. Update this doc if workflow changes
