# UniversalCollectionCard

**Location**: `/src/components/UniversalCollectionCard.tsx`

**Category**: Card Components

**Status**: Active, Stable

---

## Overview

`UniversalCollectionCard` is the **standard wrapper component** for rendering context cards in collection views. It wraps `UniversalCard` and ensures that all rendered cards are both **clickable** and **draggable**, which are critical invariants for the collections system.

**Key Responsibility**: Provide consistent interaction patterns (click-to-open, drag-to-organize) for all content types displayed in collections.

---

## Why This Component Exists

Collections contain heterogeneous content (courses, conversations, notes, context items, etc.). Each item needs to:

1. **Be clickable** → Navigate to or open the associated content
2. **Be draggable** → Allow users to drag items onto the CollectionSurface to organize them
3. **Display consistently** → Use UniversalCard's visual system

`UniversalCollectionCard` enforces these invariants by:
- Accepting a `CollectionItemDetail` (unified type for all collection items)
- Mapping each item type to the correct `UniversalCard` props
- Wiring up click handlers (`onClick`)
- Wiring up drag handlers (`onDragStart`) with CustomDragLayer integration
- Providing remove/add actions

---

## Invariants (CRITICAL)

### 1. Context Cards MUST Always Be Clickable

All context cards rendered in collection views must have click handlers that navigate to or open their associated content. This ensures users can always access the full content from any collection view.

**Implementation**: `UniversalCollectionCard` accepts an `onClick` callback and passes it to `UniversalCard` as `onAction`.

### 2. Context Cards MUST Always Be Draggable

All context cards must support drag-and-drop functionality with a follow-along visual artifact (via `CustomDragLayer`), enabling users to organize content by dragging items onto the `CollectionSurface`.

**Implementation**: `UniversalCollectionCard` accepts an `onDragStart` callback and creates a `DragItem` payload with proper type mapping. It hides the native drag preview and relies on `CustomDragLayer` for visual feedback.

### 3. Anti-Pattern: Direct Use of UniversalCard

**DO NOT** render `UniversalCard` directly in collection views without click/drag handlers. This breaks user expectations and collection workflows.

**Correct**:
```tsx
<UniversalCollectionCard
  item={collectionItem}
  onClick={handleItemClick}
  onDragStart={handleDragStart}
  onRemove={handleRemove}
/>
```

**Incorrect**:
```tsx
<UniversalCard
  type="COURSE"
  title={item.title}
  // Missing onClick, onDragStart handlers
/>
```

---

## Supported Item Types

`UniversalCollectionCard` handles all collection item types:

| Item Type | Maps to CardType | Drag Type | Action Label |
|-----------|------------------|-----------|--------------|
| `COURSE` | `COURSE` | `COURSE` | `VIEW` |
| `MODULE` | `MODULE` | `MODULE` | `START` |
| `LESSON` | `LESSON` | `LESSON` | `START` |
| `RESOURCE` | `RESOURCE` | `RESOURCE` | `OPEN` |
| `CONVERSATION` | `CONVERSATION` | `CONVERSATION` | `CHAT` |
| `TOOL_CONVERSATION` | `TOOL_CONVERSATION` | `TOOL_CONVERSATION` | `CHAT` |
| `NOTE` | `NOTE` | `NOTE` | `EDIT` |
| `AI_INSIGHT` | `AI_INSIGHT` | `CONTEXT` | `VIEW` |
| `CUSTOM_CONTEXT` | `CONTEXT` | `CONTEXT` | `EDIT` |
| `FILE` | `RESOURCE` | `CONTEXT` | `PREVIEW` |
| `PROFILE` | `PROFILE` | `PROFILE` | `EDIT` |

---

## Props

```typescript
interface UniversalCollectionCardProps {
  item: CollectionItemDetail;
  onRemove: (id: string, type: string) => void;
  onClick: (item: CollectionItemDetail) => void;
  onAdd?: (item: CollectionItemDetail) => void;
  onDragStart?: (item: DragItem) => void;
}
```

### `item` (required)

The collection item to render. Must be one of the supported `CollectionItemDetail` types with an `itemType` discriminator.

### `onRemove` (required)

Callback when the user clicks the remove/trash button. Receives the item's ID and type.

### `onClick` (required)

Callback when the user clicks the card body (excluding header actions). This is how users open/navigate to the content.

### `onAdd` (optional)

Callback when the user clicks the add button. Used in discovery views (e.g., Academy) to add items to collections.

### `onDragStart` (optional)

Callback when the user starts dragging the card. If provided, the card becomes draggable. The component creates a `DragItem` payload and hides the native drag preview in favor of `CustomDragLayer`.

---

## Drag-and-Drop Integration

### How It Works

1. User starts dragging a card
2. `handleDragStart` creates a `DragItem` payload with:
   - `type`: Mapped from `itemType` to `DragItemType`
   - `id`, `title`, `subtitle`, `image`, `meta`: Extracted from item
3. Payload is serialized to `e.dataTransfer`
4. Native drag preview is hidden (transparent 1x1 GIF)
5. `onDragStart` callback triggers, which should activate `CustomDragLayer` to show a follow-along visual artifact
6. User drags over `CollectionSurface` and drops
7. Collection receives the `DragItem` and processes it

### DragItemType Mapping

`CollectionItemDetail.itemType` → `DragItemType`:

