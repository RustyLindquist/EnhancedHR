# Component Index

This is the master inventory of all documented UI components. The Frontend Agent maintains this index as components are discovered and documented.

> **Status**: Bootstrapped on 2026-01-04. Contains discovered components from codebase.

---

## How to Use This Index

1. **Before creating any component**, search this index first
2. If you find a match, read its individual doc in `docs/frontend/components/`
3. If no match, run `/frontend/style-discovery` to search the codebase
4. If still nothing, create new with `/frontend/new-style-creation`

---

## Component Categories

### Layout Components

| Component | Location | Description | Docs |
|-----------|----------|-------------|------|
| CanvasHeader | `/src/components/CanvasHeader.tsx` | Standard header for canvas views with context label, title, and action slots | [CanvasHeader](./components/CanvasHeader.md) |
| MainCanvas | `/src/components/MainCanvas.tsx` | Primary content container (very large file) | [Pending] |
| NavigationPanel | `/src/components/NavigationPanel.tsx` | Collapsible left sidebar with navigation, collections, and user profile | [NavigationPanel](./components/NavigationPanel.md) |
| BackgroundSystem | `/src/components/BackgroundSystem.tsx` | Animated gradient background system with multiple themes | [BackgroundSystem](./components/BackgroundSystem.md) |
| AdminPageLayout | `/src/components/AdminPageLayout.tsx` | Layout wrapper for admin pages | [Pending] |
| StandardPageLayout | `/src/components/StandardPageLayout.tsx` | Standard page layout wrapper | [Pending] |
| AIPanel | `/src/components/AIPanel.tsx` | Side panel for AI interactions | [Pending] |

### Card Components

| Component | Location | Description | Docs |
|-----------|----------|-------------|------|
| UniversalCard | `/src/components/cards/UniversalCard.tsx` | Polymorphic card component supporting 12+ types (COURSE, MODULE, LESSON, RESOURCE, CONVERSATION, CONTEXT, AI_INSIGHT, PROFILE, HELP, NOTE, TOOL, TOOL_CONVERSATION) | [UniversalCard](./components/UniversalCard.md) |
| ResourceCard | `/src/components/cards/ResourceCard.tsx` | Specialized card for downloadable resources | [Pending] |
| InteractiveCardWrapper | `/src/components/cards/InteractiveCardWrapper.tsx` | Wrapper that adds glow effects and drag interaction to cards | [Pending] |
| ConversationCard | `/src/components/ConversationCard.tsx` | Chat conversation preview (legacy, may be replaced by UniversalCard) | [Pending] |
| InstructorCard | `/src/components/InstructorCard.tsx` | Instructor/expert profile card | [Pending] |
| UniversalCollectionCard | `/src/components/UniversalCollectionCard.tsx` | Collection display card | [Pending] |
| CardStack | `/src/components/CardStack.tsx` | Stacked card layout component | [Pending] |

### Form Components

| Component | Location | Description | Docs |
|-----------|----------|-------------|------|
| MarkdownEditor | `/src/components/MarkdownEditor.tsx` | Markdown editing interface | [Pending] |
| MarkdownEditorCore | `/src/components/MarkdownEditorCore.tsx` | Core markdown editor functionality | [Pending] |
| CredentialsEditor | `/src/components/CredentialsEditor.tsx` | Credential management form | [Pending] |
| AvatarUpload | `/src/components/onboarding/AvatarUpload.tsx` | Avatar image upload component | [Pending] |

**Note**: Standard form primitives (Button, Input, Select, etc.) are not abstracted into standalone components yet. Forms use Tailwind classes directly on native elements.

### Navigation Components

| Component | Location | Description | Docs |
|-----------|----------|-------------|------|
| TopContextPanel | `/src/components/TopContextPanel.tsx` | Context-aware top panel | [Pending] |
| GlobalTopPanel | `/src/components/GlobalTopPanel.tsx` | Global navigation panel | [Pending] |
| DropdownPanel | `/src/components/DropdownPanel.tsx` | Dropdown menu component | [Pending] |

**Note**: Tab bars and breadcrumbs are implemented inline, not as standalone components.

### Feedback Components

| Component | Location | Description | Docs |
|-----------|----------|-------------|------|
| AlertBox | `/src/components/AlertBox.tsx` | Alert/notification component | [Pending] |
| DeleteConfirmationModal | `/src/components/DeleteConfirmationModal.tsx` | Confirmation dialog for deletions | [Pending] |
| AddCollectionModal | `/src/components/AddCollectionModal.tsx` | Modal for adding items to collections | [Pending] |
| RatingModal | `/src/components/RatingModal.tsx` | Rating submission modal | [Pending] |

**Note**: General-purpose Toast and Spinner components don't exist yet. Loading states are implemented inline.

### Data Display Components

| Component | Location | Description | Docs |
|-----------|----------|-------------|------|
| MarkdownRenderer | `/src/components/MarkdownRenderer.tsx` | Renders markdown content | [Pending] |
| SmartTranscript | `/src/components/SmartTranscript.tsx` | Interactive transcript display | [Pending] |
| ROIChart | `/src/components/ROIChart.tsx` | ROI visualization chart | [Pending] |
| PrometheusDashboardWidget | `/src/components/PrometheusDashboardWidget.tsx` | Analytics dashboard widget | [Pending] |
| AnimatedCountBadge | Inline in NavigationPanel | Animated count badge with glow effect | [Pending] |

**Note**: Avatar and generic Badge components are not standalone. Avatars are rendered inline with profile data. Category badges use inline Tailwind classes.

---

## Layout Patterns

See `docs/frontend/patterns/` for documented layout patterns:

| Pattern | Description | Docs |
|---------|-------------|------|
| Collection View | Grid of cards with header | [Pending] |
| Detail Page | Left content, right panel | [Pending] |
| Settings Page | Left nav, right content | [Pending] |
| Auth Pages | Centered card layout | [Pending] |

---

## Domain-Specific Components

### Course/Learning Components
- **CoursePlayer** (`/src/components/CoursePlayer.tsx`) - Video course player
- **QuizPlayer** (`/src/components/QuizPlayer.tsx`) - Quiz/assessment interface
- **CourseLessonCard** (`/src/components/course/CourseLessonCard.tsx`) - Lesson card in course view
- **ModuleContainer** (`/src/components/course/ModuleContainer.tsx`) - Expandable module container

### Admin/Management Components
- **ExpertManagementDashboard** (`/src/components/admin/ExpertManagementDashboard.tsx`) - Expert management interface
- **ProposalsDashboard** (`/src/components/admin/ProposalsDashboard.tsx`) - Course proposal management
- **SystemPromptManager** (`/src/components/admin/SystemPromptManager.tsx`) - AI prompt management

### Organization Components
- **GroupManagement** (`/src/components/org/GroupManagement.tsx`) - Employee group management
- **ContentAssignmentList** (`/src/components/org/ContentAssignmentList.tsx`) - Content assignment interface

---

## Recently Added

| Date | Component | Added By |
|------|-----------|----------|
| 2026-01-04 | Initial bootstrap - 40+ components cataloged | Frontend Agent |

---

## Maintenance

This index is maintained by the Frontend Agent. When adding new components:

1. Add to the appropriate category table above
2. Create individual doc in `docs/frontend/components/[component-name].md`
3. Link the doc in the Docs column
4. Add to "Recently Added" section

When discovering undocumented components:

1. Add "[Pending]" in the Docs column
2. Create the component doc
3. Update the link
