# Data Access and Server Actions Architecture

**Last Updated:** December 17, 2025
**Context:** EnhancedHR.ai Data Layer

## Overview
EnhancedHR uses a hybrid data access approach. While public or simple authenticated reads can be performed via the client-side Supabase client, complex user-specific data operations—especially those involving **Collections**, **Conversations**, and **Course Progress**—are rigorously handled via **Next.js Server Actions**.

## The Security & Reliability Pattern
To address Row Level Security (RLS) policies that may be overly restrictive or complex for complex join queries on the client side, we use the following pattern:

1.  **Server Actions:** All critical data fetching and mutating operations are encapsulated in actions residing in `src/app/actions/`.
2.  **Admin Client Bypass:** These actions verify the `user` session utilizing the standard auth client (`createClient`), but perform the actual database operations using the **Service Role Admin Client** (`createAdminClient`).
    *   *Why?* This ensures that legitimate user requests (like "Show my collections") return complete data (e.g., proper counts, joined images) without being silently filtered by strict RLS rules on joined tables (like `lessons` or `courses` the user might not technically "own" but has access to view).
3.  **Strict User Ownership Checks:** Since we bypass RLS, we **MANUALLY** verify ownership within the action.
    *   Example: Before returning collection items, we check `user_collections.user_id === session.user.id`.

## Key Implementations

### Collections (`src/app/actions/collections.ts`)
*   **Purpose:** Manages "My Collections" (Favorites, Workspace, Custom).
*   **Key Actions:**
    *   `addToCollectionAction(itemId, type, collectionId)`: Uses Admin Client to reliably lookup "Parent Course" for Modules/Lessons to ensure `course_id` is saved.
    *   `syncCourseCollectionsAction`: Bulk syncs course saves.

### Conversations (`src/app/actions/conversations.ts`)
*   **Purpose:** Fetches user-AI conversations.
*   **Key Actions:**
    *   `fetchConversationsAction()`: Fetches all conversations for the user. Bypasses RLS to ensure the "Navigation Count" matches the "Card Display List".

### Courses & Context (`src/app/actions/context.ts`)
*   **Purpose:** Hydrates the details of items inside a collection.
*   **Key Actions:**
    *   `getCollectionDetailsAction(collectionId)`: Fetches items + securely joins `courses` table to provide images and titles for stored Modules/Lessons.

## Usage Guide
When building new data-intensive User UI features:
1.  **Do NOT** use `supabase.from('table').select(...)` directly in the Component (`useEffect`).
2.  **DO** create a Server Action in `src/app/actions/`.
3.  **DO** accept necessary IDs as arguments.
4.  **DO** use `createClient()` to get the current User. `if (!user) throw Error`.
5.  **DO** use `createAdminClient()` to fetch/write data if RLS is preventing joins or specific lookups.
6.  **DO** return plain objects (serialized) to the client.

## Code Example
```typescript
'use server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function secureFetchDataAction() {
    const supabase = await createClient(); // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const admin = createAdminClient(); // 2. Privileged Access
    
    // 3. Safe Query (Manually scoped to user)
    const { data } = await admin
        .from('sensitive_data')
        .select('*')
        .eq('user_id', user.id); // <--- CRITICAL OWNERSHIP CHECK

    return data;
}
```
