---
id: marketing-pages
owner: frontend
status: active
stability: evolving
last_updated: 2026-02-09
surfaces:
  routes:
    - / (homepage)
    - /academy
    - /platform
    - /ai-tools
    - /collections
    - /organizations
    - /pricing
    - /for-experts
    - /experts
    - /experts/[id]
    - /experts/standalone/[id]
    - /features
    - /demo
    - /join/expert
    - /privacy
    - /terms
  collections: []
data:
  tables: []
  storage: []
backend:
  actions:
    - src/app/(marketing)/layout.tsx
    - src/app/(marketing)/page.tsx
    - src/components/marketing/HeroBackground.tsx
    - src/components/marketing/MobileNav.tsx
    - src/components/marketing/FadeIn.tsx
    - src/components/marketing/MarketingDivider.tsx
    - src/app/sitemap.ts
    - public/robots.txt
ai:
  context_scopes: []
  models: []
tests:
  local:
    - Verify all nav links (desktop and mobile) point to correct routes.
    - Verify hero section renders with correct spacing above the fold on desktop and mobile.
    - Verify anchor pills scroll to their target sections.
    - Verify metadata titles and descriptions render in HTML head for each page.
  staging:
    - Confirm sitemap.xml returns valid XML with all public marketing pages.
    - Confirm robots.txt blocks private routes (/dashboard, /admin, /api/, /login, /org/).
invariants:
  - Nav links must be kept in sync between layout.tsx (desktop) and MobileNav.tsx (mobile). Both define their own `navLinks` array.
  - The "Experts" link (orange, separated by divider) lives outside the navLinks array in both desktop and mobile nav.
  - Hero sections on inner marketing pages must use `pt-[200px] pb-[160px]` to clear the fixed 72px nav. Homepage and demo use their own values.
  - Anchor pill sections on inner pages use `mt-[82px]` spacing. Homepage uses `mt-10`.
  - HeroBackground is a server component. Do not add hooks or client-side logic to it.
  - When adding a new marketing page, it must be added to sitemap.ts.
---

## Overview

The marketing pages are the public-facing website for EnhancedHR.ai. They live under the `(marketing)` route group and share a common layout with a fixed navigation bar, footer, and dark theme (`bg-[#0A0D12]`). All pages are publicly accessible (no auth required to view).

## Layout Architecture

### Route Group Structure

All marketing pages live in `src/app/(marketing)/`. The parenthesized route group means `/academy` maps to `src/app/(marketing)/academy/page.tsx` -- the `(marketing)` segment does not appear in the URL.

### Marketing Layout (`src/app/(marketing)/layout.tsx`)

The shared layout provides:

1. **Fixed navigation bar** -- 72px tall, fixed at top, with backdrop blur (`bg-[#0A0D12]/70 backdrop-blur-2xl`), z-50.
2. **Desktop nav links** -- rendered from a `navLinks` array. Links: Academy, Platform, AI Tools, Collections, Orgs, Pricing, Demo. After a vertical divider, the "Experts" link appears in orange (`text-[#FF9300]`).
3. **Desktop auth buttons** -- "Log In" and "Get Started" (or "My Dashboard" if logged in). Auth state is checked server-side via Supabase.
4. **Mobile nav** -- `<MobileNav>` component (client component, renders below `lg` breakpoint).
5. **Footer** -- four-column grid with Platform, Solutions, Company links + brand column.
6. **`<main>` tag** -- wraps `{children}` with no padding. Individual pages are responsible for their own hero spacing.

### Key Spacing Rule

The `<main>` element has **no top padding**. Each page's hero section handles its own top spacing to clear the 72px fixed nav. This approach was chosen so the hero background can extend behind the nav for a seamless visual effect.

## Hero Section Pattern

Every marketing page has a hero section at the top. The pattern is:

```
<section className="relative bg-[#0A0D12]">
    <HeroBackground />
    <div className="relative z-10 max-w-7xl mx-auto px-6 pt-[200px] pb-[160px]">
        {/* Hero content: badge pill, h1, subtitle, CTAs */}
    </div>
</section>
```

### Padding Values

| Page Type | `pt` value | `pb` value | Notes |
|-----------|-----------|-----------|-------|
| 7 core inner pages (academy, platform, ai-tools, collections, organizations, pricing, for-experts) | `pt-[200px]` | `pb-[160px]` | Standard hero |
| Homepage (`/`) | `pt-[120px]` | `pb-20` | Shorter top padding; full viewport hero with mockup |
| Demo (`/demo`) | `pt-[170px]` | `pb-16 md:pb-24` | Two-column layout (hero + form) |

