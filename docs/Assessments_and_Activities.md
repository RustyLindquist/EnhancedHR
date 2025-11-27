# Assessments_and_Activities

## Primary Objective

Engage learners and verify knowledge retention through interactive quizzes.
**Strategic Pivot:** We are building a **Native Quiz Engine** (not H5P) to enable AI-generated assessments and tighter UI integration.

## 1. Assessment Structure & Location

**[CONSTRAINT: STRICT SCHEMA]**

- **Location:** An Assessment is a specific type of "Clip" within a Module.
    - *Example:* Module 1 -> Clip A (Video) -> Clip B (Quiz) -> Clip C (Video).
- **Data Format:** Store questions in a structured `jsonb` column in the `clips` table (or a dedicated `assessments` table).
    - *Structure:* Array of Objects `{ question_text, options[], correct_option_index, explanation }`.

## 2. Functional Requirements

**[CONSTRAINT: FLEXIBLE UI / STRICT LOGIC]**

### A. Question Types (MVP)

- **Multiple Choice:** Single correct answer.
- **True/False:** Binary choice.
- **Multiple Select:** (Post-MVP) Select all that apply.

### B. The Learner Experience

- **Feedback:**
    - Immediate Mode: User selects answer -> System reveals "Correct/Incorrect" + Explanation immediately.
    - Summary Mode: User finishes all questions -> System shows score.
- **Navigation:** User cannot "Complete" the Clip until the Quiz is submitted.
- **Retries:** Unlimited retries allowed for MVP (focus is learning, not gatekeeping).

## 3. Grading & History

**[CONSTRAINT: STRICT]**

- **Scoring:** Calculated as `(Correct Answers / Total Questions) * 100`.
- **Completion Logic:**
    - **MVP:** Completion = Submission (Participation grade).
    - **Future:** Completion = Score > 80%.
- **Storage:** Save results to `user_assessment_attempts` table.
    - `user_id`
    - `clip_id`
    - `score`
    - `responses` (JSON blob of what they picked).

## 4. AI Integration (The Creator Workflow)

**[CONSTRAINT: FLEXIBLE]**
This module consumes the output from the "Auto-Generate Quiz" feature in Course Creation.

- **Workflow:**
    1. Admin clicks "Auto-Generate" on a Video Clip.
    2. Gemini generates the JSON structure for 5 questions.
    3. System creates a *new* Clip (Type: Assessment) immediately following the Video Clip and populates it with the JSON.