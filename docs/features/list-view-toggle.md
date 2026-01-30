---
id: list-view-toggle
owner: product-engineering
status: active
stability: stable
last_updated: 2026-01-30
surfaces:
  routes:
    - /dashboard
    - /dashboard?collection=academy
    - /dashboard?collection=favorites
    - /dashboard?collection=notes
    - /dashboard?collection=instructors
    - /experts
    - /experts/[id]
    - /author/courses
    - /author/resources
    - /org/users-and-groups
    - /org/team-management
    - /course/[id]
  collections:
    - All workspace collections
    - Academy (course catalog)
    - Notes
    - Instructors/Experts
    - Custom user collections
    - Organization users and groups
data:
  storage:
    - localStorage key: enhancedhr-preferred-view-mode
backend:
  actions: []
ai:
  context_scopes: []
tests:
  local:
    - Toggle view mode on any supported page; verify mode persists across page reloads
    - Navigate between pages; verify all pages respect the stored preference
    - Verify list items display correct type-specific information
  staging:
    - Test on various screen sizes; verify responsive breakpoints hide/show metadata appropriately
invariants:
  - User view mode preference stored globally in localStorage under enhancedhr-preferred-view-mode
  - View mode state is always grid or list
  - All list items must have 3px left border with type-specific glow color
  - List items must show hover glow effect using boxShadow
  - Toggle buttons use consistent styling bg-black/40, border-white/10, rounded-lg
---

## Overview

The Universal List View Toggle is a platform-wide feature that allows users to switch between card (grid) view and row (list) view across all content display areas. The user preference is persisted globally via localStorage, ensuring a consistent experience across sessions and pages.

## User Surfaces

The view toggle appears in the header/toolbar area of supported pages, positioned on the far right. It consists of two icon buttons:
- LayoutGrid icon: Switches to card/grid view
- List icon: Switches to list/row view

### Supported Pages

| Page | Component | Route | Notes |
|------|-----------|-------|-------|
| Platform Dashboard | UserDashboardV3.tsx | /dashboard | Courses, conversations, in-progress items |
| Academy (Course Catalog) | MainCanvas.tsx | /dashboard?collection=academy | Courses grouped by category |
| Workspace Collections | MainCanvas.tsx | /dashboard?collection=* | Favorites, Notes, custom collections |
| Experts Directory | ExpertDirectoryContent.tsx | /experts | Expert profile cards/rows |
| Expert Details | ExpertCoursesContent.tsx | /experts/[id] | Expert courses |
| Author Courses | AuthorCoursesContent.tsx | /author/courses | Expert Console my courses |
| Author Resources | ExpertResourcesCanvas.tsx | /author/resources | Expert resources section |
| Users and Groups | UsersAndGroupsCanvas.tsx | /org/users-and-groups | Groups and All Users entry |
| Team Management | TeamManagement.tsx | /org/team-management | Individual user list |
| Group Detail | GroupDetailCanvas.tsx | /org/group/[id] | Group member list |
| Course Page | CoursePageV2.tsx | /course/[id] | Module lessons (via ModuleContainer) |
| Assigned Learning | AssignedLearningCanvas.tsx | /org/assigned-learning | Assigned courses |

## Core Concepts

### View Mode State Pattern

Every component implementing the toggle follows this pattern:

1. State declaration: useState with grid or list type, defaulting to grid
2. Load preference on mount via useEffect reading from localStorage
3. Handler that persists to localStorage and updates state

### Toggle UI Pattern

Consistent toggle styling across all pages using:
- Container: `flex items-center gap-0.5 p-1 bg-black/40 border border-white/10 rounded-lg`
- Active button: `bg-white/20 text-white`
- Inactive button: `text-slate-400 hover:text-white hover:bg-white/5`
- Icons: `LayoutGrid` and `List` from lucide-react at size 14

## Components

### New Components Created

