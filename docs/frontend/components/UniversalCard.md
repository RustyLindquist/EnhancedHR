# UniversalCard

The primary card component for EnhancedHR.ai. A polymorphic card that adapts its appearance based on content type.

## Location

`/src/components/cards/UniversalCard.tsx`

## Purpose

Provides a unified card interface for displaying 12 different content types with consistent structure but type-specific styling. This is the workhorse component for grid displays throughout the application.

## Supported Card Types

1. **COURSE** - Course catalog cards
2. **MODULE** - Course module cards
3. **LESSON** - Individual lesson cards
4. **RESOURCE** - Downloadable resource cards
5. **CONVERSATION** - Chat/conversation preview cards
6. **CONTEXT** - Context/note cards
7. **AI_INSIGHT** - AI-generated insight cards
8. **PROFILE** - User/instructor profile cards
9. **HELP** - Help/feature cards
10. **NOTE** - User note cards
11. **TOOL** - Tool/utility cards
12. **TOOL_CONVERSATION** - Tool-specific conversation cards

## Design Tokens Used

### Common Layout
- **Aspect ratio**: `aspect-[4/3]`
- **Min height**: `min-h-[310px]`
- **Border radius**: `rounded-3xl`
- **Base background**: `bg-[#0B1120]` (dark blue-black)
- **Shadow (default)**: `shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3)]`
- **Shadow (hover)**: `shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.4)]`

### Card Structure
- **Top section**: 45-60% of card height (varies by type)
- **Bottom section**: 40-55% of card height (varies by type)

### Type-Specific Colors

| Type | Header Color | Border | Glow |
|------|-------------|--------|------|
| COURSE | `bg-[#0B1120]` | `border-blue-500/30` | `rgba(120,192,240,0.6)` |
| LESSON | `bg-[#063F5F]` | `border-[#78C0F0]/30` | `rgba(120,192,240,0.6)` |
| RESOURCE | `bg-[#4A2020]` | `border-red-500/30` | `rgba(239,68,68,0.5)` |
| CONVERSATION | `bg-[#054C74]` | `border-[#78C0F0]/30` | `rgba(120,192,240,0.6)` |
| CONTEXT | `bg-[#7c2d12]` | `border-orange-500/30` | `rgba(234,88,12,0.5)` |
| AI_INSIGHT | `bg-[#7a4500]` | `border-[#FF9300]/40` | `rgba(255,147,0,0.6)` |
| HELP | `bg-[#4B8BB3]` | `border-[#4B8BB3]/30` | `rgba(75,139,179,0.6)` |
| NOTE | `bg-[#9A9724]/80` | `border-[#9A9724]/40` | `rgba(154,151,36,0.4)` |
| TOOL | `bg-[#0D9488]` | `border-teal-500/30` | `rgba(13,148,136,0.6)` |

## Props

```typescript
interface UniversalCardProps {
  type: CardType;              // Required: determines styling
  title: string;               // Required: card title
  subtitle?: string;           // Optional: author, meta info
  description?: string;        // Optional: body text
  meta?: string;              // Optional: timestamp, duration
  actionLabel?: string;        // Optional: button text
  imageUrl?: string;          // Optional: for COURSE/MODULE/LESSON
  categories?: string[];       // Optional: up to 3 category tags
  rating?: number;            // Optional: 0-5 rating (for COURSE)
  credits?: {                 // Optional: credential badges
    shrm?: number | boolean;
    hrci?: number | boolean;
  };
  collections?: string[];      // Optional: collection names (for NOTE)
  iconName?: string;          // Optional: dynamic icon (for TOOL)
  onAction?: () => void;      // Optional: primary action handler
  onRemove?: () => void;      // Optional: remove from collection
  onAdd?: () => void;         // Optional: add to collection
  draggable?: boolean;        // Optional: enable drag behavior
  onDragStart?: (e: React.DragEvent) => void; // Optional: drag handler
}
```

## Usage Examples

### Course Card
```tsx
<UniversalCard
  type="COURSE"
  title="Introduction to Leadership"
  subtitle="Dr. Sarah Johnson"
  description="Master the fundamentals of effective leadership..."
  imageUrl="/courses/leadership-101.jpg"
  rating={4.8}
  credits={{ shrm: true, hrci: true }}
  categories={["Leadership", "Management", "Communication"]}
  onAction={() => router.push('/courses/123')}
/>
```

