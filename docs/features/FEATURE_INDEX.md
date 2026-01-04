# Feature Index

This file is the **primary discovery and routing index** for the EnhancedHR.ai application. Agents and developers should consult it **before planning or coding** to identify the primary feature they’re touching, the secondary features likely to be impacted, and the docs that should be consulted/updated. This is **not** a substitute for feature docs—it is an index that keeps feature boundaries and risk visible. Risk Level reflects blast radius and regression cost, not implementation complexity. Keep it updated whenever a new doc is added under `docs/features/`.

## Feature Index

| Feature Name | Feature ID / Slug | Primary Surfaces | Core Responsibility | Risk Level | Coupling Notes | Doc Status |
| --- | --- | --- | --- | --- | --- | --- |
| App Shell & Navigation | app-shell | In-app left navigation + main canvas (collection views); global dropdown panels | Owns the “single app” experience: navigation, view switching, and global panels | High | Touches nearly every feature; small UI/state changes can break multiple flows | Exists |
| User Accounts & Authentication | auth-accounts | `/login`; `/auth/callback`; `/auth/join-org`; account settings | Owns login/signup, session establishment, and account-level settings entry points | High | Coupled to roles/RLS, org membership, and admin gating | Missing |
| Dashboard (Learning Hub) | dashboard | `/dashboard`; in-app Dashboard collection views (user/employee/org-admin variants) | Owns the user’s home base: next steps, stats, and jump points into learning | Medium | Coupled to progress/credits, courses, conversations, and AI quick starts | Missing |
| Academy (Course Catalog) | academy | In-app Academy collection view; `/features` (marketing) references | Owns course discovery: browse/search/filter and course entry points | Medium | Coupled to course detail/player and enrollment/progress | Exists |
| Courses & Lesson Player (Progress) | course-player-and-progress | Course detail & lesson player UI; dynamic content routes; progress indicators | Owns course consumption and progress tracking while learning | High | Coupled to Mux tracking, credits/certificates, notes, and course AI | Exists |
| Course AI (Assistant & Tutor) | course-ai | Right-side AI panel while inside a course; Tutor/Assistant modes | Owns course-aware AI help and tutoring behavior | High | Coupled to AI context engine, personal context, and course content retrieval | Exists |
| Prometheus Chat & Conversations | prometheus-chat | Prometheus full-screen experience; right-side AI panel; Conversations collection | Owns AI chat UX, persistence, and resuming conversations across the platform | High | Coupled to AI context engine, personal context/insights, tools, and collections | Exists |
| Collections & Context Organization | collections-and-context | Collections views (Favorites/Workspace/Watchlist/custom); drag-and-drop collection surface | Owns organizing learning items (courses, conversations, notes, etc.) into collections | High | Coupled to almost all content types; changes can break saving/organization broadly | Exists |
| Personal Context & AI Insights | personal-context-insights | Personal Context collection; AI Insight capture/management; settings toggles | Owns user-specific context that personalizes AI behavior over time | Medium | Coupled to AI chat and course AI; depends on stable data/permissions | Exists |
| Prompt Library | prompt-library | In-app prompt drawer/library; admin prompt management (`/admin/prompts`) | Owns reusable prompt templates and quick-start conversations | Medium | Coupled to Prometheus chat, tools, and onboarding UX | Exists |
| Notes | notes | Notes inside courses (right panel); Notes collection | Owns learner note-taking and note retrieval across courses | Medium | Coupled to course player, collections organization, and export/share behaviors | Exists |
| Tools (AI Workflows) | tools | `/tools`; `/tools/[slug]`; Tools collection view; tool-created conversations | Owns structured AI workflows and tool-specific conversation flows | High | Coupled to conversations, AI context engine, collections, and permissions | Exists |
| Certifications, Credits & Certificates | certifications-and-credits | Certifications UI surfaces; dashboard stats; certificates/badges endpoints | Owns tracking and surfacing certification eligibility and earned outcomes | High | Coupled to progress tracking and ledger/certificate generation; business-critical | Exists |
| Experts (Instructor Profiles) | experts | `/experts`; `/experts/[id]` | Owns expert discovery, profiles, and linking experts to courses | Low | Coupled mainly to courses/catalog presentation | Missing |
| Help System (Help Collection) | help-collection | Help collection view; help dropdown panel; Help collection assistant | Owns end-user help content discovery and “ask the platform” guidance | Medium | Coupled to AI context engine and global panel behavior; important for onboarding | Exists |
| Organization Membership (Employee Experience) | organization-membership | `/org/*`; team surfaces; employee dashboard | Owns org membership flows and employee vs individual experience shaping | High | Coupled to auth/roles, billing/seats, and admin gating | Exists |
| Author Portal (Course Creation) | author-portal | `/author/*`; `/teach`; course builder surfaces | Owns author workflows for creating and managing course content | Medium | Coupled to courses schema, assets, and admin review/approval flows | Exists |
| Platform Admin Portal | admin-portal | `/admin/*` (users, courses, payouts, system, AI logs) | Owns platform operations: user/course management and administrative tools | High | Privileged surfaces; tightly coupled to roles/RLS and core data schema | Exists |
| Membership & Billing | membership-billing | `/settings/billing`; Stripe checkout/portal flows | Owns subscription/access gating and billing lifecycle | High | Coupled to org membership, roles, and access across the app | Exists |

## Cross‑Cutting / Foundation Features

These are not “single screens.” They affect many features and require extra discipline when changed.

- **Auth / Roles / RLS**
  - Why cross-cutting: roles and permissions shape what users can read/write and which UI surfaces unlock.
  - Why to be careful: small changes can cause lockouts, privilege escalation, or data exposure; many server paths use elevated access patterns.
- **AI Context Engine**
  - Why cross-cutting: it determines what context is provided to Prometheus, course AI, collection assistants, and tools.
  - Why to be careful: changes can silently alter AI behavior platform-wide and increase cost/latency; requires invariants and targeted workflow testing.
- **Supabase Schema + Migrations (Local vs Prod Sync)**
  - Why cross-cutting: nearly every feature depends on stable table contracts and predictable migrations.
  - Why to be careful: schema drift between local and production is a common failure mode; any schema change needs a clear sync plan.
- **Video/Progress Tracking (Mux + progress writes)**
  - Why cross-cutting: progress drives dashboards, credits, certificates, and learner experience.
  - Why to be careful: subtle timing/state changes can break progress, watch-time, and eligibility calculations.
- **Payments (Stripe)**
  - Why cross-cutting: membership affects access across the platform (individual and org seat models).
  - Why to be careful: errors directly impact revenue and access; changes must be verified end-to-end.
- **App Shell State + Global Panels**
  - Why cross-cutting: global dropdown panels and navigation patterns are shared across features.
  - Why to be careful: z-index/state changes can make important UI (help, settings, prompts) appear “broken” without obvious errors.

## How to Use This Index (Agent Instructions)

1) **Identify the primary feature** you’re changing (the row that best matches the user-facing behavior you intend to modify).  
2) Read the **Coupling Notes** for that row to list likely **secondary/impacted features**.  
3) For each impacted feature:
   - If the feature doc exists, consult it before planning changes.
   - If it’s missing, create a stub doc using the schema in `docs/engine/DOCUMENTATION_ENGINE.md` and mark this index row as updated.  
4) If your change touches anything in **Cross‑Cutting / Foundation Features**, consult the relevant foundation/workflow docs (or create stubs) and expand your test plan accordingly.
