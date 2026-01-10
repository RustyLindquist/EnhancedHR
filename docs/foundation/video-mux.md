# Video & Mux — Foundation Doc

## Overview

This document covers the cross-cutting concerns of video playback and streaming in EnhancedHR.ai, including Mux integration, watch-time tracking, and video security.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VIDEO SYSTEM                              │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Mux        │   │  Playback   │   │  Watch-Time │       │
│  │  Player     │   │  Tracking   │   │  Recording  │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐       │
│  │  Signed     │   │  Quality    │   │  Progress   │       │
│  │  URLs       │   │  Selection  │   │  Sync       │       │
│  └─────────────┘   └─────────────┘   └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
              │
              ▼
        ┌──────────┐
        │  Mux     │
        │   CDN    │
        └──────────┘
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
2. Server creates Mux upload URL
3. Video uploaded directly to Mux
4. Mux processes and creates playback IDs
5. Store playback ID in database

### Playback Flow

1. User requests video
2. Server verifies entitlement
3. Generate signed playback URL
4. Return URL to client
5. Mux Player renders video

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

- [ ] Video playback works
- [ ] Signed URLs expire correctly
- [ ] Progress saves and resumes
- [ ] Completion triggers correctly
- [ ] Unauthorized users cannot access videos
- [ ] Analytics data is accurate

## Related Docs

- `docs/features/course-player-and-progress.md` — Feature-level documentation
- `docs/features/certificates.md` — Certificate requirements
- `docs/foundation/auth-roles-rls.md` — Permission model