```typescript
const getDragItemType = (itemType: string): DragItemType => {
  switch (itemType) {
    case 'COURSE': return 'COURSE';
    case 'MODULE': return 'MODULE';
    case 'LESSON': return 'LESSON';
    case 'RESOURCE': return 'RESOURCE';
    case 'CONVERSATION': return 'CONVERSATION';
    case 'TOOL_CONVERSATION': return 'TOOL_CONVERSATION';
    case 'NOTE': return 'NOTE';
    case 'AI_INSIGHT':
    case 'CUSTOM_CONTEXT':
    case 'FILE': return 'CONTEXT';
    case 'PROFILE': return 'PROFILE';
    default: return 'CONTEXT';
  }
};
```

---

## Item Type Mapping Logic

Each `itemType` is mapped to appropriate `UniversalCard` props. Key examples:

### COURSE
```typescript
{
  type: 'COURSE',
  subtitle: course.author,
  description: course.description,
  imageUrl: course.image,
  meta: course.duration,
  categories: [course.category],
  rating: course.rating,
  credits: {
    shrm: course.badges?.includes('SHRM'),
    hrci: course.badges?.includes('HRCI')
  },
  actionLabel: 'VIEW'
}
```

### CONVERSATION / TOOL_CONVERSATION
```typescript
{
  type: 'CONVERSATION' | 'TOOL_CONVERSATION',
  description: conv.lastMessage || 'No messages yet.',
  meta: formatted date,
  actionLabel: 'CHAT'
}
```

### NOTE
```typescript
{
  type: 'NOTE',
  title: note.title || 'Untitled Note',
  description: plainContent preview (150 chars),
  meta: formatted date,
  actionLabel: 'EDIT'
}
```

### AI_INSIGHT / CUSTOM_CONTEXT / FILE / PROFILE
All map to specific `UniversalCard` configurations with appropriate icons, labels, and metadata.

---

## Usage Examples

### In Collection Detail View

```tsx
import UniversalCollectionCard from '@/components/UniversalCollectionCard';

function CollectionView({ items }: { items: CollectionItemDetail[] }) {
  const handleItemClick = (item: CollectionItemDetail) => {
    // Navigate based on item type
    if (item.itemType === 'COURSE') {
      router.push(`/courses/${item.id}`);
    } else if (item.itemType === 'CONVERSATION') {
      setActiveConversation(item.id);
    }
    // ... etc
  };

  const handleDragStart = (dragItem: DragItem) => {
    setDraggedItem(dragItem);
  };

  const handleRemove = async (id: string, type: string) => {
    await removeFromCollectionAction(collectionId, id, type);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <UniversalCollectionCard
          key={`${item.itemType}-${item.id}`}
          item={item}
          onClick={handleItemClick}
          onDragStart={handleDragStart}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}
```

### In Discovery/Academy View (with Add)

```tsx
function AcademyView({ courses }: { courses: Course[] }) {
  const handleAddToCollection = async (item: CollectionItemDetail) => {
    // Show collection picker or add to default collection
    await addToCollectionAction(item);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course) => (
        <UniversalCollectionCard
          key={course.id}
          item={{ ...course, itemType: 'COURSE' }}
          onClick={(item) => router.push(`/courses/${item.id}`)}
          onAdd={handleAddToCollection}
        />
      ))}
    </div>
  );
}
```

---

## Related Components

- **UniversalCard** (`/src/components/cards/UniversalCard.tsx`): The underlying card component that handles visual rendering
- **InteractiveCardWrapper** (`/src/components/cards/InteractiveCardWrapper.tsx`): Adds glow effects and drag interaction (used inside UniversalCard)
- **CustomDragLayer** (location TBD): Renders the follow-along visual artifact during drag operations
- **CollectionSurface** (location TBD): The drop target for dragged items

---

## Testing Checklist

- [ ] All collection item types render correctly
- [ ] Clicking card body triggers `onClick` handler
- [ ] Clicking trash button triggers `onRemove` handler
- [ ] Clicking add button (when present) triggers `onAdd` handler
- [ ] Dragging a card creates proper `DragItem` payload
- [ ] CustomDragLayer shows during drag
- [ ] Dropping on CollectionSurface adds item to collection
- [ ] Cards in different collections maintain independent state

---

## Change Guide

### Adding a New Item Type

1. Add new type to `CollectionItemDetail` union
2. Add mapping case in `UniversalCollectionCard` switch statement
3. Define `cardProps` for the new type
4. Add to `getDragItemType` mapping if draggable
5. Update this doc's "Supported Item Types" table
6. Test rendering, clicking, and dragging

### Modifying Drag Behavior

1. Update `handleDragStart` logic
2. Ensure `DragItem` payload structure matches drop target expectations
3. Verify CustomDragLayer integration still works
4. Test drag-and-drop flow end-to-end

### Removing Click/Drag Handlers (DON'T)

This violates collection system invariants. If a use case truly doesn't need interaction, consider creating a separate read-only card component instead of modifying `UniversalCollectionCard`.

---

## Documentation Status

- **Created**: 2026-01-05
- **Last Updated**: 2026-01-05
- **Maintainer**: Frontend Agent
- **Related Docs**:
  - `docs/features/collections-and-context.md` (feature invariants)
  - `docs/frontend/components/UniversalCard.md` (underlying card)
  - `docs/frontend/COMPONENT_INDEX.md` (component inventory)
