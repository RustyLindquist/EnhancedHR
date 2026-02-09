---
id: course-promotion
owner: platform-engineering
status: active
stability: temporary
last_updated: 2026-02-09
surfaces:
  routes:
    - /admin/courses (promotion button on course list)
  api:
    - /api/course-import/initiate (POST - start promotion)
    - /api/course-import/process-videos (POST - process lessons with transcripts)
    - /api/course-import/archive (POST - archive a course by setting status='archived')
    - /api/course-import/status (GET - check import status for a course)
    - /api/course-import/status/all (GET - check import status for all courses)
data:
  tables:
    - public.courses (source in staging)
    - public.modules (source in staging)
    - public.lessons (source in staging)
    - public.unified_embeddings (destination for transcripts)
backend:
  actions:
    - src/app/api/course-import/initiate/route.ts
    - src/app/api/course-import/process-videos/route.ts
    - src/components/admin/CoursePromotionModal.tsx
    - src/lib/youtube.ts (transcript extraction)
    - src/lib/video-transcript.ts (transcript processing)
ai:
  context_scopes:
    - PLATFORM
  models:
    - google/gemini-2.0-flash-001 (for AI transcript generation fallback)
invariants:
  - Course promotion must not overwrite existing courses in production
  - Transcript failures must not block course promotion
  - All promoted courses inherit production-specific settings (status, visibility)
---

## Overview

Course Promotion enables promoting courses from staging to production environment. This feature is designed for initial content migration and may be deprecated once all courses are migrated.

The promotion process:
1. Fetches course data (with modules and lessons) from staging
2. Creates corresponding records in production
3. Generates transcripts for video lessons using a multi-level fallback chain
4. Creates embeddings for AI assistant context

## Transcript Extraction Pipeline

When promoting courses, video lessons go through transcript extraction:

### Fallback Chain (Priority Order)

1. **Innertube API** (youtube-transcript library)
   - Free, fast
   - Works for most public YouTube videos with captions
   - No API key required

2. **Supadata API** (NEW)
   - Paid service with better success rate
   - Works for videos with restricted caption access
   - Requires `SUPADATA_API_KEY` environment variable

3. **Audio Extraction** (for YouTube)
   - Downloads audio track
   - Transcribes using AI
   - Works when caption APIs fail

4. **AI Multimodal** (Gemini)
   - Watches video directly
   - Most expensive but works on any video
   - Uses `OPENROUTER_API_KEY`

### Key Functions

**`fetchYouTubeTranscriptWithFallback(videoId)`** in `src/lib/youtube.ts`:
- Tries Innertube API first
- Falls back to Supadata API
- Returns `{ transcript, method }` or null

**`processVideoForRAG()`** in `src/lib/video-transcript.ts`:
- Orchestrates full transcript pipeline
- Handles YouTube-specific extraction
- Falls back to audio extraction for YouTube
- Uses AI multimodal as final fallback

## API Endpoints

### POST /api/course-import/initiate

Starts the promotion process. Fetches course structure from staging.

**Request**:
```json
{
  "courseId": 123
}
```

**Response**:
```json
{
  "success": true,
  "courseId": 456,
  "lessonsToProcess": 18
}
```

### POST /api/course-import/process-videos

Processes lessons with transcript extraction.

**Request**:
```json
{
  "courseId": 456,
  "lessons": [
    { "id": "lesson-1", "videoUrl": "https://youtube.com/watch?v=..." }
  ]
}
```

### POST /api/course-import/archive

Archives a course by setting its status to 'archived' (soft delete).

**Request**:
```json
{
  "courseId": 123,
  "secretKey": "..."
}
```

### GET /api/course-import/status

Returns import/transcript processing status for a single course.

**Query params**: `courseId`, `secretKey`

### GET /api/course-import/status/all

Returns import/transcript processing status for all courses.

**Query params**: `secretKey`

## Cross-Reference Tools

Scripts in `scripts/` for WordPress-to-EnhancedHR course integrity:

| Script | Purpose |
|--------|---------|
| `cross-reference-courses.ts` | Cross-reference WordPress and EnhancedHR courses using YouTube video IDs |
| `production-sync-mapping.ts` | Map local courses to production by normalized title |
| `archive-production-duplicates.ts` | Archive specific duplicate/orphan courses on production |
| `trigger-all-transcripts.ts` | Bulk trigger transcript generation for all production courses |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `COURSE_IMPORT_SECRET` | Yes | Shared secret for staging-to-production API auth |
| `PROD_APP_URL` | Yes | Production URL (https://enhancedhr.ai) |
| `SUPADATA_API_KEY` | Optional | Supadata API key for YouTube transcript fallback |
| `OPENROUTER_API_KEY` | Yes | For AI multimodal transcript generation |

## Temporary Configuration (Remove After Migration Complete)

These items were added for the course promotion feature and should be removed once all courses are migrated to production:

### Environment Variables (.env.local)
```
COURSE_IMPORT_SECRET=C0PDCTfcnxifnGD3iN67HuphkVVEQDOSIRpjyAPUbBI=
PROD_APP_URL=https://enhancedhr.ai
SUPADATA_API_KEY=  # Optional: Add your Supadata API key for better transcript success
```

### Files to Review for Removal
- `src/app/api/course-import/` - Course import API endpoints
- `src/components/admin/CoursePromotionModal.tsx` - Promotion UI
- Course promotion button in admin course list

### Cleanup Steps
1. Remove environment variables from .env.local
2. Remove corresponding variables from production environment
3. Consider keeping or removing the promotion feature based on ongoing needs
4. If removing, delete the API routes and modal component

## Usage

1. Navigate to Admin > Courses
2. Find the course to promote
3. Click "Promote" button
4. Modal shows progress as:
   - Course structure is copied
   - Each lesson's transcript is extracted
   - Embeddings are created

## Error Handling

- **Transcript extraction failure**: Logged but does not block promotion
- **API timeout**: Individual lessons can be retried
- **Network errors**: Full retry available via modal

## Related Docs

- `docs/features/video-ai-context.md` - Video transcript system
- `docs/workflows/database-course-building.md` - Alternative manual approach
