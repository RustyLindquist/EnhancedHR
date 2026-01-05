# NavigationPanel

The primary navigation sidebar for EnhancedHR.ai. Provides access to main features, collections, organization management, and user settings.

## Location

`/src/components/NavigationPanel.tsx`

## Purpose

Serves as the persistent left sidebar navigation, offering:
- Main navigation items
- Collection browsing
- Organization management (for admins)
- User profile and settings
- Background theme selection
- Role switching (for admins)

## Design Tokens Used

### Layout
- **Width (collapsed)**: `w-20`
- **Width (expanded)**: `w-72`
- **Background**: `bg-white/[0.02] backdrop-blur-xl` OR custom gradient for admin views
- **Border**: `border-r border-white/10`
- **Shadow**: `shadow-[5px_0_30px_0_rgba(0,0,0,0.3)]`
- **Logo area**: `h-24` (matches CanvasHeader)

### Navigation Item Styling
- **Default**: Transparent with `border border-transparent`
- **Hover**: `hover:bg-white/5 border-white/5`
- **Active**: `bg-white/10 border-white/10` with brand blue glow
- **Icon active**: `text-brand-blue-light` with `drop-shadow-[0_0_8px_rgba(120,192,240,0.5)]`
- **Padding**: `px-3 py-2.5`
- **Border radius**: `rounded-xl`

### Section Headers
- **Text**: `text-[10px] font-bold text-slate-500 uppercase tracking-widest`
- **Padding**: `pl-2`

### Profile Section
- **Height**: `h-28`
- **Background**: `bg-gradient-to-t from-white/5 to-transparent backdrop-blur-sm`
- **Border**: `border-t border-white/5`

## Props

```typescript
interface NavigationPanelProps {
  isOpen: boolean;                          // Expanded/collapsed state
  setIsOpen: (isOpen: boolean) => void;     // Toggle handler
  currentTheme: BackgroundTheme;            // Active background theme
  onThemeChange: (theme: BackgroundTheme) => void; // Theme change handler
  courses: Course[];                        // Course data for counts
  activeCollectionId: string;               // Currently selected collection
  onSelectCollection: (id: string) => void; // Collection selection handler
  customNavItems?: NavItemConfig[];         // Override nav items (for admin)
  className?: string;                       // Custom background style
  collectionCounts?: Record<string, number>; // Manual count overrides
  customCollections?: Collection[];         // User-created collections
}
```

## Visual Structure

```
┌────────────────────────┐
│   Logo Area (h-24)     │ ← Toggles between full logo and mark
│   [Collapse Button]    │
├────────────────────────┤
│                        │
│  Main Navigation       │ ← Home, Dashboard, etc.
│  • Item 1              │
│  • Item 2              │
│                        │
│  MY COLLECTIONS        │ ← Section header
│  • Collection 1  [3]   │ ← Count badges
│  • Collection 2  [7]   │
│  • Custom 1            │
│  • [+ New]             │
│                        │
│  MY ORGANIZATION       │ ← For org admins only
│  • Groups              │
│  • Content             │
│                        │
│  EMPLOYEE GROUPS       │ ← For org admins only
│  • Sales Team    [12]  │
│  • Engineering   [8]   │
│                        │
│  (scrollable)          │
│                        │
├────────────────────────┤
│  Profile Section       │ ← Avatar, name, menu
│  [Avatar] Name         │
└────────────────────────┘
```

## Key Features

### 1. Collapsible Navigation
- Collapsed: Shows only icons (`w-20`)
- Expanded: Shows icons + labels (`w-72`)
- Toggle button positioned at `-right-3` with hover effects

### 2. Hover Labels (Collapsed Mode)
When collapsed, hovering a nav item shows a floating label:
```tsx
<div className="fixed left-20 z-[150] bg-[#0f141c] border border-white/10 rounded-r-xl">
  {hoveredItem.label}
</div>
```

### 3. Animated Count Badges
Collection items show count badges that:
- Glow warmly when count changes
- Use `animate-count-glow` animation
- Active state: `bg-brand-blue-light text-brand-black`
- Inactive state: `bg-white/5 text-slate-500`

### 4. Profile Menu
Clicking the profile section opens a popup with:
- **Main menu**: Account, Settings, Backgrounds, Admin/Expert links, Logout
- **Backgrounds submenu**: Theme selection
- **Roles submenu**: Admin role switching for demo accounts

Menu styling:
```css
bg-[#0f141c]/95 backdrop-blur-2xl
border border-white/10
rounded-xl shadow-2xl
```

