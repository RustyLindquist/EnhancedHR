---
id: video-ai-context
owner: platform-engineering
status: active
stability: evolving
last_updated: 2026-01-24
surfaces:
  routes:
    - /dashboard?collection=:id (VIDEO cards in collections)
    - /org/collections/:id (VIDEO cards in org collections)
    - /experts/:id/resources (Expert Resources with VIDEO cards)
  collections:
    - personal (user personal collections)
    - org (org-scoped collections)
    - expert-resources (platform-wide expert resources)
data:
  tables:
    - public.user_context_items (type = 'VIDEO')
    - public.unified_embeddings (source_type = 'video')
  storage:
    - Mux CDN (for Mux-hosted videos)
    - External platforms (YouTube, Vimeo, Wistia)
backend:
  actions:
    - src/lib/video-transcript.ts
    - src/lib/youtube.ts
    - src/lib/context-embeddings.ts (embedVideoContext)
    - src/app/actions/videoResources.ts
    - src/app/actions/orgVideoResources.ts
    - src/app/actions/mux.ts
ai:
  context_scopes:
    - COLLECTION
    - PERSONAL_CONTEXT
    - PLATFORM
    - ORG_COURSES
  models:
    - google/gemini-2.0-flash-001 (for AI transcript generation)
tests:
  local:
    - Add a YouTube video to a collection; verify transcript generates and embedding rows appear in unified_embeddings.
    - Ask Collection Assistant about video content; verify response references video transcript.
  staging:
    - Create org video with YouTube URL; verify transcript and embeddings are org-scoped.
    - Upload Mux video; after processing completes, verify transcript generation and embeddings.
invariants:
  - Video operations (create, update, delete) must succeed even if transcript generation fails (fire-and-forget pattern).
  - YouTube videos must try YouTube API captions first before falling back to AI parsing.
  - Video embeddings use source_type='video' in unified_embeddings table.
  - Transcript status must be tracked in video content JSONB (pending|generating|ready|failed).
  - Embeddings must be deleted before video deletion to prevent orphaned rows.
---

## Overview

Video AI Context Integration enables video content items (VIDEO cards) to contribute to AI assistant context through RAG (Retrieval-Augmented Generation). When videos are added to collections, their context (Title + Description + Transcript) is embedded into the `unified_embeddings` table, allowing AI agents to draw from video content when answering questions.

This feature implements Object Oriented Context Engineering for videos, treating VIDEO cards as portable Context Objects that can participate in collection-scoped AI conversations.

## User Surfaces

- **Collection Views**: VIDEO cards display transcript status (pending/generating/ready/failed)
- **VideoPanel Component**: Shows transcript text when ready (collapsible, scrollable), with regeneration button on failure
- **Collection Assistant**: Can answer questions using embedded video context
- **Org Collections**: Same functionality for organization-scoped video content

## Architecture

```
Video Added to Collection
         |
         v
  Is YouTube URL? --Yes--> Fetch YouTube Captions (Innertube API)
         |                        |
         No                  Success?
         |                   |     |
         |                  Yes    No
         |                   |     |
         v                   |     v
  AI Multimodal Parsing <----+-----+
  (Gemini 2.0 Flash via OpenRouter)
         |
         v
  Update video.content with transcript
  (transcriptStatus = 'ready')
         |
         v
  Create embeddings in unified_embeddings
  (source_type = 'video')
         |
         v
  Video context now available to AI agents
```

### Key Design Decisions

1. **Fire-and-Forget Pattern**: Video CRUD operations succeed immediately; transcript generation runs asynchronously. If it fails, video still exists with `transcriptStatus: 'failed'` and user can retry.

2. **YouTube First Strategy**: For YouTube URLs, we first try to fetch existing captions via the Innertube API (free, fast). Only if unavailable, we fall back to AI multimodal parsing.

3. **Transcript Status Tracking**: The `content` JSONB field stores transcript state so UI can show progress and allow retries.

