# CanvasHeader

Standard header component used across all canvas views in EnhancedHR.ai.

## Location

`/src/components/CanvasHeader.tsx`

## Purpose

Provides a consistent header treatment for all main canvas views. Displays contextual information, page title, and optional actions.

## Design Tokens Used

### Layout
- **Height**: `h-24` (fixed, 96px)
- **Padding**: `px-10` (horizontal)
- **Border**: `border-b border-white/10`
- **Background**: `bg-white/5 backdrop-blur-xl`
- **Shadow**: `shadow-[0_4px_30px_rgba(0,0,0,0.1)]`

### Typography
- **Context label**: `text-[10px] font-bold uppercase tracking-widest text-brand-blue-light`
- **Title**: `text-3xl font-light text-white tracking-tight drop-shadow-lg`
- **Title emphasis**: First word is `font-light`, remaining words are `font-bold`

### Colors
- Context label: `text-brand-blue-light` (#78C0F0) with glow effect
- Title: `text-white`

## Props

```typescript
interface CanvasHeaderProps {
  context: string;        // Small label above title (e.g., "Platform Administration")
  title: string;          // Main page title (e.g., "Admin Console")
  children?: React.ReactNode; // Action buttons/controls (right side)
  onBack?: () => void;    // Optional back navigation handler
  backLabel?: string;     // Optional back button tooltip
}
```

## Usage Examples

### Basic Header
```tsx
<CanvasHeader
  context="Personal Library"
  title="My Courses"
/>
```

### With Actions
```tsx
<CanvasHeader
  context="Course Management"
  title="Edit Course"
>
  <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg">
    Save Changes
  </button>
</CanvasHeader>
```

### With Back Navigation
```tsx
<CanvasHeader
  context="Settings"
  title="Account Details"
  onBack={() => router.push('/settings')}
  backLabel="Back to Settings"
/>
```

## Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│  h-24 │ bg-white/5 │ backdrop-blur-xl │ border-b          │
│                                                             │
│  ┌─────────┐                              ┌──────────────┐ │
│  │ [Back]  │  CONTEXT LABEL               │  [Actions]   │ │
│  └─────────┘  Title in Bold               └──────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Title Styling Pattern
The component automatically splits the title string and applies different font weights:
- **First word**: `font-light` (lighter weight)
- **Remaining words**: `font-bold` (heavier weight)

Example: "Personal **Context**" or "Admin **Console**"

### Back Button
When `onBack` is provided, renders a circular button with:
- Size: `w-10 h-10`
- Background: `bg-white/5 hover:bg-white/10`
- Border: `border border-white/10`
- Icon: `ArrowLeft` from lucide-react
- Hover effect: Scale animation (`hover:scale-105`)

### Context Label Glow
The context label has a subtle brand blue glow:
```css
drop-shadow-[0_0_5px_rgba(120,192,240,0.5)]
```

## Related Components

- **AdminPageLayout** - Uses CanvasHeader with "Platform Administration" context
- **MainCanvas** - Integrates CanvasHeader as the top element
- **StandardPageLayout** - Wraps content with CanvasHeader

## Design Principles

1. **Consistency**: Always use `h-24` - never vary header height
2. **Transparency**: Background is translucent to show platform gradient
3. **Hierarchy**: Context label is small and subtle, title is prominent
4. **Flexibility**: Children slot allows custom actions without breaking layout

## Anti-Patterns

- Changing the height (`h-24` is sacred)
- Using solid backgrounds
- Omitting the context label (always provide one)
- Putting too many actions in the children slot (keep it minimal)
