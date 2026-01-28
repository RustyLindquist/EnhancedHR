---
id: mux-video-cleanup
owner: platform-engineering
status: active
stability: stable
last_updated: 2026-01-28
surfaces:
  routes:
    - /admin/courses/:id/builder
    - /author/courses/:id/builder
    - /admin/courses
data:
  tables:
    - public.lessons (video_url)
    - public.modules
    - public.courses
backend:
  actions:
    - src/app/actions/course-builder.ts (deleteLesson, deleteModule, deleteCourse)
    - src/app/actions/expert-course-builder.ts (deleteExpertLesson, deleteExpertModule)
    - src/app/actions/mux.ts (deleteMuxAssetByPlaybackId)
external:
  - Mux Video API (asset deletion)
invariants:
  - Mux assets MUST be deleted when lessons are deleted
  - Module deletion MUST delete all lesson Mux assets before cascade
  - Course deletion MUST delete all Mux assets before database cascade
  - Deletion continues even if Mux API fails (non-blocking)
  - Only Mux playback IDs trigger deletion (not YouTube URLs)
---

# Mux Video Cleanup on Deletion

## Overview

When lessons, modules, or courses are deleted, associated Mux video assets must also be deleted to prevent orphaned files and unnecessary storage costs. This system ensures Mux assets are cleaned up at all deletion levels.

## Mux ID Detection

Videos are stored as URLs or playback IDs in the `video_url` column. Only Mux playback IDs trigger cleanup:

```typescript
// Mux playback ID pattern: alphanumeric, 10+ characters, no dots
const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(videoUrl) && !videoUrl.includes('.');
```

Examples:
- `mZlTTq7LxgC01mTYM00kXhL7JoRW00U5Jh` - Mux playback ID (cleanup triggered)
- `https://youtube.com/watch?v=abc` - YouTube URL (no cleanup)
- `https://vimeo.com/123456` - Vimeo URL (no cleanup)

## Deletion Functions

### Lesson Deletion

**Admin Console:** `/src/app/actions/course-builder.ts`

```typescript
export async function deleteLesson(lessonId: string) {
    const admin = await createAdminClient();

    // 1. Fetch lesson to get video URL
    const { data: lesson } = await admin
        .from('lessons')
        .select('module_id, video_url, modules(course_id)')
        .eq('id', lessonId)
        .single();

    // 2. Delete Mux video if it's a Mux playback ID
    if (lesson?.video_url) {
        const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(lesson.video_url) && !lesson.video_url.includes('.');
        if (isMuxId) {
            const muxResult = await deleteMuxAssetByPlaybackId(lesson.video_url);
            if (!muxResult.success) {
                console.error(`[deleteLesson] Failed to delete Mux video: ${muxResult.error}`);
                // Continue with deletion even if Mux fails
            }
        }
    }

    // 3. Delete lesson record
    await admin.from('lessons').delete().eq('id', lessonId);
}
```

**Expert Console:** `/src/app/actions/expert-course-builder.ts`

Same pattern in `deleteExpertLesson()`.

### Module Deletion

**Admin Console:** `/src/app/actions/course-builder.ts`

```typescript
export async function deleteModule(moduleId: string) {
    const admin = await createAdminClient();

    // 1. Fetch module for course_id
    const { data: module } = await admin
        .from('modules')
        .select('course_id')
        .eq('id', moduleId)
        .single();

    // 2. Fetch all lessons with video URLs
    const { data: lessons } = await admin
        .from('lessons')
        .select('id, video_url')
        .eq('module_id', moduleId);

    // 3. Delete Mux videos for all lessons
    if (lessons?.length) {
        for (const lesson of lessons) {
            if (lesson.video_url) {
                const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(lesson.video_url) && !lesson.video_url.includes('.');
                if (isMuxId) {
                    await deleteMuxAssetByPlaybackId(lesson.video_url);
                }
            }
        }
    }

    // 4. Delete lessons then module
    await admin.from('lessons').delete().eq('module_id', moduleId);
    await admin.from('modules').delete().eq('id', moduleId);
}
```

**Expert Console:** `/src/app/actions/expert-course-builder.ts`

Same pattern in `deleteExpertModule()`.

### Course Deletion

**Admin Console:** `/src/app/actions/course-builder.ts`

```typescript
export async function deleteCourse(courseId: string) {
    const admin = await createAdminClient();

    // 1. Fetch all modules for this course
    const { data: modules } = await admin
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

    // 2. Fetch all lessons in those modules
    if (modules?.length) {
        const moduleIds = modules.map(m => m.id);
        const { data: lessons } = await admin
            .from('lessons')
            .select('id, video_url')
            .in('module_id', moduleIds);

        // 3. Delete Mux videos for all lessons
        if (lessons?.length) {
            for (const lesson of lessons) {
                if (lesson.video_url) {
                    const isMuxId = /^[a-zA-Z0-9]{10,}$/.test(lesson.video_url) && !lesson.video_url.includes('.');
                    if (isMuxId) {
                        await deleteMuxAssetByPlaybackId(lesson.video_url);
                    }
                }
            }
        }
    }

    // 4. Delete course (cascades to modules, lessons)
    await admin.from('courses').delete().eq('id', courseId);
}
```

## Helper Function

### `deleteMuxAssetByPlaybackId()` (`/src/app/actions/mux.ts`)

```typescript
export async function deleteMuxAssetByPlaybackId(playbackId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        // 1. Look up asset ID from playback ID
        const assetId = await getAssetIdFromPlaybackId(playbackId);

        if (!assetId) {
            // Asset doesn't exist (may already be deleted)
            return { success: true };
        }

        // 2. Delete the asset
        const deleted = await deleteMuxAsset(assetId);

        if (deleted) {
            return { success: true };
        } else {
            return { success: false, error: 'Failed to delete Mux asset' };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
```

### `getAssetIdFromPlaybackId()` (`/src/app/actions/mux.ts`)

```typescript
export async function getAssetIdFromPlaybackId(playbackId: string): Promise<string | null> {
    // List recent assets and find matching playback ID
    const assetsPage = await mux.video.assets.list({ limit: 100 });

    for await (const asset of assetsPage) {
        if (asset.playback_ids?.some(p => p.id === playbackId)) {
            return asset.id;
        }
    }

    return null;
}
```

## Error Handling

Mux deletion failures are logged but don't block database deletion:

```typescript
const muxResult = await deleteMuxAssetByPlaybackId(videoUrl);
if (!muxResult.success) {
    console.error(`[deleteLesson] Failed to delete Mux video: ${muxResult.error}`);
    // Continue with DB deletion even if Mux deletion fails
}
```

This ensures:
- Database consistency is maintained
- Users aren't blocked by Mux API issues
- Orphaned assets can be cleaned up later

## Testing Checklist

- [ ] Delete lesson with Mux video; verify asset removed from Mux dashboard
- [ ] Delete lesson with YouTube URL; verify no Mux API call
- [ ] Delete module with multiple video lessons; verify all Mux assets removed
- [ ] Delete course; verify all Mux assets removed before cascade
- [ ] Test with failed Mux API; verify deletion continues

## Related Docs

- `docs/features/video-card-smart-deletion.md` - Smart deletion for video cards
- `docs/features/video-transcript-generation.md` - Transcript pipeline
