---
id: browser-back-navigation
owner: platform-engineering
status: active
stability: stable
last_updated: 2026-01-29
surfaces:
  routes:
    - /* (app-wide via Providers)
  collections: []
data:
  tables: []
  storage: []
backend:
  actions: []
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Press browser back button on Dashboard after navigating collections; confirm returns to previous collection
    - Press browser back button on Course page in player mode; confirm returns to description mode
    - Press browser back button multiple times rapidly; confirm no state corruption
  staging:
    - Verify back button works across all major pages (Dashboard, Course, Expert, Settings)
invariants:
  - NavigationProvider must wrap all app content via Providers.tsx
  - Each registerBackHandler call pushes a dummy history entry; back button pops and executes
  - LIFO stack ordering means most recent handler is called first
  - Handlers are auto-removed when unregister function is called or back button consumes them
---

## Overview

Browser back button interception allows in-app navigation states to respond to the browser's back button. Instead of navigating away from the page, the back button can trigger custom actions like closing panels, returning to previous views, or navigating within a single-page context.

## Architecture

### Core Components

1. **NavigationContext** (`/src/contexts/NavigationContext.tsx`)
   - Maintains a LIFO (Last-In-First-Out) stack of back handlers
   - Intercepts browser back button via `popstate` event listener
   - Pushes dummy history entries using `window.history.pushState()` to intercept back
   - Provides `registerBackHandler`, `hasBackHandler`, and `getCurrentHandler` methods

2. **useBackHandler Hook** (`/src/hooks/useBackHandler.ts`)
   - Convenience hook for components to register back handlers
   - Registers ONE handler on mount, unregisters on unmount
   - Supports conditional enabling via `enabled` option
   - Uses refs to avoid unnecessary re-registrations

3. **Providers.tsx** (`/src/components/Providers.tsx`)
   - Wraps the app with `NavigationProvider`
   - Ensures context is available throughout the application

## Two Navigation Patterns

### Pattern 1: URL-Based Routes (Automatic)

**When**: Navigation changes the URL (e.g., `/admin/users`, `/expert/courses`)

**How it works**: `router.push()` creates browser history entries automatically. The browser's native back button behavior already works.

**Examples**:
- Admin Console navigation
- Expert Console navigation
- Settings page navigation

**No additional code needed** - these work automatically.

### Pattern 2: Same-URL Navigation (Manual Registration)

**When**: Navigation changes app state without changing URL (e.g., Dashboard collection sidebar)

**How it works**: Must manually register back handlers to intercept the back button.

**Two approaches**:

#### A. useBackHandler Hook (Single Registration)

Use when: Component needs ONE back handler that stays active while mounted.

```typescript
import { useBackHandler } from '@/hooks/useBackHandler';

function MyComponent({ onBack }: { onBack: () => void }) {
  // Registers on mount, unregisters on unmount
  useBackHandler(onBack);

  return <div>...</div>;
}
```

With conditional enabling:

```typescript
useBackHandler(
  viewMode === 'player' ? goToDescription : onBack,
  { enabled: viewMode === 'player' }
);
```

#### B. Direct registerBackHandler (Dynamic Registration)

Use when: Component needs MULTIPLE handlers registered at different times (e.g., navigation stack).

```typescript
import { useNavigationSafe } from '@/contexts/NavigationContext';

function Dashboard() {
  const navigation = useNavigationSafe();
  const navigationHistoryRef = useRef<string[]>([]);

  const handleGoBack = useCallback(() => {
    if (navigationHistoryRef.current.length > 0) {
      const previousId = navigationHistoryRef.current.pop()!;
      setActiveCollectionId(previousId);
    }
  }, []);

  const handleSelectCollection = (id: string) => {
    // Push current collection to history stack
    navigationHistoryRef.current.push(activeCollectionId);

    // Register a NEW back handler for THIS navigation step
    if (navigation) {
      navigation.registerBackHandler(handleGoBack);
    }

    setActiveCollectionId(id);
  };
}
```

## When to Use Which Pattern

| Scenario | Pattern | Why |
|----------|---------|-----|
| Page component with single `onBack` prop | useBackHandler hook | Simple, handles mount/unmount |
| Modal/Panel close handler | useBackHandler hook | One handler, conditional enable |
| Multi-level sidebar navigation | Direct registerBackHandler | Each nav step needs its own handler |
| Course player (description/player modes) | useBackHandler hook | Two states, handled by callback logic |

## Edge Cases Handled

### SSR Guard
```typescript
const isClientRef = useRef(typeof window !== 'undefined');
```
All `window` operations check this ref first.

### Rapid Back Button Presses
```typescript
const isProcessingBackRef = useRef(false);
// Set true during handler execution
// Reset after 50ms delay
```
Prevents multiple handlers from executing if user presses back rapidly.

### Direct URL Entry
When a user directly enters a URL (no history), there are no handlers registered, so the back button behaves normally.

### Handler Cleanup
Handlers are removed from the stack in two ways:
1. **Unregister function**: Called on component unmount
2. **Back button consumption**: Handler is popped and executed when back is pressed

## Integration Points

### CanvasHeader
`CanvasHeader` uses `getCurrentHandler()` to check if there's a back handler and render a back button in the header.

```typescript
const navigation = useNavigationSafe();
const hasCustomBack = navigation?.hasBackHandler();
const handleBack = navigation?.getCurrentHandler();
```

### Components Using This Feature

| Component | Pattern Used | Purpose |
|-----------|--------------|---------|
| Dashboard page | Direct registration | Multi-level collection navigation |
| CoursePageV2 | useBackHandler hook | Description/player mode toggle |
| InstructorPage | useBackHandler hook | Return to previous view |
| Settings page | useBackHandler hook | Return to dashboard |
| Org canvases | useBackHandler hook | Return to org overview |

## Debugging

Enable debug logging by setting `DEBUG = true` in:
- `/src/contexts/NavigationContext.tsx`
- `/src/hooks/useBackHandler.ts`

This logs:
- Handler registration/unregistration
- History entry pushes
- Popstate events and handler execution

## Failure Modes & Recovery

### Back button doesn't work
1. Check NavigationProvider wraps the component
2. Check handler is being registered (enable DEBUG)
3. Verify `enabled` option is not `false`

### Back button goes to wrong place
1. Check handler stack order (LIFO)
2. Verify handlers are being unregistered properly
3. Check for multiple conflicting registrations

### Infinite loop / stuck navigation
1. Check handler isn't re-registering on every render
2. Verify cleanup functions are being called
3. Check `isProcessingBackRef` debounce is working

## Related Docs

- `/docs/features/app-shell.md` - Main navigation and layout
- `/docs/features/dashboard.md` - Dashboard collection navigation
- `/docs/features/course-player-and-progress.md` - Course page navigation
