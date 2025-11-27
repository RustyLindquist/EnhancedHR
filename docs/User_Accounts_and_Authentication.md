# User_Accounts_and_Authentication

## Primary Objective

Users can successfully create accounts, log in, and modify their login process. The system must handle the complex relationship between "Who you are" (Account) and "Who pays for you" (Membership), allowing seamless transitions between Organizational and Individual billing.

## 1. Authentication & Security

**[CONSTRAINT: STRICT]**

- **Provider:** Supabase Auth.
- **Methods:** Email/Password + Google OAuth (Social).
- **Transactional Email:** Use **Resend** for all system emails (Welcome, Password Reset, Invites).
- **Security:**
    - Encrypt passwords at rest (Supabase handles this).
    - Protect API endpoints using Session Tokens/JWT.
    - Enforce HTTPS/TLS for all traffic.

## 2. Core Concepts: Account vs. Membership

**[CONSTRAINT: STRICT]**
The AI must treat "Account" and "Membership" as distinct entities.

### A. The Account (Identity)

- **Definition:** The basic login credentials and profile data.
- **Persistence:** An account belongs to the *user*, not the organization. If a user leaves a company, they keep their account (and learning history), but lose their *Membership*.
- **Required Data:** Username, First Name, Last Name, Email, Password (hashed).

### B. The Membership (Access & Billing)

- **Definition:** The layer that dictates *who pays* and *what features* are active.
- **Types:**
    1. **Individual Membership:** User pays directly ($30/mo).
    2. **Employee Membership:** Organization pays (via Stripe Per-Seat).
    3. **Trial Membership:** Free, limited access (See Section 4).
    4. **Org Admin Membership:** Employee Membership + Admin capabilities.
- **Statuses:**
    - **Active:** Payment is current (or Organization is active).
    - **Inactive:** Payment failed, or User was removed from Organization and hasn't self-paid yet.
    - **Trial:** Currently in the free trial window.

## 3. Organizational Accounts

- **Definition:** The parent entity that owns a Stripe Subscription.
- **Capabilities:**
    - Add/Pause/Remove Employee Memberships.
    - Designate other users as Admins.
    - Manage Billing (Stripe Customer Portal).

## 4. Trial Logic (Global Usage Meter)

**[CONSTRAINT: STRICT]**

- **Definition:** A "Trial" is a global usage cap applied to accounts without a paid membership.
- **Limit:** **60 Minutes** of Total Active Time (Watch Time + AI Interaction).
- **Tracking:** Store `trial_minutes_used` in the `profiles` table.
- **Behavior:**
    - User has full feature access until `trial_minutes_used >= 60`.
    - **Lockout:** Once limit is reached, user is redirected to the "Purchase Membership" page on future clicks. They can navigate the UI but cannot watch video or query AI.

## 5. Organizational Invites (The Join URL)

**[CONSTRAINT: STRICT]**
Each Organization has a unique, secure Join URL to onboard employees.

### URL Structure

`https://enhancedhr.ai/join/[company-slug]/[secure-hash]`

- **Company Slug:** Readable ID (e.g., `acme-corp`).
- **Secure Hash:** Alphanumeric string customizable by the Admin to prevent unauthorized access (e.g., if the link leaks, they can regenerate the hash).

### The User Flow

When a user clicks the Join URL, they see a branded "Join [Company]" page with two paths:

**Path A: New User (Create Account)**

1. User fills out Signup Form (Name, Email, Password).
2. Account is created.
3. **Action:** System automatically assigns **Employee Membership** linked to that Org.
4. **Billing:** Stripe Subscription quantity increments (+1).

**Path B: Existing User (Connect Account)**

1. User logs in with existing credentials.
2. **Prompt:** "Do you want to connect your personal account to [Company]?"
    - *Context:* Explains that the company will pay for access, but may see usage data.
3. **Action:**
    - If "Yes": User's billing switches to "Employee Membership."
    - If "No": User remains on their own billing (Individual Membership) and is **not** added to the Org.

## 6. Offboarding: Removing an Employee

**[CONSTRAINT: STRICT]**
When an Org Admin removes a user:

1. **Detach:** Remove `org_id` from the user's profile.
2. **Billing Update:** Stripe Subscription quantity decrements (-1).
3. **Status Change:** User's Membership status changes to **Inactive** (unless they have a valid personal payment method on file).
4. **Notification:** Trigger (Resend) email: "Your access via [Company] has ended. Log in to update your billing."
5. **User Experience:** Next time the user logs in, they see a "Membership Required" prompt to purchase an Individual Membership or start a Trial (if eligible).