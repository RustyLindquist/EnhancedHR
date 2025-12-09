# Course_Creation

## 1. Overview

This feature allows Platform Administrators to create and update courses by simply providing a Google Drive Directory link. The system will programmatically scan the directory, interpret the folder hierarchy as the course structure (Modules/Lessons), upload videos directly to Mux (via pull-based input), vectorize lesson scripts for RAG, and store course assets.

**Core Philosophy:** "Headless CMS" via Google Drive. We leverage Drive for file management and organization, reducing UI complexity on the platform.

---

## 2. User Workflow

### 2.1 The Expert (Google Drive)

The Expert (what we call a Course Instructor) organizes their content in a shared Google Drive folder following this convention:

- **Root Folder:** `[Course Title]`
    - `Featured_Image.jpg` (Course Cover)
    - `Description.gdoc` (Course Description text)
    - `Course Resources/` (For supplemental resources)
    - `1 - [Module Name]/` (A named and numbered folder for each module)
        - `01 - [Lesson Name].mp4` (Video)
        - `01 - [Lesson Name].gdoc` (Script)
    - `2 - [Module Name]/`
        - ...

### 2.2 The Administrator (Platform)

1. **Trigger:** Platform Administrator verifies the contents for a course are ready and navigates to `Admin Console > Courses > Add Course`.
2. **Input:** Admin pastes the **Google Drive Folder URL** (or ID) into a text field.
3. **Validation (Dry Run):** The system scans the folder and presents a "Ingestion Preview" summary:
    - *Detected: Course "Leadership 101"*
    - *Structure: 4 Modules, 12 Lessons.*
    - *Assets: 12 Videos, 11 Scripts (⚠️ Warning: Lesson 4 missing script).*
4. **Execution:** Admin clicks **"Confirm & Sync"**.
5. **Status:** System processes files in background; Admin receives notification upon completion.

---

## 3. Technical Specifications

### 3.1 Google Drive Integration

- **Auth:** Use a Google Service Account. The Admin must share the Course Folder with the Service Account email address before ingestion.
- **Traversal:** Recursive traversal of the target folder.
- **File Identification Strategy (Regex):**
    - **Ordering:** Extract leading integers from folder/filenames to determine `sort_order` (e.g., `01 - Intro` -> `order: 1`).
    - **Cleaning:** Strip leading numbers and special characters to generate the display `title`.
    - **Pairing:** Match Videos (`.mp4`, `.mov`) with Scripts (`.gdoc`, `.docx`, `.txt`) based on the matching leading integer within the same Module folder.

### 3.2 Mux Integration (Video)

- **Method:** Pull-based Input (Server-to-Server).
- **Process:**
    1. Generate a temporary public download URL or Signed URL from the Google Drive file.
    2. `POST` to Mux `/assets` with `input: [Drive_URL]`.
    3. **Passthrough Data:** Include internal `course_id`, `module_id`, and `lesson_id` in the Mux metadata.
    4. **Webhook:** Listen for `video.asset.ready` to capture the `playback_id` and update the database.

### 3.3 RAG Integration (Scripts)

- **Process:**
    1. Download/Export the script file (convert `.gdoc` to plain text).
    2. **Chunking:** Split text into semantically relevant chunks.
    3. **Embedding:** Generate embeddings (using current project embedding model).
    4. **Storage:** Upsert into Vector Database with metadata: `{ courseId: X, lessonId: Y, type: "script" }`.

### 3.4 Asset Storage (Images/Docs)

- **Featured Image:** Download from Drive -> Optimize -> Upload to Cloud Storage -> Save URL to Course record.
- **Course Resources:** Mirror the `Course Resources` folder contents to Cloud Storage -> Create `Resource` records linked to the Course.

---

## 4. Data Model Implications

### Course Schema Updates

- `drive_folder_id` (String, Unique): Stores the Google Drive Folder ID to enable future re-syncs.
- `sync_status` (Enum): `idle`, `scanning`, `syncing`, `error`.
- `last_synced_at` (Timestamp).

### Lesson Schema Updates

- `drive_file_id` (String): To detect if the video file has been swapped in Drive.
- `script_content` (Text): Raw text storage (optional, for quick reference).
- `mux_asset_id` (String).
- `mux_playback_id` (String).

---

## 5. Logic & Rules (The "Brain")

### 5.1 The "Dry Run" Validator

Before writing to the DB, the system must return a JSON object for the frontend to render:

JSON

`{
  "courseTitle": "Inferred from Folder Name",
  "moduleCount": 3,
  "lessonCount": 15,
  "issues": [
    { "type": "warning", "msg": "Module 2 is empty" },
    { "type": "error", "msg": "Lesson 03 in Module 1 has a script but no video" }
  ]
}`

### 5.2 Idempotency (Sync vs. Create)

- **Logic:** When "Sync" is triggered, check if `drive_folder_id` already exists in DB.
    - **If New:** Create all records.
    - **If Existing:** Compare `drive_file_id` for every asset.
        - If Drive ID matches DB record -> Skip (No change).
        - If Drive ID differs -> Re-upload to Mux/S3, Re-vectorize script, Update DB.
        - If DB record exists but Drive file is gone -> Mark Lesson as "Archived" (Soft Delete).

### 5.3 Naming Convention Parser

- **Regex Pattern:** `^(\d+)[._-]\s*(.*)$`
    - *Input:* `01 - The History of HR.mp4`
    - *Capture Group 1 (Order):* `01`
    - *Capture Group 2 (Title):* `The History of HR.mp4` (Strip extension for title).
- **Fallback:** If no number is detected, append to end of list and use filename as title.

---

## 6. Implementation Steps

1. **Backend Service:** Create `GoogleDriveService` class with methods: `authenticate`, `getFolderStructure`, `getFileStream`.
2. **Ingestion Engine:** Create `CourseIngestor` class that accepts a folder structure and orchestrates the database writes.
3. **Mux Bridge:** Create `MuxUploader` to handle the async `POST` and Webhook listener.
4. **API Endpoint:** `POST /api/admin/courses/sync` accepting `{ driveFolderUrl }`.
5. **Frontend:** Build the "Add Course" modal with the Dry Run visualization state.

---

## 7. Edge Case Handling

- **Rate Limits:** Implement exponential backoff for Google Drive API calls if scanning large courses.
- **Large Video Files:** Ensure the server does not attempt to download the video into memory. Pass the URL directly to Mux.
- **Unsupported Files:** System should ignore system files (e.g., `.DS_Store`) and non-allowlisted extensions.