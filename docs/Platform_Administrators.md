# Platform_Administrators

## Primary Objective

Provide Super Admins with total control over the platform's content, users, financial reporting, and AI behavior.

## 1. The Admin Dashboard (Command Center)

**[CONSTRAINT: FLEXIBLE UI]**

- **Key Metrics (The Pulse):**
    - **Revenue:** MMR (Monthly Recurring Revenue) - pulled via Stripe API.
    - **Growth:** Total Active Users (Individual vs. Org Seats).
    - **AI Cost:** Estimated API spend for the current month (Token usage * Cost).
    - **Pending Actions:** Number of Author Proposals waiting for review.

## 2. AI Command Center (The "Brain" Settings)

**[CONSTRAINT: STRICT LOGIC]**
This is where we control the personality and safety of the AI Agents.

### A. System Prompt Editor

- **Interface:** A list of active Agents (Course Assistant, Course Tutor, Platform Assistant).
- **Action:** "Edit System Instruction".
- **UI:** A large text area to modify the `system_prompt` stored in the database.
- **Impact:** Changes take effect immediately for all new conversations.

### B. The "Kill Switch" (Safety)

- **Feature:** A Master Toggle: **"Enable AI Features"**.
- **Behavior:** If toggled **OFF**, all AI chat interfaces are hidden from the UI. (Use case: API outage, cost spike, or safety incident).

### C. Usage Logs & Audits

- **View:** A searchable table of `ai_interaction_logs`.
- **Columns:** Timestamp, User, Agent Type, Token Count, Cost.
- **Filter:** "Show me all interactions from User X" (for investigating misuse).

## 3. Author Management & Financials

**[CONSTRAINT: STRICT]**

### A. Proposal Review

- **Queue:** List of users with `status = pending_author`.
- **Action:** Review submitted Bio/Resume.
- **Decision:** "Approve" (Promotes role to `author`) or "Reject" (Sends email).

### B. The Monthly Payout Report (Manual Check Run)

- **Purpose:** specific view to calculate how much to pay authors.
- **Filters:** Select Month (e.g., "October 2025").
- **Data Table:**
    1. **Author Name**
    2. **Total Watch Minutes:** (Sum from Mux Logs).
    3. **AI Attribution Count:** (Sum from Vector Retrieval Logs).
    4. **Total Payout:** (Calculated based on current rates).
- **Export:** "Download CSV" (so you can upload it to your bank or payroll system).

## 4. User Support Tools

**[CONSTRAINT: STRICT]**

### A. User Management

- **Search:** Find user by Name, Email, or Company.
- **Actions:** Reset Password, Ban User, Refund Transaction (via Stripe link).

### B. "Login As" (Impersonation)

- **Feature:** A **"Log in as this User"** button on the User Detail page.
- **Tech:** Generates a temporary short-lived session token for that user.
- **Use Case:** Debugging user-reported issues ("I can't see my certificate!").
- **Visual Indicator:** When impersonating, show a bright red banner: *"You are viewing as [User Name]. Click here to exit."*

## 5. Course Administration

- **Link:** Shortcuts to the **Course Creation** interface (defined in `Course Creation & Management.md`).