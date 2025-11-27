# Commercialization

# Commercialization

## Primary Objective

Organizations and individuals can successfully purchase memberships with automatic, recurring monthly billing. The system uses Stripe for all payment processing and manages complex "Per-Seat" billing logic for organizations.

## 1. Tech Stack & Implementation

**[CONSTRAINT: STRICT]**

- **Provider:** Stripe.
- **Implementation Pattern:** Leverage the **Supabase Stripe Starter** architecture (using Supabase Edge Functions for webhooks).
- **Customer Portal:** Use Stripe's native Customer Portal for users to manage their own billing details (update card, cancel subscription).

## 2. Membership Pricing Models

### A. Individual Memberships

- **Price:** $30/month (Recurring).
- **Billing Logic:** Simple recurring subscription. Charged immediately upon signup.

### B. Organizational Memberships (Per-Seat)

- **Price:** $30/month per active seat.
- **The "Admin Seat" Rule:** The Organizational Account itself counts as **1 Active Seat**.
    - *Example:* An Admin invites 10 employees. Total billed quantity = **11 seats** (1 Admin + 10 Employees).
- **Billing Date:** Anchored to the date the Org Account was created.

## 3. Proration & Seat Management Logic

**[CONSTRAINT: STRICT]**
We rely on Stripe's native proration behavior to handle the "Day-by-Day" billing requirement. We do **not** build a custom ledger for this.

### Adding a User (Employee)

1. Org Admin invites a user via email (or Join URL).
2. User accepts/joins.
3. **System Action:** API call to Stripe to **increment** subscription quantity (`+1`).
4. **Result:** Stripe calculates the pro-rated cost for the remainder of the billing cycle and adds it to the next invoice (or charges immediately, depending on Stripe config).

### Removing a User (Employee)

1. Org Admin removes a user from the dashboard.
2. **System Action:** API call to Stripe to **decrement** subscription quantity (`1`).
3. **Result:** Stripe issues a pro-rated credit to the Org's account balance for unused days.

## 4. Author Compensation Reporting

**[CONSTRAINT: STRICT]**
For the MVP, payouts are manual. The system must generate a report to tell the Admin how much to write checks for.

### The "End-of-Month" Payout Report

A Super Admin must be able to generate a report (CSV) containing:

1. **Author Name**
2. **Total Minutes Watched:** Sum of all user watch-time on their courses (derived from Mux logs).
3. **Total AI Attribution Count:** Number of times their content was used in RAG responses.
4. **Calculated Payout:** (Total Minutes * $Rate) + (AI Count * $Rate).

## 5. Trial Logic (Global Usage Meter)

**[CONSTRAINT: STRICT]**

- **Definition:** A "Trial" is a global usage cap applied to accounts without a paid membership.
- **Limit:** **60 Minutes** of Total Active Time (Watch Time + AI Interaction).
- **Tracking:** Store `trial_minutes_used` in the `profiles` table.
- **Lockout:** When `trial_minutes_used >= 60`, redirect user to the "Purchase Membership" page.