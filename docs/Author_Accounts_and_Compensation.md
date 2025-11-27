# Author_Accounts_and_Compensation

## Primary Objective

To attract high-quality experts, streamline their onboarding, and provide them with a transparent view of their impact and earnings.

## 1. Author Acquisition & Onboarding

**[CONSTRAINT: FLEXIBLE UI]**

### A. The "For Authors" Landing Page

- **Content:** Value proposition ("Reach thousands of HR leaders," "Earn passive income," "Shape the future of Human Relevance").
- **Call to Action:** "Apply to Teach."

### B. Application Workflow (The "Pending" State)

1. **Signup:** User creates a standard account.
2. **Application Form:**
    - **Profile:** Name, Title, Bio, Headshot.
    - **Credentials:** Resume/LinkedIn URL.
    - **Proposal:** Course Title, Target Audience, Brief Outline (Text area), Sample File Upload (Supabase Storage).
3. **Status:** Account role set to `pending_author`.
    - *Access:* Can ONLY see the "Application Status" page.
4. **Review:** Platform Admin approves/rejects.
    - *If Approved:* Role updates to `author`. Trigger "Welcome Author" email.
    - *If Rejected:* Trigger "Thank you for applying" email.

## 2. The Author Dashboard

**[CONSTRAINT: FLEXIBLE UI]**
Once approved, the Author gets a dedicated dashboard view.

### Key Widgets

1. **Earnings Overview:**
    - "Current Month Estimated Payout" (Calculated from watch time).
    - "Total Lifetime Earnings."
2. **Impact Metrics (Motivation):**
    - "Total Students Taught."
    - "Hours Watched."
    - "Certifications Enabled" (How many users earned SHRM/HRCI credits using *their* course).
3. **Course Management:**
    - List of their courses with status (Draft, Published, Under Review).
    - "Create New Course" button.

## 3. Compensation Logic & Rules

**[CONSTRAINT: STRICT LOGIC]**

### A. Membership Status

- **Rule:** All Approved Authors receive a complimentary **Individual Membership** (100% discount) to the platform to explore other content and understand the ecosystem.

### B. Payout Calculations

- **Source of Truth (Video):** Mux Viewing Sessions.
    - *Metric:* Total Seconds Watched by *paid* users.
- **Source of Truth (AI):** Vector Retrieval Logs.
    - *Metric:* Attribution Count (How many times their content powered an answer).

### C. Fraud Prevention (The "Self-Watch" Rule)

**[CONSTRAINT: STRICT]**
To prevent gaming the system, the payout calculation query must explicitly **EXCLUDE** usage where:

1. `viewer_id` == `author_id` (Author watching their own course).
2. `viewer_role` == `author` (Authors watching other authors).
    - *Rationale:* We encourage cross-pollination/learning among authors, but we do not pay out for it.

## 4. Payout Mechanism (Manual MVP)

- **User View:**
    - Authors do **not** see a "Withdraw" button.
    - They see a "Payout History" table: Date, Amount, Status (Processing/Paid).
- **Admin View:**
    - The system generates the "End of Month Report" (defined in *Commercialization* PRD).
    - Admin cuts checks/ACH outside the platform.
    - Admin manually marks the month as "Paid" in the database to update the Author's UI.