| Component | Path | Purpose |
|-----------|------|---------|
| UniversalCollectionListItem | /src/components/UniversalCollectionListItem.tsx | Polymorphic list item for all collection item types |
| cardTypeConfigs | /src/components/cards/cardTypeConfigs.ts | Shared type configuration including glow colors, icons, display labels |
| UserListItem | /src/components/org/UserListItem.tsx | List item for organization members |
| GroupListItem | /src/components/org/GroupListItem.tsx | List item for employee groups (static and dynamic) |
| AllUsersListItem | /src/components/org/AllUsersListItem.tsx | Special All Users entry in group list |

### Modified Components

| Component | Path | Changes |
|-----------|------|---------|
| MainCanvas | /src/components/MainCanvas.tsx | Added view toggle, list rendering for collections and Academy |
| UserDashboardV3 | /src/components/Dashboard/UserDashboardV3.tsx | Added view toggle for dashboard sections |
| UsersAndGroupsCanvas | /src/components/org/UsersAndGroupsCanvas.tsx | Added view toggle with GroupListItem and AllUsersListItem |
| TeamManagement | /src/components/org/TeamManagement.tsx | Added view toggle with UserListItem |
| GroupDetailCanvas | /src/components/org/GroupDetailCanvas.tsx | Added view toggle for group members |
| ExpertDirectoryContent | /src/app/(marketing)/experts/ExpertDirectoryContent.tsx | Added view toggle for experts |
| ExpertCoursesContent | /src/app/(marketing)/experts/[id]/ExpertCoursesContent.tsx | Added view toggle for expert courses |
| AuthorCoursesContent | /src/app/author/courses/AuthorCoursesContent.tsx | Added view toggle for author courses |
| ExpertResourcesCanvas | /src/app/author/resources/ExpertResourcesCanvas.tsx | Added view toggle for resources |
| CoursePageV2 | /src/components/course/CoursePageV2.tsx | List view for course modules |
| ModuleContainer | /src/components/course/ModuleContainer.tsx | List view for lessons within modules |

## List Item Design Pattern

All list items follow a consistent visual design:

### Structure

```
Left Border 3px | Icon/Thumbnail | Separator | Content | Right Section | Actions Panel
```

### Visual Elements

1. **Left Border (3px)**: Color matches item type via `getTypeGlowColor(itemType)`
2. **Icon Container**: Rounded container with type-appropriate icon and glow
3. **Vertical Separator**: `w-px h-8 bg-white/10`
4. **Content Area**: Title, subtitle, metadata (responsive visibility)
5. **Type Badge**: Fixed-width badge on right side
6. **Chevron**: Right arrow indicating clickability
7. **Sliding Action Panel**: Appears on hover with contextual actions

### Hover Effects

On mouse enter, apply boxShadow with glow color at various opacities (30, 15, 08).
On mouse leave, remove boxShadow.

```typescript
onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow =
        `0 0 20px ${glowColor}30, 0 0 40px ${glowColor}15, inset 0 0 20px ${glowColor}08`;
}}
onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = 'none';
}}
```

## Type Configuration System

The `cardTypeConfigs.ts` file provides shared configuration for all item types:

### Supported Types
- COURSE, MODULE, LESSON, ACTIVITY
- RESOURCE, CONVERSATION, TOOL_CONVERSATION
- CONTEXT, AI_INSIGHT, CUSTOM_CONTEXT, FILE
- PROFILE, NOTE, VIDEO, HELP, TOOL
- ORG_COLLECTION, ORG_COURSE

### Helper Functions
- `getTypeDisplayLabel(itemType)`: Returns human-readable label
- `getTypeIcon(itemType)`: Returns Lucide icon component
- `getTypeGlowColor(itemType)`: Returns glow color for borders/effects

### Example Glow Colors
- COURSE: `rgba(120, 192, 240, 0.6)` (blue)
- NOTE: `rgba(255, 230, 140, 0.95)` (amber)
- CONVERSATION: `rgba(120, 192, 240, 0.7)` (blue)
- VIDEO: `rgba(168, 85, 247, 0.7)` (purple)
- RESOURCE: `rgba(255, 150, 150, 0.95)` (red)

## Data Model

### Storage
- localStorage key: `enhancedhr-preferred-view-mode`
- Valid values: `'grid'` or `'list'`
- Default: `'grid'` (when no stored preference)

### No Database Persistence
The view mode preference is client-side only. This is intentional:
- Faster UI response (no server round-trip)
- Works offline/without authentication
- Reduces API complexity

