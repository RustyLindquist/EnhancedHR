# User_Dashboard

## Primary Objective

The central hub for the user. It must provide immediate access to their content, visual progress tracking, and the Global AI Assistant.

## 1. Interface Structure

**[CONSTRAINT: FLEXIBLE UI]**

- **Layout:** Modern, clean, "Card-based" or "Grid" layout.
- **Goal:** Prioritize "Continue Learning" (getting them back into content) and "AI Help" (answering immediate questions).

## 2. The "Trial Meter" (Conditional)

**[CONSTRAINT: STRICT]**

- **Visibility:** ONLY visible if `membership_status = 'trial'`.
- **Display:** A prominent visual indicator (Progress Bar or Ring) showing `trial_minutes_used` / 60.
- **Call to Action:** If approaching the limit (e.g., > 50 mins), show an "Upgrade to Unlimited" button.

## 3. Course Catalog & Search

- **Catalog View:**
    - Display all available courses.
    - **Visual Badges:**
        - "Required" (Org specific).
        - "Recommended" (Org specific).
        - "SHRM PDCs" / "HRCI Credits" (If eligible).
        - "Completed".
- **Search Function:**
    - **Scope:** Plain-text search across Course Title, Description, Author, and Category.
    - **Filters:** Author, Category, Credit Type (SHRM/HRCI), Status (In-Progress/Completed).

## 4. Learning Paths

- **Visuals:** Distinct section for "Learning Paths" (Sequences of courses).
- **Org Specific:** If the user belongs to an Organization, show "Organization Learning Paths" first.

## 5. User Metrics (Platform Time)

**[CONSTRAINT: STRICT DATA]**
Display the following stats, pulled from the `user_course_progress` and `profiles` tables:

1. **Total Time in Platform:** Aggregate of all active session time.
2. **Course Watch Time:** Sum of all video playback time (Mux logs).
3. **AI Interaction Time:** Total time spent in active chat sessions.

## 6. Recertification Hub

- **Display:** List of **Completed Courses ONLY** that have valid credits.
- **Metadata:** Course Title, Completion Date, Credit Type (SHRM/HRCI), Credit Value.
- **Action:** Clicking a course opens the "Certificate Download" modal (generating the PDF on the fly).

## 7. The Platform Assistant (Global AI)

**[CONSTRAINT: STRICT LOGIC]**

- **Agent Type:** **Platform Assistant** (Not Course Assistant).
- **Context:** Global Scope (can access general knowledge + RAG from *all* courses).
- **UI:** A "Quick Chat" input field prominent on the dashboard.
    - *Placeholder:* "Ask anything... 'How do I handle a difficult conversation?'"
- **Behavior:** When the user submits a prompt, redirect them to the full **Platform Assistant Chat Interface** with the prompt pre-filled.