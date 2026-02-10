# Feature Index

This file is the **primary discovery and routing index** for the EnhancedHR.ai application. Agents and developers should consult it **before planning or coding** to identify the primary feature they’re touching, the secondary features likely to be impacted, and the docs that should be consulted/updated. This is **not** a substitute for feature docs—it is an index that keeps feature boundaries and risk visible. Risk Level reflects blast radius and regression cost, not implementation complexity. Keep it updated whenever a new doc is added under `docs/features/`.

## Feature Index

| Feature Name | Feature ID / Slug | Risk | Primary Agent | Key Skills | Coupling Notes | Doc Status |
| --- | --- | --- | --- | --- | --- | --- |
| App Shell & Navigation | app-shell | High | Frontend | doc-discovery, style-validation | Touches nearly every feature; small UI/state changes can break multiple flows | Exists |
| Browser Back Navigation | browser-back-navigation | Medium | Frontend | doc-discovery | Coupled to app-shell, dashboard, course-player; NavigationContext must wrap all app content | Exists |
| User Accounts & Authentication | auth-accounts | High | Backend | doc-discovery, plan-lint | Coupled to roles/RLS, org membership, and admin gating | Missing |
| Dashboard (Learning Hub) | dashboard | Medium | Frontend + Backend | doc-discovery, test-from-docs | Coupled to progress/credits, courses, conversations, and AI quick starts | Missing |
| Academy (Course Catalog) | academy | Medium | Frontend | doc-discovery, component-inventory | Coupled to course detail/player and enrollment/progress | Exists |
| Courses & Lesson Player (Progress) | course-player-and-progress | High | Backend + Frontend | doc-discovery, plan-lint, test-from-docs | Coupled to Mux tracking, credits/certificates, notes, and course AI | Exists |
| Course AI (Assistant & Tutor) | course-ai | High | Backend | doc-discovery, plan-lint | Coupled to AI context engine, personal context, and course content retrieval | Exists |
| Prometheus Chat & Conversations | prometheus-chat | High | Backend + Frontend | doc-discovery, plan-lint | Coupled to AI context engine, personal context/insights, tools, and collections | Exists |
| Collections & Context Organization | collections-and-context | High | Backend | doc-discovery, plan-lint, drift-check | Coupled to almost all content types; changes can break saving/organization broadly | Exists |
| Personal Context & AI Insights | personal-context-insights | Medium | Backend | doc-discovery | Coupled to AI chat and course AI; depends on stable data/permissions | Exists |
| Prompt Library | prompt-library | Medium | Frontend + Backend | doc-discovery | Coupled to Prometheus chat, tools, and onboarding UX | Exists |
| Notes | notes | Medium | Frontend + Backend | doc-discovery | Coupled to course player, collections organization, and export/share behaviors | Exists |
| Tools (AI Workflows) | tools | High | Backend | doc-discovery, plan-lint | Coupled to conversations, AI context engine, collections, and permissions | Exists |
| Certifications, Credits & Certificates | certifications-and-credits | High | Backend | doc-discovery, plan-lint, test-from-docs | Coupled to progress tracking and ledger/certificate generation; business-critical | Exists |
| Experts (Instructor Profiles) | experts | Medium | Frontend + Backend | doc-discovery, plan-lint | Coupled to author-portal, course-builder (auto-approval + membership), membership-billing, org-courses, navigation, account settings | Exists |
| Expert Resources | expert-resources | Low | Backend + Frontend | doc-discovery | Coupled to author-portal, collections-and-context; platform admin only for writes; uses admin client pattern | Exists |
| Video AI Context | video-ai-context | Medium | Backend | doc-discovery, plan-lint | Coupled to ai-context-engine, collections-and-context, video-mux; transcript generation enables video RAG | Exists |
| Help System (Help Collection) | help-collection | Medium | Frontend + Backend | doc-discovery | Coupled to AI context engine and global panel behavior; important for onboarding | Exists |
| Organization Membership (Employee Experience) | organization-membership | High | Backend | doc-discovery, plan-lint | Coupled to auth/roles, billing/seats, and admin gating | Exists |
| My Organization Hub | my-organization-hub | Medium | Frontend | doc-discovery, style-validation | Coupled to app-shell (virtual collection), organization-membership (roles/visibility), org-courses (hasOrgCourses), collections-and-context (org-collections), dynamic-groups (users-groups); hub is read-only aggregator | Exists |
| Organization Courses | org-courses | High | Backend + Frontend | doc-discovery, plan-lint, test-from-docs | Coupled to AI context engine (RAG scope 8), org-membership, course player; org-scoped content | Exists |
| Dynamic Groups | dynamic-groups | Medium | Backend | doc-discovery | Coupled to organization-membership; depends on user_progress, conversations, user_streaks for queries | Exists |
| Author Portal (Course Creation) | author-portal | Medium | Frontend + Backend | doc-discovery | Coupled to courses schema, assets, and admin review/approval flows | Exists |
| Platform Admin Portal | admin-portal | High | Backend | doc-discovery, plan-lint | Privileged surfaces; tightly coupled to roles/RLS and core data schema | Exists |
| Course Promotion (Temporary) | course-promotion | Medium | Backend | doc-discovery | Coupled to courses schema, video-ai-context (transcript pipeline); temporary feature for content migration | Exists |
| Membership & Billing | membership-billing | High | Backend | doc-discovery, plan-lint, test-from-docs | Coupled to org membership, roles, and access across the app | Exists |
| Sales Console | sales-console | Medium | Backend + Frontend | doc-discovery, plan-lint | Coupled to admin-portal (sales toggle), auth-accounts (is_sales), leads (claiming), membership-billing (billing_disabled) | Exists |
| Marketing Pages & SEO | marketing-pages | Low | Frontend | doc-discovery, style-validation | Separate from app-shell; coupled to experts (data fetch), leads (demo form); nav links duplicated in layout.tsx and MobileNav.tsx | Exists |

