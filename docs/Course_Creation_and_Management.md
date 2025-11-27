# Course_Creation_and_Management

## Primary Objective

Allow Platform Admins to create, organize, and publish courses. This interface serves as the data entry point for both the "Learning Engine" (Videos) and the "Intelligence Engine" (Vector/RAG).

## 1. Course Meta-Data

**[CONSTRAINT: STRICT SCHEMA]**
The Admin must be able to define:

- **Basic Info:** Course Name, Long Description (Rich Text), Category (Multi-select).
- **Images:**
    - **Featured Image:** (Catalog Card).
    - **Banner Image:** (Course Landing Page).
- **Author Attribution:**
    - **UI:** Dropdown list of users with `role = author`.
    - **Logic:** This selection drives the "Author Compensation" and "Watch Time" reports.

## 2. The Content Hierarchy (Course Structure)

**[CONSTRAINT: FLEXIBLE UI / STRICT DATA]**

- **Structure:** `Course` -> `Modules` (Containers) -> `Clips` (Content Units).
- **Modules:**
    - Title, Short Description.
    - *Ordering:* Drag-and-drop reordering.
- **Clips:**
    - Title, Description.
    - *Ordering:* Drag-and-drop reordering within a Module.

## 3. Video Content (Mux Integration)

**[CONSTRAINT: STRICT]**
We utilize **Mux Direct Uploads** to handle large video files reliably.

1. **The Trigger:** Admin clicks "Upload Video" on a Clip.
2. **The Process:**
    - System requests a "Signed Upload URL" from Mux API.
    - Browser uploads file directly to Mux cloud (bypassing our Vercel server).
3. **The Result:** Mux returns an `asset_id` and `playback_id`, which we save to the `clips` table.
4. **Processing:** Display a "Processing..." status until Mux confirms the video is ready.

## 4. Transcripts & Vector Embedding (The "AI Brain")

**[CONSTRAINT: STRICT LOGIC]**
The Transcript is the fuel for the AI Agents.

- **Input:** Admin uploads/pastes the VTT or Text transcript for the clip.
- **The "Embed" Trigger:** Upon saving a transcript, a **Supabase Edge Function** must fire:
    1. Clean and chunk the text.
    2. Generate Embeddings (using `text-embedding-3-small` or similar).
    3. Store vectors in the `course_knowledge_base` table.
    - *Why:* This ensures the Course Assistant is updated the moment content is published.

## 5. The "AI Accelerator" (Auto-Generate Assets)

**[CONSTRAINT: FLEXIBLE UI]**
To speed up authoring, provide AI-assisted generation tools.

- **Feature:** "✨ Auto-Generate Quiz"
    - **Action:** Send current transcript to Gemini.
    - **Output:** Suggest 3-5 Learning Objectives and 5 Quiz Questions.
    - **UI:** Admin reviews suggestions and clicks "Add to Course."

## 6. Course Resources (Downloads)

- **Storage:** Supabase Storage bucket (`course-assets`).
- **Function:** Allow uploading PDF/Docx files attached to the Course or specific Modules.

## 7. Recertification Configuration

**[CONSTRAINT: STRICT]**

- **SHRM:** Toggle "SHRM Eligible". If Yes -> Input `Activity ID` and `PDC Value`.
- **HRCI:** Toggle "HRCI Eligible". If Yes -> Input `Program ID` and `Credit Value` (Hours).

## 8. Publishing Workflow

- **Status:** `Draft` (Default) vs. `Published`.
- **Draft:** Only visible to Admins and the specific Author.
- **Published:** Visible in Catalog to all users.
- **Validation:** Prevent publishing if:
    - Course has 0 Modules.
    - Any Clip is missing a Video Asset ID.
    - Recertification fields are incomplete (if toggled on).