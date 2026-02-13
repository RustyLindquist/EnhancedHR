# Individual User Workflows

> **Status**: Stub — to be populated as workflows are discovered and documented
> **Last Updated**: 2026-02-12

## Role Overview

Individual Users are self-directed learners with personal subscriptions. They have full autonomy over their learning journey without organizational oversight.

**Primary Goals**:
- Discover and consume relevant content
- Build expertise in chosen areas
- Earn certifications and credits
- Use AI for personalized learning
- Organize learning with collections

**Access Level**: Personal subscription, full platform access (non-admin)

## Primary Workflows

### Marketing Evaluation and Trial Start

**Goal**: Evaluate platform value and begin personal trial
**Frequency**: One-time / Occasional revisit
**Features Involved**: `marketing-pages`, `academy`, `collections-and-context`

#### Steps
1. Visit a marketing page (homepage or campaign pages under `/lp/*`)
2. Review feature/value narrative and role-relevant use cases
3. Click either:
   - `Start Free Trial` (`/login?view=signup`)
   - `Schedule a Demo` (`/demo`) if guided onboarding is preferred
4. Complete signup or demo request
5. Continue into dashboard and course discovery

#### Variations
- Returning users see `Go to Dashboard` instead of `Start Free Trial`
- Campaign-specific routes (`/lp/1`, `/lp/2`, `/lp/3`)

#### Success Criteria
- User understands platform differentiation quickly
- Conversion path to trial or demo is clear
- Post-signup path to first learning action is obvious

#### Related Workflows
- Content Discovery
- Self-Directed Learning

### Content Discovery

**Goal**: Find courses relevant to learning goals
**Frequency**: Weekly
**Features Involved**: `academy`, `dashboard`, `collections-and-context`

#### Steps
1. Navigate to Academy
2. Browse or search for topics
3. Filter by category, duration, level
4. Read course details
5. Add to Watchlist or start immediately
6. Course appears in dashboard

#### Variations
- AI-recommended content
- Expert-based discovery
- Category browsing

#### Success Criteria
- Found relevant content
- Clear path to start learning

#### Related Workflows
- Self-Directed Learning
- Collection Organization

---

### Self-Directed Learning

**Goal**: Make progress on chosen courses
**Frequency**: Daily / Weekly
**Features Involved**: `course-player-and-progress`, `dashboard`, `course-ai`

#### Steps
1. Login and view dashboard
2. See personal progress and recommendations
3. Continue course or start new one
4. Learn at own pace
5. Use AI when stuck
6. Track progress toward personal goals

#### Variations
- Multi-course juggling
- Deep-dive vs breadth learning
- Mobile learning

#### Success Criteria
- Consistent learning progress
- Goals advancing

#### Related Workflows
- AI-Powered Learning
- Certification Progress

---

### AI-Powered Learning

**Goal**: Use Prometheus and course AI for enhanced learning
**Frequency**: As needed
**Features Involved**: `prometheus-chat`, `course-ai`, `ai-context-engine`, `personal-context-insights`

#### Steps
1. Open Prometheus or course AI panel
2. Ask questions, explore topics
3. Get personalized responses based on context
4. Save valuable conversations
5. Build personal context over time
6. AI improves as context grows

#### Variations
- General exploration (Prometheus)
- Course-specific help (Course AI)
- Tool-based workflows

#### Success Criteria
- Questions answered helpfully
- Learning accelerated
- Context building over time

#### Related Workflows
- Personal Context Management
- Self-Directed Learning

---

### Collection Organization

**Goal**: Organize learning materials into meaningful collections
**Frequency**: Weekly
**Features Involved**: `collections-and-context`, `dashboard`

#### Steps
1. Navigate to Collections or use quick-add
2. Create new collection or add to existing
3. Drag items between collections
4. Use system collections (Favorites, Workspace, Watchlist)
5. Collections appear in navigation
6. Easy access to organized content

#### Variations
- Quick-add while browsing
- Reorganizing collections
- Sharing collections (if available)

#### Success Criteria
- Content organized meaningfully
- Easy to find saved items

#### Related Workflows
- Content Discovery
- Self-Directed Learning

---

### Personal Context Management

**Goal**: Build and manage personal context for better AI
**Frequency**: Ongoing
**Features Involved**: `personal-context-insights`, `ai-context-engine`, `prometheus-chat`

#### Steps
1. Navigate to Personal Context
2. Add professional background
3. Define learning goals
4. Save insights from conversations
5. Review and refine context
6. Experience improved AI personalization

#### Variations
- Auto-captured insights
- Manual context additions
- Privacy controls

#### Success Criteria
- AI responses increasingly relevant
- Personal learning path emerges

#### Related Workflows
- AI-Powered Learning

---

### Subscription Management

**Goal**: Manage personal subscription and billing
**Frequency**: Monthly / As needed
**Features Involved**: `membership-billing`, `auth-accounts`

#### Steps
1. Navigate to Settings → Billing
2. View current subscription
3. Upgrade/downgrade as needed
4. Update payment method
5. View billing history

#### Variations
- Annual vs monthly
- Cancellation
- Reactivation

#### Success Criteria
- Subscription reflects needs
- Uninterrupted access

#### Related Workflows
- (Independent)

---

## Workflows To Document

The following workflows have been identified but not yet documented:
- [ ] Tools Usage
- [ ] Note-Taking
- [ ] Certificate Download/Sharing
- [ ] Expert Discovery
- [ ] Onboarding / First-Time Experience

---

## Notes for Agents

When working on features that affect Individual Users:
1. These users have more freedom than employees
2. Discovery and organization are key differentiators
3. AI personalization is a major value prop
4. No org oversight — personal goals drive behavior
5. Update this doc if workflow changes