## Meta / Development Infrastructure

These are not user-facing features. They define how the system is built and maintained.

| Feature Name | Feature ID / Slug | Risk | Primary Agent | Key Skills | Coupling Notes | Doc Status |
| --- | --- | --- | --- | --- | --- | --- |
| Agent Architecture | agent-architecture | Medium | Ops | doc-update, handoff | Meta-system; changes affect development workflow, not application behavior | Exists |

## Cross‑Cutting / Foundation Features

These are not "single screens." They affect many features and require extra discipline when changed.

- **Auth / Roles / RLS**
  - Why cross-cutting: roles and permissions shape what users can read/write and which UI surfaces unlock.
  - Why to be careful: small changes can cause lockouts, privilege escalation, or data exposure; many server paths use elevated access patterns.
- **AI Context Engine**
  - Why cross-cutting: it determines what context is provided to Prometheus, course AI, collection assistants, and tools.
  - Why to be careful: changes can silently alter AI behavior platform-wide and increase cost/latency; requires invariants and targeted workflow testing.
- **Supabase Schema + Migrations (Local vs Prod Sync)**
  - Why cross-cutting: nearly every feature depends on stable table contracts and predictable migrations.
  - Why to be careful: schema drift between local and production is a common failure mode; any schema change needs a clear sync plan.
- **Video/Progress Tracking (Mux + External URLs + progress writes)**
  - Why cross-cutting: progress drives dashboards, credits, certificates, and learner experience.
  - Why to be careful: subtle timing/state changes can break progress, watch-time, and eligibility calculations.
  - Why to be careful (external URLs): YouTube/Vimeo embed URLs and thumbnail extraction depend on platform-specific URL patterns; changes to extraction functions affect VIDEO cards across Expert Resources and Collections.
  - Foundation doc: `docs/foundation/video-mux.md`
- **Payments (Stripe)**
  - Why cross-cutting: membership affects access across the platform (individual and org seat models).
  - Why to be careful: errors directly impact revenue and access; changes must be verified end-to-end.
- **App Shell State + Global Panels**
  - Why cross-cutting: global dropdown panels and navigation patterns are shared across features.
  - Why to be careful: z-index/state changes can make important UI (help, settings, prompts) appear “broken” without obvious errors.

## How to Use This Index (Agent Instructions)

1) **Identify the primary feature** you're changing (the row that best matches the user-facing behavior you intend to modify).
2) Read the **Coupling Notes** for that row to list likely **secondary/impacted features**.
3) For each impacted feature:
   - If the feature doc exists, consult it before planning changes.
   - If it's missing, create a stub doc using the schema in `docs/engine/DOCUMENTATION_ENGINE.md` and mark this index row as updated.
4) If your change touches anything in **Cross‑Cutting / Foundation Features**, consult the relevant foundation/workflow docs (or create stubs) and expand your test plan accordingly.
5) **Check workflow impact**: Consult `docs/workflows/WORKFLOW_INDEX.md` to identify which user workflows may be affected by your change.

## Related Documentation

| Doc Type | Purpose | Location |
|----------|---------|----------|
| Feature docs | What features do | `docs/features/*.md` |
| Workflow docs | How users accomplish tasks | `docs/workflows/*.md` |
| Engine docs | Documentation system protocol | `docs/engine/*.md` |
| Agent docs | Agent architecture and coordination | `AGENTS.md`, `.claude/agents/*.md` |

Feature docs and workflow docs work together: features are building blocks, workflows are the user experience. Always check both when planning changes.
