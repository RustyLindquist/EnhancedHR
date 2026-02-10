# Organization Admin Workflows

> **Status**: Stub — to be populated as workflows are discovered and documented
> **Last Updated**: 2026-01-04

## Role Overview

Organization Admins manage their company's learning program on EnhancedHR.ai. They handle team membership, content assignments, and track team progress and ROI.

**Primary Goals**:
- Manage team members (add/remove)
- Assign learning content to team
- Track team progress and engagement
- Demonstrate ROI to stakeholders
- Manage organization billing (seats)

**Access Level**: Organization-scoped access via `/org/*` routes

## Primary Workflows

### Organization Hub Navigation

**Goal**: Access organization features from the centralized hub
**Frequency**: Daily
**Features Involved**: `my-organization-hub`, `app-shell`

#### Steps
1. Click "My Organization" in the left navigation sidebar
2. Hub page displays feature cards based on admin permissions (all 5 cards visible for org admins)
3. Click the desired card to navigate to that feature area:
   - Users and Groups — manage team members and groups
   - Analytics — view org learning metrics
   - Organization Courses — create/manage org courses
   - Org Collections — manage shared collections
   - My Assigned Learning — view personal assignments

#### Variations
- Hub replaces the old expandable "My Organization" nav section
- Organization Courses card navigates to `/org-courses` (full page route)
- Other cards navigate to virtual collections within MainCanvas

#### Success Criteria
- All relevant org feature cards visible
- Each card navigates to the correct feature area

#### Related Workflows
- Team Member Management
- Content Assignment
- Organization Course Management

---

### Team Member Management

**Goal**: Add or remove employees from the organization
**Frequency**: Weekly / As needed
**Features Involved**: `organization-membership`, `auth-accounts`

#### Steps
1. Navigate to My Organization hub, then click "Users and Groups" card (or navigate directly to `/org/team`)
2. Click "Add Member" or select existing member
3. For new: Enter email, select role
4. System sends invitation email
5. Member accepts and joins organization
6. Member appears in team list

#### Variations
- Bulk member import (CSV)
- Remove member (with content reassignment)
- Change member role

#### Success Criteria
- Member has access to organization content
- Seat count updated in billing

#### Related Workflows
- Content Assignment
- Billing Management

---

### Content Assignment

**Goal**: Assign courses or learning paths to team members
**Frequency**: Weekly
**Features Involved**: `organization-membership`, `collections-and-context`, `course-player-and-progress`

#### Steps
1. Navigate to My Organization hub, then click "Org Collections" card (or navigate directly to `/org/collections`)
2. Select or create a collection
3. Add courses to collection
4. Assign collection to team/individuals
5. Team members see assigned content in their dashboard

#### Variations
- Assign to groups vs individuals
- Set due dates
- Required vs optional assignments

#### Success Criteria
- Assigned content appears in employee dashboards
- Progress tracking begins when employee starts

#### Related Workflows
- Progress Monitoring
- Team Member Management

---

### Progress Monitoring

**Goal**: Track team learning progress and completion
**Frequency**: Daily / Weekly
**Features Involved**: `organization-membership`, `course-player-and-progress`, `dashboard`

#### Steps
1. Navigate to My Organization hub, then click "Analytics" card (or navigate directly to `/org/analytics`)
2. View team progress dashboard
3. Filter by team, individual, or content
4. Identify completion rates, engagement
5. Drill down into individual progress as needed

#### Variations
- Export reports
- Set up progress alerts
- Compare team performance

#### Success Criteria
- Clear visibility into team learning status
- Actionable insights for follow-up

#### Related Workflows
- Content Assignment
- ROI Reporting

---

### Billing Management (Seats)

**Goal**: Manage organization subscription and seat allocation
**Frequency**: Monthly / As needed
**Features Involved**: `membership-billing`, `organization-membership`

#### Steps
1. Navigate to Organization Billing
2. View current seat allocation
3. Add/remove seats as needed
4. Update payment method if required
5. View billing history

#### Variations
- Annual vs monthly billing
- Seat upgrades during period

#### Success Criteria
- Team has appropriate seat count
- Billing reflects current usage

#### Related Workflows
- Team Member Management

---

### Organization Course Management

**Goal**: Create and manage custom courses for the organization
**Frequency**: Monthly / As needed
**Features Involved**: `org-courses`, `organization-membership`, `ai-context-engine`

#### Steps
1. Navigate to My Organization hub, then click "Organization Courses" card (or navigate directly to `/org-courses`)
2. Click "Create Course" to start a new course
3. Use the course builder to add modules and lessons
4. Upload videos and add content (descriptions, transcripts)
5. Assign an author from org members (optional)
6. Preview the course content
7. Click "Publish" to make available to org members
8. Embeddings are automatically generated for AI integration

#### Variations
- Unpublish course to hide from employees (keeps as draft)
- Delete course (removes all data including embeddings)
- Edit published course (updates visible immediately)

#### Success Criteria
- Published courses appear for all org members
- AI assistant can answer questions about course content
- Employees can track progress on org courses

#### Related Workflows
- Content Assignment (assign org courses to employees/groups)
- Progress Monitoring (track completion)

---

### Assign Organization Courses

**Goal**: Assign org-specific courses to employees or groups
**Frequency**: Weekly / As needed
**Features Involved**: `org-courses`, `organization-membership`, `content-assignments`

#### Steps
1. Navigate to My Organization hub, then click "Organization Courses" card (or navigate directly to `/org-courses`)
2. Select a published course
3. Use assignment controls to assign to:
   - Individual employees
   - Employee groups
   - All org members
4. Set assignment type (required vs recommended)
5. Optionally set due date
6. Assigned courses appear in employee dashboards

#### Variations
- Bulk assignment to multiple employees
- Remove assignment
- Change due date

#### Success Criteria
- Assigned content appears in employee learning dashboards
- Progress tracking active once employees start

#### Related Workflows
- Progress Monitoring
- Organization Course Management

---

## Workflows To Document

The following workflows have been identified but not yet documented:
- [ ] ROI Reporting
- [ ] Group Management
- [ ] Organization Onboarding
- [ ] Custom Collections for Team

---

## Notes for Agents

When working on features that affect Org Admin:
1. Check if workflow is documented above
2. If not, document it before making changes
3. Consider impact on employee experience (downstream)
4. Verify billing integration remains intact
5. Update this doc if workflow changes
