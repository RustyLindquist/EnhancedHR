# Course_Experience

## Primary Objective

This document governs the end-to-end experience of a specific course: from the "Course Homepage" (Syllabus/Landing) to the "Active Learning Environment" (Video Player).

## 1. The Course Homepage (Landing View)

**[CONSTRAINT: FLEXIBLE UI / STRICT LOGIC]**
When a user clicks on a course card, they land here.

### A. Core Metadata

- **Visuals:** Banner Image, Featured Image.
- **Info:** Course Title, Long Description, Category.
- **Author:** Name, Title, Bio (Clickable link to Author Profile).

### B. Action Buttons (Resume Logic)

- **State 1 (Not Started):** Display **"Start Course"**. Links to Module 1, Clip 1.
- **State 2 (In Progress):** Display **"Continue Learning"**.
    - **Logic:** Must deep-link to the *exact* Module and Clip where the user left off (derived from `user_course_progress` table).
- **State 3 (Completed):** Display **"Review Course"** or "View Certificate".

### C. Recertification Display Logic (CRITICAL)

**[CONSTRAINT: STRICT UI LOGIC]**
We must distinguish between "Can I earn credits?" and "Where are my credits?"

1. **"Recertification Availability" (Always Visible):**
    - **Purpose:** Inform the user *before* they start if this counts for credit.
    - **UI:** Badge or text: "SHRM / HRCI Credit Eligible" (or "Not Eligible").
2. **"Recertification Credits" (Conditional):**
    - **Case A (Not Eligible):** HIDDEN.
    - **Case B (Eligible but Incomplete):** Show message: *"Complete this course to unlock [X] credits."* (Grayed out/Locked).
    - **Case C (Eligible & Complete):** Show **"Claim Credits"** button. Opens the Certification Download modal.

### D. Course Syllabus (Module List)

- Visual list of all Modules and Clips.
- **Indicators:** "Completed" (Checkmark), "In Progress" (Play icon), "Locked" (if applicable, though usually open navigation).

## 2. The Active Learning Environment (The Player)

**[CONSTRAINT: FLEXIBLE UI]**
The interface where the user watches content and consumes materials.

### A. Navigation & Layout

- **Sidebar/Drawer:** Allows navigation between Modules/Clips without leaving the player.
- **Downloads:** Dedicated area for "Course Materials" (PDFs, Docs).

### B. Video Player (Mux Integration)

**[CONSTRAINT: STRICT]**

- **Player:** Use `<MuxPlayer />` component.
- **Logging (The "Money" Data):**
    - **Event:** `video.play` -> Mark Course/Module as "In Progress".
    - **Event:** `video.viewing.session` (Webhook) -> Update `profiles.trial_minutes_used` and `author_payout_ledger`.
    - **Event:** `video.ended` -> Mark Clip as "Complete".
- **Completion Trigger:** When all Clips in all Modules are "Complete" -> Mark Course as "Complete" -> **Unlock Recertification Credits**.

### C. Ratings

- Allow user to rate the Course (1-5 Stars) upon completion.

## 3. The Course AI Companion

**[CONSTRAINT: FLEXIBLE UI]**
A persistent interface (Sidebar or Slide-over) available in both the Homepage and Player views.

### A. The Course Assistant

- **Function:** Reactive Q&A ("What did he say about X?").
- **Context:** Access to current Course Transcript (RAG).

### B. The Course Tutor

- **Function:** Proactive Learning.
- **UI:** "Start Tutoring Session" button.
- **Behavior:**
    1. Check User Profile (Role/Industry).
    2. Initiate Socratic dialogue based on the current Module.
    3. Save insights to User Profile.