### Conversation Card
```tsx
<UniversalCard
  type="CONVERSATION"
  title="Q&A: Performance Reviews"
  description="Discussion about best practices for annual performance reviews..."
  meta="2 days ago"
  onAction={() => router.push('/conversations/456')}
  onRemove={() => removeFromCollection('456')}
/>
```

### Note Card
```tsx
<UniversalCard
  type="NOTE"
  title="Key Takeaways - Module 3"
  description="Important points from today's training session..."
  meta="Jan 4, 2026"
  collections={["Leadership Course", "My Notes"]}
  onAction={() => openNoteEditor('789')}
/>
```

### Resource Card
```tsx
<UniversalCard
  type="RESOURCE"
  title="Employee Handbook Template"
  subtitle="HR Templates"
  description="Comprehensive template for employee handbooks"
  meta="2.4 MB"
  onAction={() => downloadResource('handbook.pdf')}
  onAdd={() => addToCollection('res-123')}
/>
```

## Visual Structure

```
┌───────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │ ← Type badge & actions
│ │ TYPE           [Remove] [Add]   │ │   (header bar)
│ └─────────────────────────────────┘ │
│                                      │
│   Top Section (45-60%)               │ ← Image (media cards) OR
│   - Image OR colored background      │   Colored bg with icon
│   - Title overlaid at bottom         │   Title centered
│   - Decorative icon (non-media)      │
│                                      │
├──────────────────────────────────────┤
│   Bottom Section (40-55%)            │
│   - Description text                 │
│   - Footer: metadata + action        │
│     • Left: timestamp/duration       │
│     • Right: button/icon             │
└──────────────────────────────────────┘
```

## Implementation Details

### Media Cards vs. Text Cards
- **Media cards** (COURSE, MODULE, LESSON): Top section shows image, title at bottom
- **Text cards** (others): Top section shows colored background with centered title

### Interactive States
- **Hover**: Shadow intensifies, glow effect from `InteractiveCardWrapper`
- **Drag**: Cursor changes to `cursor-grab` / `cursor-grabbing`
- **Click**: Entire card is clickable for most types (except RESOURCE which has specific download action)

### Header Actions
The header bar (`data-header-actions`) contains:
- **Type label**: Small uppercase text showing card type
- **Remove button**: Trash icon (if `onRemove` provided)
- **Add button**: Plus icon (if `onAdd` provided)

Click events on this area are stopped from propagating to card click.

### Footer Variations
Different card types show different footer content:
- **COURSE/MODULE**: Categories instead of action button
- **NOTE**: Collections list + timestamp
- **CONVERSATION/CONTEXT/AI_INSIGHT**: Just timestamp (no button)
- **RESOURCE**: File size + download icon
- **Others**: Metadata + action button

## Wrapper Component

UniversalCard is wrapped in `InteractiveCardWrapper` which provides:
- Hover glow effect (type-specific color)
- Drag intent detection
- Smooth transitions

## Related Components

- **InteractiveCardWrapper** - Provides glow and interaction layer
- **ResourceCard** - Specialized variant for resources (can use UniversalCard with type="RESOURCE")
- **ConversationGraphic** - SVG icon used for CONVERSATION type

## Design Principles

1. **Consistent structure**: All cards share same aspect ratio and base layout
2. **Type-driven styling**: Each type has a specific color scheme and icon
3. **Progressive disclosure**: Essential info visible, details on click
4. **Visual hierarchy**: Title most prominent, metadata subtle
5. **Touch-friendly**: Large click targets, clear interactive zones

## Common Patterns

### Card Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <UniversalCard key={item.id} {...item} />
  ))}
</div>
```

### With Drag and Drop
```tsx
<UniversalCard
  {...cardProps}
  draggable={true}
  onDragStart={(e) => {
    e.dataTransfer.setData('card-id', cardId);
  }}
/>
```

## Anti-Patterns

- Don't override the aspect ratio or min-height
- Don't use custom colors that aren't type-specific
- Don't put multiple action buttons in the footer
- Don't omit the title (it's required for a reason)
- Don't use for list items (cards are for grid displays)