### HeroBackground Component (`src/components/marketing/HeroBackground.tsx`)

A **server component** (no `'use client'` directive, no hooks) that renders decorative SVG light beams, a tech grid, and atmospheric glows. It is used on every marketing page hero. Do not add React hooks or client-side interactivity to this component.

### Anchor Navigation Pills

Most inner pages define an `anchorPills` array and render pill links below the hero content that scroll to page sections:

```
<div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mt-[82px]">
    {anchorPills.map((pill) => (
        <a key={pill.id} href={`#${pill.id}`} className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors">
            {pill.label}
        </a>
    ))}
</div>
```

| Page | max-width | Spacing above pills |
|------|-----------|-------------------|
| Platform | `max-w-4xl` | `mt-[82px]` |
| All other inner pages | `max-w-3xl` | `mt-[82px]` |
| Homepage | `max-w-3xl` | `mt-10` |

### Section Dividers

`<MarketingDivider />` is placed between every major section. It renders a subtle gradient horizontal line with a blue glow accent in the center.

## Navigation Configuration

### Where Nav Links Are Defined

Nav links are defined in **two separate places** that must be kept in sync:

1. **Desktop nav**: `src/app/(marketing)/layout.tsx` -- `navLinks` array at top of file (line ~9)
2. **Mobile nav**: `src/components/marketing/MobileNav.tsx` -- `navLinks` array at top of file (line ~8)

Both arrays contain the same links: Academy, Platform, AI Tools, Collections, Orgs, Pricing, Demo.

The **"Experts" link** is rendered separately (outside the array) in both desktop and mobile nav. It appears after a visual divider and uses orange styling (`text-[#FF9300]`).

### Adding a New Nav Link

1. Add the link object `{ href: '/route', label: 'Label' }` to both `navLinks` arrays.
2. Keep labels short -- the desktop nav is space-constrained (e.g., "Organizations" was shortened to "Orgs").
3. If the link should appear after the divider (like "Experts"), add it separately in both layout.tsx and MobileNav.tsx.

### Mobile Nav Details (`src/components/marketing/MobileNav.tsx`)

- Client component (`'use client'`).
- Uses `createPortal` to render a full-screen overlay at `z-[100]`.
- Hamburger button shows below `lg` breakpoint (`lg:hidden`).
- Touch targets use `p-3` padding for mobile accessibility.
- Auth section width: `w-full max-w-xs`.
- Body scroll is locked when menu is open.
- Links have staggered fade-in animation on open.

## SEO Metadata Pattern

### Server Components (most pages)

For pages that are server components, export a static `metadata` object:

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Page Title -- EnhancedHR.ai',
    description: 'Page description for search engines.',
};
```

### Client Components (demo, join/expert)

Client components cannot export `metadata` directly. Instead, create a `layout.tsx` wrapper in the same directory that exports the metadata:

```typescript
// src/app/(marketing)/demo/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Request a Demo -- EnhancedHR.ai',
    description: '...',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
    return children;
}
```

The layout simply passes through `children` -- its only purpose is providing metadata.

### Dynamic Routes (experts/[id])

For dynamic routes, use `generateMetadata`:

```typescript
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    // Fetch data, return metadata
    return {
        title: `${name} -- EnhancedHR.ai`,
        description: '...',
    };
}
```

### Metadata Naming Convention

- Title format: `Page Name -- EnhancedHR.ai`
- Keep descriptions under 160 characters.
- Every marketing page must have metadata defined.

## Sitemap and Robots

### Sitemap (`src/app/sitemap.ts`)

Uses the Next.js App Router `MetadataRoute.Sitemap` convention. Lists all public marketing page paths. When adding a new marketing page, add its path to the `staticPages` array. The homepage gets `priority: 1` and `changeFrequency: 'weekly'`; pricing gets `0.9`; all others get `0.8`.

Accessible at: `https://www.enhancedhr.ai/sitemap.xml`

### Robots (`public/robots.txt`)

Static file that blocks crawlers from private routes:
- `/dashboard`
- `/admin`
- `/api/`
- `/login`
- `/org/`

References the sitemap URL. When adding new private route groups, add a `Disallow` entry here.

## Shared Marketing Components

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| HeroBackground | `src/components/marketing/HeroBackground.tsx` | Server | Decorative SVG beams, grid, glows for hero sections |
| MobileNav | `src/components/marketing/MobileNav.tsx` | Client | Full-screen mobile navigation overlay |
| FadeIn | `src/components/marketing/FadeIn.tsx` | Client | Intersection Observer-based scroll animation wrapper |
| MarketingDivider | `src/components/marketing/MarketingDivider.tsx` | Server | Subtle gradient horizontal divider between sections |

