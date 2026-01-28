---
id: video-card-smart-deletion
owner: platform-engineering
status: active
stability: stable
last_updated: 2026-01-28
surfaces:
  routes:
    - /dashboard (User collections)
    - /author/resources (Expert resources)
    - /org/collections (Org collections)
data:
  tables:
    - public.user_context_items (type='VIDEO')
backend:
  actions:
    - src/app/actions/videoResources.ts (deleteVideoResource, deleteExpertVideoResource)
    - src/app/actions/orgVideoResources.ts (deleteOrgVideoResource)
external:
  - Mux Video API
invariants:
  - Mux asset MUST NOT be deleted if other video cards reference it
  - Mux asset MUST be deleted when last video card is deleted
  - If unable to check references, assume asset is used elsewhere (safe default)
  - Deletion continues even if Mux API fails (non-blocking)
---

# Smart Video Card Deletion

## Overview

Video cards can be saved to multiple collections while sharing the same Mux asset. When a video card is deleted, the system checks if other cards reference the same Mux asset before deleting it. This prevents orphaned assets while allowing video sharing across collections.

## Problem

Without smart deletion:
- User saves video to Collection A (creates Mux asset)
- User saves same video to Collection B (references same Mux asset)
- User deletes video from Collection A
- Mux asset is deleted
- Video in Collection B is now broken (orphaned reference)

## Solution

The `isMuxAssetUsedElsewhere()` helper function checks for other references before deletion:

```typescript
async function isMuxAssetUsedElsewhere(muxAssetId: string, currentRecordId: string): Promise<boolean> {
    const admin = createAdminClient();

    // Check user_context_items for other records with the same muxAssetId
    const { data, error } = await admin
        .from('user_context_items')
        .select('id')
        .eq('type', 'VIDEO')
        .neq('id', currentRecordId)
        .contains('content', { muxAssetId });

    if (error) {
        console.error('[isMuxAssetUsedElsewhere] Error checking:', error);
        // If we can't check, assume it's used elsewhere (safe default)
        return true;
    }

    return data && data.length > 0;
}
```

## Implementation

### User Personal Videos (`/src/app/actions/videoResources.ts`)

```typescript
export async function deleteVideoResource(id: string): Promise<{ success: boolean; error?: string }> {
    // 1. Get record to find Mux asset ID
    const { data: resource } = await supabase
        .from('user_context_items')
        .select('content')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    // 2. Clean up embeddings
    await deleteContextEmbeddings(id);

    // 3. Delete Mux asset only if not used elsewhere
    const muxAssetId = resource.content?.muxAssetId;
    if (muxAssetId) {
        const isUsedElsewhere = await isMuxAssetUsedElsewhere(muxAssetId, id);

        if (isUsedElsewhere) {
            console.log('[deleteVideoResource] Mux asset used by other cards, skipping deletion');
        } else {
            await deleteMuxAsset(muxAssetId);
        }
    }

    // 4. Delete database record
    await supabase.from('user_context_items').delete().eq('id', id);
}
```

### Expert Platform Videos (`/src/app/actions/videoResources.ts`)

Same pattern in `deleteExpertVideoResource()`.

### Organization Videos (`/src/app/actions/orgVideoResources.ts`)

Same pattern in `deleteOrgVideoResource()`.

## Mux Asset Storage

Video cards store Mux identifiers in the `content` JSONB column:

```typescript
interface VideoContent {
    muxAssetId?: string;      // Mux asset ID (used for API calls)
    muxPlaybackId?: string;   // Mux playback ID (used in URLs)
    muxUploadId?: string;     // Temporary, cleared after processing
    status: 'uploading' | 'processing' | 'ready' | 'error';
    duration?: number;
    // ... other fields
}
```

## Decision Flow

```
deleteVideoResource(id)
         |
         v
   Get resource content
         |
         v
   Has muxAssetId? ---No---> Skip Mux deletion
         |
        Yes
         |
         v
   isMuxAssetUsedElsewhere(muxAssetId, id)?
         |
        Yes ---------> Log "skipping deletion"
         |                    |
        No                    |
         |                    |
         v                    |
   deleteMuxAsset(muxAssetId) |
         |                    |
         v <------------------+
   Delete database record
```

## Error Handling

### Query Error

```typescript
if (error) {
    console.error('[isMuxAssetUsedElsewhere] Error:', error);
    // Safe default: assume it's used elsewhere
    return true;
}
```

### Mux Deletion Error

```typescript
if (!deleted) {
    console.warn('[deleteVideoResource] Failed to delete Mux asset');
    // Continue with DB deletion even if Mux fails
}
```

## Example Scenarios

### Scenario 1: Unique Video Card

1. User creates video card A in Collection 1
2. Video card A has muxAssetId: "abc123"
3. User deletes video card A
4. `isMuxAssetUsedElsewhere("abc123", "A")` returns `false`
5. Mux asset "abc123" is deleted
6. Database record is deleted

### Scenario 2: Shared Video Across Collections

1. User creates video card A in Collection 1 (muxAssetId: "abc123")
2. User creates video card B in Collection 2 (muxAssetId: "abc123" - same video)
3. User deletes video card A
4. `isMuxAssetUsedElsewhere("abc123", "A")` returns `true` (card B exists)
5. Mux asset is NOT deleted
6. Database record for card A is deleted
7. Card B continues working

### Scenario 3: Last Card Deleted

Continuing from Scenario 2:
1. User deletes video card B
2. `isMuxAssetUsedElsewhere("abc123", "B")` returns `false` (card A already deleted)
3. Mux asset "abc123" is deleted
4. Database record for card B is deleted

## Testing Checklist

- [ ] Create video card, delete it, verify Mux asset deleted
- [ ] Create video card A, duplicate to collection B, delete A, verify Mux asset NOT deleted
- [ ] Delete last remaining reference, verify Mux asset IS deleted
- [ ] Test with Mux API error; verify database deletion continues
- [ ] Test with query error; verify safe default (no Mux deletion)

## Related Docs

- `docs/features/mux-video-cleanup.md` - Course/module/lesson deletion
- `docs/features/video-transcript-generation.md` - Video processing