## Permissions and Security

No special permissions required. View mode is a UI preference only and does not affect data access or visibility.

## Integration Points

### UniversalCard
The list view complements the existing UniversalCard component. Both use the same CollectionItemDetail type and share configuration from cardTypeConfigs.ts.

### Drag and Drop
UniversalCollectionListItem supports drag-and-drop via onDragStart prop, maintaining parity with card view functionality.

### Sorting
MainCanvas provides sorting controls (Title A-Z, Z-A, Newest, Oldest) that work in both grid and list views for supported collections.

## Invariants

1. **Global Persistence**: View mode is always stored in `enhancedhr-preferred-view-mode` localStorage key
2. **Type Safety**: View mode is always `'grid'` or `'list'`, never undefined or other values
3. **Consistent Styling**: All toggle buttons use identical styling classes
4. **Left Border**: All list items have exactly 3px left border with type-specific color
5. **Hover Glow**: All list items implement the standard hover glow effect
6. **Responsive Metadata**: Metadata elements use responsive visibility classes (`hidden sm:block`, `hidden md:flex`, etc.)

## Failure Modes and Recovery

### localStorage Not Available
If localStorage is unavailable (private browsing, storage quota exceeded), the feature gracefully falls back to grid view and continues working without persistence.

### Invalid Stored Value
If stored value is neither `'grid'` nor `'list'`, the component defaults to `'grid'`:
```typescript
if (savedMode === 'grid' || savedMode === 'list') {
    setViewMode(savedMode);
}
// Otherwise stays at default 'grid'
```

## Testing Checklist

### Functional Tests
- [ ] Toggle persists across page reloads
- [ ] Toggle persists across different pages
- [ ] List items display correct type-specific information
- [ ] Hover effects work on all list items
- [ ] Drag and drop works in list view
- [ ] Sorting works in list view
- [ ] Action buttons (add, remove, download) work in list view

### Visual Tests
- [ ] Left border colors match item types
- [ ] Hover glow colors match item types
- [ ] Type badges display correctly
- [ ] Responsive breakpoints hide/show metadata appropriately
- [ ] Sliding action panel appears/disappears smoothly

### Cross-Page Tests
- [ ] Dashboard: Courses, conversations, in-progress sections
- [ ] Academy: Category view and filtered view
- [ ] Collections: Notes, Favorites, custom collections
- [ ] Experts: Directory and individual expert pages
- [ ] Organization: Users and groups, team management
- [ ] Course Player: Module lessons

## Change Guide

### Adding List View to a New Page

1. **Add state and handler**:
```typescript
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

useEffect(() => {
    const savedMode = localStorage.getItem('enhancedhr-preferred-view-mode');
    if (savedMode === 'grid' || savedMode === 'list') {
        setViewMode(savedMode);
    }
}, []);

const handleViewModeChange = (mode: 'grid' | 'list') => {
    localStorage.setItem('enhancedhr-preferred-view-mode', mode);
    setViewMode(mode);
};
```

2. **Add toggle UI** (copy from existing implementation)

3. **Implement conditional rendering**:
```tsx
{viewMode === 'grid' ? (
    // Grid/card rendering
) : (
    // List rendering using UniversalCollectionListItem or domain-specific list item
)}
```

### Creating a New List Item Component

1. Follow the structure in `UserListItem.tsx` or `GroupListItem.tsx`
2. Import and use `getTypeGlowColor` from `cardTypeConfigs.ts` or define domain-specific colors
3. Implement the standard hover effects
4. Include the sliding action panel if actions are needed

## Related Docs

- [UniversalCard](../frontend/components/UniversalCard.md) - Card view counterpart
- [Dashboard](./dashboard.md) - Dashboard feature
- [Academy](./academy.md) - Course catalog feature

## Pull Requests

| PR | Description |
|----|-------------|
| #221 | Initial list view implementation for collections |
| #225 | Users and Groups list view |
| #226 | Platform Dashboard list view |
| #227 | CoursePlayer modules list view |
| #228 | CoursePageV2 (Academy courses) list view |
| #229 | Extend divider line to toggle |
