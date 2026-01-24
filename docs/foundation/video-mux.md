# Video & Mux — Foundation Doc

## Overview

This document covers the cross-cutting concerns of video playback and streaming in EnhancedHR.ai, including Mux integration, external video URL support (YouTube, Vimeo, Wistia), watch-time tracking, and video security.

## Video Source Types

EnhancedHR supports two types of video sources:

### 1. Mux-Hosted Videos (Upload)
- Videos uploaded directly via MuxUploader
- Full playback control via MuxPlayer
- Watch-time tracking and analytics
- Secure signed URLs

### 2. External URL Videos
- YouTube, Vimeo, Wistia, and other platforms
- Embedded via iframe
- Automatic platform detection
- Thumbnail extraction for YouTube videos

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VIDEO SYSTEM                                   │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      VideoPanel Component                          │  │
│  │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐            │  │
│  │   │  Edit Mode  │   │  View Mode  │   │  Source     │            │  │
│  │   │  (Create)   │   │  (Playback) │   │  Selector   │            │  │
│  │   └─────────────┘   └─────────────┘   └─────────────┘            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│         ┌────────────────────┼────────────────────┐                     │
│         ▼                    ▼                    ▼                     │
│  ┌─────────────┐   ┌─────────────────────┐  ┌─────────────────────┐    │
│  │ MuxUploader │   │     MuxPlayer       │  │   Iframe Embed      │    │
│  │   (Upload)  │   │  (Mux-hosted)       │  │ (YouTube/Vimeo/etc) │    │
│  └─────────────┘   └─────────────────────┘  └─────────────────────┘    │
│         │                    │                         │                │
│         ▼                    ▼                         ▼                │
│  ┌─────────────┐   ┌─────────────────────┐  ┌─────────────────────┐    │
│  │  Mux CDN   │   │  Watch-Time Tracking │  │  External Platform  │    │
│  └─────────────┘   └─────────────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Security Invariants

1. **Signed URLs**: Use signed playback URLs (expire after short period)
2. **Entitlement Check**: Verify user has access before generating URL
3. **Watch-Time Validation**: Server validates reported watch time
4. **No Client Secrets**: Never expose Mux API keys client-side
5. **Rate Limiting**: Limit URL generation to prevent abuse

## Mux Integration

### Video Upload

1. Admin uploads video via dashboard
2. Server creates Mux upload URL via `createVideoResource()`
3. Video uploaded directly to Mux via MuxUploader component
4. Mux processes and creates playback IDs
5. `finalizeVideoUpload()` stores playback ID in database

### Playback Flow (Mux-Hosted)

1. User requests video
2. Server verifies entitlement
3. Generate signed playback URL
4. Return URL to client
5. MuxPlayer renders video

### Signed URL Generation

```typescript
// Server-side only
function getSignedUrl(playbackId: string, expiresIn: number = 3600) {
  const token = signPlaybackId(playbackId, {
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  });
  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}
```

## External Video URL Support

### Supported Platforms

| Platform | URL Patterns | Thumbnail Support | Embed URL |
|----------|-------------|-------------------|-----------|
| YouTube | `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`, `youtube.com/embed/` | Yes (via `img.youtube.com`) | `youtube.com/embed/{id}?autoplay=0&rel=0` |
| Vimeo | `vimeo.com/{id}` | No (requires API) | `player.vimeo.com/video/{id}` |
| Wistia | `wistia.com/*`, `fast.wistia.net/*` | No | N/A (fallback to URL) |
| Other | Any valid HTTP(S) URL | No | No embed |

### URL Processing Functions

Located in `src/components/VideoPanel.tsx` and `src/components/cards/UniversalCard.tsx`:

