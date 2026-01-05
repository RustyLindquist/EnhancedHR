# Employee Workflows

> **Status**: Stub — to be populated as workflows are discovered and documented
> **Last Updated**: 2026-01-04

## Role Overview

Employees are organization members who consume learning content assigned by their Org Admin. They access the platform through their organization's subscription.

**Primary Goals**:
- Complete assigned learning
- Earn certifications and credits
- Get help from AI when stuck
- Track personal progress
- Organize learning materials

**Access Level**: Organization-scoped access, sees org-assigned content

## Primary Workflows

### Daily Learning Dashboard

**Goal**: See what to learn today and continue in-progress courses
**Frequency**: Daily
**Features Involved**: `dashboard`, `course-player-and-progress`, `collections-and-context`

#### Steps
1. Login to platform
2. Land on Employee Dashboard
3. See assigned content and progress
4. Click "Continue" on in-progress course
5. Resume learning from last position
6. Progress auto-saves

#### Variations
- Starting new assigned content
- Switching between courses
- Mobile vs desktop experience

#### Success Criteria
- Clear understanding of learning priorities
- Seamless continuation of progress

#### Related Workflows
- Course Completion
- AI Learning Assistance

---

### Course Completion

**Goal**: Complete a course and earn certification/credits
**Frequency**: Weekly / As courses are assigned
**Features Involved**: `course-player-and-progress`, `certifications-and-credits`, `dashboard`

#### Steps
1. Navigate to course (from dashboard or assignment)
2. Progress through lessons
3. Complete quizzes/assessments
4. Watch required video content
5. Meet completion requirements
6. Receive certificate/credits
7. Progress reflected in dashboard

#### Variations
- Retaking failed assessments
- Partial completion (in progress)
- Certificate download/sharing

#### Success Criteria
- Course marked as complete
- Credits/certification awarded
- Progress visible to Org Admin

#### Related Workflows
- Daily Learning Dashboard
- Certification Tracking

---

### AI Learning Assistance

**Goal**: Get help understanding course content
**Frequency**: As needed during learning
**Features Involved**: `course-ai`, `prometheus-chat`, `ai-context-engine`

#### Steps
1. While in course, open AI panel
2. Ask question about current content
3. AI responds with context-aware help
4. Continue learning with new understanding
5. Optionally save conversation to collection

#### Variations
- Tutor mode (guided learning)
- Assistant mode (direct answers)
- Asking about related topics

#### Success Criteria
- Question answered helpfully
- Learning unblocked
- Context maintained across questions

#### Related Workflows
- Course Completion
- Personal Context Building

---

### Personal Context Building

**Goal**: Build personal context for better AI assistance
**Frequency**: Ongoing
**Features Involved**: `personal-context-insights`, `collections-and-context`, `ai-context-engine`

#### Steps
1. Navigate to Personal Context
2. Add role, experience, learning goals
3. Save insights from conversations
4. AI uses this context in future interactions
5. Context improves personalization over time

#### Variations
- Adding from conversations
- Manual context editing
- Privacy settings

#### Success Criteria
- AI responses more relevant to role
- Personalized learning recommendations

#### Related Workflows
- AI Learning Assistance
- Prometheus Chat

---

### Certification Tracking

**Goal**: View earned certifications and credits progress
**Frequency**: Weekly / Monthly
**Features Involved**: `certifications-and-credits`, `dashboard`

#### Steps
1. Navigate to Certifications section
2. View earned certificates
3. See credits toward goals (SHRM/HRCI)
4. Download certificates as needed
5. Track progress toward certification goals

#### Variations
- Sharing certificates
- Credit transfer tracking
- Recertification requirements

#### Success Criteria
- Clear visibility of earned credentials
- Progress toward certification goals visible

#### Related Workflows
- Course Completion

---

## Workflows To Document

The following workflows have been identified but not yet documented:
- [ ] Note-Taking During Courses
- [ ] Saving to Collections
- [ ] Using Prometheus (General AI Chat)
- [ ] Help and Support

---

## Notes for Agents

When working on features that affect Employees:
1. This is the most common user type — changes have wide impact
2. Check workflow dependencies (dashboard is central)
3. Verify progress tracking remains accurate
4. Ensure AI context flows correctly
5. Update this doc if workflow changes