## Core Components

### 1. Video Transcript Service (`/src/lib/video-transcript.ts`)

Main orchestrator for transcript generation and embedding creation.

**Key Functions**:
- `processVideoForRAG(videoId, userId, options)` - Main entry point; generates transcript and creates embeddings
- `regenerateVideoTranscript(videoId, userId)` - Retry for failed transcripts; deletes old embeddings first

**Fire-and-Forget Usage**:
```typescript
// In video creation actions
processVideoForRAG(videoId, userId, { collectionId })
  .catch(err => console.error('Transcript generation failed:', err));
// Video operation continues regardless of transcript result
```

### 2. YouTube Integration (`/src/lib/youtube.ts`)

Fetches transcripts and metadata from YouTube videos.

**Key Functions**:
- `isYouTubeUrl(url)` - Detect YouTube URLs (youtube.com, youtu.be)
- `fetchYouTubeTranscript(videoIdOrUrl)` - Get captions via Innertube API
- `fetchYouTubeMetadata(videoIdOrUrl)` - Get video metadata via Data API v3

**Dependencies**:
- `youtube-transcript` package (uses Innertube API - no API key needed for transcripts)
- YouTube Data API v3 for metadata (requires API key)

### 3. Context Embeddings (`/src/lib/context-embeddings.ts`)

Extended with `embedVideoContext()` function.

**Embedding Format**:
```typescript
{
  user_id: userId,
  collection_id: collectionId || null,
  org_id: orgId || null,
  source_type: 'video',
  source_id: videoId,
  content: chunk,  // Chunked: "Video Title: ... Description: ... Transcript: ..."
  embedding: vector(768),
  metadata: {
    title: title,
    hasTranscript: true,
    transcriptLength: 1234,
    chunk_index: 0,
    total_chunks: 3,
    item_type: 'VIDEO'
  }
}
```

### 4. Video Resource Actions

**User Videos** (`/src/app/actions/videoResources.ts`):
- `createVideoResource` - Triggers transcript on external URL creation
- `finalizeVideoUpload` - Triggers transcript after Mux upload ready
- `updateVideoResource` - If URL changed, regenerates transcript
- `deleteVideoResource` - Cleans up embeddings first

**Org Videos** (`/src/app/actions/orgVideoResources.ts`):
- Same lifecycle hooks but for org-scoped collections
- Uses `orgId` parameter for embedding scoping

### 5. VideoPanel UI (`/src/components/VideoPanel.tsx`)

- Shows transcript status badge (pending/generating/ready/failed)
- Displays transcript text when ready (collapsible, max-height scrollable)
- "Regenerate Transcript" button on failure
- Fixed view mode transition after Mux upload completes

## Data Model

### Video Content in `user_context_items`

```typescript
interface VideoContent {
  // Source identification
  muxAssetId?: string;
  muxPlaybackId?: string;
  muxUploadId?: string;
  externalUrl?: string;
  externalPlatform?: 'youtube' | 'vimeo' | 'wistia' | 'other';

  // Common fields
  status?: 'uploading' | 'processing' | 'ready' | 'error';
  duration?: number;
  description?: string;

  // Transcript fields (NEW)
  transcript?: string;
  transcriptStatus?: 'pending' | 'generating' | 'ready' | 'failed';
  transcriptError?: string;
  transcriptGeneratedAt?: string;
}
```

### Database Migration

Migration `20260124100000_add_video_to_embeddings.sql` adds 'video' to `embedding_source_type` enum:

```sql
ALTER TYPE embedding_source_type ADD VALUE IF NOT EXISTS 'video';
```

## Permissions & Security

- **Transcript Generation**: Runs with admin client (bypasses RLS for embedding writes)
- **Embedding Reads**: Filtered by `match_unified_embeddings` based on scope (collection, org, user)
- **YouTube API**: Uses server-side API key; never exposed to client
- **AI Parsing**: Uses OpenRouter API key from environment