```typescript
// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    // ...
}

// Extract Vimeo video ID
function extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

// Detect video platform from URL
function detectVideoPlatform(url: string): string {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('wistia.com') || url.includes('fast.wistia.net')) return 'wistia';
    return 'other';
}

// Get embed URL for external video
function getEmbedUrl(url: string, platform: string): string | null {
    if (platform === 'youtube') {
        const videoId = extractYouTubeId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : null;
    }
    if (platform === 'vimeo') {
        const videoId = extractVimeoId(url);
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
}
```

### Thumbnail Extraction

YouTube thumbnails are fetched using the public thumbnail API:

```typescript
function getVideoThumbnailUrl(url: string): string | null {
    const youtubeId = extractYouTubeId(url);
    if (youtubeId) {
        return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
    return null;
}
```

### Playback Flow (External URL)

1. User clicks video card or opens VideoPanel
2. Platform detected from `externalPlatform` field
3. Embed URL constructed via `getEmbedUrl()`
4. Iframe rendered with appropriate embed URL
5. External platform handles playback

### Data Model for External Videos

External URL videos store their data in `user_context_items.content`:

```typescript
interface VideoContent {
    // For Mux-hosted videos
    muxAssetId?: string;
    muxPlaybackId?: string;
    muxUploadId?: string;

    // For external URL videos
    externalUrl?: string;           // Full URL (e.g., https://youtube.com/watch?v=...)
    externalPlatform?: string;      // 'youtube' | 'vimeo' | 'wistia' | 'other'

    // Common fields
    status?: 'uploading' | 'processing' | 'ready' | 'error';
    duration?: number;
    description?: string;
}
```

**Key distinction**: External URL videos have `status: 'ready'` immediately since they don't require processing.

## Watch-Time Tracking

### Tracking Events

| Event | Trigger | Data |
|-------|---------|------|
| `play` | Video starts | timestamp |
| `pause` | Video paused | position |
| `progress` | Every 30s | position, duration |
| `complete` | 90%+ watched | total time |
| `seek` | User seeks | from, to |

### Progress Recording

```typescript
// Client reports progress
{
  lesson_id: string,
  position: number,       // Current position in seconds
  duration: number,       // Total duration
  watched_segments: [],   // Segments watched (for skip detection)
}
```

### Validation

- Server validates reported positions are reasonable
- Detect skip patterns vs actual watching
- Prevent gaming of completion metrics

## Tables Involved

| Table | Purpose |
|-------|---------|
| `lessons` | Lesson metadata (playback_id) |
| `lesson_progress` | User progress per lesson |
| `course_progress` | Aggregate course progress |
| `watch_sessions` | Detailed watch analytics |
| `user_context_items` | VIDEO type items for Expert Resources and Collections |

### VIDEO Context Item Schema

Videos stored as context items use `type: 'VIDEO'` in `user_context_items`:

```
user_context_items (type = 'VIDEO')
├── id: uuid (PK)
├── user_id: uuid (creator)
├── collection_id: text (e.g., 'expert-resources' or collection UUID)
├── type: 'VIDEO'
├── title: text
├── content: jsonb (VideoContent schema below)
├── created_at: timestamp
└── updated_at: timestamp
```

### VideoContent Schema (with Transcript)

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

  // Transcript fields (for AI context integration)
  transcript?: string;
  transcriptStatus?: 'pending' | 'generating' | 'ready' | 'failed';
  transcriptError?: string;
  transcriptGeneratedAt?: string;
}
```

See `docs/features/video-ai-context.md` for transcript generation and embedding details.

## RLS Considerations

- Users see only their progress
- Progress updates require ownership
- Analytics visible to course owners
- Admin client for platform-wide analytics

## Completion Criteria

### Lesson Completion

- 90% of video watched
- OR all required segments watched
- Quiz passed (if applicable)

### Course Completion

- All required lessons completed
- Final assessment passed (if applicable)
- Minimum time requirement met (for accreditation)

## Quality & Bandwidth

### Adaptive Bitrate

Mux handles ABR automatically:
- Starts with appropriate quality for connection
- Adjusts based on bandwidth
- User can override in player

### Bandwidth Considerations

| Quality | Bandwidth | Resolution |
|---------|-----------|------------|
| Low | ~500 kbps | 360p |
| Medium | ~1.5 Mbps | 720p |
| High | ~4 Mbps | 1080p |

## Error Handling

| Error | Response |
|-------|----------|
| Playback failure | Retry, then show error |
| Progress save failed | Queue for retry |
| URL expired | Auto-refresh token |
| Rate limited | Backoff and retry |

## Analytics

### Tracked Metrics

- Average watch time
- Completion rate
- Drop-off points
- Seek patterns
- Quality changes

### Data Flow

```
Client Player → Progress Events → Server → Database
                                    ↓
                             Analytics aggregation
