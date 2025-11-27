# Certification_Support

## Primary Objective

To accurately calculate, award, and track SHRM and HRCI credits based on precise user activity. This system must be audit-proof.

## 1. Credit Definitions & Types

**[CONSTRAINT: STRICT DATA]**
The system must support the following specific credit taxonomies:

### SHRM (Society for Human Resource Management)

- **Unit:** PDCs (Professional Development Credits).
- **Types:** Standard PDC.

### HRCI (HR Certification Institute)

- **Unit:** Credits (Hours).
- **Types:**
    - General
    - Business
    - Global
    - Ethics
- **Logic:** A single course can offer multiple types (e.g., "1.0 General" OR "1.0 Business"), but usually, a specific designation is assigned by the Admin.

## 2. The Calculation Engine (The Math)

**[CONSTRAINT: STRICT LOGIC]**
Credits are calculated based on **Total Instructional Time** (derived from `user_course_progress` / Mux logs).

### Rule A: Aggregation

- **Logic:** Before calculating, sum all **unique** view segments for the course.
    - *Example:* Session A (15 mins) + Session B (35 mins) = **50 Total Minutes**.

### Rule B: SHRM Calculation

- **Conversion:** 60 Minutes = 1 PDC.
- **Rounding:** Round **DOWN** to the nearest **0.25 PDC**.
    - *Scenario:* 50 Minutes = 0.83 Hours -> **0.75 PDC**.

### Rule C: HRCI Calculation

- **Threshold:** If Total Time < **45 Minutes**, Award **0 Credits**.
- **Rounding:** Round **DOWN** to the nearest **0.25 Hour** (Quarter-hour).
    - *Scenario:* 50 Minutes -> **0.75 Credits**.
    - *Scenario:* 44 Minutes -> **0.00 Credits**.

## 3. Credit Tracking (The Ledger)

**[CONSTRAINT: STRICT SCHEMA]**
We do not just store "Total Credits." We must store a transaction log for auditing.

### Table: `user_credits_ledger`

- `id`: UUID.
- `user_id`: FK to profiles.
- `course_id`: FK to courses.
- `credit_type`: Enum (SHRM, HRCI_General, HRCI_Business, etc.).
- `amount_awarded`: Decimal (The result of the calculation).
- `minutes_recorded`: Integer (The raw time basis used for the calculation).
- `awarded_at`: Timestamp.

## 4. User Visibility (Dashboard & Progress)

**[CONSTRAINT: FLEXIBLE UI]**

- **Course Level:**
    - Display "Potential Credits" on the Course Home.
    - Display "Earned Credits" (if any) upon completion.
- **User Profile Level:**
    - Display "Total PDCs Earned" vs "Recertification Goal" (if user sets one).
    - *Visual:* Progress bars for SHRM and HRCI cycles.

## 5. Audit & Verification

- **Constraint:** The `minutes_recorded` field in the ledger is the "Source of Truth" for any audit. It must match the sum of the Mux viewing sessions for that user/course.