### FadeIn Component

Wraps content to fade it in when scrolled into view. Props:
- `delay` (ms): stagger timing
- `direction`: `'up'` (default), `'down'`, `'left'`, `'right'`, `'none'`
- `duration` (ms): animation duration (default 400)

Used extensively on all marketing pages. Uses IntersectionObserver with threshold 0.05.

## Mobile Responsiveness Guidelines

- **Touch targets**: Mobile-interactive elements (hamburger, close button) use `p-3` minimum padding.
- **Layout padding**: Responsive `px-4 sm:px-6` on nav and footer containers.
- **Footer grid gaps**: `gap-6 md:gap-8` for responsive column spacing.
- **Nav breakpoint**: Desktop nav shows at `lg` (1024px). Below that, the hamburger menu appears.
- **Hero CTAs**: Stack vertically on mobile via `flex-col sm:flex-row`.
- **Logo sizing**: Responsive `w-[140px] md:w-[160px]`.

## Adding a New Marketing Page

Checklist for adding a new marketing page:

1. Create `src/app/(marketing)/your-page/page.tsx`.
2. Add SEO metadata (static export for server components, layout.tsx wrapper for client components).
3. Use the hero section pattern with `pt-[200px] pb-[160px]` and `<HeroBackground />`.
4. Add anchor pills if the page has multiple sections.
5. Use `<MarketingDivider />` between sections.
6. Add the route to `src/app/sitemap.ts`.
7. If adding a nav link, update BOTH `layout.tsx` and `MobileNav.tsx`.
8. Wrap content blocks in `<FadeIn>` for scroll animation.

## Page Inventory

| Route | File | Component Type | Metadata Pattern |
|-------|------|---------------|-----------------|
| `/` | `(marketing)/page.tsx` | Server (async) | Static export |
| `/academy` | `(marketing)/academy/page.tsx` | Server | Static export |
| `/platform` | `(marketing)/platform/page.tsx` | Server | Static export |
| `/ai-tools` | `(marketing)/ai-tools/page.tsx` | Server | Static export |
| `/collections` | `(marketing)/collections/page.tsx` | Server | Static export |
| `/organizations` | `(marketing)/organizations/page.tsx` | Server | Static export |
| `/pricing` | `(marketing)/pricing/page.tsx` | Server | Static export |
| `/for-experts` | `(marketing)/for-experts/page.tsx` | Server | Static export |
| `/features` | `(marketing)/features/page.tsx` | Server | Static export |
| `/experts` | `(marketing)/experts/page.tsx` | Server (async) | Static export |
| `/experts/[id]` | `(marketing)/experts/[id]/page.tsx` | Server (async) | generateMetadata |
| `/experts/standalone/[id]` | `(marketing)/experts/standalone/[id]/page.tsx` | Server (async) | generateMetadata |
| `/demo` | `(marketing)/demo/page.tsx` | Client | layout.tsx wrapper |
| `/join/expert` | `(marketing)/join/expert/page.tsx` | Client | layout.tsx wrapper |
| `/privacy` | `(marketing)/privacy/page.tsx` | Server | Static export |
| `/terms` | `(marketing)/terms/page.tsx` | Server | Static export |

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Page background | `#0A0D12` | All marketing pages |
| Primary blue | `#4B8BB3` | CTAs, badges, links |
| Light blue | `#78C0F0` | Gradients, accents |
| Deep blue | `#054C74` | Backgrounds, glows |
| Orange | `#FF9300` | Expert/special links, accents |
| Red | `#FF2600` | Rare accent color |
| Nav height | `72px` | Fixed nav bar |
| Max content width | `max-w-7xl` (1280px) | Page content container |
| Selection color | `selection:bg-[#4B8BB3]/30` | Text selection highlight |

## Coupling Notes

- **App Shell**: The marketing layout is entirely separate from the in-app shell (`/dashboard`). They share no layout components.
- **Auth**: The marketing layout checks auth state server-side to show "My Dashboard" vs "Log In / Get Started". Uses `createClient()` from `@/lib/supabase/server`.
- **Experts feature**: The `/experts` and `/experts/[id]` pages fetch real data from Supabase (profiles table). Changes to the profiles schema can affect these pages.
- **Demo leads**: The `/demo` page submits to `src/app/actions/leads.ts` server action.