```

## Integration Points

| Feature | Integration |
|---------|-------------|
| Course Player | Primary video interface |
| Progress Tracking | Completion status |
| Certificates | Requires course completion |
| Analytics | Watch-time data |

## Testing Checklist

### Mux-Hosted Videos
- [ ] Video upload via MuxUploader works
- [ ] Processing status updates correctly (uploading → processing → ready)
- [ ] MuxPlayer renders after processing completes
- [ ] Signed URLs expire correctly
- [ ] Progress saves and resumes
- [ ] Completion triggers correctly
- [ ] Unauthorized users cannot access videos
- [ ] Analytics data is accurate

### External URL Videos
- [ ] YouTube URL recognized and platform detected
- [ ] YouTube thumbnail displays on VIDEO card
- [ ] YouTube video plays via iframe embed
- [ ] Vimeo URL recognized and platform detected
- [ ] Vimeo video plays via iframe embed
- [ ] Wistia URL recognized as platform
- [ ] Invalid URLs show appropriate error
- [ ] Save creates video immediately (no processing wait)
- [ ] View mode shows correctly after save

### VideoPanel Component
- [ ] Edit mode shows source selector for new videos
- [ ] Upload option prepares Mux upload correctly
- [ ] URL option validates and detects platform
- [ ] Save switches to view mode (not closes panel)
- [ ] Edit button appears for canEdit users
- [ ] Video title and description editable
- [ ] Status badge shows correct state

### VIDEO Card (UniversalCard)
- [ ] VIDEO card type renders with purple gradient
- [ ] Mux video shows thumbnail from playback ID
- [ ] YouTube video shows thumbnail from video ID
- [ ] Processing videos show spinner animation
- [ ] Error videos show error state
- [ ] Click opens VideoPanel in view mode

## Components & Files

| Component | Location | Purpose |
|-----------|----------|---------|
| VideoPanel | `src/components/VideoPanel.tsx` | View/edit video resources |
| UniversalCard (VIDEO type) | `src/components/cards/UniversalCard.tsx` | Display video cards in grids |
| UniversalCollectionCard | `src/components/UniversalCollectionCard.tsx` | Wrapper for collection views |
| videoResources actions | `src/app/actions/videoResources.ts` | Server actions for video CRUD |

## Invariants

- External URL videos are immediately `status: 'ready'` (no processing)
- Mux videos require upload → processing → ready workflow
- YouTube ID extraction supports watch, shorts, embed, and short URL formats
- Vimeo ID extraction supports standard vimeo.com/{id} format
- VideoPanel switches to view mode after save (does not close)
- VIDEO cards must pass `videoExternalUrl` prop for thumbnail extraction
- Platform detection is case-insensitive for domain matching

## Related Docs

- `docs/features/course-player-and-progress.md` — Feature-level documentation
- `docs/features/expert-resources.md` — Expert Resources feature (VIDEO card usage)
- `docs/features/collections-and-context.md` — Collection system (context item storage)
- `docs/features/video-ai-context.md` — Video AI context integration (transcripts, embeddings, RAG)
- `docs/foundation/auth-roles-rls.md` — Permission model
