# BackgroundSystem

The animated gradient background system for EnhancedHR.ai. Provides multiple themed backgrounds with dynamic animations.

## Location

`/src/components/BackgroundSystem.tsx`

## Purpose

Creates the foundational visual atmosphere for the entire application. Sits behind all content as a full-screen animated background that users can customize through theme selection.

## Design Tokens Used

### Base Layer
- **Background color**: `bg-[#0A0D12]` (brand-black)
- **Position**: `absolute inset-0`
- **Z-index**: `z-0` (behind all content)
- **Pointer events**: `pointer-events-none`

### Custom Utilities
Defined in `globals.css`:
- `.perspective-container`: 3D perspective for grid effects
- `.grid-floor`: Rotated grid transform
- Various animation keyframes

## Props

```typescript
interface BackgroundSystemProps {
  theme: BackgroundTheme;
}

type BackgroundTheme = {
  id: string;
  label: string;
  type: 'gradient' | 'custom';
  value: string; // CSS class or image URL
}
```

## Available Themes

### 1. Deep Void (Default)
**ID**: `deep-void`

A professional, tech-focused background with:
- **Base gradient**: `#082f4d` → `#0A0D12` → `#000000`
- **Tech grid**: 15px spacing, brand blue lines (`rgba(120,192,240,0.2)`)
- **Light beams**: SVG animated beams with slow sway
- **Top glow**: Subtle brand blue flare at top

Colors:
- Primary: `#054C74` (brand blue)
- Accent: `#78C0F0` (brand blue light)

Animations:
- `animate-beam-sway-1`: 12s ease-in-out infinite
- `animate-beam-sway-2`: 17s ease-in-out infinite reverse
- `animate-beam-sway-3`: 21s ease-in-out infinite

### 2. Neon Horizon
**ID**: `neon-horizon`

A retro-futuristic cyberpunk aesthetic:
- **Base gradient**: `#0f0518` → `#1a0b2e` → `#2d0f45` (purple-black)
- **Horizon glow**: Radial purple glow at 40% from top
- **Grid floor**: Animated pink grid with perspective transform
- **Floating particles**: 75 neon particles with random motion

Colors:
- Grid: `rgba(236,72,153,0.5)` (pink)
- Particles: Pink, purple, cyan, fuchsia, indigo

Animations:
- `animate-grid-flow`: 4s linear infinite
- `animate-neon-float-1/2/3`: 7-12s ease-in-out infinite
- Particles have random delays (0-20s)

### 3. Zen Particles
**ID**: `zen-particles`

A warm, calm aesthetic:
- **Base gradient**: `#12100e` → `#1c1917` → black (warm brown-black)
- **Ambient warmth**: Orange gradient from bottom
- **Floating particles**: Large blurred orbs in warm tones
- **Noise texture**: Subtle SVG noise overlay

Colors:
- Particles: `#fb923c`, `#fed7aa`, `#fff7ed` (orange spectrum)

Animations:
- `animate-particle-float-1/2/3`: 10-18s ease-in-out infinite

### 4. Arctic Aurora
**ID**: `arctic-aurora`

A cool, ethereal aesthetic:
- **Base gradient**: `#020617` → `#0f172a` (deep teal-black)
- **Aurora waves**: Animated gradient curves in teal and purple
- **Starfield**: Static white dots on grid pattern

Colors:
- Wave 1: `rgba(45,212,191,0.2)` (teal/green)
- Wave 2: `rgba(129,140,248,0.2)` (purple/blue)

Animations:
- `animate-aurora-wave-1`: 10s ease-in-out infinite
- `animate-aurora-wave-2`: 14s ease-in-out infinite reverse

### 5. Custom Upload
**ID**: `custom-upload`

User-uploaded image background:
- Image set as `background-image: url(...)`
- Dark overlay: `bg-black/60`
- Slight blur: `backdrop-blur-[2px]`

## Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│  absolute inset-0 overflow-hidden pointer-events-none   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Base Layer: bg-[#0A0D12]                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Theme Layer (selected theme rendering)            │ │
│  │  - Gradients, animations, particles, etc.          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Global Noise Texture Overlay                      │ │
│  │  (SVG fractal noise, 5% opacity, mix-blend-overlay)│ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### Theme Rendering
The component conditionally renders based on `theme.id`:

