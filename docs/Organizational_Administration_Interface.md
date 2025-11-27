# Organizational_Administration_Interface

## Primary Objective

To provide HR Leaders with a command center that proves the ROI of the platform, simplifies seat management (Billing), and allows them to curate the learning experience for their workforce.

## 1. The ROI Dashboard (Landing View)

**[CONSTRAINT: FLEXIBLE UI]**
When the Admin logs in, they must see *value* immediately, not just a list of names.

### Key Widgets (ROI Focus)

1. **The "Upskilling Pulse":**
    - **Metric:** Total Courses Completed & Total Learning Hours (This Month).
    - **Visual:** Line chart showing engagement trends.
2. **Certification Health:**
    - **Metric:** Total SHRM PDCs & HRCI Credits earned by the org.
    - **Why:** This is a hard currency for HR. It proves the platform is replacing expensive external seminars.
3. **AI Adoption Rate:**
    - **Metric:** Number of AI Tutor interactions / Active User.
    - **Message:** "Your team is leaning into the future of work."
4. **Seat Utilization:**
    - **Metric:** Active Seats vs. Total Invited. (e.g., "45 Active / 50 Invited").

## 2. User Management (Seat & Billing Control)

**[CONSTRAINT: STRICT LOGIC]**
This interface controls the Stripe Subscription.

### A. The User Directory

- **Columns:** Name, Email, Role (User/Admin), Last Login, Status (Active/Pending), Courses Completed.
- **Actions:**
    - **"Invite Users":** Generates the generic **Join URL** or sends direct email invites.
    - **"Remove User":**
        - **UI:** A distinct "Remove from Organization" button.
        - **Logic:** This **MUST** trigger the Stripe API to decrement the seat count (-1) immediately.
        - **Feedback:** Show a toast notification: *"User removed. Your billing will be updated."*

### B. The Join URL settings

- **Display:** Show the current active Join URL (`.../join/acme-corp/8x9d0s`).
- **Action:** "Reset Link" button (Generates a new random hash at the end of the URL) to invalidate the old link if it leaks.

## 3. Learning Architecture (Curating Content)

**[CONSTRAINT: FLEXIBLE UI / STRICT DATA]**
Admins can steer their employees toward specific content.

### A. Course Designation

- **Interface:** Browse the Course Catalog with "Admin Mode" toggles.
- **Actions:**
    - **Mark as Required:** Appears in the user's "Required Training" lane. Tracked for compliance.
    - **Mark as Recommended:** Appears in "Recommended for You." Soft nudge.
- **Data:** Store in `org_course_assignments` table (`org_id`, `course_id`, `assignment_type`).

### B. Custom Learning Paths (Sequences)

- **Feature:** Create a named bundle of courses (e.g., "New Manager Onboarding").
- **Builder:** Drag-and-drop courses into a sequence (1, 2, 3).
- **Visibility:** These Paths appear at the top of the "Learning Paths" section for all employees in that Org.

## 4. Analytics & Reporting (Deep Dive)

**[CONSTRAINT: STRICT DATA]**
Allow Admins to export data for their own internal reporting.

### A. User Detail View

Clicking a user reveals:

- **Learning History:** Timeline of courses started/finished.
- **Certification Ledger:** List of all PDCs earned (downloadable as PDF).
- **Engagement:** Last login date.

### B. Data Export (CSV)

- **Scope:** Full dump of user activity.
- **Fields:** Name, Email, Courses Completed, Total Hours, PDCs Earned, Last Active.