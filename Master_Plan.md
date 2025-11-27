# Master_Plan.md

# MASTER IMPLEMENTATION ROADMAP

**Agent Instruction:**
This document defines the **Sequence of Execution** for building [EnhancedHR.ai](http://enhancedhr.ai/).

- **Logic Source:** Do **not** guess business logic. Refer to the specific PRD in the `/docs/` folder linked in each phase.
- **Tech Stack:** Refer to `GEMINI.md` for strict technology constraints (Next.js 16, Supabase, Mux, Stripe).

---

## Phase 1: Foundation (Auth & Identity)

**Goal:** Establish the secure perimeter, user roles, and organizational structure.

**Reference Documentation:**

- `docs/User Accounts and Authentication.md`
- `docs/Platform Administrators.md`

**Key Tasks:**

1. **Project Init:** Initialize Next.js 16 (App Router) + Tailwind CSS + Supabase SSR Client.
2. **Database Schema (Identity):**
    - Create `profiles` table (extends `auth.users`).
    - Create `organizations` table.
    - Create `org_members` table (links Profile <-> Org).
3. **Auth Flows:**
    - Implement Sign Up / Login / Forgot Password.
    - Implement the **"Join via URL"** flow (Org Invites).
4. **Trial Meter:** Implement the logic to track `trial_minutes_used` in the `profiles` table.

---

## Phase 2: The Content Engine (Courses & Video)

**Goal:** Enable Admins to create courses and Users to watch them.

**Reference Documentation:**

- `docs/Course Creation & Management.md`
- `docs/Course Experience.md`
- `docs/User Dashboard.md`

**Key Tasks:**

1. **Database Schema (Content):**
    - Create `courses`, `modules`, `clips` tables.
    - Create `categories` and `authors` tables.
2. **Mux Integration:**
    - Implement **Direct Upload** component for Admins.
    - Implement `<MuxPlayer />` for Users.
    - **Webhook Handler:** Create a Supabase Edge Function to listen for `video.viewing.session` and update `user_course_progress` (and `trial_minutes_used`).
3. **UI Implementation:**
    - Build the Course Catalog (Card Grid with Filters).
    - Build the Course Player Interface (Sidebar + Player).

---

## Phase 3: The Intelligence Layer (AI Agents)

**Goal:** Implement the "Brain" of the platform.

**Reference Documentation:**

- `docs/Course AI.md`
- `docs/Assessments and Activities.md`

**Key Tasks:**

1. **Vector Infrastructure:**
    - Enable `pgvector` extension in Supabase.
    - Create `course_knowledge_base` table (stores embeddings).
2. **Embedding Pipeline:**
    - Create Edge Function: On `transcript` save -> Generate Embedding -> Store in DB.
3. **The Agents:**
    - Build the **Chat Interface** (Streaming UI).
    - Implement **RAG Logic** (Retrieve chunks -> Generate Answer).
    - **Constraint:** Ensure `Course Assistant` only queries vectors matching current `course_id`.
4. **System Prompts:**
    - Create `ai_system_prompts` table.
    - Build Super Admin UI to edit prompts.

---

## Phase 4: Learning & Certification Logic

**Goal:** The "Hard Value" (Credits and Certificates).

**Reference Documentation:**

- `docs/Certification Support.md`
- `docs/Certificate and Badge Generation.md`

**Key Tasks:**

1. **Calculation Engine:**
    - Implement the logic to calculate SHRM (0.25 PDC rounding) and HRCI (45min min) credits based on Mux logs.
2. **The Ledger:**
    - Create `user_credits_ledger` table.
3. **Certificate Generation:**
    - Implement `@react-pdf/renderer` to generate PDFs on the server.
    - Build the "Download Certificate" modal.

---

## Phase 5: Commercialization & Admin

**Goal:** Monetization and Reporting.

**Reference Documentation:**

- `docs/Commercialization.md`
- `docs/Organizational Administrator Interface.md`
- `docs/Authors Accounts & Compensation.md`

**Key Tasks:**

1. **Stripe Integration:**
    - Setup Stripe Sync (Webhooks -> Database).
    - Implement **Per-Seat Billing** logic (Increment/Decrement seats on Org Invite/Remove).
2. **Admin Dashboards:**
    - Build Org Admin "ROI Dashboard" (Seat management, Usage graphs).
    - Build Super Admin "Payout Report" (Author Watch Time + AI Attribution).

---

## Phase 6: Launch Polish

**Goal:** Final UX touches defined in the "Brand Guidelines."

**Key Tasks:**

1. **Transactional Email:** Setup Resend templates.
2. **Trial Lockout:** Final QA on the 60-minute trial enforcement.
3. **Mobile Responsiveness:** Ensure Player and Chat work on mobile.