### 5. Role Switching (Admin Only)
Platform admins can impersonate demo accounts:
- Demo accounts: Org Admin, Expert, Pending Expert, Employee, Individual User
- "Exit View" returns to admin account
- Impersonation status shown with red glow on avatar

## Navigation Item Types

### Standard Nav Items
Defined in `MAIN_NAV_ITEMS`:
- Home / Dashboard
- Browse courses
- Personal context
- Conversations

### Collection Nav Items
Defined in `COLLECTION_NAV_ITEMS`:
- Learning path
- Favorites
- In progress
- Completed
- Company (for org employees)
- Custom collections (user-created)
- [+ New Collection] action

### Organization Nav Items
Defined in `ORG_NAV_ITEMS` (org admins only):
- Organization overview
- Content management
- Analytics

### Employee Groups
Dynamic list from database (org admins only):
- Shows group name + member count
- Fetched via `getOrgGroups()` server action

## Component Patterns

### NavItem Component
Internal component rendering individual navigation items:
```tsx
<NavItem
  item={navConfig}
  isOpen={panelOpen}
  count={itemCount}
  isActive={isSelected}
  onClick={handleClick}
/>
```

Renders:
- Icon with active state coloring
- Label (when expanded)
- Count badge (when provided and > 0)

### AnimatedCountBadge Component
Internal component for count badges:
- Detects count changes
- Triggers glow animation
- Uses warm amber glow: `rgba(251, 191, 36, 0.8)`

## Usage Examples

### Basic Navigation Panel
```tsx
<NavigationPanel
  isOpen={navOpen}
  setIsOpen={setNavOpen}
  currentTheme={theme}
  onThemeChange={setTheme}
  courses={courses}
  activeCollectionId={collectionId}
  onSelectCollection={handleSelectCollection}
/>
```

### Admin Navigation
```tsx
<NavigationPanel
  isOpen={navOpen}
  setIsOpen={setNavOpen}
  currentTheme={theme}
  onThemeChange={setTheme}
  courses={courses}
  activeCollectionId="admin"
  onSelectCollection={handleSelectCollection}
  customNavItems={ADMIN_NAV_ITEMS}
  className="bg-gradient-to-b from-[#054C74] to-[#022031] backdrop-blur-xl border-r border-white/10"
/>
```

## Implementation Details

### Logo Behavior
- **Expanded**: Shows `/images/logos/EnhancedHR-logo-no-mark.png` (full logo, h-16)
- **Collapsed**: Shows `/images/logos/EnhancedHR-logo-mark-flame.png` (flame icon, h-8)
- Logo is clickable and navigates to home (`/`)

### Collapse Button
```tsx
<button className="absolute -right-3 top-9 bg-white/10 border border-white/10 rounded-full p-1
  hover:bg-[#5694C7] hover:border-white/20 hover:text-white
  hover:shadow-[0_0_10px_rgba(86,148,199,0.5)]">
  {isOpen ? <ChevronLeft /> : <ChevronRight />}
</button>
```

### Scrollable Content Area
Main navigation section uses:
```css
overflow-y-auto no-scrollbar flex-1 py-8
```

### Profile Section Glow
Profile area has hover effect with portal-like glow:
```tsx
{/* Portal Glow Background */}
<div className="absolute inset-0 bg-brand-blue-light/10 opacity-0
  group-hover:opacity-100 transition-opacity blur-xl" />
<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2
  bg-brand-blue-light/30 rounded-full blur-[25px] opacity-0
  group-hover:opacity-60" />
```

## Related Components

- **CanvasHeader** - Shares `h-24` height for logo area
- **BackgroundSystem** - Theme selection in profile menu
- **AdminPageLayout** - Uses NavigationPanel with admin customization
- **MainCanvas** - Primary container that includes NavigationPanel

## Design Principles

1. **Persistence**: Always visible, never hidden on mobile (responsive behavior TBD)
2. **Hierarchy**: Clear visual grouping with section headers
3. **Feedback**: Active states, hover states, and count badges provide instant feedback
4. **Flexibility**: Supports custom nav items and collections
5. **Context-aware**: Shows different options based on user role

## State Management

### Session Storage
- Stores admin backup session for role switching
- Key: `admin_backup_session`

### Profile Data
Fetched on mount:
- Full name
- Email
- Role (admin, org_admin, author, user)
- Membership status
- Author status
- Avatar URL

### Employee Groups (Org Admins)
- Fetched via server action `getOrgGroups()`
- Cached in component state
- Shows member count for each group

## Anti-Patterns

- Don't change the width values (w-20/w-72 are standard)
- Don't add more than 2 levels of navigation hierarchy
- Don't hide the profile section
- Don't override active states with custom colors
- Don't add too many items to main navigation (keep it under 6)