```tsx
{isCustom ? (
  <CustomImageBackground />
) : (
  <>
    {theme.id === 'deep-void' && renderDeepVoid()}
    {theme.id === 'neon-horizon' && renderNeonHorizon()}
    {theme.id === 'zen-particles' && renderZenParticles()}
    {theme.id === 'arctic-aurora' && renderArcticAurora()}
  </>
)}
```

### Noise Texture
All themes except Zen Particles get a global noise texture:
```tsx
<div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay z-10"
  style={{
    backgroundImage: `url("data:image/svg+xml,...")`
  }} />
```

SVG noise uses:
- `<feTurbulence>` with `baseFrequency='0.8'` and `numOctaves='3'`
- Stitched tiles for seamless pattern

### Animation Keyframes
Defined in `globals.css` under `@theme`:

**Beam Sway**:
```css
@keyframes ray-sway {
  0%, 100% { transform: rotate(-5deg) scale(1); opacity: 0.3; }
  50%      { transform: rotate(5deg) scale(1.2); opacity: 0.6; }
}
```

**Grid Flow**:
```css
@keyframes grid-flow {
  0%   { background-position: 0 0; }
  100% { background-position: 0 50px; }
}
```

**Particle Float**:
```css
@keyframes particle-float {
  0%, 100% { transform: translate(0, 0); }
  33%      { transform: translate(120px, -120px); }
  66%      { transform: translate(-80px, 80px); }
}
```

**Aurora Shift**:
```css
@keyframes aurora-shift {
  0%, 100% { transform: translateX(-20%) scale(1, 1) skewX(-15deg) rotate(-5deg); }
  50%      { transform: translateX(20%) scale(1.3, 1.2) skewX(15deg) rotate(5deg); }
}
```

**Neon Float**:
```css
@keyframes neon-float {
  0%   { opacity: 0; transform: translate(0, 10px) scale(0.5); }
  50%  { opacity: 0.7; transform: translate(5px, -30px) scale(1); }
  100% { opacity: 0; transform: translate(-5px, -70px) scale(0.5); }
}
```

### Neon Particles Generation
Particles are generated once using `useMemo`:
```tsx
const neonParticles = React.useMemo(() => {
  return Array.from({ length: 75 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 8 + 2,  // 2-10px
    color: colors[random],
    animation: animations[random],
    delay: `${Math.random() * 20}s`,  // 0-20s
    blur: Math.random() * 1.5 + 0.5   // 0.5-2px
  }));
}, []);
```

## Usage Example

```tsx
import BackgroundSystem from '@/components/BackgroundSystem';
import { BACKGROUND_THEMES } from '@/constants';

function App() {
  const [theme, setTheme] = useState(BACKGROUND_THEMES[0]); // Deep Void

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Background Layer */}
      <BackgroundSystem theme={theme} />

      {/* Content Layer */}
      <div className="relative z-10 flex w-full h-full">
        {/* Your app content */}
      </div>
    </div>
  );
}
```

## Theme Selection

Themes are selected via the NavigationPanel profile menu:
1. User clicks profile section
2. Selects "Backgrounds" from menu
3. Chooses theme from list or uploads custom image
4. Theme change propagates via `onThemeChange` callback

## Performance Considerations

1. **Memoization**: Particles generated once, not on every render
2. **CSS animations**: Hardware-accelerated transforms
3. **Pointer events**: Disabled to prevent blocking interactions
4. **Layer separation**: Background isolated from content

## Related Components

- **NavigationPanel** - Provides theme selection UI
- **AdminPageLayout** / **StandardPageLayout** - Integrate BackgroundSystem
- **MainCanvas** - Top-level container that includes background

## Design Principles

1. **Subtle motion**: Animations are slow and gentle, never distracting
2. **Low opacity**: Effects are atmospheric, not overwhelming
3. **Performance first**: Use CSS animations and memoization
4. **Layering**: Multiple subtle layers create depth
5. **Customization**: Users can choose aesthetic that fits their preference

## Anti-Patterns

- Don't increase animation speeds (keep them slow and calming)
- Don't use high opacity values (keep it atmospheric)
- Don't add blocking pointer events
- Don't animate on scroll (background is static relative to viewport)
- Don't use images without dark overlay (readability is critical)

## Future Enhancements

Potential additions (not yet implemented):
- User preference persistence
- Time-of-day themes (darker at night)
- Organization-specific branded backgrounds
- Seasonal themes
- Accessibility mode (reduced motion)