## Integration Points

### AI Context Engine

Video embeddings participate in RAG retrieval through the same `match_unified_embeddings` function used by other content types. When a collection includes VIDEO items:

1. `ContextResolver` includes collection's allowed item IDs
2. `match_unified_embeddings` returns video chunks matching query
3. Chat endpoints format video context into prompts

### Collection Feature

- VIDEO items in collections trigger transcript generation on add
- Collection Assistant can reference video content in responses
- Collection counts include videos via existing item counting logic

### Org Courses / Org Collections

- Org-scoped videos set `org_id` in embeddings
- RAG scope filtering respects org boundaries
- Org admins can create video resources for their organization

## Limitations

### Platform Support

| Platform | Transcript Support | Notes |
|----------|-------------------|-------|
| YouTube | Full | Innertube API for captions, Data API for metadata |
| Vimeo | AI Only | No public transcript API; uses AI multimodal parsing |
| Wistia | AI Only | Requires API key for any access; uses AI multimodal parsing |
| Mux | AI Only | Uses AI multimodal parsing on playback URL |
| Other | AI Only | Falls back to AI multimodal parsing |

### AI Transcript Limitations

- Requires video to be publicly accessible (or signed URL)
- Quality depends on audio clarity and language
- May not capture on-screen text or visual context
- Long videos may be truncated or summarized

## Failure Modes & Recovery

| Failure | Symptom | Recovery |
|---------|---------|----------|
| YouTube captions disabled | transcriptStatus: 'failed', error mentions captions | AI fallback should work; if not, check video accessibility |
| AI parsing timeout | transcriptStatus: 'failed' | Click "Regenerate Transcript" button |
| Embedding insertion failed | Transcript ready but no AI recall | Check unified_embeddings for video's source_id; re-run regenerate |
| Video deleted before transcript | Orphaned pending status | N/A - embeddings cleaned up on delete |
| YouTube API quota exceeded | Metadata fetch fails | Transcript still works via Innertube; metadata is optional |

## Testing Checklist

- [ ] Add YouTube video to personal collection; verify transcriptStatus goes pending -> generating -> ready
- [ ] Check unified_embeddings table has rows with source_type='video' and matching source_id
- [ ] Ask Collection Assistant about video topic; response should reference video content
- [ ] Add video with disabled captions; verify AI fallback triggers
- [ ] Click "Regenerate Transcript" on failed video; verify retry works
- [ ] Delete video; verify embeddings are cleaned up (no orphaned rows)
- [ ] Create org video; verify org_id is set in embeddings
- [ ] Upload Mux video; verify transcript generates after processing completes

## Change Guide

### Adding New Video Platform Support

1. Add platform detection in `src/lib/youtube.ts` (or create new platform module)
2. Implement transcript fetching if platform has API
3. Update `processVideoForRAG` in `video-transcript.ts` to check new platform
4. Update VideoPanel to show platform-specific UI if needed

### Modifying Transcript Format

1. Update `buildVideoContextForEmbedding` in `video-transcript.ts`
2. Update `embedVideoContext` in `context-embeddings.ts` if chunking changes
3. Consider migration to re-embed existing videos with new format

### Changing AI Model for Parsing

1. Update `generateTranscriptFromVideo` in course-builder actions
2. Test with various video types (long, quiet audio, multiple speakers)
3. Update cost estimates in any documentation

## Related Docs

- `docs/foundation/video-mux.md` - Video system foundation
- `docs/features/ai-context-engine.md` - AI context and RAG system
- `docs/features/collections-and-context.md` - Collection system
- `docs/features/expert-resources.md` - Expert resources (VIDEO card usage)
- `docs/PRD/Object Oriented Context Engineering.md` - Object-oriented context principles
- `supabase/migrations/20260124100000_add_video_to_embeddings.sql` - Database migration
