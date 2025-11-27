# Certificate_and_Badge Generation

## Primary Objective

To automatically generate, store, and verify professional credentials (PDFs and Open Badges) upon course completion. This is the high-value "deliverable" for the user.

## 1. Technical Architecture

**[CONSTRAINT: STRICT LOGIC]**

- **Generation Engine:** Use **`@react-pdf/renderer`** (Node.js).
    - *Benefit:* Allows building PDF layouts using React components/Tailwind styles. No external Python servers required.
- **Storage:** Save generated PDFs to Supabase Storage bucket: `issued-certificates`.
- **Verification:** Public-facing endpoint.

## 2. The Generation Trigger

**[CONSTRAINT: STRICT]**

1. **Event:** User completes the final clip of a course.
2. **Validation:** System checks `Certification Support` logic (Did they meet the time threshold?).
3. **Action:**
    - Calculate Credits (SHRM/HRCI).
    - Generate unique `certificate_id` (UUID).
    - Render PDF on the server.
    - Upload to Supabase Storage.
    - Write record to `user_certificates` table.

## 3. Certificate Design & Metadata (The PDF)

**[CONSTRAINT: FLEXIBLE UI / STRICT DATA]**

- **Visual:** Professional, branded layout (Logo, Signatures, Border).
- **Required Data Fields:**
    - Learner Name.
    - Course Title.
    - Completion Date (UTC -> User Local format).
    - **Credit Details:** "1.0 SHRM PDC" / "0.75 HRCI Business Credit".
    - **Activity IDs:** The specific SHRM/HRCI Program IDs (pulled from Course Metadata).
    - **Verification QR Code:** Links to `enhancedhr.ai/verify/[certificate_id]`.

## 4. Digital Badges (Open Badges Standard)

**[CONSTRAINT: STRICT SCHEMA]**
We support the **Open Badges 2.0** specification to allow users to add credentials to LinkedIn/Backpack.

### A. The Badge Class (Course Definition)

- Define metadata for the *Course* itself (Name, Description, Criteria).

### B. The Assertion (User Award)

- **Endpoint:** `/api/badges/[certificate_id].json`
- **Data Structure (JSON-LD):**
    - `recipient`: User Email (hashed).
    - `badge`: Link to Badge Class.
    - `verify`: Link to Verification URL.
    - `issuedOn`: ISO Date.

## 5. Verification & Sharing

**[CONSTRAINT: STRICT]**

### A. Public Verification Page

- **URL:** `enhancedhr.ai/verify/[certificate_id]`
- **Access:** Public (No login required).
- **Content:**
    - "This certifies that [Name] completed [Course] on [Date]."
    - "Valid for: [X] Credits."
    - **Anti-Fraud:** Check against the database status. If revoked/banned, show "Invalid Certificate."

### B. User Actions

- **Dashboard:** "Download PDF" button.
- **Social:** "Add to LinkedIn" button (uses LinkedIn Certification URL scheme).